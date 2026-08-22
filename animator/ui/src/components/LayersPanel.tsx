import {
  createFolder,
  createLayer,
  deleteLayer,
  duplicateLayer,
} from '../engine/client'
import type { StatusJson } from '../engine/wasmTypes'
import { PanelHeader } from './PanelHeader'
import { TimelineChrome } from './timeline/TimelineChrome'

interface Props {
  status: StatusJson | null
  notify: (msg: string) => void
  /** Dock width (C-06 panel resize). */
  width?: number
  /** Panel chrome (SYS-01): collapse to header-only. */
  collapsed?: boolean
  onToggleCollapse?: () => void
  onClose?: () => void
}

/**
 * Optional left-dock Layers list (AMB-TL-010). Default hidden after unify
 * (U-G7). Row renderer is shared with the timeline chrome.
 */
export function LayersPanel({ status, notify, width, collapsed = false, onToggleCollapse, onClose }: Props) {
  const layers = status?.layers ?? []
  const attached = status !== null

  const guard = (action: string): boolean => {
    if (!attached) {
      notify(`${action}: engine not attached`)
      return false
    }
    return true
  }

  const add = () => {
    if (!guard('add layer')) return
    const idx = createLayer()
    if (idx >= 0) notify(`layer added (index ${idx})`)
  }
  const addFolder = () => {
    if (!guard('add folder')) return
    const idx = createFolder()
    if (idx >= 0) notify(`folder added (index ${idx})`)
  }
  const duplicate = () => {
    if (!guard('duplicate layer')) return
    const activeIdx = layers.findIndex((l) => l.active)
    if (activeIdx < 0) return
    const idx = duplicateLayer(activeIdx)
    notify(idx > 0 ? `layer duplicated (index ${idx})` : 'duplicate layer: failed')
  }
  const remove = () => {
    if (!guard('delete layer')) return
    if (deleteLayer(layers.findIndex((l) => l.active))) notify('layer deleted')
  }

  return (
    <aside data-testid="layers-panel" aria-label="Layers" style={{ width: width ?? 200, background: '#1e1e1e', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <PanelHeader id="layers" title="Layers" collapsed={collapsed} onToggleCollapse={onToggleCollapse ?? (() => {})} onClose={onClose ?? (() => {})}>
        <button data-testid="layers-add" aria-label="Add layer" title="Add layer" disabled={!attached} onClick={add} style={btn}>+</button>
        <button data-testid="layers-add-folder" aria-label="Add folder" title="Add folder (F-20-05)" disabled={!attached} onClick={addFolder} style={btn}>📁</button>
        <button data-testid="layers-dup" aria-label="Duplicate active layer" title="Duplicate active layer (deep copy of frames and content)" disabled={!attached || layers.length === 0} onClick={duplicate} style={btn}>⧉</button>
        <button data-testid="layers-delete" aria-label="Delete active layer" title="Delete active layer" disabled={!attached || layers.length <= 1} onClick={remove} style={btn}>🗑</button>
      </PanelHeader>
      {collapsed && null}
      {!collapsed && !attached && (
        <div data-testid="layers-empty" style={{ padding: 12, color: '#e66', fontSize: 12 }}>
          Layers unavailable — engine not attached.
        </div>
      )}
      {!collapsed && attached && layers.length === 0 && (
        <div data-testid="layers-empty" style={{ padding: 12, color: '#888', fontSize: 12 }}>
          No layers.
        </div>
      )}
      {!collapsed && attached && layers.length > 0 && (
        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
          <TimelineChrome status={status} notify={notify} variant="dock" />
        </div>
      )}
    </aside>
  )
}

const btn: React.CSSProperties = { padding: '2px 8px', borderRadius: 4, border: '1px solid #555', background: '#2a2a2a', color: '#eee', cursor: 'pointer', fontSize: 13 }
