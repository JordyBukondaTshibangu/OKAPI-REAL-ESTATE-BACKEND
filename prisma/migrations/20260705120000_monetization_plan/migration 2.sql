-- CreateEnum
CREATE TYPE "AgentPlan" AS ENUM ('FREE', 'PRO', 'AGENCY');

-- AlterTable Agent: add plan, grace period, and suspension fields
ALTER TABLE "Agent"
  ADD COLUMN "plan"            "AgentPlan" NOT NULL DEFAULT 'FREE',
  ADD COLUMN "graceEndsAt"     TIMESTAMP(3) NOT NULL DEFAULT NOW() + INTERVAL '6 months',
  ADD COLUMN "isSuspended"     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "suspendedAt"     TIMESTAMP(3),
  ADD COLUMN "suspendedReason" TEXT;

-- Backfill: existing agents keep unlimited access for 6 months from today.
-- They are already live and trusted — this gives them the same grace window
-- as a brand-new signup without disrupting anything currently in production.
UPDATE "Agent"
  SET "graceEndsAt" = NOW() + INTERVAL '6 months'
  WHERE "graceEndsAt" IS NOT NULL;

-- AlterTable Property: add boostedUntil for paid placement
ALTER TABLE "Property"
  ADD COLUMN "boostedUntil" TIMESTAMP(3);
