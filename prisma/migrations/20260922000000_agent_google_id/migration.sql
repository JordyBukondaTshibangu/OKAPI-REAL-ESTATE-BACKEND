-- AlterTable: add googleId column to Agent for Google OAuth sign-in
ALTER TABLE "Agent" ADD COLUMN "googleId" TEXT;

-- CreateIndex: unique constraint on googleId
CREATE UNIQUE INDEX "Agent_googleId_key" ON "Agent"("googleId");
