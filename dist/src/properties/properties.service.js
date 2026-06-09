"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PropertiesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertiesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const uploads_service_1 = require("../uploads/uploads.service");
let PropertiesService = PropertiesService_1 = class PropertiesService {
    prisma;
    uploads;
    logger = new common_1.Logger(PropertiesService_1.name);
    constructor(prisma, uploads) {
        this.prisma = prisma;
        this.uploads = uploads;
    }
    toGalleryUrl(key) {
        const base = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");
        return `${base}/${key.replace(/^\//, "")}`;
    }
    withGalleryUrls(property) {
        return { ...property, gallery: property.gallery.map((key) => this.toGalleryUrl(key)) };
    }
    async findAll(filter) {
        const { page, limit, search, agentId, agencyId, listingType, category, city, suburb, minPrice, maxPrice, bedrooms, bathrooms, minArea, maxArea, period, verified, premium, sortBy, sortOrder, } = filter;
        const skip = (page - 1) * limit;
        const order = sortOrder ?? "asc";
        const where = {
            ...(search && {
                OR: [
                    { title: { contains: search, mode: "insensitive" } },
                    { subtitle: { contains: search, mode: "insensitive" } },
                    { description: { contains: search, mode: "insensitive" } },
                    { city: { contains: search, mode: "insensitive" } },
                    { suburb: { contains: search, mode: "insensitive" } },
                    { neighborhood: { contains: search, mode: "insensitive" } },
                    { category: { contains: search, mode: "insensitive" } },
                    { listingType: { contains: search, mode: "insensitive" } },
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
            : { createdAt: "desc" };
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
    async findOne(id) {
        const property = await this.prisma.property.findUnique({
            where: { id },
            include: { agent: true, agency: true },
        });
        if (!property)
            throw new common_1.NotFoundException("Property not found");
        return this.withGalleryUrls(property);
    }
    async create(dto) {
        const property = await this.prisma.property.create({ data: dto });
        try {
            const promotedKeys = await this.uploads.promoteKeys(property.gallery, property.id);
            const updated = await this.prisma.property.update({
                where: { id: property.id },
                data: { gallery: promotedKeys },
            });
            return this.withGalleryUrls(updated);
        }
        catch (err) {
            this.logger.error(`Failed to promote gallery images for property ${property.id} — ` +
                `keys remain under tmp/ and will expire via the lifecycle rule unless promoted manually: ${property.gallery.join(", ")}`, err instanceof Error ? err.stack : err);
            return this.withGalleryUrls(property);
        }
    }
    async update(id, dto) {
        await this.findOne(id);
        const property = await this.prisma.property.update({ where: { id }, data: dto });
        return this.withGalleryUrls(property);
    }
    async remove(id) {
        await this.findOne(id);
        await this.prisma.property.delete({ where: { id } });
        return { message: "Property deleted" };
    }
};
exports.PropertiesService = PropertiesService;
exports.PropertiesService = PropertiesService = PropertiesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        uploads_service_1.UploadsService])
], PropertiesService);
//# sourceMappingURL=properties.service.js.map