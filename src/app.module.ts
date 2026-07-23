import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AgenciesModule } from "./agencies/agencies.module";
import { BoostsModule } from "./boosts/boosts.module";
import { AgentVerificationModule } from "./agent-verification/agent-verification.module";
import { AgentsModule } from "./agents/agents.module";
import { AlertsModule } from "./alerts/alerts.module";
import { AuditLogsModule } from "./audit-logs/audit-logs.module";
import { AuthModule } from "./auth/auth.module";
import { EnquiriesModule } from "./enquiries/enquiries.module";
import { FavoritesModule } from "./favorites/favorites.module";
import { MailModule } from "./mail/mail.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PropertiesModule } from "./properties/properties.module";
import { ReviewsModule } from "./reviews/reviews.module";
import { UploadsModule } from "./uploads/uploads.module";
import { UsersModule } from "./users/users.module";
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    MailModule,
    AuthModule,
    UsersModule,
    AgenciesModule,
    AgentsModule,
    AgentVerificationModule,
    PropertiesModule,
    FavoritesModule,
    EnquiriesModule,
    AlertsModule,
    ReviewsModule,
    AuditLogsModule,
    UploadsModule,
    BoostsModule,
  ],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard,  }],
  controllers: [AppController],  // ← add this

})
export class AppModule {}
