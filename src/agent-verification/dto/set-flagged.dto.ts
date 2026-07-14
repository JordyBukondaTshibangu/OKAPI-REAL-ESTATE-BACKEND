import { IsBoolean } from "class-validator";

export class SetFlaggedDto {
  @IsBoolean()
  flagged: boolean;
}
