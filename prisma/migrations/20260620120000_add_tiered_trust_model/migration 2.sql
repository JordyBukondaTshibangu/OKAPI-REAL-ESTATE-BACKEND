-- CreateEnum
CREATE TYPE "AgentVerificationTier" AS ENUM ('NON_VERIFIE', 'VERIFIE', 'PARTENAIRE_CONFIANCE');

-- CreateEnum
CREATE TYPE "DocumentReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReferenceType" AS ENUM ('AGENT', 'AGENCY', 'COMMISSIONNAIRE');

-- CreateEnum
CREATE TYPE "ReferenceStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REVOKED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "AgencyVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "Agent" DROP CONSTRAINT "Agent_agencyId_fkey";

-- AlterTable: relax fields that no longer need to be supplied up-front at
-- agent self-signup time. Existing rows already have real values, so
-- loosening NOT NULL / adding a DEFAULT does not touch existing data.
ALTER TABLE "Agent"
  ALTER COLUMN "agencyId" DROP NOT NULL,
  ALTER COLUMN "title" SET DEFAULT 'Agent',
  ALTER COLUMN "specialization" SET DEFAULT '',
  ALTER COLUMN "nationality" SET DEFAULT '',
  ALTER COLUMN "languages" SET DEFAULT ARRAY[]::TEXT[],
  ALTER COLUMN "yearsExperience" SET DEFAULT 0,
  ALTER COLUMN "experienceSince" SET DEFAULT 0,
  ALTER COLUMN "rating" SET DEFAULT 0,
  ALTER COLUMN "ratingsCount" SET DEFAULT 0,
  ALTER COLUMN "responseMinutes" SET DEFAULT 0,
  ALTER COLUMN "brokerLicense" DROP NOT NULL,
  ALTER COLUMN "bio" SET DEFAULT '',
  ALTER COLUMN "photo" SET DEFAULT '',
  ALTER COLUMN "photoGradient" SET DEFAULT 'from-slate-400 to-slate-600',
  ALTER COLUMN "agencyAccent" SET DEFAULT '',
  ALTER COLUMN "agencyMonogram" SET DEFAULT '';

-- AlterTable: add self-signup auth columns
ALTER TABLE "Agent" ADD COLUMN     "email" TEXT,
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "whatsappNumber" TEXT,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);

-- AlterTable: add verification columns.
-- verificationTier / idDocumentStatus / firstListingChecked are added with a
-- DEFAULT that backfills *existing* agents as already-trusted (they were
-- already curated/live on the site), then the DEFAULT is switched so any
-- newly-created agent starts at the bottom of the trust ladder instead.
ALTER TABLE "Agent" ADD COLUMN     "verificationTier" "AgentVerificationTier" NOT NULL DEFAULT 'VERIFIE',
ADD COLUMN     "idDocumentUrl" TEXT,
ADD COLUMN     "idDocumentStatus" "DocumentReviewStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "firstListingChecked" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "partnerSince" TIMESTAMP(3),
ADD COLUMN     "lastTierCheckedAt" TIMESTAMP(3),
ADD COLUMN     "complaintCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "flagged" BOOLEAN NOT NULL DEFAULT false;

-- Backfill verifiedAt for pre-existing agents using their original creation date.
UPDATE "Agent" SET "verifiedAt" = "createdAt" WHERE "verifiedAt" IS NULL;

-- Switch the defaults so every agent created from now on starts as a fresh,
-- unverified self-signup instead of inheriting the legacy "already trusted" backfill.
ALTER TABLE "Agent"
  ALTER COLUMN "verificationTier" SET DEFAULT 'NON_VERIFIE',
  ALTER COLUMN "idDocumentStatus" SET DEFAULT 'PENDING',
  ALTER COLUMN "firstListingChecked" SET DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Agent_email_key" ON "Agent"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_phoneNumber_key" ON "Agent"("phoneNumber");

-- AddForeignKey (now optional, defaults to SET NULL instead of RESTRICT)
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: agency verification gate.
-- Same backfill pattern: existing agencies are already in active use, so
-- they're marked APPROVED on migration, while the column DEFAULT is then
-- switched to PENDING for any agency registered going forward.
ALTER TABLE "Agency" ADD COLUMN     "verificationStatus" "AgencyVerificationStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "businessProofUrl" TEXT,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "standingFlagged" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Agency" SET "approvedAt" = "createdAt" WHERE "approvedAt" IS NULL;

ALTER TABLE "Agency" ALTER COLUMN "verificationStatus" SET DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "AgentReference" (
    "id" TEXT NOT NULL,
    "type" "ReferenceType" NOT NULL,
    "agentId" TEXT NOT NULL,
    "voucherAgentId" TEXT,
    "voucherAgencyId" TEXT,
    "voucherName" TEXT,
    "voucherContact" TEXT,
    "status" "ReferenceStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentComplaint" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "reporterUserId" TEXT,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentComplaint_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AgentReference" ADD CONSTRAINT "AgentReference_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentReference" ADD CONSTRAINT "AgentReference_voucherAgentId_fkey" FOREIGN KEY ("voucherAgentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentReference" ADD CONSTRAINT "AgentReference_voucherAgencyId_fkey" FOREIGN KEY ("voucherAgencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentComplaint" ADD CONSTRAINT "AgentComplaint_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentComplaint" ADD CONSTRAINT "AgentComplaint_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
