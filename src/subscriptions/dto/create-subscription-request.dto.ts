import { IsEnum, IsOptional, IsString } from "class-validator";

export enum SubscriptionTierDto {
  PRO    = "PRO",
  AGENCY = "AGENCY",
}

export enum PaymentMethodDto {
  ORANGE_MONEY = "ORANGE_MONEY",
  MTN_MONEY    = "MTN_MONEY",
  AIRTEL_MONEY = "AIRTEL_MONEY",
  MPESA        = "MPESA",
  CASH         = "CASH",
}

export class CreateSubscriptionRequestDto {
  @IsEnum(SubscriptionTierDto)
  tier: SubscriptionTierDto;

  @IsEnum(PaymentMethodDto)
  paymentMethod: PaymentMethodDto;
}

export class UpdateSubscriptionScreenshotDto {
  @IsString()
  screenshotUrl: string;
}

export class RejectSubscriptionDto {
  @IsString()
  reason: string;
}
