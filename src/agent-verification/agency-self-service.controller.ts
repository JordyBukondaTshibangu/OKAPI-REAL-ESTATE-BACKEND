import { Body, Controller, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAgentGuard } from "../auth/guards/jwt-agent.guard";
import { AgentVerificationService } from "./agent-verification.service";
import { SubmitBusinessProofDto } from "./dto/submit-business-proof.dto";

interface AgentRequest {
  user: { agentId: string; role: string };
}

@ApiTags("Agency Verification - Self Service")
@ApiBearerAuth()
@UseGuards(JwtAgentGuard)
@Controller("agencies/:agencyId")
export class AgencySelfServiceController {
  constructor(private verification: AgentVerificationService) {}

  @ApiOperation({ summary: "Submit business proof (e.g. RCCM) for agency verification — staff agent only" })
  @Post("business-proof")
  submitBusinessProof(
    @Param("agencyId") agencyId: string,
    @Req() req: AgentRequest,
    @Body() dto: SubmitBusinessProofDto,
  ) {
    return this.verification.submitBusinessProof(agencyId, dto.key, req.user.agentId);
  }
}
