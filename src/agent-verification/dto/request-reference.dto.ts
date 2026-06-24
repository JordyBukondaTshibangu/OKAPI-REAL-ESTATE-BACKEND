import { IsEnum, IsOptional, IsString } from "class-validator";
import { ReferenceType } from "@prisma/client";

export class RequestReferenceDto {
  @IsEnum(ReferenceType)
  type: ReferenceType;

  /** Set when type = AGENT: another verified agent vouching for this one. */
  @IsOptional() @IsString() voucherAgentId?: string;

  /** Set when type = AGENCY: an approved agency vouching for its own staff. */
  @IsOptional() @IsString() voucherAgencyId?: string;

  /** Fallback for type = COMMISSIONNAIRE, or any voucher without a platform account. */
  @IsOptional() @IsString() voucherName?: string;
  @IsOptional() @IsString() voucherContact?: string;

  @IsOptional() @IsString() note?: string;
}
