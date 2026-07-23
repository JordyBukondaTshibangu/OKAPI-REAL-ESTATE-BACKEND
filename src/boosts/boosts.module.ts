import { Module } from "@nestjs/common";
import { MailModule } from "../mail/mail.module";
import { PrismaModule } from "../prisma/prisma.module";
import { BoostsController } from "./boosts.controller";
import { BoostsService } from "./boosts.service";

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [BoostsController],
  providers: [BoostsService],
  exports: [BoostsService],
})
export class BoostsModule {}
