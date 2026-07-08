import { IsArray, IsInt, IsOptional, IsString } from "class-validator";

export class CreateAgencyDto {
  // ── Required core fields ───────────────────────────────────────────────────
  @IsString() name: string;
  @IsString() email: string;
  @IsString() phone: string;

  // ── Optional core fields ───────────────────────────────────────────────────
  @IsOptional() @IsString() whatsapp?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() founded?: number;

  // ── DRC-specific multi-selects ─────────────────────────────────────────────
  @IsOptional() @IsArray() @IsString({ each: true }) communes?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) propertyTypes?: string[];
  @IsOptional() @IsString() rentalFocus?: string;

  // ── Verification ───────────────────────────────────────────────────────────
  @IsOptional() @IsString() rccmNumber?: string;
  @IsOptional() @IsString() verificationDocUrl?: string;
  // verificationTier belongs to Agent, not Agency — omitted intentionally

  // ── Public profile ─────────────────────────────────────────────────────────
  @IsOptional() @IsString() logoUrl?: string;

  // ── Freemium ───────────────────────────────────────────────────────────────
  @IsOptional() @IsString() gracePeriodEndsAt?: string;
  @IsOptional() @IsInt() freeListingCap?: number;

  // ── Legacy cosmetic fields (kept for backward compat, now optional) ────────
  @IsOptional() @IsString() monogram?: string;
  @IsOptional() @IsString() accentClass?: string;
  @IsOptional() @IsString() tagline?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) specializations?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) areasServed?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) languages?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) certifications?: string[];
}
