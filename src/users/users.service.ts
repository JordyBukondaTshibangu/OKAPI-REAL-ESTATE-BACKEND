import { Injectable, NotFoundException } from "@nestjs/common";
import { unlink } from "fs/promises";
import { join } from "path";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateUserDto } from "./dto/update-user.dto";

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phoneNumber: true,
  profileImage: true,
  createdAt: true,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: USER_SELECT,
    });
  }

  async updateAvatar(userId: string, relativePath: string) {
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

  async removeAvatar(userId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profileImage: true },
    });
    if (!existing?.profileImage) throw new NotFoundException("No profile image to remove");
    await this.deleteFile(existing.profileImage);
    return this.prisma.user.update({
      where: { id: userId },
      data: { profileImage: null },
      select: USER_SELECT,
    });
  }

  async deleteMe(userId: string) {
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

  private async deleteFile(relativePath: string) {
    const fullPath = join(process.cwd(), relativePath);
    await unlink(fullPath).catch(() => {});
  }
}
