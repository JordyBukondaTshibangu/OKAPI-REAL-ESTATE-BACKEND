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
exports.AgentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const uploads_service_1 = require("../uploads/uploads.service");
let AgentsService = class AgentsService {
    prisma;
    uploads;
    constructor(prisma, uploads) {
        this.prisma = prisma;
        this.uploads = uploads;
    }
    resolvePhotoUrl(key) {
        if (key.startsWith("http"))
            return key;
        return (0, uploads_service_1.toR2Url)(key);
    }
    withPhotoUrl(agent) {
        return { ...agent, photo: this.resolvePhotoUrl(agent.photo) };
    }
    async findAll({ page, limit, search, name, title, specialization, language, nationality, sortBy, sortOrder, }) {
        const skip = (page - 1) * limit;
        const order = sortOrder ?? "asc";
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { title: { contains: search, mode: "insensitive" } },
                { specialization: { contains: search, mode: "insensitive" } },
                { bio: { contains: search, mode: "insensitive" } },
                { nationality: { contains: search, mode: "insensitive" } },
            ];
        }
        if (name)
            where.name = { contains: name, mode: "insensitive" };
        if (title)
            where.title = { contains: title, mode: "insensitive" };
        if (specialization)
            where.specialization = { contains: specialization, mode: "insensitive" };
        if (language)
            where.languages = { has: language };
        if (nationality)
            where.nationality = { equals: nationality, mode: "insensitive" };
        const orderBy = sortBy === "agency"
            ? { agency: { name: order } }
            : sortBy
                ? { [sortBy]: order }
                : { createdAt: "desc" };
        const [data, total] = await this.prisma.$transaction([
            this.prisma.agent.findMany({
                skip,
                take: limit,
                where,
                orderBy,
                include: { agency: true, areasOfExpertise: true, trackRecord: true },
            }),
            this.prisma.agent.count({ where }),
        ]);
        return {
            data: data.map((agent) => this.withPhotoUrl(agent)),
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(id) {
        const agent = await this.prisma.agent.findUnique({
            where: { id },
            include: {
                agency: true,
                areasOfExpertise: true,
                trackRecord: true,
                properties: true,
            },
        });
        if (!agent)
            throw new common_1.NotFoundException("Agent not found");
        return this.withPhotoUrl(agent);
    }
    async create(dto) {
        const agent = await this.prisma.agent.create({ data: dto });
        return this.withPhotoUrl(agent);
    }
    async update(id, dto) {
        await this.findOne(id);
        const agent = await this.prisma.agent.update({ where: { id }, data: dto });
        return this.withPhotoUrl(agent);
    }
    async updatePhoto(id, tmpKey) {
        const agent = await this.prisma.agent.findUnique({
            where: { id },
            select: { photo: true },
        });
        if (!agent)
            throw new common_1.NotFoundException("Agent not found");
        if (agent.photo && !agent.photo.startsWith("http")) {
            await this.uploads.deleteKey(agent.photo).catch(() => { });
        }
        const newKey = await this.uploads.promoteToPrefix(tmpKey, `agents/${id}`);
        const updated = await this.prisma.agent.update({
            where: { id },
            data: { photo: newKey },
            include: { agency: true, areasOfExpertise: true, trackRecord: true },
        });
        return this.withPhotoUrl(updated);
    }
    async remove(id) {
        await this.findOne(id);
        await this.prisma.agent.delete({ where: { id } });
        return { message: "Agent deleted" };
    }
};
exports.AgentsService = AgentsService;
exports.AgentsService = AgentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        uploads_service_1.UploadsService])
], AgentsService);
//# sourceMappingURL=agents.service.js.map