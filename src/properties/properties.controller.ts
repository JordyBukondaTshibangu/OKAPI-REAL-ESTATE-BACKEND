import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAdminGuard } from "../auth/guards/jwt-admin.guard";
import { JwtAgentGuard } from "../auth/guards/jwt-agent.guard";
import { CreatePropertyDto } from "./dto/create-property.dto";
import { CreateMyPropertyDto } from "./dto/create-my-property.dto";
import { PropertyFilterDto } from "./dto/property-filter.dto";
import { UpdatePropertyDto } from "./dto/update-property.dto";
import { PropertiesService } from "./properties.service";

interface AgentRequest {
  user: { agentId: string; role: string };
}

@Controller("properties")
export class PropertiesController {
  constructor(private propertiesService: PropertiesService) {}

  // ── Public endpoints ────────────────────────────────────────────────────────

  @Get()
  findAll(@Query() filter: PropertyFilterDto) {
    return this.propertiesService.findAll(filter);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.propertiesService.findOne(id);
  }

  @HttpCode(HttpStatus.OK)
  @Post(":id/view")
  recordView(@Param("id") id: string) {
    return this.propertiesService.recordView(id);
  }

  @HttpCode(HttpStatus.OK)
  @Post(":id/share")
  recordShare(@Param("id") id: string) {
    return this.propertiesService.recordShare(id);
  }

  // ── Agent self-service endpoints ────────────────────────────────────────────

  /** Create a listing. Verified agents go straight to PENDING; others save as DRAFT. */
  @UseGuards(JwtAgentGuard)
  @Post("mine")
  createMine(@Req() req: AgentRequest, @Body() dto: CreateMyPropertyDto) {
    const full = {
      ...dto,
      agentId:       req.user.agentId,
      agencyId:      dto.agencyId      ?? null,
      subtitle:      dto.subtitle      ?? dto.category,
      neighborhood:  dto.neighborhood  ?? "",
      bedrooms:      dto.bedrooms      ?? 0,
      bathrooms:     dto.bathrooms     ?? 0,
      areaSqm:       dto.areaSqm       ?? 0,
      gallery:       dto.gallery       ?? [],
      amenities:     dto.amenities     ?? [],
      imageGradient: dto.imageGradient ?? "from-navy-800 to-navy-900",
      iconType:      dto.iconType      ?? "home",
    } as CreatePropertyDto;
    return this.propertiesService.create(full, req.user.agentId);
  }

  /** Agent's own listings — all statuses. Optional ?status= filter. */
  @UseGuards(JwtAgentGuard)
  @Get("mine/list")
  findMine(@Req() req: AgentRequest, @Query("status") status?: string) {
    return this.propertiesService.findMine(req.user.agentId, status);
  }

  /** Agent updates their own listing. */
  @UseGuards(JwtAgentGuard)
  @Patch("mine/:id")
  updateMine(
    @Req() req: AgentRequest,
    @Param("id") id: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.updateMine(id, req.user.agentId, dto);
  }

  /** Agent deletes their own listing. */
  @UseGuards(JwtAgentGuard)
  @Delete("mine/:id")
  removeMine(@Req() req: AgentRequest, @Param("id") id: string) {
    return this.propertiesService.removeMine(id, req.user.agentId);
  }

  /** DRAFT / HIDDEN / REJECTED → PENDING (submit for review). */
  @UseGuards(JwtAgentGuard)
  @HttpCode(HttpStatus.OK)
  @Post("mine/:id/publish")
  publishMine(@Req() req: AgentRequest, @Param("id") id: string) {
    return this.propertiesService.publishMine(id, req.user.agentId);
  }

  /** LIVE → HIDDEN (agent hides their listing). */
  @UseGuards(JwtAgentGuard)
  @HttpCode(HttpStatus.OK)
  @Post("mine/:id/unpublish")
  unpublishMine(@Req() req: AgentRequest, @Param("id") id: string) {
    return this.propertiesService.unpublishMine(id, req.user.agentId);
  }

  // ── Admin endpoints ─────────────────────────────────────────────────────────

  /** All PENDING listings awaiting review. */
  @UseGuards(JwtAdminGuard)
  @Get("admin/pending")
  findPending() {
    return this.propertiesService.findPending();
  }

  /** Admin approves a PENDING listing → LIVE. */
  @UseGuards(JwtAdminGuard)
  @HttpCode(HttpStatus.OK)
  @Post(":id/approve")
  approve(@Param("id") id: string) {
    return this.propertiesService.approve(id);
  }

  /** Admin rejects a PENDING listing. Body: { reason: string } */
  @UseGuards(JwtAdminGuard)
  @HttpCode(HttpStatus.OK)
  @Post(":id/reject")
  reject(@Param("id") id: string, @Body("reason") reason: string) {
    return this.propertiesService.reject(id, reason);
  }

  @UseGuards(JwtAdminGuard)
  @Post()
  create(@Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(dto);
  }

  @UseGuards(JwtAdminGuard)
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdatePropertyDto) {
    return this.propertiesService.update(id, dto);
  }

  /**
   * Paid boost: admin confirms payment then calls this to float the listing.
   * Body: { days: number }
   */
  @UseGuards(JwtAdminGuard)
  @Patch(":id/boost")
  boost(@Param("id") id: string, @Body("days") days: number) {
    return this.propertiesService.boost(id, days ?? 7);
  }

  @UseGuards(JwtAdminGuard)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.propertiesService.remove(id);
  }
}
