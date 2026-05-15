import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAdminGuard } from "../auth/guards/jwt-admin.guard";
import { AgenciesService } from "./agencies.service";
import { CreateAgencyDto } from "./dto/create-agency.dto";
import { FilterAgencyDto } from "./dto/filter-agency.dto";
import { UpdateAgencyDto } from "./dto/update-agency.dto";

@Controller("agencies")
export class AgenciesController {
  constructor(private agenciesService: AgenciesService) {}

  @Get()
  findAll(@Query() query: FilterAgencyDto) {
    return this.agenciesService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.agenciesService.findOne(id);
  }

  @UseGuards(JwtAdminGuard)
  @Post()
  create(@Body() dto: CreateAgencyDto) {
    return this.agenciesService.create(dto);
  }

  @UseGuards(JwtAdminGuard)
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateAgencyDto) {
    return this.agenciesService.update(id, dto);
  }

  @UseGuards(JwtAdminGuard)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.agenciesService.remove(id);
  }
}
