import { Body, Controller, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtUserGuard } from "../auth/guards/jwt-user.guard";
import { AgentVerificationService } from "./agent-verification.service";
import { FileComplaintDto } from "./dto/file-complaint.dto";

interface UserRequest {
  user: { userId: string; role: string };
}

@ApiTags("Agent Complaints")
@ApiBearerAuth()
@UseGuards(JwtUserGuard)
@Controller("agents/:agentId/complaints")
export class AgentComplaintsController {
  constructor(private verification: AgentVerificationService) {}

  @ApiOperation({ summary: "File a complaint against an agent — triggers re-review past a threshold" })
  @Post()
  fileComplaint(
    @Param("agentId") agentId: string,
    @Req() req: UserRequest,
    @Body() dto: FileComplaintDto,
  ) {
    return this.verification.fileComplaint(agentId, req.user.userId, dto);
  }
}
