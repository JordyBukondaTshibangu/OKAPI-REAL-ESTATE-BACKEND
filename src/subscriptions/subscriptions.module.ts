import { Module } from "@nestjs/common";
import { MailModule } from "../mail/mail.module";
import { PrismaModule } from "../prisma/prisma.module";
import { SubscriptionsController } from "./subscriptions.controller";
import { SubscriptionsService } from "./subscriptions.service";

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
