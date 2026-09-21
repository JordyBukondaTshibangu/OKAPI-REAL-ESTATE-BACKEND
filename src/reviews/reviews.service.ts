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

  // ─── Grade calculation ──────────────────────────────────────────────────────

  /**
   * Recomputes the agent's grade from their visible reviews and active listings,
   * then persists it. Called after every review create/delete.
   */
  private async recalculateAgentGrade(agentId: string): Promise<void> {
    const [visibleReviews, allReviews, activeListings, agent] = await Promise.all([
      // Only approved (visible) reviews count toward grade and displayed rating
      this.prisma.review.findMany({
        where: { agentId, isVisible: true },
        select: { rating: true },
      }),
      // All reviews (including pending) count for the public ratingsCount display
      this.prisma.review.count({ where: { agentId } }),
      this.prisma.property.count({
        where: { agentId, status: 'LIVE', isPublished: true },
      }),
      this.prisma.agent.findUnique({
        where: { id: agentId },
        select: { createdAt: true, isSuspended: true, suspendedAt: true },
      }),
    ]);

    if (!agent) return;

    const visibleCount = visibleReviews.length;
    const avg =
      visibleCount > 0
        ? visibleReviews.reduce((s, r) => s + r.rating, 0) / visibleCount
        : 0;

    const monthsOnPlatform =
      (Date.now() - agent.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30);

    let grade: "NOUVEAU" | "ACTIF" | "FIABLE" | "EXPERT" = "NOUVEAU";

    if (
      visibleCount >= 25 &&
      avg >= 4.5 &&
      activeListings >= 10 &&
      monthsOnPlatform >= 3 &&
      !agent.isSuspended &&
      !agent.suspendedAt
    ) {
      grade = "EXPERT";
    } else if (visibleCount >= 10 && avg >= 4.0 && activeListings >= 5) {
      grade = "FIABLE";
    } else if (visibleCount >= 3 && avg >= 3.5 && activeListings >= 1) {
      grade = "ACTIF";
    }

    await this.prisma.agent.update({
      where: { id: agentId },
      data: {
        grade,
        rating: visibleCount > 0 ? Math.round(avg * 10) / 10 : 0,
        // Show total review count (including pending) so users see their review registered
        ratingsCount: allReviews,
      },
    });
  }

  // ─── CRUD ───────────────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateReviewDto) {
    if (!dto.propertyId && !dto.agentId)
      throw new BadRequestException("Provide propertyId or agentId");
    if (dto.propertyId && dto.agentId)
      throw new BadRequestException(
        "Provide only one of propertyId or agentId",
      );

    if (dto.propertyId) {
      const exists = await this.prisma.property.findUnique({
        where: { id: dto.propertyId },
      });
      if (!exists) throw new NotFoundException("Property not found");

      const duplicate = await this.prisma.review.findUnique({
        where: { userId_propertyId: { userId, propertyId: dto.propertyId } },
      });
      if (duplicate)
        throw new BadRequestException(
          "Vous avez déjà laissé un avis pour ce bien.",
        );
    }

    if (dto.agentId) {
      const exists = await this.prisma.agent.findUnique({
        where: { id: dto.agentId },
      });
      if (!exists) throw new NotFoundException("Agent not found");

      const duplicate = await this.prisma.review.findUnique({
        where: { userId_agentId: { userId, agentId: dto.agentId } },
      });
      if (duplicate)
        throw new BadRequestException(
          "Vous avez déjà laissé un avis pour cet agent.",
        );
    }

    const review = await this.prisma.review.create({
      data: {
        userId,
        propertyId: dto.propertyId,
        agentId: dto.agentId,
        rating: dto.rating,
        ratingReactivite: dto.ratingReactivite,
        ratingHonnetete: dto.ratingHonnetete,
        ratingProfessionnalisme: dto.ratingProfessionnalisme,
        comment: dto.comment,
        // New reviews are pending moderation — admin sets isVisible = true
        isVisible: false,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Recalculate grade in background (only visible reviews count, so no change yet,
    // but keeps the rating/ratingsCount in sync for when the admin approves later)
    if (dto.agentId) {
      void this.recalculateAgentGrade(dto.agentId).catch(() => {});
    }

    return review;
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
      where: { propertyId, isVisible: true },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getAgentReviews(agentId: string) {
    return this.prisma.review.findMany({
      where: { agentId, isVisible: true },
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

    // Recalculate grade after deletion
    if (review.agentId) {
      void this.recalculateAgentGrade(review.agentId).catch(() => {});
    }

    return { message: "Review deleted" };
  }

  // ─── Admin ──────────────────────────────────────────────────────────────────

  /** Admin: approve a review (make it visible) */
  async approve(reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!review) throw new NotFoundException("Review not found");

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: { isVisible: true },
    });

    if (review.agentId) {
      void this.recalculateAgentGrade(review.agentId).catch(() => {});
    }

    return updated;
  }

  /** Admin: reject / hide a review */
  async reject(reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!review) throw new NotFoundException("Review not found");

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: { isVisible: false },
    });

    if (review.agentId) {
      void this.recalculateAgentGrade(review.agentId).catch(() => {});
    }

    return updated;
  }

  /** Admin: list all pending (unmoderated) reviews */
  async getPendingReviews() {
    return this.prisma.review.findMany({
      where: { isVisible: false },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        agent: { select: { id: true, name: true } },
        property: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
