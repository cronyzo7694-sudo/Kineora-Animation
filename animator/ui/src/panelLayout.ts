/**
 * Workspace panel layout (C-06 §pnl.resize + Part 01 §1.1.2 — workspace state
 * persisted to APP PREFS, never to the document). One spec table drives every
 * splitter so panels share a single resize architecture (no one-off sizes).
 *
 * Constraints:
 *  - Layers width 140–480     [BLUEPRINT REQUIRED via C-22/C-06 min-clamp]
 *  - Properties width 240–520 [BLUEPRINT REQUIRED — C-09 "min 240×320"]
 *  - Timeline height 96px..60% viewport [BLUEPRINT REQUIRED — C-08 §A "min 96,
 *    max 60% viewport"]
 *  - Library / Debug height min 96/120 [OUR DESIGN DECISION — the blueprint
 *    gives no exact number; C-36 "never zero" + 44px touch target floor]
 */
export interface PanelLayout {
  layersW: number
  propsW: number
  timelineH: number
  libraryH: number
  debugH: number
}

export const LAYERS_W: [number, number] = [140, 480]
export const PROPS_W: [number, number] = [240, 520]
export const PROPS_H_MIN = 320 // C-09 "min 240×320"
export const TIMELINE_H_MIN = 96 // C-08 "min 96px"
export const TIMELINE_H_MAX_FRAC = 0.6 // C-08 "max 60% viewport"
export const LIBRARY_H: [number, number] = [96, 480] // [OUR DESIGN DECISION]
export const DEBUG_H: [number, number] = [120, 480] // [OUR DESIGN DECISION]

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

export function clampLayout(l: PanelLayout): PanelLayout {
  return {
    layersW: clamp(l.layersW, LAYERS_W[0], LAYERS_W[1]),
    propsW: clamp(l.propsW, PROPS_W[0], PROPS_W[1]),
    timelineH: clamp(l.timelineH, TIMELINE_H_MIN, timelineMaxH()),
    libraryH: clamp(l.libraryH, LIBRARY_H[0], LIBRARY_H[1]),
    debugH: clamp(l.debugH, DEBUG_H[0], DEBUG_H[1]),
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
