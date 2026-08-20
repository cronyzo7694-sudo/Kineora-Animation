// ============================================================================
// KINEORA COMMAND REGISTRY — the single source of truth for every visible
// action (menus, toolbar, keyboard shortcuts, command palette, panel buttons).
//
// One command = one id + label + shortcut + availability + execution. Every
// surface (menu item, toolbar button, shortcut, palette entry) resolves the
// SAME id to the SAME `run`. Nothing may mutate document state except through
// the Rust engine (via engine/client + engine/actions); view-only commands
// (zoom, panel toggles, playback transport) are clearly marked.
//
// Availability model (zero-dead-button rule):
//   FUNCTIONAL   — wired and working
//   DEFERRED     — a blueprint feature not implemented yet (visible but
//                  disabled with a reason, never silently clickable)
//   UNAVAILABLE  — not applicable to this build (e.g. web-app "Exit")
//
// Sources (Blueprint wins over Adobe):
//   [BLUEPRINT REQUIRED] / [BLUEPRINT + ADOBE] / [ADOBE REFERENCE] /
//   [BLUEPRINT IMPLIED] / [OUR DESIGN DECISION] / [NOT IN BLUEPRINT]
// ============================================================================

import { performAction, stopPlayback, togglePlay, isLoopEnabled, newProject, openProjectFile } from './engine/actions'
import { setPlayhead, statusJson } from './engine/client'
import type { StatusJson } from './engine/wasmTypes'

export type CommandStatus = 'FUNCTIONAL' | 'DEFERRED' | 'UNAVAILABLE'
export type CommandCategory =
  | 'tools'
  | 'file'
  | 'edit'
  | 'view'
  | 'insert'
  | 'modify'
  | 'text'
  | 'commands'
  | 'control'
  | 'debug'
  | 'window'
  | 'help'
  | 'timeline'
  | 'app'

export interface EngineStatus {
  kind: 'ok' | 'error'
  detail: string
}

/** Everything a command may need. App builds the full context; panels build a
 *  partial one via `makeCommandContext` for their scoped shortcut handling. */
export interface CommandContext {
  engine: EngineStatus
  notify: (msg: string) => void
  setTool: (tool: string) => void
  togglePanel: (id: string) => void
  panels: Record<string, boolean>
  openExport: () => void
  openDocumentSettings: () => void
  openShortcuts: () => void
  openAbout: () => void
  openSymbolDialog: (mode: 'convert' | 'new') => void
  openPalette: () => void
  resetWorkspace: () => void
  /** Live engine status (injected so panels can serve their own view of it). */
  getStatus: () => StatusJson | null
}

export interface Command {
  id: string
  label: string
  category: CommandCategory
  shortcut?: string
  status: CommandStatus
  /** Human classification + blueprint/Adobe source (feeds the audit report). */
  source: string
  /** Static reason for DEFERRED/UNAVAILABLE items. */
  reason?: string
  /** Contextual availability (defaults to: always enabled). */
  enabled?: (ctx: CommandContext) => boolean
  /** Contextual reason shown when enabled() is false. */
  whyDisabled?: (ctx: CommandContext) => string
  /** Toggle check state (Window panels, loop, etc.). */
  checked?: (ctx: CommandContext) => boolean
  run: (ctx: CommandContext) => void
  /** Render this command in the floating toolbar (default false). */
  toolbar?: boolean
}

// ---------------------------------------------------------------------------
// View-controller registration (view-only state owned by Stage / TimelineStrip).
// Commands reach component-local view state through these single registries so
// the menu / toolbar / shortcut never re-implement a component's logic.
// ---------------------------------------------------------------------------
export interface StageViewController {
  zoomIn: () => void
  zoomOut: () => void
  zoom100: () => void
  zoomFit: () => void
}

export interface TimelineViewController {
  /** null when nothing is selected on the timeline. */
  selection: () => { layer: number; count: number; locked: boolean } | null
  hasClipboard: () => boolean
  copy: () => void
  cut: () => void
  paste: () => void
  remove: () => void
  reverse: () => void
  duplicate: () => void
  convert: () => void
  convertBlank: () => void
  loopEnabled: () => boolean
  toggleLoop: () => void
}

export const stageViewController: { current: StageViewController | null } = { current: null }
export const timelineViewController: { current: TimelineViewController | null } = { current: null }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function engineOk(ctx: CommandContext): boolean {
  return ctx.engine.kind === 'ok'
}
const NOT_ATTACHED = 'engine not attached — build with `npm run wasm`'

/** Keyframe hop helper shared by transport commands (Alt+./Alt+,). */
function hopKeyframe(ctx: CommandContext, dir: 1 | -1): void {
  const st = ctx.getStatus()
  if (!st) return
  const layer = st.layers?.[st.active_layer ?? 0]
  if (!layer) return
  const keys = layer.keyframes.map((k) => k.frame).sort((a, b) => a - b)
  const cur = st.playhead ?? 1
  const target = dir === 1 ? keys.find((k) => k > cur) : [...keys].reverse().find((k) => k < cur)
  if (target !== undefined) setPlayhead(target)
}

function frameCmd(ctx: CommandContext, action: string, lockedMsg: string): void {
  if (!engineOk(ctx)) {
    ctx.notify(`${action}: ${NOT_ATTACHED}`)
    return
  }
  const st = ctx.getStatus()
  const active = st?.layers?.[st.active_layer ?? 0]
  if (active?.locked) {
    ctx.notify(`${lockedMsg}`)
    return
  }
  performAction(action, ctx.notify)
}

