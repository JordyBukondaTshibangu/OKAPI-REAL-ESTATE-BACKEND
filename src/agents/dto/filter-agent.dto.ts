import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { Transform } from "class-transformer";
import { PaginationDto } from "../../common/dto/pagination.dto";

export class FilterAgentDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  /** Filter by commune of operation — matches agents whose communes[] array contains this value. */
  @IsOptional()
  @IsString()
  commune?: string;

  /** Filter by property type managed — matches agents whose propertyTypes[] array contains this value. */
  @IsOptional()
  @IsString()
  propertyType?: string;

  /** Filter by minimum rating (inclusive). e.g. "4" returns agents with rating >= 4. */
  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined ? parseFloat(value) : undefined,
  )
  @IsNumber()
  @Min(0)
  minRating?: number;

  /** Filter by agent type (COMMISSIONNAIRE | AGENT | AGENCY_OWNER). */
  @IsOptional()
  @IsIn(["COMMISSIONNAIRE", "AGENT", "AGENCY_OWNER"])
  agentType?: "COMMISSIONNAIRE" | "AGENT" | "AGENCY_OWNER";

  /** Filter by rental focus (LONG_TERM | SHORT_TERM | BOTH). */
  @IsOptional()
  @IsIn(["LONG_TERM", "SHORT_TERM", "BOTH"])
  rentalFocus?: "LONG_TERM" | "SHORT_TERM" | "BOTH";

  /** Filter by agency — returns all agents belonging to this agency (used by agency portal). */
  @IsOptional()
  @IsString()
  agencyId?: string;

  /** Admin filter: pass "NON_VERIFIE" or "VERIFIE" to scope by tier. */
  @IsOptional()
  @IsString()
  verificationTier?: string;

  /** Admin filter: pass "true" to show only email-verified agents. */
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  emailVerified?: boolean;

  @IsOptional()
  @IsIn(["name", "title", "agency", "rating", "closedDeals", "createdAt"])
  sortBy?: "name" | "title" | "agency" | "rating" | "closedDeals" | "createdAt";

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder?: "asc" | "desc";
}
