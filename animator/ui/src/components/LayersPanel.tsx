import { useState } from 'react'
import {
  createLayer,
  deleteLayer,
  duplicateLayer,
  moveLayer,
  renameLayer,
  setActiveLayer,
  setLayerLocked,
  setLayerOutline,
  setLayerOutlineColor,
  setLayerVisible,
  toggleOtherLayersLocked,
  toggleOtherLayersOutline,
  toggleOtherLayersVisible,
} from '../engine/client'
import type { LayerJson, StatusJson } from '../engine/wasmTypes'
import { PanelHeader } from './PanelHeader'

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

/** F-20-01 reference layer model's default outline color. */
const DEFAULT_OUTLINE_COLOR = '#ff0000'

/**
 * Layers panel (Part 20 / C-22) — a projection of the engine's real layer list.
 * Rows show eye/lock/outline/name + state indicators; clicking a row activates
 * the layer (view state, no undo); eye/lock/outline/reorder/rename/create/
 * duplicate/delete are undoable engine commands.
 *
 * F-07-02 "all others" batch semantics: Alt+click on eye/lock/outline toggles
 * that flag on every OTHER layer as ONE undo step (M.3 rescue: when every
 * layer is hidden, Alt+click the eye shows ALL). Double-clicking the outline
 * swatch edits the layer's outline color (E6 "Layer Properties").
 */
