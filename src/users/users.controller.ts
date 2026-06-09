import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtUserGuard } from "../auth/guards/jwt-user.guard";
import { UpdateAvatarDto } from "./dto/update-avatar.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

@ApiTags("Users")
@ApiBearerAuth()
@UseGuards(JwtUserGuard)
@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({ summary: "Get my profile" })
  @Get("me")
  getMe(@Request() req: any) {
    return this.usersService.findMe(req.user.userId);
  }

  @ApiOperation({ summary: "Update my profile" })
  @Patch("me")
  updateMe(@Request() req: any, @Body() dto: UpdateUserDto) {
    return this.usersService.updateMe(req.user.userId, dto);
  }

  @ApiOperation({ summary: "Set profile picture from a presigned R2 upload (use POST /uploads/presign-avatar first)" })
  @Patch("me/avatar")
  updateAvatar(@Request() req: any, @Body() dto: UpdateAvatarDto) {
    return this.usersService.updateAvatar(req.user.userId, dto.key);
  }

  @ApiOperation({ summary: "Remove profile picture" })
  @Delete("me/avatar")
  removeAvatar(@Request() req: any) {
    return this.usersService.removeAvatar(req.user.userId);
  }

  @ApiOperation({ summary: "Delete my account" })
  @Delete("me")
  deleteMe(@Request() req: any) {
    return this.usersService.deleteMe(req.user.userId);
  }
}
