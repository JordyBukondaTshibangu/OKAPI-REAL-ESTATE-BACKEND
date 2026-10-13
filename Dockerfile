FROM node:22-slim AS builder

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm exec prisma generate

RUN pnpm run build

FROM node:22-slim AS runner

WORKDIR /app

# Install OpenSSL for Prisma + Liberation fonts for SVG text rendering (watermark)
RUN apt-get update -y && apt-get install -y openssl fonts-liberation && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY package.json ./
COPY docker-entrypoint.sh ./
# Copy logo and legacy watermark PNGs so they are available at runtime
COPY src/uploads/logo.png ./dist/src/uploads/logo.png
COPY src/uploads/watermark.png ./dist/src/uploads/watermark.png
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]