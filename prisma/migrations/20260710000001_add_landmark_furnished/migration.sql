-- AddColumn landmark and isFurnished to Property
ALTER TABLE "Property" ADD COLUMN "landmark" TEXT;
ALTER TABLE "Property" ADD COLUMN "isFurnished" BOOLEAN NOT NULL DEFAULT false;
