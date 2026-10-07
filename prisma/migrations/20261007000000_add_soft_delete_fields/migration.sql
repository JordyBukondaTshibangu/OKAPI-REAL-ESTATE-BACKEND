-- Add DELETED_BY_AGENT and DELETED_BY_ADMIN to ListingStatus enum
ALTER TYPE "ListingStatus" ADD VALUE IF NOT EXISTS 'DELETED_BY_AGENT';
ALTER TYPE "ListingStatus" ADD VALUE IF NOT EXISTS 'DELETED_BY_ADMIN';

-- Add soft-delete audit trail columns to Property
ALTER TABLE "Property"
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
