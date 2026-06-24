import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAdminGuard } from "../auth/guards/jwt-admin.guard";
import { AgentVerificationService } from "./agent-verification.service";
import { ReviewIdDocumentDto } from "./dto/review-id-document.dto";
import { ReviewReferenceDto } from "./dto/review-reference.dto";
import { SetFlaggedDto } from "./dto/set-flagged.dto";
import { SetTierDto } from "./dto/set-tier.dto";
import { SpotCheckDto } from "./dto/spot-check.dto";

@ApiTags("Admin - Agent Verification")
@ApiBearerAuth()
@UseGuards(JwtAdminGuard)
@Controller("admin/agent-verifications")
export class AdminAgentVerificationController {
  constructor(private verification: AgentVerificationService) {}

  @ApiOperation({ summary: "Agents awaiting Tier 1 -> Tier 2 review" })
  @Get("pending")
  listPending() {
    return this.verification.listPending();
  }

  @ApiOperation({ summary: "Agents flagged for re-review (complaints, bad vouches)" })
  @Get("flagged")
  listFlagged() {
    return this.verification.listFlagged();
  }

  @ApiOperation({ summary: "Full verification detail for one agent" })
  @Get(":agentId")
  getAgentDetail(@Param("agentId") agentId: string) {
    return this.verification.getAgentDetail(agentId);
  }

  @ApiOperation({ summary: "Approve or reject an agent's ID document" })
  @Patch(":agentId/id-document")
  reviewIdDocument(@Param("agentId") agentId: string, @Body() dto: ReviewIdDocumentDto) {
    return this.verification.reviewIdDocument(agentId, dto.status);
  }

  @ApiOperation({ summary: "Confirm, revoke, or flag a reference/vouch" })
  @Patch("references/:referenceId")
  reviewReference(@Param("referenceId") referenceId: string, @Body() dto: ReviewReferenceDto) {
    return this.verification.reviewReference(referenceId, dto.status, dto.note);
  }

  @ApiOperation({ summary: "Record the manual spot-check on an agent's first listing" })
  @Patch(":agentId/spot-check")
  spotCheck(@Param("agentId") agentId: string, @Body() dto: SpotCheckDto) {
    return this.verification.spotCheckFirstListing(agentId, dto.passed);
  }

  @ApiOperation({ summary: "Manually set an agent's tier (override / demotion / correction)" })
  @Patch(":agentId/tier")
  setTier(@Param("agentId") agentId: string, @Body() dto: SetTierDto) {
    return this.verification.setTier(agentId, dto.tier);
  }

  @ApiOperation({ summary: "Flag or clear an agent for re-review" })
  @Patch(":agentId/flag")
  setFlagged(@Param("agentId") agentId: string, @Body() dto: SetFlaggedDto) {
    return this.verification.setFlagged(agentId, dto.flagged);
  }

  @ApiOperation({
    summary: "Run the automated Tier 2 -> Tier 3 promotion sweep (90+ days, 10+ deals, low complaints)",
  })
  @Post("evaluate-tier3")
  evaluateTierPromotions() {
    return this.verification.evaluateTierPromotions();
  }
}
