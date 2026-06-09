import { Module } from "@nestjs/common";
import { UploadsModule } from "../uploads/uploads.module";
import { AgentsController } from "./agents.controller";
import { AgentsService } from "./agents.service";

@Module({
  imports: [UploadsModule],
  controllers: [AgentsController],
  providers: [AgentsService],
})
export class AgentsModule {}
