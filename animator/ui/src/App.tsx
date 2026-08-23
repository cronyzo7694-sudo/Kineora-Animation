import { useEffect, useMemo, useRef, useState } from 'react'
import { controls, validateRegistry, type AppContext, type EngineStatus } from './controlRegistry'
import { getCommand } from './commands'
import { useShortcutScope } from './shortcuts'
import { docList, getEngineStatus, loadEngine, setActiveDoc, statusJson } from './engine/client'
import { stopPlayback } from './engine/actions'
import { adoptDocPathForRecovery, docPath, isShownDirty, listRecent, openDocument, saveDocument } from './file'
import {
  acceptRecovery,
  checkRecovery,
  discardRecovery,
  initAutosave,
  type AutosaveDeps,
  type RecoveryCandidate,
} from './autosave'
import { RecoveryDialog } from './components/RecoveryDialog'
import { platform, registerSaveNamePicker, type Identity, type ShellStatus } from './platform'
import { SaveAsDialog } from './components/SaveAsDialog'
import { bus } from './bus'
import { outputInfo, outputWarn, outputError } from './outputLog'
import {
  DEBUG_PANE,
  DEFAULT_LAYOUT,
  LAYERS_W,
  LIBRARY_PANE,
  PROPS_PANE,
  PROPS_W,
  TIMELINE_H_MIN,
  clamp,
  clampPanePref,
  distribute,
  timelineMaxH,
  type PaneSpec,
  type PanelLayout,
} from './panelLayout'
import {
  DEFAULT_COLLAPSED,
  DEFAULT_VISIBILITY,
  DEFAULT_WORKSPACE_NAME,
  listWorkspaceNames,
  loadWorkspacePrefs,
  loadWorkspaceSnapshot,
  resetWorkspacePrefs,
  saveWorkspaceSnapshot,
} from './workspace'
import { Toolbar } from './components/Toolbar'
import { commands as allCommands } from './commands'
import { ToolsPanel } from './components/ToolsPanel'
import { MenuBar } from './components/MenuBar'
import { Stage } from './components/Stage'
import { TimelineStrip } from './components/TimelineStrip'
import { StatusBar } from './components/StatusBar'
import { DebugPanel } from './components/DebugPanel'
import { LayersPanel } from './components/LayersPanel'
import { PropertiesPanel } from './components/PropertiesPanel'
import { ResizeHandle } from './components/ResizeHandle'
import { ExportDialog } from './components/ExportDialog'
import { LibraryPanel } from './components/LibraryPanel'
import { SymbolDialog, type SymbolDialogMode } from './components/SymbolDialog'
import { CommandPalette } from './components/CommandPalette'
import { ShortcutsDialog } from './components/ShortcutsDialog'
import { AboutDialog } from './components/AboutDialog'
import { HelpDialog } from './components/HelpDialog'
import { DocumentSettingsDialog } from './components/DocumentSettingsDialog'
import { GoToFrameDialog } from './components/GoToFrameDialog'
import { EditBar } from './components/EditBar'
import { WorkspaceSwitcher } from './components/WorkspaceSwitcher'
import { DocumentTabs } from './components/DocumentTabs'
import { NewDocumentDialog } from './components/NewDocumentDialog'
import { TemplateGalleryDialog } from './components/TemplateGalleryDialog'
import { SaveTemplateDialog } from './components/SaveTemplateDialog'
import { CloseConfirmationDialog, type CloseConfirmationRequest } from './components/CloseConfirmationDialog'
import { FindReplaceDialog } from './components/FindReplaceDialog'
import type { CloseAllDecision } from './file'
import type { ColorPreview } from './render/canvasRenderer'

const VERSION = '0.2'

// SYS-28 seams injected into MOD-AUTOSAVE (SYS-02 keeps ownership of the
// path map + recent list; autosave only LOOKS UP through these — INV-PERS-1).
const AUTOSAVE_DEPS: AutosaveDeps = {
  getDocPath: (docId) => docPath(docId),
  listRecentPaths: () =>
    listRecent()
      .filter((r): r is typeof r & { path: string } => typeof r.path === 'string' && r.path !== '')
      .map((r) => ({ title: r.title, path: r.path })),
  adoptDocPath: (docId, path) => adoptDocPathForRecovery(docId, path),
}

