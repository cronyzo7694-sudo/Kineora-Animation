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
import { platform } from './platform'
import {
  activeDocId,
  closeDoc,
  docList,
  getEngine,
  getEngineStatus,
  markClean,
  newDocFull,
  openDocJson,
  projectJson,
  reorderDoc,
  setActiveDoc,
  setDocModifiedAt,
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
  /** Stage background opacity 0..=1 (H01 §5.2/§8; Part 33 §33.1). */
  backgroundAlpha: number
  units: string
}

export const DEFAULT_NEW_SETTINGS: NewDocSettings = {
  platform: 'HTML5 Canvas',
  width: 1920,
  height: 1080,
  fps: 24,
  background: '#ffffff',
  backgroundAlpha: 1,
  units: 'px',
}

/** Epoch seconds — meta.createdAt stamp (wasm has no wall clock). */
const nowSec = (): number => Math.floor(Date.now() / 1000)

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
  // H01 §5.2 contract enforcement at the command layer too (palette/script
  // callers bypass the dialog): W/H must be finite and ≥ 2 (P-2, no upper
  // bound) or nothing is created; fps out-of-range CLAMPS to 1–120 on
  // commit (v2 reconciliation — empty/non-numeric fps never reaches here as
  // a number; NaN = the dialog's "empty" case → refuse); backgroundAlpha
  // clamps to 0..=1.
  const { width: w, height: h, fps: f, backgroundAlpha: a } = settings
  if (!Number.isFinite(w) || w < 2) return notify('new: width must be ≥ 2')
  if (!Number.isFinite(h) || h < 2) return notify('new: height must be ≥ 2')
  if (!Number.isFinite(f)) return notify('new: frame rate must be 1–120')
  const id = newDocFull({
    ...settings,
    fps: Math.min(120, Math.max(1, Math.round(f))),
    backgroundAlpha: Math.min(1, Math.max(0, Number.isFinite(a) ? a : 1)),
    // H01 §7 meta ownership: the New command stamps createdAt.
    createdAt: nowSec(),
  })
  if (id === 0) return notify('new: failed to create document')
  // H02 §14 (ST1): open-set change FIRST, then the active pointer.
  bus.emit('openSet:changed', { change: 'added', docId: id })
  bus.emit('activeDoc:changed', { docId: id })
  notify('new document created')
}

// ——— Open (replace active — SYS-02 §13.3) ———
// ——— native path tracking (desktop shell) ———
// The desktop Save-As dialog returns a real path; a TITLED Save overwrites
// that path without re-prompting (SYS-02 P-1). Paths are SESSION state (the
// browser has no path; recent files remain the durable record).
const docPaths = new Map<number, string>()

function setDocPath(docId: number, path: string): void {
  if (path) docPaths.set(docId, path)
}

export function docPath(docId: number): string | undefined {
  return docPaths.get(docId)
}

/** Test-only: clear the session path map (jsdom has no session boundary). */
export function __resetDocPathsForTests(): void {
  docPaths.clear()
}

/** The open document that already holds `path`, if any (H02 D-AMB-001:
 *  path = location, used ONLY for duplicate-open detection — never identity). */
export function findDocByPath(path: string): number | undefined {
  if (!path) return undefined
  for (const [id, p] of docPaths) {
    if (p === path) return id
  }
  return undefined
}

