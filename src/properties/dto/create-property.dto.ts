import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class CreatePropertyDto {
  @IsString() agentId: string;
  @IsOptional() @IsString() agencyId?: string | null;
  @IsString() listingType: string;
  @IsString() category: string;
  @IsNumber() price: number;
  @IsString() currency: string;
  @IsOptional() @IsString() period?: string;
  @IsString() title: string;
  @IsOptional() @IsString() subtitle?: string;
  @IsOptional() @IsInt() bedrooms?: number;
  @IsOptional() @IsInt() bathrooms?: number;
  @IsOptional() @IsNumber() areaSqm?: number;
  @IsString() suburb: string;
  @IsOptional() @IsString() neighborhood?: string;
  @IsString() city: string;
  @IsOptional() @IsBoolean() verified?: boolean;
  @IsOptional() @IsBoolean() premium?: boolean;
  @IsOptional() @IsBoolean() isNew?: boolean;
  // Admin-only cosmetic fields — optional for agent submissions
  @IsOptional() @IsString() imageGradient?: string;
  @IsOptional() @IsString() iconType?: string;
  @IsOptional() @IsString() transaction?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) gallery?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) amenities?: string[];
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() reference?: string;
  @IsOptional() @IsString() zone?: string;
  @IsOptional() @IsString() brokerLicense?: string;
  @IsOptional() @IsString() agentLicense?: string;
  @IsOptional() @IsString() permitNumber?: string;
  @IsOptional() @IsString() availableFrom?: string;
  @IsOptional() @IsNumber() averagePriceArea?: number;
  @IsOptional() @IsNumber() averageSizeArea?: number;
  // Agent-facing fields
  @IsOptional() @IsString() landmark?: string;
  @IsOptional() @IsBoolean() isFurnished?: boolean;

  // --- Rental duration type ---
  @IsOptional() @IsBoolean() isShortTerm?: boolean;
  @IsOptional() @IsBoolean() isLongTerm?: boolean;

  // Short-term optional details
  @IsOptional() @IsNumber() pricePerNight?: number;
  @IsOptional() @IsInt() minStayNights?: number;
  @IsOptional() @IsInt() maxStayNights?: number;
  @IsOptional() @IsString() shortTermNotes?: string;
}
