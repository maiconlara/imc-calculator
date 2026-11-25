#!/bin/sh
set -eu
umask 077

if [ -z "${JWT_ACCESS_SECRET:-}" ]; then
  secret_file="$(dirname "$DB_DATABASE")/jwt-access-secret"
  if [ ! -s "$secret_file" ]; then
    node -e "process.stdout.write(require('node:crypto').randomBytes(48).toString('base64url'))" > "$secret_file"
  fi
  JWT_ACCESS_SECRET="$(cat "$secret_file")"
  export JWT_ACCESS_SECRET
fi

node --enable-source-maps dist/migrate.mjs
exec node --enable-source-maps dist/main.mjs
