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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const prisma_service_1 = require("../prisma/prisma.service");
const USER_SELECT = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    phoneNumber: true,
    profileImage: true,
    createdAt: true,
};
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findMe(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: USER_SELECT,
        });
        if (!user)
            throw new common_1.NotFoundException("User not found");
        return user;
    }
    async updateMe(userId, dto) {
        return this.prisma.user.update({
            where: { id: userId },
            data: dto,
            select: USER_SELECT,
        });
    }
    async updateAvatar(userId, relativePath) {
        const existing = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { profileImage: true },
        });
        if (existing?.profileImage) {
            await this.deleteFile(existing.profileImage);
        }
        return this.prisma.user.update({
            where: { id: userId },
            data: { profileImage: relativePath },
            select: USER_SELECT,
        });
    }
    async removeAvatar(userId) {
        const existing = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { profileImage: true },
        });
        if (!existing?.profileImage)
            throw new common_1.NotFoundException("No profile image to remove");
        await this.deleteFile(existing.profileImage);
        return this.prisma.user.update({
            where: { id: userId },
            data: { profileImage: null },
            select: USER_SELECT,
        });
    }
    async deleteMe(userId) {
        const existing = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { profileImage: true },
        });
        if (existing?.profileImage) {
            await this.deleteFile(existing.profileImage);
        }
        await this.prisma.user.delete({ where: { id: userId } });
        return { message: "Account deleted" };
    }
    async deleteFile(relativePath) {
        const fullPath = (0, path_1.join)(process.cwd(), relativePath);
        await (0, promises_1.unlink)(fullPath).catch(() => { });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map