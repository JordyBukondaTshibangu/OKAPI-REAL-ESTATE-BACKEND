import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { mkdirSync } from "fs";
import { join } from "path";
import { AppModule } from "./app.module";

async function bootstrap() {
  mkdirSync(join(process.cwd(), "uploads", "avatars"), { recursive: true });

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(process.cwd(), "uploads"), { prefix: "/uploads" });

  const config = new DocumentBuilder()
    .setTitle("Okapi Real Estate API")
    .setDescription("REST API for the Okapi Real Estate platform")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, documentFactory);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: ["http://localhost:3001", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 8080, '0.0.0.0');
}
bootstrap();
