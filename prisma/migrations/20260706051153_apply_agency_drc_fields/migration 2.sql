-- AlterTable
ALTER TABLE "Agency" ALTER COLUMN "specializations" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "areasServed" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "languages" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "certifications" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "gracePeriodEndsAt" SET DEFAULT now() + interval '6 months';

-- AlterTable
ALTER TABLE "Agent" ALTER COLUMN "graceEndsAt" SET DEFAULT now() + interval '6 months';
