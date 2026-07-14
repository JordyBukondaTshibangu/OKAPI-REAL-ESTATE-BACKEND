import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  Matches,
  ValidateNested,
} from "class-validator";

export class PresignFileDto {
  @IsString()
  filename: string;

  @Matches(/^image\/(jpeg|png|webp|avif)$/, {
    message: "contentType must be one of: image/jpeg, image/png, image/webp, image/avif",
  })
  contentType: string;
}

export class PresignUploadDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => PresignFileDto)
  files: PresignFileDto[];
}
