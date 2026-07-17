-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PENDING', 'LIVE', 'HIDDEN', 'REJECTED', 'EXPIRED');

-- AlterTable: make agencyId optional and add listing lifecycle fields
ALTER TABLE "Property"
  ALTER COLUMN "agencyId" DROP NOT NULL,
  ADD COLUMN "status"          "ListingStatus" NOT NULL DEFAULT 'LIVE',
  ADD COLUMN "isPublished"     BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "publishedAt"     TIMESTAMP(3),
  ADD COLUMN "expiresAt"       TIMESTAMP(3),
  ADD COLUMN "rejectionReason" TEXT,
  ADD COLUMN "flagCount"       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "whatsappClicks"  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "coverImageIndex" INTEGER NOT NULL DEFAULT 0;

-- Backfill: existing rows are already live
UPDATE "Property" SET "publishedAt" = "createdAt" WHERE "status" = 'LIVE';