export function LayersPanel({ status, notify, width, collapsed = false, onToggleCollapse, onClose }: Props) {
  const [editing, setEditing] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [dragging, setDragging] = useState<number | null>(null)
  const [colorEdit, setColorEdit] = useState<{ index: number; draft: string } | null>(null)

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

  const duplicate = () => {
    if (!guard('duplicate layer')) return
    const activeIdx = layers.findIndex((l) => l.active)
    if (activeIdx < 0) return
    const idx = duplicateLayer(activeIdx)
    notify(idx > 0 ? `layer duplicated (index ${idx})` : 'duplicate layer: failed')
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

  const toggleEye = (e: React.MouseEvent, engineIndex: number) => {
    e.stopPropagation()
    if (!guard('toggle visibility')) return
    if (e.altKey) {
      // Alt+click = toggle every OTHER layer's visibility (one undo step)
      notify(toggleOtherLayersVisible(engineIndex) ? 'visibility toggled for other layers' : 'visibility toggle: no other layers')
      return
    }
    const l = layers[engineIndex]
    setLayerVisible(engineIndex, !l.visible)
  }

  const toggleLock = (e: React.MouseEvent, engineIndex: number) => {
    e.stopPropagation()
    if (!guard('toggle lock')) return
    if (e.altKey) {
      notify(toggleOtherLayersLocked(engineIndex) ? 'lock toggled for other layers' : 'lock toggle: no other layers')
      return
    }
    const l = layers[engineIndex]
    setLayerLocked(engineIndex, !l.locked)
  }

  const toggleOutline = (e: React.MouseEvent, engineIndex: number) => {
    e.stopPropagation()
    if (!guard('toggle outline')) return
    if (e.altKey) {
      notify(toggleOtherLayersOutline(engineIndex) ? 'outline toggled for other layers' : 'outline toggle: no other layers')
      return
    }
    const l = layers[engineIndex]
    setLayerOutline(engineIndex, !l.outline)
  }

  // double-click the outline swatch = edit the layer's outline color
  // (F-07-02 E6 "Layer Properties → outline color"). ONE command per editing
  // session: draft while open, commit on blur; Esc cancels.
  const startColorEdit = (e: React.MouseEvent, engineIndex: number) => {
    e.stopPropagation()
    if (!guard('edit outline color')) return
    setColorEdit({ index: engineIndex, draft: layers[engineIndex]?.outline_color || DEFAULT_OUTLINE_COLOR })
  }

  const commitColorEdit = () => {
    if (!colorEdit) return
    const { index, draft } = colorEdit
    const before = layers[index]?.outline_color || DEFAULT_OUTLINE_COLOR
    setColorEdit(null)
    if (draft !== before) {
      if (setLayerOutlineColor(index, draft)) notify(`outline color → ${draft}`)
    }
  }

  const cancelColorEdit = () => setColorEdit(null)

  return (
    <aside data-testid="layers-panel" aria-label="Layers" style={{ width: width ?? 200, background: '#1e1e1e', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <PanelHeader id="layers" title="Layers" collapsed={collapsed} onToggleCollapse={onToggleCollapse ?? (() => {})} onClose={onClose ?? (() => {})}>
        <button data-testid="layers-add" aria-label="Add layer" title="Add layer" disabled={!attached} onClick={add} style={btn}>+</button>
        <button data-testid="layers-dup" aria-label="Duplicate active layer" title="Duplicate active layer (deep copy of frames and content)" disabled={!attached || layers.length === 0} onClick={duplicate} style={btn}>⧉</button>
        <button data-testid="layers-delete" aria-label="Delete active layer" title="Delete active layer" disabled={!attached || layers.length <= 1} onClick={() => remove(layers.findIndex((l) => l.active))} style={btn}>🗑</button>
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

      {!collapsed && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 4, overflowY: 'auto', flex: 1 }}>
        {rows.map((l) => {
          const active = l.active
          const blockedActive = active && (l.locked || !l.visible)
          const outlineColor = l.outline_color || DEFAULT_OUTLINE_COLOR
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
                title={l.visible ? 'Hide layer (Alt: toggle all others)' : 'Show layer (Alt: toggle all others)'}
                onClick={(e) => toggleEye(e, l.engineIndex)}
                style={{ ...iconBtn, opacity: l.visible ? 1 : 0.35 }}
              >
                {l.visible ? '👁' : '○'}
              </button>
              <button
                data-testid={`layer-lock-${l.engineIndex}`}
                aria-label={l.locked ? `Unlock ${l.name}` : `Lock ${l.name}`}
                title={l.locked ? 'Unlock layer (Alt: toggle all others)' : 'Lock layer (Alt: toggle all others)'}
                onClick={(e) => toggleLock(e, l.engineIndex)}
                style={{ ...iconBtn, opacity: l.locked ? 1 : 0.4 }}
              >
                {l.locked ? '🔒' : '🔓'}
              </button>

              {colorEdit && colorEdit.index === l.engineIndex ? (
                <input
                  data-testid={`layer-outline-color-${l.engineIndex}`}
                  aria-label={`Outline color for ${l.name}`}
                  title="Outline color (Esc cancels)"
                  type="color"
                  value={colorEdit.draft}
                  onChange={(e) => setColorEdit((c) => (c ? { ...c, draft: e.target.value } : c))}
                  onBlur={commitColorEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') cancelColorEdit()
                  }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  style={{ width: 26, height: 20, padding: 0, border: '1px solid #0a7cff', borderRadius: 3, background: '#111', cursor: 'pointer' }}
                />
              ) : (
                <button
                  data-testid={`layer-outline-${l.engineIndex}`}
                  data-outline={l.outline ? 'true' : 'false'}
                  data-color={outlineColor}
                  aria-label={l.outline ? `Turn off outline mode for ${l.name}` : `Turn on outline mode for ${l.name}`}
                  title={`Outline mode (${outlineColor}) — double-click to change color; Alt: toggle all others`}
                  onClick={(e) => toggleOutline(e, l.engineIndex)}
                  onDoubleClick={(e) => startColorEdit(e, l.engineIndex)}
                  style={{
                    width: 14,
                    height: 14,
                    flexShrink: 0,
                    padding: 0,
                    borderRadius: 3,
                    border: l.outline ? '1px solid #aaa' : '1px dashed #666',
                    background: l.outline ? outlineColor : 'transparent',
                    cursor: 'pointer',
                  }}
                />
              )}

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

              {!l.visible && (
                <span data-testid={`layer-hidden-${l.engineIndex}`} title="Layer hidden (not rendered / not exported)" style={{ color: '#e66', fontSize: 10, flexShrink: 0 }}>
                  ✕
                </span>
              )}

              <span
                data-testid={`layer-edit-state-${l.engineIndex}`}
                title={
                  blockedActive
                    ? 'Active layer is locked or hidden — cannot edit'
                    : active
                      ? 'Active layer — editable'
                      : undefined
                }
                style={{ width: 12, textAlign: 'center', color: blockedActive ? '#e88' : '#7f7', fontSize: 10, flexShrink: 0 }}
              >
                {blockedActive ? '⊘' : active ? '✎' : ''}
              </span>

              <span data-testid={`layer-sel-${l.engineIndex}`} title="selected objects on this layer" style={{ width: 14, textAlign: 'center', color: '#0a7cff' }}>
                {l.selected_objects > 0 ? '●' : ''}
              </span>

              <button data-testid={`layer-up-${l.engineIndex}`} aria-label={`Move ${l.name} up`} title="Move layer up (front)" disabled={l.engineIndex >= layers.length - 1} onClick={(e) => { e.stopPropagation(); up(l.engineIndex) }} style={iconBtn}>▲</button>
              <button data-testid={`layer-down-${l.engineIndex}`} aria-label={`Move ${l.name} down`} title="Move layer down (back)" disabled={l.engineIndex <= 0} onClick={(e) => { e.stopPropagation(); down(l.engineIndex) }} style={iconBtn}>▼</button>
            </li>
          )
        })}
        </ul>
      )}
    </aside>
  )
}

const btn: React.CSSProperties = { padding: '2px 8px', borderRadius: 4, border: '1px solid #555', background: '#2a2a2a', color: '#eee', cursor: 'pointer', fontSize: 13 }
const iconBtn: React.CSSProperties = { padding: 0, width: 18, height: 18, borderRadius: 3, border: 'none', background: 'transparent', color: '#ccc', cursor: 'pointer', fontSize: 11, lineHeight: '18px' }