export function openDocument(notify: Notify): void {
  if (!engineOk()) return notify('open: engine not attached')
  void (async () => {
    const opened = await platform.openProject()
    if (!opened) return // cancelled → no change
    // H02 D-AMB-001 (approved): a saved path may NOT open as a second
    // instance. No second document, no second tab, NO disk reload — activate
    // the existing document; its session/dirty/selection/playhead/History are
    // preserved exactly (ST2b: `activeDoc:changed` only).
    const existing = findDocByPath(opened.path)
    if (existing !== undefined) {
      switchActiveDocument(existing, notify)
      notify(`already open — activated "${opened.name}"`)
      return
    }
    // H02 §3 (ST2): Open ADDS a document to the open-set — it never replaces
    // the active document. The previous document stays open, untouched.
    const id = openDocJson(opened.content, opened.name)
    if (id === 0) {
      notify('open failed: invalid or corrupt project file')
      return
    }
    setDocPath(id, opened.path)
    addRecent(opened.name, opened.content, opened.path)
    // H02 §14 (ST2): open-set change FIRST, then the active pointer.
    bus.emit('openSet:changed', { change: 'added', docId: id })
    bus.emit('activeDoc:changed', { docId: id })
    notify(`opened "${opened.name}"`)
  })()
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
  const knownPath = docPath(docId)

  // H04 T2: save start → SAVING (transient sub-state of DIRTY — the document
  // stays unsaved until the write succeeds).
  bus.emit('saving:changed', { state: 'saving' })

  const saveCancelled = () => {
    // cancelled picker → save state returns to idle; document unchanged.
    bus.emit('saving:changed', { state: 'idle' })
  }
  const saveError = (msg?: string) => {
    // H04 T4 / H05 §11: write failed (or a pre-write validation blocked the
    // save) → SAVE_ERROR. The document STAYS DIRTY (markClean is never
    // reached), the last-good file is intact (atomic, SYS-28), modifiedAt is
    // NOT updated, the snapshot is NOT advanced. Recoverable via retry.
    bus.emit('saving:changed', { state: 'error' })
    notify(msg ?? 'Save error: could not write the file (document left dirty — retry)')
  }

  if (opts.saveAs || !isTitled(title)) {
    // New path: Save As, or a first save of an untitled document.
    if (platform.isDesktop()) {
      // H05: pick the path WITHOUT writing, validate it, then write.
      const path = await platform.pickSavePath(title)
      if (!path) {
        saveCancelled()
        return false // cancelled → no change
      }
      // H05 §6 / edge 15 (INV-IDENT-4 / D-AMB-001): a path already owned by
      // ANOTHER open document is BLOCKED BEFORE any write — one saved path =
      // at most one open document. The source doc stays exactly unchanged
      // (dirty/History/session preserved); no snapshot advance, no markClean.
      const owner = findDocByPath(path)
      if (owner !== undefined && owner !== docId) {
        saveError('Save blocked: that file is already open as another document — choose a different path')
        return false
      }
      if (!(await platform.writeProject(path, title, json))) {
        saveError()
        return false
      }
      setDocPath(docId, path)
      // AMB-H05-001 PROVISIONAL (= the spec's recommendation, pending a
      // product decision): the tab title derives from the filename on first
      // save. Identity is never the title (H00 §5).
      title = path.split(/[\\/]/).pop()?.replace(/\.json$/i, '') || title
    } else {
      // Browser dev mode: prompt + pathless download (F3: native = spec,
      // download = dev-only). The collision rule is path-based and only
      // meaningful natively — no path here, so no check (honest gap).
      const res = await platform.saveProjectAs(title, json)
      if (res === 'cancelled') {
        saveCancelled()
        return false
      }
      if (res === 'failed') {
        saveError()
        return false
      }
      title = res.name
    }
  } else if (platform.isDesktop() && knownPath) {
    // Titled + known path → overwrite in place (P-1: no prompt, no confirm).
    if (!(await platform.writeProject(knownPath, title, json))) {
      saveError()
      return false
    }
  } else {
    // Browser: P-1 overwrite (pathless re-download).
    if (!(await platform.writeProject(null, title, json))) {
      saveError()
      return false
    }
  }

  // H05 §7.1 BINDING order: (3) modifiedAt ← now (H05 owns the stamp) →
  // (4) saved snapshot advances → (5) CLEAN → (6) saving:changed{saved}.
  // modifiedAt is stamped BEFORE markClean so the snapshot includes it
  // (a later content-equality comparison is unaffected).
  setDocModifiedAt(nowSec())
  setDocTitle(docId, title)
  markClean()
  bus.emit('saving:changed', { state: 'saved', time: new Date().toLocaleTimeString() })
  addRecent(title, json, docPath(docId))
  notify(`saved "${title}"`)
  return true
}

// ——— Active-document switch (H00 §12: view-state action) ———
// Canonical single path for tab activation: switch the ENGINE's active doc,
// then emit `activeDoc:changed` so every document-bound panel re-reads the new
// active document (INV-MD-8). Switching never mutates document content.
// H02 edge 11: activating the already-active document is an idempotent no-op
// (no event, no feedback). H02 §18 / edge 26: a failed activation is HONEST
// feedback — stay on the current document, emit nothing, corrupt nothing.
export function switchActiveDocument(id: number, notify: Notify): void {
  if (id === 0) return
  if (id === activeDocId()) return
  if (setActiveDoc(id)) {
    bus.emit('activeDoc:changed', { docId: id })
    notify(`switched to "${statusJson()?.doc_title ?? id}"`)
  } else {
    notify(`switch failed: document ${id} is not available`)
  }
}

// ——— Close / Close All / Exit (guard lives in App via ctx.confirmClose) ———
/**
 * H02 §12 `app.tab.close` — close ONE specific document by its STABLE id
 * (never the active-by-inference, never a tab index).
 *
 * Event contract (H02 §14): `openSet:changed{removed}` is emitted FIRST. The
 * `activeDoc:changed` event follows ONLY when the closed document WAS active
 * (ST4: `{next}`, ST6: `{null}`); closing an inactive document emits
 * `openSet:changed` alone (ST5) — the active document is untouched.
 */
export function closeDocumentById(id: number, notify: Notify): void {
  if (!engineOk()) return notify('close: engine not attached')
  const wasActive = activeDocId() === id
  if (!closeDoc(id)) {
    notify(`close: document ${id} is no longer open`)
    return
  }
  docPaths.delete(id)
  bus.emit('openSet:changed', { change: 'removed', docId: id })
  if (wasActive) {
    // The engine already selected the successor (or the no-document state).
    bus.emit('activeDoc:changed', { docId: activeDocId() })
  }
  notify('document closed')
}

