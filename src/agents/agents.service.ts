import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AgentPlan } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { toR2Url, UploadsService } from "../uploads/uploads.service";
import { CreateAgentDto } from "./dto/create-agent.dto";
import { FilterAgentDto } from "./dto/filter-agent.dto";
import { UpdateAgentDto } from "./dto/update-agent.dto";
import { UpdateMyProfileDto } from "./dto/update-my-profile.dto";
import { UpdateMyAgencyDto } from "./dto/update-my-agency.dto";

@Injectable()
export class AgentsService {
  constructor(
    private prisma: PrismaService,
    private uploads: UploadsService,
  ) {}

  private resolvePhotoUrl(key: string | null | undefined): string {
    if (!key || key.trim() === "") return "";
    if (key.startsWith("http")) return key;
    return toR2Url(key);
  }

  private withPhotoUrl<T extends { photo: string | null }>(agent: T): T {
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
    commune,
    propertyType,
    minRating,
    agentType,
    rentalFocus,
    agencyId,
    verificationTier,
    emailVerified,
    sortBy,
    sortOrder,
  }: FilterAgentDto) {
    const skip = (page - 1) * limit;
    const order = sortOrder ?? "asc";

    const where: Record<string, unknown> = {};

    // When an explicit verificationTier filter is provided (e.g. from the admin
    // dashboard pending queue), honour it. When agencyId is provided (agency
    // portal team view), show all agents regardless of tier. Otherwise hide
    // NON_VERIFIE agents from the public-facing listing.
    if (verificationTier) {
      where.verificationTier = verificationTier;
    } else if (!agencyId) {
      where.verificationTier = { not: "NON_VERIFIE" };
    }

    if (emailVerified !== undefined) where.emailVerified = emailVerified;

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
    // Filter by commune of operation (agent serves this area)
    if (commune) where.communes = { has: commune };
    // Filter by property type managed (agent handles this property type)
    if (propertyType) where.propertyTypes = { has: propertyType };
    // Filter by minimum rating
    if (minRating !== undefined && minRating > 0)
      where.rating = { gte: minRating };
    // Filter by agent type (COMMISSIONNAIRE | AGENT | AGENCY_OWNER)
    if (agentType) where.agentType = agentType;
    // Filter by rental focus (LONG_TERM | SHORT_TERM | BOTH)
    if (rentalFocus) where.rentalFocus = rentalFocus;
    // Agency portal: scope to a specific agency's team (bypasses verificationTier filter)
    if (agencyId) where.agencyId = agencyId;

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
        include: {
          agency: true,
          areasOfExpertise: true,
          trackRecord: true,
        },
      }),
      this.prisma.agent.count({ where }),
    ]);

    // Compute real counts live so stored counters can never be stale
    const agentIds = data.map((a) => a.id);
    const [saleCounts, rentCounts, reviewCounts, ratingAggs] = await Promise.all([
      this.prisma.property.groupBy({
        by: ['agentId'],
        where: { agentId: { in: agentIds }, status: 'LIVE', isPublished: true, listingType: 'sale' },
        _count: { _all: true },
      }),
      this.prisma.property.groupBy({
        by: ['agentId'],
        where: { agentId: { in: agentIds }, status: 'LIVE', isPublished: true, listingType: 'rent' },
        _count: { _all: true },
      }),
      // Total review count (all reviews, including pending moderation)
      this.prisma.review.groupBy({
        by: ['agentId'],
        where: { agentId: { in: agentIds } },
        _count: { _all: true },
      }),
      // Average rating of visible (approved) reviews only
      this.prisma.review.groupBy({
        by: ['agentId'],
        where: { agentId: { in: agentIds }, isVisible: true },
        _avg: { rating: true },
        _count: { _all: true },
      }),
    ]);

    const saleMap = new Map(saleCounts.map((r) => [r.agentId, r._count._all]));
    const rentMap = new Map(rentCounts.map((r) => [r.agentId, r._count._all]));
    const reviewCountMap = new Map(reviewCounts.map((r) => [r.agentId, r._count._all]));
    const ratingMap = new Map(ratingAggs.map((r) => [r.agentId, r._avg?.rating ?? 0]));

    return {
      data: data.map((agent) => ({
        ...this.withPhotoUrl(agent),
        forSaleCount: saleMap.get(agent.id) ?? 0,
        forRentCount: rentMap.get(agent.id) ?? 0,
        ratingsCount: reviewCountMap.get(agent.id) ?? 0,
        rating: Math.round((ratingMap.get(agent.id) ?? 0) * 10) / 10,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const [agent, saleCount, rentCount, reviewTotal, ratingAgg] = await Promise.all([
      this.prisma.agent.findUnique({
        where: { id },
        include: {
          agency: true,
          areasOfExpertise: true,
          trackRecord: true,
          properties: true,
        },
      }),
      this.prisma.property.count({ where: { agentId: id, status: 'LIVE', isPublished: true, listingType: 'sale' } }),
      this.prisma.property.count({ where: { agentId: id, status: 'LIVE', isPublished: true, listingType: 'rent' } }),
      // Total review count (all reviews)
      this.prisma.review.count({ where: { agentId: id } }),
      // Average rating of visible reviews only
      this.prisma.review.aggregate({
        where: { agentId: id, isVisible: true },
        _avg: { rating: true },
      }),
    ]);
    if (!agent) throw new NotFoundException("Agent not found");
    return {
      ...this.withPhotoUrl(agent),
      forSaleCount: saleCount,
      forRentCount: rentCount,
      ratingsCount: reviewTotal,
      rating: Math.round((ratingAgg._avg?.rating ?? 0) * 10) / 10,
    };
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
        emailVerified: true, // admin-created agents skip email verification
      },
    });
    return this.withPhotoUrl(agent);
  }

  async update(id: string, dto: UpdateAgentDto) {
    await this.findOne(id);
    // Remap dashboard field names → Prisma model field names,
    // and strip Agency-only fields that don't belong on Agent.
    const { whatsapp, graceEndsAt, freeListingCap, ...rest } = dto as any;
    const data: any = {
      ...rest,
      ...(whatsapp !== undefined ? { whatsappNumber: whatsapp } : {}),
    };
    const agent = await this.prisma.agent.update({ where: { id }, data });
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

    // Strip empty strings so we never write "" into unique fields (e.g. phoneNumber).
    const data: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(dto)) {
      if (v !== undefined && v !== "") data[k] = v;
    }

    try {
      const agent = await this.prisma.agent.update({
        where: { id: agentId },
        data,
      });
      return this.withPhotoUrl(agent);
    } catch (err: any) {
      if (err?.code === "P2002") {
        const field = err?.meta?.target?.[0] ?? "field";
        throw new BadRequestException(
          `Ce ${field} est déjà utilisé par un autre agent.`,
        );
      }
      throw err;
    }
  }

  async updateMyAgency(agentId: string, dto: UpdateMyAgencyDto) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      select: { agencyId: true, agentType: true },
    });
    if (!agent) throw new NotFoundException("Agent not found");
    if (agent.agentType !== "AGENCY_OWNER")
      throw new ForbiddenException(
        "Only agency owners can update agency details.",
      );
    if (!agent.agencyId)
      throw new ForbiddenException("No agency linked to your account.");

    // Strip empty strings before writing
    const data: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(dto)) {
      if (v !== undefined && v !== "") data[k] = v;
    }

    return this.prisma.agency.update({ where: { id: agent.agencyId }, data });
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
        emailVerified: true, // approval implies email is valid
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
      data: {
        isSuspended: true,
        suspendedAt: new Date(),
        suspendedReason: reason ?? null,
      },
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
