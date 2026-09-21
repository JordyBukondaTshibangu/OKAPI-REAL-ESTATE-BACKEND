-- AlterTable
ALTER TABLE "Agency" ALTER COLUMN "gracePeriodEndsAt" SET DEFAULT now() + interval '6 months';

-- AlterTable
ALTER TABLE "Agent" ALTER COLUMN "graceEndsAt" SET DEFAULT now() + interval '6 months';
