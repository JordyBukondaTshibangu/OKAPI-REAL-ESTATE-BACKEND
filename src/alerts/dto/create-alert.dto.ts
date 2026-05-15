import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateAlertDto {
  @ApiProperty({ example: "3-bed apartments in Dubai Marina" })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: "for-sale" })
  @IsOptional()
  @IsString()
  listingType?: string;

  @ApiPropertyOptional({ example: "Apartment" })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ example: "Dubai" })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: "Marina" })
  @IsOptional()
  @IsString()
  suburb?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  minBedrooms?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  maxBedrooms?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
