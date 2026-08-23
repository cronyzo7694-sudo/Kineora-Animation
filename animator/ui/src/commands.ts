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

import {
  performAction,
  stopPlayback,
  togglePlay,
  isLoopEnabled,
  seekPlayhead,
  playbackState,
} from './engine/actions'
import {
  alignSelection,
  arrangeSelection,
  copyObjects,
  createScene,
  cutObjects,
  deleteSelection,
  duplicateObjects,
  flipSelection,
  pasteObjects,
  removeTransform,
  rotateSelection,
  setClassicTween,
  statusJson,
} from './engine/client'
import { loadViewPrefs, setPreviewMode, toggleViewFlag } from './viewPrefs'
import { formatAutosaveInterval, loadAutosavePrefs, toggleAutosaveEnabled } from './autosavePrefs'
import { deleteInkIds, inkCanRedo, inkCanUndo, selectedInkIds } from './editor/inkStore'
import { loadOnionPrefs, toggleOnion, toggleOnionOutlines } from './onionPrefs'
import {
  closeActiveDocument,
  closeAllDocuments,
  closeDocumentById,
  createDocument,
  createFromTemplate,
  exportHandoff,
  importHandoff,
  openDocument,
  openExternalLibrary,
  openFromRecent,
  findDocByPath,
  type RecentEntry,
  publishHandoff,
  saveDocument,
  saveTemplate,
  switchActiveDocument,
  type CloseAllDecision,
  type NewDocSettings,
} from './file'
// SYS-27 MOD-EXPORT engines (slice 1 — INT-AID-003)
import { publishHtml5 } from './export27'
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
  openPreferences: () => void
  openShortcuts: () => void
  openAbout: () => void
  openSymbolDialog: (mode: 'convert' | 'new') => void
  openPalette: () => void
  resetWorkspace: () => void
  /** Live engine status (injected so panels can serve their own view of it). */
  getStatus: () => StatusJson | null
  // ——— SYS-01 workspace / navigation ———
  collapsed: Record<string, boolean>
  toggleCollapse: (id: string) => void
  activeWorkspace: () => string
  listWorkspaces: () => string[]
  saveWorkspace: (name: string) => void
  loadWorkspace: (name: string) => void
  /** Symbol edit depth (0 = document root; SYS-19 drives this). */
  editDepth: () => number
  exitEditOne: () => void
  exitEditRoot: () => void
  openGoToFrame: () => void
  /** SYS-12: open the local Help dialog ('docs' or 'troubleshoot'). */
  openHelp: (section: 'docs' | 'troubleshoot') => void
  /** SYS-03 H03: open Find & Replace dialog. */
  openFindReplace: () => void
  /** SYS-11: set the visibility of ALL panels at once (F4 Hide/Show All).
   *  `false` hides every panel (chrome-only stage); `true` restores them. */
  setAllPanelsVisible: (visible: boolean) => void
  // ——— SYS-02 File ———
  /** Canonical unsaved-changes guard: run `proceed` now (clean) or after the
   *  Close-Confirmation Save/Discard resolves (dirty). Cancel → not run.
   *  scope 'active' = guard the ACTIVE document (Close/Open); 'all' = guard
   *  every dirty document (Close All / Exit); a NUMBER = guard that specific
   *  document by stable id (H02 per-tab close of a non-active document). */
  confirmClose: (proceed: () => void, scope?: 'active' | 'all' | number) => void
  /** H07 §6 — per-document guard for the SEQUENTIAL Close All (H07 opens the
   *  dialog; H04 owns the decision contract). Resolves 'save-ok' only after a
   *  successful H05 save; 'discard' = permanent; 'cancel' = stop the sequence.
   *  While the dialog is open (incl. save retry) the sequence is paused. */
  confirmCloseDoc: (docId: number) => Promise<CloseAllDecision>
  openNewDialog: () => void
  openTemplateGallery: () => void
  openSaveTemplate: () => void
  /** File ▸ Exit — application-level exit (dirty-guarded by the command). */
  exitApp: () => void
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
  run: (ctx: CommandContext, input?: unknown) => void
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
  /** Insert ▸ Classic Tween — create a span from the current timeline selection. */
  createClassicTween: () => void
}

export const stageViewController: { current: StageViewController | null } = { current: null }
export const timelineViewController: { current: TimelineViewController | null } = { current: null }

/**
 * SYS-10 view-controller: the Developer panel registers so Debug-menu
 * commands (Clear / Copy output) can reach the Output console without the
 * command registry importing React/panel internals (FL-0009).
 */
export interface DebugViewController {
  clearOutput: () => void
  outputText: () => string
}
export const debugViewController: { current: DebugViewController | null } = { current: null }

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
  if (target !== undefined) seekPlayhead(target)
}

/** SYS-01 §15 locked commandIds: `panel.show(id)` / `panel.hide(id)`.
 *  Window-menu rows and F4/Ctrl+L/Ctrl+Alt+T/Ctrl+F2 are THIS action with
 *  a panel-id input — not per-panel commandIds (INV-CMD-4 / INTEGRATED_AUDIT C-3). */
export const WINDOW_PANEL_IDS = ['tools', 'timeline', 'layers', 'properties', 'library'] as const
export type WindowPanelId = (typeof WINDOW_PANEL_IDS)[number]

function asPanelId(input: unknown): string | null {
  return typeof input === 'string' && input.trim() !== '' ? input : null
}

function setPanelVisible(c: CommandContext, id: string, visible: boolean): void {
  if (!!c.panels[id] === visible) return // already-in-state: idempotent (FL silent-ok)
  c.togglePanel(id)
}

