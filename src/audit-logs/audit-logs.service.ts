import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FilterAuditLogDto } from "./dto/filter-audit-log.dto";

interface LogData {
  adminId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
}

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async log(data: LogData) {
    if (!data.adminId) return; // skip if caller has no resolved admin ID
    await this.prisma.auditLog.create({ data });
  }

  async findAll(dto: FilterAuditLogDto) {
    const { page, limit, dateFrom, dateTo, search } = dto;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { resource: { contains: search, mode: "insensitive" } },
        { details: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { admin: { select: { id: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
