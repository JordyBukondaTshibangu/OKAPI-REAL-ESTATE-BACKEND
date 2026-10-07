#!/bin/sh
set -e

echo "[entrypoint] DATABASE_URL set: $([ -n "$DATABASE_URL" ] && echo YES || echo NO)"
echo "[entrypoint] NODE_ENV: $NODE_ENV"

echo "[entrypoint] running prisma migrate deploy"
if ! node_modules/.bin/prisma migrate deploy; then
  echo "[entrypoint] WARNING: prisma migrate deploy failed — starting app anyway"
fi

echo "[entrypoint] starting app"
exec node dist/src/main.js
