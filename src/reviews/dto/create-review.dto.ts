import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

export class CreateReviewDto {
  @ApiPropertyOptional({
    description: "Review a property (provide one of propertyId or agentId)",
  })
  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @ApiPropertyOptional({
    description: "Review an agent (provide one of propertyId or agentId)",
  })
  @IsOptional()
  @IsUUID()
  agentId?: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5, description: "Speed of response" })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  ratingReactivite?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5, description: "Listing matches reality" })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  ratingHonnetete?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5, description: "Professional conduct" })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  ratingProfessionnalisme?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}
