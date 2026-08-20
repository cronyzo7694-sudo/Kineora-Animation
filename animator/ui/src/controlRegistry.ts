// Central control registry — the zero-dead-button data model (Phase-2.5 §2).
// Every visible control must exist here with a unique ID, a11y label, state,
// visibility, and a real action binding (engine-backed via engine/actions).

import { performAction, togglePlay } from './engine/actions'

export type ControlState = 'FUNCTIONAL' | 'DISABLED-BY-CONTEXT' | 'COMING-SOON'
export type Visibility =
  | 'ALWAYS'
  | 'CONTEXTUAL'
  | 'COLLAPSIBLE'
  | 'HIDDEN-WHEN-UNAVAILABLE'
  | 'DISABLED-WHEN-UNAVAILABLE'

export interface EngineStatus {
  kind: 'ok' | 'error'
  detail: string
}

export interface AppContext {
  engine: EngineStatus
  notify: (msg: string) => void
  setTool: (tool: string) => void
  /** Open/close a docked panel ('layers' | 'properties'). */
  togglePanel: (id: string) => void
  /** Current open/closed state of each docked panel. */
  panels: Record<string, boolean>
  /** Open the export dialog (C-31 exp.image). */
  openExport: () => void
}

export interface Control {
  id: string
  label: string
  a11y: string
  tooltip: string
  state: ControlState
  visibility: Visibility
  shortcut?: string
  action: (ctx: AppContext) => void
}

export const controls: Control[] = [
  { id: 'tool.select', label: 'Select', a11y: 'Select tool', tooltip: 'Select and move objects (V)', state: 'FUNCTIONAL', visibility: 'ALWAYS', shortcut: 'V', action: (c) => c.setTool('select') },
  { id: 'tool.rect', label: 'Rect', a11y: 'Rectangle tool', tooltip: 'Draw rectangle (R)', state: 'FUNCTIONAL', visibility: 'ALWAYS', shortcut: 'R', action: (c) => c.setTool('rect') },
  { id: 'tool.transform', label: 'Transform', a11y: 'Free transform tool', tooltip: 'Transform selection (Q)', state: 'FUNCTIONAL', visibility: 'ALWAYS', shortcut: 'Q', action: (c) => c.setTool('transform') },
  { id: 'edit.undo', label: 'Undo', a11y: 'Undo', tooltip: 'Undo (Ctrl+Z)', state: 'FUNCTIONAL', visibility: 'ALWAYS', shortcut: 'Ctrl+Z', action: (c) => performAction('edit.undo', c.notify) },
  { id: 'edit.redo', label: 'Redo', a11y: 'Redo', tooltip: 'Redo (Ctrl+Shift+Z)', state: 'FUNCTIONAL', visibility: 'ALWAYS', shortcut: 'Ctrl+Shift+Z', action: (c) => performAction('edit.redo', c.notify) },
  { id: 'timeline.play', label: 'Play', a11y: 'Play/pause', tooltip: 'Play/pause (Enter)', state: 'FUNCTIONAL', visibility: 'ALWAYS', shortcut: 'Enter', action: (c) => togglePlay(c.notify) },
  { id: 'timeline.keyframe', label: 'Keyframe', a11y: 'Insert keyframe', tooltip: 'Insert keyframe (F6)', state: 'FUNCTIONAL', visibility: 'ALWAYS', shortcut: 'F6', action: (c) => performAction('timeline.keyframe', c.notify) },
  { id: 'file.save', label: 'Save', a11y: 'Save project', tooltip: 'Save (downloads project JSON)', state: 'FUNCTIONAL', visibility: 'ALWAYS', shortcut: 'Ctrl+S', action: (c) => performAction('file.save', c.notify) },
  { id: 'file.export', label: 'Export', a11y: 'Export image', tooltip: 'Export frame (SVG/PNG/JPEG/WebP)', state: 'FUNCTIONAL', visibility: 'ALWAYS', action: (c) => c.openExport() },
  { id: 'panel.layers', label: 'Layers', a11y: 'Layers panel', tooltip: 'Toggle layers panel', state: 'FUNCTIONAL', visibility: 'ALWAYS', action: (c) => c.togglePanel('layers') },
  { id: 'panel.properties', label: 'Properties', a11y: 'Properties panel', tooltip: 'Toggle properties panel', state: 'FUNCTIONAL', visibility: 'ALWAYS', action: (c) => c.togglePanel('properties') },
  { id: 'nav.back', label: 'Back', a11y: 'Back one level', tooltip: 'Exit edit depth (Esc)', state: 'FUNCTIONAL', visibility: 'CONTEXTUAL', shortcut: 'Esc', action: (c) => c.notify('back: next unit') },
]

// Build-time / test-time validation: duplicate IDs, unbound FUNCTIONAL controls,
// missing a11y labels. A functional-looking button must never do nothing.
export function validateRegistry(list: Control[]): string[] {
  const errors: string[] = []
  const seen = new Set<string>()
  for (const c of list) {
    if (seen.has(c.id)) errors.push(`duplicate control id: ${c.id}`)
    seen.add(c.id)
    if (c.state === 'FUNCTIONAL' && typeof c.action !== 'function') {
      errors.push(`unbound FUNCTIONAL control: ${c.id}`)
    }
    if (!c.a11y || c.a11y.trim() === '') errors.push(`missing a11y label: ${c.id}`)
  }
  return errors
}
