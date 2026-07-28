import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { SUBSCRIPTION_PLANS, generateSubscriptionReference } from "./subscription.constants";
import {
  CreateSubscriptionRequestDto,
  RejectSubscriptionDto,
  UpdateSubscriptionScreenshotDto,
} from "./dto/create-subscription-request.dto";

const AGENT_SELECT = {
  id: true, name: true, email: true, phoneNumber: true, whatsappNumber: true,
  plan: true, subscriptionEndsAt: true,
} as const;

const SUBSCRIPTION_DURATION_DAYS = 30;

@Injectable()
export class SubscriptionsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SubscriptionsService.name);
  private dailyTimer: NodeJS.Timeout | null = null;

  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  onModuleInit() {
    // Run once at startup, then every 24 h
    const now = new Date();
    // Align to next 09:00 local time
    const msToNext9am = (() => {
      const next = new Date(now);
      next.setHours(9, 0, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      return next.getTime() - now.getTime();
    })();

    setTimeout(() => {
      void this.runDailyJobs();
      this.dailyTimer = setInterval(() => void this.runDailyJobs(), 24 * 60 * 60_000);
    }, msToNext9am);
  }

  onModuleDestroy() {
    if (this.dailyTimer) clearInterval(this.dailyTimer);
  }

  private async runDailyJobs() {
    await this.expireSubscriptions();
    await this.sendRenewalReminders();
  }

  // ── Agent: submit a subscription request ────────────────────────────────────

  async createSubscriptionRequest(agentId: string, dto: CreateSubscriptionRequestDto) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      select: AGENT_SELECT,
    });
    if (!agent) throw new NotFoundException("Agent introuvable");

    // If agent already has an active plan of same tier, warn but allow re-subscribe
    // (they may be renewing early)

    const plan = SUBSCRIPTION_PLANS.find((p) => p.tier === dto.tier);
    if (!plan) throw new BadRequestException("Plan invalide");

    // If a PENDING request already exists for this tier, return it (idempotent)
    const existing = await this.prisma.subscriptionRequest.findFirst({
      where: { agentId, tier: dto.tier as any, status: "PENDING" },
      include: { agent: { select: AGENT_SELECT } },
    });
    if (existing) return existing;

    const reference = generateSubscriptionReference(agentId, dto.tier);

    const request = await this.prisma.subscriptionRequest.create({
      data: {
        agentId,
        tier: dto.tier as any,
        amount: plan.amount,
        paymentMethod: dto.paymentMethod as any,
        paymentReference: reference,
        status: "PENDING",
      },
      include: { agent: { select: AGENT_SELECT } },
    });

    // Notify admin
    try {
      await this.mail.sendAdminNewSubscriptionRequest({
        agentName: agent.name,
        agentEmail: agent.email ?? "",
        tier: plan.label,
        amount: plan.amount,
        paymentMethod: dto.paymentMethod,
        reference,
        subscriptionRequestId: request.id,
      });
    } catch (err) {
      this.logger.warn("Admin subscription notification failed:", err);
    }

    return request;
  }

  // ── Agent: attach / update screenshot ────────────────────────────────────────

  async updateScreenshot(
    agentId: string,
    subscriptionRequestId: string,
    dto: UpdateSubscriptionScreenshotDto,
  ) {
    const request = await this.prisma.subscriptionRequest.findUnique({
      where: { id: subscriptionRequestId },
    });
    if (!request || request.agentId !== agentId) throw new ForbiddenException("Accès refusé");
    if (request.status !== "PENDING") {
      throw new BadRequestException("Cette demande ne peut plus être modifiée");
    }
    return this.prisma.subscriptionRequest.update({
      where: { id: subscriptionRequestId },
      data: { screenshotUrl: dto.screenshotUrl },
    });
  }

  // ── Agent: my subscription requests ──────────────────────────────────────────

  async getMySubscriptions(agentId: string) {
    return this.prisma.subscriptionRequest.findMany({
      where: { agentId },
      orderBy: { createdAt: "desc" },
    });
  }

  // ── Admin: pending queue ───────────────────────────────────────────────────────

  async getPendingSubscriptions() {
    return this.prisma.subscriptionRequest.findMany({
      where: { status: "PENDING" },
      include: { agent: { select: AGENT_SELECT } },
      orderBy: { createdAt: "asc" }, // FIFO
    });
  }

  async getAllSubscriptions(status?: string) {
    return this.prisma.subscriptionRequest.findMany({
      where: status ? { status: status as any } : undefined,
      include: { agent: { select: AGENT_SELECT } },
      orderBy: { createdAt: "desc" },
    });
  }

  // ── Admin: confirm ─────────────────────────────────────────────────────────────

  async confirmSubscription(subscriptionRequestId: string, adminId: string) {
    const request = await this.prisma.subscriptionRequest.findUnique({
      where: { id: subscriptionRequestId },
      include: { agent: { select: AGENT_SELECT } },
    });
    if (!request) throw new NotFoundException("Demande introuvable");
    if (request.status !== "PENDING") {
      throw new BadRequestException("Cette demande a déjà été traitée");
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime() + SUBSCRIPTION_DURATION_DAYS * 24 * 60 * 60_000);

    const [updated] = await this.prisma.$transaction([
      this.prisma.subscriptionRequest.update({
        where: { id: subscriptionRequestId },
        data: {
          status: "CONFIRMED",
          confirmedBy: adminId,
          confirmedAt: now,
          periodStart: now,
          periodEnd,
        },
      }),
      this.prisma.agent.update({
        where: { id: request.agentId },
        data: {
          plan: request.tier,
          subscriptionEndsAt: periodEnd,
          renewalReminderSentAt: null, // reset so next cycle can send reminder
        },
      }),
    ]);

    try {
      await this.mail.sendSubscriptionConfirmed({
        agentEmail: request.agent.email ?? "",
        agentName: request.agent.name,
        tier: request.tier as string,
        amount: request.amount,
        periodEnd,
      });
    } catch (err) {
      this.logger.warn("Agent subscription confirmed notification failed:", err);
    }

    return updated;
  }

  // ── Admin: reject ──────────────────────────────────────────────────────────────

  async rejectSubscription(subscriptionRequestId: string, adminId: string, dto: RejectSubscriptionDto) {
    const request = await this.prisma.subscriptionRequest.findUnique({
      where: { id: subscriptionRequestId },
      include: { agent: { select: AGENT_SELECT } },
    });
    if (!request) throw new NotFoundException("Demande introuvable");
    if (request.status !== "PENDING") {
      throw new BadRequestException("Cette demande a déjà été traitée");
    }

    const updated = await this.prisma.subscriptionRequest.update({
      where: { id: subscriptionRequestId },
      data: {
        status: "REJECTED",
        rejectionReason: dto.reason,
        confirmedBy: adminId,
        confirmedAt: new Date(),
      },
    });

    try {
      await this.mail.sendSubscriptionRejected({
        agentEmail: request.agent.email ?? "",
        agentName: request.agent.name,
        tier: request.tier as string,
        reason: dto.reason,
      });
    } catch (err) {
      this.logger.warn("Agent subscription rejected notification failed:", err);
    }

    return updated;
  }

  // ── Daily job: expire subscriptions + hide overflow listings ──────────────────

  async expireSubscriptions() {
    const now = new Date();

    const expired = await this.prisma.agent.findMany({
      where: {
        plan: { in: ["PRO", "AGENCY"] },
        subscriptionEndsAt: { lte: now },
      },
      select: { id: true, email: true, name: true, whatsappNumber: true, phoneNumber: true },
    });

    if (expired.length === 0) return;

    for (const agent of expired) {
      try {
        // Count active listings
        const activeCount = await this.prisma.property.count({
          where: { agentId: agent.id, status: "LIVE" },
        });
        const freeCap = 10;
        const overflow = Math.max(0, activeCount - freeCap);

        await this.prisma.$transaction(async (tx) => {
          // Revert agent to FREE
          await tx.agent.update({
            where: { id: agent.id },
            data: { plan: "FREE", subscriptionEndsAt: null, renewalReminderSentAt: null },
          });

          // Mark expired subscription requests
          await tx.subscriptionRequest.updateMany({
            where: { agentId: agent.id, status: "CONFIRMED" },
            data: { status: "EXPIRED" },
          });

          // Hide the oldest LIVE listings that exceed the free cap
          if (overflow > 0) {
            const toHide = await tx.property.findMany({
              where: { agentId: agent.id, status: "LIVE" },
              orderBy: { createdAt: "asc" }, // oldest first
              take: overflow,
              select: { id: true },
            });
            await tx.property.updateMany({
              where: { id: { in: toHide.map((p) => p.id) } },
              data: { status: "HIDDEN" },
            });
          }
        });

        // Email notification
        try {
          await this.mail.sendSubscriptionExpired({
            agentEmail: agent.email ?? "",
            agentName: agent.name,
            hiddenCount: overflow,
          });
        } catch { /* silent */ }

        this.logger.log(`⏱ Subscription expired for agent ${agent.id} (hidden ${overflow} listings)`);
      } catch (err) {
        this.logger.warn(`Failed to expire subscription for agent ${agent.id}:`, err);
      }
    }
  }

  // ── Admin: active agent subscriptions ─────────────────────────────────────

  async getActiveAgentSubscriptions(status?: string) {
    const now = new Date();
    const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60_000);

    let subscriptionEndsAt: any = undefined;
    if (status === "active") {
      subscriptionEndsAt = { gt: in7days };
    } else if (status === "expiring") {
      subscriptionEndsAt = { gt: now, lte: in7days };
    } else if (status === "expired") {
      subscriptionEndsAt = { lte: now };
    }

    return this.prisma.agent.findMany({
      where: {
        plan: { in: ["PRO", "AGENCY"] },
        ...(subscriptionEndsAt ? { subscriptionEndsAt } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        whatsappNumber: true,
        plan: true,
        subscriptionEndsAt: true,
        agency: { select: { id: true, name: true } },
        subscriptionRequests: {
          where: { status: "CONFIRMED" },
          orderBy: { confirmedAt: "desc" },
          take: 1,
          select: { id: true, amount: true, tier: true, periodEnd: true, paymentMethod: true },
        },
      },
      orderBy: { subscriptionEndsAt: "asc" },
    });
  }

  // ── Admin: active agency subscriptions ─────────────────────────────────────

  async getActiveAgencySubscriptions() {
    return this.prisma.agent.findMany({
      where: { plan: "AGENCY" },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        whatsappNumber: true,
        plan: true,
        subscriptionEndsAt: true,
        agency: { select: { id: true, name: true, agentCount: true, listingCount: true } },
        subscriptionRequests: {
          where: { status: "CONFIRMED" },
          orderBy: { confirmedAt: "desc" },
          take: 1,
          select: { id: true, amount: true, periodEnd: true, paymentMethod: true },
        },
      },
      orderBy: { subscriptionEndsAt: "asc" },
    });
  }

  // ── Admin: combined payment history ───────────────────────────────────────

  async getCombinedPaymentHistory(period?: string) {
    const dateFilter = this.buildDateFilter(period);

    const [subReqs, boostReqs] = await Promise.all([
      this.prisma.subscriptionRequest.findMany({
        where: { status: "CONFIRMED", ...(dateFilter ? { confirmedAt: dateFilter } : {}) },
        include: { agent: { select: { id: true, name: true, email: true } } },
        orderBy: { confirmedAt: "desc" },
      }),
      this.prisma.boostRequest.findMany({
        where: { status: "CONFIRMED", ...(dateFilter ? { confirmedAt: dateFilter } : {}) },
        include: {
          agent: { select: { id: true, name: true, email: true } },
          property: { select: { id: true, title: true } },
        },
        orderBy: { confirmedAt: "desc" },
      }),
    ]);

    const entries = [
      ...subReqs.map((r) => ({
        id: r.id,
        type: "SUBSCRIPTION" as const,
        tier: r.tier as string | null,
        amount: r.amount,
        currency: r.currency,
        paymentMethod: r.paymentMethod as string,
        confirmedAt: r.confirmedAt,
        agent: r.agent,
        propertyTitle: null as string | null,
      })),
      ...boostReqs.map((r) => ({
        id: r.id,
        type: "BOOST" as const,
        tier: null,
        amount: r.amount,
        currency: r.currency,
        paymentMethod: r.paymentMethod as string,
        confirmedAt: r.confirmedAt,
        agent: r.agent,
        propertyTitle: r.property?.title ?? null,
      })),
    ].sort((a, b) => {
      const da = a.confirmedAt ? new Date(a.confirmedAt).getTime() : 0;
      const db = b.confirmedAt ? new Date(b.confirmedAt).getTime() : 0;
      return db - da;
    });

    return entries;
  }

  // ── Admin: revenue summary ────────────────────────────────────────────────

  async getRevenueSummary() {
    const entries = await this.getCombinedPaymentHistory();

    const monthlyMap: Record<string, { subscriptions: number; boosts: number; total: number }> = {};
    for (const e of entries) {
      if (!e.confirmedAt) continue;
      const d = new Date(e.confirmedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyMap[key]) monthlyMap[key] = { subscriptions: 0, boosts: 0, total: 0 };
      if (e.type === "SUBSCRIPTION") monthlyMap[key].subscriptions += e.amount;
      else monthlyMap[key].boosts += e.amount;
      monthlyMap[key].total += e.amount;
    }

    const months = Object.entries(monthlyMap)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([month, data]) => ({ month, ...data }));

    const now = new Date();
    const [activeProAgents, activeAgencyAgents, activeBoosts] = await Promise.all([
      this.prisma.agent.count({ where: { plan: "PRO", subscriptionEndsAt: { gt: now } } }),
      this.prisma.agent.count({ where: { plan: "AGENCY", subscriptionEndsAt: { gt: now } } }),
      this.prisma.boostRequest.count({ where: { status: "CONFIRMED", confirmedAt: { lte: now } } }),
    ]);

    const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthlyRevenue = monthlyMap[thisMonthKey]?.total ?? 0;

    return {
      months,
      monthlyRevenue,
      activeProAgents,
      activeAgencyAgents,
      activeBoosts,
    };
  }

  // ── Admin: downgrade agent to FREE ────────────────────────────────────────

  async downgradeAgent(agentId: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      select: { id: true, name: true },
    });
    if (!agent) throw new NotFoundException("Agent introuvable");

    const freeCap = 10;
    const activeCount = await this.prisma.property.count({ where: { agentId, status: "LIVE" } });
    const overflow = Math.max(0, activeCount - freeCap);

    await this.prisma.$transaction(async (tx) => {
      await tx.agent.update({
        where: { id: agentId },
        data: { plan: "FREE", subscriptionEndsAt: null, renewalReminderSentAt: null },
      });

      if (overflow > 0) {
        const toHide = await tx.property.findMany({
          where: { agentId, status: "LIVE" },
          orderBy: { createdAt: "asc" },
          take: overflow,
          select: { id: true },
        });
        await tx.property.updateMany({
          where: { id: { in: toHide.map((p) => p.id) } },
          data: { status: "HIDDEN" },
        });
      }
    });

    this.logger.log(`⬇ Admin downgraded agent ${agentId} to FREE (hid ${overflow} listings)`);
    return { success: true, hiddenListings: overflow };
  }

  // ── Admin: extend agent subscription ──────────────────────────────────────

  async extendAgentSubscription(agentId: string, days: number) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      select: { id: true, plan: true, subscriptionEndsAt: true },
    });
    if (!agent) throw new NotFoundException("Agent introuvable");

    const base = agent.subscriptionEndsAt && agent.subscriptionEndsAt > new Date()
      ? agent.subscriptionEndsAt
      : new Date();
    const newEnd = new Date(base.getTime() + days * 24 * 60 * 60_000);

    const updated = await this.prisma.agent.update({
      where: { id: agentId },
      data: { subscriptionEndsAt: newEnd },
      select: { id: true, plan: true, subscriptionEndsAt: true },
    });

    this.logger.log(`⏩ Admin extended agent ${agentId} subscription to ${newEnd.toISOString()}`);
    return updated;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private buildDateFilter(period?: string): { gte: Date; lte: Date } | null {
    if (!period) return null;
    const now = new Date();
    if (period === "this_month") {
      return { gte: new Date(now.getFullYear(), now.getMonth(), 1), lte: now };
    }
    if (period === "last_month") {
      return {
        gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        lte: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
      };
    }
    if (period === "last_3_months") {
      return { gte: new Date(now.getTime() - 90 * 24 * 60 * 60_000), lte: now };
    }
    return null;
  }

  // ── Daily job: renewal reminders (7 days before expiry) ──────────────────────

  async sendRenewalReminders() {
    const now = new Date();
    const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60_000);

    const expiringSoon = await this.prisma.agent.findMany({
      where: {
        plan: { in: ["PRO", "AGENCY"] },
        subscriptionEndsAt: { gte: now, lte: in7days },
        renewalReminderSentAt: null,
      },
      select: {
        id: true, name: true, email: true, plan: true, subscriptionEndsAt: true,
      },
    });

    for (const agent of expiringSoon) {
      try {
        await this.mail.sendSubscriptionRenewalReminder({
          agentEmail: agent.email ?? "",
          agentName: agent.name,
          tier: agent.plan as string,
          expiresAt: agent.subscriptionEndsAt!,
        });
        await this.prisma.agent.update({
          where: { id: agent.id },
          data: { renewalReminderSentAt: now },
        });
        this.logger.log(`📧 Renewal reminder sent to agent ${agent.id}`);
      } catch (err) {
        this.logger.warn(`Failed to send renewal reminder to agent ${agent.id}:`, err);
      }
    }
  }
}
