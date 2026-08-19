import { useMemo, useState } from 'react'
import { controls, validateRegistry, type AppContext } from './controlRegistry'
import { getEngineStatus } from './engine/client'
import { Toolbar } from './components/Toolbar'
import { Stage } from './components/Stage'
import { TimelineStrip } from './components/TimelineStrip'
import { StatusBar } from './components/StatusBar'
import { DebugPanel } from './components/DebugPanel'

export default function App() {
  const [tool, setTool] = useState('select')
  const [toast, setToast] = useState('')
  const [toasts, setToasts] = useState<string[]>([])
  const engine = useMemo(() => getEngineStatus(), [])

  const notify = (msg: string) => {
    setToast(msg)
    setToasts((t) => [...t.slice(-19), msg])
  }

  const ctx: AppContext = { engine, notify, setTool }
  const registryErrors = useMemo(() => validateRegistry(controls), [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <Toolbar controls={controls.filter((c) => c.visibility !== 'HIDDEN-WHEN-UNAVAILABLE')} ctx={ctx} />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Stage engine={engine} tool={tool} />
        <DebugPanel registryErrors={registryErrors} toasts={toasts} engine={engine} />
      </div>
      <TimelineStrip ctx={ctx} />
      <StatusBar engine={engine} tool={tool} toast={toast} />
    </div>
  )
}