// ---------------------------------------------------------------------------
// The registry
// ---------------------------------------------------------------------------
export const commands: Command[] = [
  // ——— Tools (Part 29 §29.1 / 34.1) ———
  {
    id: 'tool.select',
    label: 'Selection Tool',
    category: 'tools',
    shortcut: 'V',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.1',
    run: (c) => c.setTool('select'),
    toolbar: true,
  },
  {
    id: 'tool.rect',
    label: 'Rectangle Tool',
    category: 'tools',
    shortcut: 'R',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.1',
    run: (c) => c.setTool('rect'),
    toolbar: true,
  },
  {
    id: 'tool.transform',
    label: 'Free Transform Tool',
    category: 'tools',
    shortcut: 'Q',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.1',
    run: (c) => c.setTool('transform'),
    toolbar: true,
  },

  // ——— File (Part 01 §1.2.1 / C-03) ———
  {
    id: 'file.new',
    label: 'New…',
    category: 'file',
    shortcut: 'Ctrl+N',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.2.1',
    enabled: engineOk,
    whyDisabled: () => NOT_ATTACHED,
    run: (c) => newProject(c.notify),
  },
  {
    id: 'file.open',
    label: 'Open…',
    category: 'file',
    shortcut: 'Ctrl+O',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.2.1',
    enabled: engineOk,
    whyDisabled: () => NOT_ATTACHED,
    run: (c) => openProjectFile(c.notify),
  },
  {
    id: 'file.openRecent',
    label: 'Open Recent',
    category: 'file',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.2.1',
    reason: 'recent-file list is a future feature (P1)',
    run: () => {},
  },
  {
    id: 'file.newFromTemplate',
    label: 'New from Template…',
    category: 'file',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.2.1',
    reason: 'templates are a future feature',
    run: () => {},
  },
  {
    id: 'file.close',
    label: 'Close',
    category: 'file',
    shortcut: 'Ctrl+W',
    status: 'UNAVAILABLE',
    source: '[ADOBE REFERENCE] Part 01 §1.2.1',
    reason: 'web app — the browser tab manages documents',
    run: () => {},
  },
  {
    id: 'file.save',
    label: 'Save',
    category: 'file',
    shortcut: 'Ctrl+S',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.2.1',
    enabled: engineOk,
    whyDisabled: () => NOT_ATTACHED,
    run: (c) => performAction('file.save', c.notify),
    toolbar: true,
  },
  {
    id: 'file.saveAs',
    label: 'Save As…',
    category: 'file',
    shortcut: 'Ctrl+Shift+S',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.2.1',
    enabled: engineOk,
    whyDisabled: () => NOT_ATTACHED,
    // [OUR DESIGN DECISION] web build: Save / Save As both download the
    // project JSON (no native save-as dialog).
    run: (c) => performAction('file.save', c.notify),
  },
  {
    id: 'file.importStage',
    label: 'Import to Stage…',
    category: 'file',
    shortcut: 'Ctrl+R',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 27',
    reason: 'asset import is a future unit',
    run: () => {},
  },
  {
    id: 'file.importLibrary',
    label: 'Import to Library…',
    category: 'file',
    shortcut: 'Ctrl+I',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 27',
    reason: 'asset import is a future unit',
    run: () => {},
  },
  {
    id: 'file.export',
    label: 'Export Image…',
    category: 'file',
    shortcut: 'Ctrl+Shift+R',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 28 / C-31',
    run: (c) => c.openExport(),
    toolbar: true,
  },
  {
    id: 'file.exportVideo',
    label: 'Export Video…',
    category: 'file',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 28',
    reason: 'video export is a future unit',
    run: () => {},
  },
  {
    id: 'file.exportGif',
    label: 'Export Animated GIF…',
    category: 'file',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 28',
    reason: 'animated GIF export is a future unit',
    run: () => {},
  },
  {
    id: 'file.exportSequence',
    label: 'Export PNG Sequence…',
    category: 'file',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 28',
    reason: 'image-sequence export is a future unit',
    run: () => {},
  },
  {
    id: 'file.publishSettings',
    label: 'Publish Settings…',
    category: 'file',
    shortcut: 'Ctrl+Shift+F12',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 28',
    reason: 'publish pipeline is a future unit',
    run: () => {},
  },
  {
    id: 'file.publish',
    label: 'Publish',
    category: 'file',
    shortcut: 'Shift+Alt+F12',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 28',
    reason: 'publish pipeline is a future unit',
    run: () => {},
  },
  {
    id: 'file.print',
    label: 'Print…',
    category: 'file',
    shortcut: 'Ctrl+P',
    status: 'DEFERRED',
    source: '[ADOBE REFERENCE] Part 01 §1.2.1',
    reason: 'printing is a future feature',
    run: () => {},
  },
  {
    id: 'file.exit',
    label: 'Exit',
    category: 'file',
    shortcut: 'Ctrl+Q',
    status: 'UNAVAILABLE',
    source: '[ADOBE REFERENCE] Part 01 §1.2.1',
    reason: 'web app — close the browser tab',
    run: () => {},
  },

  // ——— Edit (Part 01 §1.2.2 / C-03) ———
  {
    id: 'edit.undo',
    label: 'Undo',
    category: 'edit',
    shortcut: 'Ctrl+Z',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.2',
    enabled: engineOk,
    whyDisabled: () => NOT_ATTACHED,
    run: (c) => performAction('edit.undo', c.notify),
    toolbar: true,
  },
  {
    id: 'edit.redo',
    label: 'Redo',
    category: 'edit',
    shortcut: 'Ctrl+Shift+Z',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.2',
    enabled: engineOk,
    whyDisabled: () => NOT_ATTACHED,
    run: (c) => performAction('edit.redo', c.notify),
    toolbar: true,
  },
  {
    id: 'edit.cut',
    label: 'Cut',
    category: 'edit',
    shortcut: 'Ctrl+X',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.2.2',
    reason: 'stage object clipboard is a future unit (frame clipboard works — Edit ▸ Timeline)',
    run: () => {},
  },
  {
    id: 'edit.copy',
    label: 'Copy',
    category: 'edit',
    shortcut: 'Ctrl+C',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.2.2',
    reason: 'stage object clipboard is a future unit (frame clipboard works — Edit ▸ Timeline)',
    run: () => {},
  },
  {
    id: 'edit.paste',
    label: 'Paste in Center',
    category: 'edit',
    shortcut: 'Ctrl+V',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.2',
    reason: 'stage object clipboard is a future unit',
    run: () => {},
  },
  {
    id: 'edit.pasteInPlace',
    label: 'Paste in Place',
    category: 'edit',
    shortcut: 'Ctrl+Shift+V',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.2',
    reason: 'stage object clipboard is a future unit',
    run: () => {},
  },
  {
    id: 'edit.duplicate',
    label: 'Duplicate',
    category: 'edit',
    shortcut: 'Ctrl+D',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.2',
    reason: 'stage duplicate is a future unit',
    run: () => {},
  },
  {
    id: 'edit.selectAll',
    label: 'Select All',
    category: 'edit',
    shortcut: 'Ctrl+A',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 03 §3.3.5',
    enabled: engineOk,
    whyDisabled: () => NOT_ATTACHED,
    run: (c) => performAction('edit.selectAll', c.notify),
  },
  {
    id: 'edit.deselectAll',
    label: 'Deselect All',
    category: 'edit',
    shortcut: 'Ctrl+Shift+A',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 03 §3.3.5',
    enabled: engineOk,
    whyDisabled: () => NOT_ATTACHED,
    run: (c) => performAction('edit.deselectAll', c.notify),
  },
  {
    id: 'edit.findReplace',
    label: 'Find and Replace…',
    category: 'edit',
    shortcut: 'Ctrl+F',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.2.2',
    reason: 'find & replace is a future unit',
    run: () => {},
  },
  // Edit ▸ Timeline (frame clipboard — wired to the timeline's live selection)
  {
    id: 'timeline.copy',
    label: 'Copy Frames',
    category: 'timeline',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 07 §7.4',
    enabled: () => timelineViewController.current?.selection() != null,
    whyDisabled: () => 'select frames in the timeline first',
    run: () => timelineViewController.current?.copy(),
  },
  {
    id: 'timeline.cut',
    label: 'Cut Frames',
    category: 'timeline',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 07 §7.4',
    enabled: () => {
      const s = timelineViewController.current?.selection()
      return s != null && !s.locked
    },
    whyDisabled: () => {
      const s = timelineViewController.current?.selection()
      return s == null ? 'select frames in the timeline first' : 'locked layer — unlock to edit frames'
    },
    run: () => timelineViewController.current?.cut(),
  },
  {
    id: 'timeline.paste',
    label: 'Paste Frames',
    category: 'timeline',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 07 §7.4',
    enabled: () => timelineViewController.current?.hasClipboard() === true,
    whyDisabled: () => 'timeline clipboard is empty',
    run: () => timelineViewController.current?.paste(),
  },
  {
    id: 'timeline.clear',
    label: 'Clear Keyframe',
    category: 'timeline',
    shortcut: 'Shift+F6',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.5',
    enabled: engineOk,
    whyDisabled: () => NOT_ATTACHED,
    run: (c) => frameCmd(c, 'timeline.clear', 'clear keyframe: locked layer — unlock to edit frames'),
  },
  {
    id: 'timeline.deleteframe',
    label: 'Delete Frame',
    category: 'timeline',
    shortcut: 'Shift+F5',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.5',
    enabled: engineOk,
    whyDisabled: () => NOT_ATTACHED,
    run: (c) => frameCmd(c, 'timeline.deleteframe', 'delete frame: locked layer — unlock to edit frames'),
  },
  {
    id: 'timeline.remove',
    label: 'Remove Frames',
    category: 'timeline',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 07 §7.4',
    enabled: () => {
      const s = timelineViewController.current?.selection()
      return s != null && !s.locked
    },
    whyDisabled: () => 'select frames in the timeline first (unlocked layer)',
    run: () => timelineViewController.current?.remove(),
  },
  {
    id: 'timeline.reverse',
    label: 'Reverse Frames',
    category: 'timeline',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 07 §7.4',
    enabled: () => {
      const s = timelineViewController.current?.selection()
      return s != null && !s.locked
    },
    whyDisabled: () => 'select frames in the timeline first (unlocked layer)',
    run: () => timelineViewController.current?.reverse(),
  },
  {
    id: 'timeline.duplicate',
    label: 'Duplicate Frames',
    category: 'timeline',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 07 §7.4',
    enabled: () => {
      const s = timelineViewController.current?.selection()
      return s != null && !s.locked
    },
    whyDisabled: () => 'select frames in the timeline first (unlocked layer)',
    run: () => timelineViewController.current?.duplicate(),
  },
  {
    id: 'timeline.convert',
    label: 'Convert to Keyframes',
    category: 'timeline',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 07 §7.4',
    enabled: () => {
      const s = timelineViewController.current?.selection()
      return s != null && !s.locked
    },
    whyDisabled: () => 'select frames in the timeline first (unlocked layer)',
    run: () => timelineViewController.current?.convert(),
  },
  {
    id: 'timeline.convertBlank',
    label: 'Convert to Blank Keyframes',
    category: 'timeline',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 07 §7.4',
    enabled: () => {
      const s = timelineViewController.current?.selection()
      return s != null && !s.locked
    },
    whyDisabled: () => 'select frames in the timeline first (unlocked layer)',
    run: () => timelineViewController.current?.convertBlank(),
  },
  {
    id: 'edit.preferences',
    label: 'Preferences…',
    category: 'edit',
    shortcut: 'Ctrl+U',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.2.2',
    reason: 'preferences editor is a future feature',
    run: () => {},
  },
  {
    id: 'help.shortcuts',
    label: 'Keyboard Shortcuts…',
    category: 'help',
    shortcut: 'Ctrl+Shift+Alt+K',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.12 / C-32',
    run: (c) => c.openShortcuts(),
  },

  // ——— View (Part 01 §1.2.3 / Part 29 §29.9) ———
  {
    id: 'view.zoomIn',
    label: 'Zoom In',
    category: 'view',
    shortcut: 'Ctrl+=',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.9',
    run: () => stageViewController.current?.zoomIn(),
  },
  {
    id: 'view.zoomOut',
    label: 'Zoom Out',
    category: 'view',
    shortcut: 'Ctrl+-',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.9',
    run: () => stageViewController.current?.zoomOut(),
  },
  {
    id: 'view.zoom100',
    label: '100%',
    category: 'view',
    shortcut: 'Ctrl+1',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.9',
    run: () => stageViewController.current?.zoom100(),
  },
  {
    id: 'view.zoomFit',
    label: 'Fit in Window',
    category: 'view',
    shortcut: 'Ctrl+0',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.9',
    run: () => stageViewController.current?.zoomFit(),
  },
  {
    id: 'view.rulers',
    label: 'Show Rulers',
    category: 'view',
    shortcut: 'Ctrl+Shift+Alt+R',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.4.4',
    reason: 'rulers are a future view feature',
    run: () => {},
  },
  {
    id: 'view.grid',
    label: 'Show Grid',
    category: 'view',
    shortcut: "Ctrl+'",
    status: 'DEFERRED',
    source: '[BLUEPRINT + ADOBE] Part 01 §1.4.4',
    reason: 'grid overlay is a future view feature',
    run: () => {},
  },
  {
    id: 'view.guides',
    label: 'Show Guides',
    category: 'view',
    shortcut: 'Ctrl+;',
    status: 'DEFERRED',
    source: '[BLUEPRINT + ADOBE] Part 01 §1.4.4',
    reason: 'guides are a future view feature',
    run: () => {},
  },
  {
    id: 'view.snapping',
    label: 'Snapping',
    category: 'view',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.4.4',
    reason: 'snapping engine is a future view feature',
    run: () => {},
  },
  {
    id: 'view.hideEdges',
    label: 'Hide Edges',
    category: 'view',
    shortcut: 'Ctrl+Shift+E',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.3',
    reason: 'selection-edge suppression is a future view feature',
    run: () => {},
  },
  {
    id: 'view.workArea',
    label: 'Show Work Area (Pasteboard)',
    category: 'view',
    shortcut: 'Ctrl+Shift+W',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.4.1',
    reason: 'pasteboard toggle is a future view feature',
    run: () => {},
  },
  {
    id: 'view.previewFull',
    label: 'Full Preview Mode',
    category: 'view',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.4.3',
    // The renderer draws only full mode today; the command honestly reports
    // the active mode rather than pretending to switch.
    checked: () => true,
    run: (c) => c.notify('preview mode: full (the only mode in this build)'),
  },
  {
    id: 'view.previewOutline',
    label: 'Outline Preview Mode',
    category: 'view',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.4.3',
    reason: 'outline rendering is a future renderer feature',
    run: () => {},
  },

  // ——— Insert (Part 01 §1.2.4) ———
  {
    id: 'timeline.insertframe',
    label: 'Frame',
    category: 'timeline',
    shortcut: 'F5',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.5',
    enabled: engineOk,
    whyDisabled: () => NOT_ATTACHED,
    run: (c) => frameCmd(c, 'timeline.insertframe', 'insert frame: locked layer — unlock to edit frames'),
  },
  {
    id: 'timeline.keyframe',
    label: 'Keyframe',
    category: 'timeline',
    shortcut: 'F6',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.5',
    enabled: engineOk,
    whyDisabled: () => NOT_ATTACHED,
    run: (c) => frameCmd(c, 'timeline.keyframe', 'keyframe: locked layer — unlock to edit frames'),
    toolbar: true,
  },
  {
    id: 'timeline.blank',
    label: 'Blank Keyframe',
    category: 'timeline',
    shortcut: 'F7',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.5',
    enabled: engineOk,
    whyDisabled: () => NOT_ATTACHED,
    run: (c) => frameCmd(c, 'timeline.blank', 'blank keyframe: locked layer — unlock to edit frames'),
  },
  {
    id: 'insert.newSymbol',
    label: 'New Symbol…',
    category: 'insert',
    shortcut: 'Ctrl+F8',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.8',
    run: (c) => c.openSymbolDialog('new'),
  },
  {
    id: 'insert.motionTween',
    label: 'Motion Tween',
    category: 'insert',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 09',
    reason: 'motion tween is the next animation unit',
    run: () => {},
  },
  {
    id: 'insert.classicTween',
    label: 'Classic Tween',
    category: 'insert',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 09',
    reason: 'create classic tweens from the timeline (~ Tween button on a 2-keyframe selection)',
    run: () => {},
  },
  {
    id: 'insert.shapeTween',
    label: 'Shape Tween',
    category: 'insert',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 09',
    reason: 'shape tween awaits the shape/merge model',
    run: () => {},
  },
  {
    id: 'insert.scene',
    label: 'Scene…',
    category: 'insert',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 25',
    reason: 'multi-scene is a future unit',
    run: () => {},
  },

  // ——— Modify (Part 01 §1.2.5) ———
  {
    id: 'modify.document',
    label: 'Document…',
    category: 'modify',
    shortcut: 'Ctrl+J',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.7',
    enabled: engineOk,
    whyDisabled: () => NOT_ATTACHED,
    run: (c) => c.openDocumentSettings(),
  },
  {
    id: 'modify.convertSymbol',
    label: 'Convert to Symbol…',
    category: 'modify',
    shortcut: 'F8',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 11 / 29 §29.8',
    run: (c) => c.openSymbolDialog('convert'),
  },
  {
    id: 'modify.breakApart',
    label: 'Break Apart',
    category: 'modify',
    shortcut: 'Ctrl+B',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.8',
    reason: 'break-apart is a future unit',
    run: () => {},
  },
  {
    id: 'modify.swapSymbol',
    label: 'Swap Symbol…',
    category: 'modify',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 11 §11.6',
    reason: 'swap a selected instance from the Properties panel',
    run: () => {},
  },
  {
    id: 'modify.duplicateSymbol',
    label: 'Duplicate Symbol…',
    category: 'modify',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 11 §11.6',
    reason: 'symbol duplication is a future unit',
    run: () => {},
  },
  {
    id: 'modify.bitmapTrace',
    label: 'Trace Bitmap…',
    category: 'modify',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 27',
    reason: 'bitmap tracing is a future unit',
    run: () => {},
  },
  {
    id: 'modify.shapeConvertLines',
    label: 'Convert Lines to Fills',
    category: 'modify',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 06',
    reason: 'shape operations await the shape/merge model',
    run: () => {},
  },
  {
    id: 'modify.shapeExpand',
    label: 'Expand Fill…',
    category: 'modify',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 06',
    reason: 'shape operations await the shape/merge model',
    run: () => {},
  },
  {
    id: 'modify.shapeSoften',
    label: 'Soften Fill Edges…',
    category: 'modify',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 06',
    reason: 'shape operations await the shape/merge model',
    run: () => {},
  },
  {
    id: 'modify.combineUnion',
    label: 'Union',
    category: 'modify',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 06 §6.5',
    reason: 'boolean ops await the shape/merge model',
    run: () => {},
  },
  {
    id: 'modify.combineIntersect',
    label: 'Intersect',
    category: 'modify',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 06 §6.5',
    reason: 'boolean ops await the shape/merge model',
    run: () => {},
  },
  {
    id: 'modify.combinePunch',
    label: 'Punch',
    category: 'modify',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 06 §6.5',
    reason: 'boolean ops await the shape/merge model',
    run: () => {},
  },
  {
    id: 'modify.combineCrop',
    label: 'Crop',
    category: 'modify',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 06 §6.5',
    reason: 'boolean ops await the shape/merge model',
    run: () => {},
  },
  {
    id: 'modify.freeTransform',
    label: 'Free Transform',
    category: 'modify',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 04',
    // [OUR DESIGN DECISION] no shortcut here: Q already switches the tool
    // (Part 29 §29.1); the menu item activates the same tool.
    run: (c) => c.setTool('transform'),
  },
  {
    id: 'modify.transformScale',
    label: 'Scale and Rotate…',
    category: 'modify',
    shortcut: 'Ctrl+Alt+S',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.4',
    reason: 'numeric transform dialog is a future unit',
    run: () => {},
  },
  {
    id: 'modify.transformRotate90cw',
    label: 'Rotate 90° CW',
    category: 'modify',
    shortcut: 'Ctrl+Shift+9',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.4',
    reason: 'numeric transform is a future unit',
    run: () => {},
  },
  {
    id: 'modify.transformRotate90ccw',
    label: 'Rotate 90° CCW',
    category: 'modify',
    shortcut: 'Ctrl+Shift+7',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.4',
    reason: 'numeric transform is a future unit',
    run: () => {},
  },
  {
    id: 'modify.transformFlipH',
    label: 'Flip Horizontal',
    category: 'modify',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 04',
    reason: 'numeric transform is a future unit',
    run: () => {},
  },
  {
    id: 'modify.transformFlipV',
    label: 'Flip Vertical',
    category: 'modify',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 04',
    reason: 'numeric transform is a future unit',
    run: () => {},
  },
  {
    id: 'modify.transformRemove',
    label: 'Remove Transform',
    category: 'modify',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 04',
    reason: 'transform flatten is a future unit',
    run: () => {},
  },
  {
    id: 'modify.arrangeFront',
    label: 'Bring to Front',
    category: 'modify',
    shortcut: 'Ctrl+Shift+↑',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 03',
    reason: 'z-order ops are a future unit',
    run: () => {},
  },
  {
    id: 'modify.arrangeForward',
    label: 'Bring Forward',
    category: 'modify',
    shortcut: 'Ctrl+↑',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 03',
    reason: 'z-order ops are a future unit',
    run: () => {},
  },
  {
    id: 'modify.arrangeBackward',
    label: 'Send Backward',
    category: 'modify',
    shortcut: 'Ctrl+↓',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 03',
    reason: 'z-order ops are a future unit',
    run: () => {},
  },
  {
    id: 'modify.arrangeBack',
    label: 'Send to Back',
    category: 'modify',
    shortcut: 'Ctrl+Shift+↓',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 03',
    reason: 'z-order ops are a future unit',
    run: () => {},
  },
  {
    id: 'modify.align',
    label: 'Align…',
    category: 'modify',
    // [OUR DESIGN DECISION] Ctrl+K is the command palette (C-04); the Align
    // panel is a future unit, so it claims no shortcut yet.
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 24',
    reason: 'align/distribute is a future unit',
    run: () => {},
  },
  {
    id: 'modify.group',
    label: 'Group',
    category: 'modify',
    shortcut: 'Ctrl+G',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 03 §3.4',
    reason: 'grouping is a future unit',
    run: () => {},
  },
  {
    id: 'modify.ungroup',
    label: 'Ungroup',
    category: 'modify',
    shortcut: 'Ctrl+Shift+G',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 03 §3.4',
    reason: 'grouping is a future unit',
    run: () => {},
  },

  // ——— Text (Part 01 §1.2.6 / Part 22) — all deferred (no text engine) ———
  {
    id: 'text.font',
    label: 'Font…',
    category: 'text',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 22',
    reason: 'text engine is a future unit',
    run: () => {},
  },
  {
    id: 'text.size',
    label: 'Size…',
    category: 'text',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 22',
    reason: 'text engine is a future unit',
    run: () => {},
  },
  {
    id: 'text.styleBold',
    label: 'Bold',
    category: 'text',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 22',
    reason: 'text engine is a future unit',
    run: () => {},
  },
  {
    id: 'text.styleItalic',
    label: 'Italic',
    category: 'text',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 22',
    reason: 'text engine is a future unit',
    run: () => {},
  },
  {
    id: 'text.alignLeft',
    label: 'Align Left',
    category: 'text',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 22',
    reason: 'text engine is a future unit',
    run: () => {},
  },
  {
    id: 'text.alignCenter',
    label: 'Align Center',
    category: 'text',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 22',
    reason: 'text engine is a future unit',
    run: () => {},
  },
  {
    id: 'text.alignRight',
    label: 'Align Right',
    category: 'text',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 22',
    reason: 'text engine is a future unit',
    run: () => {},
  },
  {
    id: 'text.alignJustify',
    label: 'Justify',
    category: 'text',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 22',
    reason: 'text engine is a future unit',
    run: () => {},
  },
  {
    id: 'text.letterSpacing',
    label: 'Letter Spacing…',
    category: 'text',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 22',
    reason: 'text engine is a future unit',
    run: () => {},
  },
  {
    id: 'text.lineSpacing',
    label: 'Line Spacing…',
    category: 'text',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 22',
    reason: 'text engine is a future unit',
    run: () => {},
  },
  {
    id: 'text.embedFonts',
    label: 'Embed Fonts…',
    category: 'text',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 22',
    reason: 'text engine is a future unit',
    run: () => {},
  },

  // ——— Commands (Part 01 §1.2.7) — all deferred (no scripting/macro layer) ———
  {
    id: 'commands.runSaved',
    label: 'Manage Saved Commands…',
    category: 'commands',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.2.7',
    reason: 'macro/command recording is a future (P2) feature',
    run: () => {},
  },
  {
    id: 'commands.copyMotion',
    label: 'Copy Motion as JSON',
    category: 'commands',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 09',
    reason: 'motion presets are a future feature',
    run: () => {},
  },
  {
    id: 'commands.exportMotion',
    label: 'Export Motion JSON…',
    category: 'commands',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 09',
    reason: 'motion presets are a future feature',
    run: () => {},
  },
  {
    id: 'commands.importMotion',
    label: 'Import Motion JSON…',
    category: 'commands',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 09',
    reason: 'motion presets are a future feature',
    run: () => {},
  },
  {
    id: 'commands.runScript',
    label: 'Run Script…',
    category: 'commands',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] WISH W13',
    reason: 'plugin/script API is a future (P2) feature',
    run: () => {},
  },

  // ——— Control (Part 01 §1.2.8 / Adobe-verified) ———
  {
    id: 'timeline.play',
    label: 'Play',
    category: 'control',
    shortcut: 'Enter',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT + ADOBE] Part 01 §1.2.8',
    enabled: engineOk,
    whyDisabled: () => NOT_ATTACHED,
    run: (c) => togglePlay(c.notify),
    toolbar: true,
  },
  {
    id: 'control.stop',
    label: 'Stop',
    category: 'control',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT + ADOBE] Part 01 §1.2.8',
    enabled: engineOk,
    whyDisabled: () => NOT_ATTACHED,
    run: (c) => {
      stopPlayback()
      c.notify('play: stopped')
    },
  },
  {
    id: 'control.rewind',
    label: 'Rewind',
    category: 'control',
    shortcut: 'Ctrl+Alt+R',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT + ADOBE] Part 01 §1.2.8',
    enabled: engineOk,
    whyDisabled: () => NOT_ATTACHED,
    run: () => setPlayhead(1),
  },
  {
    id: 'control.firstFrame',
    label: 'Go to First Frame',
    category: 'control',
    shortcut: 'Home',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT + ADOBE] Part 29 §29.6',
    enabled: engineOk,
    whyDisabled: () => NOT_ATTACHED,
    run: () => setPlayhead(1),
  },
  {
    id: 'control.lastFrame',
    label: 'Go to Last Frame',
    category: 'control',
    shortcut: 'End',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT + ADOBE] Part 29 §29.6',
    enabled: engineOk,
    whyDisabled: () => NOT_ATTACHED,
    run: (c) => setPlayhead(Math.max(1, c.getStatus()?.duration ?? 1)),
  },
  {
    id: 'control.stepForward',
    label: 'Step Forward One Frame',
    category: 'control',
    shortcut: '.',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT + ADOBE] Part 29 §29.6',
    enabled: engineOk,
    whyDisabled: () => NOT_ATTACHED,
    run: (c) => setPlayhead((c.getStatus()?.playhead ?? 0) + 1),
  },
  {
    id: 'control.stepBackward',
    label: 'Step Backward One Frame',
    category: 'control',
    shortcut: ',',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT + ADOBE] Part 29 §29.6',
    enabled: engineOk,
    whyDisabled: () => NOT_ATTACHED,
    run: (c) => setPlayhead(Math.max(1, (c.getStatus()?.playhead ?? 1) - 1)),
  },
  {
    id: 'control.nextKeyframe',
    label: 'Next Keyframe',
    category: 'control',
    shortcut: 'Alt+.',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.6',
    enabled: engineOk,
    whyDisabled: () => NOT_ATTACHED,
    run: (c) => hopKeyframe(c, 1),
  },
  {
    id: 'control.prevKeyframe',
    label: 'Previous Keyframe',
    category: 'control',
    shortcut: 'Alt+,',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.6',
    enabled: engineOk,
    whyDisabled: () => NOT_ATTACHED,
    run: (c) => hopKeyframe(c, -1),
  },
  {
    id: 'control.loop',
    label: 'Loop Playback',
    category: 'control',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 07 §7.1.5',
    checked: () => timelineViewController.current?.loopEnabled() ?? isLoopEnabled(),
    run: () => timelineViewController.current?.toggleLoop(),
  },
  {
    id: 'control.mute',
    label: 'Mute Sounds',
    category: 'control',
    shortcut: 'Ctrl+Alt+M',
    status: 'DEFERRED',
    source: '[ADOBE REFERENCE] Part 01 §1.2.8',
    reason: 'audio is a future unit',
    run: () => {},
  },
  {
    id: 'control.test',
    label: 'Test Movie',
    category: 'control',
    shortcut: 'Ctrl+Enter',
    status: 'DEFERRED',
    source: '[BLUEPRINT + ADOBE] Part 01 §1.2.8',
    reason: 'test player is a future unit',
    run: () => {},
  },

  // ——— Debug (Part 01 §1.2.9) ———
  {
    id: 'panel.debug',
    label: 'Developer Panel',
    category: 'debug',
    status: 'FUNCTIONAL',
    source: '[OUR DESIGN DECISION] Part 01 §1.2.9 (inspector, not AS3 debugger)',
    checked: (c) => !!c.panels.debug,
    run: (c) => c.togglePanel('debug'),
    toolbar: true,
  },
  {
    id: 'debug.as3',
    label: 'ActionScript Debugger (legacy)',
    category: 'debug',
    status: 'UNAVAILABLE',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.2.9 (historical only)',
    reason: 'legacy ActionScript debugging is not applicable to this engine',
    run: () => {},
  },

  // ——— Window (Part 01 §1.2.10 / Adobe-verified) ———
  {
    id: 'panel.layers',
    label: 'Layers',
    category: 'window',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] C-02',
    checked: (c) => !!c.panels.layers,
    run: (c) => c.togglePanel('layers'),
    toolbar: true,
  },
  {
    id: 'panel.properties',
    label: 'Properties',
    category: 'window',
    shortcut: 'Ctrl+F3',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT + ADOBE] C-09 (Ctrl+F3 Adobe-verified)',
    checked: (c) => !!c.panels.properties,
    run: (c) => c.togglePanel('properties'),
    toolbar: true,
  },
  {
    id: 'panel.library',
    label: 'Library',
    category: 'window',
    shortcut: 'Ctrl+L',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.9',
    checked: (c) => !!c.panels.library,
    run: (c) => c.togglePanel('library'),
    toolbar: true,
  },
  {
    id: 'panel.timeline',
    label: 'Timeline',
    category: 'window',
    shortcut: 'Ctrl+Alt+T',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.9 ([ours] Ctrl+Alt+T)',
    checked: (c) => !!c.panels.timeline,
    run: (c) => c.togglePanel('timeline'),
    toolbar: true,
  },
  {
    id: 'panel.tools',
    label: 'Tools',
    category: 'window',
    shortcut: 'Ctrl+F2',
    status: 'FUNCTIONAL',
    source: '[ADOBE REFERENCE] Window ▸ Tools (Ctrl+F2)',
    checked: (c) => !!c.panels.tools,
    run: (c) => c.togglePanel('tools'),
  },
  {
    id: 'window.resetWorkspace',
    label: 'Reset Workspace',
    category: 'window',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] C-02 / C-06 §D',
    run: (c) => c.resetWorkspace(),
  },
  {
    id: 'window.workspacePresets',
    label: 'Workspace Presets…',
    category: 'window',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.1.2',
    reason: 'saved workspace presets are a future feature',
    run: () => {},
  },

  // ——— Help (Part 01 §1.2.11) ———
  {
    id: 'help.about',
    label: 'About Kineora Animation',
    category: 'help',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.2.11',
    run: (c) => c.openAbout(),
  },
  {
    id: 'help.docs',
    label: 'Documentation…',
    category: 'help',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.2.11',
    reason: 'local documentation site is a future feature',
    run: () => {},
  },
  {
    id: 'help.troubleshoot',
    label: 'Troubleshooting…',
    category: 'help',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.2.11',
    reason: 'troubleshooting guide is a future feature',
    run: () => {},
  },

  // ——— App (palette) ———
  {
    id: 'palette.open',
    label: 'Search Commands…',
    category: 'app',
    shortcut: 'Ctrl+K',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] C-04',
    run: (c) => c.openPalette(),
  },
]

