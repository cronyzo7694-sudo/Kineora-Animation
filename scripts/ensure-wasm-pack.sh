#!/usr/bin/env bash
# Kineora Animation — ensure wasm-pack is available, with a clear message if not.
set -uo pipefail

if command -v wasm-pack >/dev/null 2>&1; then
  exit 0
fi

echo "────────────────────────────────────────────────────────────"
echo "  wasm-pack not found (needed to build the Rust core → WASM)"
echo "────────────────────────────────────────────────────────────"
echo "  Install it ONE of these ways:"
echo ""
echo "  1) fast (official installer):"
echo "     curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh"
echo ""
echo "  2) via cargo (slow, compiles):"
echo "     cargo install wasm-pack"
echo ""
echo "  Then re-run: npm run wasm"
echo "────────────────────────────────────────────────────────────"

# Try the fast installer automatically when network is available.
if command -v curl >/dev/null 2>&1; then
  echo "→ attempting automatic install (installer)…"
  curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh || true
fi

if command -v wasm-pack >/dev/null 2>&1; then
  echo "✓ wasm-pack installed"
  exit 0
fi

echo "✗ automatic install failed — install manually (options above), then re-run."
exit 1
