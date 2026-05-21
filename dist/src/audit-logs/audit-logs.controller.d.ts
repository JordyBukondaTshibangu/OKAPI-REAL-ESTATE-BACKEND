import { AuditLogsService } from "./audit-logs.service";
import { FilterAuditLogDto } from "./dto/filter-audit-log.dto";
export declare class AuditLogsController {
    private auditLogsService;
    constructor(auditLogsService: AuditLogsService);
    findAll(dto: FilterAuditLogDto): Promise<{
        data: ({
            admin: {
                id: string;
                email: string;
            };
        } & {
            id: string;
            createdAt: Date;
            action: string;
            resource: string;
            resourceId: string | null;
            details: string | null;
            adminId: string;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
}
