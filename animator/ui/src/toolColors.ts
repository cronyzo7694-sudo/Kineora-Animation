// ===========================================================================
// TOOL COLORS — the Tools panel "colors area" (Adobe: "The Tools panel Stroke
// Color and Fill Color controls set the painting attributes of NEW objects you
// create with the drawing and painting tools", helpx — Strokes, fills, and
// gradients with Animate).
//
// This is authoring state, not document state: it is an app preference
// (localStorage), never written into the project JSON, never undoable — exactly
// like viewPrefs. Changing a swatch does not touch the document; it only
// decides what the next draw / paint-bucket / ink-bottle action uses.
// ===========================================================================

export const TOOL_COLORS_KEY = 'kineora.toolColors'

export interface ToolColors {
  /** Fill Color swatch. `null` = the "No color" modifier Adobe offers. */
  fill: string | null
  /** Stroke Color swatch. `null` = no stroke. */
  stroke: string | null
  /** Stroke width used by the Ink Bottle (Properties-panel "stroke width"). */
  strokeWidth: number
}

/** Adobe's Tools-panel default: black stroke, white fill ("reset to default"). */
export function defaultToolColors(): ToolColors {
  return { fill: '#ffffff', stroke: '#000000', strokeWidth: 1 }
}

const listeners = new Set<() => void>()
let cache: ToolColors | null = null

function emit(): void {
  for (const fn of [...listeners]) fn()
}

export function subscribeToolColors(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** A CSS hex color (#rgb / #rrggbb) — anything else is rejected, never guessed. */
export function isHexColor(v: unknown): v is string {
  return typeof v === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)
}

function sanitize(raw: unknown): ToolColors {
  const d = defaultToolColors()
  if (!isRecord(raw)) return d
  const width = typeof raw.strokeWidth === 'number' && Number.isFinite(raw.strokeWidth) ? Math.max(0, raw.strokeWidth) : d.strokeWidth
  return {
    fill: raw.fill === null ? null : isHexColor(raw.fill) ? raw.fill : d.fill,
    stroke: raw.stroke === null ? null : isHexColor(raw.stroke) ? raw.stroke : d.stroke,
    strokeWidth: width,
  }
}

export function loadToolColors(): ToolColors {
  if (cache) return cache
  try {
    const raw = window.localStorage.getItem(TOOL_COLORS_KEY)
    cache = sanitize(raw ? JSON.parse(raw) : null)
  } catch {
    cache = defaultToolColors()
  }
  return cache
}

export function setToolColors(patch: Partial<ToolColors>): ToolColors {
  const next = sanitize({ ...loadToolColors(), ...patch })
  cache = next
  try {
    window.localStorage.setItem(TOOL_COLORS_KEY, JSON.stringify(next))
  } catch {
    /* storage unavailable — keep the in-memory value (never throw at the user) */
  }
  emit()
  return next
}

/** Adobe "swap fill and stroke colors" control. */
export function swapToolColors(): ToolColors {
  const c = loadToolColors()
  return setToolColors({ fill: c.stroke, stroke: c.fill })
}

/** Adobe "reset colors to the default" control. */
export function resetToolColors(): ToolColors {
  return setToolColors(defaultToolColors())
}

/** Test seam — drop the cached value so a fresh localStorage read happens. */
export function resetToolColorsCacheForTests(): void {
  cache = null
}
