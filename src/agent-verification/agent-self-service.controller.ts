import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAgentGuard } from "../auth/guards/jwt-agent.guard";
import { AgentVerificationService } from "./agent-verification.service";
import { RequestReferenceDto } from "./dto/request-reference.dto";
import { SubmitIdDocumentDto } from "./dto/submit-id-document.dto";

interface AgentRequest {
  user: { agentId: string; role: string };
}

@ApiTags("Agent Verification - Self Service")
@ApiBearerAuth()
@UseGuards(JwtAgentGuard)
@Controller("agents/me")
export class AgentSelfServiceController {
  constructor(private verification: AgentVerificationService) {}

  @ApiOperation({ summary: "Submit an ID document for Tier 1 -> Tier 2 review" })
  @Post("id-document")
  submitIdDocument(@Req() req: AgentRequest, @Body() dto: SubmitIdDocumentDto) {
    return this.verification.submitIdDocument(req.user.agentId, dto.key);
  }

  @ApiOperation({ summary: "Request a reference/vouch (agent, agency, or commissionnaire)" })
  @Post("references")
  requestReference(@Req() req: AgentRequest, @Body() dto: RequestReferenceDto) {
    return this.verification.requestReference(req.user.agentId, dto);
  }
}
