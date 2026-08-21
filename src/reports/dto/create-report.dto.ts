import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { ReportReason } from "@prisma/client";

export class CreateReportDto {
  @IsEnum(ReportReason)
  reason: ReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
