import { Injectable, NotFoundException } from "@nestjs/common";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.service";
import { toR2Url, UploadsService } from "../uploads/uploads.service";
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
  constructor(
    private prisma: PrismaService,
    private uploads: UploadsService,
    private mail: MailService,
  ) {}

  private resolveAvatarUrl(key: string | null): string | null {
    if (!key) return null;
    if (key.startsWith("http")) return key;
    return toR2Url(key);
  }

  private withAvatarUrl<T extends { profileImage: string | null }>(user: T): T {
    return { ...user, profileImage: this.resolveAvatarUrl(user.profileImage) };
  }

  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException("User not found");
    return this.withAvatarUrl(user);
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: USER_SELECT,
    });
    return this.withAvatarUrl(user);
  }

  async updateAvatar(userId: string, tmpKey: string) {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profileImage: true },
    });
    if (existing?.profileImage && !existing.profileImage.startsWith("http")) {
      await this.uploads.deleteKey(existing.profileImage).catch(() => {});
    }

    const newKey = await this.uploads.promoteToPrefix(tmpKey, `users/${userId}`);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { profileImage: newKey },
      select: USER_SELECT,
    });
    return this.withAvatarUrl(user);
  }

  async removeAvatar(userId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profileImage: true },
    });
    if (!existing?.profileImage) throw new NotFoundException("No profile image to remove");
    if (!existing.profileImage.startsWith("http")) {
      await this.uploads.deleteKey(existing.profileImage).catch(() => {});
    }
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { profileImage: null },
      select: USER_SELECT,
    });
    return this.withAvatarUrl(user);
  }

  async deleteMe(userId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, profileImage: true },
    });
    if (existing?.profileImage && !existing.profileImage.startsWith("http")) {
      await this.uploads.deleteKey(existing.profileImage).catch(() => {});
    }
    await this.prisma.user.delete({ where: { id: userId } });
    if (existing) {
      void this.mail.sendAccountDeleted(existing.email, existing.firstName);
    }
    return { message: "Account deleted" };
  }
}
