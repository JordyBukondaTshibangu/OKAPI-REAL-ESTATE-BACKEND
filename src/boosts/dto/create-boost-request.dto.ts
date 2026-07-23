import { IsEnum, IsIn, IsInt, IsOptional, IsString } from "class-validator";

export enum PaymentMethodDto {
  ORANGE_MONEY = "ORANGE_MONEY",
  MTN_MONEY    = "MTN_MONEY",
  AIRTEL_MONEY = "AIRTEL_MONEY",
  MPESA        = "MPESA",
  CASH         = "CASH",
}

export class CreateBoostRequestDto {
  @IsInt()
  @IsIn([7, 15, 30])
  durationDays: number;

  @IsEnum(PaymentMethodDto)
  paymentMethod: PaymentMethodDto;

  @IsString()
  @IsOptional()
  screenshotUrl?: string;
}

export class RejectBoostDto {
  @IsString()
  reason: string;
}

export class UpdateScreenshotDto {
  @IsString()
  screenshotUrl: string;
}
