-- Add missing deletionReason column to Property
ALTER TABLE "Property"
  ADD COLUMN IF NOT EXISTS "deletionReason" TEXT;
