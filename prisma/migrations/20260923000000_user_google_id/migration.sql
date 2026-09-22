-- Make passwordHash and phoneNumber optional (for Google sign-in users)
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "phoneNumber" DROP NOT NULL;

-- Add googleId field
ALTER TABLE "User" ADD COLUMN "googleId" TEXT;
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
