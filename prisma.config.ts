import { defineConfig } from "prisma/config";
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

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: getDatabaseUrl(),
  },
});
