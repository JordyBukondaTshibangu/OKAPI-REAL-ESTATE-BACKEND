"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuditLogInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const audit_logs_service_1 = require("../audit-logs.service");
let AuditLogInterceptor = AuditLogInterceptor_1 = class AuditLogInterceptor {
    auditLogsService;
    logger = new common_1.Logger(AuditLogInterceptor_1.name);
    constructor(auditLogsService) {
        this.auditLogsService = auditLogsService;
    }
    intercept(context, next) {
        const req = context.switchToHttp().getRequest();
        return next.handle().pipe((0, operators_1.tap)(() => {
            const user = req.user;
            if (!user || user.role !== "admin")
                return;
            const { method, url, params, body } = req;
            if (!["POST", "PATCH", "PUT", "DELETE"].includes(method))
                return;
            const action = this.deriveAction(method, url);
            const resource = this.deriveResource(url);
            const resourceId = params?.id;
            const details = ["POST", "PATCH", "PUT"].includes(method) && body
                ? JSON.stringify(body).substring(0, 500)
                : undefined;
            this.auditLogsService
                .log({ adminId: user.adminId, action, resource, resourceId, details })
                .catch((err) => this.logger.error(`Audit log failed [${action} ${resource}]: ${err?.message}`, err?.stack));
        }));
    }
    deriveAction(method, url) {
        if (url.includes("logout"))
            return "LOGOUT";
        const map = {
            POST: "CREATE",
            PATCH: "UPDATE",
            PUT: "UPDATE",
            DELETE: "DELETE",
        };
        return map[method] ?? method;
    }
    deriveResource(url) {
        const parts = url.split("/").filter(Boolean);
        if (parts[0] === "auth")
            return parts.slice(0, 2).join("/");
        return parts[0] ?? "unknown";
    }
};
exports.AuditLogInterceptor = AuditLogInterceptor;
exports.AuditLogInterceptor = AuditLogInterceptor = AuditLogInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_logs_service_1.AuditLogsService])
], AuditLogInterceptor);
//# sourceMappingURL=audit-log.interceptor.js.map