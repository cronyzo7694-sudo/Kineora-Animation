import { useEffect, useMemo, useState } from 'react'
import { controls, validateRegistry, type AppContext, type EngineStatus } from './controlRegistry'
import { getEngineStatus, loadEngine, statusJson } from './engine/client'
import { stopPlayback } from './engine/actions'
import { Toolbar } from './components/Toolbar'
import { Stage } from './components/Stage'
import { TimelineStrip } from './components/TimelineStrip'
import { StatusBar } from './components/StatusBar'
import { DebugPanel } from './components/DebugPanel'

export default function App() {
  const [tool, setTool] = useState('select')
  const [toast, setToast] = useState('')
  const [toasts, setToasts] = useState<string[]>([])
  const [engine, setEngine] = useState<EngineStatus>(() => getEngineStatus())
  const [, setTick] = useState(0)

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

  // light status poll so the playhead / engine event log stay live
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 300)
    return () => {
      window.clearInterval(id)
      stopPlayback()
    }
  }, [])

  const notify = (msg: string) => {
    setToast(msg)
    setToasts((t) => [...t.slice(-19), msg])
  }

  const ctx: AppContext = { engine, notify, setTool }
  const registryErrors = useMemo(() => validateRegistry(controls), [])
  const status = statusJson()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '6px 12px', background: '#101010', color: '#8ef', fontSize: 14, fontWeight: 700, letterSpacing: 0.5, borderBottom: '1px solid #2a2a2a' }}>
        KINEORA ANIMATION <span style={{ color: '#666', fontWeight: 400, fontSize: 11 }}>— v0.1 (vertical slice)</span>
      </div>
      <Toolbar controls={controls.filter((c) => c.visibility !== 'HIDDEN-WHEN-UNAVAILABLE')} ctx={ctx} />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Stage engine={engine} tool={tool} />
        <DebugPanel registryErrors={registryErrors} toasts={toasts} engine={engine} engineLog={status?.event_log ?? []} />
      </div>
      <TimelineStrip ctx={ctx} playhead={status?.playhead ?? 1} />
      <StatusBar engine={engine} tool={tool} toast={toast} playhead={status?.playhead ?? 1} fps={status?.fps ?? 24} />
    </div>
  )
}
