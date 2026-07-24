-- CreateEnum
CREATE TYPE "BoostStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('ORANGE_MONEY', 'MTN_MONEY', 'AIRTEL_MONEY', 'CASH');

-- AlterTable (boostedUntil already exists from 20260705120000_monetization_plan)
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "isBoosted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "BoostRequest" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentReference" TEXT,
    "screenshotUrl" TEXT,
    "status" "BoostStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "confirmedBy" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoostRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BoostRequest" ADD CONSTRAINT "BoostRequest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoostRequest" ADD CONSTRAINT "BoostRequest_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
