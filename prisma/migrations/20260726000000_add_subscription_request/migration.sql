-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'EXPIRED');

-- AlterTable: add subscription tracking fields to Agent
ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "subscriptionEndsAt" TIMESTAMP(3);
ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "renewalReminderSentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SubscriptionRequest" (
    "id"               TEXT NOT NULL,
    "agentId"          TEXT NOT NULL,
    "tier"             "AgentPlan" NOT NULL,
    "amount"           DOUBLE PRECISION NOT NULL,
    "currency"         TEXT NOT NULL DEFAULT 'USD',
    "paymentMethod"    "PaymentMethod" NOT NULL,
    "paymentReference" TEXT,
    "screenshotUrl"    TEXT,
    "status"           "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason"  TEXT,
    "confirmedBy"      TEXT,
    "confirmedAt"      TIMESTAMP(3),
    "periodStart"      TIMESTAMP(3),
    "periodEnd"        TIMESTAMP(3),
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SubscriptionRequest" ADD CONSTRAINT "SubscriptionRequest_agentId_fkey"
    FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
