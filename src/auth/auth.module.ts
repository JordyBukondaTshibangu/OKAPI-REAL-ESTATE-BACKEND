import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AdminAuthController } from "./admin/admin-auth.controller";
import { AdminAuthService } from "./admin/admin-auth.service";
import { JwtAdminStrategy } from "./strategies/jwt-admin.strategy";
import { JwtUserStrategy } from "./strategies/jwt-user.strategy";
import { UserAuthController } from "./user/user-auth.controller";
import { UserAuthService } from "./user/user-auth.service";

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "secret",
      signOptions: { expiresIn: "7d" },
    }),
  ],
  controllers: [UserAuthController, AdminAuthController],
  providers: [
    UserAuthService,
    AdminAuthService,
    JwtUserStrategy,
    JwtAdminStrategy,
  ],
})
export class AuthModule {}
