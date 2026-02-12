#!/usr/bin/env bash
set -euo pipefail

if [ -f .env.local ]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

DATABASE_URL_VALUE="${AUTH_DATABASE_URL:-${DATABASE_URL:-${POSTGRES_URL:-${POSTGRES_PRISMA_URL:-}}}}"
if [ -z "$DATABASE_URL_VALUE" ]; then
  echo "Missing auth DB URL. Set AUTH_DATABASE_URL (or DATABASE_URL/POSTGRES_URL/POSTGRES_PRISMA_URL)."
  exit 1
fi

npx @better-auth/cli@latest migrate --config lib/auth.ts --yes
