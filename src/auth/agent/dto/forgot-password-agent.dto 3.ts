import { IsEmail } from "class-validator";

export class ForgotPasswordAgentDto {
  @IsEmail() email: string;
}
