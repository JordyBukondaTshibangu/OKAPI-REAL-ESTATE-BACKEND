import { IsOptional, IsString, MinLength } from "class-validator";

export class FileComplaintDto {
  @IsString() @MinLength(3)
  reason: string;

  @IsOptional() @IsString()
  details?: string;
}
