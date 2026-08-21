#!/usr/bin/env bash
# Kineora Animation — PRODUCTION desktop build (Linux PC).
# Builds the WASM core → production UI → the Tauri release binary, then
# bundles platform distributables (deb/rpm/AppImage on Linux) into
#   animator/desktop/src-tauri/target/release/bundle/
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

command -v cargo >/dev/null || { echo "ERROR: Rust not installed — https://rustup.rs"; exit 1; }
command -v wasm-pack >/dev/null || { echo "Installing wasm-pack…"; cargo install wasm-pack; }

echo "▶ building core → wasm…"
bash "$ROOT/scripts/build-wasm.sh"

echo "▶ installing UI + desktop deps…"
(cd "$ROOT/animator/ui" && npm ci --silent)
(cd "$ROOT/animator/desktop" && npm install --silent)

echo "▶ building + bundling the Kineora desktop app…"
cd "$ROOT/animator/desktop"
npx tauri build
