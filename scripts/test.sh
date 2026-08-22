#!/usr/bin/env bash
# Kineora Animation — run all automated tests (Linux PC).
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "━━━ Rust core tests ━━━"
(cd "$ROOT/animator/core" && cargo test) || CORE_FAIL=1

echo "━━━ Rust fmt + clippy ━━━"
(cd "$ROOT/animator/core" && cargo fmt --check && cargo clippy --all-targets) || LINT_FAIL=1

echo "━━━ UI tests ━━━"
(cd "$ROOT/animator/ui" && npm ci --silent && npm test) || UI_FAIL=1

echo
if [ -n "${CORE_FAIL:-}" ] || [ -n "${LINT_FAIL:-}" ] || [ -n "${UI_FAIL:-}" ]; then
  echo "❌ SOME TESTS FAILED"
  exit 1
fi
echo "✅ ALL TESTS PASSED"