export function closeActiveDocument(notify: Notify): void {
  const id = activeDocId()
  if (id === 0) return
  closeDocumentById(id, notify)
}

export function closeAllDocuments(notify: Notify): void {
  for (const d of docList()) closeDocumentById(d.id, notify)
}

// ——— Open-set reorder (H02 §12 `app.tab.reorder` — chrome view action) ———
// The open-set ORDER is SESSION state (SYS-02/MOD-DOC owns it; the tab strip
// is SYS-01's view). Reordering is view/session: NO document mutation, NO
// dirty, NO undo entry, and the active document is UNCHANGED. It emits
// `openSet:changed{reordered}` ONLY — never `activeDoc:changed` (H02 §14).
export function reorderDocument(id: number, toIndex: number, notify: Notify): void {
  if (!engineOk()) return notify('reorder: engine not attached')
  const docs = docList()
  if (!docs.some((d) => d.id === id)) {
    notify(`reorder: document ${id} is no longer open`)
    return
  }
  const from = docs.findIndex((d) => d.id === id)
  const clamped = Math.max(0, Math.min(toIndex, docs.length - 1))
  if (clamped === from) return // same slot — no-op, no event
  if (reorderDoc(id, clamped)) {
    bus.emit('openSet:changed', { change: 'reordered', docId: id })
  } else {
    notify(`reorder: document ${id} could not be moved`)
  }
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
  /** Native path when known (H06: already-open check + desktop re-open).
   *  Pathless in browser dev mode. */
  path?: string
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

export function addRecent(title: string, json: string, path?: string): void {
  const entries = listRecent().filter((r) => r.title !== title)
  const entry: RecentEntry = {
    title,
    name: jsonName(title),
    savedAt: Date.now(),
    json: json.length <= RECENT_MAX_BYTES ? json : undefined,
    path: path || undefined,
  }
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

/** H06 §6 — Open Recent = the SAME canonical Open flow with a KNOWN entry.
 *  Step 1 (already-open path → activate WITHOUT guard/load) is the caller's
 *  job (the file.open command); this performs the load: stored snapshot
 *  first, else the native path. Stale/missing → toast + skip (H06 §11). */
export async function openFromRecent(entry: RecentEntry, notify: Notify): Promise<void> {
  if (!engineOk()) return notify('open recent: engine not attached')
  let content = entry.json
  if (content === undefined && entry.path) {
    content = await platform.readProject(entry.path) ?? undefined
    if (content === undefined) {
      notify(`recent "${entry.title}" is no longer available at its path — entry skipped`)
      return
    }
  }
  if (content === undefined) {
    notify(`recent "${entry.title}" is stale or unavailable — use File ▸ Open to re-select it`)
    return
  }
  const id = openDocJson(content, entry.title)
  if (id === 0) {
    notify(`recent "${entry.title}": invalid project data`)
    return
  }
  if (entry.path) setDocPath(id, entry.path)
  addRecent(entry.title, content, entry.path)
  // H02 §14: open-set change FIRST, then the active pointer.
  bus.emit('openSet:changed', { change: 'added', docId: id })
  bus.emit('activeDoc:changed', { docId: id })
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
  // H01 §7 meta ownership: a seeded document is a NEW creation — refresh
  // createdAt (now), clear modifiedAt (H05 sets it at first Save) and clear
  // title/author (SYS-06/SYS-17 set those on the new doc, never inherited).
  let json = tpl.json
  try {
    const parsed = JSON.parse(tpl.json) as Record<string, unknown>
    const prevMeta =
      typeof parsed.meta === 'object' && parsed.meta !== null
        ? (parsed.meta as Record<string, unknown>)
        : {}
    parsed.meta = { ...prevMeta, title: null, author: null, createdAt: nowSec(), modifiedAt: null }
    json = JSON.stringify(parsed)
  } catch {
    // fall through — the engine parse below reports invalid data honestly
  }
  // AMB-H01-003 (provisional = UNTITLED): empty title → the engine assigns
  // the doc its OWN Untitled-N display title, never the template's name.
  const id = openDocJson(json, '')
  if (id === 0) return notify(`template "${name}": invalid template data`)
  // H02 §14 (ST1 family — New-from-Template = New): open-set FIRST, then active.
  bus.emit('openSet:changed', { change: 'added', docId: id })
  bus.emit('activeDoc:changed', { docId: id })
  notify(`created from template "${name}"`)
}

/** Gallery row preview (H01 §5.3 tpl-new.list): platform/W/H/fps read from
 *  the stored preset JSON; null when the JSON can't be read. */
export interface TemplatePreview {
  platform: string
  width: number
  height: number
  fps: number
}
export function templatePreview(tpl: TemplateRecord): TemplatePreview | null {
  try {
    const s = (JSON.parse(tpl.json) as { settings?: Record<string, unknown> }).settings
    if (!s) return null
    return {
      platform: typeof s.platform === 'string' ? s.platform : 'HTML5 Canvas',
      width: Number(s.width) || 0,
      height: Number(s.height) || 0,
      fps: Number(s.fps) || 0,
    }
  } catch {
    return null
  }
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
