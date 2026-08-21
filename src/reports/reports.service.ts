import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateReportDto } from "./dto/create-report.dto";
import { ReportStatus, ListingStatus } from "@prisma/client";
import { subDays } from "date-fns";

/** Number of pending reports within 30 days that triggers auto-hide. */
const AUTO_HIDE_THRESHOLD = 3;

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // ── User: submit a report ───────────────────────────────────────────────────

  async create(
    propertyId: string,
    dto: CreateReportDto,
    userId?: string,
  ) {
    // Verify property exists
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true },
    });
    if (!property) throw new NotFoundException("Property not found");

    const report = await this.prisma.report.create({
      data: {
        propertyId,
        userId: userId ?? null,
        reason: dto.reason,
        description: dto.description ?? null,
      },
    });

    // Fire-and-forget threshold check (don't block the response)
    this.checkReportThreshold(propertyId).catch(() => {});

    return report;
  }

  // ── Threshold auto-hide ─────────────────────────────────────────────────────

  private async checkReportThreshold(propertyId: string) {
    const reportCount = await this.prisma.report.count({
      where: {
        propertyId,
        status: ReportStatus.PENDING,
        createdAt: { gte: subDays(new Date(), 30) },
      },
    });

    if (reportCount >= AUTO_HIDE_THRESHOLD) {
      await this.prisma.property.update({
        where: { id: propertyId },
        data: {
          isPublished: false,
          status: ListingStatus.HIDDEN,
        },
      });
    }
  }

  // ── Admin: list reports ─────────────────────────────────────────────────────

  async findAll(status?: ReportStatus) {
    return this.prisma.report.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            suburb: true,
            status: true,
            isPublished: true,
            agent: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  /** Returns reports grouped by property with counts and reason summaries. */
  async findGrouped() {
    const reports = await this.prisma.report.findMany({
      where: { status: ReportStatus.PENDING },
      orderBy: { createdAt: "desc" },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            suburb: true,
            status: true,
            isPublished: true,
            agent: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Group by propertyId
    const map = new Map<string, {
      property: (typeof reports)[0]["property"];
      count: number;
      reasons: Record<string, number>;
      reportIds: string[];
      isAutoHidden: boolean;
    }>();

    for (const r of reports) {
      const existing = map.get(r.propertyId);
      if (existing) {
        existing.count++;
        existing.reasons[r.reason] = (existing.reasons[r.reason] ?? 0) + 1;
        existing.reportIds.push(r.id);
      } else {
        map.set(r.propertyId, {
          property: r.property,
          count: 1,
          reasons: { [r.reason]: 1 },
          reportIds: [r.id],
          isAutoHidden: !r.property.isPublished && r.property.status === "HIDDEN",
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }

  // ── Admin: resolve a report ─────────────────────────────────────────────────

  async resolve(
    reportId: string,
    action: "dismiss" | "warn_agent" | "delete_listing",
    adminId: string,
  ) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: { property: { select: { id: true, agentId: true } } },
    });
    if (!report) throw new NotFoundException("Report not found");

    const propertyId = report.propertyId;

    if (action === "dismiss") {
      // Mark all pending reports for this property as dismissed, restore listing
      await this.prisma.report.updateMany({
        where: { propertyId, status: ReportStatus.PENDING },
        data: { status: ReportStatus.DISMISSED, resolvedBy: adminId, resolvedAt: new Date() },
      });
      await this.prisma.property.update({
        where: { id: propertyId },
        data: { isPublished: true, status: ListingStatus.LIVE },
      });
    } else if (action === "warn_agent") {
      // Mark reports reviewed, restore listing
      await this.prisma.report.updateMany({
        where: { propertyId, status: ReportStatus.PENDING },
        data: { status: ReportStatus.AGENT_WARNED, resolvedBy: adminId, resolvedAt: new Date() },
      });
      await this.prisma.property.update({
        where: { id: propertyId },
        data: { isPublished: true, status: ListingStatus.LIVE },
      });
    } else if (action === "delete_listing") {
      // Mark reports, hide listing permanently
      await this.prisma.report.updateMany({
        where: { propertyId, status: ReportStatus.PENDING },
        data: { status: ReportStatus.LISTING_HIDDEN, resolvedBy: adminId, resolvedAt: new Date() },
      });
      await this.prisma.property.update({
        where: { id: propertyId },
        data: { isPublished: false, status: ListingStatus.REJECTED },
      });
    }

    return { ok: true, action, propertyId };
  }
}
