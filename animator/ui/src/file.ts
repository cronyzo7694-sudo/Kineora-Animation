// ============================================================================
// SYS-02 FILE — document lifecycle + File-menu actions (New / Open / Recent /
// Save / Save As / Templates / Close / Exit) + the SYS-27/SYS-18 handoff
// boundary. Persistence internals (atomic write, autosave, recovery,
// migration) are SYS-28's — this module only TRIGGERS and reports results.
//
// Dirty guard (canonical, SYS-02 §13.3): Close/Close All/Exit/Open/Open Recent
// confirm on DIRTY only (never identity). The guard itself lives in App
// (CloseConfirmationDialog); commands reach it via ctx.confirmClose.
// ============================================================================

import { bus } from './bus'
import { downloadBlob } from './engine/actions'
import {
  activeDocId,
  closeDoc,
  docList,
  getEngine,
  getEngineStatus,
  loadProjectJson,
  markClean,
  newDocFull,
  openDocJson,
  projectJson,
  setDocTitle,
  statusJson,
} from './engine/client'

export type Notify = (msg: string) => void

// ——— new-document settings (SYS-02 §6.2 dialog) ———
export interface NewDocSettings {
  platform: string
  width: number
  height: number
  fps: number
  background: string
  units: string
}

export const DEFAULT_NEW_SETTINGS: NewDocSettings = {
  platform: 'HTML5 Canvas',
  width: 1920,
  height: 1080,
  fps: 24,
  background: '#ffffff',
  units: 'px',
}

export const PLATFORM_OPTIONS = ['HTML5 Canvas', 'WebGL', 'Video-only']
export const UNIT_OPTIONS = ['px', 'in', 'cm', 'mm']

function engineOk(): boolean {
  return getEngineStatus().kind === 'ok' && getEngine() !== null
}

function jsonName(title: string): string {
  const t = title.trim() || 'kineora-project'
  return t.endsWith('.json') ? t : `${t}.json`
}

/** Title is "titled" (has a persisted name) iff it isn't an Untitled-N doc. */
export function isTitled(title: string): boolean {
  return !title.startsWith('Untitled')
}

export function activeDocTitle(): string {
  return statusJson()?.doc_title ?? ''
}

export function isDocumentDirty(): boolean {
  return statusJson()?.dirty ?? false
}

// ——— New ———
export function createDocument(settings: NewDocSettings, notify: Notify): void {
  if (!engineOk()) return notify('new: engine not attached')
  const id = newDocFull({ ...settings })
  if (id === 0) return notify('new: failed to create document')
  bus.emit('activeDoc:changed', { docId: id })
  notify('new document created')
}

// ——— Open (replace active — SYS-02 §13.3) ———
export function openDocument(notify: Notify): void {
  if (!engineOk()) return notify('open: engine not attached')
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json,application/json'
  input.onchange = () => {
    const file = input.files?.[0]
    if (!file) return // cancelled → no change
    const reader = new FileReader()
    reader.onload = () => {
      const json = String(reader.result)
      const title = (file.name || 'Untitled').replace(/\.json$/i, '')
      const ok = loadProjectJson(json, title)
      if (!ok) {
        notify('open failed: invalid or corrupt project file')
        return
      }
      addRecent(title, json)
      bus.emit('activeDoc:changed', { docId: activeDocId() })
      notify(`opened "${title}"`)
    }
    reader.onerror = () => notify('open failed: could not read the file')
    reader.readAsText(file)
  }
  input.click()
}

// ——— Save / Save As ———
/**
 * Persist the active document. `saveAs` forces a name/path prompt; a titled
 * Save overwrites without confirmation (P-1). Returns nothing — feedback via
 * notify + `saving:changed` (st.saving cell).
 */
/** @returns true when the document was saved (and marked clean); false on
 *  cancel / failure (document left dirty and unchanged). */
export async function saveDocument(notify: Notify, opts: { saveAs?: boolean } = {}): Promise<boolean> {
  if (!engineOk()) {
    notify('save: engine not attached')
    return false
  }
  const st = statusJson()
  if (!st) {
    notify('save: no document open')
    return false
  }
  const json = projectJson()
  if (!json) {
    notify('save: serialization failed')
    return false
  }

  const docId = activeDocId()
  let title = st.doc_title ?? ''

  if (opts.saveAs || !isTitled(title)) {
    const chosen = await chooseSaveName(title)
    if (chosen === null) return false // cancelled → no change
    title = chosen
  }

  const result = await persistToDisk(title, json)
  if (result === 'cancelled') return false // picker cancelled → no change
  if (result === 'failed') {
    notify('Save error: could not write the file (document left dirty — retry)')
    return false
  }
  setDocTitle(docId, title)
  markClean()
  bus.emit('saving:changed', { state: 'saved', time: new Date().toLocaleTimeString() })
  addRecent(title, json)
  notify(`saved "${title}"`)
  return true
}

/** Save As: native save picker (Chrome) → else a filename prompt + download. */
async function chooseSaveName(currentTitle: string): Promise<string | null> {
  const picker = (window as unknown as { showSaveFilePicker?: (o: unknown) => Promise<{ name: string; createWritable: () => Promise<{ write: (d: string) => Promise<void>; close: () => Promise<void> }> }> }).showSaveFilePicker
  if (typeof picker === 'function') {
    try {
      const handle = await picker({
        suggestedName: jsonName(currentTitle),
        types: [{ description: 'Kineora project', accept: { 'application/json': ['.json'] } }],
      })
      const w = await handle.createWritable()
      await w.write(projectJson())
      await w.close()
      return handle.name.replace(/\.json$/i, '')
    } catch {
      return null // AbortError (user cancel) or unsupported — treated as cancel
    }
  }
  const name = window.prompt('Save as (filename):', currentTitle || 'kineora-project')
  if (!name) return null
  return name.replace(/\.json$/i, '')
}

