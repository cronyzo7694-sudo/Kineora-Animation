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
  /** Selection: snap the move to nearby object / stage edges (Adobe Snap to Objects). */
  snapToObjects: boolean
  /** Selection: snap move / nudge to whole pixels (Adobe Snap to Pixels). */
  snapToPixels: boolean
  /** Selection: marquee selects objects it *touches* (ON) vs fully enclosed (OFF). */
  contactSensitive: boolean
}

export function defaultToolOptions(): ToolOptions {
  return {
    zoomMode: 'in',
    inkSize: 4,
    fontSize: 24,
    snapToObjects: true,
    snapToPixels: false,
    contactSensitive: true,
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
    snapToObjects: typeof patch.snapToObjects === 'boolean' ? patch.snapToObjects : state.snapToObjects,
    snapToPixels: typeof patch.snapToPixels === 'boolean' ? patch.snapToPixels : state.snapToPixels,
    contactSensitive: typeof patch.contactSensitive === 'boolean' ? patch.contactSensitive : state.contactSensitive,
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
