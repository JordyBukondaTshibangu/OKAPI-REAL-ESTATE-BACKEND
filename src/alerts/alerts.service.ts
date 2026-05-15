import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAlertDto } from "./dto/create-alert.dto";
import { UpdateAlertDto } from "./dto/update-alert.dto";

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateAlertDto) {
    return this.prisma.alert.create({ data: { userId, ...dto } });
  }

  async getMyAlerts(userId: string) {
    return this.prisma.alert.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async update(userId: string, id: string, dto: UpdateAlertDto) {
    const alert = await this.prisma.alert.findUnique({ where: { id } });
    if (!alert || alert.userId !== userId)
      throw new NotFoundException("Alert not found");
    return this.prisma.alert.update({ where: { id }, data: dto });
  }

  async delete(userId: string, id: string) {
    const alert = await this.prisma.alert.findUnique({ where: { id } });
    if (!alert || alert.userId !== userId)
      throw new NotFoundException("Alert not found");
    await this.prisma.alert.delete({ where: { id } });
    return { message: "Alert deleted" };
  }

  async getMatchingProperties(userId: string, alertId: string) {
    const alert = await this.prisma.alert.findUnique({
      where: { id: alertId },
    });
    if (!alert || alert.userId !== userId)
      throw new NotFoundException("Alert not found");

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
}
