#!/usr/bin/env bash
set -euo pipefail

REPO="rohunvora/x-research-skill"
REF="${1:-main}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENDOR_DIR="$ROOT_DIR/vendor/x-research-skill"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

echo "Syncing $REPO@$REF"

git clone --depth 1 --branch "$REF" "https://github.com/$REPO.git" "$TMP_DIR/repo"
UPSTREAM_COMMIT="$(git -C "$TMP_DIR/repo" rev-parse HEAD)"
SNAPSHOT_DATE="$(date -u +%F)"

cp "$TMP_DIR/repo/lib/api.ts" "$VENDOR_DIR/upstream-api.ts"
cp "$TMP_DIR/repo/SKILL.md" "$VENDOR_DIR/SKILL.md"
cp "$TMP_DIR/repo/README.md" "$VENDOR_DIR/README.md"

cat > "$VENDOR_DIR/UPSTREAM.lock" <<LOCK
repo=$REPO
ref=$REF
commit=$UPSTREAM_COMMIT
snapshot_date=$SNAPSHOT_DATE
source_files=lib/api.ts,SKILL.md,README.md
consumed_by=lib/xresearch/api.ts,lib/xresearch/provider.ts
runtime_mode=embedded_library
LOCK

echo "Updated vendor files to commit $UPSTREAM_COMMIT"
