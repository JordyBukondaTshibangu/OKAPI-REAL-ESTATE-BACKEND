import { Body, Controller, Get, Patch, Post, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { JwtAgentGuard } from "../guards/jwt-agent.guard";
import { AgentAuthService } from "./agent-auth.service";
import { CompleteAgentProfileDto } from "./dto/complete-agent-profile.dto";
import { ForgotPasswordAgentDto } from "./dto/forgot-password-agent.dto";
import { LoginAgentDto } from "./dto/login-agent.dto";
import { RegisterAgentDto } from "./dto/register-agent.dto";
import { ResetPasswordAgentDto } from "./dto/reset-password-agent.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";

interface AgentRequest {
  user: { agentId: string };
}

interface GoogleUser {
  googleId: string;
  name: string;
  email: string | null;
  photo: string | null;
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

  /**
   * Step 2 of self-signup: save professional profile after email verification.
   * Can also be called later to update the profile.
   */
  @ApiOperation({ summary: "Complete professional profile (Step 2 of self-signup)" })
  @UseGuards(JwtAgentGuard)
  @Patch("complete-profile")
  completeProfile(@Req() req: AgentRequest, @Body() dto: CompleteAgentProfileDto) {
    return this.agentAuthService.completeProfile(req.user.agentId, dto);
  }

  /** Change password while logged in (no email/token required). */
  @ApiOperation({ summary: "Change password (authenticated)" })
  @UseGuards(JwtAgentGuard)
  @Patch("change-password")
  changePassword(
    @Req() req: AgentRequest,
    @Body("newPassword") newPassword: string,
  ) {
    return this.agentAuthService.changePassword(req.user.agentId, newPassword);
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

  // ─── Google OAuth (web flow) ─────────────────────────────────────────────────

  /** Redirects to Google's consent screen */
  @ApiOperation({ summary: "Initiate Google OAuth (web — redirects to Google)" })
  @Get("google")
  @UseGuards(AuthGuard("google-agent"))
  googleAuth() {
    // Passport handles the redirect
  }

  /** Google redirects here after user consent */
  @ApiOperation({ summary: "Google OAuth callback (web)" })
  @Get("google/callback")
  @UseGuards(AuthGuard("google-agent"))
  async googleCallback(
    @Req() req: { user: GoogleUser },
    @Res() res: Response,
  ) {
    const result = await this.agentAuthService.googleLogin(req.user);
    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
    // Encode the agent data as base64url so the frontend can read it without
    // making a second API call (which would require the JWT guard to pass).
    const agentB64 = Buffer.from(JSON.stringify(result.agent)).toString("base64url");
    return res.redirect(
      `${frontendUrl}/auth/google/callback?token=${result.access_token}&agent=${agentB64}`,
    );
  }

  // ─── Google OAuth (mobile flow) ──────────────────────────────────────────────

  /**
   * Mobile sends the Google ID token obtained from @react-native-google-signin.
   * Backend verifies it and returns a JWT.
   */
  @ApiOperation({ summary: "Google Sign-In for mobile — send ID token, receive JWT" })
  @Post("google/mobile")
  googleMobile(@Body("idToken") idToken: string) {
    return this.agentAuthService.googleMobileLogin(idToken);
  }
}
