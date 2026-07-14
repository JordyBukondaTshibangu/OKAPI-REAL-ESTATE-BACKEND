import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

/**
 * DTO for agent self-submit listings via POST /properties/mine.
 * agentId is injected from the JWT — agents cannot set it themselves.
 * agencyId, gallery, imageGradient, iconType are optional with defaults.
 */
export class CreateMyPropertyDto {
  @IsString() listingType: string;
  @IsString() category: string;
  @IsNumber() price: number;
  @IsString() currency: string;
  @IsOptional() @IsString() period?: string;
  @IsString() title: string;
  @IsOptional() @IsString() subtitle?: string;
  @IsOptional() @IsNumber() bedrooms?: number;
  @IsOptional() @IsNumber() bathrooms?: number;
  @IsOptional() @IsNumber() areaSqm?: number;
  @IsString() suburb: string;
  @IsOptional() @IsString() neighborhood?: string;
  @IsString() city: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() reference?: string;
  @IsOptional() @IsString() zone?: string;
  @IsOptional() @IsString() availableFrom?: string;
  @IsOptional() @IsBoolean() isShortTerm?: boolean;
  @IsOptional() @IsString() rentalDuration?: string;
  // Optionals that admin typically sets
  @IsOptional() @IsString() agencyId?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) gallery?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) amenities?: string[];
  @IsOptional() @IsString() imageGradient?: string;
  @IsOptional() @IsString() iconType?: string;
}
