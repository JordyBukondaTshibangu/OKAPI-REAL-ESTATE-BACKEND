/*
  Warnings:

  - A unique constraint covering the columns `[propertyId,userId,action]` on the table `PropertyInteraction` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Agency" ALTER COLUMN "gracePeriodEndsAt" SET DEFAULT now() + interval '6 months';

-- AlterTable
ALTER TABLE "Agent" ALTER COLUMN "graceEndsAt" SET DEFAULT now() + interval '6 months';

-- Drop the old partial index (WHERE userId IS NOT NULL) and replace with the
-- full unique index that matches the @@unique in schema.prisma
DROP INDEX IF EXISTS "PropertyInteraction_propertyId_userId_action_key";

-- CreateIndex
CREATE UNIQUE INDEX "PropertyInteraction_propertyId_userId_action_key" ON "PropertyInteraction"("propertyId", "userId", "action");
