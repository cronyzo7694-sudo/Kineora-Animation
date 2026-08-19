import { describe, expect, it } from 'vitest'
import pkg from '../../package.json'
import { WASM_PKG_URL, getEngineStatus, loadEngine } from './client'

/**
 * Regression tests for the WASM output-directory bugs.
 *
 * BUG-1 (fixed): `wasm-pack --out-dir` is resolved RELATIVE TO THE CRATE DIR,
 * so a bare `--out-dir public/wasm` wrote into `core/public/wasm` instead of
 * `ui/public/wasm`. The npm script now delegates to `scripts/build-wasm.sh`,
 * which computes an ABSOLUTE canonical path — so the npm script must NOT
 * contain any inline `--out-dir`.
 *
 * BUG-2 (fixed): the loader imported a path that never matched the generated
 * package. Loader and generator must share ONE canonical contract.
 *
 * These tests use a JSON import (no Node builtins), so they run on a bare
 * `npm ci` setup with no @types/node.
 */
describe('WASM output path consistency (regression)', () => {
  const scripts: Record<string, string> = (pkg as { scripts: Record<string, string> }).scripts

  it('wasm script delegates to the absolute-path build script (no inline --out-dir)', () => {
    const cmd = scripts.wasm
    expect(cmd, 'wasm script must exist').toBeTruthy()
    // The only safe shape: delegate to build-wasm.sh (cwd-independent).
    expect(cmd.trim()).toBe('bash ../../scripts/build-wasm.sh')
    // A bare relative --out-dir is the original bug — must not reappear.
    expect(cmd).not.toMatch(/--out-dir/)
    expect(cmd).not.toMatch(/--out-name/)
  })

  it('loader URL is exactly the canonical module the generator emits', () => {
    // build-wasm.sh emits `public/wasm/kineora_core.js`, served at site root.
    expect(WASM_PKG_URL).toBe('/wasm/kineora_core.js')
  })

  it('loader reports an honest "not attached" status when the package is absent', async () => {
    // In the test env the generated package does not exist; the loader must
    // fall back to an explicit error (never a fake "attached" state), and the
    // error must name the exact path it tried.
    const before = getEngineStatus()
    expect(before.kind).toBe('error')

    const after = await loadEngine()
    expect(after.kind).toBe('error')
    expect(after.detail).toContain(WASM_PKG_URL)
    expect(after.detail).toContain('npm run wasm')
  })
})
