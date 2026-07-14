-- AlterTable
ALTER TABLE "Agent" ALTER COLUMN "graceEndsAt" SET DEFAULT now() + interval '6 months';
