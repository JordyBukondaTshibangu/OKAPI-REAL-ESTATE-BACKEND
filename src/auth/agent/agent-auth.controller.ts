import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AgentAuthService } from "./agent-auth.service";
import { ForgotPasswordAgentDto } from "./dto/forgot-password-agent.dto";
import { LoginAgentDto } from "./dto/login-agent.dto";
import { RegisterAgentDto } from "./dto/register-agent.dto";
import { ResetPasswordAgentDto } from "./dto/reset-password-agent.dto";

@ApiTags("Auth - Agent")
@Controller("auth/agent")
export class AgentAuthController {
  constructor(private agentAuthService: AgentAuthService) {}

  @ApiOperation({ summary: "Self-register as a new agent (Tier 1 - Non-vérifié)" })
  @Post("register")
  register(@Body() dto: RegisterAgentDto) {
    return this.agentAuthService.register(dto);
  }

  @ApiOperation({ summary: "Agent login" })
  @Post("login")
  login(@Body() dto: LoginAgentDto) {
    return this.agentAuthService.login(dto);
  }

  @ApiOperation({ summary: "Request password reset email" })
  @Post("forgot-password")
  forgotPassword(@Body() dto: ForgotPasswordAgentDto) {
    return this.agentAuthService.forgotPassword(dto);
  }

  @ApiOperation({ summary: "Reset password using token from email" })
  @Post("reset-password")
  resetPassword(@Body() dto: ResetPasswordAgentDto) {
    return this.agentAuthService.resetPassword(dto);
  }
}
