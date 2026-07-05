-- AlterTable Agent: email OTP + emailVerified for self-signup flow
ALTER TABLE "Agent"
  ADD COLUMN "emailVerified"  BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN "emailOtpCode"   TEXT,
  ADD COLUMN "emailOtpExpiry" TIMESTAMP(3);
