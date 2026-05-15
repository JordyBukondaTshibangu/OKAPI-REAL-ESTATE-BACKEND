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
    return this.prisma.favorite.findMany({
      where: { userId },
      include: { property: true },
      orderBy: { createdAt: "desc" },
    });
  }
}
