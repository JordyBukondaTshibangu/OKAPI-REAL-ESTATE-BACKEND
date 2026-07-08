-- Migration: agent_profile_redesign
-- Adds AgentType + RentalFocus enums, new Agent profile fields,
-- new Agency fields, and makes legacy Agency columns nullable.
-- Old Agent columns (title, brokerLicense, etc.) are intentionally
-- kept — they will be dropped in a separate migration after all
-- consumers have been updated.

-- ─── New enums ───────────────────────────────────────────────────
CREATE TYPE "AgentType" AS ENUM ('COMMISSIONNAIRE', 'AGENT', 'AGENCY_OWNER', 'OTHER');
CREATE TYPE "RentalFocus" AS ENUM ('LONG_TERM', 'SHORT_TERM', 'BOTH');

-- ─── Agent: new profile fields ────────────────────────────────────
ALTER TABLE "Agent"
  ADD COLUMN "agentType"            "AgentType"   NOT NULL DEFAULT 'COMMISSIONNAIRE',
  ADD COLUMN "communes"             TEXT[]        NOT NULL DEFAULT '{}',
  ADD COLUMN "propertyTypes"        TEXT[]        NOT NULL DEFAULT '{}',
  ADD COLUMN "rentalFocus"          "RentalFocus" NOT NULL DEFAULT 'LONG_TERM',
  ADD COLUMN "yearsExperienceLabel" TEXT,
  ADD COLUMN "referredById"         TEXT,
  ADD COLUMN "freeListingCap"       INTEGER       NOT NULL DEFAULT 10;

-- ─── Agency: make legacy columns nullable ─────────────────────────
ALTER TABLE "Agency"
  ALTER COLUMN "monogram"    DROP NOT NULL,
  ALTER COLUMN "accentClass" DROP NOT NULL,
  ALTER COLUMN "tagline"     DROP NOT NULL,
  ALTER COLUMN "description" DROP NOT NULL,
  ALTER COLUMN "address"     DROP NOT NULL,
  ALTER COLUMN "founded"     DROP NOT NULL;

-- ─── Agency: new fields ───────────────────────────────────────────
ALTER TABLE "Agency"
  ADD COLUMN "whatsapp"           TEXT,
  ADD COLUMN "communes"           TEXT[]        NOT NULL DEFAULT '{}',
  ADD COLUMN "propertyTypes"      TEXT[]        NOT NULL DEFAULT '{}',
  ADD COLUMN "rentalFocus"        "RentalFocus" NOT NULL DEFAULT 'BOTH',
  ADD COLUMN "rccmNumber"         TEXT,
  ADD COLUMN "verificationDocUrl" TEXT,
  ADD COLUMN "logoUrl"            TEXT,
  ADD COLUMN "gracePeriodEndsAt"  TIMESTAMP(3)  NOT NULL DEFAULT now() + interval '6 months',
  ADD COLUMN "freeListingCap"     INTEGER       NOT NULL DEFAULT 10;

-- ─── Backfill: map existing title → agentType ─────────────────────
UPDATE "Agent" SET "agentType" = 'AGENCY_OWNER' WHERE title = 'Propriétaire d''agence';
UPDATE "Agent" SET "agentType" = 'AGENT'         WHERE title = 'SUPERAGENT' OR title = 'AGENT EXCLUSIF';
-- Everything else defaults to COMMISSIONNAIRE (already set by column default)