// ---------------------------------------------------------------------------
// Lookup + validation (build/test-time integrity, no dead buttons)
// ---------------------------------------------------------------------------
const byId = new Map<string, Command>(commands.map((c) => [c.id, c]))

export function getCommand(id: string): Command | undefined {
  return byId.get(id)
}

export function findCommand(id: string): Command | undefined {
  return byId.get(id)
}

export function allCommands(): Command[] {
  return commands
}

export interface RegistryError {
  id: string
  error: string
}

/**
 * Integrity rules:
 *  - unique ids
 *  - FUNCTIONAL commands MUST have a run and may not be unbound
 *  - DEFERRED/UNAVAILABLE commands MUST carry a human reason (never a silent
 *    grey box)
 *  - shortcut collisions (two commands bound to the same key) are rejected
 */
export function validateCommands(list: Command[] = commands): string[] {
  const errors: string[] = []
  const seen = new Set<string>()
  const shortcutOwners = new Map<string, string>()
  for (const c of list) {
    if (seen.has(c.id)) errors.push(`duplicate command id: ${c.id}`)
    seen.add(c.id)
    if (!c.label || c.label.trim() === '') errors.push(`missing label: ${c.id}`)
    if (c.status === 'FUNCTIONAL' && typeof c.run !== 'function') {
      errors.push(`FUNCTIONAL command has no run: ${c.id}`)
    }
    if (c.status !== 'FUNCTIONAL' && !c.reason) {
      errors.push(`deferred/unavailable command needs a reason: ${c.id}`)
    }
    if (c.shortcut) {
      const canon = shortcutToCanonical(c.shortcut)
      const owner = shortcutOwners.get(canon)
      if (owner !== undefined && owner !== c.id) {
        errors.push(`shortcut conflict: ${c.shortcut} bound to both ${owner} and ${c.id}`)
      }
      shortcutOwners.set(canon, c.id)
    }
  }
  return errors
}

