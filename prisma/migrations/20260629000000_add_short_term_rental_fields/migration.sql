-- AlterTable: add short-term rental fields to Property
ALTER TABLE "Property"
  ADD COLUMN "isShortTerm"    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "isLongTerm"     BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "pricePerNight"  DOUBLE PRECISION,
  ADD COLUMN "minStayNights"  INTEGER,
  ADD COLUMN "maxStayNights"  INTEGER,
  ADD COLUMN "shortTermNotes" TEXT;

-- Backfill: explicitly set all existing properties to long-term only.
-- The ADD COLUMN defaults above already do this in PostgreSQL, but this
-- UPDATE makes the intent explicit and guards against any edge cases.
UPDATE "Property"
SET "isLongTerm" = true, "isShortTerm" = false
WHERE "isLongTerm" IS DISTINCT FROM true OR "isShortTerm" IS DISTINCT FROM false;
