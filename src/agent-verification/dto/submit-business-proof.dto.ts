import { IsString } from "class-validator";

export class SubmitBusinessProofDto {
  @IsString()
  key: string;
}
