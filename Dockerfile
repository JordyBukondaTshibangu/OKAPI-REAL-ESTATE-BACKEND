# force rebuild v2
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npm run build

# Debug: show what was built
RUN echo "=== dist contents ===" && ls -la /app/dist || echo "=== dist is MISSING ==="
RUN echo "=== checking for main ===" && find /app/dist -name "main*" 2>/dev/null || echo "main not found"

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

EXPOSE 3000

CMD ["node", "dist/main.js"]