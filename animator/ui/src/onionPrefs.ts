// ===========================================================================
// Onion-skin SESSION prefs (Blueprint 15.2 / 08_ONION_SKIN.md).
// View state only — never written into the project JSON, never undoable,
// never exported (REQ-EXP-002). Reload restores the last toggle/range.
// ===========================================================================

export const ONION_PREFS_KEY = 'kineora.onion'

export type OnionMode = 'follow' | 'anchor'

export interface OnionPrefs {
  on: boolean
  outlines: boolean
  mode: OnionMode
  /** Frames before the playhead when mode === 'follow'. Default 2 (F-15-02 E4). */
  prev: number
  /** Frames after the playhead when mode === 'follow'. Default 2. */
  next: number
  /** Inclusive start when mode === 'anchor'. */
  start: number
  /** Inclusive end when mode === 'anchor'. */
  end: number
  /** AMB-TL-014 recommendation 0.5. */
  startOpacity: number
  /** AMB-TL-015 recommendation 0.2 per step. */
  decreaseBy: number
  /** AMB-TL-016 past tint. */
  pastTint: string
  /** AMB-TL-016 future tint. */
  futureTint: string
}

export function defaultOnionPrefs(): OnionPrefs {
  return {
    on: false,
    outlines: false,
    mode: 'follow',
    prev: 2,
    next: 2,
    start: 1,
    end: 5,
    startOpacity: 0.5,
    decreaseBy: 0.2,
    pastTint: '#ff6666',
    futureTint: '#66cc66',
  }
}

const listeners = new Set<() => void>()

function emit(): void {
  for (const fn of [...listeners]) fn()
}

export function subscribeOnionPrefs(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function num(v: unknown, fallback: number, min: number, max: number): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback
  return Math.min(max, Math.max(min, v))
}

function sanitize(raw: unknown): OnionPrefs {
  const d = defaultOnionPrefs()
  if (!isRecord(raw)) return d
  return {
    on: typeof raw.on === 'boolean' ? raw.on : d.on,
    outlines: typeof raw.outlines === 'boolean' ? raw.outlines : d.outlines,
    mode: raw.mode === 'anchor' ? 'anchor' : 'follow',
    prev: Math.round(num(raw.prev, d.prev, 0, 120)),
    next: Math.round(num(raw.next, d.next, 0, 120)),
    start: Math.round(num(raw.start, d.start, 1, 99999)),
    end: Math.round(num(raw.end, d.end, 1, 99999)),
    startOpacity: num(raw.startOpacity, d.startOpacity, 0, 1),
    decreaseBy: num(raw.decreaseBy, d.decreaseBy, 0, 1),
    pastTint: typeof raw.pastTint === 'string' && raw.pastTint.trim() ? raw.pastTint : d.pastTint,
    futureTint: typeof raw.futureTint === 'string' && raw.futureTint.trim() ? raw.futureTint : d.futureTint,
  }
}

let cached: OnionPrefs | null = null

export function loadOnionPrefs(): OnionPrefs {
  if (cached) return cached
  try {
    const raw = localStorage.getItem(ONION_PREFS_KEY)
    cached = raw ? sanitize(JSON.parse(raw)) : defaultOnionPrefs()
  } catch {
    cached = defaultOnionPrefs()
  }
  return cached
}

function persist(next: OnionPrefs): void {
  cached = next
  try {
    localStorage.setItem(ONION_PREFS_KEY, JSON.stringify(next))
  } catch {
    /* storage unavailable → session-only */
  }
  emit()
}

export function patchOnionPrefs(patch: Partial<OnionPrefs>): OnionPrefs {
  const next = sanitize({ ...loadOnionPrefs(), ...patch })
  persist(next)
  return next
}

export function toggleOnion(): OnionPrefs {
  return patchOnionPrefs({ on: !loadOnionPrefs().on })
}

export function toggleOnionOutlines(): OnionPrefs {
  return patchOnionPrefs({ outlines: !loadOnionPrefs().outlines })
}

/** Preset: Onion 2 / Onion 5 / Onion All (Blueprint 15.2.1 Modify Markers). */
export function setOnionPreset(kind: '2' | '5' | 'all', duration = 1): OnionPrefs {
  if (kind === 'all') {
    return patchOnionPrefs({ on: true, mode: 'anchor', start: 1, end: Math.max(1, duration) })
  }
  const n = kind === '5' ? 5 : 2
  return patchOnionPrefs({ on: true, mode: 'follow', prev: n, next: n })
}

export function setOnionAnchorRange(start: number, end: number): OnionPrefs {
  const a = Math.max(1, Math.round(start))
  const b = Math.max(a, Math.round(end))
  return patchOnionPrefs({ on: true, mode: 'anchor', start: a, end: b })
}

/** Test-only. */
export function resetOnionPrefsForTests(): void {
  cached = null
  try {
    localStorage.removeItem(ONION_PREFS_KEY)
  } catch {
    /* ignore */
  }
}
