import { IsIn, IsOptional, IsString } from "class-validator";

export class ReviewReferenceDto {
  @IsIn(["CONFIRMED", "REVOKED", "FLAGGED"])
  status: "CONFIRMED" | "REVOKED" | "FLAGGED";

  @IsOptional() @IsString() note?: string;
}
