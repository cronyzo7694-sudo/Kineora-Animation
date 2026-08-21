#!/usr/bin/env bash
# Kineora Animation — native desktop DEVELOPMENT launch (Linux PC).
# No installer per iteration: builds the Rust core → WASM, installs UI deps,
# then runs `tauri dev` (hot-reloads the UI; rebuilds the shell on Rust change).
#
# Prerequisites (one-time):
#   1. Rust: https://rustup.rs
#   2. wasm-pack: https://rustwasm.github.io/wasm-pack/installer/  (or `cargo install wasm-pack`)
#   3. Linux GUI libs (Debian/Ubuntu/Mint):
#        sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

command -v cargo >/dev/null || { echo "ERROR: Rust not installed — https://rustup.rs"; exit 1; }
command -v wasm-pack >/dev/null || { echo "Installing wasm-pack…"; cargo install wasm-pack; }

# Desktop-shell system deps (webkit2gtk-4.1 etc.) — clear one-command fix.
if ! pkg-config --exists webkit2gtk-4.1 2>/dev/null; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Missing desktop system libraries (webkit2gtk-4.1)."
  echo "  Install everything at once:   bash scripts/install-linux-deps.sh"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 1
fi

echo "▶ building core → wasm…"
bash "$ROOT/scripts/build-wasm.sh"

echo "▶ installing UI + desktop deps…"
(cd "$ROOT/animator/ui" && npm ci --silent)
(cd "$ROOT/animator/desktop" && npm install --silent)

echo "▶ launching the Kineora desktop window (tauri dev)…"
cd "$ROOT/animator/desktop"
npx tauri dev
