import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterAgentDto {
  @IsString() name: string;
  @IsString() phoneNumber: string;
  @IsOptional() @IsString() whatsappNumber?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsString() @MinLength(6) password: string;
  /** Optional — agents can sign up independently and join/create an agency later. */
  @IsOptional() @IsString() agencyId?: string;
}
