// ===========================================================================
// TOOL OPTIONS — the Tools panel "options area" (Adobe: "the options area
// contains modifiers for the currently selected tool. Modifiers affect the
// tool's painting or editing operations").
// App state only — never document state, never undoable.
// ===========================================================================

export type ZoomMode = 'in' | 'out'

export interface ToolOptions {
  zoomMode: ZoomMode
  /** Pencil / Brush / Eraser diameter in document px. */
  inkSize: number
  /** Text tool size in document px. */
  fontSize: number
  fontFamily: string
  fontWeight: 'normal' | 'bold'
  fontItalic: boolean
  fontUnderline: boolean
  textAlign: 'left' | 'center' | 'right'
  letterSpacing: number
  /** Selection: snap the move to nearby object / stage edges (Adobe Snap to Objects). */
  snapToObjects: boolean
  /** Selection: snap move / nudge to whole pixels (Adobe Snap to Pixels). */
  snapToPixels: boolean
  /** Selection: marquee selects objects it *touches* (ON) vs fully enclosed (OFF). */
  contactSensitive: boolean
  /** Adobe Rectangle flyout / Shape box preset. */
  shapePreset: string
  /** PolyStar / polygon side count (3–32). */
  polySides: number
  /** Star inner radius 0.1–0.9. */
  starInner: number
  /** Rounded-rect corner % of min(w,h). */
  cornerRadius: number
  /** Adobe Pen: preview the next segment to the cursor (rubber-band). */
  penRubberBand: boolean
  /** Adobe Pencil: Straighten / Smooth / Ink. */
  pencilMode: 'straighten' | 'smooth' | 'ink'
  /** Smooth amount 0–100 (Smooth mode). */
  pencilSmooth: number
  /** Adobe stroke style for Pencil (Property inspector). */
  pencilStyle: 'solid' | 'dashed' | 'dotted'
  pencilCap: 'butt' | 'round' | 'square'
  /** Straighten: recognize ovals / rects / triangles. */
  pencilRecognize: boolean
}

export function defaultToolOptions(): ToolOptions {
  return {
    zoomMode: 'in',
    inkSize: 4,
    fontSize: 24,
    fontFamily: 'system-ui, sans-serif',
    fontWeight: 'normal',
    fontItalic: false,
    fontUnderline: false,
    textAlign: 'left',
    letterSpacing: 0,
    snapToObjects: true,
    snapToPixels: false,
    contactSensitive: true,
    shapePreset: 'rect',
    polySides: 5,
    starInner: 0.45,
    cornerRadius: 20,
    penRubberBand: true,
    pencilMode: 'smooth',
    pencilSmooth: 50,
  }
}

let state: ToolOptions = defaultToolOptions()
const listeners = new Set<() => void>()

