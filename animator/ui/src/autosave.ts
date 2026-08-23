// ============================================================================
// SYS-28 PERSISTENCE — MOD-AUTOSAVE + RECOVERY (TS side)
//
// Owner: SYS-28 (AI-D). Implements the autosave timer + `.autosave` slot +
// launch-time recovery detection defined by:
//   • eng 13: "Autosave: debounced (2s after last change + 30s interval
//     [ENGINEERING DECISION]) → `.autosave` slot (never overwrites the
//     user's last manual save)" · "Crash recovery: on launch, if `.autosave`
//     newer than project → prompt Recover? (W11)"
//   • H10 §5.3: autosave does NOT emit `saving:changed` (manual save only)
//     and does NOT clear DIRTY (FL-0014).
//   • H10 §5.4 / H00 §6.3 T12–T14: launch recovery prompt; Accept →
//     ACTIVE(TITLED, CLEAN) + `activeDoc:changed`; Discard → NO_DOCUMENT,
//     slot "kept or cleared per SYS-28".
//   • H10 §10: corrupt `.autosave` on recovery → skip + toast.
//
// SYS-28 INTERNAL ENGINEERING DECISIONS (documented, not product behavior —
// eng 13 grants MOD-AUTOSAVE its "[ENGINEERING DECISION]" latitude):
//   AS-D1  Slot invariant INV-AS-1: a non-blank slot exists ⟺ autosaved
//          changes are newer than the last manual save. Enforced by clearing
//          the slot on manual-save success. This realizes eng 13's
//          "`.autosave` newer than project" check without filesystem-mtime
//          access (no mtime command exists in the desktop shell seam).
//   AS-D2  Native slot = `<projectPath>.autosave`, written via
//          platform.writeProject → the desktop shell's atomic tmp→rename
//          write (the SAME Rust atomic seam as manual save; a distinct path,
//          so the manual save file is never overwritten).
//   AS-D3  Clearing = writing a blank slot ("") — the shell exposes no
//          delete; a blank envelope is treated as absent.
//   AS-D4  T14 Discard AND T13 Accept both CLEAR the slot. Keeping the slot
//          after Recover re-prompted on every reload (the same snapshot the
//          user already handled). A later dirty edit writes a NEW slot.
//   AS-D5  Browser = dev harness (H10 §11: native authoritative): one
//          localStorage slot for the active document. Never authoritative.
//   AS-D6  A pending autosave is cancelled on active-document switch: the
//          engine serializes only the ACTIVE document, so a deactivated
//          document cannot be snapshotted afterwards. Its next mutation
//          re-arms the timer. (Timing-internal; no data already on disk is
//          lost, and manual save is unaffected.)
//
// REGISTERED, NOT INVENTED (see PROJECT_COORDINATION/BLOCKERS.md):
//   AMB-D-001: desktop autosave for an UNTITLED/pathless document — the
//   sources define the slot relative to "the project" file; no project file
//   exists for an unsaved document. No behavior invented: desktop pathless
//   docs are NOT autosaved until first manual save.
// ============================================================================

import { bus } from './bus'
import { platform } from './platform'
import { activeDocId, markClean, openDocJson, projectJson, statusJson } from './engine/client'
import { checksumHex, prepareForLoad, stampFormatVersion } from './persist'
import { autosaveMaxIntervalMs, loadAutosavePrefs, subscribeAutosavePrefs } from './autosavePrefs'

export const AUTOSAVE_DEBOUNCE_MS = 2_000
/** Default cap when prefs are at factory (30s). Tests use this constant. */
export const AUTOSAVE_MAX_INTERVAL_MS = 30_000
/** Browser dev-harness slot (AS-D5). */
export const BROWSER_DEV_SLOT_KEY = 'kineora.autosave.dev'
/** Last Recover/Discard fingerprint — never re-prompt the same snapshot. */
export const HANDLED_SLOT_KEY = 'kineora.autosave.handled'

/** Native `.autosave` slot path for a project file (AS-D2). */
export function autosaveSlotPath(projectPath: string): string {
  return `${projectPath}.autosave`
}

