/**
 * Workspace panel layout (C-06 §pnl.resize + Part 01 §1.1.2 — workspace state
 * persisted to APP PREFS, never to the document). ONE generic sizing engine
 * drives every panel, so future panels inherit the same sizing/overflow rules.
 *
 * Panel constraints:
 *  - Layers width 140–480      [BLUEPRINT REQUIRED via C-22/C-06 min-clamp]
 *  - Properties width 240–520  [BLUEPRINT REQUIRED — C-09 "min 240×320"]
 *  - Properties height ≥320    [BLUEPRINT REQUIRED — C-09]
 *  - Timeline height 96px..60% viewport [BLUEPRINT REQUIRED — C-08 §A]
 *  - Library height 96–480 · Debug height 120–480 [OUR DESIGN DECISION — the
 *    blueprint gives no exact number; C-36 "never zero" + touch-target floor]
 */

export interface PanelLayout {
  layersW: number
  propsW: number
  timelineH: number
  libraryH: number
  debugH: number
}

/** A resizable vertical pane (a dock panel participates as one of these). */
export interface PaneSpec {
  min: number
  max: number
  pref: number
  /** The pane that absorbs slack / gives way (its height is derived). */
  flex?: boolean
}

export const SPLITTER_SIZE = 6

export const LAYERS_W: [number, number] = [140, 480]
export const PROPS_W: [number, number] = [240, 520]
export const TIMELINE_H_MIN = 96 // C-08 "min 96px"
export const TIMELINE_H_MAX_FRAC = 0.6 // C-08 "max 60% viewport"
export const PROPS_PANE: [number, number] = [320, 2400]
export const LIBRARY_PANE: [number, number] = [96, 480]
export const DEBUG_PANE: [number, number] = [120, 480]

export const DEFAULT_LAYOUT: PanelLayout = {
  layersW: 200,
  propsW: 240,
  timelineH: 156,
  libraryH: 160,
  debugH: 200,
}

export const PANEL_PREFS_KEY = 'kineora.workspace.panelLayout'

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

/** Timeline max height = 60% of the viewport height (C-08 §A). */
export function timelineMaxH(viewportH = window.innerHeight): number {
  return Math.max(TIMELINE_H_MIN, Math.round(viewportH * TIMELINE_H_MAX_FRAC))
}

/**
 * Distribute `avail` px among a stack of vertical panes, leaving room for
 * `splitters` 6px splitter strips. Invariants (C-36 "no zero size, no
 * off-screen, no overlap"):
 *  - non-flex panes keep their preferred sizes (clamped to [min,max]);
 *  - the flex pane fills the remaining space, clamped to its [min,max];
 *  - if the panes' total exceeds the available space, the REGION scrolls (the
 *    caller's deliberate overflow strategy) — no pane is ever hidden off-screen.
 */
export function distribute(avail: number, panes: PaneSpec[], splitters: number): number[] {
  if (panes.length === 0) return []
  const inner = Math.max(0, avail - splitters * SPLITTER_SIZE)
  const flexIdx = panes.findIndex((p) => p.flex)
  if (flexIdx < 0) {
    return panes.map((p) => clamp(p.pref, p.min, p.max))
  }
  const sizes = panes.map((p) => (p.flex ? 0 : clamp(p.pref, p.min, p.max)))
  const fixedSum = sizes.reduce((a, b) => a + b, 0)
  const flexSize = inner - fixedSum
  sizes[flexIdx] = clamp(flexSize, panes[flexIdx].min, panes[flexIdx].max)
  return sizes
}

/**
 * Sum-aware clamp for dragging pane `idx`'s splitter (a splitter resizes the
 * pane BELOW it): the pane can never grow beyond what leaves every OTHER pane
 * its minimum (and never below its own minimum) — one splitter drag can never
 * squeeze a sibling to zero or push it off-screen.
 */
export function clampPanePref(
  avail: number,
  panes: PaneSpec[],
  idx: number,
  value: number,
  splitters: number,
): number {
  const inner = Math.max(0, avail - splitters * SPLITTER_SIZE)
  const othersMin = panes.filter((_, i) => i !== idx).reduce((a, p) => a + p.min, 0)
  const cap = Math.max(0, inner - othersMin)
  return clamp(value, panes[idx].min, Math.min(panes[idx].max, cap))
}

export function clampLayout(l: PanelLayout): PanelLayout {
  return {
    layersW: clamp(l.layersW, LAYERS_W[0], LAYERS_W[1]),
    propsW: clamp(l.propsW, PROPS_W[0], PROPS_W[1]),
    timelineH: clamp(l.timelineH, TIMELINE_H_MIN, timelineMaxH()),
    libraryH: clamp(l.libraryH, LIBRARY_PANE[0], LIBRARY_PANE[1]),
    debugH: clamp(l.debugH, DEBUG_PANE[0], DEBUG_PANE[1]),
  }
}

export function loadLayout(): PanelLayout {
  try {
    const raw = localStorage.getItem(PANEL_PREFS_KEY)
    if (raw) {
      const p = JSON.parse(raw) as Partial<PanelLayout>
      if (
        typeof p.layersW === 'number' &&
        typeof p.propsW === 'number' &&
        typeof p.timelineH === 'number' &&
        typeof p.libraryH === 'number' &&
        typeof p.debugH === 'number'
      ) {
        return clampLayout({
          layersW: p.layersW,
          propsW: p.propsW,
          timelineH: p.timelineH,
          libraryH: p.libraryH,
          debugH: p.debugH,
        })
      }
    }
  } catch {
    /* corrupt prefs → defaults */
  }
  return { ...DEFAULT_LAYOUT }
}

export function saveLayout(l: PanelLayout): void {
  try {
    localStorage.setItem(PANEL_PREFS_KEY, JSON.stringify(l))
  } catch {
    /* storage unavailable → session-only */
  }
}

/** Reset Workspace (C-06 §D): clear saved prefs and return to defaults. */
export function resetLayout(): PanelLayout {
  try {
    localStorage.removeItem(PANEL_PREFS_KEY)
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_LAYOUT }
}
