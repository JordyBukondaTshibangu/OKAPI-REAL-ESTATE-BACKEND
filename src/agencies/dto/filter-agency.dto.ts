import { IsIn, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { Transform } from "class-transformer";
import { PaginationDto } from "../../common/dto/pagination.dto";

export class FilterAgencyDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  language?: string;

  /** Filter by commune of operation — matches agencies whose communes[] array contains this value. */
  @IsOptional()
  @IsString()
  commune?: string;

  /** Filter by property type managed — matches agencies whose propertyTypes[] array contains this value. */
  @IsOptional()
  @IsString()
  propertyType?: string;

  /** Filter by rental focus (LONG_TERM | SHORT_TERM | BOTH). */
  @IsOptional()
  @IsIn(["LONG_TERM", "SHORT_TERM", "BOTH"])
  rentalFocus?: "LONG_TERM" | "SHORT_TERM" | "BOTH";

  /** Filter by minimum number of active agents. */
  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined ? parseInt(value, 10) : undefined,
  )
  @IsNumber()
  @Min(0)
  minAgents?: number;

  @IsOptional()
  @IsIn(["name", "agentCount", "listingCount", "founded"])
  sortBy?: "name" | "agentCount" | "listingCount" | "founded";

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder?: "asc" | "desc";
}
