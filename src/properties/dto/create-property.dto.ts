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
  @IsString() agencyId: string;
  @IsString() listingType: string;
  @IsString() category: string;
  @IsNumber() price: number;
  @IsString() currency: string;
  @IsOptional() @IsString() period?: string;
  @IsString() title: string;
  @IsString() subtitle: string;
  @IsInt() bedrooms: number;
  @IsInt() bathrooms: number;
  @IsNumber() areaSqm: number;
  @IsString() suburb: string;
  @IsString() neighborhood: string;
  @IsString() city: string;
  @IsOptional() @IsBoolean() verified?: boolean;
  @IsOptional() @IsBoolean() premium?: boolean;
  @IsOptional() @IsBoolean() isNew?: boolean;
  @IsString() imageGradient: string;
  @IsString() iconType: string;
  @IsOptional() @IsString() transaction?: string;
  @IsArray() @IsString({ each: true }) gallery: string[];
  @IsArray() @IsString({ each: true }) amenities: string[];
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() reference?: string;
  @IsOptional() @IsString() zone?: string;
  @IsOptional() @IsString() brokerLicense?: string;
  @IsOptional() @IsString() agentLicense?: string;
  @IsOptional() @IsString() permitNumber?: string;
  @IsOptional() @IsString() availableFrom?: string;
  @IsOptional() @IsNumber() averagePriceArea?: number;
  @IsOptional() @IsNumber() averageSizeArea?: number;
}
