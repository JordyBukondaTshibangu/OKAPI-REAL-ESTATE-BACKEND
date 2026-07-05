import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AgentPlan } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { toR2Url, UploadsService } from "../uploads/uploads.service";
import { CreateAgentDto } from "./dto/create-agent.dto";
import { FilterAgentDto } from "./dto/filter-agent.dto";
import { UpdateAgentDto } from "./dto/update-agent.dto";
import { UpdateMyProfileDto } from "./dto/update-my-profile.dto";

@Injectable()
export class AgentsService {
  constructor(
    private prisma: PrismaService,
    private uploads: UploadsService,
  ) {}

  private resolvePhotoUrl(key: string): string {
    if (key.startsWith("http")) return key;
    return toR2Url(key);
  }

  private withPhotoUrl<T extends { photo: string }>(agent: T): T {
    return { ...agent, photo: this.resolvePhotoUrl(agent.photo) };
  }

  async findAll({
    page,
    limit,
    search,
    name,
    title,
    specialization,
    language,
    nationality,
    sortBy,
    sortOrder,
  }: FilterAgentDto) {
    const skip = (page - 1) * limit;
    const order = sortOrder ?? "asc";
    // Tier 1 (Non-vérifié) agents can draft listings and build a profile,
    // but stay invisible in public search until they reach Tier 2+.
    const where: Record<string, unknown> = {
      verificationTier: { not: "NON_VERIFIE" },
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
        { specialization: { contains: search, mode: "insensitive" } },
        { bio: { contains: search, mode: "insensitive" } },
        { nationality: { contains: search, mode: "insensitive" } },
      ];
    }
    if (name) where.name = { contains: name, mode: "insensitive" };
    if (title) where.title = { contains: title, mode: "insensitive" };
    if (specialization)
      where.specialization = { contains: specialization, mode: "insensitive" };
    if (language) where.languages = { has: language };
    if (nationality)
      where.nationality = { equals: nationality, mode: "insensitive" };

    const orderBy =
      sortBy === "agency"
        ? { agency: { name: order } }
        : sortBy
          ? { [sortBy]: order }
          : { createdAt: "desc" as const };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.agent.findMany({
        skip,
        take: limit,
        where,
        orderBy,
        include: { agency: true, areasOfExpertise: true, trackRecord: true },
      }),
      this.prisma.agent.count({ where }),
    ]);
    return {
      data: data.map((agent) => this.withPhotoUrl(agent)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      include: {
        agency: true,
        areasOfExpertise: true,
        trackRecord: true,
        properties: true,
      },
    });
    if (!agent) throw new NotFoundException("Agent not found");
    return this.withPhotoUrl(agent);
  }

  async create(dto: CreateAgentDto) {
    // Agents created directly by Admin are pre-vetted out of band (this is
    // the existing admin-curation workflow), so they go straight in as
    // Vérifié instead of starting at the bottom of the self-signup ladder.
    const agent = await this.prisma.agent.create({
      data: {
        ...dto,
        verificationTier: "VERIFIE",
        idDocumentStatus: "APPROVED",
        firstListingChecked: true,
        verifiedAt: new Date(),
      },
    });
    return this.withPhotoUrl(agent);
  }

  async update(id: string, dto: UpdateAgentDto) {
    await this.findOne(id);
    const agent = await this.prisma.agent.update({ where: { id }, data: dto });
    return this.withPhotoUrl(agent);
  }

  async updatePhoto(id: string, tmpKey: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      select: { photo: true },
    });
    if (!agent) throw new NotFoundException("Agent not found");

    if (agent.photo && !agent.photo.startsWith("http")) {
      await this.uploads.deleteKey(agent.photo).catch(() => {});
    }

    const newKey = await this.uploads.promoteToPrefix(tmpKey, `agents/${id}`);
    const updated = await this.prisma.agent.update({
      where: { id },
      data: { photo: newKey },
      include: { agency: true, areasOfExpertise: true, trackRecord: true },
    });
    return this.withPhotoUrl(updated);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.agent.delete({ where: { id } });
    return { message: "Agent deleted" };
  }

  // --- Agent self-service: "build a profile" (Tier 1 capability) ---

  async getMyProfile(agentId: string) {
    return this.findOne(agentId);
  }

  async updateMyProfile(agentId: string, dto: UpdateMyProfileDto) {
    await this.findOne(agentId);
    const agent = await this.prisma.agent.update({ where: { id: agentId }, data: dto });
    return this.withPhotoUrl(agent);
  }

  async updateMyPhoto(agentId: string, tmpKey: string) {
    return this.updatePhoto(agentId, tmpKey);
  }

  // ---------------------------------------------------------------------------
  // Admin: approval
  // ---------------------------------------------------------------------------

  /**
   * Promotes a self-registered agent from NON_VERIFIE → VERIFIE.
   * Called from the admin dashboard after reviewing their profile.
   * Once approved the agent appears in public search and can publish listings.
   */
  async approve(agentId: string) {
    await this.findOne(agentId);
    const agent = await this.prisma.agent.update({
      where: { id: agentId },
      data: {
        verificationTier: "VERIFIE",
        verifiedAt: new Date(),
        firstListingChecked: false, // admin will review their first listing
      },
    });
    return this.withPhotoUrl(agent);
  }

  // ---------------------------------------------------------------------------
  // Admin: monetisation plan management
  // ---------------------------------------------------------------------------

  /**
   * Manually upgrades or downgrades an agent's plan.
   * Called by admin after confirming payment (e.g. via WhatsApp).
   */
  async updatePlan(agentId: string, plan: AgentPlan) {
    if (!Object.values(AgentPlan).includes(plan)) {
      throw new BadRequestException(`Invalid plan: ${plan}`);
    }
    const agent = await this.prisma.agent.update({
      where: { id: agentId },
      data: { plan },
    });
    return this.withPhotoUrl(agent);
  }

  /**
   * Suspends an agent — their listings are hidden from public search.
   * Provide a reason that will be stored for the audit trail.
   */
  async suspend(agentId: string, reason?: string) {
    await this.findOne(agentId);
    const agent = await this.prisma.agent.update({
      where: { id: agentId },
      data: { isSuspended: true, suspendedAt: new Date(), suspendedReason: reason ?? null },
    });
    return this.withPhotoUrl(agent);
  }

  /** Lifts a suspension — agent and their listings become visible again. */
  async unsuspend(agentId: string) {
    await this.findOne(agentId);
    const agent = await this.prisma.agent.update({
      where: { id: agentId },
      data: { isSuspended: false, suspendedAt: null, suspendedReason: null },
    });
    return this.withPhotoUrl(agent);
  }
}
