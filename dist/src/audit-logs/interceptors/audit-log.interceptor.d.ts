import { CallHandler, ExecutionContext, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { AuditLogsService } from "../audit-logs.service";
export declare class AuditLogInterceptor implements NestInterceptor {
    private auditLogsService;
    private readonly logger;
    constructor(auditLogsService: AuditLogsService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private deriveAction;
    private deriveResource;
}
