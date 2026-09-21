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
import { IsString, IsNotEmpty } from "class-validator";
import { JwtAdminGuard } from "../auth/guards/jwt-admin.guard";
import { JwtUserGuard } from "../auth/guards/jwt-user.guard";
import { UpdateAvatarDto } from "./dto/update-avatar.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

class SavePushTokenDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}

@ApiTags("Users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({ summary: "Count all registered users (admin only)" })
  @UseGuards(JwtAdminGuard)
  @Get("count")
  countAll() {
    return this.usersService.countAll().then((count) => ({ count }));
  }

  @ApiOperation({ summary: "Get my profile" })
  @UseGuards(JwtUserGuard)
  @Get("me")
  getMe(@Request() req: any) {
    return this.usersService.findMe(req.user.userId);
  }

  @ApiOperation({ summary: "Update my profile" })
  @UseGuards(JwtUserGuard)
  @Patch("me")
  updateMe(@Request() req: any, @Body() dto: UpdateUserDto) {
    return this.usersService.updateMe(req.user.userId, dto);
  }

  @ApiOperation({
    summary:
      "Set profile picture from a presigned R2 upload (use POST /uploads/presign-avatar first)",
  })
  @UseGuards(JwtUserGuard)
  @Patch("me/avatar")
  updateAvatar(@Request() req: any, @Body() dto: UpdateAvatarDto) {
    return this.usersService.updateAvatar(req.user.userId, dto.key);
  }

  @ApiOperation({ summary: "Remove profile picture" })
  @UseGuards(JwtUserGuard)
  @Delete("me/avatar")
  removeAvatar(@Request() req: any) {
    return this.usersService.removeAvatar(req.user.userId);
  }

  @ApiOperation({ summary: "Save Expo push token for mobile notifications" })
  @UseGuards(JwtUserGuard)
  @Patch("me/push-token")
  savePushToken(@Request() req: any, @Body() dto: SavePushTokenDto) {
    return this.usersService.savePushToken(req.user.userId, dto.token);
  }

  @ApiOperation({ summary: "Delete my account" })
  @UseGuards(JwtUserGuard)
  @Delete("me")
  deleteMe(@Request() req: any) {
    return this.usersService.deleteMe(req.user.userId);
  }
}
