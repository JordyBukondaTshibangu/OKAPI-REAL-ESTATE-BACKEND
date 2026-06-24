import { IsArray, IsInt, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateAgentDto {
  @IsOptional() @IsString() agencyId?: string;
  @IsString() name: string;
  @IsString() title: string;
  @IsString() specialization: string;
  @IsString() nationality: string;
  @IsArray() @IsString({ each: true }) languages: string[];
  @IsInt() yearsExperience: number;
  @IsInt() experienceSince: number;
  @IsNumber() rating: number;
  @IsInt() ratingsCount: number;
  @IsInt() responseMinutes: number;
  @IsOptional() @IsString() brokerLicense?: string;
  @IsString() bio: string;
  @IsString() photo: string;
  @IsString() photoGradient: string;
  @IsString() agencyAccent: string;
  @IsString() agencyMonogram: string;
}
