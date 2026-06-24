import { IsString } from "class-validator";

export class LoginAgentDto {
  /** Email or phone number — whichever the agent registered with. */
  @IsString() identifier: string;
  @IsString() password: string;
}
