#!/usr/bin/env bash
# Kineora Animation — regression for the WASM output-directory bug.
#
# Proves, WITHOUT the Rust toolchain, that `build-wasm.sh` resolves the output
# to the canonical `animator/ui/public/wasm/` (not the crate dir), by injecting
# a FAKE `wasm-pack` that records the `--out-dir` it was invoked with.
#
# Passes only when:
#   - the fake wasm-pack received an ABSOLUTE out-dir ending in /ui/public/wasm
#   - the generated artifacts land at that canonical location
#   - no stale package appears under animator/core/public
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CANONICAL="$ROOT/animator/ui/public/wasm"
FAKE_BIN="$(mktemp -d)"
RECORD="$FAKE_BIN/outdir.txt"
CLEANUP_CORE_PUBLIC=0

cleanup() {
  rm -rf "$FAKE_BIN"
  rm -rf "$ROOT/animator/ui/public/wasm"   # generated mock artifacts
  if [ "$CLEANUP_CORE_PUBLIC" = "1" ]; then
    rm -rf "$ROOT/animator/core/public"
  fi
}
trap cleanup EXIT

# Fake wasm-pack: parse --out-dir / --out-name, write mock artifacts there.
cat > "$FAKE_BIN/wasm-pack" <<'EOF'
#!/usr/bin/env bash
out=""; name=""; crate=""
while [ $# -gt 0 ]; do
  case "$1" in
    --out-dir) out="$2"; shift 2;;
    --out-name) name="$2"; shift 2;;
    --target) shift 2;;
    *) crate="$1"; shift;;
  esac
done
[ -n "$out" ] || { echo "fake wasm-pack: missing --out-dir" >&2; exit 2; }
mkdir -p "$out"
printf 'export function kineora_status(){ return "{}" }\nexport default async function init(){ return {} }\n' > "$out/$name.js"
: > "$out/${name}_bg.wasm"
printf 'export type KineoraWasm = unknown\n' > "$out/$name.d.ts"
printf '{"type":"module"}\n' > "$out/package.json"
echo "$out" > "$RECORD"
EOF
chmod +x "$FAKE_BIN/wasm-pack"

# Inject the fake into PATH (overrides the real wasm-pack if present).
export PATH="$FAKE_BIN:$PATH"
export RECORD="$RECORD"

echo "→ running build-wasm.sh with fake wasm-pack…"
bash "$ROOT/scripts/build-wasm.sh" >/dev/null

OUTDIR="$(cat "$FAKE_BIN/outdir.txt")"
echo "→ wasm-pack received --out-dir: $OUTDIR"

# Assertions
if [ "$OUTDIR" != "$CANONICAL" ]; then
  echo "✗ FAIL: out-dir is '$OUTDIR', expected canonical '$CANONICAL'" >&2
  exit 1
fi

for f in kineora_core.js kineora_core_bg.wasm kineora_core.d.ts; do
  [ -f "$CANONICAL/$f" ] || { echo "✗ FAIL: missing $CANONICAL/$f" >&2; exit 1; }
done

if [ -d "$ROOT/animator/core/public" ]; then
  echo "✗ FAIL: stale package present at animator/core/public" >&2
  exit 1
fi

echo "✓ PASS: canonical out-dir + artifacts present + no stale core/public"
