import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { mkdirSync } from "fs";
import { join } from "path";
import { AppModule } from "./app.module";

async function bootstrap() {
  console.log("[boot] starting, cwd =", process.cwd(), "PORT =", process.env.PORT);

  mkdirSync(join(process.cwd(), "uploads", "avatars"), { recursive: true });
  console.log("[boot] uploads dir ready");

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  console.log("[boot] Nest app created");

  app.useStaticAssets(join(process.cwd(), "uploads"), { prefix: "/uploads" });

  const config = new DocumentBuilder()
    .setTitle("Okapi Real Estate API")
    .setDescription("REST API for the Okapi Real Estate platform")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, documentFactory);
  console.log("[boot] swagger set up");

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: ["http://localhost:3001", "http://localhost:3000"],
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
