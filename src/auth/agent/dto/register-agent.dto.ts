import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterAgentDto {
  @IsString() name: string;
  /** Email is required — used to deliver the OTP verification code. */
  @IsEmail() email: string;
  @IsString() phoneNumber: string;
  @IsOptional() @IsString() whatsappNumber?: string;
  @IsString() @MinLength(6) password: string;
  /** Optional — agents can sign up independently and join/create an agency later. */
  @IsOptional() @IsString() agencyId?: string;
}
