import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AgentPlan } from "@prisma/client";
import { JwtAdminGuard } from "../auth/guards/jwt-admin.guard";
import { JwtAgentGuard } from "../auth/guards/jwt-agent.guard";
import { AgentsService } from "./agents.service";
import { CreateAgentDto } from "./dto/create-agent.dto";
import { FilterAgentDto } from "./dto/filter-agent.dto";
import { UpdateAgentDto } from "./dto/update-agent.dto";
import { UpdateMyProfileDto } from "./dto/update-my-profile.dto";
import { UpdatePhotoDto } from "./dto/update-photo.dto";

interface AgentRequest {
  user: { agentId: string; role: string };
}

@Controller("agents")
export class AgentsController {
  constructor(private agentsService: AgentsService) {}

  // NOTE: "me" routes are declared before ":id" so they aren't shadowed by
  // the generic id param route.
  @UseGuards(JwtAgentGuard)
  @Get("me")
  getMyProfile(@Req() req: AgentRequest) {
    return this.agentsService.getMyProfile(req.user.agentId);
  }

  @UseGuards(JwtAgentGuard)
  @Patch("me")
  updateMyProfile(@Req() req: AgentRequest, @Body() dto: UpdateMyProfileDto) {
    return this.agentsService.updateMyProfile(req.user.agentId, dto);
  }

  @UseGuards(JwtAgentGuard)
  @Patch("me/photo")
  updateMyPhoto(@Req() req: AgentRequest, @Body() dto: UpdatePhotoDto) {
    return this.agentsService.updateMyPhoto(req.user.agentId, dto.key);
  }

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

  /**
   * Upgrade or downgrade an agent's monetisation plan.
   * Body: { plan: "FREE" | "PRO" | "AGENCY" }
   * Called manually by admin after payment is confirmed (e.g. via WhatsApp/Mobile Money).
   */
  @UseGuards(JwtAdminGuard)
  @Patch(":id/plan")
  updatePlan(@Param("id") id: string, @Body("plan") plan: AgentPlan) {
    return this.agentsService.updatePlan(id, plan);
  }

  /** Suspend an agent — hides their listings from public search. Body: { reason?: string } */
  @UseGuards(JwtAdminGuard)
  @Patch(":id/suspend")
  suspend(@Param("id") id: string, @Body("reason") reason?: string) {
    return this.agentsService.suspend(id, reason);
  }

  /** Lift a suspension — agent and listings become visible again. */
  @UseGuards(JwtAdminGuard)
  @Patch(":id/unsuspend")
  unsuspend(@Param("id") id: string) {
    return this.agentsService.unsuspend(id);
  }

  @UseGuards(JwtAdminGuard)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.agentsService.remove(id);
  }
}
