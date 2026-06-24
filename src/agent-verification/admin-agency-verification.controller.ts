import { Controller, Param, Patch, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAdminGuard } from "../auth/guards/jwt-admin.guard";
import { AgentVerificationService } from "./agent-verification.service";

@ApiTags("Admin - Agency Verification")
@ApiBearerAuth()
@UseGuards(JwtAdminGuard)
@Controller("admin/agency-verifications")
export class AdminAgencyVerificationController {
  constructor(private verification: AgentVerificationService) {}

  @ApiOperation({
    summary: "Approve an agency (requires business proof + 1 already-verified staff agent)",
  })
  @Patch(":agencyId/approve")
  approve(@Param("agencyId") agencyId: string) {
    return this.verification.approveAgency(agencyId);
  }

  @ApiOperation({ summary: "Reject an agency's verification request" })
  @Patch(":agencyId/reject")
  reject(@Param("agencyId") agencyId: string) {
    return this.verification.rejectAgency(agencyId);
  }
}
