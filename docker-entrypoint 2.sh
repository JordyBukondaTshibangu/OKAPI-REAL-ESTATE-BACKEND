#!/bin/sh
set -e

echo "[entrypoint] running prisma migrate deploy"
node_modules/.bin/prisma migrate deploy

echo "[entrypoint] starting app"
exec node dist/src/main.js
