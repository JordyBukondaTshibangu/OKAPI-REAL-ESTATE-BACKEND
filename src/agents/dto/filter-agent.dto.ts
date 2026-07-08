import { IsBoolean, IsIn, IsOptional, IsString } from "class-validator";
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
