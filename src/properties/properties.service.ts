import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.service";
import { UploadsService } from "../uploads/uploads.service";
import { CreatePropertyDto } from "./dto/create-property.dto";
import { PropertyFilterDto } from "./dto/property-filter.dto";
import { UpdatePropertyDto } from "./dto/update-property.dto";

/** Free agents may have at most this many active listings after their grace period ends. */
const FREE_LISTING_CAP = 10;

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(
    private prisma: PrismaService,
    private uploads: UploadsService,
    private mail: MailService,
  ) {}

  /** Resolves a stored R2 object key (e.g. "tmp/<uuid>.jpg") to a public URL.
   *  If the key is already an absolute URL (e.g. a previously double-prefixed value
   *  that slipped through), return it as-is to avoid further prefix stacking. */
  private toGalleryUrl(key: string) {
    if (/^https?:\/\//.test(key)) return key;
    const base = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");
    return `${base}/${key.replace(/^\//, "")}`;
  }

  private withGalleryUrls<T extends { gallery: string[]; createdAt?: Date; listedDaysAgo?: number }>(property: T): T {
    const computed: Partial<T> = {};
    if (property.createdAt instanceof Date) {
      // Always derive listedDaysAgo from createdAt so it stays accurate over time.
      (computed as any).listedDaysAgo = Math.floor(
        (Date.now() - property.createdAt.getTime()) / 86_400_000,
      );
    }
    return {
      ...property,
      ...computed,
      gallery: property.gallery.map((key) => this.toGalleryUrl(key)),
    };
  }

  /** Reshapes raw view/share/whatsapp counters and the favorites relation into a `performance` summary. */
  private withPerformance<
    T extends {
      viewCount: number;
      shareCount: number;
      whatsappClicks: number;
      _count?: { favorites: number };
    },
  >(property: T) {
    const { viewCount, shareCount, whatsappClicks, _count, ...rest } = property;
    return {
      ...rest,
      performance: {
        viewed: viewCount,
        shared: shareCount,
        saved: _count?.favorites ?? 0,
        whatsappClicks,
      },
    };
  }

  async findAll(filter: PropertyFilterDto) {
    const {
      page,
      limit,
      search,
      agentId,
      agencyId,
      listingType,
      category,
      city,
      suburb,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      minArea,
      maxArea,
      period,
      verified,
      premium,
      sortBy,
      sortOrder,
      isShortTerm,
      isLongTerm,
    } = filter;
    const skip = (page - 1) * limit;
    const order = sortOrder ?? "asc";

    const where = {
      // Only surface LIVE listings from non-suspended agents publicly.
      status: "LIVE" as const,
      agent: { isSuspended: false },
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { subtitle: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
          { city: { contains: search, mode: "insensitive" as const } },
          { suburb: { contains: search, mode: "insensitive" as const } },
          { neighborhood: { contains: search, mode: "insensitive" as const } },
          { category: { contains: search, mode: "insensitive" as const } },
          { reference: { contains: search, mode: "insensitive" as const } },
          { zone: { contains: search, mode: "insensitive" as const } },
          // Search by agent name or agency name lets users find a specific agent's listings
          {
            agent: { name: { contains: search, mode: "insensitive" as const } },
          },
          {
            agency: {
              name: { contains: search, mode: "insensitive" as const },
            },
          },
        ],
      }),
      ...(agentId && { agentId }),
      ...(agencyId && { agencyId }),
      ...(listingType && { listingType }),
      ...(category && { category }),
      ...(city && { city }),
      ...(suburb && { suburb }),
      ...(period && { period }),
      ...(verified !== undefined && { verified }),
      ...(premium !== undefined && { premium }),
      ...(isShortTerm !== undefined && { isShortTerm }),
      ...(isLongTerm !== undefined && { isLongTerm }),
      ...(bedrooms !== undefined && { bedrooms }),
      ...(bathrooms !== undefined && { bathrooms }),
      ...((minPrice !== undefined || maxPrice !== undefined) && {
        price: {
          ...(minPrice !== undefined && { gte: minPrice }),
          ...(maxPrice !== undefined && { lte: maxPrice }),
        },
      }),
      ...((minArea !== undefined || maxArea !== undefined) && {
        areaSqm: {
          ...(minArea !== undefined && { gte: minArea }),
          ...(maxArea !== undefined && { lte: maxArea }),
        },
      }),
    };

    // Boosted listings (boostedUntil > now) always float to the top;
    // within each group the user's chosen sort (or default createdAt desc) applies.
    const now = new Date();
    const orderBy: object[] = [
      // Listings with an active boost come first.
      { boostedUntil: { sort: "desc", nulls: "last" } },
      // Then apply the requested sort, or fall back to newest-first.
      sortBy ? { [sortBy]: order } : { createdAt: "desc" as const },
    ];

    const [data, total] = await this.prisma.$transaction([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          agent: true,
          agency: true,
          _count: { select: { favorites: true } },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    // Mark listings as boosted in the response so the frontend can badge them.
    const mapped = data.map((property) => ({
      ...this.withPerformance(this.withGalleryUrls(property)),
      isBoosted: property.boostedUntil != null && property.boostedUntil > now,
    }));

    return {
      data: mapped,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        agent: true,
        agency: true,
        _count: { select: { favorites: true } },
      },
    });
    if (!property) throw new NotFoundException("Property not found");
    return this.withPerformance(this.withGalleryUrls(property));
  }

  /**
   * Creates a property. For agent-submitted listings, starts as DRAFT.
   * Admin-created listings are LIVE immediately.
   */
  async create(dto: CreatePropertyDto, agentId?: string) {
    // Enforce cap only for self-submitting agents (agentId provided).
    if (agentId) {
      await this.enforceListingCap(agentId);
    }

    // Agent submissions start as DRAFT; admin posts go straight to LIVE.
    const statusOverride = agentId
      ? { status: "DRAFT" as const, isPublished: false }
      : { status: "LIVE" as const, isPublished: true, publishedAt: new Date() };

    // If the agent wants to mark this listing as exclusive, verify no other
    // agent already holds an exclusive on a property with the same title +
    // suburb combination (the closest we can get to "same property" without
    // an address field). Block the submission if a conflict is found.
    if (dto.isExclusive && dto.suburb && dto.title) {
      const existingExclusive = await this.prisma.property.findFirst({
        where: {
          isExclusive: true,
          suburb: dto.suburb,
          title: { contains: dto.title.slice(0, 20), mode: "insensitive" },
          status: { in: ["LIVE", "PENDING", "DRAFT"] },
          agentId: { not: agentId },
        },
      });
      if (existingExclusive) {
        throw new ConflictException(
          "Un autre agent a déjà une annonce exclusive pour un bien similaire dans ce quartier. Veuillez contacter l'équipe Okapi si vous pensez qu'il s'agit d'une erreur.",
        );
      }
    }

    const property = await this.prisma.property.create({
      data: {
        // Defaults for fields that admin sets but agents don't (safe for schema non-null)
        imageGradient: "from-slate-700/80 to-slate-900/80",
        iconType: dto.category ?? "apartment",
        subtitle: dto.category ?? "Bien immobilier",
        bedrooms: 0,
        bathrooms: 0,
        areaSqm: 0,
        neighborhood: "",
        gallery: [],
        amenities: [],
        ...dto,
        ...statusOverride,
      },
    });

    // Gallery keys arrive as tmp/ uploads (see UploadsService.createPresignedUploads).
    // Now that we have a property id, move them to a permanent properties/{id}/
    // prefix so they survive the tmp/ lifecycle expiry rule.
    let promoted = property;
    try {
      const promotedKeys = await this.uploads.promoteKeys(
        property.gallery,
        property.id,
      );
      promoted = await this.prisma.property.update({
        where: { id: property.id },
        data: { gallery: promotedKeys },
      });
    } catch (err) {
      this.logger.error(
        `Failed to promote gallery images for property ${property.id} — ` +
          `keys remain under tmp/ and will expire via the lifecycle rule unless promoted manually: ${property.gallery.join(", ")}`,
        err instanceof Error ? err.stack : err,
      );
    }

    // Fire property alert notifications with the promoted (final) gallery URLs.
    void this.notifyMatchingAlerts(promoted);

    return this.withPerformance(this.withGalleryUrls(promoted));
  }

  /**
   * Finds all active alerts whose criteria match the newly created property,
   * groups them by user, and sends one alert email per user.
   */
  private async notifyMatchingAlerts(property: {
    id: string;
    title: string;
    price: number;
    city: string;
    suburb?: string | null;
    listingType: string;
    category: string;
    bedrooms?: number | null;
    bathrooms?: number | null;
    verified: boolean;
    gallery: string[];
    agentId: string;
    period?: string | null;
  }) {
    try {
      // Fetch agent's WhatsApp number for the contact button in the email.
      const agent = await this.prisma.agent.findUnique({
        where: { id: property.agentId },
        select: { whatsappNumber: true },
      });

      // Resolve raw gallery keys to public URLs.
      const galleryUrls = property.gallery.map((key) => this.toGalleryUrl(key));

      const propertySnapshot = {
        id: property.id,
        title: property.title,
        price: property.price,
        city: property.city,
        suburb: property.suburb,
        listingType: property.listingType,
        category: property.category,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        verified: property.verified,
        gallery: galleryUrls,
        whatsappNumber: agent?.whatsappNumber ?? null,
        period: property.period,
      };

      const matchingAlerts = await this.prisma.alert.findMany({
        where: {
          active: true,
          ...(property.listingType && {
            OR: [{ listingType: null }, { listingType: property.listingType }],
          }),
          ...(property.category && {
            OR: [{ category: null }, { category: property.category }],
          }),
          ...(property.city && {
            OR: [
              { city: null },
              {
                city: { contains: property.city, mode: "insensitive" as const },
              },
            ],
          }),
          ...(property.suburb && {
            OR: [
              { suburb: null },
              {
                suburb: {
                  contains: property.suburb,
                  mode: "insensitive" as const,
                },
              },
            ],
          }),
          OR: [{ minPrice: null }, { minPrice: { lte: property.price } }],
          AND: [
            { OR: [{ maxPrice: null }, { maxPrice: { gte: property.price } }] },
            ...(property.bedrooms != null
              ? [
                  {
                    OR: [
                      { minBedrooms: null },
                      { minBedrooms: { lte: property.bedrooms! } },
                    ],
                  },
                  {
                    OR: [
                      { maxBedrooms: null },
                      { maxBedrooms: { gte: property.bedrooms! } },
                    ],
                  },
                ]
              : []),
          ],
        },
        include: { user: { select: { email: true, firstName: true } } },
      });

      if (!matchingAlerts.length) return;

      for (const alert of matchingAlerts) {
        // Build a human-readable criteria summary for the email hero line.
        const criteriaParts = [
          alert.category,
          alert.city,
          alert.suburb,
          alert.minPrice != null && alert.maxPrice != null
            ? `${alert.minPrice.toLocaleString("fr-FR")}–${alert.maxPrice.toLocaleString("fr-FR")} $`
            : alert.minPrice != null
              ? `À partir de ${alert.minPrice.toLocaleString("fr-FR")} $`
              : alert.maxPrice != null
                ? `Jusqu'à ${alert.maxPrice.toLocaleString("fr-FR")} $`
                : null,
        ]
          .filter(Boolean)
          .join(" · ");

        const { email, firstName } = alert.user;
        void this.mail.sendPropertyAlert(
          email,
          firstName,
          alert.name,
          criteriaParts,
          [propertySnapshot],
        );
      }
    } catch (err) {
      this.logger.error(
        `Failed to send property alert notifications for property ${property.id}`,
        err,
      );
    }
  }

  /**
   * Checks whether the agent is allowed to create another listing.
   * FREE agents are capped at FREE_LISTING_CAP after their grace period ends.
   * PRO and AGENCY plans have no cap.
   */
  private async enforceListingCap(agentId: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      select: { plan: true, graceEndsAt: true, isSuspended: true },
    });

    if (!agent) throw new NotFoundException("Agent not found");

    if (agent.isSuspended) {
      throw new ForbiddenException(
        "Your account has been suspended. Please contact support.",
      );
    }

    // PRO and AGENCY plans have no listing cap.
    if (agent.plan !== "FREE") return;

    // Still within grace period — no cap enforced.
    if (agent.graceEndsAt > new Date()) return;

    // Grace period expired: count active listings.
    const activeCount = await this.prisma.property.count({
      where: { agentId },
    });

    if (activeCount >= FREE_LISTING_CAP) {
      throw new ForbiddenException(
        `Free plan limit reached (${FREE_LISTING_CAP} listings). ` +
          `Upgrade to Pro to publish unlimited listings.`,
      );
    }
  }

  async update(id: string, dto: UpdatePropertyDto) {
    await this.findOne(id);

    // Normalize gallery: strip any R2 base URL prefix so the DB always stores
    // bare object keys (same logic as updateMine). Prevents URL accumulation
    // when the dashboard sends back the full URLs it received from the API.
    let data: typeof dto = dto;
    // Normalize empty-string FK to null so Prisma doesn't attempt a lookup
    if (data.agencyId === "") data = { ...data, agencyId: null };
    if (dto.gallery && dto.gallery.length > 0) {
      const r2Base =
        (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "") + "/";
      const normalized = r2Base.length > 1
        ? dto.gallery.map((k) => {
            let key = k;
            while (key.startsWith(r2Base)) key = key.slice(r2Base.length);
            return key;
          })
        : dto.gallery;
      data = { ...dto, gallery: normalized };
    }

    const property = await this.prisma.property.update({
      where: { id },
      data,
      include: { _count: { select: { favorites: true } } },
    });
    return this.withPerformance(this.withGalleryUrls(property));
  }

  /**
   * Boost a listing for the given number of days (paid placement).
   * Admin confirms payment manually, then calls this endpoint.
   */
  async boost(id: string, days: number) {
    await this.findOne(id);
    const boostedUntil = new Date();
    boostedUntil.setDate(boostedUntil.getDate() + days);

    const property = await this.prisma.property.update({
      where: { id },
      data: { boostedUntil },
      include: { _count: { select: { favorites: true } } },
    });
    return this.withPerformance(this.withGalleryUrls(property));
  }

  /**
   * Returns true if this is the first time this identity (userId or sessionId)
   * performs `action` on this property, and records the interaction.
   * Returns false if already seen — caller should skip the increment.
   * Falls back to always-true when no identity is supplied (legacy / tests).
   */
  private async tryInteract(
    propertyId: string,
    action: string,
    userId?: string,
    sessionId?: string,
  ): Promise<boolean> {
    if (userId) {
      // Logged-in user: one interaction per (property, user, action) ever
      const existing = await this.prisma.propertyInteraction.findFirst({
        where: { propertyId, userId, action },
      });
      if (existing) return false;
      await this.prisma.propertyInteraction.create({
        data: { propertyId, userId, action },
      });
      return true;
    }
    if (sessionId) {
      // Anonymous visitor: one interaction per (property, session, action) ever
      const existing = await this.prisma.propertyInteraction.findFirst({
        where: { propertyId, sessionId, action },
      });
      if (existing) return false;
      await this.prisma.propertyInteraction.create({
        data: { propertyId, sessionId, action },
      });
      return true;
    }
    // No identity — always count (fallback for internal calls / tests)
    return true;
  }

  /** Records a property view. Deduplicates per user or anonymous session. */
  async recordView(id: string, userId?: string, sessionId?: string) {
    await this.findOne(id);
    const shouldCount = await this.tryInteract(id, 'view', userId, sessionId);
    const property = shouldCount
      ? await this.prisma.property.update({
          where: { id },
          data: { viewCount: { increment: 1 } },
          include: { _count: { select: { favorites: true } } },
        })
      : await this.prisma.property.findUniqueOrThrow({
          where: { id },
          include: { _count: { select: { favorites: true } } },
        });
    return this.withPerformance(property).performance;
  }

  /** Records a share. Deduplicates per user or anonymous session. */
  async recordShare(id: string, userId?: string, sessionId?: string) {
    await this.findOne(id);
    const shouldCount = await this.tryInteract(id, 'share', userId, sessionId);
    const property = shouldCount
      ? await this.prisma.property.update({
          where: { id },
          data: { shareCount: { increment: 1 } },
          include: { _count: { select: { favorites: true } } },
        })
      : await this.prisma.property.findUniqueOrThrow({
          where: { id },
          include: { _count: { select: { favorites: true } } },
        });
    return this.withPerformance(property).performance;
  }

  /** Records a WhatsApp tap — the #1 engagement signal. Deduplicates per user or session. */
  async recordWhatsAppClick(id: string, userId?: string, sessionId?: string) {
    await this.findOne(id);
    const shouldCount = await this.tryInteract(id, 'whatsapp', userId, sessionId);
    const property = shouldCount
      ? await this.prisma.property.update({
          where: { id },
          data: { whatsappClicks: { increment: 1 } },
          include: { _count: { select: { favorites: true } } },
        })
      : await this.prisma.property.findUniqueOrThrow({
          where: { id },
          include: { _count: { select: { favorites: true } } },
        });
    return this.withPerformance(property).performance;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.property.delete({ where: { id } });
    return { message: "Property deleted" };
  }

  // ── Agent self-service: listing lifecycle ─────────────────────────────────

  /** Agent's own listings — all statuses, ordered by newest first. */
  async findMine(agentId: string, status?: string) {
    const where: object = {
      agentId,
      ...(status && { status }),
    };
    const data = await this.prisma.property.findMany({
      where,
      orderBy: [
        { boostedUntil: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      include: { agency: true, _count: { select: { favorites: true } } },
    });
    return data.map((p) => ({
      ...this.withPerformance(this.withGalleryUrls(p)),
      isBoosted: p.boostedUntil != null && p.boostedUntil > new Date(),
    }));
  }

  /** Agent edits their own listing (only DRAFT, HIDDEN, or REJECTED can be edited freely). */
  async updateMine(id: string, agentId: string, dto: UpdatePropertyDto) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException("Property not found");
    if (property.agentId !== agentId)
      throw new ForbiddenException("Access denied");

    // Promote any new tmp/ gallery keys the agent uploaded (same as in create())
    let galleryKeys = dto.gallery ?? property.gallery;

    // Normalize: strip any R2 base URL prefix so the DB always stores bare keys.
    // This heals entries that were accidentally stored as full URLs in previous saves.
    const r2Base = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "") + "/";
    if (r2Base.length > 1) {
      galleryKeys = galleryKeys.map((k: string) => {
        let normalized = k;
        while (normalized.startsWith(r2Base)) normalized = normalized.slice(r2Base.length);
        return normalized;
      });
    }

    const tmpKeys = galleryKeys.filter((k: string) => k.startsWith("tmp/"));
    if (tmpKeys.length > 0) {
      try {
        const permanentKeys = await this.uploads.promoteKeys(tmpKeys, id);
        galleryKeys = galleryKeys.map((k: string) => {
          const idx = tmpKeys.indexOf(k);
          return idx >= 0 ? permanentKeys[idx] : k;
        });
      } catch (err) {
        this.logger.error("Gallery promotion failed on updateMine", err);
      }
    }

    const updated = await this.prisma.property.update({
      where: { id },
      data: { ...dto, gallery: galleryKeys },
      include: { _count: { select: { favorites: true } } },
    });
    return this.withPerformance(this.withGalleryUrls(updated));
  }

  /** Agent deletes their own listing (only DRAFT or HIDDEN). */
  async removeMine(id: string, agentId: string) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException("Property not found");
    if (property.agentId !== agentId)
      throw new ForbiddenException("Access denied");
    await this.prisma.property.delete({ where: { id } });
    return { message: "Listing deleted" };
  }

  /** DRAFT / HIDDEN / REJECTED → PENDING (submitted for admin review). */
  async publishMine(id: string, agentId: string) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException("Property not found");
    if (property.agentId !== agentId)
      throw new ForbiddenException("Access denied");
    if (!["DRAFT", "HIDDEN", "REJECTED"].includes(property.status))
      throw new BadRequestException(`Cannot submit a listing with status ${property.status}`);

    return this.prisma.property.update({
      where: { id },
      data: { status: "PENDING", isPublished: false },
    });
  }

  /** LIVE → HIDDEN (agent manually hides their listing). */
  async unpublishMine(id: string, agentId: string) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException("Property not found");
    if (property.agentId !== agentId)
      throw new ForbiddenException("Access denied");
    if (property.status !== "LIVE")
      throw new BadRequestException("Only LIVE listings can be unpublished");

    return this.prisma.property.update({
      where: { id },
      data: { status: "HIDDEN", isPublished: false },
    });
  }

  // ── Admin review actions ──────────────────────────────────────────────────

  /** Returns all PENDING listings for admin review. */
  async findPending() {
    const data = await this.prisma.property.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { agent: true, agency: true, _count: { select: { favorites: true } } },
    });
    return data.map((p) => this.withPerformance(this.withGalleryUrls(p)));
  }

  /** Admin approves a PENDING listing → LIVE. */
  async approve(id: string) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException("Property not found");
    if (property.status !== "PENDING")
      throw new BadRequestException("Only PENDING listings can be approved");

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 90); // 90-day listing duration

    return this.prisma.property.update({
      where: { id },
      data: {
        status: "LIVE",
        isPublished: true,
        publishedAt: now,
        expiresAt,
        rejectionReason: null,
      },
    });
  }

  /** Admin rejects a PENDING listing with a reason. */
  async reject(id: string, reason: string) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException("Property not found");
    if (property.status !== "PENDING")
      throw new BadRequestException("Only PENDING listings can be rejected");

    return this.prisma.property.update({
      where: { id },
      data: {
        status: "REJECTED",
        isPublished: false,
        rejectionReason: reason ?? "Non conforme",
      },
    });
  }

  /** Auto-submit all DRAFT listings for an agent when they get approved (called from agents service). */
  async autoSubmitDrafts(agentId: string) {
    return this.prisma.property.updateMany({
      where: { agentId, status: "DRAFT" },
      data: { status: "PENDING" },
    });
  }
}
