import { IsIn } from "class-validator";

export class ReviewIdDocumentDto {
  @IsIn(["APPROVED", "REJECTED"])
  status: "APPROVED" | "REJECTED";
}
