import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

// ---------------------------------------------------------------------------
// Load .env file before anything else (Railway / production injects env vars
// directly, so this is a no-op there; locally it populates process.env).
// process.loadEnvFile() is built into Node.js ≥ 20.12 — no extra package.
// ---------------------------------------------------------------------------
try {
  (process as any).loadEnvFile(".env");
} catch {
  // File not present (e.g. CI or production with injected vars) — fine.
}

// ---------------------------------------------------------------------------
// Required environment variable check — crash fast in production if missing.
// ---------------------------------------------------------------------------
function checkEnv() {
  const required = [
    "DATABASE_URL",
    "JWT_SECRET",
    "R2_ACCOUNT_ID",
    "R2_BUCKET_NAME",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_PUBLIC_URL",
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(
      `[boot] ❌ Missing required environment variables: ${missing.join(", ")}`,
    );
    process.exit(1);
  }
  if (process.env.JWT_SECRET === "secret") {
    console.error(
      "[boot] ❌ JWT_SECRET is set to the insecure default 'secret' — set a strong random value in production.",
    );
    process.exit(1);
  }
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      "[boot] ⚠️  RESEND_API_KEY not set — transactional emails (OTP, admin notifications) will not be sent.",
    );
  }
}

async function bootstrap() {
  checkEnv();
  console.log(
    "[boot] starting, cwd =",
    process.cwd(),
    "PORT =",
    process.env.PORT,
  );

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  console.log("[boot] Nest app created");

  const config = new DocumentBuilder()
    .setTitle("Okapi Real Estate API")
    .setDescription("REST API for the Okapi Real Estate platform")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  // Only expose Swagger in non-production environments.
  if (process.env.NODE_ENV !== "production") {
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api", app, documentFactory);
    console.log("[boot] swagger set up (dev only)");
  } else {
    console.log("[boot] swagger disabled in production");
  }

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Derive allowed origins from env — supports multiple comma-separated values.
  // Falls back to localhost for local development only.
  const rawOrigins = process.env.CORS_ORIGINS ?? process.env.FRONTEND_URL ?? "";
  const allowedOrigins = rawOrigins
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const corsOrigin =
    allowedOrigins.length > 0
      ? allowedOrigins
      : ["http://localhost:3001", "http://localhost:3000"];
  console.log("[boot] CORS origins:", corsOrigin);

  app.enableCors({
    origin: corsOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 8080, "0.0.0.0");
  console.log("[boot] listening on", process.env.PORT ?? 8080);
}
bootstrap().catch((err) => {
  console.error("[boot] fatal error during bootstrap:", err);
  process.exit(1);
});
