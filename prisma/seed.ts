// prisma/seed.ts

import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

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
  .finally(() => prisma.$disconnect());