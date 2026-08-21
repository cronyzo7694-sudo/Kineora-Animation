import { useEffect, useMemo, useRef, useState } from 'react'
import { controls, validateRegistry, type AppContext, type EngineStatus } from './controlRegistry'
import { useShortcutScope } from './shortcuts'
import { getEngineStatus, loadEngine, statusJson } from './engine/client'
import { stopPlayback } from './engine/actions'
import { bus } from './bus'
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
import { DocumentSettingsDialog } from './components/DocumentSettingsDialog'
import { GoToFrameDialog } from './components/GoToFrameDialog'
import { EditBar } from './components/EditBar'
import { WorkspaceSwitcher } from './components/WorkspaceSwitcher'
import type { ColorPreview } from './render/canvasRenderer'

const VERSION = '0.2'

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
  const [docSettingsOpen, setDocSettingsOpen] = useState(false)
  const [gotoOpen, setGotoOpen] = useState(false)
  const [symbolDialog, setSymbolDialog] = useState<{ open: boolean; mode: SymbolDialogMode }>({ open: false, mode: 'convert' })
  const [highlightSymbol, setHighlightSymbol] = useState<number | null>(null)
  // edit depth (0 = document root). SYS-19 (symbol edit modes) will drive this;
  // until then it is always 0 → nav.back/nav.root are hidden, never dead.
  const [editDepth, setEditDepth] = useState(0)
  const layoutRef = useRef(layout)
  const originRef = useRef<PanelLayout>(layout)
  const colRef = useRef<HTMLDivElement | null>(null)
  const [colH, setColH] = useState(800)

  useEffect(() => {
    layoutRef.current = layout
  }, [layout])

  // route bus failures to a user-facing toast (never silent)
  useEffect(() => {
    bus.setErrorHandler((event, err) => {
      notify(`event ${event} failed: ${err instanceof Error ? err.message : String(err)}`)
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
    loadEngine().then((s) => {
      if (alive) setEngine({ ...s })
    })
    return () => {
      alive = false
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

  const notify = (msg: string) => {
    setToast(msg)
    setToasts((t) => [...t.slice(-19), msg])
  }

  const setTool = (t: string) => {
    setToolState(t)
    bus.emit('tool:changed', { toolId: t })
  }

  const togglePanel = (id: string) => {
    const next = { ...panels, [id]: !panels[id] }
    setPanels(next)
    bus.emit('panel:changed', { id, change: 'visibility', visible: next[id] })
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
  }

  // One scoped shortcut listener for global commands (undo/redo/save/open/new/
  // tools/select-all/panels/palette/play/…). Stage and TimelineStrip own their
  // own scopes; scopes are disjoint so no key is ever handled twice.
  useShortcutScope(
    new Set([
      'tool.select',
      'tool.rect',
      'tool.transform',
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
      'panel.tools',
      'panel.timeline',
      'panel.library',
      'panel.properties',
      'timeline.play',
      'palette.open',
      'help.shortcuts',
      'control.gotoFrame',
    ]),
    ctx,
  )

  const registryErrors = useMemo(() => validateRegistry(controls), [])
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
        <span style={{ color: '#8ef', fontSize: 14, fontWeight: 800, letterSpacing: 1, margin: '0 12px' }}>KINEORA ANIMATION</span>
        <span style={{ color: '#666', fontSize: 11, marginRight: 12 }}>v{VERSION}</span>
        <button
          data-testid="reset-workspace"
          aria-label="Reset workspace layout"
          title="Reset workspace layout to defaults (Window ▸ Reset Workspace)"
          onClick={resetWorkspace}
          style={{ padding: '2px 10px', borderRadius: 4, border: '1px solid #555', background: '#2a2a2a', color: '#ddd', cursor: 'pointer', fontSize: 11 }}
        >
          ⟲ Reset Workspace
        </button>
      </div>
      {/* Edit bar (breadcrumb) — above the stage */}
      <EditBar ctx={ctx} scene={status?.scene ?? 'Scene 1'} />
      {/* Tools toolbar (Window ▸ Tools) */}
      {panels.tools && <Toolbar controls={controls} ctx={ctx} />}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {panels.layers && (
          <LayersPanel
            width={layout.layersW}
            status={status}
            notify={notify}
            collapsed={collapsed.layers}
            onToggleCollapse={() => toggleCollapse('layers')}
            onClose={() => togglePanel('layers')}
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
        <Stage engine={engine} tool={tool} playhead={status?.playhead ?? 1} tick={tick} notify={notify} colorPreview={colorPreview} />
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
                  notify={notify}
                  onPreview={setColorPreview}
                  collapsed={collapsed.properties}
                  onToggleCollapse={() => toggleCollapse('properties')}
                  onClose={() => togglePanel('properties')}
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
                  onClose={() => togglePanel('library')}
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
      {panels.timeline && <TimelineStrip status={status} notify={notify} height={layout.timelineH} />}
      <StatusBar engine={engine} tool={tool} toast={toast} status={status} editDepth={editDepth} onFrameClick={() => setGotoOpen(true)} />
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
      <DocumentSettingsDialog open={docSettingsOpen} onClose={() => setDocSettingsOpen(false)} notify={notify} />
      <GoToFrameDialog
        open={gotoOpen}
        onClose={() => setGotoOpen(false)}
        notify={notify}
        current={status?.playhead ?? 1}
        duration={status?.duration ?? 1}
      />
    </div>
  )
}
