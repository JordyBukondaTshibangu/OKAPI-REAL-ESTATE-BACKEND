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
exports.AlertsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AlertsService = class AlertsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, dto) {
        return this.prisma.alert.create({ data: { userId, ...dto } });
    }
    async getMyAlerts(userId) {
        return this.prisma.alert.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
    }
    async update(userId, id, dto) {
        const alert = await this.prisma.alert.findUnique({ where: { id } });
        if (!alert || alert.userId !== userId)
            throw new common_1.NotFoundException("Alert not found");
        return this.prisma.alert.update({ where: { id }, data: dto });
    }
    async delete(userId, id) {
        const alert = await this.prisma.alert.findUnique({ where: { id } });
        if (!alert || alert.userId !== userId)
            throw new common_1.NotFoundException("Alert not found");
        await this.prisma.alert.delete({ where: { id } });
        return { message: "Alert deleted" };
    }
    async getMatchingProperties(userId, alertId) {
        const alert = await this.prisma.alert.findUnique({
            where: { id: alertId },
        });
        if (!alert || alert.userId !== userId)
            throw new common_1.NotFoundException("Alert not found");
        return this.prisma.property.findMany({
            where: {
                ...(alert.listingType && { listingType: alert.listingType }),
                ...(alert.category && { category: alert.category }),
                ...(alert.city && { city: { contains: alert.city, mode: "insensitive" } }),
                ...(alert.suburb && { suburb: { contains: alert.suburb, mode: "insensitive" } }),
                ...(alert.minPrice !== null && { price: { gte: alert.minPrice ?? undefined } }),
                ...(alert.maxPrice !== null && { price: { lte: alert.maxPrice ?? undefined } }),
                ...(alert.minBedrooms !== null && { bedrooms: { gte: alert.minBedrooms ?? undefined } }),
                ...(alert.maxBedrooms !== null && { bedrooms: { lte: alert.maxBedrooms ?? undefined } }),
            },
            orderBy: { createdAt: "desc" },
        });
    }
};
exports.AlertsService = AlertsService;
exports.AlertsService = AlertsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AlertsService);
//# sourceMappingURL=alerts.service.js.map