#!/usr/bin/env bash
# Kineora Animation — build the Rust core to WASM, ALWAYS into the canonical
# runtime location `animator/ui/public/wasm/`.
#
# Why this script exists (BUG HISTORY): `wasm-pack --out-dir` is resolved
# RELATIVE TO THE CRATE DIRECTORY, not the caller's cwd. A bare relative
# `--out-dir public/wasm` therefore wrote into `core/public/wasm` instead of
# `ui/public/wasm`. This script computes ABSOLUTE paths from its own location,
# so it is cwd-independent and cannot drift.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CORE="$ROOT/animator/core"
UI="$ROOT/animator/ui"
CANONICAL="$UI/public/wasm"
NAME="kineora_core"

# 1) ensure the tool is present (friendly message + auto-install attempt).
bash "$ROOT/scripts/ensure-wasm-pack.sh"

# 2) remove any stale/legacy output that a previous bad config may have left
#    inside the crate dir (prevents duplicate packages).
if [ -d "$CORE/public" ]; then
  echo "→ removing stale output $CORE/public"
  rm -rf "$CORE/public"
fi

# 3) build into the canonical absolute directory.
mkdir -p "$CANONICAL"
echo "▶ wasm-pack build $CORE --target web --out-dir $CANONICAL --out-name $NAME"
wasm-pack build "$CORE" --target web --out-dir "$CANONICAL" --out-name "$NAME"

# 4) verify the exact artifacts the loader expects.
for f in "$NAME.js" "${NAME}_bg.wasm" "$NAME.d.ts"; do
  if [ ! -f "$CANONICAL/$f" ]; then
    echo "✗ expected artifact missing: $CANONICAL/$f" >&2
    exit 1
  fi
done

echo "✓ WASM package ready at: $CANONICAL/"
echo "  module: /wasm/$NAME.js"
