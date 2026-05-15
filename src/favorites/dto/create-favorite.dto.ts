import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class CreateFavoriteDto {
  @ApiProperty()
  @IsUUID()
  propertyId: string;
}
