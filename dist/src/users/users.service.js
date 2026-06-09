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
const prisma_service_1 = require("../prisma/prisma.service");
const uploads_service_1 = require("../uploads/uploads.service");
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
    uploads;
    constructor(prisma, uploads) {
        this.prisma = prisma;
        this.uploads = uploads;
    }
    resolveAvatarUrl(key) {
        if (!key)
            return null;
        if (key.startsWith("http"))
            return key;
        return (0, uploads_service_1.toR2Url)(key);
    }
    withAvatarUrl(user) {
        return { ...user, profileImage: this.resolveAvatarUrl(user.profileImage) };
    }
    async findMe(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: USER_SELECT,
        });
        if (!user)
            throw new common_1.NotFoundException("User not found");
        return this.withAvatarUrl(user);
    }
    async updateMe(userId, dto) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: dto,
            select: USER_SELECT,
        });
        return this.withAvatarUrl(user);
    }
    async updateAvatar(userId, tmpKey) {
        const existing = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { profileImage: true },
        });
        if (existing?.profileImage && !existing.profileImage.startsWith("http")) {
            await this.uploads.deleteKey(existing.profileImage).catch(() => { });
        }
        const newKey = await this.uploads.promoteToPrefix(tmpKey, `users/${userId}`);
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { profileImage: newKey },
            select: USER_SELECT,
        });
        return this.withAvatarUrl(user);
    }
    async removeAvatar(userId) {
        const existing = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { profileImage: true },
        });
        if (!existing?.profileImage)
            throw new common_1.NotFoundException("No profile image to remove");
        if (!existing.profileImage.startsWith("http")) {
            await this.uploads.deleteKey(existing.profileImage).catch(() => { });
        }
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { profileImage: null },
            select: USER_SELECT,
        });
        return this.withAvatarUrl(user);
    }
    async deleteMe(userId) {
        const existing = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { profileImage: true },
        });
        if (existing?.profileImage && !existing.profileImage.startsWith("http")) {
            await this.uploads.deleteKey(existing.profileImage).catch(() => { });
        }
        await this.prisma.user.delete({ where: { id: userId } });
        return { message: "Account deleted" };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        uploads_service_1.UploadsService])
], UsersService);
//# sourceMappingURL=users.service.js.map