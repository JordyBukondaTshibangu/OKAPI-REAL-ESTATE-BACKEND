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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertiesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PropertiesService = class PropertiesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
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
            data,
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
        return property;
    }
    create(dto) {
        return this.prisma.property.create({ data: dto });
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.property.update({ where: { id }, data: dto });
    }
    async remove(id) {
        await this.findOne(id);
        await this.prisma.property.delete({ where: { id } });
        return { message: "Property deleted" };
    }
};
exports.PropertiesService = PropertiesService;
exports.PropertiesService = PropertiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PropertiesService);
//# sourceMappingURL=properties.service.js.map