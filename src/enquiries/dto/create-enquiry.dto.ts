import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsUUID, MinLength } from "class-validator";

export class CreateEnquiryDto {
  @ApiProperty()
  @IsUUID()
  propertyId: string;

  @ApiProperty({ minLength: 10 })
  @IsString()
  @MinLength(10)
  message: string;
}
