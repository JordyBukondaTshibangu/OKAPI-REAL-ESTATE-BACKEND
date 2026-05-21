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
exports.AgenciesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AgenciesService = class AgenciesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll({ page, limit, search, name, language, sortBy, sortOrder, }) {
        const skip = (page - 1) * limit;
        const order = sortOrder ?? "asc";
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { tagline: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { address: { contains: search, mode: "insensitive" } },
            ];
        }
        if (name)
            where.name = { contains: name, mode: "insensitive" };
        if (language)
            where.languages = { has: language };
        const orderBy = sortBy
            ? { [sortBy]: order }
            : { createdAt: "desc" };
        const [data, total] = await this.prisma.$transaction([
            this.prisma.agency.findMany({
                skip,
                take: limit,
                where,
                orderBy,
                include: { agents: true },
            }),
            this.prisma.agency.count({ where }),
        ]);
        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(id) {
        const agency = await this.prisma.agency.findUnique({
            where: { id },
            include: { agents: true, properties: true },
        });
        if (!agency)
            throw new common_1.NotFoundException("Agency not found");
        return agency;
    }
    create(dto) {
        return this.prisma.agency.create({ data: dto });
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.agency.update({ where: { id }, data: dto });
    }
    async remove(id) {
        await this.findOne(id);
        await this.prisma.agency.delete({ where: { id } });
        return { message: "Agency deleted" };
    }
};
exports.AgenciesService = AgenciesService;
exports.AgenciesService = AgenciesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AgenciesService);
//# sourceMappingURL=agencies.service.js.map