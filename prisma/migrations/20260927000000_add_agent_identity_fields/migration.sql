-- CreateEnum
CREATE TYPE "ExperienceRange" AS ENUM ('LESS_THAN_1', 'ONE_TO_3', 'THREE_TO_5', 'FIVE_PLUS');

-- AlterTable
ALTER TABLE "Agent"
  ADD COLUMN "idDocumentRejectionReason" TEXT,
  ADD COLUMN "dateOfBirth" TIMESTAMP(3),
  ADD COLUMN "nationalIdNumber" TEXT,
  ADD COLUMN "selfieUrl" TEXT,
  ADD COLUMN "residenceCommune" TEXT,
  ADD COLUMN "profileComplete" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "experienceRange" "ExperienceRange";
