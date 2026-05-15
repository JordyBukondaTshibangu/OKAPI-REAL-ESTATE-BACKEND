import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtUserGuard } from "../auth/guards/jwt-user.guard";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtUserGuard)
  @Get("me")
  getMe(@Request() req: any) {
    return this.usersService.findMe(req.user.userId);
  }

  @UseGuards(JwtUserGuard)
  @Patch("me")
  updateMe(@Request() req: any, @Body() dto: UpdateUserDto) {
    return this.usersService.updateMe(req.user.userId, dto);
  }

  @UseGuards(JwtUserGuard)
  @Delete("me")
  deleteMe(@Request() req: any) {
    return this.usersService.deleteMe(req.user.userId);
  }
}
