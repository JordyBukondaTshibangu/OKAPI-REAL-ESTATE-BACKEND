import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { MailModule } from "../mail/mail.module";
import { AdminAuthController } from "./admin/admin-auth.controller";
import { AdminAuthService } from "./admin/admin-auth.service";
import { AgentAuthController } from "./agent/agent-auth.controller";
import { AgentAuthService } from "./agent/agent-auth.service";
import { JwtAdminStrategy } from "./strategies/jwt-admin.strategy";
import { JwtAgentStrategy } from "./strategies/jwt-agent.strategy";
import { JwtUserStrategy } from "./strategies/jwt-user.strategy";
import { UserAuthController } from "./user/user-auth.controller";
import { UserAuthService } from "./user/user-auth.service";

@Module({
  imports: [
    PassportModule,
    MailModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "secret",
      signOptions: { expiresIn: "7d" },
    }),
  ],
  controllers: [UserAuthController, AdminAuthController, AgentAuthController],
  providers: [
    UserAuthService,
    AdminAuthService,
    AgentAuthService,
    JwtUserStrategy,
    JwtAdminStrategy,
    JwtAgentStrategy,
  ],
  exports: [JwtModule],
})
export class AuthModule {}
