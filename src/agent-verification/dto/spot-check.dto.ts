import { IsBoolean } from "class-validator";

export class SpotCheckDto {
  @IsBoolean()
  passed: boolean;
}
