-- Add short-term rental fields to Property
ALTER TABLE "Property" ADD COLUMN "isShortTerm" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Property" ADD COLUMN "isLongTerm" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Property" ADD COLUMN "pricePerNight" DOUBLE PRECISION;
ALTER TABLE "Property" ADD COLUMN "minStayNights" INTEGER;
ALTER TABLE "Property" ADD COLUMN "maxStayNights" INTEGER;
ALTER TABLE "Property" ADD COLUMN "shortTermNotes" TEXT;
