// ===========================================================================
// TOOL OPTIONS — the Tools panel "options area" (Adobe: "the options area
// contains modifiers for the currently selected tool. Modifiers affect the
// tool's painting or editing operations").
//
// Slice 1 covers the Zoom tool's Enlarge / Reduce modifier: "To switch the
// Zoom tool between zooming in or out, use the Enlarge or Reduce modifiers (in
// the options area of the Tools panel when the Zoom tool is selected) or
// Alt‑click (Windows) or Option‑click (Macintosh)."
// App state only — never document state, never undoable.
// ===========================================================================

export type ZoomMode = 'in' | 'out'

export interface ToolOptions {
  zoomMode: ZoomMode
  /** Pencil / Brush diameter in document px (Adobe options area). */
  inkSize: number
}

export function defaultToolOptions(): ToolOptions {
  return { zoomMode: 'in', inkSize: 4 }
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
  const next: ToolOptions = {
    zoomMode: patch.zoomMode === 'in' || patch.zoomMode === 'out' ? patch.zoomMode : state.zoomMode,
    inkSize:
      typeof patch.inkSize === 'number' && Number.isFinite(patch.inkSize)
        ? Math.max(1, Math.min(64, patch.inkSize))
        : state.inkSize,
  }
  state = next
  for (const fn of [...listeners]) fn()
  return next
}

export function resetToolOptionsForTests(): void {
  state = defaultToolOptions()
}
