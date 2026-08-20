import { useEffect, useMemo, useRef, useState } from 'react'
import { controls, validateRegistry, type AppContext, type EngineStatus } from './controlRegistry'
import { getEngineStatus, loadEngine, statusJson } from './engine/client'
import { performAction, stopPlayback } from './engine/actions'
import {
  DEBUG_PANE,
  LAYERS_W,
  LIBRARY_PANE,
  PROPS_PANE,
  PROPS_W,
  TIMELINE_H_MIN,
  clamp,
  clampPanePref,
  distribute,
  loadLayout,
  resetLayout,
  saveLayout,
  timelineMaxH,
  type PaneSpec,
  type PanelLayout,
} from './panelLayout'
import { Toolbar } from './components/Toolbar'
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
import type { ColorPreview } from './render/canvasRenderer'

export default function App() {
  const [tool, setTool] = useState('select')
  const [toast, setToast] = useState('')
  const [toasts, setToasts] = useState<string[]>([])
  const [engine, setEngine] = useState<EngineStatus>(() => getEngineStatus())
  const [tick, setTick] = useState(0)
  const [panels, setPanels] = useState<Record<string, boolean>>({ layers: true, properties: true, library: true, timeline: true, debug: true })
  const [layout, setLayout] = useState<PanelLayout>(loadLayout)
  // live color/stroke preview (renderer-only; engine written only on commit)
  const [colorPreview, setColorPreview] = useState<ColorPreview | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [symbolDialog, setSymbolDialog] = useState<{ open: boolean; mode: SymbolDialogMode }>({ open: false, mode: 'convert' })
  const [highlightSymbol, setHighlightSymbol] = useState<number | null>(null)
  const layoutRef = useRef(layout)
  const originRef = useRef<PanelLayout>(layout)
  // measured height of the right dock region (bounded; drives sum-aware sizing)
  const colRef = useRef<HTMLDivElement | null>(null)
  const [colH, setColH] = useState(800)

  useEffect(() => {
    layoutRef.current = layout
  }, [layout])

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

  // persist workspace layout to app prefs (Part 01 §1.1.2; engineering 13)
  useEffect(() => {
    saveLayout(layout)
  }, [layout])

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

  // Global undo/redo shortcuts (Part 29.2: Ctrl+Z, Ctrl+Shift+Z / Ctrl+Y).
  // Skipped while a text input has focus (so typing undo stays browser-native).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (!(e.ctrlKey || e.metaKey)) return
      const key = e.key.toLowerCase()
      if (key === 'z') {
        e.preventDefault()
        performAction(e.shiftKey ? 'edit.redo' : 'edit.undo', notify)
      } else if (key === 'y') {
        e.preventDefault()
        performAction('edit.redo', notify)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Symbol shortcuts (Part 29.8: F8 = Convert to Symbol, Ctrl+F8 = New Symbol).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.key === 'F8') {
        e.preventDefault()
        setSymbolDialog({ open: true, mode: e.ctrlKey || e.metaKey ? 'new' : 'convert' })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Timeline hide/show (Part 29.9: Ctrl+Alt+T, ours).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.key.toLowerCase() === 't' && (e.ctrlKey || e.metaKey) && e.altKey) {
        e.preventDefault()
        setPanels((p) => ({ ...p, timeline: !p.timeline }))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const notify = (msg: string) => {
    setToast(msg)
    setToasts((t) => [...t.slice(-19), msg])
  }

  const togglePanel = (id: string) => {
    setPanels((p) => ({ ...p, [id]: !p[id] }))
  }

  const ctx: AppContext = { engine, notify, setTool, togglePanel, panels, openExport: () => setExportOpen(true) }
  const registryErrors = useMemo(() => validateRegistry(controls), [])
  const status = statusJson()

  const beginResize = () => {
    originRef.current = layoutRef.current
  }

  const resetWorkspace = () => {
    const d = resetLayout()
    setLayout(d)
    notify('workspace reset to defaults')
  }

  // ——— right dock: bounded, sum-aware vertical pane stack ———
  // Order is fixed: Properties (flex) → Library → Dev. A splitter between two
  // panes resizes the pane BELOW it. Heights come from the generic distribute()
  // so the stack can never escape the region (C-36); if the total exceeds the
  // region, the region scrolls (deliberate last-resort).
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: '#101010', color: '#8ef', fontSize: 14, fontWeight: 700, letterSpacing: 0.5, borderBottom: '1px solid #2a2a2a' }}>
        <span>KINEORA ANIMATION <span style={{ color: '#666', fontWeight: 400, fontSize: 11 }}>— v0.1 (vertical slice)</span></span>
        <button data-testid="reset-workspace" aria-label="Reset workspace layout" title="Reset workspace layout to defaults" onClick={resetWorkspace} style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid #555', background: '#2a2a2a', color: '#ddd', cursor: 'pointer', fontSize: 11 }}>
          ⟲ Reset Workspace
        </button>
      </div>
      <Toolbar controls={controls.filter((c) => c.visibility !== 'HIDDEN-WHEN-UNAVAILABLE')} ctx={ctx} />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {panels.layers && <LayersPanel width={layout.layersW} status={status} notify={notify} />}
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
              <div data-testid="props-wrap" style={{ height: rightH('props'), flexShrink: 0, minHeight: 0, display: 'flex' }}>
                <PropertiesPanel width={layout.propsW} status={status} notify={notify} onPreview={setColorPreview} />
              </div>
            )}
            {panels.properties && panels.library && rightSplitter('library', 'resize-library')}
            {panels.library && (
              <div data-testid="library-wrap" style={{ height: rightH('library'), flexShrink: 0, minHeight: 0, display: 'flex' }}>
                <LibraryPanel engine={engine} notify={notify} highlightId={highlightSymbol} onNewSymbol={() => setSymbolDialog({ open: true, mode: 'new' })} />
              </div>
            )}
            {panels.library && panels.debug && rightSplitter('debug', 'resize-debug')}
            {panels.debug && (
              <div data-testid="debug-wrap" style={{ height: rightH('debug'), flexShrink: 0, minHeight: 0, display: 'flex' }}>
                <DebugPanel registryErrors={registryErrors} toasts={toasts} engine={engine} engineLog={status?.event_log ?? []} />
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
      <StatusBar engine={engine} tool={tool} toast={toast} playhead={status?.playhead ?? 1} fps={status?.fps ?? 24} />
      <ExportDialog open={exportOpen} engine={engine} onClose={() => setExportOpen(false)} notify={notify} />
      <SymbolDialog
        open={symbolDialog.open}
        mode={symbolDialog.mode}
        onClose={() => setSymbolDialog((s) => ({ ...s, open: false }))}
        notify={notify}
        onCreated={(id) => setHighlightSymbol(id)}
      />
    </div>
  )
}
