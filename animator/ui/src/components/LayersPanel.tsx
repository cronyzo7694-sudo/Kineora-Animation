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
 * Improved: Adobe-like header, better empty states, clearer actions.
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
    <aside data-testid="layers-panel" aria-label="Layers" style={{ width: width ?? 220, background: '#1e1e1e', borderRight: '1px solid #2a2a2a', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <PanelHeader id="layers" title="Layers" collapsed={collapsed} onToggleCollapse={onToggleCollapse ?? (() => {})} onClose={onClose ?? (() => {})}>
        <button data-testid="layers-add" aria-label="Add layer" title="Add layer (new blank layer)" disabled={!attached} onClick={add} style={btnPrimary}>+ Layer</button>
        <button data-testid="layers-add-folder" aria-label="Add folder" title="Add folder — group layers like Adobe" disabled={!attached} onClick={addFolder} style={btn}>📁</button>
        <button data-testid="layers-dup" aria-label="Duplicate active layer" title="Duplicate active layer (deep copy of frames and content)" disabled={!attached || layers.length === 0} onClick={duplicate} style={btn}>⧉</button>
        <button data-testid="layers-delete" aria-label="Delete active layer" title="Delete active layer" disabled={!attached || layers.length <= 1} onClick={remove} style={btnDanger}>🗑</button>
      </PanelHeader>
      {collapsed && null}
      {!collapsed && !attached && (
        <div data-testid="layers-empty" style={{ padding: 16, color: '#e66', fontSize: 12, lineHeight: 1.5 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Layers unavailable</div>
          <div style={{ color: '#999' }}>engine not attached. Run <code style={{ background: '#2a2a2a', padding: '1px 4px', borderRadius: 2 }}>npm run wasm</code> then reload.</div>
        </div>
      )}
      {!collapsed && attached && layers.length === 0 && (
        <div data-testid="layers-empty" style={{ padding: 16, color: '#888', fontSize: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 20, marginBottom: 8 }}>📚</div>
          <div>No layers yet</div>
          <div style={{ marginTop: 8 }}>
            <button onClick={add} style={btnPrimary}>+ New Layer</button>
          </div>
        </div>
      )}
      {!collapsed && attached && layers.length > 0 && (
        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, background: '#1a1a1a' }}>
          <TimelineChrome status={status} notify={notify} variant="dock" />
        </div>
      )}
      {!collapsed && attached && layers.length > 0 && (
        <div style={{ padding: '6px 8px', borderTop: '1px solid #2a2a2a', background: '#1e1e1e', fontSize: 10, color: '#666' }}>
          {layers.length} layer{layers.length !== 1 ? 's' : ''} · {layers.filter(l => l.kind === 'folder').length} folder{layers.filter(l => l.kind === 'folder').length !== 1 ? 's' : ''} · drag to reorder · double-click to rename
        </div>
      )}
    </aside>
  )
}

const btn: React.CSSProperties = { padding: '3px 8px', borderRadius: 4, border: '1px solid #444', background: '#2a2a2a', color: '#ddd', cursor: 'pointer', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }
const btnPrimary: React.CSSProperties = { ...btn, background: '#2d5aa7', borderColor: '#3a6fc0', color: '#eaf3ff', fontWeight: 600 }
const btnDanger: React.CSSProperties = { ...btn, color: '#e88' }
