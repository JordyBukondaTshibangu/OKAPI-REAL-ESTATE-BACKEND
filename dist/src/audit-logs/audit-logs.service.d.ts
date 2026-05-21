import { PrismaService } from "../prisma/prisma.service";
import { FilterAuditLogDto } from "./dto/filter-audit-log.dto";
interface LogData {
    adminId: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: string;
}
export declare class AuditLogsService {
    private prisma;
    constructor(prisma: PrismaService);
    log(data: LogData): Promise<void>;
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
export {};
