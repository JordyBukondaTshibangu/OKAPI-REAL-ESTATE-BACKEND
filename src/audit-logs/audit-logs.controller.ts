import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAdminGuard } from "../auth/guards/jwt-admin.guard";
import { AuditLogsService } from "./audit-logs.service";
import { FilterAuditLogDto } from "./dto/filter-audit-log.dto";

@ApiTags("Audit Logs")
@ApiBearerAuth()
@UseGuards(JwtAdminGuard)
@Controller("admin/audit-logs")
export class AuditLogsController {
  constructor(private auditLogsService: AuditLogsService) {}

  @ApiOperation({ summary: "Get admin audit logs with date filter, search, and pagination" })
  @Get()
  findAll(@Query() dto: FilterAuditLogDto) {
    return this.auditLogsService.findAll(dto);
  }
}
