import { beforeEach, describe, expect, it } from 'vitest'
import pkg from '../../package.json'
import {
  WASM_BG_URL,
  WASM_PKG_URL,
  getEngine,
  loadEngine,
  resetEngineForTests,
} from './client'

/**
 * Regression tests for the WASM loading bugs.
 *
 * BUG-1 (fixed): `wasm-pack --out-dir` is crate-relative → script delegates to
 * scripts/build-wasm.sh (absolute path).
 *
 * BUG-2 (fixed): Vite forbids `import()` of a `public/` file as a source
 * module. The loader now fetches the glue as TEXT, evaluates it via a Blob URL
 * (browser-native import), and passes the `.wasm` bytes EXPLICITLY to the
 * wasm-bindgen default init — so it never relies on `import.meta.url`
 * resolution. These tests prove the full flow with injected fakes, plus the
 * honest-fallback path.
 */

function okResponse(body: string | ArrayBuffer, status = 200): Response {
  return new Response(body as BodyInit, { status })
}

describe('WASM output path consistency (regression)', () => {
  const scripts: Record<string, string> = (pkg as { scripts: Record<string, string> }).scripts

  it('wasm script delegates to the absolute-path build script (no inline --out-dir)', () => {
    expect(scripts.wasm.trim()).toBe('bash ../../scripts/build-wasm.sh')
    expect(scripts.wasm).not.toMatch(/--out-dir/)
    expect(scripts.wasm).not.toMatch(/--out-name/)
  })

  it('loader URLs match the canonical generated package', () => {
    expect(WASM_PKG_URL).toBe('/wasm/kineora_core.js')
    expect(WASM_BG_URL).toBe('/wasm/kineora_core_bg.wasm')
  })
})

describe('WASM runtime loader (public asset → attached engine)', () => {
  beforeEach(() => resetEngineForTests())

  it('fetches the public module + wasm, evaluates via Blob URL, and calls init (attached)', async () => {
    let initArg: unknown = null
    let blobType = ''
    let importedUrl = ''

    const stubModule = {
      default: async (input: unknown) => {
        initArg = input
      },
      kineora_status: () =>
        JSON.stringify({ playhead: 1, selection: [], undo_len: 0, redo_len: 0, scene: 'Scene 1', layer: 'Layer 1', fps: 24, event_log: [] }),
    }

    const fetchImpl = async (url: string) => {
      if (url === WASM_PKG_URL) return okResponse('export default async function init(i){ return i }')
      if (url === WASM_BG_URL) return okResponse(new ArrayBuffer(8))
      throw new Error(`unexpected url ${url}`)
    }
    const importImpl = async (url: string) => {
      importedUrl = url
      return stubModule
    }
    const createObjectUrl = (b: Blob) => {
      blobType = b.type
      return 'blob:fake-module'
    }
    const revokeObjectUrl = () => {}

    const status = await loadEngine({ fetchImpl, importImpl, createObjectUrl, revokeObjectUrl })

    expect(status.kind).toBe('ok')
    expect(getEngine()).toBe(stubModule)
    // glue evaluated as a JS module via a Blob URL…
    expect(importedUrl).toBe('blob:fake-module')
    expect(blobType).toBe('text/javascript')
    // …and init received the EXPLICITLY-resolved wasm binary.
    expect(initArg).toBeInstanceOf(ArrayBuffer)
    expect((initArg as ArrayBuffer).byteLength).toBe(8)
  })

  it('reports an honest error (naming the exact URL) when the package is absent', async () => {
    const fetchImpl = async (url: string) => {
      throw new Error(`404 for ${url}`)
    }
    const status = await loadEngine({ fetchImpl })
    expect(status.kind).toBe('error')
    expect(status.detail).toContain(WASM_PKG_URL)
    expect(status.detail).toContain('npm run wasm')
    expect(getEngine()).toBeNull()
  })
})