// ---------------------------------------------------------------------------
// Shortcut canonicalization (shared with the shortcut dispatcher)
// ---------------------------------------------------------------------------
export type ShortcutParts = { ctrl: boolean; alt: boolean; shift: boolean; key: string }

/** Canonical form: "ctrl+alt+shift+key" with a lowercased, single key. */
export function shortcutToCanonical(display: string): string {
  const parts = display.split('+').map((p) => p.trim())
  let ctrl = false
  let alt = false
  let shift = false
  let key = ''
  for (const p of parts) {
    const low = p.toLowerCase()
    if (low === 'ctrl' || low === 'cmd' || low === 'control' || low === 'command') ctrl = true
    else if (low === 'alt' || low === 'option') alt = true
    else if (low === 'shift') shift = true
    else key = keySingle(low)
  }
  if (key === '=') shift = false // Ctrl+= and Ctrl+Shift+= are the same physical gesture
  return [ctrl ? 'ctrl' : '', alt ? 'alt' : '', shift ? 'shift' : '', key].filter(Boolean).join('+')
}

/** Normalize a single key token (arrow glyphs, symbols stay; letters lowercase). */
function keySingle(k: string): string {
  if (k === '+' || k === '=') return '='
  if (k === '↑') return 'arrowup'
  if (k === '↓') return 'arrowdown'
  if (k === '←') return 'arrowleft'
  if (k === '→') return 'arrowright'
  return k.toLowerCase()
}