/** Envelope stored in the slot (SYS-28-internal format, versioned). */
interface AutosaveEnvelope {
  v: 1
  checksum: string
  savedAt: number
  projectPath: string | null
  title: string
  content: string
}

export interface RecoveryCandidate {
  source: 'native' | 'browser-dev'
  title: string
  content: string
  savedAt: number
  /** The PROJECT path the recovered document belongs to (null = dev slot). */
  projectPath: string | null
}

export interface RecoveryScan {
  candidate: RecoveryCandidate | null
  /** Number of corrupt slots skipped (H10 §10: skip + toast — caller toasts). */
  corruptSkipped: number
}

/** Injected seams — SYS-02-owned lookups are passed IN (no lifecycle
 *  absorption, INV-PERS-1; also avoids a module cycle with file.ts). */
export interface AutosaveDeps {
  getDocPath(docId: number): string | undefined
  /** Most-recent-first project paths (recent list) to scan for slots. */
  listRecentPaths(): { title: string; path: string }[]
  /** Bind a recovered document to its project path (SYS-02 session map). */
  adoptDocPath(docId: number, path: string): void
}

// ——— slot IO (blank = absent, AS-D3) ———

async function readSlot(where: { path?: string }): Promise<string | null> {
  if (where.path) {
    const raw = await platform.readProject(autosaveSlotPath(where.path))
    return raw && raw.trim() !== '' ? raw : null
  }
  try {
    const raw = localStorage.getItem(BROWSER_DEV_SLOT_KEY)
    return raw && raw.trim() !== '' ? raw : null
  } catch {
    return null
  }
}

async function writeSlot(where: { path?: string }, data: string): Promise<boolean> {
  if (where.path) {
    return platform.writeProject(autosaveSlotPath(where.path), '', data)
  }
  try {
    if (data === '') localStorage.removeItem(BROWSER_DEV_SLOT_KEY)
    else localStorage.setItem(BROWSER_DEV_SLOT_KEY, data)
    return true
  } catch {
    return false
  }
}

function snapshotKey(content: string, projectPath: string | null, savedAt: number): string {
  return `${checksumHex(content)}|${projectPath ?? ''}|${savedAt}`
}

function rememberHandled(key: string): void {
  try {
    localStorage.setItem(HANDLED_SLOT_KEY, key)
  } catch {
    /* quota */
  }
}

function isHandled(key: string): boolean {
  try {
    return localStorage.getItem(HANDLED_SLOT_KEY) === key
  } catch {
    return false
  }
}

async function clearAllSlots(projectPath: string | null): Promise<void> {
  await writeSlot({}, '')
  if (projectPath) await writeSlot({ path: projectPath }, '')
}

function parseEnvelope(raw: string): AutosaveEnvelope | null {
  try {
    const v: unknown = JSON.parse(raw)
    if (typeof v !== 'object' || v === null) return null
    const e = v as Partial<AutosaveEnvelope>
    if (e.v !== 1 || typeof e.checksum !== 'string' || typeof e.content !== 'string') return null
    if (checksumHex(e.content) !== e.checksum) return null // corrupt (H10 §10)
    return {
      v: 1,
      checksum: e.checksum,
      savedAt: typeof e.savedAt === 'number' ? e.savedAt : 0,
      projectPath: typeof e.projectPath === 'string' ? e.projectPath : null,
      title: typeof e.title === 'string' ? e.title : 'Recovered document',
      content: e.content,
    }
  } catch {
    return null
  }
}

// ——— autosave timer (2s debounce + 30s cap) ———

interface PendingState {
  docId: number
  firstChangeAt: number
  lastChangeAt: number
  timer: ReturnType<typeof setTimeout> | null
}

let pending: PendingState | null = null
let disposers: (() => void)[] = []
let depsRef: AutosaveDeps | null = null
/** Slot paths written THIS session — lets a manual save clear its slot
 *  without probing the disk (AS-D3a: clear only a slot that exists; a save
 *  must never CREATE a stray blank `.autosave` file). */
const writtenSlots = new Set<string>()
let lastAutosaveAt = 0
const lastListeners = new Set<() => void>()

export function getLastAutosaveAt(): number {
  return lastAutosaveAt
}

