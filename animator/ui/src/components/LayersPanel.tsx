import { useState } from 'react'
import { createLayer, deleteLayer, moveLayer, renameLayer, setActiveLayer, setLayerLocked, setLayerVisible } from '../engine/client'
import type { LayerJson, StatusJson } from '../engine/wasmTypes'

interface Props {
  status: StatusJson | null
  notify: (msg: string) => void
  /** Dock width (C-06 panel resize). */
  width?: number
}

/**
 * Layers panel (Part 20 / C-22) — a projection of the engine's real layer list.
 * Rows show eye/lock/name/selection-marker; clicking a row activates the layer
 * (view state, no undo); eye/lock/reorder/rename/create/delete are undoable
 * engine commands. Top row = frontmost (engine index n-1, render order bottom→top).
 */
export function LayersPanel({ status, notify, width }: Props) {
  const [editing, setEditing] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [dragging, setDragging] = useState<number | null>(null)

  const layers: LayerJson[] = status?.layers ?? []
  const attached = status !== null
  // display frontmost (top of the document, highest engine index) at the top
  // of the list; engineIndex keeps the real document order for engine calls.
  const rows = layers.map((l, i) => ({ ...l, engineIndex: i })).reverse()

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

  const remove = (engineIndex: number) => {
    if (!guard('delete layer')) return
    if (deleteLayer(engineIndex)) notify('layer deleted')
  }

  const commitRename = () => {
    if (editing === null) return
    const name = draft.trim()
    setEditing(null)
    if (name && name !== layers[editing]?.name) {
      if (renameLayer(editing, name)) notify(`layer renamed to "${name}"`)
    }
  }

  const up = (engineIndex: number) => {
    if (!guard('reorder layer')) return
    if (engineIndex < layers.length - 1 && moveLayer(engineIndex, engineIndex + 1)) notify('layer moved up')
  }

  const down = (engineIndex: number) => {
    if (!guard('reorder layer')) return
    if (engineIndex > 0 && moveLayer(engineIndex, engineIndex - 1)) notify('layer moved down')
  }

  const dropOn = (targetEngine: number) => {
    if (dragging !== null && dragging !== targetEngine) {
      moveLayer(dragging, targetEngine)
      notify('layer reordered')
    }
    setDragging(null)
  }

  return (
    <aside data-testid="layers-panel" aria-label="Layers" style={{ width: width ?? 200, background: '#1e1e1e', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderBottom: '1px solid #333' }}>
        <span style={{ color: '#ddd', fontSize: 12, fontWeight: 700 }}>Layers</span>
        <span style={{ display: 'flex', gap: 4 }}>
          <button data-testid="layers-add" aria-label="Add layer" title="Add layer" disabled={!attached} onClick={add} style={btn}>+</button>
          <button data-testid="layers-delete" aria-label="Delete active layer" title="Delete active layer" disabled={!attached || layers.length <= 1} onClick={() => remove(layers.findIndex((l) => l.active))} style={btn}>🗑</button>
        </span>
      </div>

      {!attached && (
        <div data-testid="layers-empty" style={{ padding: 12, color: '#e66', fontSize: 12 }}>
          Layers unavailable — engine not attached.
        </div>
      )}

      {attached && layers.length === 0 && (
        <div data-testid="layers-empty" style={{ padding: 12, color: '#888', fontSize: 12 }}>
          No layers.
        </div>
      )}

      <ul style={{ listStyle: 'none', margin: 0, padding: 4, overflowY: 'auto', flex: 1 }}>
        {rows.map((l) => {
          const active = l.active
          const rowStyle: React.CSSProperties = {
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 6px',
            borderRadius: 4,
            cursor: 'pointer',
            background: active ? '#2f4a6b' : dragging === l.engineIndex ? '#3a3a3a' : 'transparent',
            border: active ? '1px solid #0a7cff' : '1px solid transparent',
            color: active ? '#fff' : '#ccc',
            fontSize: 12,
            userSelect: 'none',
          }
          return (
            <li
              key={l.id}
              data-testid={`layer-row-${l.engineIndex}`}
              data-active={active ? 'true' : 'false'}
              draggable
              onDragStart={() => setDragging(l.engineIndex)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dropOn(l.engineIndex)}
              onDragEnd={() => setDragging(null)}
              style={rowStyle}
              onClick={() => {
                if (!guard('select layer')) return
                setActiveLayer(l.engineIndex)
              }}
              onDoubleClick={() => {
                if (!guard('rename layer')) return
                setEditing(l.engineIndex)
                setDraft(l.name)
              }}
            >
              <button
                data-testid={`layer-eye-${l.engineIndex}`}
                aria-label={l.visible ? `Hide ${l.name}` : `Show ${l.name}`}
                title={l.visible ? 'Hide layer' : 'Show layer'}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!guard('toggle visibility')) return
                  setLayerVisible(l.engineIndex, !l.visible)
                }}
                style={{ ...iconBtn, opacity: l.visible ? 1 : 0.35 }}
              >
                {l.visible ? '👁' : '○'}
              </button>
              <button
                data-testid={`layer-lock-${l.engineIndex}`}
                aria-label={l.locked ? `Unlock ${l.name}` : `Lock ${l.name}`}
                title={l.locked ? 'Unlock layer' : 'Lock layer'}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!guard('toggle lock')) return
                  setLayerLocked(l.engineIndex, !l.locked)
                }}
                style={{ ...iconBtn, opacity: l.locked ? 1 : 0.4 }}
              >
                {l.locked ? '🔒' : '🔓'}
              </button>

              {editing === l.engineIndex ? (
                <input
                  data-testid={`layer-rename-${l.engineIndex}`}
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename()
                    if (e.key === 'Escape') setEditing(null)
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ flex: 1, minWidth: 0, background: '#111', color: '#eee', border: '1px solid #0a7cff', borderRadius: 3, padding: '2px 4px', fontSize: 12 }}
                />
              ) : (
                <span data-testid={`layer-name-${l.engineIndex}`} style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {l.name}
                </span>
              )}

              <span data-testid={`layer-sel-${l.engineIndex}`} title="selected objects on this layer" style={{ width: 14, textAlign: 'center', color: '#0a7cff' }}>
                {l.selected_objects > 0 ? '●' : ''}
              </span>

              <button data-testid={`layer-up-${l.engineIndex}`} aria-label={`Move ${l.name} up`} title="Move layer up (front)" disabled={l.engineIndex >= layers.length - 1} onClick={(e) => { e.stopPropagation(); up(l.engineIndex) }} style={iconBtn}>▲</button>
              <button data-testid={`layer-down-${l.engineIndex}`} aria-label={`Move ${l.name} down`} title="Move layer down (back)" disabled={l.engineIndex <= 0} onClick={(e) => { e.stopPropagation(); down(l.engineIndex) }} style={iconBtn}>▼</button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}

const btn: React.CSSProperties = { padding: '2px 8px', borderRadius: 4, border: '1px solid #555', background: '#2a2a2a', color: '#eee', cursor: 'pointer', fontSize: 13 }
const iconBtn: React.CSSProperties = { padding: 0, width: 18, height: 18, borderRadius: 3, border: 'none', background: 'transparent', color: '#ccc', cursor: 'pointer', fontSize: 11, lineHeight: '18px' }
