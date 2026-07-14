
OKAPI REAL ESTATE BACKEND
Deployment & Infrastructure Guide
NestJS · Prisma · PostgreSQL · Railway · Cloudflare · GitHub Actions

1. Infrastructure Overview
The OKAPI Real Estate backend is a NestJS application deployed on Railway, using Prisma ORM with a managed PostgreSQL database, proxied through Cloudflare for SSL and DDoS protection, with automated deployments via GitHub Actions.

Architecture


Railway IDs
RAILWAY_SERVICE_ID     = bd4e52fc-0336-44a4-a7d9-49facfdff828
RAILWAY_PROJECT_ID     = db48585d-1652-4202-b783-0d7cc7c6237e
RAILWAY_ENVIRONMENT_ID = dba71956-d94b-4ae2-8885-82ca14515a2c
2. Project Structure & Configuration
Dockerfile vs docker-compose.yml




Project Root Structure
okapi-real-estate-backend/
├── Dockerfile              ← builds the NestJS app (used by Railway)
├── docker-compose.yml      ← runs PostgreSQL locally only
├── package.json
├── nest-cli.json
├── prisma/
│   └── schema.prisma
└── src/
    └── main.ts

Dockerfile
Create a file named exactly 'Dockerfile' (no extension) in your project root. It uses a multi-stage build to keep the production image lean. The build script in package.json already runs prisma generate && nest build, so no need to duplicate it.
FROM node:20-alpine AS builder
 
WORKDIR /app
 
COPY package*.json ./
COPY prisma ./prisma/
 
# Install ALL deps including devDependencies (needed for nest build)
RUN npm ci
 
COPY . .
 
# Runs: prisma generate && nest build (from package.json)
RUN npm run build
 
# ---
 
FROM node:20-alpine AS runner
 
WORKDIR /app
 
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./
 
EXPOSE 3000
 
CMD ["node", "dist/main"]


main.ts — Port Configuration
The app must listen on process.env.PORT so Railway can dynamically assign the port.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT || 3000);
}
bootstrap();

Prisma Schema
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
 
generator client {
  provider = "prisma-client-js"
}

PrismaService
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
 
@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}

AppModule
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
 
@Module({
  imports: [PrismaModule],
})
export class AppModule {}
3. GitHub Actions — CI/CD Pipeline
Every push to the main branch triggers an automated workflow that installs dependencies, generates the Prisma client, builds the app, runs database migrations, and deploys to Railway.

# .github/workflows/deploy.yml
 
name: Deploy to Railway
 
on:
  push:
    branches:
      - main
 
jobs:
  deploy:
    name: Build & Deploy
    runs-on: ubuntu-latest
 
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
 
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
 
      - name: Install dependencies
        run: npm ci
 
      - name: Generate Prisma client
        run: npx prisma generate
 
      - name: Build NestJS app
        run: npm run build
 
      - name: Install Railway CLI
        run: npm install -g @railway/cli
 
      - name: Run Prisma migrations
        run: railway run --service ${{ secrets.RAILWAY_SERVICE_ID }} npx prisma migrate deploy
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
 
      - name: Deploy to Railway
        run: railway up --service ${{ secrets.RAILWAY_SERVICE_ID }} --detach
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

GitHub Secrets Required


4. Railway Setup
PostgreSQL Database
In Railway project → click New Service → Database → PostgreSQL
Railway auto-injects DATABASE_URL into your app service
No manual connection string needed

Environment Variables
Set these in Railway → your service → Variables tab:


Generating JWT_SECRET
Run one of these commands locally to generate a secure secret:
# Option 1 - Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
 
# Option 2 - OpenSSL
openssl rand -hex 64

5. Domain & DNS Configuration
Domain
Domain: okapi-real-estate.com
API Subdomain: api.okapi-real-estate.com

Cloudflare DNS Records


DNS Setup Steps
Add the CNAME record pointing api → Railway domain
Add the TXT record for Railway domain verification
Temporarily set proxy to DNS only (grey cloud) during verification
Once Railway shows ✅ Active, re-enable Cloudflare proxy (orange cloud)
SSL certificate is automatically provisioned by Cloudflare


6. Prisma & Database Migrations
Migration Workflow
Never use prisma db push in production. Always use migrations for data integrity.
# Create a new migration (local development)
npx prisma migrate dev --name your_migration_name
 
# Apply migrations in production (used in GitHub Actions)
npx prisma migrate deploy
 
# Open Prisma Studio to inspect data
npx prisma studio

package.json Scripts
"scripts": {
  "build": "nest build",
  "start:prod": "node dist/main.js",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate deploy",
  "prisma:studio": "prisma studio"
}


7. Local Development
Docker Compose (Local PostgreSQL)
Use docker-compose for local development only. Railway manages the production database.
services:
  postgres:
    image: postgres:16-alpine
    container_name: okapi_postgres
    environment:
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_DB: ${DB_NAME:-okapi_real_estate}
    ports:
      - "5432:5432"
    volumes:
      - okapi_postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
 
