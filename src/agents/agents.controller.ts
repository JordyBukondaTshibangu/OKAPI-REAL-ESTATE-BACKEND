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
import { AgentsService } from "./agents.service";
import { CreateAgentDto } from "./dto/create-agent.dto";
import { FilterAgentDto } from "./dto/filter-agent.dto";
import { UpdateAgentDto } from "./dto/update-agent.dto";
import { UpdatePhotoDto } from "./dto/update-photo.dto";

@Controller("agents")
export class AgentsController {
  constructor(private agentsService: AgentsService) {}

  @Get()
  findAll(@Query() query: FilterAgentDto) {
    return this.agentsService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.agentsService.findOne(id);
  }

  @UseGuards(JwtAdminGuard)
  @Post()
  create(@Body() dto: CreateAgentDto) {
    return this.agentsService.create(dto);
  }

  @UseGuards(JwtAdminGuard)
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateAgentDto) {
    return this.agentsService.update(id, dto);
  }

  @UseGuards(JwtAdminGuard)
  @Patch(":id/photo")
  updatePhoto(@Param("id") id: string, @Body() dto: UpdatePhotoDto) {
    return this.agentsService.updatePhoto(id, dto.key);
  }

  @UseGuards(JwtAdminGuard)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.agentsService.remove(id);
  }
}
