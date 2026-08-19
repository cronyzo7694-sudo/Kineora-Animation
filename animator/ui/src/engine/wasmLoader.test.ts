import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { WASM_PKG_URL, getEngineStatus, loadEngine } from './client'

const here = dirname(fileURLToPath(import.meta.url))

function readPackageJson(): { scripts: Record<string, string> } {
  return JSON.parse(readFileSync(resolve(here, '../../package.json'), 'utf8'))
}

/**
 * Regression test for the WASM path/naming bug:
 * the loader's canonical URL MUST match what `npm run wasm` generates.
 * This is a source-level check, so it runs without the WASM package present.
 */
describe('WASM loader path consistency (regression)', () => {
  it('loader URL is exactly the canonical module the wasm script generates', () => {
    const { scripts } = readPackageJson()
    const cmd = scripts.wasm
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
