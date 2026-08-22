// ============================================================================
// PlatformAdapter — the desktop/browser capability boundary (desktop task §15).
//
// The React editor NEVER touches Linux/Tauri APIs directly; everything goes
// through this adapter, so the web build (browser mode) and the Tauri build
// (desktop mode) share the exact same application code. Platform-specific
// implementations live here (and in the Rust shell), never in the editor.
//
// Desktop (Tauri) uses the injected global `window.__TAURI__` (withGlobalTauri)
// so no Tauri npm dependency is required; the globals are simply absent in a
// browser, where the browser implementation takes over.
// ============================================================================

import { downloadBlob } from './engine/actions'

// ——— typed view of the Tauri global (present only inside the desktop webview) ———
interface TauriCore {
  invoke?: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>
}
interface TauriEvent {
  listen?: (event: string, handler: (e: { payload: unknown }) => void) => Promise<() => void>
}
interface TauriGlobal {
  core?: TauriCore
  event?: TauriEvent
}
declare global {
  interface Window {
    __TAURI__?: TauriGlobal
  }
}

export type PlatformKind = 'desktop' | 'browser'

export interface ShellStatus {
  product: string
  version: string
  build_mode: string
  platform: string
  arch: string
  engine: string
}

export interface Identity {
  id: string
  display_name: string
  dev_only: boolean
}

export interface OpenResult {
  path: string
  name: string
  content: string
}

export interface SaveResult {
  path: string
  name: string
}

export interface PlatformAdapter {
  readonly kind: PlatformKind
  isDesktop(): boolean
  /** File ▸ Open: native picker (desktop) or file input (browser). Null = cancelled. */
  openProject(): Promise<OpenResult | null>
  /** File ▸ Save As / first save: native save dialog (desktop) or prompt+download (browser).
   *  'cancelled' = user cancelled (no change); 'failed' = write error (stay dirty). */
  saveProjectAs(suggestedName: string, content: string): Promise<SaveResult | 'cancelled' | 'failed'>
  /** H05 — pick a Save/Save-As path WITHOUT writing (the editor validates
   *  the path — e.g. against already-open documents — before any write).
   *  null = cancelled or pathless (browser dev mode). */
  pickSavePath(suggestedName: string): Promise<string | null>
  /** Overwrite an existing document (P-1, no prompt). Desktop: atomic write to
   *  the known `path`; browser: re-download (pathless write). Returns success. */
  writeProject(path: string | null, name: string, content: string): Promise<boolean>
  /** Read a file by path (desktop Open Recent re-open). */
  readProject(path: string): Promise<string | null>
  /** Shell diagnostics for the Dev panel (desktop only; null in browser). */
  getShellStatus(): Promise<ShellStatus | null>
  /** Development identity (desktop only; null in browser). */
  getIdentity(): Promise<Identity | null>
  /** Close the OS window AFTER the SYS-02 dirty guard has resolved. */
  approveClose(): Promise<void>
  /** Subscribe to the OS close request (desktop). Returns an unlisten fn. */
  onCloseRequested(cb: () => void): () => void
  /** Application-level exit (File ▸ Exit after the guard). */
  exit(): void
}

// ——— helpers ———
function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> | null {
  const invoke = window.__TAURI__?.core?.invoke
  if (!invoke) return null
  return invoke(cmd, args) as Promise<T>
}

function nameWithoutExt(name: string): string {
  return name.replace(/\.json$/i, '')
}

