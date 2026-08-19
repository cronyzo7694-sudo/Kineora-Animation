#!/usr/bin/env bash
# Kineora Animation — commit + push (uses YOUR local git identity, no tokens here).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "▶ status…"
git status --short

if [ -z "$(git status --porcelain)" ]; then
  echo "Nothing to commit."
  exit 0
fi

echo "▶ adding (gitignore excludes node_modules/target/caches)…"
git add -A

echo "▶ staged files:"
git diff --cached --name-only | head -50

read -r -p "Commit message: " MSG
git commit -m "$MSG"
git push
echo "✅ pushed"
