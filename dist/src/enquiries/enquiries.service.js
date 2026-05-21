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
exports.EnquiriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let EnquiriesService = class EnquiriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, dto) {
        const property = await this.prisma.property.findUnique({
            where: { id: dto.propertyId },
        });
        if (!property)
            throw new common_1.NotFoundException("Property not found");
        return this.prisma.enquiry.create({
            data: { userId, propertyId: dto.propertyId, message: dto.message },
            include: { property: { select: { id: true, title: true, city: true } } },
        });
    }
    async getMyEnquiries(userId) {
        return this.prisma.enquiry.findMany({
            where: { userId },
            include: { property: { select: { id: true, title: true, city: true } } },
            orderBy: { createdAt: "desc" },
        });
    }
    async getEnquiriesForProperty(propertyId) {
        return this.prisma.enquiry.findMany({
            where: { propertyId },
            include: {
                user: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    async delete(userId, id) {
        const enquiry = await this.prisma.enquiry.findUnique({ where: { id } });
        if (!enquiry || enquiry.userId !== userId)
            throw new common_1.NotFoundException("Enquiry not found");
        await this.prisma.enquiry.delete({ where: { id } });
        return { message: "Enquiry deleted" };
    }
};
exports.EnquiriesService = EnquiriesService;
exports.EnquiriesService = EnquiriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EnquiriesService);
//# sourceMappingURL=enquiries.service.js.map