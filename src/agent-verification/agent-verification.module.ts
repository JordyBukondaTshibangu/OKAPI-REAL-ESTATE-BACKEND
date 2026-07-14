import { Module } from "@nestjs/common";
import { UploadsModule } from "../uploads/uploads.module";
import { AdminAgencyVerificationController } from "./admin-agency-verification.controller";
import { AdminAgentVerificationController } from "./admin-agent-verification.controller";
import { AgentComplaintsController } from "./agent-complaints.controller";
import { AgentSelfServiceController } from "./agent-self-service.controller";
import { AgentVerificationService } from "./agent-verification.service";
import { AgencySelfServiceController } from "./agency-self-service.controller";

// Auth guards (JwtAgentGuard / JwtAdminGuard / JwtUserGuard) resolve against
// the passport strategies already registered globally by AuthModule — no
// need to re-provide them here.
@Module({
  imports: [UploadsModule],
  controllers: [
    AgentSelfServiceController,
    AgencySelfServiceController,
    AdminAgentVerificationController,
    AdminAgencyVerificationController,
    AgentComplaintsController,
  ],
  providers: [AgentVerificationService],
})
export class AgentVerificationModule {}
