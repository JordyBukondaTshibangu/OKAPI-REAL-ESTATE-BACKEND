import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
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

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const pool = new Pool({ connectionString: getDatabaseUrl() });
    const adapter = new PrismaPg(pool);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super({ adapter } as any);
  }

  async onModuleInit() {
    await this.$connect();
  }
}