/** Window-menu / shortcut / toolbar toggle — dispatches show or hide. */
export function runPanelToggle(c: CommandContext, id: string): void {
  setPanelVisible(c, id, !c.panels[id])
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
    // Blueprint T2B.5 — Oval tool: drag a bounding box (Shift = circle,
    // Alt/Option = from center); draws with the current Fill + Stroke colors.
    id: 'tool.oval',
    label: 'Oval Tool',
    category: 'tools',
    shortcut: 'O',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 02b T2B.5 / Part 29 §29.1',
    run: (c) => c.setTool('oval'),
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
  {
    // Adobe: "In the Tools panel, select the Hand tool and drag the Stage…
    // To temporarily switch between another tool and the Hand tool, hold down
    // the Spacebar" (helpx — Use the Stage and Tools panel for Animate).
    id: 'tool.hand',
    label: 'Hand Tool',
    category: 'tools',
    shortcut: 'H',
    status: 'FUNCTIONAL',
    source: '[ADOBE-DERIVED] Stage & Tools panel — view tools',
    run: (c) => c.setTool('hand'),
    toolbar: true,
  },
  {
    // Adobe (helpx — Strokes, fills and gradients): "The Paint Bucket tool
    // fills enclosed areas with color… change the color of already painted
    // areas." Uses the Tools-panel Fill Color.
    id: 'tool.paintBucket',
    label: 'Paint Bucket Tool',
    category: 'tools',
    shortcut: 'K',
    status: 'FUNCTIONAL',
    source: '[ADOBE-DERIVED] Strokes, fills, and gradients with Animate',
    run: (c) => c.setTool('bucket'),
    toolbar: true,
  },
  {
    // Adobe: "To change the stroke color, width, and style of one or more lines
    // or shape outlines, use the Ink Bottle tool."
    id: 'tool.inkBottle',
    label: 'Ink Bottle Tool',
    category: 'tools',
    shortcut: 'S',
    status: 'FUNCTIONAL',
    source: '[ADOBE-DERIVED] Strokes, fills, and gradients with Animate',
    run: (c) => c.setTool('ink'),
    toolbar: true,
  },
  {
    // Adobe: "Use the Eyedropper tool to copy fill and stroke attributes from
    // one object and immediately apply them to another object… When you click a
    // filled area, the tool automatically changes to the Paint Bucket tool."
    id: 'tool.eyedropper',
    label: 'Eyedropper Tool',
    category: 'tools',
    shortcut: 'I',
    status: 'FUNCTIONAL',
    source: '[ADOBE-DERIVED] Strokes, fills, and gradients with Animate',
    run: (c) => c.setTool('eyedropper'),
    toolbar: true,
  },
  {
    // Adobe: "select the Zoom tool and click the element… Alt-click to zoom
    // out… To zoom in so that a specific area fills the window, drag a
    // rectangular selection on the Stage with the Zoom tool."
    id: 'tool.zoom',
    label: 'Zoom Tool',
    category: 'tools',
    shortcut: 'Z',
    status: 'FUNCTIONAL',
    source: '[ADOBE-DERIVED] Stage & Tools panel — view tools',
    run: (c) => c.setTool('zoom'),
    toolbar: true,
  },
  {
    id: 'tool.pen',
    label: 'Pen Tool',
    category: 'tools',
    shortcut: 'P',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.1 — click anchors, Enter/double-click finish, Esc cancel',
    run: (c) => c.setTool('pen'),
    toolbar: true,
  },
  {
    id: 'tool.pencil',
    label: 'Pencil Tool',
    category: 'tools',
    shortcut: 'Y',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.1 — freehand stroke',
    run: (c) => c.setTool('pencil'),
    toolbar: true,
  },
  {
    id: 'tool.brush',
    label: 'Brush Tool',
    category: 'tools',
    shortcut: 'B',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.1 — freehand thick stroke',
    run: (c) => c.setTool('brush'),
    toolbar: true,
  },
  {
    id: 'tool.eraser',
    label: 'Eraser Tool',
    category: 'tools',
    shortcut: 'E',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.1 — erase objects under the stroke',
    run: (c) => c.setTool('eraser'),
    toolbar: true,
  },
  {
    id: 'tool.line',
    label: 'Line Tool',
    category: 'tools',
    shortcut: 'N',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.1 — two-point stroke, Shift constrains',
    run: (c) => c.setTool('line'),
    toolbar: true,
  },
  {
    id: 'tool.text',
    label: 'Text Tool',
    category: 'tools',
    shortcut: 'T',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 22 / 29 — click to place text',
    run: (c) => c.setTool('text'),
    toolbar: true,
  },
  {
    id: 'tool.lasso',
    label: 'Lasso Tool',
    category: 'tools',
    shortcut: 'L',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 03 — freeform selection',
    run: (c) => c.setTool('lasso'),
    toolbar: true,
  },
  {
    id: 'tool.subselect',
    label: 'Subselection Tool',
    category: 'tools',
    shortcut: 'A',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.1 — drag path anchors',
    run: (c) => c.setTool('subselect'),
    toolbar: true,
  },

  // ——— File (SYS-02 §6.1/§7: 10 REQUIRED + 8 HANDOFF; AIR/Print/Page-Setup = HIDDEN) ———
  {
    id: 'file.new',
    label: 'New…',
    category: 'file',
    shortcut: 'Ctrl+N',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.2.1 (H00 T1: New → ACTIVE(UNTITLED, CLEAN))',
    enabled: engineOk,
    whyDisabled: () => NOT_ATTACHED,
    // input = NewDocSettings → create the document (single commandId, INV-CMD-3);
    // no input (menu/shortcut/palette) → open the New dialog, whose Create
    // button re-invokes THIS command with the settings.
    run: (c, input) => {
      if (input && typeof input === 'object') {
        createDocument(input as NewDocSettings, c.notify)
      } else {
        c.openNewDialog()
      }
    },
  },
  {
    id: 'file.newFromTemplate',
    label: 'New from Template…',
    category: 'file',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.2.1 (template = preset JSON seed)',
    enabled: engineOk,
    whyDisabled: () => NOT_ATTACHED,
    // input = template name → seed a NEW independent document; no input → gallery.
    run: (c, input) => {
      if (typeof input === 'string' && input) {
        createFromTemplate(input, c.notify)
      } else {
        c.openTemplateGallery()
      }
    },
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
    // H06 §8: ONE canonical commandId for Open AND Open Recent (no drift).
    // input = a recent entry (object, from the Open Recent submenu) or none
    // (interactive native picker).
    run: (c, input) => {
      const entry = input && typeof input === 'object' ? (input as RecentEntry) : null
      if (entry) {
        // H06 §6 step 1 — BEFORE the guard: an already-open path activates
        // the existing document (D-AMB-001) — NO guard, NO load, NO open-set
        // change, `activeDoc:changed` only.
        const existing = entry.path ? findDocByPath(entry.path) : undefined
        if (existing !== undefined) {
          switchActiveDocument(existing, c.notify)
          c.notify(`already open — activated "${entry.title}"`)
          return
        }
        // FINAL RECONCILIATION F-4 / FL-0032: NO dirty guard on Open —
        // multi-document Open ADDS + activates; a dirty active doc is
        // preserved as INACTIVE (no data loss → no guard, FL-0032).
        void openFromRecent(entry, c.notify)
        return
      }
      // Same rule for interactive Open (guard-trigger set = Close / Close All
      // / Exit ONLY — final reconciliation §4 F-4).
      openDocument(c.notify)
    },
  },
  {
    id: 'file.openExternalLibrary',
    label: 'Open from Libraries…',
    category: 'file',
    shortcut: 'Ctrl+Shift+O',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.2.1 / Part 12 §12.2.14 — read-only external library',
    enabled: engineOk,
    whyDisabled: () => NOT_ATTACHED,
    run: (c) => {
      if (!c.panels.library) c.togglePanel('library')
      openExternalLibrary(c.notify)
    },
  },
  {
    id: 'file.close',
    label: 'Close',
    category: 'file',
    shortcut: 'Ctrl+W',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.2.1 (prompt save)',
    enabled: (c) => (c.getStatus()?.doc_id ?? 0) !== 0,
    whyDisabled: () => 'no document open',
    run: (c) => c.confirmClose(() => closeActiveDocument(c.notify)),
  },
  {
    id: 'file.closeAll',
    label: 'Close All',
    category: 'file',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.2.1 (prompt save) + H07 §6 sequential per-doc guard (P-5)',
    enabled: (c) => (c.getStatus()?.doc_count ?? 0) > 0,
    whyDisabled: () => 'no documents open',
    // H07 §6 / final reconciliation F-3: SEQUENTIAL (P-5), NOT atomic, NOT a
    // single summary dialog — clean docs close directly, each dirty doc gets
    // its own guard; Cancel stops the REMAINING docs (partial close is legal).
    run: (c) => {
      void closeAllDocuments(c.notify, (docId) => c.confirmCloseDoc(docId))
    },
  },
  // ——— H02 document tabs (SYS-02 owns the open-set; the SYS-01 strip is the
  // view that invokes these canonical commands — one id per control, no
  // duplicate aliases; the tab × NEVER infers its target from the active
  // pointer: input = the clicked document's stable id). ———
  {
    id: 'tab.activate',
    label: 'Activate Document Tab',
    category: 'app',
    status: 'FUNCTIONAL',
    source: '[H02 §12] app.tab.activate → activateDocument (VIEW/SESSION — no document mutation, no undo)',
    enabled: (c) => (c.getStatus()?.doc_count ?? 0) > 0,
    whyDisabled: () => 'no document open',
    // input = docId (the tab strip always passes the clicked/focused tab's
    // stable id); no input → the already-active document (idempotent no-op).
    run: (c, input) => {
      const id = typeof input === 'number' && input > 0 ? input : (c.getStatus()?.doc_id ?? 0)
      switchActiveDocument(id, c.notify)
    },
  },
  {
    id: 'tab.close',
    label: 'Close Document Tab',
    category: 'app',
    status: 'FUNCTIONAL',
    source: '[H02 §12] app.tab.close → H07 guard → H02 open-set/active update (target = stable doc id)',
    enabled: (c) => (c.getStatus()?.doc_count ?? 0) > 0,
    whyDisabled: () => 'no document open',
    // input = the clicked tab's docId. The canonical dirty guard (H07
    // boundary — App's confirmClose) decides Save/Discard/Cancel; H02 then
    // updates the open-set + active pointer with the §14 event ordering.
    run: (c, input) => {
      const id = typeof input === 'number' && input > 0 ? input : (c.getStatus()?.doc_id ?? 0)
      c.confirmClose(() => closeDocumentById(id, c.notify), id)
    },
  },
  {
    id: 'file.save',
    label: 'Save',
    category: 'file',
    shortcut: 'Ctrl+S',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.2.1 (untitled → prompt; overwrite P-1)',
    enabled: (c) => engineOk(c) && (c.getStatus()?.doc_id ?? 0) !== 0,
    whyDisabled: (c) => (engineOk(c) ? 'no document open' : NOT_ATTACHED),
    run: (c) => void saveDocument(c.notify),
    toolbar: true,
  },
  {
    id: 'file.saveAs',
    label: 'Save As…',
    category: 'file',
    shortcut: 'Ctrl+Shift+S',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.2.1',
    enabled: (c) => engineOk(c) && (c.getStatus()?.doc_id ?? 0) !== 0,
    whyDisabled: (c) => (engineOk(c) ? 'no document open' : NOT_ATTACHED),
    run: (c) => void saveDocument(c.notify, { saveAs: true }),
  },
  {
    id: 'file.autoSave',
    label: 'Auto-Save',
    category: 'file',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT + ADOBE] Auto-save interval / crash recovery slot (W11) — never overwrites last manual save',
    checked: () => loadAutosavePrefs().enabled,
    run: (c) => {
      const next = toggleAutosaveEnabled()
      c.notify(next.enabled ? `auto-save: on (${formatAutosaveInterval(next.intervalSec)})` : 'auto-save: off')
    },
  },
  {
    id: 'file.saveAsTemplate',
    label: 'Save as Template…',
    category: 'file',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.2.1 (preset-JSON template; NON-DOCUMENT write)',
    enabled: (c) => engineOk(c) && (c.getStatus()?.doc_id ?? 0) !== 0,
    whyDisabled: (c) => (engineOk(c) ? 'no document open' : NOT_ATTACHED),
    // input = template name → save; no input → name dialog.
    run: (c, input) => {
      if (typeof input === 'string' && input) {
        saveTemplate(input, c.notify)
      } else {
        c.openSaveTemplate()
      }
    },
  },
  {
    id: 'file.import',
    label: 'Import…',
    category: 'file',
    status: 'FUNCTIONAL',
    // H09 §5 #11: ONE canonical command file.import(target) — the two targets
    // (stage/library) are menu entries + shortcut aliases that carry the
    // input. No second command for the same semantic action.
    source: '[H09 §5 #11] file.import(target) → SYS-27 MOD-IMPORT (handoff)',
    enabled: (c) => engineOk(c) && (c.getStatus()?.doc_id ?? 0) !== 0,
    whyDisabled: (c) => (engineOk(c) ? 'no document open' : NOT_ATTACHED),
    // input: 'stage' | 'library' (menu entries + Ctrl+R/Ctrl+I aliases)
    run: (c, input) => {
      const target = input === 'library' ? 'library' : 'stage'
      importHandoff(target, c.notify)
    },
  },
  {
    id: 'file.export',
    label: 'Export…',
    category: 'file',
    toolbar: true,
    status: 'FUNCTIONAL',
    // H09 §5 #12: ONE canonical command file.export(format). 'image' = the
    // working in-app export dialog; video/gif/movie/sequence = SYS-27
    // handoffs (honest integration-gap feedback, no fake success).
    source: '[H09 §5 #12] file.export(format) → SYS-27 MOD-EXPORT (handoff)',
    enabled: (c) => engineOk(c) && (c.getStatus()?.doc_id ?? 0) !== 0,
    whyDisabled: () => 'no document open', // H09 §9: DISABLED-BY-CONTEXT reason
    // input: 'image' | 'video' | 'gif' | 'movie' | 'sequence'
    run: (c, input) => {
      const format = typeof input === 'string' ? input : 'image'
      if (format === 'image' || format === 'video' || format === 'movie' || format === 'sequence') c.openExport()
      else if (format === 'gif') exportHandoff('Animated GIF', c.notify)
      // SYS-27 slice 1 (INT-AID-003): sequence is now a REAL engine — the
      // export dialog hosts the range UI (SVG sequence + fps sidecar,
      // eng 14). Video/GIF/movie remain honest handoff toasts (no fake
      // encoders).
      else c.openExport()
    },
  },
  {
    id: 'file.publishSettings',
    label: 'Publish Settings…',
    category: 'file',
    shortcut: 'Ctrl+Shift+F12',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 28 → handoff SYS-27',
    enabled: (c) => engineOk(c) && (c.getStatus()?.doc_id ?? 0) !== 0,
    whyDisabled: (c) => (engineOk(c) ? 'no document open' : NOT_ATTACHED),
    run: (c) => publishHandoff('settings', c.notify),
  },
  {
    id: 'file.publish',
    label: 'Publish',
    category: 'file',
    shortcut: 'Shift+Alt+F12',
    status: 'FUNCTIONAL',
    // SYS-27 slice 1 (INT-AID-003): Publish is now a REAL engine for the
    // default platform (P-8 = HTML5 Canvas): self-contained HTML player
    // (every frame, fps, loop — eng 14 "HTML5"). Emits export:done{format:
    // 'html5', path} (contract §D — SYS-27 is the producer).
    source: '[BLUEPRINT REQUIRED] Part 28 → SYS-27 MOD-EXPORT (HTML5 publish, slice 1)',
    enabled: (c) => engineOk(c) && (c.getStatus()?.doc_id ?? 0) !== 0,
    whyDisabled: (c) => (engineOk(c) ? 'no document open' : NOT_ATTACHED),
    run: (c) => publishHtml5(c.notify),
  },
  {
    id: 'file.publishProfiles',
    label: 'Publish Profiles…',
    category: 'file',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 28 → handoff SYS-27',
    enabled: (c) => engineOk(c) && (c.getStatus()?.doc_id ?? 0) !== 0,
    whyDisabled: (c) => (engineOk(c) ? 'no document open' : NOT_ATTACHED),
    run: (c) => publishHandoff('profiles', c.notify),
  },
  {
    id: 'file.exit',
    label: 'Exit',
    category: 'file',
    shortcut: 'Ctrl+Q',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.2.1 (quit, prompt save)',
    run: (c) => c.confirmClose(() => c.exitApp(), 'all'),
  },

  // ——— Edit (Part 01 §1.2.2 / C-03) ———
  {
    id: 'edit.undo',
    label: 'Undo',
    category: 'edit',
    shortcut: 'Ctrl+Z',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.2',
    // C-03: greyed when the undo stack is empty (state-aware).
    enabled: (c) => inkCanUndo() || (engineOk(c) && (c.getStatus()?.undo_len ?? 0) > 0),
    whyDisabled: (c) => (engineOk(c) || inkCanUndo() ? 'nothing to undo' : NOT_ATTACHED),
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
    enabled: (c) => inkCanRedo() || (engineOk(c) && (c.getStatus()?.redo_len ?? 0) > 0),
    whyDisabled: (c) => (engineOk(c) || inkCanRedo() ? 'nothing to redo' : NOT_ATTACHED),
    run: (c) => performAction('edit.redo', c.notify),
    toolbar: true,
  },
  {
    id: 'edit.cut',
    label: 'Cut',
    category: 'edit',
    shortcut: 'Ctrl+X',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.2.2 (clipboard = object JSON)',
    enabled: (c) => engineOk(c) && (c.getStatus()?.selection?.length ?? 0) > 0,
    whyDisabled: (c) => (engineOk(c) ? 'nothing selected' : NOT_ATTACHED),
    run: (c) => {
      if (!engineOk(c)) return c.notify(`cut: ${NOT_ATTACHED}`)
      c.notify(cutObjects() ? 'cut: done' : 'cut: nothing to cut')
    },
  },
  {
    id: 'edit.copy',
    label: 'Copy',
    category: 'edit',
    shortcut: 'Ctrl+C',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.2.2 (clipboard = object JSON)',
    enabled: (c) => engineOk(c) && (c.getStatus()?.selection?.length ?? 0) > 0,
    whyDisabled: (c) => (engineOk(c) ? 'nothing selected' : NOT_ATTACHED),
    run: (c) => {
      if (!engineOk(c)) return c.notify(`copy: ${NOT_ATTACHED}`)
      c.notify(copyObjects() ? 'copy: done' : 'copy: nothing selected')
    },
  },
  {
    id: 'edit.paste',
    label: 'Paste',
    category: 'edit',
    shortcut: 'Ctrl+V',
    status: 'FUNCTIONAL',
    // H02 §5: ONE commandId, three targets (center / place / special).
    // special = AMB-S03-003 OPEN — not invented; center is the default (Ctrl+V).
    source: '[SYS-03 H02 §5] edit.paste(center|place|special)',
    enabled: (c) => engineOk(c) && (c.getStatus()?.object_clipboard_len ?? 0) > 0,
    whyDisabled: (c) => (engineOk(c) ? 'clipboard empty' : NOT_ATTACHED),
    run: (c, input) => {
      if (!engineOk(c)) return c.notify(`paste: ${NOT_ATTACHED}`)
      const target = input === 'place' ? 'inplace' : input === 'special' ? 'special' : 'center'
      if (target === 'special') {
        c.notify('paste special: format list is AMB-S03-003 (unresolved) — not invented')
        return
      }
      c.notify(pasteObjects(target) ? `paste: ${target === 'inplace' ? 'in place' : 'center'}` : 'paste: blocked (empty or locked layer)')
    },
  },
  {
    id: 'edit.delete',
    label: 'Delete',
    category: 'edit',
    shortcut: 'Delete',
    status: 'FUNCTIONAL',
    source: '[SYS-03 H02 §6.5 / AMB-S03-004] edit.delete() — Delete/Backspace; not Clear Frames',
    enabled: (c) => engineOk(c) && (c.getStatus()?.selection?.length ?? 0) > 0,
    whyDisabled: (c) => (engineOk(c) ? 'nothing selected' : NOT_ATTACHED),
    run: (c) => {
      if (!engineOk(c)) return c.notify(`delete: ${NOT_ATTACHED}`)
      c.notify(deleteSelection() ? 'delete: done' : 'delete: nothing selected')
    },
  },
  {
    id: 'edit.duplicate',
    label: 'Duplicate',
    category: 'edit',
    shortcut: 'Ctrl+D',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.2 (offset = AMB-SYS03-001 PROVISIONAL 10px)',
    enabled: (c) => engineOk(c) && (c.getStatus()?.selection?.length ?? 0) > 0,
    whyDisabled: (c) => (engineOk(c) ? 'nothing selected' : NOT_ATTACHED),
    run: (c) => {
      if (!engineOk(c)) return c.notify(`duplicate: ${NOT_ATTACHED}`)
      c.notify(duplicateObjects() ? 'duplicate: done' : 'duplicate: nothing selected')
    },
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
    status: 'FUNCTIONAL',
    source: '[SYS-03 H03 §5.3] edit.findReplace() — 5 Blueprint targets; apply = undoable',
    enabled: (c) => engineOk(c) && (c.getStatus()?.doc_id ?? 0) !== 0,
    whyDisabled: (c) => (engineOk(c) ? 'no document open' : NOT_ATTACHED),
    run: (c) => c.openFindReplace(),
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
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.2.2 — Auto-Save prefs (app, not document)',
    run: (c) => c.openPreferences(),
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
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.4.4 / Part 29 §29.9',
    checked: () => loadViewPrefs().rulers,
    run: (c) => {
      const next = toggleViewFlag('rulers')
      c.notify(next.rulers ? 'rulers: on' : 'rulers: off')
    },
  },
  {
    id: 'view.grid',
    label: 'Show Grid',
    category: 'view',
    shortcut: "Ctrl+'",
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT + ADOBE] Part 01 §1.4.4 (cell size = AMB-SYS04-001 PROVISIONAL 20)',
    checked: () => loadViewPrefs().grid,
    run: (c) => {
      const next = toggleViewFlag('grid')
      c.notify(next.grid ? 'grid: on' : 'grid: off')
    },
  },
  {
    id: 'view.guides',
    label: 'Show Guides',
    category: 'view',
    shortcut: 'Ctrl+;',
    status: 'DEFERRED',
    source: '[BLUEPRINT + ADOBE] Part 01 §1.4.4',
    reason: 'guide objects + ruler-drag creation is a later SYS-04 part (empty show-toggle would be a no-op — lesson #8)',
    run: () => {},
  },
  {
    id: 'view.snapping',
    label: 'Snapping',
    category: 'view',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.4.4',
    reason: 'SnapEngine (objects/grid/guides/pixels) is a later SYS-04 part',
    run: () => {},
  },
  {
    id: 'view.hideEdges',
    label: 'Hide Edges',
    category: 'view',
    shortcut: 'Ctrl+Shift+E',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.3 / WISH W6',
    checked: () => loadViewPrefs().hideEdges,
    run: (c) => {
      const next = toggleViewFlag('hideEdges')
      c.notify(next.hideEdges ? 'hide edges: on' : 'hide edges: off')
    },
  },
  {
    id: 'view.onion',
    label: 'Onion Skin',
    category: 'view',
    // D-0009 (register): Blueprint Part 29 is internally conflicted on 'O'
    // (tools: "Oval | O" vs view: "Onion skin toggle | O"). The Oval tool
    // keeps 'O' (§1.3.1 tool activation); the onion toggle — which also has
    // a View-menu row and a Timeline button — moves to the free Ctrl+Alt+O.
    // AI-B owns this command: flip the key if the human rules otherwise.
    shortcut: 'Ctrl+Alt+O',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 15.2.1 / 15.3 — view state, never exported',
    checked: () => loadOnionPrefs().on,
    run: (c) => {
      const next = toggleOnion()
      c.notify(next.on ? 'onion skin: on' : 'onion skin: off')
    },
  },
  {
    id: 'view.onionOutlines',
    label: 'Onion Skin Outlines',
    category: 'view',
    shortcut: 'Shift+O',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 15.2.1 / F-15-04 E3',
    checked: () => loadOnionPrefs().outlines,
    run: (c) => {
      const next = toggleOnionOutlines()
      c.notify(next.outlines ? 'onion outlines: on' : 'onion outlines: off')
    },
  },
  {
    id: 'view.editMultipleFrames',
    label: 'Edit Multiple Frames',
    category: 'view',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 15.2.1 — AMB-TL-020 write semantics open',
    reason: 'EMF write rules (AMB-TL-020a–f) are unresolved — a fake editor would invent mutations',
    run: () => {},
  },
  {
    id: 'timeline.addCamera',
    label: 'Add Camera',
    category: 'timeline',
    status: 'DEFERRED',
    source: '[BLUEPRINT REQUIRED] Part 16 — camera layer/kind is SYS-25',
    reason: 'camera layer + keyframes + export matrix are not in this engine (no new LayerKind)',
    run: () => {},
  },
  {
    id: 'timeline.parentingView',
    label: 'Layer Parenting View',
    category: 'timeline',
    status: 'DEFERRED',
    source: '[BLUEPRINT] Part 20.5 WISH W2 — parent_id is folder nest only',
    reason: 'transform parenting would reuse folder parent_id and corrupt the layer tree',
    run: () => {},
  },
  {
    id: 'view.zoomGear',
    label: 'Show Zoom Controls',
    category: 'view',
    status: 'FUNCTIONAL',
    source: '[OUR DESIGN DECISION] Stage zoom gear can be hidden',
    checked: () => loadViewPrefs().zoomGear,
    run: (c) => {
      const next = toggleViewFlag('zoomGear')
      c.notify(next.zoomGear ? 'zoom controls: on' : 'zoom controls: off')
    },
  },
  {
    id: 'view.workArea',
    label: 'Show Work Area (Pasteboard)',
    category: 'view',
    shortcut: 'Ctrl+Shift+W',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.4.1',
    checked: () => loadViewPrefs().workArea,
    run: (c) => {
      const next = toggleViewFlag('workArea')
      c.notify(next.workArea ? 'work area: on' : 'work area: off')
    },
  },
  {
    id: 'view.previewFull',
    label: 'Full Preview Mode',
    category: 'view',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.4.3',
    checked: () => loadViewPrefs().preview === 'full',
    run: (c) => {
      setPreviewMode('full')
      c.notify('preview mode: full')
    },
  },
  {
    id: 'view.previewOutline',
    label: 'Outline Preview Mode',
    category: 'view',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.4.3',
    checked: () => loadViewPrefs().preview === 'outline',
    run: (c) => {
      setPreviewMode('outline')
      c.notify('preview mode: outline')
    },
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
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 09.2 — Insert ▸ Classic Tween between two same-object keyframes',
    enabled: engineOk,
    whyDisabled: () => NOT_ATTACHED,
    run: (c) => {
      if (timelineViewController.current) {
        timelineViewController.current.createClassicTween()
        return
      }
      const st = c.getStatus()
      if (!st) return c.notify('classic tween: no document')
      const layer = st.layers?.[st.active_layer ?? 0]
      if (!layer || layer.locked) return c.notify('classic tween: locked layer — unlock to edit')
      const keys = layer.keyframes.filter((k) => !k.blank).map((k) => k.frame).sort((a, b) => a - b)
      const start = keys.filter((f) => f <= (st.playhead ?? 1)).pop()
      const end = keys.find((f) => start !== undefined && f > start)
      if (start === undefined || end === undefined) {
        c.notify('classic tween: select two keyframes on the timeline (or place the playhead on a span)')
        return
      }
      c.notify(setClassicTween(st.active_layer ?? 0, start, end, 0) ? `tween ${start} → ${end}` : 'tween: the two keyframes must hold the same object')
    },
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
    // Part 01 §1.2.4: no ellipsis — creation is immediate (auto-named
    // "Scene N", no dialog — Part 25.1), no shortcut ("—" in the Blueprint).
    label: 'Scene',
    category: 'insert',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.2.4 + Part 25.1 — append "Scene N" with a default timeline; becomes active',
    enabled: (c) => engineOk(c) && (c.getStatus()?.doc_id ?? 0) !== 0,
    whyDisabled: (c) => (engineOk(c) ? 'no document open' : NOT_ATTACHED),
    run: (c) => {
      const idx = createScene()
      if (idx < 0) return c.notify('insert scene: engine not attached')
      const name = c.getStatus()?.scene ?? `Scene ${idx + 1}`
      c.notify(`scene "${name}" created — now active`)
    },
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
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.4',
    enabled: (c) => engineOk(c) && (c.getStatus()?.selection?.length ?? 0) > 0,
    whyDisabled: (c) => (engineOk(c) ? 'nothing selected' : NOT_ATTACHED),
    run: (c) => c.notify(rotateSelection(90) ? 'rotate 90° CW' : 'rotate: nothing selected'),
  },
  {
    id: 'modify.transformRotate90ccw',
    label: 'Rotate 90° CCW',
    category: 'modify',
    shortcut: 'Ctrl+Shift+7',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 29 §29.4',
    enabled: (c) => engineOk(c) && (c.getStatus()?.selection?.length ?? 0) > 0,
    whyDisabled: (c) => (engineOk(c) ? 'nothing selected' : NOT_ATTACHED),
    run: (c) => c.notify(rotateSelection(-90) ? 'rotate 90° CCW' : 'rotate: nothing selected'),
  },
  {
    id: 'modify.transformFlipH',
    label: 'Flip Horizontal',
    category: 'modify',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 04',
    enabled: (c) => engineOk(c) && (c.getStatus()?.selection?.length ?? 0) > 0,
    whyDisabled: (c) => (engineOk(c) ? 'nothing selected' : NOT_ATTACHED),
    run: (c) => c.notify(flipSelection(true) ? 'flip horizontal' : 'flip: nothing selected'),
  },
  {
    id: 'modify.transformFlipV',
    label: 'Flip Vertical',
    category: 'modify',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 04',
    enabled: (c) => engineOk(c) && (c.getStatus()?.selection?.length ?? 0) > 0,
    whyDisabled: (c) => (engineOk(c) ? 'nothing selected' : NOT_ATTACHED),
    run: (c) => c.notify(flipSelection(false) ? 'flip vertical' : 'flip: nothing selected'),
  },
  {
    id: 'modify.transformRemove',
    label: 'Remove Transform',
    category: 'modify',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 04',
    enabled: (c) => engineOk(c) && (c.getStatus()?.selection?.length ?? 0) > 0,
    whyDisabled: (c) => (engineOk(c) ? 'nothing selected' : NOT_ATTACHED),
    run: (c) => c.notify(removeTransform() ? 'transform removed' : 'remove transform: already identity'),
  },
  {
    id: 'modify.arrangeFront',
    label: 'Bring to Front',
    category: 'modify',
    shortcut: 'Ctrl+Shift+↑',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 03',
    enabled: (c) => engineOk(c) && (c.getStatus()?.selection?.length ?? 0) > 0,
    whyDisabled: (c) => (engineOk(c) ? 'nothing selected' : NOT_ATTACHED),
    run: (c) => c.notify(arrangeSelection('front') ? 'bring to front' : 'arrange: nothing selected'),
  },
  {
    id: 'modify.arrangeForward',
    label: 'Bring Forward',
    category: 'modify',
    shortcut: 'Ctrl+↑',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 03',
    enabled: (c) => engineOk(c) && (c.getStatus()?.selection?.length ?? 0) > 0,
    whyDisabled: (c) => (engineOk(c) ? 'nothing selected' : NOT_ATTACHED),
    run: (c) => c.notify(arrangeSelection('forward') ? 'bring forward' : 'arrange: nothing selected'),
  },
  {
    id: 'modify.arrangeBackward',
    label: 'Send Backward',
    category: 'modify',
    shortcut: 'Ctrl+↓',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 03',
    enabled: (c) => engineOk(c) && (c.getStatus()?.selection?.length ?? 0) > 0,
    whyDisabled: (c) => (engineOk(c) ? 'nothing selected' : NOT_ATTACHED),
    run: (c) => c.notify(arrangeSelection('backward') ? 'send backward' : 'arrange: nothing selected'),
  },
  {
    id: 'modify.arrangeBack',
    label: 'Send to Back',
    category: 'modify',
    shortcut: 'Ctrl+Shift+↓',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 03',
    enabled: (c) => engineOk(c) && (c.getStatus()?.selection?.length ?? 0) > 0,
    whyDisabled: (c) => (engineOk(c) ? 'nothing selected' : NOT_ATTACHED),
    run: (c) => c.notify(arrangeSelection('back') ? 'send to back' : 'arrange: nothing selected'),
  },
  {
    id: 'modify.align',
    label: 'Align…',
    category: 'modify',
    // [OUR DESIGN DECISION] Ctrl+K is the command palette (C-04); Align is
    // parameterized (input = left|centerH|right|top|middleV|bottom). Single
    // object → Align to Stage (Part 24.5); multi → Align to Selection.
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 24',
    enabled: (c) => engineOk(c) && (c.getStatus()?.selection?.length ?? 0) > 0,
    whyDisabled: (c) => (engineOk(c) ? 'nothing selected' : NOT_ATTACHED),
    run: (c, input) => {
      const op = typeof input === 'string' ? input : ''
      const allowed = ['left', 'centerH', 'right', 'top', 'middleV', 'bottom'] as const
      if (!allowed.includes(op as (typeof allowed)[number])) {
        c.notify('align: pick an operation from Modify ▸ Align')
        return
      }
      c.notify(alignSelection(op as (typeof allowed)[number]) ? `align ${op}` : 'align: nothing moved')
    },
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

  // ——— Control (Part 01 §1.2.8 / Adobe-verified; STM-PLAYBACK engineering 04) ———
  // Play/Pause is ONE command whose label/checked reflect STM-PLAYBACK: playing
  // or paused shows "Pause", idle shows "Play". Enter toggles (INT-0013).
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
    // Stop only has an effect while playing/paused; disabled when idle.
    enabled: (c) => engineOk(c) && playbackState() !== 'IDLE',
    whyDisabled: (c) => (engineOk(c) ? 'playback is stopped' : NOT_ATTACHED),
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
    run: () => seekPlayhead(1),
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
    run: () => seekPlayhead(1),
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
    run: (c) => seekPlayhead(Math.max(1, c.getStatus()?.duration ?? 1)),
  },
  {
    id: 'control.gotoFrame',
    label: 'Go to Frame…',
    category: 'control',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] C-05 st.activeFrame (goToFrame dialog)',
    enabled: engineOk,
    whyDisabled: () => NOT_ATTACHED,
    run: (c) => c.openGoToFrame(),
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
    run: (c) => seekPlayhead((c.getStatus()?.playhead ?? 0) + 1),
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
    run: (c) => seekPlayhead(Math.max(1, (c.getStatus()?.playhead ?? 1) - 1)),
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
    // SYS-09 owns the menu entry; the audio engine + mute state are SYS-26.
    // FUNCTIONAL = honest handoff toast (consistent with File ▸ Import/Export
    // handoffs in H08): it never fakes mute, never dirties the document.
    status: 'FUNCTIONAL',
    source: '[ADOBE REFERENCE] Part 01 §1.2.8 → handoff SYS-26',
    enabled: engineOk,
    whyDisabled: () => NOT_ATTACHED,
    run: (c) =>
      c.notify('Mute Sounds: integration gap — owned by SYS-26 (audio engine), not implemented yet'),
  },
  {
    id: 'control.test',
    label: 'Test Movie',
    category: 'control',
    shortcut: 'Ctrl+Enter',
    // SYS-09 owns the menu/shortcut; the test player/export is SYS-27. At
    // document root Ctrl+Enter shows the honest handoff toast; inside a symbol
    // edit it is re-routed to edit.exitRoot by the dispatcher (D-6, INT-0013).
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT + ADOBE] Part 01 §1.2.8 → handoff SYS-27',
    enabled: engineOk,
    whyDisabled: () => NOT_ATTACHED,
    run: (c) =>
      c.notify('Test Movie: integration gap — owned by SYS-27 (publish/preview engine), not implemented yet'),
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
  {
    id: 'debug.clearOutput',
    label: 'Clear Output Console',
    category: 'debug',
    status: 'FUNCTIONAL',
    source: '[OUR DESIGN DECISION] SYS-10 output console (Blueprint Part 01 §1.2.9: built-in inspector)',
    run: (c) => {
      // The Output console's clear lives in the SYS-10 module; the command
      // reaches it through the same view-controller registry pattern as the
      // Stage/Timeline so the menu never imports panel internals.
      debugViewController.current?.clearOutput()
      c.notify('output: cleared')
    },
  },
  {
    id: 'debug.copyOutput',
    label: 'Copy Output to Clipboard',
    category: 'debug',
    status: 'FUNCTIONAL',
    source: '[OUR DESIGN DECISION] SYS-10 output console',
    run: (c) => {
      const text = debugViewController.current?.outputText() ?? ''
      if (!text) {
        c.notify('output: nothing to copy')
        return
      }
      // navigator.clipboard may be unavailable in non-secure contexts; fall
      // back to a temporary textarea + execCommand (legacy path, not silent).
      const nav = navigator as Navigator & { clipboard?: { writeText?: (s: string) => Promise<void> } }
      if (nav.clipboard?.writeText) {
        nav.clipboard.writeText(text).then(
          () => c.notify('output: copied to clipboard'),
          () => c.notify('output: clipboard copy failed'),
        )
      } else {
        try {
          const ta = document.createElement('textarea')
          ta.value = text
          ta.setAttribute('readonly', '')
          ta.style.position = 'fixed'
          ta.style.opacity = '0'
          document.body.appendChild(ta)
          ta.select()
          const ok = document.execCommand('copy')
          document.body.removeChild(ta)
          c.notify(ok ? 'output: copied to clipboard' : 'output: clipboard copy failed')
        } catch {
          c.notify('output: clipboard copy failed')
        }
      }
    },
  },

  // ——— Window (Part 01 §1.2.10 / SYS-01 §15) ———
  // ONE commandId per semantic action: panel.show(id) / panel.hide(id).
  {
    id: 'panel.show',
    label: 'Show Panel',
    category: 'window',
    status: 'FUNCTIONAL',
    source: '[SYS-01 §15 / §30] panel.show(id) — Window menu + F4/Ctrl+L/Ctrl+Alt+T/Ctrl+F2',
    run: (c, input) => {
      const id = asPanelId(input)
      if (!id) return c.notify('show panel: pick a panel from the Window menu')
      setPanelVisible(c, id, true)
    },
  },
  {
    id: 'panel.hide',
    label: 'Hide Panel',
    category: 'window',
    status: 'FUNCTIONAL',
    source: '[SYS-01 §15 / §30] panel.hide(id)',
    run: (c, input) => {
      const id = asPanelId(input)
      if (!id) return c.notify('hide panel: pick a panel from the Window menu')
      setPanelVisible(c, id, false)
    },
  },
  {
    id: 'window.hideAllPanels',
    label: 'Hide All Panels',
    category: 'window',
    // F4 is LOCKED to Properties (C-09 "F4 toggle (ours)" / SYS-01 §9).
    // Adobe Hide-All-on-F4 loses. No replacement shortcut invented (FL-0010).
    status: 'FUNCTIONAL',
    source: '[ADOBE REFERENCE] Window ▸ Hide All Panels — F4 owned by SYS-01 Properties (C-09); menu-only until a shortcut is decided',
    /** Checked = at least one panel is visible (so Hide All is the next action). */
    checked: (c) => Object.values(c.panels).some(Boolean),
    run: (c) => {
      const anyVisible = Object.values(c.panels).some(Boolean)
      c.setAllPanelsVisible(!anyVisible)
    },
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
    id: 'workspace.saveCurrent',
    label: 'Save Current Workspace',
    category: 'window',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.1.2 (workspace.save)',
    run: (c) => c.saveWorkspace(c.activeWorkspace()),
  },
  {
    id: 'workspace.saveNew',
    label: 'New Workspace…',
    category: 'window',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.1.2 (workspace.save)',
    run: (c) => c.saveWorkspace(''),
  },
  {
    id: 'workspace.load',
    label: 'Switch Workspace',
    category: 'window',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.1.2 (workspace.load)',
    // input = workspace name (single command, parameterized — §30)
    run: (c, input) => c.loadWorkspace(typeof input === 'string' ? input : ''),
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

  // ——— Navigation / edit depth (SYS-01 chrome; behavior owned by SYS-19) ———
  {
    id: 'edit.exitOneLevel',
    label: 'Back one level',
    category: 'app',
    shortcut: 'Esc',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] C-38 (nav.back → edit.exitOneLevel)',
    enabled: (c) => c.editDepth() > 0,
    whyDisabled: () => 'at document root',
    run: (c) => c.exitEditOne(),
  },
  {
    id: 'edit.exitRoot',
    label: 'Exit to document',
    category: 'app',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] C-38 (nav.root → edit.exitRoot)',
    enabled: (c) => c.editDepth() > 0,
    whyDisabled: () => 'at document root',
    run: (c) => c.exitEditRoot(),
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
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.2.11 (offline local docs)',
    run: (c) => c.openHelp('docs'),
  },
  {
    id: 'help.troubleshoot',
    label: 'Troubleshooting…',
    category: 'help',
    status: 'FUNCTIONAL',
    source: '[BLUEPRINT REQUIRED] Part 01 §1.2.11 (offline local docs)',
    run: (c) => c.openHelp('troubleshoot'),
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
/** Extra key bindings that target an existing command — with an optional
 *  INPUT for parameterized commands (H09 §7): Ctrl+R/Ctrl+I bind
 *  file.import('stage'|'library'); Ctrl+Shift+R binds file.export('image'). */
export interface ShortcutInvocation {
  cmd: Command
  input?: unknown
}
export const shortcutAliases: Record<string, { id: string; input?: unknown }> = {
  'ctrl+y': { id: 'edit.redo' },
  'ctrl+r': { id: 'file.import', input: 'stage' },
  'ctrl+i': { id: 'file.import', input: 'library' },
  'ctrl+shift+r': { id: 'file.export', input: 'image' },
  'ctrl+shift+v': { id: 'edit.paste', input: 'place' },
  backspace: { id: 'edit.delete' },
  // SYS-01 §9 / C-09: F4 = Properties toggle (Adobe Ctrl+F3 loses — C-09 "F4 (ours)").
  f4: { id: 'panel.show', input: 'properties' },
  'ctrl+l': { id: 'panel.show', input: 'library' },
  'ctrl+alt+t': { id: 'panel.show', input: 'timeline' },
  'ctrl+f2': { id: 'panel.show', input: 'tools' },
}


/** Display string for a parameterized command's shortcut binding (H09 §6:
 *  the menu shows the shortcut even though the binding lives in the alias
 *  map with its input). */
export function shortcutDisplayFor(id: string, input: unknown): string | undefined {
  for (const [canon, alias] of Object.entries(shortcutAliases)) {
    if (alias.id === id && alias.input === input) {
      const parts = canon.split('+')
      return parts
        .map((p) => {
          if (p === 'ctrl') return 'Ctrl'
          if (p === 'shift') return 'Shift'
          if (p === 'alt') return 'Alt'
          if (p === 'cmd') return 'Cmd'
          if (/^f\d+$/i.test(p)) return p.toUpperCase()
          return p.length === 1 ? p.toUpperCase() : p
        })
        .join('+')
    }
  }
  return undefined
}
/** Find the command bound to a keyboard event (or null). */
export function findCommandByEvent(e: {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
}): Command | undefined {
  return findShortcutInvocation(e)?.cmd
}

/** Find the command + input bound to a keyboard event (parameterized
 *  commands carry their target through the alias — H09 §10 invocation
 *  equivalence: shortcut and menu invoke the SAME commandId). */
export function findShortcutInvocation(e: {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
}): ShortcutInvocation | undefined {
  const canon = eventToCanonical(e)
  const cmd = commands.find((c) => c.shortcut && shortcutToCanonical(c.shortcut) === canon)
  if (cmd) return { cmd }
  const alias = shortcutAliases[canon]
  if (alias) {
    const aliased = byId.get(alias.id)
    if (aliased) return { cmd: aliased, input: alias.input }
  }
  return undefined
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
    openPreferences: () => {},
    openShortcuts: () => {},
    openAbout: () => {},
    openSymbolDialog: () => {},
    openPalette: () => {},
    resetWorkspace: () => {},
    getStatus: () => statusJson(),
    collapsed: {},
    toggleCollapse: () => {},
    activeWorkspace: () => 'Essentials',
    listWorkspaces: () => [],
    saveWorkspace: () => {},
    loadWorkspace: () => {},
    editDepth: () => 0,
    exitEditOne: () => {},
    exitEditRoot: () => {},
    openGoToFrame: () => {},
    openHelp: () => {},
    openFindReplace: () => {},
    setAllPanelsVisible: () => {},
    confirmClose: (proceed) => proceed(),
    confirmCloseDoc: async () => 'cancel',
    openNewDialog: () => {},
    openTemplateGallery: () => {},
    openSaveTemplate: () => {},
    exitApp: () => {},
    ...partial,
  }
}
