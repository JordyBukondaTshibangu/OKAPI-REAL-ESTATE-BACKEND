import { Injectable, Logger, NotFoundException, OnModuleInit, OnModuleDestroy, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { CreateAlertDto } from "./dto/create-alert.dto";
import { UpdateAlertDto } from "./dto/update-alert.dto";

@Injectable()
export class AlertsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AlertsService.name);
  private alertTimer: NodeJS.Timeout | null = null;

  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  onModuleInit() {
    // Fire at the top of every hour (no external scheduler package needed)
    const now = new Date();
    const msToNextHour =
      (60 - now.getMinutes()) * 60_000 -
      now.getSeconds() * 1_000 -
      now.getMilliseconds();

    setTimeout(() => {
      void this.processPropertyAlerts();
      this.alertTimer = setInterval(
        () => void this.processPropertyAlerts(),
        60 * 60_000,
      );
    }, msToNextHour);
  }

  onModuleDestroy() {
    if (this.alertTimer) clearInterval(this.alertTimer);
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────────

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

  /**
   * Creates an alert pre-filled from a saved property.
   * If the user already has an alert matching the same suburb + category + listingType,
   * returns the existing alert instead of creating a duplicate.
   */
  async createFromFavourite(userId: string, propertyId: string) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException("Property not found");

    // Map property listingType (sale|rent) to alert convention (for-sale|for-rent)
    const alertListingType =
      property.listingType === "sale" ? "for-sale"
      : property.listingType === "rent" ? "for-rent"
      : null;

    // Avoid duplicates: find existing alert with same key fields
    const existing = await this.prisma.alert.findFirst({
      where: {
        userId,
        ...(property.suburb ? { suburb: { equals: property.suburb, mode: "insensitive" } } : {}),
        ...(property.category ? { category: property.category } : {}),
        ...(alertListingType ? { listingType: alertListingType } : {}),
      },
    });
    if (existing) return { alert: existing, created: false };

    // Build a human-readable name
    const catMap: Record<string, string> = {
      apartment: "Appartement", studio: "Studio", villa: "Villa",
      townhouse: "Maison de ville", land: "Terrain", office: "Bureau",
      shop: "Commerce", warehouse: "Entrepôt",
    };
    const nameParts = [
      property.category ? (catMap[property.category] ?? property.category) : null,
      property.suburb ?? property.city,
      alertListingType === "for-rent" ? "à louer" : alertListingType === "for-sale" ? "à vendre" : null,
    ].filter(Boolean);

    const alert = await this.prisma.alert.create({
      data: {
        userId,
        name: nameParts.join(" · ") || "Alerte propriété",
        suburb: property.suburb,
        city: property.city,
        category: property.category,
        listingType: alertListingType,
        maxPrice: property.price ? Math.round(property.price * 1.3) : undefined,
        active: true,
      },
    });
    return { alert, created: true };
  }

  async getMatchingProperties(userId: string, alertId: string) {
    const alert = await this.prisma.alert.findUnique({ where: { id: alertId } });
    if (!alert || alert.userId !== userId)
      throw new NotFoundException("Alert not found");
    return this.buildPropertyQuery(alert);
  }

  // ─── Alert job ────────────────────────────────────────────────────────────

  /** Runs at the top of every hour — finds new matching listings and emails users. */
  async processPropertyAlerts() {
    this.logger.log("⏰ Running property alert cron…");

    type AlertWithUser = {
      id: string; userId: string; name: string;
      listingType: string | null; category: string | null;
      city: string | null; suburb: string | null;
      minPrice: number | null; maxPrice: number | null;
      minBedrooms: number | null; maxBedrooms: number | null;
      active: boolean; lastSentAt: Date | null; createdAt: Date;
      user: { email: string; firstName: string };
    };
    // lastSentAt exists in DB via raw migration — re-run `prisma generate` locally to remove cast
    const searches = (await this.prisma.alert.findMany({
      where: { active: true },
      include: { user: { select: { email: true, firstName: true } } },
    })) as unknown as AlertWithUser[];

    let sent = 0;
    for (const alert of searches) {
      try {
        const matches = await this.buildPropertyQuery(alert);
        if (matches.length === 0) continue;

        await this.mail.sendPropertyAlert(
          alert.user.email,
          alert.user.firstName,
          alert.name,
          this.buildCriteriaLabel(alert),
          matches.map((p) => ({
            id: p.id,
            title: p.title,
            price: p.price,
            city: p.city,
            suburb: p.suburb,
            listingType: p.listingType,
            category: p.category,
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms,
            verified: p.verified,
            gallery: p.gallery,
            whatsappNumber:
              (p.agent as any)?.whatsappNumber ??
              (p.agent as any)?.phoneNumber ??
              null,
            period: p.period,
          })),
        );

        // Use raw query because Prisma client may not yet have lastSentAt
        // in its generated types (run `prisma generate` after migration).
        await this.prisma.$executeRaw`
          UPDATE "Alert" SET "lastSentAt" = NOW() WHERE id = ${alert.id}
        `;

        sent++;
      } catch (err) {
        this.logger.error(`Alert ${alert.id} failed: ${err}`);
      }
    }

    this.logger.log(`✅ Property alerts: ${sent}/${searches.length} emails sent`);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async buildPropertyQuery(alert: {
    listingType?: string | null;
    category?: string | null;
    city?: string | null;
    suburb?: string | null;
    minPrice?: number | null;
    maxPrice?: number | null;
    minBedrooms?: number | null;
    maxBedrooms?: number | null;
    lastSentAt?: Date | null; // exists in DB; added via raw migration
    createdAt?: Date;
  }) {
    // Alerts store "for-sale"/"for-rent"; properties store "sale"/"rent"
    const propertyListingType =
      alert.listingType === "for-sale"
        ? "sale"
        : alert.listingType === "for-rent"
          ? "rent"
          : alert.listingType ?? undefined;

    // Only notify about listings published AFTER the alert was created (floor),
    // or after the last notification was sent (subsequent runs).
    // Using createdAt as floor prevents notifying about listings that already
    // existed before the user subscribed.
    const since = alert.lastSentAt ?? alert.createdAt;

    const priceFilter: { gte?: number; lte?: number } = {};
    if (alert.minPrice != null) priceFilter.gte = alert.minPrice;
    if (alert.maxPrice != null) priceFilter.lte = alert.maxPrice;

    return this.prisma.property.findMany({
      where: {
        status: "LIVE",
        isPublished: true,
        publishedAt: { gte: since },
        ...(alert.suburb && {
          suburb: { contains: alert.suburb, mode: "insensitive" },
        }),
        ...(alert.city && {
          city: { contains: alert.city, mode: "insensitive" },
        }),
        ...(propertyListingType && { listingType: propertyListingType }),
        ...(alert.category && { category: alert.category }),
        ...(alert.minBedrooms != null && {
          bedrooms: { gte: alert.minBedrooms },
        }),
        ...(alert.maxBedrooms != null && {
          bedrooms: { lte: alert.maxBedrooms },
        }),
        ...(Object.keys(priceFilter).length > 0 && { price: priceFilter }),
      },
      include: {
        agent: { select: { phoneNumber: true, whatsappNumber: true } },
      },
      take: 5,
      orderBy: { publishedAt: "desc" },
    });
  }

  private buildCriteriaLabel(alert: {
    listingType?: string | null;
    category?: string | null;
    city?: string | null;
    suburb?: string | null;
    minPrice?: number | null;
    maxPrice?: number | null;
    minBedrooms?: number | null;
  }): string {
    const parts: string[] = [];

    const catMap: Record<string, string> = {
      apartment: "Appartement",
      studio: "Studio",
      villa: "Villa",
      townhouse: "Maison de ville",
      land: "Terrain",
      office: "Bureau",
      shop: "Commerce",
      warehouse: "Entrepôt",
    };
    if (alert.category) parts.push(catMap[alert.category] ?? alert.category);
    if (alert.suburb) parts.push(alert.suburb);
    else if (alert.city) parts.push(alert.city);
    if (alert.listingType === "for-rent") parts.push("à louer");
    else if (alert.listingType === "for-sale") parts.push("à vendre");
    if (alert.minBedrooms) parts.push(`${alert.minBedrooms}+ ch.`);
    if (alert.maxPrice) parts.push(`≤ ${alert.maxPrice.toLocaleString("fr-FR")} $`);
    else if (alert.minPrice) parts.push(`≥ ${alert.minPrice.toLocaleString("fr-FR")} $`);

    return parts.join(" · ") || "Toutes annonces";
  }
}
