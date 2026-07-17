import { IsArray, IsInt, IsOptional, IsString } from "class-validator";

/**
 * Fields an AGENCY_OWNER agent can update on their own agency.
 * Excludes verification fields, gracePeriodEndsAt, freeListingCap — admin-only.
 */
export class UpdateMyAgencyDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() whatsapp?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() tagline?: string;
  @IsOptional() @IsInt() founded?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) communes?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) propertyTypes?: string[];
  @IsOptional() @IsString() rentalFocus?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) languages?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) specializations?: string[];
}
