import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./engine/actions', () => ({ downloadBlob: vi.fn() }))
import { downloadBlob } from './engine/actions'
import { platform } from './platform'

afterEach(() => {
  vi.clearAllMocks()
  delete (window as unknown as { __TAURI__?: unknown }).__TAURI__
})

describe('PlatformAdapter — browser mode (no Tauri runtime)', () => {
  it('detects the browser adapter in a plain web environment', () => {
    expect(platform.kind).toBe('browser')
    expect(platform.isDesktop()).toBe(false)
  })

  it('browser saveProjectAs prompts for a name and downloads', async () => {
    window.prompt = () => 'my-anim'
    const res = await platform.saveProjectAs('Untitled-1', '{"settings":{}}')
    expect(res).toEqual({ path: '', name: 'my-anim' })
    expect(downloadBlob).toHaveBeenCalledWith('my-anim.json', '{"settings":{}}', 'application/json')
  })

  it('browser saveProjectAs cancelled → "cancelled" (no change)', async () => {
    window.prompt = () => null
    expect(await platform.saveProjectAs('Untitled-1', '{}')).toBe('cancelled')
    expect(downloadBlob).not.toHaveBeenCalled()
  })

  it('browser writeProject is a pathless re-download (honest P-1 equivalent)', async () => {
    const ok = await platform.writeProject(null, 'scene1', '{}')
    expect(ok).toBe(true)
    expect(downloadBlob).toHaveBeenCalledWith('scene1.json', '{}', 'application/json')
  })

  it('browser has no shell status / identity', async () => {
    expect(await platform.getShellStatus()).toBeNull()
    expect(await platform.getIdentity()).toBeNull()
  })
})

describe('PlatformAdapter — desktop mode (Tauri global present)', () => {
  async function loadDesktopAdapter() {
    const invoke = vi.fn(async (cmd: string) => {
      switch (cmd) {
        case 'open_project_file':
          return { path: '/home/u/a.json', name: 'a', content: '{}' }
        case 'save_project_file_as':
          return { path: '/home/u/a.json', name: 'a' }
        case 'write_project_file':
          return true
        case 'get_shell_status':
          return { product: 'Kineora Animation', version: '0.2.0', build_mode: 'development', platform: 'linux', arch: 'x86_64', engine: 'animator-core' }
        case 'get_identity':
          return { id: 'developer', display_name: 'Developer (local)', dev_only: true }
        case 'approve_close':
          return null
        default:
          return undefined
      }
    })
    ;(window as unknown as { __TAURI__?: unknown }).__TAURI__ = {
      core: { invoke },
      event: { listen: vi.fn(async () => () => {}) },
    }
    vi.resetModules()
    const mod = await import('./platform')
    return { adapter: mod.platform, invoke }
  }

  it('detects the desktop adapter when the Tauri global is present', async () => {
    const { adapter } = await loadDesktopAdapter()
    expect(adapter.kind).toBe('desktop')
    expect(adapter.isDesktop()).toBe(true)
  })

  it('routes open/save/save-as/write to the native commands', async () => {
    const { adapter, invoke } = await loadDesktopAdapter()
    const opened = await adapter.openProject()
    expect(invoke).toHaveBeenCalledWith('open_project_file', undefined)
    expect(opened).toEqual({ path: '/home/u/a.json', name: 'a', content: '{}' })

    const saved = await adapter.saveProjectAs('Untitled-1', '{}')
    expect(invoke).toHaveBeenCalledWith('save_project_file_as', { suggestedName: 'Untitled-1', content: '{}' })
    expect(saved).toEqual({ path: '/home/u/a.json', name: 'a' })

    expect(await adapter.writeProject('/home/u/a.json', 'a', '{}')).toBe(true)
    expect(invoke).toHaveBeenCalledWith('write_project_file', { path: '/home/u/a.json', content: '{}' })
  })

  it('desktop writeProject without a path fails honestly (no fake write)', async () => {
    const { adapter } = await loadDesktopAdapter()
    expect(await adapter.writeProject(null, 'a', '{}')).toBe(false)
  })

  it('reports shell status + development identity', async () => {
    const { adapter } = await loadDesktopAdapter()
    const status = await adapter.getShellStatus()
    expect(status?.platform).toBe('linux')
    expect(status?.engine).toBe('animator-core')
    const identity = await adapter.getIdentity()
    expect(identity?.display_name).toBe('Developer (local)')
    expect(identity?.dev_only).toBe(true)
  })

  it('approveClose invokes the native approve_close command', async () => {
    const { adapter, invoke } = await loadDesktopAdapter()
    await adapter.approveClose()
    expect(invoke).toHaveBeenCalledWith('approve_close', undefined)
  })

  it('onCloseRequested subscribes to the close-requested event and unsubscribes', async () => {
    const { adapter } = await loadDesktopAdapter()
    const cb = vi.fn()
    const off = adapter.onCloseRequested(cb)
    off() // unlisten returns noop (mock returns () => {})
    expect(cb).not.toHaveBeenCalled() // nothing emitted in the unit test
  })
})
