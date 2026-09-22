import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { UserAuthService } from "./user-auth.service";
import type { GoogleUserProfile } from "../strategies/google-user.strategy";

@ApiTags("Auth - User")
@Controller("auth")
export class UserAuthController {
  constructor(private userAuthService: UserAuthService) {}

  @ApiOperation({ summary: "Register a new user" })
  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.userAuthService.register(dto);
  }

  @ApiOperation({ summary: "Login" })
  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.userAuthService.login(dto);
  }

  @ApiOperation({ summary: "Request password reset email" })
  @Post("forgot-password")
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.userAuthService.forgotPassword(dto);
  }

  @ApiOperation({ summary: "Reset password using token from email" })
  @Post("reset-password")
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.userAuthService.resetPassword(dto);
  }

  // ─── Google OAuth (web flow) ─────────────────────────────────────────────────

  @ApiOperation({ summary: "Initiate Google OAuth for users (redirects to Google)" })
  @Get("google")
  @UseGuards(AuthGuard("google-user"))
  googleAuth() {
    // Passport handles the redirect
  }

  @ApiOperation({ summary: "Google Sign-In for mobile users — send ID token, receive JWT" })
  @Post("google/mobile")
  googleMobile(@Body("idToken") idToken: string) {
    return this.userAuthService.googleMobileLogin(idToken);
  }

  @ApiOperation({ summary: "Google OAuth callback for users" })
  @Get("google/callback")
  @UseGuards(AuthGuard("google-user"))
  async googleCallback(
    @Req() req: { user: GoogleUserProfile },
    @Res() res: Response,
  ) {
    const result = await this.userAuthService.googleLogin(req.user);
    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
    const userB64 = Buffer.from(JSON.stringify(result.user)).toString("base64url");
    return res.redirect(
      `${frontendUrl}/auth/google/user/callback?token=${result.access_token}&user=${userB64}`,
    );
  }
}
