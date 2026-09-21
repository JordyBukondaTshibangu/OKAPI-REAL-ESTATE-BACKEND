import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAdminGuard } from "../guards/jwt-admin.guard";
import { AdminAuthService } from "./admin-auth.service";
import { AdminLoginDto } from "./dto/admin-login.dto";

@ApiTags("Auth - Admin")
@Controller("auth/admin")
export class AdminAuthController {
  constructor(private adminAuthService: AdminAuthService) {}

  @ApiOperation({ summary: "Admin login" })
  @Post("login")
  login(@Body() dto: AdminLoginDto) {
    return this.adminAuthService.login(dto);
  }

  @ApiOperation({ summary: "Admin logout" })
  @UseGuards(JwtAdminGuard)
  @Post("logout")
  logout() {
    return { message: "Logged out successfully" };
  }
}
