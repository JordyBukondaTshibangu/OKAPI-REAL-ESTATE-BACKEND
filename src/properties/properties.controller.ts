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

  /**
   * Agent self-submit: agent publishes their own listing.
   * Cap enforcement is handled inside PropertiesService.create().
   */
  @UseGuards(JwtAgentGuard)
  @Post("mine")
  createMine(@Req() req: AgentRequest, @Body() dto: CreateMyPropertyDto) {
    const full = {
      ...dto,
      agentId:       req.user.agentId,
      agencyId:      dto.agencyId      ?? "",
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
   * Paid boost: admin confirms payment then calls this to float the listing
   * to the top of search results for `days` days.
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
