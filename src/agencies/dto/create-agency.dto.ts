import { IsString, IsInt, IsOptional, IsArray } from 'class-validator';

export class CreateAgencyDto {
  @IsString() name: string;
  @IsString() monogram: string;
  @IsString() accentClass: string;
  @IsString() tagline: string;
  @IsString() description: string;
  @IsString() address: string;
  @IsString() phone: string;
  @IsString() email: string;
  @IsOptional() @IsString() website?: string;
  @IsInt() founded: number;
  @IsArray() @IsString({ each: true }) specializations: string[];
  @IsArray() @IsString({ each: true }) areasServed: string[];
  @IsArray() @IsString({ each: true }) languages: string[];
  @IsArray() @IsString({ each: true }) certifications: string[];
}