export function subscribeLastAutosave(fn: () => void): () => void {
  lastListeners.add(fn)
  return () => {
    lastListeners.delete(fn)
  }
}

function markLastAutosave(ts: number): void {
  lastAutosaveAt = ts
  for (const fn of [...lastListeners]) fn()
}

function clearPending(): void {
  if (pending?.timer) clearTimeout(pending.timer)
  pending = null
}

/** Write the slot for the ACTIVE document now (if still dirty — FL-0014:
 *  never touches dirty, never emits `saving:changed`). */
async function flushAutosave(): Promise<void> {
  const deps = depsRef
  const p = pending
  clearPending()
  if (!deps || !p) return
  const st = statusJson()
  if (!st || !st.dirty) return // CLEAN → nothing worth recovering
  const docId = activeDocId()
  if (docId !== p.docId) return // AS-D6: deactivated → cancelled
  const path = deps.getDocPath(docId)
  const isDesktop = platform.isDesktop()
  if (isDesktop && !path) return // AMB-D-001: pathless on desktop → no slot
  const json = projectJson()
  if (!json) return
  const content = stampFormatVersion(json)
  if (!content) return
  const envelope: AutosaveEnvelope = {
    v: 1,
    checksum: checksumHex(content),
    savedAt: Date.now(),
    projectPath: path ?? null,
    title: st.doc_title ?? 'Untitled',
    content,
  }
  const ok = await writeSlot({ path: isDesktop ? path : undefined }, JSON.stringify(envelope))
  if (isDesktop && path) writtenSlots.add(autosaveSlotPath(path))
  if (ok) markLastAutosave(envelope.savedAt)
}

function schedule(): void {
  if (!loadAutosavePrefs().enabled) {
    clearPending()
    return
  }
  const now = Date.now()
  const docId = activeDocId()
  if (docId === 0) return
  if (pending && pending.docId === docId) {
    pending.lastChangeAt = now
  } else {
    if (pending?.timer) clearTimeout(pending.timer)
    pending = { docId, firstChangeAt: now, lastChangeAt: now, timer: null }
  }
  const p = pending
  if (p.timer) clearTimeout(p.timer)
  // 2s after the LAST change, but never later than the user interval after
  // the FIRST unsaved-to-slot change (eng 13 default = 30s).
  const cap = autosaveMaxIntervalMs()
  const deadline = Math.min(p.lastChangeAt + AUTOSAVE_DEBOUNCE_MS, p.firstChangeAt + cap)
  p.timer = setTimeout(() => {
    void flushAutosave()
  }, Math.max(0, deadline - now))
}

/**
 * Arm MOD-AUTOSAVE. Subscribes to `document:changed` (DOCUMENT mutations
 * only — view/session/workspace actions never fire it, so they can never
 * trigger an autosave). Returns a dispose fn.
 */
export function initAutosave(deps: AutosaveDeps): () => void {
  depsRef = deps
  const offDoc = bus.on('document:changed', () => schedule())
  // AS-D6: a pending snapshot can only be taken from the ACTIVE document.
  const offActive = bus.on('activeDoc:changed', () => {
    if (pending && pending.docId !== activeDocId()) clearPending()
  })
  const offPrefs = subscribeAutosavePrefs(() => {
    if (!loadAutosavePrefs().enabled) clearPending()
    else if (pending) schedule()
  })
  disposers = [offDoc, offActive, offPrefs]
  return () => {
    disposers.forEach((d) => d())
    disposers = []
    clearPending()
    depsRef = null
  }
}

/**
 * Manual-save success hook (called by SYS-02 at the H10 §5.1 seam AFTER the
 * atomic write + markClean succeeded): enforces INV-AS-1 by clearing the
 * slot — the slot's content is now older than the manual save. Clears ONLY
 * a slot that actually exists (this session's write set, or a non-blank
 * slot left by a previous session) — a plain save never creates a stray
 * blank `.autosave` file (AS-D3a).
 */
