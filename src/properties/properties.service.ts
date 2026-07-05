import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
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
  ) {}

  /** Resolves a stored R2 object key (e.g. "tmp/<uuid>.jpg") to a public URL. */
  private toGalleryUrl(key: string) {
    const base = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");
    return `${base}/${key.replace(/^\//, "")}`;
  }

  private withGalleryUrls<T extends { gallery: string[] }>(property: T): T {
    return { ...property, gallery: property.gallery.map((key) => this.toGalleryUrl(key)) };
  }

  /** Reshapes raw view/share counters and the favorites relation into a `performance` summary. */
  private withPerformance<
    T extends { viewCount: number; shareCount: number; _count?: { favorites: number } },
  >(property: T) {
    const { viewCount, shareCount, _count, ...rest } = property;
    return {
      ...rest,
      performance: {
        viewed: viewCount,
        shared: shareCount,
        saved: _count?.favorites ?? 0,
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
    } = filter;
    const skip = (page - 1) * limit;
    const order = sortOrder ?? "asc";

    const where = {
      // Only surface listings from non-suspended agents.
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
          { listingType: { contains: search, mode: "insensitive" as const } },
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
        include: { agent: true, agency: true, _count: { select: { favorites: true } } },
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
      include: { agent: true, agency: true, _count: { select: { favorites: true } } },
    });
    if (!property) throw new NotFoundException("Property not found");
    return this.withPerformance(this.withGalleryUrls(property));
  }

  /**
   * Creates a property. For agent-submitted listings, enforces the FREE plan
   * cap (10 active listings) once the grace period has expired.
   * Admin-created listings bypass the cap entirely.
   */
  async create(dto: CreatePropertyDto, agentId?: string) {
    // Enforce cap only for self-submitting agents (agentId provided).
    if (agentId) {
      await this.enforceListingCap(agentId);
    }

    const property = await this.prisma.property.create({ data: dto });

    // Gallery keys arrive as tmp/ uploads (see UploadsService.createPresignedUploads).
    // Now that we have a property id, move them to a permanent properties/{id}/
    // prefix so they survive the tmp/ lifecycle expiry rule.
    try {
      const promotedKeys = await this.uploads.promoteKeys(property.gallery, property.id);
      const updated = await this.prisma.property.update({
        where: { id: property.id },
        data: { gallery: promotedKeys },
      });
      return this.withPerformance(this.withGalleryUrls(updated));
    } catch (err) {
      this.logger.error(
        `Failed to promote gallery images for property ${property.id} — ` +
          `keys remain under tmp/ and will expire via the lifecycle rule unless promoted manually: ${property.gallery.join(", ")}`,
        err instanceof Error ? err.stack : err,
      );
      return this.withPerformance(this.withGalleryUrls(property));
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
      throw new ForbiddenException("Your account has been suspended. Please contact support.");
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
    const property = await this.prisma.property.update({
      where: { id },
      data: dto,
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

  /** Records a property view (e.g. when a visitor opens the property detail page). */
  async recordView(id: string) {
    await this.findOne(id);
    const property = await this.prisma.property.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      include: { _count: { select: { favorites: true } } },
    });
    return this.withPerformance(property).performance;
  }

  /** Records a property share (e.g. when a visitor uses the share button). */
  async recordShare(id: string) {
    await this.findOne(id);
    const property = await this.prisma.property.update({
      where: { id },
      data: { shareCount: { increment: 1 } },
      include: { _count: { select: { favorites: true } } },
    });
    return this.withPerformance(property).performance;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.property.delete({ where: { id } });
    return { message: "Property deleted" };
  }
}
