import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateReviewDto } from "./dto/create-review.dto";

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto) {
    if (!dto.propertyId && !dto.agentId)
      throw new BadRequestException("Provide propertyId or agentId");
    if (dto.propertyId && dto.agentId)
      throw new BadRequestException("Provide only one of propertyId or agentId");

    if (dto.propertyId) {
      const exists = await this.prisma.property.findUnique({
        where: { id: dto.propertyId },
      });
      if (!exists) throw new NotFoundException("Property not found");
    }
    if (dto.agentId) {
      const exists = await this.prisma.agent.findUnique({
        where: { id: dto.agentId },
      });
      if (!exists) throw new NotFoundException("Agent not found");
    }

    return this.prisma.review.create({
      data: {
        userId,
        propertyId: dto.propertyId,
        agentId: dto.agentId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async getMyReviews(userId: string) {
    return this.prisma.review.findMany({
      where: { userId },
      include: {
        property: { select: { id: true, title: true } },
        agent: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getPropertyReviews(propertyId: string) {
    return this.prisma.review.findMany({
      where: { propertyId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getAgentReviews(agentId: string) {
    return this.prisma.review.findMany({
      where: { agentId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async delete(userId: string, id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review || review.userId !== userId)
      throw new NotFoundException("Review not found");
    await this.prisma.review.delete({ where: { id } });
    return { message: "Review deleted" };
  }
}
