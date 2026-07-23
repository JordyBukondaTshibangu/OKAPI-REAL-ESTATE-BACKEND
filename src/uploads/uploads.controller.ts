import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { JwtAdminGuard } from "../auth/guards/jwt-admin.guard";
import { JwtAgentGuard } from "../auth/guards/jwt-agent.guard";
import { JwtUserGuard } from "../auth/guards/jwt-user.guard";
import { PresignFileDto, PresignUploadDto } from "./dto/presign-upload.dto";
import { UploadsService } from "./uploads.service";

@Controller("uploads")
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  @UseGuards(JwtAdminGuard)
  @Post("presign")
  presign(@Body() dto: PresignUploadDto) {
    return this.uploadsService.createPresignedUploads(dto.files);
  }

  /** Agents upload property photos via this endpoint before submitting a listing. */
  @UseGuards(JwtAgentGuard)
  @Post("presign-property")
  presignProperty(@Body() dto: PresignUploadDto) {
    return this.uploadsService.createPresignedUploads(dto.files);
  }

  @UseGuards(JwtUserGuard)
  @Post("presign-avatar")
  async presignAvatar(@Body() dto: PresignFileDto) {
    const [result] = await this.uploadsService.createPresignedUploads([dto]);
    return result;
  }

  /** Agents upload their own profile photo via this endpoint. */
  @UseGuards(JwtAgentGuard)
  @Post("presign-agent-avatar")
  async presignAgentAvatar(@Body() dto: PresignFileDto) {
    const [result] = await this.uploadsService.createPresignedUploads([dto]);
    return result;
  }

  /** Agents upload a payment screenshot for a boost request. */
  @UseGuards(JwtAgentGuard)
  @Post("presign-boost-screenshot")
  async presignBoostScreenshot(@Body() dto: PresignFileDto) {
    const [result] = await this.uploadsService.createPresignedUploads([dto]);
    return result;
  }
}
