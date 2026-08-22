// ===========================================================================
// SYS-04 view preferences — rulers / grid / hide-edges / work-area / preview.
// App prefs (localStorage), NEVER written into the project JSON (INV-PERS-3).
// View-only: toggling these never dirties a document and never creates undo.
// ===========================================================================

export const VIEW_PREFS_KEY = 'kineora.view'

/** AMB-SYS04-001 PROVISIONAL — Blueprint 1.4.4 says the grid is
 *  "configurable" but is silent on the default cell size. 20 document units
 *  is a conventional authoring grid. Flagged, never silently finalized. */
export const DEFAULT_GRID_SIZE = 20

export type PreviewMode = 'full' | 'outline'

export interface ViewPrefs {
  rulers: boolean
  grid: boolean
  hideEdges: boolean
  /** Pasteboard / work area. Default ON (the stage is already drawn with it). */
  workArea: boolean
  preview: PreviewMode
  gridSize: number
}

export function defaultViewPrefs(): ViewPrefs {
  return {
    rulers: false,
    grid: false,
    hideEdges: false,
    workArea: true,
    preview: 'full',
    gridSize: DEFAULT_GRID_SIZE,
  }
}

const listeners = new Set<() => void>()

function emit(): void {
  for (const fn of [...listeners]) fn()
}

export function subscribeViewPrefs(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function sanitize(raw: unknown): ViewPrefs {
  const d = defaultViewPrefs()
  if (!isRecord(raw)) return d
  return {
    rulers: typeof raw.rulers === 'boolean' ? raw.rulers : d.rulers,
    grid: typeof raw.grid === 'boolean' ? raw.grid : d.grid,
    hideEdges: typeof raw.hideEdges === 'boolean' ? raw.hideEdges : d.hideEdges,
    workArea: typeof raw.workArea === 'boolean' ? raw.workArea : d.workArea,
    preview: raw.preview === 'outline' ? 'outline' : 'full',
    gridSize:
      typeof raw.gridSize === 'number' && Number.isFinite(raw.gridSize) && raw.gridSize > 0
        ? raw.gridSize
        : d.gridSize,
  }
}

let cached: ViewPrefs | null = null

export function loadViewPrefs(): ViewPrefs {
  if (cached) return cached
  try {
    const raw = localStorage.getItem(VIEW_PREFS_KEY)
    cached = raw ? sanitize(JSON.parse(raw)) : defaultViewPrefs()
  } catch {
    cached = defaultViewPrefs()
  }
  return cached
}

function persist(next: ViewPrefs): void {
  cached = next
  try {
    localStorage.setItem(VIEW_PREFS_KEY, JSON.stringify(next))
  } catch {
    /* storage unavailable → session-only */
  }
  emit()
}

export function patchViewPrefs(patch: Partial<ViewPrefs>): ViewPrefs {
  const next = { ...loadViewPrefs(), ...patch }
  persist(next)
  return next
}

export function toggleViewFlag(key: 'rulers' | 'grid' | 'hideEdges' | 'workArea'): ViewPrefs {
  const cur = loadViewPrefs()
  return patchViewPrefs({ [key]: !cur[key] })
}

export function setPreviewMode(mode: PreviewMode): ViewPrefs {
  return patchViewPrefs({ preview: mode })
}

/** Test-only. */
export function resetViewPrefsForTests(): void {
  cached = null
  try {
    localStorage.removeItem(VIEW_PREFS_KEY)
  } catch {
    /* ignore */
  }
}
