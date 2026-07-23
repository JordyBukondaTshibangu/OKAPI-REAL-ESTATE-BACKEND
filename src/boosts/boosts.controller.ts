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
import { BoostsService } from "./boosts.service";
import { CreateBoostRequestDto, RejectBoostDto, UpdateScreenshotDto } from "./dto/create-boost-request.dto";

// ── Agent routes ─────────────────────────────────────────────────────────────

@Controller("boosts")
export class BoostsController {
  constructor(private readonly boostsService: BoostsService) {}

  /** Submit a boost request for one of the agent's properties. */
  @UseGuards(JwtAgentGuard)
  @Post("properties/:propertyId/request")
  createRequest(
    @Request() req: any,
    @Param("propertyId") propertyId: string,
    @Body() dto: CreateBoostRequestDto,
  ) {
    return this.boostsService.createBoostRequest(req.user.agentId, propertyId, dto);
  }

  /** Attach / update payment screenshot on a PENDING request. */
  @UseGuards(JwtAgentGuard)
  @Patch(":id/screenshot")
  updateScreenshot(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateScreenshotDto,
  ) {
    return this.boostsService.updateScreenshot(req.user.agentId, id, dto);
  }

  /** Get all boost requests for the authenticated agent. */
  @UseGuards(JwtAgentGuard)
  @Get("mine")
  getMyBoosts(@Request() req: any) {
    return this.boostsService.getMyBoosts(req.user.agentId);
  }

  // ── Admin routes ───────────────────────────────────────────────────────────

  /** FIFO pending queue for admin review. */
  @UseGuards(JwtAdminGuard)
  @Get("admin/pending")
  getPending() {
    return this.boostsService.getPendingBoosts();
  }

  /** List all requests (optionally filtered by status). */
  @UseGuards(JwtAdminGuard)
  @Get("admin/all")
  getAll(@Query("status") status?: string) {
    return this.boostsService.getAllBoosts(status);
  }

  /** Confirm a pending boost request. */
  @UseGuards(JwtAdminGuard)
  @Patch("admin/:id/confirm")
  confirm(@Request() req: any, @Param("id") id: string) {
    return this.boostsService.confirmBoost(id, req.user.adminId);
  }

  /** Reject a pending boost request with a reason. */
  @UseGuards(JwtAdminGuard)
  @Patch("admin/:id/reject")
  reject(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: RejectBoostDto,
  ) {
    return this.boostsService.rejectBoost(id, req.user.adminId, dto);
  }
}
