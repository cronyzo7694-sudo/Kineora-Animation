#!/usr/bin/env bash
# Kineora Animation — local dev bootstrap (Linux PC).
# 1. build the Rust core to WASM, 2. install UI deps, 3. start dev server.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

command -v cargo >/dev/null || { echo "ERROR: Rust not installed — https://rustup.rs"; exit 1; }
command -v wasm-pack >/dev/null || { echo "Installing wasm-pack…"; cargo install wasm-pack; }

echo "▶ building core → wasm…"
cd "$ROOT/animator/ui"
npm run wasm

echo "▶ installing UI deps…"
npm ci

echo "▶ starting dev server (http://localhost:5173)…"
npm run dev
