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
  UseGuards,
} from "@nestjs/common";
import { JwtAdminGuard } from "../auth/guards/jwt-admin.guard";
import { CreatePropertyDto } from "./dto/create-property.dto";
import { PropertyFilterDto } from "./dto/property-filter.dto";
import { UpdatePropertyDto } from "./dto/update-property.dto";
import { PropertiesService } from "./properties.service";

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
