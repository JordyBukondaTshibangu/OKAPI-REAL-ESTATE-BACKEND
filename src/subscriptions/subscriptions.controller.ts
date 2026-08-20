import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAdminGuard } from "../auth/guards/jwt-admin.guard";
import { JwtAgentGuard } from "../auth/guards/jwt-agent.guard";
import { SubscriptionsService } from "./subscriptions.service";
import {
  CreateSubscriptionRequestDto,
  RejectSubscriptionDto,
  UpdateSubscriptionScreenshotDto,
} from "./dto/create-subscription-request.dto";

// ── Agent routes ─────────────────────────────────────────────────────────────

@Controller("subscriptions")
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  /** Submit a subscription request. */
  @UseGuards(JwtAgentGuard)
  @Post("request")
  createRequest(@Request() req: any, @Body() dto: CreateSubscriptionRequestDto) {
    return this.subscriptionsService.createSubscriptionRequest(req.user.agentId, dto);
  }

  /** Attach / update payment screenshot on a PENDING request. */
  @UseGuards(JwtAgentGuard)
  @Patch(":id/screenshot")
  updateScreenshot(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateSubscriptionScreenshotDto,
  ) {
    return this.subscriptionsService.updateScreenshot(req.user.agentId, id, dto);
  }

  /** Get all subscription requests for the authenticated agent. */
  @UseGuards(JwtAgentGuard)
  @Get("mine")
  getMySubscriptions(@Request() req: any) {
    return this.subscriptionsService.getMySubscriptions(req.user.agentId);
  }

  // ── Admin routes ───────────────────────────────────────────────────────────

  /** FIFO pending queue for admin review. */
  @UseGuards(JwtAdminGuard)
  @Get("admin/pending")
  getPending() {
    return this.subscriptionsService.getPendingSubscriptions();
  }

  /** List all requests (optionally filtered by status). */
  @UseGuards(JwtAdminGuard)
  @Get("admin/all")
  getAll(@Query("status") status?: string) {
    return this.subscriptionsService.getAllSubscriptions(status);
  }

  /** Confirm a pending subscription request. */
  @UseGuards(JwtAdminGuard)
  @Patch("admin/:id/confirm")
  confirm(@Request() req: any, @Param("id") id: string) {
    return this.subscriptionsService.confirmSubscription(id, req.user.adminId);
  }

  /** Reject a pending subscription request with a reason. */
  @UseGuards(JwtAdminGuard)
  @Patch("admin/:id/reject")
  reject(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: RejectSubscriptionDto,
  ) {
    return this.subscriptionsService.rejectSubscription(id, req.user.adminId, dto);
  }

  /** Agents with an active PRO or AGENCY plan (optional ?status=active|expiring|expired). */
  @UseGuards(JwtAdminGuard)
  @Get("admin/active-agents")
  getActiveAgents(@Query("status") status?: string) {
    return this.subscriptionsService.getActiveAgentSubscriptions(status);
  }

  /** Agents with AGENCY plan + their agency info. */
  @UseGuards(JwtAdminGuard)
  @Get("admin/active-agencies")
  getActiveAgencies() {
    return this.subscriptionsService.getActiveAgencySubscriptions();
  }

  /** Combined SubscriptionRequest + BoostRequest payment ledger. */
  @UseGuards(JwtAdminGuard)
  @Get("admin/payments")
  getPayments(@Query("period") period?: string) {
    return this.subscriptionsService.getCombinedPaymentHistory(period);
  }

  /** Monthly revenue totals + active counts KPIs. */
  @UseGuards(JwtAdminGuard)
  @Get("admin/revenue-summary")
  getRevenueSummary() {
    return this.subscriptionsService.getRevenueSummary();
  }

  /** Downgrade an agent to FREE plan immediately. */
  @UseGuards(JwtAdminGuard)
  @Patch("admin/agents/:agentId/downgrade")
  downgradeAgent(@Param("agentId") agentId: string) {
    return this.subscriptionsService.downgradeAgent(agentId);
  }

  /** Extend an agent's subscription by N days (default 30). */
  @UseGuards(JwtAdminGuard)
  @Patch("admin/agents/:agentId/extend")
  extendAgent(
    @Param("agentId") agentId: string,
    @Query("days") days?: string,
  ) {
    return this.subscriptionsService.extendAgentSubscription(agentId, Number(days) || 30);
  }
}
