import { IsArray, IsEnum, IsInt, IsOptional, IsString } from "class-validator";

enum AgentType {
  COMMISSIONNAIRE = "COMMISSIONNAIRE",
  AGENT = "AGENT",
  AGENCY_OWNER = "AGENCY_OWNER",
  OTHER = "OTHER",
}

enum RentalFocus {
  LONG_TERM = "LONG_TERM",
  SHORT_TERM = "SHORT_TERM",
  BOTH = "BOTH",
}

// Deliberately excludes agencyId, photo, and every verification/tier field —
// an agent can build their own profile, but can't self-assign an agency
// affiliation or touch trust-tier state through this endpoint.
export class UpdateMyProfileDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phoneNumber?: string;
  @IsOptional() @IsString() whatsappNumber?: string;
  @IsOptional() @IsEnum(AgentType) agentType?: AgentType;
  @IsOptional() @IsArray() @IsString({ each: true }) communes?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) propertyTypes?: string[];
  @IsOptional() @IsEnum(RentalFocus) rentalFocus?: RentalFocus;
  @IsOptional() @IsString() yearsExperienceLabel?: string;
  @IsOptional() @IsString() bio?: string;
  // Legacy fields kept for backward-compat
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() specialization?: string;
  @IsOptional() @IsString() nationality?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) languages?: string[];
  @IsOptional() @IsInt() yearsExperience?: number;
  @IsOptional() @IsInt() experienceSince?: number;
}
