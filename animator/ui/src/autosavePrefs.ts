// ===========================================================================
// Auto-Save preferences — app prefs (localStorage), NEVER in project JSON
// (INV-PERS-3). Toggle + interval only; the slot writer stays in autosave.ts.
// ===========================================================================

export const AUTOSAVE_PREFS_KEY = 'kineora.autosave.prefs'

/** Presets shown in File / Preferences (seconds). Default 30s = eng 13. */
export const AUTOSAVE_INTERVAL_PRESETS = [30, 60, 120, 300, 600] as const

export interface AutosavePrefs {
  enabled: boolean
  /** Max time after first dirty change before a slot write (seconds). */
  intervalSec: number
}

export function defaultAutosavePrefs(): AutosavePrefs {
  return { enabled: true, intervalSec: 30 }
}

const listeners = new Set<() => void>()

function emit(): void {
  for (const fn of [...listeners]) fn()
}

export function subscribeAutosavePrefs(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function clampInterval(n: number): number {
  if (!Number.isFinite(n)) return 30
  return Math.min(3600, Math.max(10, Math.round(n)))
}

function sanitize(raw: unknown): AutosavePrefs {
  const d = defaultAutosavePrefs()
  if (!isRecord(raw)) return d
  return {
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : d.enabled,
    intervalSec: typeof raw.intervalSec === 'number' ? clampInterval(raw.intervalSec) : d.intervalSec,
  }
}

let cached: AutosavePrefs | null = null

export function loadAutosavePrefs(): AutosavePrefs {
  if (cached) return cached
  try {
    const raw = localStorage.getItem(AUTOSAVE_PREFS_KEY)
    cached = raw ? sanitize(JSON.parse(raw)) : defaultAutosavePrefs()
  } catch {
    cached = defaultAutosavePrefs()
  }
  return cached
}

function persist(next: AutosavePrefs): void {
  cached = next
  try {
    localStorage.setItem(AUTOSAVE_PREFS_KEY, JSON.stringify(next))
  } catch {
    /* session-only */
  }
  emit()
}

export function patchAutosavePrefs(patch: Partial<AutosavePrefs>): AutosavePrefs {
  const cur = loadAutosavePrefs()
  const next: AutosavePrefs = {
    enabled: patch.enabled ?? cur.enabled,
    intervalSec: patch.intervalSec !== undefined ? clampInterval(patch.intervalSec) : cur.intervalSec,
  }
  persist(next)
  return next
}

export function toggleAutosaveEnabled(): AutosavePrefs {
  return patchAutosavePrefs({ enabled: !loadAutosavePrefs().enabled })
}

export function autosaveMaxIntervalMs(): number {
  return loadAutosavePrefs().intervalSec * 1000
}

export function formatAutosaveInterval(sec: number): string {
  if (sec < 60) return `${sec} sec`
  const m = sec / 60
  return m === 1 ? '1 min' : `${m} min`
}

/** Test-only. */
export function resetAutosavePrefsForTests(): void {
  cached = null
  try {
    localStorage.removeItem(AUTOSAVE_PREFS_KEY)
  } catch {
    /* ignore */
  }
}