/** Write the project JSON to disk. Browser fallback = download (pathless). */
async function persistToDisk(title: string, json: string): Promise<'saved' | 'cancelled' | 'failed'> {
  const picker = (window as unknown as { showSaveFilePicker?: (o: unknown) => Promise<{ createWritable: () => Promise<{ write: (d: string) => Promise<void>; close: () => Promise<void> }> }> }).showSaveFilePicker
  if (typeof picker === 'function') {
    try {
      const handle = await picker({
        suggestedName: jsonName(title),
        types: [{ description: 'Kineora project', accept: { 'application/json': ['.json'] } }],
      })
      const w = await handle.createWritable()
      await w.write(json)
      await w.close()
      return 'saved'
    } catch (e) {
      return (e as DOMException)?.name === 'AbortError' ? 'cancelled' : 'failed'
    }
  }
  // Pathless browser write (SYS-28 native atomic-write is a Tauri integration
  // gap; download is the honest web equivalent).
  try {
    downloadBlob(jsonName(title), json, 'application/json')
    return 'saved'
  } catch {
    return 'failed'
  }
}

// ——— Close / Close All / Exit (guard lives in App via ctx.confirmClose) ———
export function closeActiveDocument(): void {
  const id = activeDocId()
  if (id === 0) return
  closeDoc(id)
  bus.emit('activeDoc:changed', { docId: activeDocId() })
}

export function closeAllDocuments(): void {
  for (const d of docList()) closeDoc(d.id)
  bus.emit('activeDoc:changed', { docId: activeDocId() })
}

export function activeDocIsDirty(): boolean {
  return statusJson()?.dirty ?? false
}

// ——— Recent files (SYS-02 §20 P-4: unbounded, most-recent-first) ———
const RECENT_KEY = 'kineora.recentFiles'
const RECENT_MAX_BYTES = 1_500_000 // per-entry payload guard (localStorage quota)

export interface RecentEntry {
  title: string
  name: string
  savedAt: number
  /** Last-saved snapshot (re-open actually works in the browser). */
  json?: string
}

export function listRecent(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RecentEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function addRecent(title: string, json: string): void {
  const entries = listRecent().filter((r) => r.title !== title)
  const entry: RecentEntry = { title, name: jsonName(title), savedAt: Date.now(), json: json.length <= RECENT_MAX_BYTES ? json : undefined }
  const next = [entry, ...entries]
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    // quota exceeded → keep metadata-only entries (still listed, reopen honest)
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next.map((e) => ({ ...e, json: undefined }))))
    } catch {
      /* storage unavailable */
    }
  }
}

/** Open a recent entry (same canonical load path as file.open). */
export function openRecent(title: string, notify: Notify): void {
  const entry = listRecent().find((r) => r.title === title)
  if (!entry || !entry.json) {
    notify(`recent "${title}" is stale or unavailable — use File ▸ Open to re-select it`)
    return
  }
  const ok = loadProjectJson(entry.json, entry.title)
  if (!ok) {
    notify(`recent "${title}": invalid project data`)
    return
  }
  bus.emit('activeDoc:changed', { docId: activeDocId() })
  notify(`opened "${entry.title}"`)
}

// ——— Templates (SYS-02 §9: preset-JSON mechanism; store = P-7 detail) ———
const TEMPLATES_KEY = 'kineora.templates'

export interface TemplateRecord {
  name: string
  savedAt: number
  json: string
}

export function listTemplates(): TemplateRecord[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Record<string, TemplateRecord>
    return Object.values(parsed).sort((a, b) => a.name.localeCompare(b.name))
  } catch {
    return []
  }
}

export function saveTemplate(name: string, notify: Notify): void {
  if (!engineOk()) return notify('save template: engine not attached')
  const clean = name.trim()
  if (!clean) return notify('save template: a name is required')
  const json = projectJson()
  if (!json) return notify('save template: no document to save')
  const tpls: Record<string, TemplateRecord> = {}
  for (const t of listTemplates()) tpls[t.name] = t
  tpls[clean] = { name: clean, savedAt: Date.now(), json }
  try {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(tpls))
    notify(`template "${clean}" saved`)
  } catch {
    notify('save template: storage failed')
  }
}

/** Seed a NEW document from a template (SYS-02 §9: seed → active). */
export function createFromTemplate(name: string, notify: Notify): void {
  if (!engineOk()) return notify('new from template: engine not attached')
  const tpl = listTemplates().find((t) => t.name === name)
  if (!tpl) return notify(`template "${name}" not found`)
  const id = openDocJson(tpl.json, tpl.name)
  if (id === 0) return notify(`template "${name}": invalid template data`)
  bus.emit('activeDoc:changed', { docId: id })
  notify(`created from template "${name}"`)
}

// ——— Handoff boundary (SYS-27 import/export/publish · SYS-18 ext library) ———
export function importHandoff(target: 'stage' | 'library', notify: Notify): void {
  notify(`Import to ${target}: integration gap — owned by SYS-27 (import engine), not implemented yet`)
}

export function exportHandoff(format: string, notify: Notify): void {
  notify(`Export ${format}: integration gap — owned by SYS-27 (export engine), not implemented yet`)
}

export function publishHandoff(what: string, notify: Notify): void {
  notify(`Publish ${what}: integration gap — owned by SYS-27 (publish engine), not implemented yet`.trim())
}

export function openExternalLibraryHandoff(notify: Notify): void {
  notify('Open from Libraries: integration gap — owned by SYS-18 (external library), not implemented yet')
}