volumes:
  okapi_postgres_data:

Local .env File
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/okapi_real_estate
NODE_ENV=development
PORT=3000
JWT_SECRET=your_local_dev_secret

8. Deployment Flow Summary
End-to-end flow every time you push to main:




Go-Live Checklist

9. Troubleshooting & Issues Encountered
This section documents every issue encountered during deployment and how it was resolved.

Issue 1 — Cannot find module '/app/dist/main.js'

Root Causes
No .dockerignore file — local node_modules (263MB) was being copied into the container and conflicting with Docker-installed modules at COPY . . step
Railway was reusing a cached old image and not rebuilding
NestJS compiles to dist/src/main.js not dist/main.js when sourceRoot is set to 'src'
Railway's Start Command was overriding the Dockerfile CMD
Fixes Applied
Created .dockerignore file to exclude node_modules, dist, .env, .git
Updated Dockerfile CMD from dist/main.js to dist/src/main.js
Cleared Railway build cache and forced fresh rebuild
# .dockerignore
node_modules
dist
.env
.git
.gitignore
npm-debug.log
README.md

Issue 2 — npm ci fails (no package-lock.json)

Root Cause
The project used pnpm (visible in package.json pnpm config) but had no package-lock.json committed, so npm ci failed.
Fix Applied
Replaced npm ci with npm install in the Dockerfile. Long term, commit a package-lock.json by running npm install locally and pushing it.
# In Dockerfile — changed from:
RUN npm ci
 
# To:
RUN npm install

Issue 3 — Prisma OpenSSL Compatibility

Root Cause
node:20-alpine uses musl libc and doesn't include OpenSSL. Prisma's query engine requires libssl to run.
Fix Applied
Switched base image from node:20-alpine to node:20-slim (Debian-based)
Added apt-get install openssl to both builder and runner stages
Added binaryTargets to prisma/schema.prisma to explicitly target the correct OpenSSL version
# prisma/schema.prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-3.0.x"]
}
# Dockerfile runner stage
FROM node:20-slim AS runner
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

Issue 4 — App starts but healthcheck fails (IPv6 binding)

Root Cause
NestJS app.listen() without a host argument defaults to IPv6 ('::') binding. Railway's proxy uses IPv4 and cannot connect to an IPv6-only bound service.
Fix Applied
Added '0.0.0.0' as the second argument to app.listen() in main.ts to bind to all interfaces:
// src/main.ts — before
await app.listen(process.env.PORT ?? 3000);
 
// src/main.ts — after
await app.listen(process.env.PORT ?? 3000, '0.0.0.0');

Issue 5 — Database empty (500 errors on all endpoints)

Root Cause
Prisma migrations were never run on the production database. Railway PostgreSQL was provisioned but had no tables — the database was completely empty.
Fix — Run migrations via Railway CLI
# Step 1 — Install Railway CLI
npm install -g @railway/cli
 
# Step 2 — Login
railway login
 
# Step 3 — Link project (interactive)
cd okapi-real-estate-backend
railway link
 
# Step 4 — Run migrations
railway run npx prisma migrate deploy
 
# OR for first time setup (quicker)
railway run npx prisma db push
Alternative — Run with DATABASE_URL directly
Get DATABASE_URL from Railway → PostgreSQL service → Variables tab, then run:
DATABASE_URL="postgresql://user:pass@host:5432/db" npx prisma migrate deploy
 
# Or for first time:
DATABASE_URL="postgresql://user:pass@host:5432/db" npx prisma db push


Issue 6 — DNS CNAME verification failing

Root Cause
Railway requires both a CNAME record AND a TXT verification record. Only the CNAME was added initially. Additionally Cloudflare proxy (orange cloud) was ON during verification which blocked Railway's DNS check.
Fix Applied
Added TXT record: _railway-verify.api → railway-verify=d31f225eb4ef...
Temporarily set Cloudflare proxy to DNS only (grey cloud) during verification
Re-enabled Cloudflare proxy (orange cloud) after Railway showed domain as Active

Issue 7 — Swagger UI & API Testing
Swagger is already configured in main.ts using @nestjs/swagger. The full interactive API documentation is available at:
https://api.okapi-real-estate.com/api
CORS Configuration
The CORS config in main.ts only allows localhost origins. Update it when the production frontend domain is known:
app.enableCors({
  origin: [
    "http://localhost:3001",
    "http://localhost:3000",
    "https://your-production-frontend.com",  // ← add this
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});
10. Final Working Dockerfile
This is the final production-ready Dockerfile after all issues were resolved:

FROM node:20-slim AS builder
 
WORKDIR /app
 
RUN apt-get update -y && apt-get install -y openssl
 
COPY package*.json ./
COPY prisma ./prisma/
 
RUN npm install
 
COPY . .
 
RUN npm run build
 
# ---
 
FROM node:20-slim AS runner
 
WORKDIR /app
 
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
 
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./
 
EXPOSE 3000
 
CMD ["node", "dist/src/main.js"]


