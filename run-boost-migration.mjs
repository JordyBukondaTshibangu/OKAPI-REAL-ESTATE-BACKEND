// One-off migration script — run with: node run-boost-migration.mjs
// Deletes itself is optional; safe to re-run (uses IF NOT EXISTS).

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Running boost migration...");

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "BoostStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'EXPIRED');
    EXCEPTION WHEN duplicate_object THEN null; END $$
  `);
  console.log("✓ BoostStatus enum");

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "PaymentMethod" AS ENUM ('ORANGE_MONEY', 'MTN_MONEY', 'AIRTEL_MONEY', 'CASH');
    EXCEPTION WHEN duplicate_object THEN null; END $$
  `);
  console.log("✓ PaymentMethod enum");

  await prisma.$executeRawUnsafe(`ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "isBoosted" BOOLEAN NOT NULL DEFAULT false`);
  console.log("✓ Property.isBoosted");

  await prisma.$executeRawUnsafe(`ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "boostedUntil" TIMESTAMP(3)`);
  console.log("✓ Property.boostedUntil");

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "BoostRequest" (
      "id"               TEXT NOT NULL,
      "propertyId"       TEXT NOT NULL,
      "agentId"          TEXT NOT NULL,
      "durationDays"     INTEGER NOT NULL,
      "amount"           DOUBLE PRECISION NOT NULL,
      "currency"         TEXT NOT NULL DEFAULT 'USD',
      "paymentMethod"    "PaymentMethod" NOT NULL,
      "paymentReference" TEXT,
      "screenshotUrl"    TEXT,
      "status"           "BoostStatus" NOT NULL DEFAULT 'PENDING',
      "rejectionReason"  TEXT,
      "confirmedBy"      TEXT,
      "confirmedAt"      TIMESTAMP(3),
      "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "BoostRequest_pkey" PRIMARY KEY ("id")
    )
  `);
  console.log("✓ BoostRequest table");

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "BoostRequest"
      ADD CONSTRAINT IF NOT EXISTS "BoostRequest_propertyId_fkey"
      FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE
  `).catch(() => {}); // ignore if already exists

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "BoostRequest"
      ADD CONSTRAINT IF NOT EXISTS "BoostRequest_agentId_fkey"
      FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE
  `).catch(() => {}); // ignore if already exists

  console.log("✓ Foreign keys");

  // Record in Prisma migration history so migrate dev won't re-run it
  await prisma.$executeRawUnsafe(`
    INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
    VALUES (gen_random_uuid()::text, 'manual', NOW(), '20260723000000_add_boost_request', NULL, NULL, NOW(), 1)
    ON CONFLICT (migration_name) DO NOTHING
  `).catch(() => {}); // ignore if _prisma_migrations table schema differs

  console.log("✓ Migration recorded");
  console.log("\nDone! Restart your backend server.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