/** Normalize a KeyboardEvent into the canonical shortcut form. */
export function eventToCanonical(e: {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
}): string {
  let key = e.key
  if (key.length === 1) key = keySingle(key)
  else key = key.toLowerCase()
  if (key === '=') {
    // treat both '=' and '+' as the same zoom key
  }
  const ctrl = e.ctrlKey || e.metaKey
  const alt = !!e.altKey
  const shift = !!e.shiftKey && key !== '='
  return [ctrl ? 'ctrl' : '', alt ? 'alt' : '', shift ? 'shift' : '', key].filter(Boolean).join('+')
}

/** Extra key bindings that target an existing command (e.g. Ctrl+Y = Redo).
 *  Kept out of the registry so the palette/shortcut viewer list one entry. */
const shortcutAliases: Record<string, string> = {
  'ctrl+y': 'edit.redo',
}

/** Find the command bound to a keyboard event (or null). */
export function findCommandByEvent(e: {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
}): Command | undefined {
  const canon = eventToCanonical(e)
  const cmd = commands.find((c) => c.shortcut && shortcutToCanonical(c.shortcut) === canon)
  if (cmd) return cmd
  const alias = shortcutAliases[canon]
  return alias ? byId.get(alias) : undefined
}

// ---------------------------------------------------------------------------
// Context factory (panels build a partial context for their scoped shortcuts)
// ---------------------------------------------------------------------------
export function makeCommandContext(partial: Partial<CommandContext> & Pick<CommandContext, 'notify'>): CommandContext {
  return {
    engine: { kind: 'error', detail: 'not provided' },
    setTool: () => {},
    togglePanel: () => {},
    panels: {},
    openExport: () => {},
    openDocumentSettings: () => {},
    openShortcuts: () => {},
    openAbout: () => {},
    openSymbolDialog: () => {},
    openPalette: () => {},
    resetWorkspace: () => {},
    getStatus: () => statusJson(),
    ...partial,
  }
}
