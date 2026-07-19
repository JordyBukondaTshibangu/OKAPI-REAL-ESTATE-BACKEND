import { IsEnum } from "class-validator";
import { AgentVerificationTier } from "@prisma/client";

export class SetTierDto {
  @IsEnum(AgentVerificationTier)
  tier: AgentVerificationTier;
}
