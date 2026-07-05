import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAgentGuard } from "../../guards/jwt-agent.guard";
import { AgentAuthService } from "./agent-auth.service";
import { ForgotPasswordAgentDto } from "./dto/forgot-password-agent.dto";
import { LoginAgentDto } from "./dto/login-agent.dto";
import { RegisterAgentDto } from "./dto/register-agent.dto";
import { ResetPasswordAgentDto } from "./dto/reset-password-agent.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";

interface AgentRequest {
  user: { agentId: string };
}

@ApiTags("Auth - Agent")
@Controller("auth/agent")
export class AgentAuthController {
  constructor(private agentAuthService: AgentAuthService) {}

  @ApiOperation({
    summary:
      "Self-register as a new agent — sends a 6-digit OTP to the provided email address",
  })
  @Post("register")
  register(@Body() dto: RegisterAgentDto) {
    return this.agentAuthService.register(dto);
  }

  @ApiOperation({ summary: "Agent login (email or phone + password)" })
  @Post("login")
  login(@Body() dto: LoginAgentDto) {
    return this.agentAuthService.login(dto);
  }

  /**
   * Re-send the 6-digit OTP to the agent's registered email address.
   * Throttled to one request per 60 seconds.
   * Requires a valid agent JWT (obtained at registration or login).
   */
  @ApiOperation({ summary: "Re-send email verification OTP" })
  @UseGuards(JwtAgentGuard)
  @Post("resend-verification")
  resendVerification(@Req() req: AgentRequest) {
    return this.agentAuthService.resendVerificationEmail(req.user.agentId);
  }

  /**
   * Submit the 6-digit OTP received by email.
   * On success: emailVerified becomes true. The agent's verificationTier stays
   * NON_VERIFIE until an admin approves — admin is notified automatically.
   */
  @ApiOperation({
    summary:
      "Verify email with OTP — marks emailVerified=true and notifies admin for approval",
  })
  @UseGuards(JwtAgentGuard)
  @Post("verify-email")
  verifyEmail(@Req() req: AgentRequest, @Body() dto: VerifyEmailDto) {
    return this.agentAuthService.verifyEmail(req.user.agentId, dto.code);
  }

  @ApiOperation({ summary: "Request a password reset email" })
  @Post("forgot-password")
  forgotPassword(@Body() dto: ForgotPasswordAgentDto) {
    return this.agentAuthService.forgotPassword(dto);
  }

  @ApiOperation({ summary: "Reset password using the token from the reset email" })
  @Post("reset-password")
  resetPassword(@Body() dto: ResetPasswordAgentDto) {
    return this.agentAuthService.resetPassword(dto);
  }
}