export default function App() {
  // ——— boot: load workspace prefs (layout + visibility + collapse + name) ———
  const initialPrefs = useRef(loadWorkspacePrefs())
  const [tool, setToolState] = useState('select')
  const [toast, setToast] = useState('')
  const [toasts, setToasts] = useState<string[]>([])
  const [engine, setEngine] = useState<EngineStatus>(() => getEngineStatus())
  const [tick, setTick] = useState(0)
  const [panels, setPanels] = useState<Record<string, boolean>>(() => ({ ...initialPrefs.current.prefs.workspaces[initialPrefs.current.prefs.active]?.visibility ?? DEFAULT_VISIBILITY }))
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => ({ ...initialPrefs.current.prefs.workspaces[initialPrefs.current.prefs.active]?.collapsed ?? DEFAULT_COLLAPSED }))
  const [layout, setLayout] = useState<PanelLayout>(() => ({ ...(initialPrefs.current.prefs.workspaces[initialPrefs.current.prefs.active]?.layout ?? DEFAULT_LAYOUT) }))
  const [activeWs, setActiveWs] = useState<string>(() => initialPrefs.current.prefs.active)
  // live color/stroke preview (renderer-only; engine written only on commit)
  const [colorPreview, setColorPreview] = useState<ColorPreview | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [help, setHelp] = useState<{ open: boolean; section: 'docs' | 'troubleshoot' }>({ open: false, section: 'docs' })
  const [docSettingsOpen, setDocSettingsOpen] = useState(false)
  const [gotoOpen, setGotoOpen] = useState(false)
  const [findReplaceOpen, setFindReplaceOpen] = useState(false)
  const [symbolDialog, setSymbolDialog] = useState<{ open: boolean; mode: SymbolDialogMode }>({ open: false, mode: 'convert' })
  const [highlightSymbol, setHighlightSymbol] = useState<number | null>(null)
  // edit depth (0 = document root). SYS-19 (symbol edit modes) will drive this;
  // until then it is always 0 → nav.back/nav.root are hidden, never dead.
  const [editDepth, setEditDepth] = useState(0)
  // ——— SYS-02 File dialogs + lifecycle ———
  const [newOpen, setNewOpen] = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false)
  const [saveAsDlg, setSaveAsDlg] = useState<{ suggested: string; resolve: (n: string | null) => void } | null>(null)
  const [closeReq, setCloseReq] = useState<(CloseConfirmationRequest & { proceed: () => void; dirtyIds: number[] }) | null>(null)
  // H07 §6 — SEQUENTIAL Close All: the per-document guard (one dirty doc at a
  // time). Resolves the in-flight closeAllDocuments() promise.
  const [seqGuard, setSeqGuard] = useState<{ docId: number; resolve: (d: CloseAllDecision) => void } | null>(null)
  // H11 §4 / H13 §6 — guard 'submitting' state: a Save is in flight → the
  // guard dialog is busy (no double-submit; retry only after the write resolves).
  const [guardBusy, setGuardBusy] = useState(false)
  const [seqGuardBusy, setSeqGuardBusy] = useState(false)
  const [exited, setExited] = useState(false)
  // ——— SYS-28 launch recovery (H00 T12–T14): transient RECOVERED state ———
  const [recovery, setRecovery] = useState<RecoveryCandidate | null>(null)
  const [recoveryBusy, setRecoveryBusy] = useState(false)
  // ——— desktop shell diagnostics (Dev panel; desktop only) ———
  const [shellStatus, setShellStatus] = useState<ShellStatus | null>(null)
  const [identity, setIdentity] = useState<Identity | null>(null)
  const layoutRef = useRef(layout)
  const originRef = useRef<PanelLayout>(layout)
  const colRef = useRef<HTMLDivElement | null>(null)
  const [colH, setColH] = useState(800)

  useEffect(() => {
    layoutRef.current = layout
  }, [layout])

  // route bus failures to a user-facing toast AND the output console (SYS-10)
  useEffect(() => {
    bus.setErrorHandler((event, err) => {
      const msg = `event ${event} failed: ${err instanceof Error ? err.message : String(err)}`
      outputError('bus', msg)
      notify(msg)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // corrupt-workspace recovery (C-02): auto-reset + toast
  useEffect(() => {
    if (initialPrefs.current.corrupt) {
      notify('workspace preferences were corrupt — reset to defaults')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // measure the right dock region height so panes never overflow it
  useEffect(() => {
    const el = colRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const h = e.contentRect.height
        if (h > 0) setColH(h)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // persist the active workspace snapshot (layout + visibility + collapse) to
  // app prefs — single boundary (SYS-01 §18), never into document data.
  useEffect(() => {
    saveWorkspaceSnapshot(activeWs, { layout, visibility: panels, collapsed })
  }, [layout, panels, collapsed, activeWs])

  // attach the WASM core once
  useEffect(() => {
    let alive = true
    // SYS-28 MOD-AUTOSAVE armed for the whole app session (document:changed
    // driven — view/session actions can never trigger an autosave).
    const disposeAutosave = initAutosave(AUTOSAVE_DEPS)
    loadEngine().then((s) => {
      if (!alive) return
      setEngine({ ...s })
      // SYS-28 T12 (H00 §6.3): launch-time recovery scan. INV-AS-1 makes the
      // check equivalent to eng 13's ".autosave newer than project".
      if (s.kind === 'ok') {
        void checkRecovery(AUTOSAVE_DEPS).then((scan) => {
          if (!alive) return
          if (scan.corruptSkipped > 0) {
            // H10 §10: corrupt .autosave → skip + toast (state unchanged).
            notify('recovery: a corrupt autosave was skipped — use File ▸ Open')
          }
          if (scan.candidate) setRecovery(scan.candidate)
        })
      }
    })
    return () => {
      alive = false
      disposeAutosave()
    }
  }, [])

  // light status poll so the playhead / engine event log / panels stay live
  // (the bridge is synchronous; polling is the honest refresh mechanism)
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 120)
    return () => {
      window.clearInterval(id)
      stopPlayback()
    }
  }, [])

  // H00 §12: on activeDoc:changed, force an IMMEDIATE re-render so every
  // document-bound panel (Stage/Timeline/Layers/Properties/Library/title/
  // dirty ●) rebinds to the new active document without waiting for the poll.
  useEffect(() => {
    return bus.on('activeDoc:changed', () => setTick((t) => t + 1))
  }, [])

  // H04 §10 / SYS-01 §27.1: on document:changed (any DOCUMENT mutation —
  // edit/import/undo/redo), document-bound UI re-reads the engine
  // immediately — the dirty ● / title / status update without waiting for
  // the 120ms poll. This event means "document state changed", not
  // "active document changed" — panels re-read, they do not rebind.
  useEffect(() => {
    return bus.on('document:changed', () => setTick((t) => t + 1))
  }, [])

  // SYS-01 §27.1 / INT-0010: layer mutations ALSO emit the canonical
  // layer:changed — the shell re-reads immediately (same refresh semantics
  // as document:changed; panels follow the status poll either way).
  useEffect(() => {
    return bus.on('layer:changed', () => setTick((t) => t + 1))
  }, [])

  // SYS-01 §27.1 / H01 §9 / INT-AIA-003: selection restore and view-only
  // select/clear must rebind Properties/Stage immediately — do not wait
  // for the 120ms poll.
  useEffect(() => {
    return bus.on('selection:changed', () => setTick((t) => t + 1))
  }, [])

  // H05 §7.1 / H04 §10: save success/fail must clear or keep the dirty ●
  // and refresh the title immediately — do not wait for the 120ms poll.
  useEffect(() => {
    return bus.on('saving:changed', () => setTick((t) => t + 1))
  }, [])

  const notify = (msg: string) => {
    setToast(msg)
    setToasts((t) => [...t.slice(-19), msg])
    // SYS-10 Output console: mirror user-facing notifications (handoffs,
    // errors, status) so they survive the toast dismissal. Source tagged by
    // simple heuristic; callers can use outputWarn/error directly for precise
    // levels.
    const lower = msg.toLowerCase()
    if (lower.includes('fail') || lower.includes('error') || lower.includes('not attached')) {
      outputError('notify', msg)
    } else if (lower.includes('gap') || lower.includes('future') || lower.includes('not implemented')) {
      outputWarn('notify', msg)
    } else {
      outputInfo('notify', msg)
    }
  }

  const setTool = (t: string) => {
    setToolState(t)
    bus.emit('tool:changed', { toolId: t })
    // Adobe: picking a tool always reveals Properties so fill/stroke/size
    // can be edited immediately.
    if (!panels.properties) {
      const next = { ...panels, properties: true }
      setPanels(next)
      bus.emit('panel:changed', { id: 'properties', change: 'visibility', visible: true })
    }
    if (collapsed.properties) {
      const next = { ...collapsed, properties: false }
      setCollapsed(next)
      bus.emit('panel:changed', { id: 'properties', change: 'collapse', collapsed: false })
    }
  }

  const togglePanel = (id: string) => {
    const next = { ...panels, [id]: !panels[id] }
    setPanels(next)
    bus.emit('panel:changed', { id, change: 'visibility', visible: next[id] })
  }

  // SYS-11 Window ▸ Hide/Show All Panels (menu command; F4 is LOCKED to
  // Properties per SYS-01 §9/C-09). Toggling is VIEW state only (no undo,
  // no document mutation). Preserves each panel's prior visibility so a
  // second invocation restores the exact hidden-away layout (per-panel
  // panel:changed emissions keep the workspace snapshot and subscribers
  // consistent).
  const hiddenAllSnapshot = useRef<Record<string, boolean> | null>(null)
  const setAllPanelsVisible = (visible: boolean) => {
    if (visible) {
      const restore = hiddenAllSnapshot.current
      hiddenAllSnapshot.current = null
      const next = restore
        ? { ...restore }
        : // no prior hide in this session → fall back to defaults
          { ...DEFAULT_VISIBILITY }
      setPanels(next)
      for (const [id, v] of Object.entries(next)) {
        bus.emit('panel:changed', { id, change: 'visibility', visible: v })
      }
      return
    }
    // hide: snapshot current visibility then turn every known panel off.
    hiddenAllSnapshot.current = { ...panels }
    const next: Record<string, boolean> = {}
    for (const id of Object.keys(panels)) next[id] = false
    setPanels(next)
    for (const id of Object.keys(panels)) {
      bus.emit('panel:changed', { id, change: 'visibility', visible: false })
    }
  }

  const toggleCollapse = (id: string) => {
    const next = { ...collapsed, [id]: !collapsed[id] }
    setCollapsed(next)
    bus.emit('panel:changed', { id, change: 'collapse', collapsed: next[id] })
  }

  function resetWorkspace() {
    resetWorkspacePrefs()
    const d = { ...DEFAULT_LAYOUT }
    setLayout(d)
    setPanels({ ...DEFAULT_VISIBILITY })
    setCollapsed({ ...DEFAULT_COLLAPSED })
    setActiveWs(DEFAULT_WORKSPACE_NAME)
    bus.emit('workspace:changed', { name: DEFAULT_WORKSPACE_NAME, layout: d })
    notify('workspace reset to defaults')
  }

  const saveWorkspace = (name: string) => {
    let n = name.trim()
    if (!n) {
      n = (window.prompt('Workspace name:', 'My Workspace') ?? '').trim()
      if (!n) return
    }
    saveWorkspaceSnapshot(n, { layout, visibility: panels, collapsed })
    setActiveWs(n)
    bus.emit('workspace:changed', { name: n, layout })
    notify(`workspace saved: "${n}"`)
  }

  const loadWorkspace = (name: string) => {
    const snap = loadWorkspaceSnapshot(name)
    if (!snap) {
      notify(`workspace "${name}" not found`)
      return
    }
    setLayout(snap.layout)
    setPanels({ ...snap.visibility })
    setCollapsed({ ...snap.collapsed })
    setActiveWs(name)
    bus.emit('workspace:changed', { name, layout: snap.layout })
    notify(`workspace loaded: "${name}"`)
  }

  const exitEditOne = () => {
    if (editDepth > 0) {
      setEditDepth((d) => d - 1)
      notify('exited one edit level')
    }
  }
  const exitEditRoot = () => {
    if (editDepth > 0) {
      setEditDepth(0)
      notify('exited to document root')
    }
  }

  // ——— SYS-02 canonical unsaved-changes guard (DIRTY only, never identity) ———
  // H02: scope may also be a STABLE document id (per-tab close of a
  // non-active document — the guard targets THAT document, never the
  // active-by-inference). Guard internals (Save/Discard/Cancel) = H07's.
  const confirmClose = (proceed: () => void, scope: 'active' | 'all' | number = 'active') => {
    const allDirty = docList().filter((d) => d.dirty).map((d) => d.id)
    let dirtyIds: number[]
    if (typeof scope === 'number') {
      dirtyIds = allDirty.filter((id) => id === scope)
    } else if (scope === 'all') {
      dirtyIds = allDirty
    } else {
      const activeId = statusJson()?.doc_id ?? 0
      dirtyIds = allDirty.includes(activeId) ? [activeId] : []
    }
    if (dirtyIds.length === 0) {
      proceed()
      return
    }
    setCloseReq({
      what: scope === 'all' && dirtyIds.length > 1 ? 'all documents' : 'this document',
      dirtyCount: dirtyIds.length,
      dirtyIds,
      proceed,
    })
  }

  /** H07 §6 — per-document guard for the sequential Close All. While the
   *  dialog is open (including save retry) the sequence is PAUSED. */
  const confirmCloseDoc = (docId: number) =>
    new Promise<CloseAllDecision>((resolve) => {
      setSeqGuard({ docId, resolve })
    })

  const onSeqGuardSave = async () => {
    const req = seqGuard
    if (!req || seqGuardBusy) return
    setSeqGuardBusy(true)
    try {
      // H05 save of THAT document (guard Save reuses file.save — H07 §9)
      setActiveDoc(req.docId)
      const ok = await saveDocument(notify)
      if (!ok) return // save failed → stay DIRTY, close BLOCKED, dialog stays open (retry/cancel)
      setSeqGuard(null)
      req.resolve('save-ok')
    } finally {
      setSeqGuardBusy(false)
    }
  }
  const onSeqGuardDiscard = () => {
    const req = seqGuard
    setSeqGuard(null)
    req?.resolve('discard')
  }
  const onSeqGuardCancel = () => {
    const req = seqGuard
    setSeqGuard(null)
    req?.resolve('cancel')
  }

  const onCloseSave = async () => {
    const req = closeReq
    if (!req || guardBusy) return
    setGuardBusy(true)
    try {
      for (const id of req.dirtyIds) {
        setActiveDoc(id)
        const ok = await saveDocument(notify)
        if (!ok) return // save cancelled/failed → stay DIRTY, keep dialog open
      }
      setCloseReq(null)
      req.proceed()
    } finally {
      setGuardBusy(false)
    }
  }

  const onCloseDiscard = () => {
    const req = closeReq
    setCloseReq(null)
    req?.proceed()
  }

  const exitApp = () => {
    // Desktop: request the OS close (guard already resolved via confirmClose).
    // Browser: show the honest application-exit screen.
    if (platform.isDesktop()) platform.exit()
    else setExited(true)
  }

  // ——— OS close → SYS-02 guard (desktop) + beforeunload (browser) ———
  useEffect(() => {
    const off = platform.onCloseRequested(() => {
      // Hand the OS close to the canonical Save/Discard/Cancel guard over ALL
      // dirty documents (like Exit). Only approveClose() actually closes.
      confirmClose(() => {
        void platform.approveClose()
      }, 'all')
    })
    return off
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (platform.isDesktop()) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      const dirty = docList().some((d) => d.dirty)
      if (dirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  // Fetch desktop-shell diagnostics once (Dev panel).
  useEffect(() => {
    if (!platform.isDesktop()) return
    void platform.getShellStatus().then((s) => s && setShellStatus(s))
    void platform.getIdentity().then((i) => i && setIdentity(i))
  }, [])

  const ctx: AppContext = {
    engine,
    notify,
    setTool,
    togglePanel,
    panels,
    openExport: () => setExportOpen(true),
    openDocumentSettings: () => setDocSettingsOpen(true),
    openShortcuts: () => setShortcutsOpen(true),
    openAbout: () => setAboutOpen(true),
    openSymbolDialog: (mode) => setSymbolDialog({ open: true, mode }),
    openPalette: () => setPaletteOpen(true),
    resetWorkspace,
    getStatus: () => statusJson(),
    collapsed,
    toggleCollapse,
    activeWorkspace: () => activeWs,
    listWorkspaces: () => listWorkspaceNames(),
    saveWorkspace,
    loadWorkspace,
    editDepth: () => editDepth,
    exitEditOne,
    exitEditRoot,
    openGoToFrame: () => setGotoOpen(true),
    openHelp: (section) => setHelp({ open: true, section }),
    openFindReplace: () => setFindReplaceOpen(true),
    setAllPanelsVisible,
    confirmClose,
    confirmCloseDoc,
    openNewDialog: () => setNewOpen(true),
    openTemplateGallery: () => setTemplateOpen(true),
    openSaveTemplate: () => setSaveTemplateOpen(true),
    exitApp,
  }

  // One scoped shortcut listener for global commands (undo/redo/save/open/new/
  // tools/select-all/panels/palette/play/…). Stage and TimelineStrip own their
  // own scopes; scopes are disjoint so no key is ever handled twice.
  useShortcutScope(
    new Set([
      'tool.select',
      'tool.rect',
      'tool.oval',
      'tool.transform',
      'tool.hand',
      'tool.zoom',
      'tool.paintBucket',
      'tool.inkBottle',
      'tool.eyedropper',
      'tool.pen',
      'tool.pencil',
      'tool.brush',
      'tool.eraser',
      'tool.line',
      'tool.text',
      'tool.lasso',
      'tool.subselect',
      'edit.undo',
      'edit.redo',
      'file.new',
      'file.open',
      'file.save',
      'file.saveAs',
      'edit.selectAll',
      'edit.deselectAll',
      'modify.document',
      'modify.convertSymbol',
      'insert.newSymbol',
      'panel.show',
      'panel.hide',
      // SYS-11 Hide/Show All Panels — command stays; F4 is SYS-01 Properties (C-09).
      'window.hideAllPanels',
      'timeline.play',
      'palette.open',
      'help.shortcuts',
      'control.gotoFrame',
      // SYS-02 File
      'file.new',
      'file.open',
      'file.close',
      'file.closeAll',
      'file.save',
      'file.saveAs',
      'file.import',
      'file.export',
      'file.publishSettings',
      'file.publish',
      'file.exit',
      'file.openExternalLibrary',
      // SYS-03 / SYS-04 / SYS-06
      'edit.cut',
      'edit.copy',
      'edit.paste',
      'edit.pasteInPlace',
      'edit.duplicate',
      'edit.delete',
      'edit.findReplace',
      'view.rulers',
      'view.grid',
      'view.hideEdges',
      'view.workArea',
      'view.onion',
      'view.onionOutlines',
      'control.mute',
      'modify.transformRotate90cw',
      'modify.transformRotate90ccw',
      'modify.arrangeFront',
      'modify.arrangeForward',
      'modify.arrangeBackward',
      'modify.arrangeBack',
      'insert.classicTween',
      // SYS-09 Control ▸ Test Movie (Ctrl+Enter; context-scoped to
      // edit.exitRoot inside a symbol edit per D-6/INT-0013).
      'control.test',
    ]),
    ctx,
  )

  const registryErrors = useMemo(() => validateRegistry(controls), [])
  /** Tool commands are rendered by the left Tools panel (Adobe layout), so the
   *  horizontal command toolbar must not repeat them as text buttons. */
  const nonToolControls = useMemo(() => {
    const toolIds = new Set(allCommands.filter((c) => c.category === 'tools').map((c) => c.id))
    return controls.filter((c) => !toolIds.has(c.id))
  }, [])
  const status = statusJson()

  const beginResize = () => {
    originRef.current = layoutRef.current
  }

  // ——— right dock: bounded, sum-aware vertical pane stack ———
  type RightPaneId = 'props' | 'library' | 'debug'
  const rightVisible: RightPaneId[] = [
    panels.properties ? 'props' : null,
    panels.library ? 'library' : null,
    panels.debug ? 'debug' : null,
  ].filter((x): x is RightPaneId => x !== null)

  const rightSpecs: PaneSpec[] = rightVisible.map((id) => {
    if (id === 'props') return { min: PROPS_PANE[0], max: PROPS_PANE[1], pref: 0, flex: true }
    const spec = id === 'library' ? LIBRARY_PANE : DEBUG_PANE
    const pref = id === 'library' ? layout.libraryH : layout.debugH
    return { min: spec[0], max: spec[1], pref }
  })
  const rightSplitCount = Math.max(0, rightVisible.length - 1)
  const rightSizes = distribute(colH, rightSpecs, rightSplitCount)
  const rightH = (id: RightPaneId) => {
    const i = rightVisible.indexOf(id)
    return i >= 0 ? rightSizes[i] : 0
  }

  const rightSplitter = (id: 'library' | 'debug', testId: string) => {
    const idx = rightVisible.indexOf(id)
    const key = id === 'library' ? 'libraryH' : 'debugH'
    return (
      <ResizeHandle
        testId={testId}
        orientation="vertical"
        direction={1}
        onBegin={beginResize}
        onDelta={(dy) => setLayout((p) => ({ ...p, [key]: clampPanePref(colH, rightSpecs, idx, p[key] + dy, rightSplitCount) }))}
        onCancel={() => setLayout((p) => ({ ...p, [key]: originRef.current[key] }))}
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif', background: '#101010' }}>
      {/* Single top bar: menus on the left, workspace switcher + brand on the right */}
      <div style={{ display: 'flex', alignItems: 'center', background: '#101010', borderBottom: '1px solid #2a2a2a', paddingRight: 10 }}>
        <MenuBar ctx={ctx} />
        <div style={{ flex: 1 }} />
        <WorkspaceSwitcher
          active={activeWs}
          names={listWorkspaceNames()}
          onSwitch={loadWorkspace}
          onSaveCurrent={() => saveWorkspace(activeWs)}
          onSaveNew={() => saveWorkspace('')}
          onReset={resetWorkspace}
        />
        <span style={{ color: '#7eb8ff', fontSize: 12, fontWeight: 700, letterSpacing: 0.8, marginLeft: 10 }}>Kineora</span>
        <span style={{ color: '#555', fontSize: 10, margin: '0 10px' }}>{VERSION}</span>
        {status && (
          <span data-testid="header-doc-title" title={status.dirty ? 'unsaved changes' : 'saved'} style={{ color: '#aaa', fontSize: 12, marginRight: 12, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {status.doc_title}
            {isShownDirty(status.doc_id ?? 0, !!status.dirty) && <span data-testid="header-dirty-dot" aria-label="unsaved changes" style={{ color: 'var(--kineora-danger)' }}> ●</span>}
          </span>
        )}
        <button
          data-testid="reset-workspace"
          aria-label="Reset workspace layout"
          title="Reset workspace layout to defaults (Window ▸ Reset Workspace)"
          onClick={resetWorkspace}
          style={{ padding: 0, width: 22, height: 20, borderRadius: 3, border: '1px solid #3a3a3a', background: '#1e1e1e', color: '#888', cursor: 'pointer', fontSize: 12 }}
        >
          ⟲
        </button>
      </div>
      {/* Document tabs (SYS-02 multi-document) */}
      <DocumentTabs ctx={ctx} />
      {/* Edit bar (breadcrumb) — above the stage */}
      <EditBar ctx={ctx} scene={status?.scene ?? 'Scene 1'} />
      {/* Command toolbar — tools now live in the left Tools panel (Adobe layout),
          so this bar only carries the non-tool commands (Export, panels, …). */}
      {panels.tools && <Toolbar controls={nonToolControls} ctx={ctx} />}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {panels.tools && <ToolsPanel tool={tool} onPick={setTool} />}
        {panels.layers && (
          <LayersPanel
            width={layout.layersW}
            status={status}
            notify={notify}
            collapsed={collapsed.layers}
            onToggleCollapse={() => toggleCollapse('layers')}
            onClose={() => getCommand('panel.hide')?.run(ctx, 'layers')}
          />
        )}
        {panels.layers && (
          <ResizeHandle
            testId="resize-layers"
            direction={1}
            onBegin={beginResize}
            onDelta={(dx) => setLayout((p) => ({ ...p, layersW: clamp(p.layersW + dx, LAYERS_W[0], LAYERS_W[1]) }))}
            onCancel={() => setLayout((p) => ({ ...p, layersW: originRef.current.layersW }))}
          />
        )}
        <Stage engine={engine} tool={tool} playhead={status?.playhead ?? 1} tick={tick} notify={notify} colorPreview={colorPreview} onToolChange={setTool} />
        {rightVisible.length > 0 && (
          <ResizeHandle
            testId="resize-props"
            direction={-1}
            onBegin={beginResize}
            onDelta={(dx) => setLayout((p) => ({ ...p, propsW: clamp(p.propsW + dx, PROPS_W[0], PROPS_W[1]) }))}
            onCancel={() => setLayout((p) => ({ ...p, propsW: originRef.current.propsW }))}
          />
        )}
        {rightVisible.length > 0 && (
          <div
            ref={colRef}
            data-testid="right-dock"
            style={{ display: 'flex', flexDirection: 'column', minHeight: 0, width: layout.propsW, flexShrink: 0, overflow: 'auto' }}
          >
            {panels.properties && (
              <div data-testid="props-wrap" style={{ height: collapsed.properties ? undefined : rightH('props'), flexShrink: 0, minHeight: 0, display: 'flex' }}>
                <PropertiesPanel
                  width={layout.propsW}
                  status={status}
                  tool={tool}
                  notify={notify}
                  onPreview={setColorPreview}
                  collapsed={collapsed.properties}
                  onToggleCollapse={() => toggleCollapse('properties')}
                  onClose={() => getCommand('panel.hide')?.run(ctx, 'properties')}
                />
              </div>
            )}
            {panels.properties && panels.library && rightSplitter('library', 'resize-library')}
            {panels.library && (
              <div data-testid="library-wrap" style={{ height: collapsed.library ? undefined : rightH('library'), flexShrink: 0, minHeight: 0, display: 'flex' }}>
                <LibraryPanel
                  engine={engine}
                  notify={notify}
                  highlightId={highlightSymbol}
                  onNewSymbol={() => setSymbolDialog({ open: true, mode: 'new' })}
                  collapsed={collapsed.library}
                  onToggleCollapse={() => toggleCollapse('library')}
                  onClose={() => getCommand('panel.hide')?.run(ctx, 'library')}
                />
              </div>
            )}
            {panels.library && panels.debug && rightSplitter('debug', 'resize-debug')}
            {panels.debug && (
              <div data-testid="debug-wrap" style={{ height: collapsed.debug ? undefined : rightH('debug'), flexShrink: 0, minHeight: 0, display: 'flex' }}>
                <DebugPanel
                  registryErrors={registryErrors}
                  toasts={toasts}
                  engine={engine}
                  engineLog={status?.event_log ?? []}
                  collapsed={collapsed.debug}
                  onToggleCollapse={() => toggleCollapse('debug')}
                  onClose={() => togglePanel('debug')}
                  shellStatus={shellStatus}
                  identity={identity}
                />
              </div>
            )}
          </div>
        )}
      </div>
      {panels.timeline && (
        <ResizeHandle
          testId="resize-timeline"
          orientation="vertical"
          direction={-1}
          onBegin={beginResize}
          onDelta={(dy) => setLayout((p) => ({ ...p, timelineH: clamp(p.timelineH + dy, TIMELINE_H_MIN, timelineMaxH()) }))}
          onCancel={() => setLayout((p) => ({ ...p, timelineH: originRef.current.timelineH }))}
        />
      )}
      {panels.timeline && (
        <TimelineStrip
          status={status}
          notify={notify}
          height={layout.timelineH}
          nameW={layout.timelineNameW}
          onNameW={(w) => setLayout((p) => (p.timelineNameW === w ? p : { ...p, timelineNameW: w }))}
        />
      )}
      <StatusBar engine={engine} tool={tool} toast={toast} status={status} editDepth={editDepth} onFrameClick={() => setGotoOpen(true)} />
      <FindReplaceDialog open={findReplaceOpen} onClose={() => setFindReplaceOpen(false)} notify={notify} />
      <ExportDialog open={exportOpen} engine={engine} onClose={() => setExportOpen(false)} notify={notify} />
      <SymbolDialog
        open={symbolDialog.open}
        mode={symbolDialog.mode}
        onClose={() => setSymbolDialog((s) => ({ ...s, open: false }))}
        notify={notify}
        onCreated={(id) => setHighlightSymbol(id)}
      />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} ctx={ctx} />
      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} engine={engine} />
      <HelpDialog open={help.open} section={help.section} onClose={() => setHelp((h) => ({ ...h, open: false }))} />
      <DocumentSettingsDialog open={docSettingsOpen} onClose={() => setDocSettingsOpen(false)} notify={notify} />
      <GoToFrameDialog
        open={gotoOpen}
        onClose={() => setGotoOpen(false)}
        notify={notify}
        current={status?.playhead ?? 1}
        duration={status?.duration ?? 1}
      />
      {/* H01 dialogs: Create/select/save re-invoke the canonical commands
          (file.new / file.newFromTemplate / file.saveAsTemplate) — single
          commandId per action, no direct engine writes from the dialog. */}
      <NewDocumentDialog open={newOpen} onClose={() => setNewOpen(false)} onCreate={(s) => getCommand('file.new')?.run(ctx, s)} />
      <TemplateGalleryDialog open={templateOpen} onClose={() => setTemplateOpen(false)} onCreateFromTemplate={(n) => getCommand('file.newFromTemplate')?.run(ctx, n)} />
      <SaveTemplateDialog open={saveTemplateOpen} onClose={() => setSaveTemplateOpen(false)} onSave={(n) => getCommand('file.saveAsTemplate')?.run(ctx, n)} />
      <SaveAsDialog
        open={!!saveAsDlg}
        suggested={saveAsDlg?.suggested ?? 'kineora-project'}
        onCancel={() => {
          saveAsDlg?.resolve(null)
          setSaveAsDlg(null)
        }}
        onConfirm={(name) => {
          saveAsDlg?.resolve(name)
          setSaveAsDlg(null)
        }}
      />
      <CloseConfirmationDialog request={closeReq} busy={guardBusy} onSave={onCloseSave} onDiscard={onCloseDiscard} onCancel={() => setCloseReq(null)} />
      {/* SYS-28 T12–T14 — launch recovery prompt (Accept → T13, Discard → T14) */}
      <RecoveryDialog
        candidate={recovery}
        busy={recoveryBusy}
        onAccept={() => {
          if (!recovery) return
          setRecoveryBusy(true)
          void acceptRecovery(recovery, AUTOSAVE_DEPS).then((id) => {
            setRecoveryBusy(false)
            setRecovery(null)
            notify(
              id !== 0
                ? `recovered "${recovery.title}"`
                : 'recovery failed: autosaved data is invalid — use File ▸ Open',
            )
          })
        }}
        onDiscard={() => {
          if (!recovery) return
          const c = recovery
          setRecovery(null)
          void discardRecovery(c).then(() => notify('autosaved changes discarded'))
        }}
      />
      {/* H07 §6 — sequential Close All guard (one dirty document at a time) */}
      <CloseConfirmationDialog
        request={seqGuard ? { what: 'this document', dirtyCount: 1 } : null}
        busy={seqGuardBusy}
        onSave={onSeqGuardSave}
        onDiscard={onSeqGuardDiscard}
        onCancel={onSeqGuardCancel}
      />
      {/* No-document empty state (C-02): engine attached but all documents closed */}
      {engine.kind === 'ok' && !status && !exited && (
        <div data-testid="no-doc-state" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 5 }}>
          <div style={{ background: '#1a1a1a', border: '1px solid #3a3a3a', borderRadius: 8, padding: '24px 32px', textAlign: 'center', pointerEvents: 'auto' }}>
            <div style={{ color: '#7eb8ff', fontSize: 16, fontWeight: 700, letterSpacing: 0.6, marginBottom: 4 }}>Kineora</div>
            <div style={{ color: '#777', fontSize: 13, marginBottom: 16 }}>No document open</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button data-testid="no-doc-new" onClick={() => setNewOpen(true)} style={{ padding: '8px 18px', borderRadius: 4, border: '1px solid var(--kineora-btn-primary-border)', background: 'var(--kineora-btn-primary-bg)', color: 'var(--kineora-accent-text)', cursor: 'pointer', fontSize: 13 }}>
                New (Ctrl+N)
              </button>
              <button data-testid="no-doc-open" onClick={() => openDocument(notify)} style={{ padding: '8px 18px', borderRadius: 4, border: '1px solid var(--kineora-btn-border)', background: 'var(--kineora-btn-bg)', color: 'var(--kineora-text)', cursor: 'pointer', fontSize: 13 }}>
                Open (Ctrl+O)
              </button>
            </div>
          </div>
        </div>
      )}
      {/* File ▸ Exit — honest application-level exit (browser can't kill the OS
          process; Tauri native termination is a later integration) */}
      {exited && (
        <div data-testid="exit-screen" style={{ position: 'fixed', inset: 0, background: '#101010', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, zIndex: 200 }}>
          <div style={{ color: '#8ef', fontSize: 22, fontWeight: 800, letterSpacing: 1 }}>KINEORA ANIMATION</div>
          <div style={{ color: '#888', fontSize: 14 }}>The application has exited. You can close this tab or start a new session.</div>
          <button data-testid="exit-restart" onClick={() => window.location.reload()} style={{ padding: '8px 20px', borderRadius: 4, border: '1px solid #0a7cff', background: '#0a3f7f', color: '#fff', cursor: 'pointer', fontSize: 14 }}>
            Restart Kineora
          </button>
        </div>
      )}
    </div>
  )
}
