import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { diskStorage } from "multer";
import { extname } from "path";
import { JwtUserGuard } from "../auth/guards/jwt-user.guard";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

const avatarStorage = diskStorage({
  destination: "./uploads/avatars",
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

const imageFileFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  if (!file.mimetype.match(/^image\/(jpg|jpeg|png|webp)$/)) {
    return cb(new BadRequestException("Only jpg, jpeg, png, and webp files are allowed"), false);
  }
  cb(null, true);
};

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

  @ApiOperation({ summary: "Upload profile picture" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: { file: { type: "string", format: "binary" } },
    },
  })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: avatarStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @Patch("me/avatar")
  uploadAvatar(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException("No file provided");
    const relativePath = `uploads/avatars/${file.filename}`;
    return this.usersService.updateAvatar(req.user.userId, relativePath);
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
