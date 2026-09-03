import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateFavoriteDto } from "./dto/create-favorite.dto";

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  /** Mirrors PropertiesService.toGalleryUrl — converts a raw R2 key to a public CDN URL. */
  private toGalleryUrl(key: string): string {
    if (/^https?:\/\//.test(key)) return key;
    const base = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");
    return `${base}/${key.replace(/^\//, "")}`;
  }

  async addFavorite(userId: string, dto: CreateFavoriteDto) {
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });
    if (!property) throw new NotFoundException("Property not found");

    try {
      return await this.prisma.favorite.create({
        data: { userId, propertyId: dto.propertyId },
        include: { property: true },
      });
    } catch {
      throw new ConflictException("Property already in favorites");
    }
  }

  async removeFavorite(userId: string, propertyId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: { userId_propertyId: { userId, propertyId } },
    });
    if (!favorite) throw new NotFoundException("Favorite not found");
    await this.prisma.favorite.delete({
      where: { userId_propertyId: { userId, propertyId } },
    });
    return { message: "Removed from favorites" };
  }

  async getMyFavorites(userId: string) {
    const rows = await this.prisma.favorite.findMany({
      where: { userId },
      include: {
        property: {
          include: { agent: { select: { whatsappNumber: true, phoneNumber: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Convert raw R2 storage keys in gallery[] to public CDN URLs,
    // exactly as PropertiesService does for every other endpoint.
    return rows.map((fav) => ({
      ...fav,
      property: {
        ...fav.property,
        gallery: fav.property.gallery.map((key) => this.toGalleryUrl(key)),
      },
    }));
  }
}
