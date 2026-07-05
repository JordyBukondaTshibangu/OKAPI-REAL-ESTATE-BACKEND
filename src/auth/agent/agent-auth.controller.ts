import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAgentGuard } from "../../guards/jwt-agent.guard";
import { AgentAuthService } from "./agent-auth.service";
import { ForgotPasswordAgentDto } from "./dto/forgot-password-agent.dto";
import { LoginAgentDto } from "./dto/login-agent.dto";
import { RegisterAgentDto } from "./dto/register-agent.dto";
import { ResetPasswordAgentDto } from "./dto/reset-password-agent.dto";
import { VerifyPhoneDto } from "./dto/verify-phone.dto";

interface AgentRequest {
  user: { agentId: string };
}

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

  /**
   * Send (or re-send) a 6-digit OTP to the agent's registered phone number.
   * Requires a valid agent JWT. Throttled to one request per 60 seconds.
   */
  @ApiOperation({ summary: "Send OTP to registered phone for verification" })
  @UseGuards(JwtAgentGuard)
  @Post("send-otp")
  sendOtp(@Req() req: AgentRequest) {
    return this.agentAuthService.sendOtp(req.user.agentId);
  }

  /**
   * Submit the 6-digit OTP received by SMS.
   * On success the agent is promoted to VERIFIE tier and becomes visible in
   * public search, and can publish listings.
   */
  @ApiOperation({ summary: "Verify phone number with OTP — promotes agent to Vérifié tier" })
  @UseGuards(JwtAgentGuard)
  @Post("verify-phone")
  verifyPhone(@Req() req: AgentRequest, @Body() dto: VerifyPhoneDto) {
    return this.agentAuthService.verifyPhone(req.user.agentId, dto.code);
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
