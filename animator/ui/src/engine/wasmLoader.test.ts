import { describe, expect, it } from 'vitest'
import pkg from '../../package.json'
import { WASM_PKG_URL, getEngineStatus, loadEngine } from './client'

/**
 * Regression test for the WASM path/naming bug:
 * the loader's canonical URL MUST match what `npm run wasm` generates.
 *
 * Uses a JSON import (no Node builtins) so it compiles with a bare
 * TypeScript setup — no @types/node dependency — and runs in vitest.
 */
describe('WASM loader path consistency (regression)', () => {
  it('loader URL is exactly the canonical module the wasm script generates', () => {
    const cmd: string = (pkg as { scripts: Record<string, string> }).scripts.wasm
    expect(cmd, 'wasm script must exist').toBeTruthy()
    // canonical output dir + name
    expect(cmd).toMatch(/--out-dir public\/wasm/)
    expect(cmd).toMatch(/--out-name kineora_core/)
    // public/ is served at root → module URL is /wasm/<out-name>.js
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
