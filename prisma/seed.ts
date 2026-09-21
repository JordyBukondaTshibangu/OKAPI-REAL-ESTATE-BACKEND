// prisma/seed.ts

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as bcrypt from "bcrypt";
import { readFileSync } from "fs";
import { join } from "path";

function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const env = readFileSync(join(process.cwd(), ".env"), "utf-8");
    const match = env.match(/^DATABASE_URL\s*=\s*"?([^"\n]+)"?/m);
    if (match?.[1]) return match[1];
  } catch {}
  return "";
}

const pool = new Pool({ connectionString: getDatabaseUrl() });
const adapter = new PrismaPg(pool);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("🌱 Seeding database...");

  const passwordHash = await bcrypt.hash("OkapiRealEstate@2026", 10);

  const admin = await prisma.admin.upsert({
    where: { email: "admin@okapi-real-estate.com" },
    update: { passwordHash },
    create: {
      email: "admin@okapi-real-estate.com",
      passwordHash,
    },
  });

  console.log("✅ Admin created:", admin.email);
  console.log("\nCredentials:");
  console.log("  Email:    admin@okapi-real-estate.com");
  console.log("  Password: OkapiRealEstate@2026");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
