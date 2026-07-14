import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from "class-validator";
import { AgentType, RentalFocus } from "../../auth/agent/dto/complete-agent-profile.dto";
import { AgentVerificationTier } from "@prisma/client";

/** Used by admin to manually create an agent (full control over all fields). */
export class CreateAgentDto {
  // ── Identity ──────────────────────────────────────────────────
  @IsString() name: string;
  @IsEmail() email: string;
  @IsString() phoneNumber: string;
  @IsOptional() @IsString() whatsapp?: string;

  @IsEnum(AgentType)
  agentType: AgentType;

  // ── Agency ────────────────────────────────────────────────────
  @IsOptional() @IsString() agencyId?: string;

  // ── Localisation & activity ───────────────────────────────────
  @IsArray() @IsString({ each: true })
  communes: string[];

  @IsArray() @IsString({ each: true })
  propertyTypes: string[];

  @IsEnum(RentalFocus)
  rentalFocus: RentalFocus;

  @IsOptional() @IsString()
  yearsExperienceLabel?: string;

  // ── Verification ──────────────────────────────────────────────
  @IsOptional() @IsString() idDocumentUrl?: string;
  @IsOptional() @IsString() referredById?: string;

  /** Admin can approve directly (VERIFIE) or leave pending (NON_VERIFIE). */
  @IsOptional()
  @IsEnum(AgentVerificationTier)
  verificationTier?: AgentVerificationTier;

  // ── Public profile ────────────────────────────────────────────
  @IsOptional() @IsString() photo?: string;
  @IsOptional() @IsString() bio?: string;

  // ── Freemium overrides ────────────────────────────────────────
  /** ISO date string — defaults to now + 6 months. */
  @IsOptional() @IsDateString() graceEndsAt?: string;

  @IsOptional() @IsInt() @Min(0)
  freeListingCap?: number;
}
