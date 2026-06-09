"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const agencies_module_1 = require("./agencies/agencies.module");
const agents_module_1 = require("./agents/agents.module");
const alerts_module_1 = require("./alerts/alerts.module");
const audit_logs_module_1 = require("./audit-logs/audit-logs.module");
const auth_module_1 = require("./auth/auth.module");
const enquiries_module_1 = require("./enquiries/enquiries.module");
const favorites_module_1 = require("./favorites/favorites.module");
const mail_module_1 = require("./mail/mail.module");
const prisma_module_1 = require("./prisma/prisma.module");
const properties_module_1 = require("./properties/properties.module");
const reviews_module_1 = require("./reviews/reviews.module");
const uploads_module_1 = require("./uploads/uploads.module");
const users_module_1 = require("./users/users.module");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
            prisma_module_1.PrismaModule,
            mail_module_1.MailModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            agencies_module_1.AgenciesModule,
            agents_module_1.AgentsModule,
            properties_module_1.PropertiesModule,
            favorites_module_1.FavoritesModule,
            enquiries_module_1.EnquiriesModule,
            alerts_module_1.AlertsModule,
            reviews_module_1.ReviewsModule,
            audit_logs_module_1.AuditLogsModule,
            uploads_module_1.UploadsModule,
        ],
        providers: [app_service_1.AppService, { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard, }],
        controllers: [app_controller_1.AppController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map