export function subscribeToolOptions(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function loadToolOptions(): ToolOptions {
  return state
}

export function setToolOptions(patch: Partial<ToolOptions>): ToolOptions {
  const d = defaultToolOptions()
  const next: ToolOptions = {
    zoomMode: patch.zoomMode === 'in' || patch.zoomMode === 'out' ? patch.zoomMode : state.zoomMode,
    inkSize:
      typeof patch.inkSize === 'number' && Number.isFinite(patch.inkSize)
        ? Math.max(1, Math.min(64, patch.inkSize))
        : state.inkSize,
    fontSize:
      typeof patch.fontSize === 'number' && Number.isFinite(patch.fontSize)
        ? Math.max(8, Math.min(200, patch.fontSize))
        : (state.fontSize ?? d.fontSize),
    fontFamily: typeof patch.fontFamily === 'string' && patch.fontFamily ? patch.fontFamily : (state.fontFamily ?? d.fontFamily),
    fontWeight: patch.fontWeight === 'bold' || patch.fontWeight === 'normal' ? patch.fontWeight : (state.fontWeight ?? d.fontWeight),
    fontItalic: typeof patch.fontItalic === 'boolean' ? patch.fontItalic : (state.fontItalic ?? d.fontItalic),
    fontUnderline: typeof patch.fontUnderline === 'boolean' ? patch.fontUnderline : (state.fontUnderline ?? d.fontUnderline),
    textAlign:
      patch.textAlign === 'left' || patch.textAlign === 'center' || patch.textAlign === 'right'
        ? patch.textAlign
        : (state.textAlign ?? d.textAlign),
    letterSpacing:
      typeof patch.letterSpacing === 'number' && Number.isFinite(patch.letterSpacing)
        ? Math.max(-20, Math.min(80, patch.letterSpacing))
        : (state.letterSpacing ?? d.letterSpacing),
    snapToObjects: typeof patch.snapToObjects === 'boolean' ? patch.snapToObjects : state.snapToObjects,
    snapToPixels: typeof patch.snapToPixels === 'boolean' ? patch.snapToPixels : state.snapToPixels,
    contactSensitive: typeof patch.contactSensitive === 'boolean' ? patch.contactSensitive : state.contactSensitive,
    shapePreset: typeof patch.shapePreset === 'string' && patch.shapePreset ? patch.shapePreset : state.shapePreset ?? d.shapePreset,
    polySides:
      typeof patch.polySides === 'number' && Number.isFinite(patch.polySides)
        ? Math.max(3, Math.min(32, Math.round(patch.polySides)))
        : (state.polySides ?? d.polySides),
    starInner:
      typeof patch.starInner === 'number' && Number.isFinite(patch.starInner)
        ? Math.max(0.1, Math.min(0.9, patch.starInner))
        : (state.starInner ?? d.starInner),
    cornerRadius:
      typeof patch.cornerRadius === 'number' && Number.isFinite(patch.cornerRadius)
        ? Math.max(0, Math.min(49, patch.cornerRadius))
        : (state.cornerRadius ?? d.cornerRadius),
    penRubberBand: typeof patch.penRubberBand === 'boolean' ? patch.penRubberBand : (state.penRubberBand ?? d.penRubberBand),
    pencilMode:
      patch.pencilMode === 'straighten' || patch.pencilMode === 'smooth' || patch.pencilMode === 'ink'
        ? patch.pencilMode
        : (state.pencilMode ?? d.pencilMode),
    pencilSmooth:
      typeof patch.pencilSmooth === 'number' && Number.isFinite(patch.pencilSmooth)
        ? Math.max(0, Math.min(100, patch.pencilSmooth))
        : (state.pencilSmooth ?? d.pencilSmooth),
    pencilStyle:
      patch.pencilStyle === 'solid' || patch.pencilStyle === 'dashed' || patch.pencilStyle === 'dotted'
        ? patch.pencilStyle
        : (state.pencilStyle ?? d.pencilStyle),
    pencilCap:
      patch.pencilCap === 'butt' || patch.pencilCap === 'round' || patch.pencilCap === 'square'
        ? patch.pencilCap
        : (state.pencilCap ?? d.pencilCap),
    pencilRecognize: typeof patch.pencilRecognize === 'boolean' ? patch.pencilRecognize : (state.pencilRecognize ?? d.pencilRecognize),
  }
  state = next
  for (const fn of [...listeners]) fn()
  return next
}

export function resetToolOptionsForTests(): void {
  state = defaultToolOptions()
}

const SNAP = 6

export function snapMoveDelta(
  dx: number,
  dy: number,
  selected: { x: number; y: number; w: number; h: number }[],
  others: { x: number; y: number; w: number; h: number }[],
  stageW: number,
  stageH: number,
  opts: Pick<ToolOptions, 'snapToObjects' | 'snapToPixels'>,
): { x: number; y: number } {
  let x = dx
  let y = dy
  if (opts.snapToObjects && selected.length > 0) {
    const edgesX = [0, stageW]
    const edgesY = [0, stageH]
    for (const o of others) {
      edgesX.push(o.x, o.x + o.w)
      edgesY.push(o.y, o.y + o.h)
    }
    let bestX = SNAP + 1
    let bestY = SNAP + 1
    for (const s of selected) {
      const sx = [s.x + dx, s.x + s.w + dx]
      const sy = [s.y + dy, s.y + s.h + dy]
      for (const a of sx) {
        for (const e of edgesX) {
          const d = e - a
          if (Math.abs(d) < Math.abs(bestX)) bestX = d
        }
      }
      for (const a of sy) {
        for (const e of edgesY) {
          const d = e - a
          if (Math.abs(d) < Math.abs(bestY)) bestY = d
        }
      }
    }
    if (Math.abs(bestX) <= SNAP) x += bestX
    if (Math.abs(bestY) <= SNAP) y += bestY
  }
  if (opts.snapToPixels) {
    x = Math.round(x)
    y = Math.round(y)
  }
  return { x, y }
}

export function rectFullyInside(
  r: { x: number; y: number; w: number; h: number },
  box: { x: number; y: number; w: number; h: number },
): boolean {
  return r.x >= box.x && r.y >= box.y && r.x + r.w <= box.x + box.w && r.y + r.h <= box.y + box.h
}