// ——— Desktop (Tauri) implementation ———
const tauriAdapter: PlatformAdapter = {
  kind: 'desktop',
  isDesktop: () => true,

  async openProject() {
    const r = tauriInvoke<OpenResult | null>('open_project_file')
    if (!r) return null
    try {
      return (await r) ?? null
    } catch {
      return null
    }
  },

  async saveProjectAs(suggestedName, content) {
    const r = tauriInvoke<SaveResult | null>('save_project_file_as', { suggestedName, content })
    if (!r) return 'cancelled'
    try {
      const res = await r
      return res ?? 'cancelled'
    } catch {
      return 'failed' // Rust Err → write failure
    }
  },

  async pickSavePath(suggestedName) {
    const r = tauriInvoke<string | null>('pick_save_path', { suggestedName })
    if (!r) return null
    try {
      return (await r) ?? null
    } catch {
      return null
    }
  },

  async writeProject(path, _name, content) {
    if (!path) return false
    const r = tauriInvoke<boolean>('write_project_file', { path, content })
    if (!r) return false
    try {
      return (await r) === true
    } catch {
      return false
    }
  },

  async readProject(path) {
    const r = tauriInvoke<string>('read_project_file', { path })
    if (!r) return null
    try {
      return await r
    } catch {
      return null
    }
  },

  async getShellStatus() {
    const r = tauriInvoke<ShellStatus>('get_shell_status')
    if (!r) return null
    try {
      return await r
    } catch {
      return null
    }
  },

  async getIdentity() {
    const r = tauriInvoke<Identity>('get_identity')
    if (!r) return null
    try {
      return await r
    } catch {
      return null
    }
  },

  async approveClose() {
    await tauriInvoke<void>('approve_close')
  },

  onCloseRequested(cb) {
    const listen = window.__TAURI__?.event?.listen
    if (!listen) return () => {}
    let unlisten: (() => void) | null = null
    void listen('close-requested', cb).then((u) => {
      unlisten = u
    })
    return () => {
      unlisten?.()
    }
  },

  exit() {
    void tauriInvoke<void>('approve_close')
  },
}

// ——— Browser implementation (existing web fallbacks, unchanged behavior) ———
function browserName(current: string): string | null {
  const name = window.prompt('Save as (filename):', current || 'kineora-project')
  return name ? nameWithoutExt(name) : null
}

const browserAdapter: PlatformAdapter = {
  kind: 'browser',
  isDesktop: () => false,

  /** Browser dev mode is pathless — the H05 path validation (already-open
   *  path BLOCK) only applies natively; Save falls back to prompt+download. */
  pickSavePath: async () => null,

  openProject() {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json,application/json'
      input.onchange = () => {
        const file = input.files?.[0]
        if (!file) return resolve(null)
        const reader = new FileReader()
        reader.onload = () =>
          resolve({ path: '', name: nameWithoutExt(file.name || 'project'), content: String(reader.result) })
        reader.onerror = () => resolve(null)
        reader.readAsText(file)
      }
      // Note: cancelling the native picker leaves the promise pending — the
      // caller simply never proceeds (equivalent to "cancel → no change").
      input.click()
    })
  },

  async saveProjectAs(suggestedName, content) {
    const picker = (window as unknown as {
      showSaveFilePicker?: (o: unknown) => Promise<{
        name: string
        createWritable: () => Promise<{ write: (d: string) => Promise<void>; close: () => Promise<void> }>
      }>
    }).showSaveFilePicker
    if (typeof picker === 'function') {
      try {
        const handle = await picker({
          suggestedName: `${suggestedName}.json`,
          types: [{ description: 'Kineora project', accept: { 'application/json': ['.json'] } }],
        })
        const w = await handle.createWritable()
        await w.write(content)
        await w.close()
        return { path: '', name: nameWithoutExt(handle.name) }
      } catch (e) {
        return (e as DOMException)?.name === 'AbortError' ? 'cancelled' : 'failed'
      }
    }
    const name = browserName(suggestedName)
    if (name === null) return 'cancelled'
    try {
      downloadBlob(`${name}.json`, content, 'application/json')
      return { path: '', name }
    } catch {
      return 'failed'
    }
  },

  async writeProject(_path, name, content) {
    // Browser has no filesystem path → the honest equivalent is a re-download
    // of the project JSON (P-1 overwrite semantics, pathless).
    try {
      downloadBlob(`${name}.json`, content, 'application/json')
      return true
    } catch {
      return false
    }
  },

  async readProject() {
    return null
  },

  async getShellStatus() {
    return null
  },

  async getIdentity() {
    return null
  },

  async approveClose() {
    window.close()
  },

  onCloseRequested() {
    return () => {}
  },

  exit() {
    // Browser mode: the SYS-02 exit screen is shown by App; no OS to quit.
  },
}

// ——— the active adapter (detected once) ———
function detect(): PlatformAdapter {
  return window.__TAURI__?.core?.invoke ? tauriAdapter : browserAdapter
}

export const platform: PlatformAdapter = detect()

export function isDesktop(): boolean {
  return platform.isDesktop()
}
