-- AlterTable Agent: add phone OTP fields for self-service phone verification
ALTER TABLE "Agent"
  ADD COLUMN "phoneOtpCode"   TEXT,
  ADD COLUMN "phoneOtpExpiry" TIMESTAMP(3);
