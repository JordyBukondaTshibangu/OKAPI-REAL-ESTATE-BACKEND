import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { BOOST_PLANS, generatePaymentReference } from "./boost.constants";
import { CreateBoostRequestDto, RejectBoostDto, UpdateScreenshotDto } from "./dto/create-boost-request.dto";

const PROPERTY_SELECT = {
  id: true, title: true, suburb: true, city: true, category: true,
  gallery: true, listingType: true, isBoosted: true, boostedUntil: true,
} as const;

const AGENT_SELECT = {
  id: true, name: true, email: true, phoneNumber: true, whatsappNumber: true,
} as const;

@Injectable()
export class BoostsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BoostsService.name);
  private boostTimer: NodeJS.Timeout | null = null;

  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  onModuleInit() {
    const now = new Date();
    const msToNextHour =
      (60 - now.getMinutes()) * 60_000 -
      now.getSeconds() * 1_000 -
      now.getMilliseconds();

    setTimeout(() => {
      void this.expireBoosts();
      this.boostTimer = setInterval(() => void this.expireBoosts(), 60 * 60_000);
    }, msToNextHour);
  }

  onModuleDestroy() {
    if (this.boostTimer) clearInterval(this.boostTimer);
  }

  // ── Agent: submit a boost request ────────────────────────────────────────────

  async createBoostRequest(agentId: string, propertyId: string, dto: CreateBoostRequestDto) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { ...PROPERTY_SELECT, agentId: true, status: true },
    });

    if (!property) throw new NotFoundException("Annonce introuvable");
    if (property.agentId !== agentId) throw new ForbiddenException("Accès refusé");
    if (property.status !== "LIVE") {
      throw new BadRequestException("Seules les annonces actives peuvent être boostées");
    }

    // If a PENDING request already exists for this property (e.g. agent retrying
    // after a failed screenshot upload), return it instead of throwing.
    const existing = await this.prisma.boostRequest.findFirst({
      where: { propertyId, status: "PENDING" },
      include: {
        property: { select: PROPERTY_SELECT },
        agent: { select: AGENT_SELECT },
      },
    });
    if (existing) {
      if (existing.agentId !== agentId) throw new ForbiddenException("Accès refusé");
      return existing;
    }

    const plan = BOOST_PLANS.find((p) => p.durationDays === dto.durationDays);
    if (!plan) throw new BadRequestException("Plan de boost invalide");

    const reference = generatePaymentReference(propertyId);

    const request = await this.prisma.boostRequest.create({
      data: {
        propertyId,
        agentId,
        durationDays: dto.durationDays,
        amount: plan.amount,
        paymentMethod: dto.paymentMethod as any,
        paymentReference: reference,
        screenshotUrl: dto.screenshotUrl,
        status: "PENDING",
      },
      include: {
        property: { select: PROPERTY_SELECT },
        agent: { select: AGENT_SELECT },
      },
    });

    // Notify admin by email
    try {
      await this.mail.sendAdminNewBoostRequest({
        agentName: request.agent.name,
        agentEmail: request.agent.email ?? "",
        propertyTitle: request.property.title,
        durationDays: request.durationDays,
        amount: request.amount,
        paymentMethod: request.paymentMethod as string,
        reference: request.paymentReference ?? "",
        boostRequestId: request.id,
      });
    } catch (err) {
      this.logger.warn("Admin boost notification failed:", err);
    }

    return request;
  }

  // ── Agent: attach / update screenshot ────────────────────────────────────────

  async updateScreenshot(agentId: string, boostRequestId: string, dto: UpdateScreenshotDto) {
    const request = await this.prisma.boostRequest.findUnique({
      where: { id: boostRequestId },
    });
    if (!request || request.agentId !== agentId) throw new ForbiddenException("Accès refusé");
    if (request.status !== "PENDING") {
      throw new BadRequestException("Cette demande ne peut plus être modifiée");
    }
    return this.prisma.boostRequest.update({
      where: { id: boostRequestId },
      data: { screenshotUrl: dto.screenshotUrl },
    });
  }

  // ── Agent: history ────────────────────────────────────────────────────────────

  async getMyBoosts(agentId: string) {
    return this.prisma.boostRequest.findMany({
      where: { agentId },
      include: { property: { select: PROPERTY_SELECT } },
      orderBy: { createdAt: "desc" },
    });
  }

  // ── Admin: pending queue ───────────────────────────────────────────────────────

  async getPendingBoosts() {
    return this.prisma.boostRequest.findMany({
      where: { status: "PENDING" },
      include: {
        property: { select: PROPERTY_SELECT },
        agent: { select: AGENT_SELECT },
      },
      orderBy: { createdAt: "asc" }, // FIFO
    });
  }

  async getAllBoosts(status?: string) {
    return this.prisma.boostRequest.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        property: { select: PROPERTY_SELECT },
        agent: { select: AGENT_SELECT },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // ── Admin: confirm ─────────────────────────────────────────────────────────────

  async confirmBoost(boostRequestId: string, adminId: string) {
    const request = await this.prisma.boostRequest.findUnique({
      where: { id: boostRequestId },
      include: {
        property: { select: PROPERTY_SELECT },
        agent: { select: AGENT_SELECT },
      },
    });
    if (!request) throw new NotFoundException("Demande introuvable");
    if (request.status !== "PENDING") {
      throw new BadRequestException("Cette demande a déjà été traitée");
    }

    const boostedUntil = new Date(
      Date.now() + request.durationDays * 24 * 60 * 60 * 1_000,
    );

    const [updated] = await this.prisma.$transaction([
      this.prisma.boostRequest.update({
        where: { id: boostRequestId },
        data: { status: "CONFIRMED", confirmedBy: adminId, confirmedAt: new Date() },
      }),
      this.prisma.property.update({
        where: { id: request.propertyId },
        data: { isBoosted: true, boostedUntil },
      }),
    ]);

    try {
      await this.mail.sendBoostConfirmed({
        agentEmail: request.agent.email ?? "",
        agentName: request.agent.name,
        propertyTitle: request.property.title,
        durationDays: request.durationDays,
        boostedUntil,
      });
    } catch (err) {
      this.logger.warn("Agent boost confirmed notification failed:", err);
    }

    return updated;
  }

  // ── Admin: reject ──────────────────────────────────────────────────────────────

  async rejectBoost(boostRequestId: string, adminId: string, dto: RejectBoostDto) {
    const request = await this.prisma.boostRequest.findUnique({
      where: { id: boostRequestId },
      include: {
        agent: { select: AGENT_SELECT },
        property: { select: PROPERTY_SELECT },
      },
    });
    if (!request) throw new NotFoundException("Demande introuvable");
    if (request.status !== "PENDING") {
      throw new BadRequestException("Cette demande a déjà été traitée");
    }

    const updated = await this.prisma.boostRequest.update({
      where: { id: boostRequestId },
      data: {
        status: "REJECTED",
        rejectionReason: dto.reason,
        confirmedBy: adminId,
        confirmedAt: new Date(),
      },
    });

    try {
      await this.mail.sendBoostRejected({
        agentEmail: request.agent.email ?? "",
        agentName: request.agent.name,
        propertyTitle: request.property.title,
        reason: dto.reason,
      });
    } catch (err) {
      this.logger.warn("Agent boost rejected notification failed:", err);
    }

    return updated;
  }

  // ── Hourly job: expire active boosts ──────────────────────────────────────────

  async expireBoosts() {
    const now = new Date();

    // Find properties whose boost has elapsed
    const expiredProperties = await this.prisma.property.findMany({
      where: { isBoosted: true, boostedUntil: { lte: now } },
      select: { id: true },
    });

    if (expiredProperties.length === 0) return;

    const expiredIds = expiredProperties.map((p) => p.id);

    await this.prisma.$transaction([
      // Clear boost on properties
      this.prisma.property.updateMany({
        where: { id: { in: expiredIds } },
        data: { isBoosted: false, boostedUntil: null },
      }),
      // Mark corresponding confirmed requests as EXPIRED
      this.prisma.boostRequest.updateMany({
        where: { propertyId: { in: expiredIds }, status: "CONFIRMED" },
        data: { status: "EXPIRED" },
      }),
    ]);

    this.logger.log(`⏱ Expired ${expiredIds.length} boost(s)`);
  }
}
