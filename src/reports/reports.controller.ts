import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ReportsService } from "./reports.service";
import { CreateReportDto } from "./dto/create-report.dto";
import { JwtUserGuard } from "../auth/guards/jwt-user.guard";
import { JwtAdminGuard } from "../auth/guards/jwt-admin.guard";
import { ReportStatus } from "@prisma/client";

interface UserRequest {
  user: { userId: string };
}

@Controller()
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  // ── Public/User endpoint ────────────────────────────────────────────────────

  /**
   * POST /properties/:id/report
   * Any authenticated user can report a listing.
   * Guests get 401 (enforced by guard).
   */
  @UseGuards(JwtUserGuard)
  @Post("properties/:id/report")
  report(
    @Param("id") propertyId: string,
    @Body() dto: CreateReportDto,
    @Req() req: UserRequest,
  ) {
    return this.reportsService.create(propertyId, dto, req.user.userId);
  }

  // ── Admin endpoints ─────────────────────────────────────────────────────────

  /** GET /admin/reports — list all reports (optionally filtered by status) */
  @UseGuards(JwtAdminGuard)
  @Get("admin/reports")
  findAll(@Query("status") status?: ReportStatus) {
    return this.reportsService.findAll(status);
  }

  /** GET /admin/reports/grouped — reports grouped by property (for dashboard) */
  @UseGuards(JwtAdminGuard)
  @Get("admin/reports/grouped")
  findGrouped() {
    return this.reportsService.findGrouped();
  }

  /**
   * PATCH /admin/reports/:id/resolve
   * Body: { action: "dismiss" | "warn_agent" | "delete_listing", adminId: string }
   */
  @UseGuards(JwtAdminGuard)
  @Patch("admin/reports/:id/resolve")
  resolve(
    @Param("id") reportId: string,
    @Body("action") action: "dismiss" | "warn_agent" | "delete_listing",
    @Body("adminId") adminId: string,
  ) {
    return this.reportsService.resolve(reportId, action, adminId);
  }
}
