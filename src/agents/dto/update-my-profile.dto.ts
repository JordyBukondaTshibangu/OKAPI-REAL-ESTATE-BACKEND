import { IsArray, IsInt, IsOptional, IsString } from "class-validator";

// Deliberately excludes agencyId, photo, and every verification/tier field —
// an agent can build their own profile, but can't self-assign an agency
// affiliation or touch trust-tier state through this endpoint.
export class UpdateMyProfileDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() specialization?: string;
  @IsOptional() @IsString() nationality?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) languages?: string[];
  @IsOptional() @IsInt() yearsExperience?: number;
  @IsOptional() @IsInt() experienceSince?: number;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() whatsappNumber?: string;
}
