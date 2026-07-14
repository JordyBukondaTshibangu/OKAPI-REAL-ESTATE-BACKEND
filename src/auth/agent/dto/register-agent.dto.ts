import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

/** Step 1 of agent self-signup — account credentials only.
 *  Professional profile fields (communes, agentType, etc.) are collected
 *  in Step 2 via PATCH /auth/agent/complete-profile after email verification.
 *  agencyId and whatsappNumber are optionally collected at registration so
 *  agents signing up via an agency invite link can be pre-linked.
 */
export class RegisterAgentDto {
  @IsString() name: string;
  @IsEmail() email: string;
  @IsString() phoneNumber: string;
  @IsString() @MinLength(6) password: string;
  @IsOptional() @IsString() whatsappNumber?: string;
  @IsOptional() @IsString() agencyId?: string;
}
