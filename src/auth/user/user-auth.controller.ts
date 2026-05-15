import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { UserAuthService } from "./user-auth.service";

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
}