export async function onManualSaveSuccess(docId: number, path: string | undefined): Promise<void> {
  if (pending?.docId === docId) clearPending()
  if (!platform.isDesktop()) {
    await writeSlot({}, '')
    return
  }
  if (!path) return // pathless desktop doc never had a slot (AMB-D-001)
  const slot = autosaveSlotPath(path)
  if (!writtenSlots.has(slot)) {
    // Not written this session — probe for a previous session's leftover.
    let leftover: string | null = null
    try {
      leftover = await platform.readProject(slot)
    } catch {
      leftover = null
    }
    if (!leftover || leftover.trim() === '') return // nothing to clear
  }
  writtenSlots.delete(slot)
  await writeSlot({ path }, '')
}

// ——— launch recovery (T12–T14) ———

/**
 * Launch-time scan (H10 §5.4). Native: most-recent-first over the recent
 * list's project paths; first valid slot wins (the prompt is singular in
 * every source). Browser: the dev-harness slot. Corrupt slots are SKIPPED
 * and counted (H10 §10 — the caller toasts; the slot is kept as evidence).
 */
export async function checkRecovery(deps: AutosaveDeps): Promise<RecoveryScan> {
  let corrupt = 0
  if (platform.isDesktop()) {
    for (const r of deps.listRecentPaths()) {
      const raw = await readSlot({ path: r.path })
      if (!raw) continue
      const env = parseEnvelope(raw)
      if (!env) {
        corrupt += 1
        continue
      }
      const key = snapshotKey(env.content, r.path, env.savedAt)
      if (isHandled(key)) {
        void writeSlot({ path: r.path }, '')
        continue
      }
      return {
        candidate: {
          source: 'native',
          title: env.title,
          content: env.content,
          savedAt: env.savedAt,
          projectPath: r.path,
        },
        corruptSkipped: corrupt,
      }
    }
    return { candidate: null, corruptSkipped: corrupt }
  }
  const raw = await readSlot({})
  if (!raw) return { candidate: null, corruptSkipped: 0 }
  const env = parseEnvelope(raw)
  if (!env) return { candidate: null, corruptSkipped: 1 }
  const key = snapshotKey(env.content, env.projectPath, env.savedAt)
  if (isHandled(key)) {
    await writeSlot({}, '')
    return { candidate: null, corruptSkipped: 0 }
  }
  return {
    candidate: {
      source: 'browser-dev',
      title: env.title,
      content: env.content,
      savedAt: env.savedAt,
      projectPath: env.projectPath,
    },
    corruptSkipped: 0,
  }
}

/**
 * T13 Accept: load the recovered content (validate → migrate via
 * MOD-PERSIST), document becomes ACTIVE(TITLED, CLEAN); events in H02 §14
 * order (`openSet:changed{added}` FIRST, then `activeDoc:changed`). The slot
 * is CLEARED (AS-D4) so the same snapshot never re-prompts. Returns the new
 * docId, or 0 on failure (state unchanged — error outcome, not a state).
 */
export async function acceptRecovery(c: RecoveryCandidate, deps: AutosaveDeps): Promise<number> {
  const prepared = prepareForLoad(c.content)
  if (!prepared.ok) return 0
  const id = openDocJson(prepared.content, c.title)
  if (id === 0) return 0
  if (c.projectPath) deps.adoptDocPath(id, c.projectPath)
  markClean()
  rememberHandled(snapshotKey(c.content, c.projectPath, c.savedAt))
  await clearAllSlots(c.projectPath)
  bus.emit('openSet:changed', { change: 'added', docId: id })
  bus.emit('activeDoc:changed', { docId: id })
  return id
}

/** T14 Discard: clear the slot (AS-D4), remain NO_DOCUMENT — no events. */
export async function discardRecovery(c: RecoveryCandidate): Promise<void> {
  rememberHandled(snapshotKey(c.content, c.projectPath, c.savedAt))
  await clearAllSlots(c.projectPath)
}

/** Test seam: reset module timer state (jsdom has no session boundary). */
export function __resetAutosaveForTests(): void {
  clearPending()
  depsRef = null
  disposers.forEach((d) => d())
  disposers = []
  writtenSlots.clear()
  try {
    localStorage.removeItem(HANDLED_SLOT_KEY)
  } catch {
    /* ignore */
  }
}
