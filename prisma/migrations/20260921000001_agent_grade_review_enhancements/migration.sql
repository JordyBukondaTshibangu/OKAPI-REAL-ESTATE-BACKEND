-- Create AgentGrade enum
CREATE TYPE "AgentGrade" AS ENUM ('NOUVEAU', 'ACTIF', 'FIABLE', 'EXPERT');

-- Add grade to Agent
ALTER TABLE "Agent" ADD COLUMN "grade" "AgentGrade" NOT NULL DEFAULT 'NOUVEAU';

-- Add sub-ratings and moderation fields to Review
ALTER TABLE "Review" ADD COLUMN "ratingReactivite"        INTEGER;
ALTER TABLE "Review" ADD COLUMN "ratingHonnetete"         INTEGER;
ALTER TABLE "Review" ADD COLUMN "ratingProfessionnalisme" INTEGER;
ALTER TABLE "Review" ADD COLUMN "isVisible"  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Review" ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false;

-- Publish all existing reviews (they were visible before moderation was introduced)
UPDATE "Review" SET "isVisible" = true;
