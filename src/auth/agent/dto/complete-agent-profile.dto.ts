import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
} from "class-validator";

export enum AgentType {
  COMMISSIONNAIRE = "COMMISSIONNAIRE",
  AGENT = "AGENT",
  AGENCY_OWNER = "AGENCY_OWNER",
  OTHER = "OTHER",
}

export enum RentalFocus {
  LONG_TERM = "LONG_TERM",
  SHORT_TERM = "SHORT_TERM",
  BOTH = "BOTH",
}

/** Step 2 of agent self-signup — professional profile.
 *  Submitted after email verification via PATCH /auth/agent/complete-profile.
 */
export class CompleteAgentProfileDto {
  @IsEnum(AgentType)
  agentType: AgentType;

  /** WhatsApp number — defaults to phoneNumber if omitted. */
  @IsOptional() @IsString()
  whatsapp?: string;

  /** Optional agency affiliation. */
  @IsOptional() @IsString()
  agencyId?: string;

  /** Kinshasa communes of operation e.g. ["Gombe", "Limete"]. */
  @IsArray() @IsString({ each: true })
  communes: string[];

  /** Types of properties managed e.g. ["Appartements", "Studios"]. */
  @IsArray() @IsString({ each: true })
  propertyTypes: string[];

  @IsEnum(RentalFocus)
  rentalFocus: RentalFocus;

  /** Label string e.g. "1 à 3 ans". */
  @IsOptional() @IsString()
  yearsExperienceLabel?: string;

  /** R2 key of the uploaded ID document (private — never exposed publicly). */
  @IsOptional() @IsString()
  idDocumentUrl?: string;

  /** Agent/agency ID who referred this agent. */
  @IsOptional() @IsString()
  referredById?: string;

  @IsOptional() @IsString()
  bio?: string;

  /** R2 key / URL of the profile photo. */
  @IsOptional() @IsString()
  photo?: string;
}
