import { useEffect, useMemo, useRef, useState } from 'react'
import { controls, validateRegistry, type AppContext, type EngineStatus } from './controlRegistry'
import { getEngineStatus, loadEngine, statusJson } from './engine/client'
import { performAction, stopPlayback } from './engine/actions'
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

/** Workspace panel widths (C-06 resize, Part 01 §1.1.2 app prefs). */
interface PanelWidths {
  layers: number
  properties: number
}
const DEFAULT_WIDTHS: PanelWidths = { layers: 200, properties: 220 }
const LAYERS_MIN = 140
const LAYERS_MAX = 480
const PROPS_MIN = 180
const PROPS_MAX = 520
const PANEL_PREFS_KEY = 'kineora.workspace.panelWidths'

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

function loadPanelWidths(): PanelWidths {
  try {
    const raw = localStorage.getItem(PANEL_PREFS_KEY)
    if (raw) {
      const p = JSON.parse(raw) as Partial<PanelWidths>
      if (typeof p.layers === 'number' && typeof p.properties === 'number') {
        return {
          layers: clamp(p.layers, LAYERS_MIN, LAYERS_MAX),
          properties: clamp(p.properties, PROPS_MIN, PROPS_MAX),
        }
      }
    }
  } catch {
    /* corrupt prefs → defaults */
  }
  return DEFAULT_WIDTHS
}

export default function App() {
  const [tool, setTool] = useState('select')
  const [toast, setToast] = useState('')
  const [toasts, setToasts] = useState<string[]>([])
  const [engine, setEngine] = useState<EngineStatus>(() => getEngineStatus())
  const [tick, setTick] = useState(0)
  const [panels, setPanels] = useState<Record<string, boolean>>({ layers: true, properties: true, library: true })
  const [panelW, setPanelW] = useState<PanelWidths>(loadPanelWidths)
  // live color/stroke preview (renderer-only; engine written only on commit)
  const [colorPreview, setColorPreview] = useState<ColorPreview | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [symbolDialog, setSymbolDialog] = useState<{ open: boolean; mode: SymbolDialogMode }>({ open: false, mode: 'convert' })
  const panelWRef = useRef(panelW)
  const originRef = useRef<PanelWidths>(panelW)

  useEffect(() => {
    panelWRef.current = panelW
  }, [panelW])

  // persist workspace panel widths to app prefs (Part 01 §1.1.2; engineering 13)
  useEffect(() => {
    try {
      localStorage.setItem(PANEL_PREFS_KEY, JSON.stringify(panelW))
    } catch {
      /* storage unavailable → session-only */
    }
  }, [panelW])

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
    originRef.current = panelWRef.current
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '6px 12px', background: '#101010', color: '#8ef', fontSize: 14, fontWeight: 700, letterSpacing: 0.5, borderBottom: '1px solid #2a2a2a' }}>
        KINEORA ANIMATION <span style={{ color: '#666', fontWeight: 400, fontSize: 11 }}>— v0.1 (vertical slice)</span>
      </div>
      <Toolbar controls={controls.filter((c) => c.visibility !== 'HIDDEN-WHEN-UNAVAILABLE')} ctx={ctx} />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {panels.layers && <LayersPanel width={panelW.layers} status={status} notify={notify} />}
        {panels.layers && (
          <ResizeHandle
            testId="resize-layers"
            direction={1}
            onBegin={beginResize}
            onDelta={(dx) => setPanelW((p) => ({ ...p, layers: clamp(p.layers + dx, LAYERS_MIN, LAYERS_MAX) }))}
            onCancel={() => setPanelW((p) => ({ ...p, layers: originRef.current.layers }))}
          />
        )}
        <Stage engine={engine} tool={tool} playhead={status?.playhead ?? 1} tick={tick} notify={notify} colorPreview={colorPreview} />
        {panels.properties && (
          <ResizeHandle
            testId="resize-props"
            direction={-1}
            onBegin={beginResize}
            onDelta={(dx) => setPanelW((p) => ({ ...p, properties: clamp(p.properties + dx, PROPS_MIN, PROPS_MAX) }))}
            onCancel={() => setPanelW((p) => ({ ...p, properties: originRef.current.properties }))}
          />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, width: panels.properties || panels.library ? panelW.properties : 300, flexShrink: 0 }}>
          {panels.properties && <PropertiesPanel width={panelW.properties} status={status} notify={notify} onPreview={setColorPreview} />}
          {panels.library && <LibraryPanel notify={notify} onNewSymbol={() => setSymbolDialog({ open: true, mode: 'new' })} />}
          <DebugPanel registryErrors={registryErrors} toasts={toasts} engine={engine} engineLog={status?.event_log ?? []} />
        </div>
      </div>
      <TimelineStrip status={status} notify={notify} />
      <StatusBar engine={engine} tool={tool} toast={toast} playhead={status?.playhead ?? 1} fps={status?.fps ?? 24} />
      <ExportDialog open={exportOpen} engine={engine} onClose={() => setExportOpen(false)} notify={notify} />
      <SymbolDialog open={symbolDialog.open} mode={symbolDialog.mode} onClose={() => setSymbolDialog((s) => ({ ...s, open: false }))} notify={notify} />
    </div>
  )
}
