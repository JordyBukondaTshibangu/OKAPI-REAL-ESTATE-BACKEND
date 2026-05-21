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
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ReviewsService = class ReviewsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, dto) {
        if (!dto.propertyId && !dto.agentId)
            throw new common_1.BadRequestException("Provide propertyId or agentId");
        if (dto.propertyId && dto.agentId)
            throw new common_1.BadRequestException("Provide only one of propertyId or agentId");
        if (dto.propertyId) {
            const exists = await this.prisma.property.findUnique({
                where: { id: dto.propertyId },
            });
            if (!exists)
                throw new common_1.NotFoundException("Property not found");
        }
        if (dto.agentId) {
            const exists = await this.prisma.agent.findUnique({
                where: { id: dto.agentId },
            });
            if (!exists)
                throw new common_1.NotFoundException("Agent not found");
        }
        return this.prisma.review.create({
            data: {
                userId,
                propertyId: dto.propertyId,
                agentId: dto.agentId,
                rating: dto.rating,
                comment: dto.comment,
            },
            include: {
                user: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }
    async getMyReviews(userId) {
        return this.prisma.review.findMany({
            where: { userId },
            include: {
                property: { select: { id: true, title: true } },
                agent: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    async getPropertyReviews(propertyId) {
        return this.prisma.review.findMany({
            where: { propertyId },
            include: {
                user: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    async getAgentReviews(agentId) {
        return this.prisma.review.findMany({
            where: { agentId },
            include: {
                user: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    async delete(userId, id) {
        const review = await this.prisma.review.findUnique({ where: { id } });
        if (!review || review.userId !== userId)
            throw new common_1.NotFoundException("Review not found");
        await this.prisma.review.delete({ where: { id } });
        return { message: "Review deleted" };
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map