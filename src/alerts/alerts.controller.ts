import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtUserGuard } from "../auth/guards/jwt-user.guard";
import { AlertsService } from "./alerts.service";
import { CreateAlertDto } from "./dto/create-alert.dto";
import { UpdateAlertDto } from "./dto/update-alert.dto";

@ApiTags("Alerts")
@ApiBearerAuth()
@UseGuards(JwtUserGuard)
@Controller("alerts")
export class AlertsController {
  constructor(private alertsService: AlertsService) {}

  @ApiOperation({ summary: "Create a property alert" })
  @Post()
  create(@Request() req: any, @Body() dto: CreateAlertDto) {
    return this.alertsService.create(req.user.userId, dto);
  }

  @ApiOperation({ summary: "Get my alerts" })
  @Get()
  getAll(@Request() req: any) {
    return this.alertsService.getMyAlerts(req.user.userId);
  }

  @ApiOperation({ summary: "Get matching properties for an alert" })
  @Get(":id/matches")
  getMatches(@Request() req: any, @Param("id") id: string) {
    return this.alertsService.getMatchingProperties(req.user.userId, id);
  }

  @ApiOperation({ summary: "Update an alert" })
  @Patch(":id")
  update(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateAlertDto,
  ) {
    return this.alertsService.update(req.user.userId, id, dto);
  }

  @ApiOperation({ summary: "Delete an alert" })
  @Delete(":id")
  delete(@Request() req: any, @Param("id") id: string) {
    return this.alertsService.delete(req.user.userId, id);
  }
}
