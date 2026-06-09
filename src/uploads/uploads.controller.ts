import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { JwtAdminGuard } from "../auth/guards/jwt-admin.guard";
import { PresignUploadDto } from "./dto/presign-upload.dto";
import { UploadsService } from "./uploads.service";

@UseGuards(JwtAdminGuard)
@Controller("uploads")
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  @Post("presign")
  presign(@Body() dto: PresignUploadDto) {
    return this.uploadsService.createPresignedUploads(dto.files);
  }
}
