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
   *  null = cancelled or pathless (browser without a picker). */
  pickSavePath(suggestedName: string): Promise<string | null>
  /** True when pickSavePath will show a real picker (desktop always; browser
   *  when the File System Access API is present). Cancel ≠ "no picker". */
  hasSavePicker(): boolean
  /** Overwrite an existing document (P-1, no prompt). Desktop: atomic write to
   *  the known `path`; browser: write the remembered File-System-Access
   *  handle when `path` is a session token, else pathless re-download. */
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
  hasSavePicker: () => true,

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

// ——— Browser implementation ———
//
// H05 identity is a SESSION path map (file.ts). The File System Access API
// is the browser equivalent of a native path: pick WITHOUT writing, then
// write to the remembered handle on subsequent Save (P-1 overwrite). When
// the API is absent, Save stays the honest pathless prompt+download fallback
// (H05 F3: downloadBlob = dev-only gap). Handles do not survive reload —
// same SESSION rule as the desktop path map.

interface FsaWritable {
  write: (d: string) => Promise<void>
  close: () => Promise<void>
}
interface FsaFileHandle {
  name: string
  createWritable: () => Promise<FsaWritable>
  queryPermission?: (o: { mode: string }) => Promise<string>
  requestPermission?: (o: { mode: string }) => Promise<string>
  isSameEntry?: (other: FsaFileHandle) => Promise<boolean>
}

const fsaHandles = new Map<string, FsaFileHandle>()
let fsaSeq = 1

/** Session-token prefix for a remembered File System Access handle. */
export const FSA_PATH_PREFIX = 'fsa:'

function showSaveFilePickerFn():
  | ((o: unknown) => Promise<FsaFileHandle>)
  | undefined {
  return (window as unknown as { showSaveFilePicker?: (o: unknown) => Promise<FsaFileHandle> })
    .showSaveFilePicker
}

function browserHasSavePicker(): boolean {
  return typeof showSaveFilePickerFn() === 'function'
}

async function rememberFsaHandle(handle: FsaFileHandle): Promise<string> {
  for (const [token, existing] of fsaHandles) {
    try {
      if (existing.isSameEntry && (await existing.isSameEntry(handle))) return token
    } catch {
      /* isSameEntry can throw if the handle is stale — treat as distinct */
    }
  }
  const token = `${FSA_PATH_PREFIX}${fsaSeq++}:${nameWithoutExt(handle.name)}`
  fsaHandles.set(token, handle)
  return token
}

async function ensureFsaWritable(handle: FsaFileHandle): Promise<boolean> {
  try {
    if (handle.queryPermission) {
      const state = await handle.queryPermission({ mode: 'readwrite' })
      if (state === 'granted') return true
    }
    if (handle.requestPermission) {
      return (await handle.requestPermission({ mode: 'readwrite' })) === 'granted'
    }
    return true
  } catch {
    return false
  }
}

async function writeFsaHandle(handle: FsaFileHandle, content: string): Promise<boolean> {
  if (!(await ensureFsaWritable(handle))) return false
  try {
    const w = await handle.createWritable()
    await w.write(content)
    await w.close()
    return true
  } catch {
    return false
  }
}

/** Test-only: drop remembered File System Access handles (jsdom has no session). */
export function __resetFsaHandlesForTests(): void {
  fsaHandles.clear()
  fsaSeq = 1
}

type NamePicker = (suggested: string) => Promise<string | null>
let saveNamePicker: NamePicker | null = null

/** App registers a Save As dialog so browser Save never uses window.prompt. */
export function registerSaveNamePicker(fn: NamePicker | null): void {
  saveNamePicker = fn
}

async function browserName(current: string): Promise<string | null> {
  if (saveNamePicker) return saveNamePicker(current || 'kineora-project')
  const name = window.prompt('Save as (filename):', current || 'kineora-project')
  return name ? nameWithoutExt(name) : null
}

const browserAdapter: PlatformAdapter = {
  kind: 'browser',
  isDesktop: () => false,
  hasSavePicker: () => browserHasSavePicker(),

  async pickSavePath(suggestedName) {
    const picker = showSaveFilePickerFn()
    if (typeof picker !== 'function') return null
    try {
      const handle = await picker({
        suggestedName: `${suggestedName}.json`,
        types: [{ description: 'Kineora project', accept: { 'application/json': ['.json'] } }],
      })
      return rememberFsaHandle(handle)
    } catch {
      // AbortError = user cancelled (H05 T-save-dialog → no change).
      return null
    }
  },

  openProject() {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json,application/json'
      let settled = false
      const finish = (v: OpenResult | null) => {
        if (settled) return
        settled = true
        window.removeEventListener('focus', onFocus)
        resolve(v)
      }
      const onFocus = () => {
        window.setTimeout(() => {
          if (!input.files || input.files.length === 0) finish(null)
        }, 400)
      }
      input.onchange = () => {
        const file = input.files?.[0]
        if (!file) return finish(null)
        const reader = new FileReader()
        reader.onload = () =>
          finish({ path: '', name: nameWithoutExt(file.name || 'project'), content: String(reader.result) })
        reader.onerror = () => finish(null)
        reader.readAsText(file)
      }
      window.addEventListener('focus', onFocus)
      input.click()
    })
  },

  async saveProjectAs(suggestedName, content) {
    const picker = showSaveFilePickerFn()
    if (typeof picker === 'function') {
      try {
        const handle = await picker({
          suggestedName: `${suggestedName}.json`,
          types: [{ description: 'Kineora project', accept: { 'application/json': ['.json'] } }],
        })
        if (!(await writeFsaHandle(handle, content))) return 'failed'
        const token = await rememberFsaHandle(handle)
        return { path: token, name: nameWithoutExt(handle.name) }
      } catch (e) {
        if ((e as DOMException)?.name !== 'AbortError') return 'failed'
        // Picker blocked (iframe) or user dismissed — fall through to the
        // in-app name dialog so Save never silently does nothing.
      }
    }
    const name = await browserName(suggestedName)
    if (name === null) return 'cancelled'
    try {
      downloadBlob(`${name}.json`, content, 'application/json')
      return { path: '', name }
    } catch {
      return 'failed'
    }
  },

  async writeProject(path, name, content) {
    if (path) {
      const handle = fsaHandles.get(path)
      if (!handle) return false
      return writeFsaHandle(handle, content)
    }
    // Pathless fallback (no File System Access API / session handle lost).
    try {
      downloadBlob(`${name}.json`, content, 'application/json')
      return true
    } catch {
      return false
    }
  },

  async readProject(path) {
    const handle = fsaHandles.get(path)
    if (!handle) return null
    try {
      const file = await (handle as FsaFileHandle & { getFile?: () => Promise<Blob> }).getFile?.()
      if (!file) return null
      return await file.text()
    } catch {
      return null
    }
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
