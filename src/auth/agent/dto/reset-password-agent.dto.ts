import { IsString, MinLength } from "class-validator";

export class ResetPasswordAgentDto {
  @IsString() token: string;
  @IsString() @MinLength(6) password: string;
}
