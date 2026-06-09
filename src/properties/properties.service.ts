import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UploadsService } from "../uploads/uploads.service";
import { CreatePropertyDto } from "./dto/create-property.dto";
import { PropertyFilterDto } from "./dto/property-filter.dto";
import { UpdatePropertyDto } from "./dto/update-property.dto";

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

    const orderBy = sortBy
      ? { [sortBy]: order }
      : { createdAt: "desc" as const };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: { agent: true, agency: true },
      }),
      this.prisma.property.count({ where }),
    ]);
    return {
      data: data.map((property) => this.withGalleryUrls(property)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: { agent: true, agency: true },
    });
    if (!property) throw new NotFoundException("Property not found");
    return this.withGalleryUrls(property);
  }

  async create(dto: CreatePropertyDto) {
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
      return this.withGalleryUrls(updated);
    } catch (err) {
      this.logger.error(
        `Failed to promote gallery images for property ${property.id} — ` +
          `keys remain under tmp/ and will expire via the lifecycle rule unless promoted manually: ${property.gallery.join(", ")}`,
        err instanceof Error ? err.stack : err,
      );
      return this.withGalleryUrls(property);
    }
  }

  async update(id: string, dto: UpdatePropertyDto) {
    await this.findOne(id);
    const property = await this.prisma.property.update({ where: { id }, data: dto });
    return this.withGalleryUrls(property);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.property.delete({ where: { id } });
    return { message: "Property deleted" };
  }
}
