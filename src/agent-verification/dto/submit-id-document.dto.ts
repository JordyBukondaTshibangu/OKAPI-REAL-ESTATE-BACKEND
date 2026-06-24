import { IsString } from "class-validator";

export class SubmitIdDocumentDto {
  @IsString()
  key: string;
}
