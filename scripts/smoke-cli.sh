#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SMOKE_X_URL:-}" ]]; then
  echo "Missing SMOKE_X_URL (example: https://x.com/<user>/status/<id>)"
  exit 1
fi

SMOKE_TOPIC_VALUE="${SMOKE_TOPIC:-AI agents}"

echo "Running analyze smoke test..."
npm run cli -- analyze --url "$SMOKE_X_URL" --pretty >/tmp/rabbitbrain-smoke-analyze.json

echo "Running discover smoke test..."
npm run cli -- discover --topic "$SMOKE_TOPIC_VALUE" --pretty >/tmp/rabbitbrain-smoke-discover.json

echo "Smoke test complete."
echo "Analyze output: /tmp/rabbitbrain-smoke-analyze.json"
echo "Discover output: /tmp/rabbitbrain-smoke-discover.json"
