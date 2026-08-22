import { useEffect, useRef, useState } from 'react'
import { bus } from '../../bus'
import {
  moveLayer,
  renameLayer,
  setActiveLayer,
  setFolderCollapsed,
  setLayerLocked,
  setLayerOutline,
  setLayerOutlineColor,
  setLayerParent,
  setLayerVisible,
  toggleOtherLayersLocked,
  toggleOtherLayersOutline,
  toggleOtherLayersVisible,
} from '../../engine/client'
import type { LayerJson, StatusJson } from '../../engine/wasmTypes'
import { displayRows } from './timelineRows'

interface Props {
  status: StatusJson | null
  notify: (msg: string) => void
  /** Forced row box height so chrome lines up with the frame grid (U-2). */
  rowHeight?: number
  /** 'dock' keeps LayersPanel testids; 'chrome' uses timeline-layer-* names. */
  variant?: 'dock' | 'chrome'
}

/** F-20-01 reference layer model's default outline color. */
const DEFAULT_OUTLINE_COLOR = '#ff0000'

/** The three per-row flag columns (F-07-02 layer row controls). */
type FlagKind = 'visible' | 'locked' | 'outline'

function flagOf(l: LayerJson, kind: FlagKind): boolean {
  return kind === 'visible' ? l.visible : kind === 'locked' ? l.locked : (l.outline ?? false)
}

/** How long a changed row keeps its highlight after `layer:changed`. */
const FLASH_MS = 900

/**
 * Layers panel (Part 20 / C-22) — a projection of the engine's real layer list.
 * Rows show eye/lock/outline/name + state indicators; clicking a row activates
 * the layer (view state, no undo); eye/lock/outline/reorder/rename/create/
 * duplicate/delete are undoable engine commands.
 *
 * F-07-02 interactions implemented here:
 *  - Alt+click on eye/lock/outline toggles that flag on every OTHER layer as
 *    ONE undo step (M.3 rescue: when every layer is hidden, Alt+click the eye
 *    shows ALL).
 *  - DRAG-THROUGH (E1/E2 "drag through the column = multiple"): pointer-down
 *    on a flag button then dragging vertically flips the same flag on every
 *    row the pointer enters (once per row per gesture; the row click that
 *    follows a drag is suppressed so the active layer never changes mid-drag).
 *  - Double-clicking the outline swatch edits the layer's outline color
 *    (E6 "Layer Properties"). Rows flash briefly when `layer:changed` fires
 *    (SYS-01 §27.1 / INT-0010 — the canonical layer-mutation event).
 *
 * Keyboard/accessibility: flag buttons toggle on Enter/Space (click with
 * `detail === 0` — the keyboard-activation path); pointer users toggle on
 * pointer-down for drag responsiveness.
 */
export function TimelineChrome({ status, notify, rowHeight, variant = "dock" }: Props) {
  const [editing, setEditing] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [dragging, setDragging] = useState<number | null>(null)
  const [colorEdit, setColorEdit] = useState<{ index: number; draft: string } | null>(null)
  // rows that recently changed (layer:changed) — brief highlight
  const [flash, setFlash] = useState<Set<number>>(new Set())
  const flashTimer = useRef<number | undefined>(undefined)
  // active drag-through session (column kind + per-layer gesture-start values)
  const dragRef = useRef<{ kind: FlagKind; initial: Map<number, boolean>; toggled: Set<number> } | null>(null)
  // suppress the row-click that follows a pointer-down on a flag button
  const ignoreRowClickRef = useRef(false)

  const layers: LayerJson[] = status?.layers ?? []
  const attached = status !== null
  const rows = displayRows(layers)
  const nameTid = (i: number) => (variant === 'chrome' ? `timeline-layer-name-${i}` : `layer-name-${i}`)
  const hiddenTid = (i: number) => (variant === 'chrome' ? `timeline-layer-hidden-${i}` : `layer-hidden-${i}`)
  const rowTid = (i: number) => (variant === 'chrome' ? `timeline-chrome-row-${i}` : `layer-row-${i}`)

  // SYS-01 §27.1 / INT-0010: a layer mutation happened → flash the affected
  // row(s) so the user sees exactly which layer changed (batch ops flash all).
  useEffect(() => {
    const off = bus.on('layer:changed', ({ layerId }) => {
      setFlash((prev) => new Set(prev).add(layerId))
      window.clearTimeout(flashTimer.current)
      flashTimer.current = window.setTimeout(() => setFlash(new Set()), FLASH_MS)
    })
    return () => {
      off()
      window.clearTimeout(flashTimer.current)
    }
  }, [])

  const guard = (action: string): boolean => {
    if (!attached) {
      notify(`${action}: engine not attached`)
      return false
    }
    return true
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
      const target = layers[targetEngine]
      if (target?.kind === 'folder') {
        if (setLayerParent(dragging, targetEngine)) notify('layer nested in folder')
      } else {
        moveLayer(dragging, targetEngine)
        notify('layer reordered')
      }
    }
    setDragging(null)
  }

  /** Apply one flag flip on the engine (single-layer command). */
  const applyFlag = (kind: FlagKind, engineIndex: number, next: boolean): void => {
    if (kind === 'visible') setLayerVisible(engineIndex, next)
    else if (kind === 'locked') setLayerLocked(engineIndex, next)
    else setLayerOutline(engineIndex, next)
  }

  /** Alt+click "all others" batch (ONE undo step). */
  const batchFlag = (kind: FlagKind, engineIndex: number): void => {
    if (kind === 'visible') notify(toggleOtherLayersVisible(engineIndex) ? 'visibility toggled for other layers' : 'visibility toggle: no other layers')
    else if (kind === 'locked') notify(toggleOtherLayersLocked(engineIndex) ? 'lock toggled for other layers' : 'lock toggle: no other layers')
    else notify(toggleOtherLayersOutline(engineIndex) ? 'outline toggled for other layers' : 'outline toggle: no other layers')
  }

  const endDrag = () => {
    dragRef.current = null
    window.removeEventListener('pointerup', endDrag)
    window.removeEventListener('pointercancel', endDrag)
    window.removeEventListener('keydown', onDragKey)
  }

  const onDragKey = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      ignoreRowClickRef.current = false
      endDrag()
    }
  }

  /** pointer-down on a flag button: Alt → batch; otherwise start a drag
   *  session and toggle THIS row immediately (responsive drag-through). */
  const onFlagPointerDown = (e: React.PointerEvent, kind: FlagKind, engineIndex: number) => {
    if (!attached) return
    e.stopPropagation()
    if (e.altKey) {
      batchFlag(kind, engineIndex)
      return
    }
    const initial = new Map<number, boolean>()
    for (const l of layers) initial.set(l.id, flagOf(l, kind))
    dragRef.current = { kind, initial, toggled: new Set() }
    ignoreRowClickRef.current = true
    const id = layers[engineIndex]?.id
    if (id !== undefined) {
      dragRef.current.toggled.add(id)
      applyFlag(kind, engineIndex, !(initial.get(id) ?? flagOf(layers[engineIndex], kind)))
    }
    window.addEventListener('pointerup', endDrag)
    window.addEventListener('pointercancel', endDrag)
    window.addEventListener('keydown', onDragKey)
  }

  /** pointer-enter during an active drag of the SAME column → flip that row
   *  (once per gesture; value flips from its gesture-start state). */
  const onFlagPointerEnter = (kind: FlagKind, engineIndex: number) => {
    const s = dragRef.current
    if (!s || s.kind !== kind) return
    const id = layers[engineIndex]?.id
    if (id === undefined || s.toggled.has(id)) return
    s.toggled.add(id)
    applyFlag(kind, engineIndex, !(s.initial.get(id) ?? flagOf(layers[engineIndex], kind)))
  }

  /** click on a flag button: consume the click that follows a pointer-down
   *  drag; keyboard activation (detail === 0) toggles the flag. */
  const onFlagClick = (e: React.MouseEvent, kind: FlagKind, engineIndex: number) => {
    e.stopPropagation()
    if (ignoreRowClickRef.current) {
      ignoreRowClickRef.current = false
      return
    }
    if (e.detail === 0) {
      if (e.altKey) batchFlag(kind, engineIndex)
      else applyFlag(kind, engineIndex, !flagOf(layers[engineIndex], kind))
    }
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
    <ul data-testid={variant === 'chrome' ? 'timeline-chrome' : 'layers-list'} style={{ listStyle: 'none', margin: 0, padding: variant === 'chrome' ? 0 : 4, overflow: 'visible', flex: 1 }}>
        {rows.map((l) => {
          const active = l.active
          const depth = l.depth ?? 0
          const isFolder = l.kind === 'folder'
          const blockedActive = active && (l.locked || !l.visible)
          const outlineColor = l.outline_color || DEFAULT_OUTLINE_COLOR
          const flashed = flash.has(l.id)
          const rowStyle: React.CSSProperties = {
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: variant === 'chrome' ? '0 4px' : '3px 6px',
            height: rowHeight,
            boxSizing: 'border-box',
            borderRadius: variant === 'chrome' ? 0 : 4,
            cursor: 'pointer',
            background: active ? '#2f4a6b' : dragging === l.engineIndex ? '#3a3a3a' : 'transparent',
            border: active ? '1px solid #0a7cff' : '1px solid transparent',
            boxShadow: flashed ? 'inset 0 0 0 1px #0a7cff' : 'none',
            color: active ? '#fff' : '#ccc',
            fontSize: 12,
            userSelect: 'none',
          }
          return (
            <li
              key={l.id}
              data-testid={rowTid(l.engineIndex)}
              data-active={active ? 'true' : 'false'}
              data-changed={flashed ? 'true' : 'false'}
              draggable
              onDragStart={(e) => {
                // column-drag-through gestures must never become row reorders
                if ((e.target as HTMLElement).closest('[data-layer-col]')) return
                setDragging(l.engineIndex)
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dropOn(l.engineIndex)}
              onDragEnd={() => setDragging(null)}
              style={rowStyle}
              onClick={() => {
                if (ignoreRowClickRef.current) {
                  ignoreRowClickRef.current = false
                  return
                }
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
                data-layer-col
                aria-label={l.visible ? `Hide ${l.name}` : `Show ${l.name}`}
                title={l.visible ? 'Hide layer (Alt: toggle all others; drag through column)' : 'Show layer (Alt: toggle all others; drag through column)'}
                onPointerDown={(e) => onFlagPointerDown(e, 'visible', l.engineIndex)}
                onPointerEnter={() => onFlagPointerEnter('visible', l.engineIndex)}
                onClick={(e) => onFlagClick(e, 'visible', l.engineIndex)}
                style={{ ...iconBtn, opacity: l.visible ? 1 : 0.35 }}
              >
                {l.visible ? '👁' : '○'}
              </button>
              <button
                data-testid={`layer-lock-${l.engineIndex}`}
                data-layer-col
                aria-label={l.locked ? `Unlock ${l.name}` : `Lock ${l.name}`}
                title={l.locked ? 'Unlock layer (Alt: toggle all others; drag through column)' : 'Lock layer (Alt: toggle all others; drag through column)'}
                onPointerDown={(e) => onFlagPointerDown(e, 'locked', l.engineIndex)}
                onPointerEnter={() => onFlagPointerEnter('locked', l.engineIndex)}
                onClick={(e) => onFlagClick(e, 'locked', l.engineIndex)}
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
                  data-layer-col
                  data-outline={l.outline ? 'true' : 'false'}
                  data-color={outlineColor}
                  aria-label={l.outline ? `Turn off outline mode for ${l.name}` : `Turn on outline mode for ${l.name}`}
                  title={`Outline mode (${outlineColor}) — double-click to change color; Alt: toggle all others; drag through column`}
                  onPointerDown={(e) => onFlagPointerDown(e, 'outline', l.engineIndex)}
                  onPointerEnter={() => onFlagPointerEnter('outline', l.engineIndex)}
                  onClick={(e) => onFlagClick(e, 'outline', l.engineIndex)}
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

              <span style={{ width: 8 + depth * 12, flexShrink: 0 }} data-testid={`layer-indent-${l.engineIndex}`} />
              {isFolder ? (
                <button
                  data-testid={`layer-collapse-${l.engineIndex}`}
                  aria-label={l.collapsed ? `Expand ${l.name}` : `Collapse ${l.name}`}
                  title={l.collapsed ? 'Expand folder' : 'Collapse folder'}
                  onClick={(e) => {
                    e.stopPropagation()
                    setFolderCollapsed(l.engineIndex, !l.collapsed)
                  }}
                  style={iconBtn}
                >
                  {l.collapsed ? '▸' : '▾'}
                </button>
              ) : (l.parent_id ?? 0) > 0 ? (
                <button
                  data-testid={`layer-unnest-${l.engineIndex}`}
                  aria-label={`Remove ${l.name} from folder`}
                  title="Move out of folder (F-20-05 left-edge un-nest)"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (setLayerParent(l.engineIndex, null)) notify('layer un-nested')
                  }}
                  style={iconBtn}
                >
                  ↩
                </button>
              ) : (
                <span style={{ width: 18 }} />
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
                <span data-testid={nameTid(l.engineIndex)} style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {l.name}
                </span>
              )}

              {!l.visible && (
                <span data-testid={hiddenTid(l.engineIndex)} title="Layer hidden (not rendered / not exported)" style={{ color: '#e66', fontSize: 10, flexShrink: 0 }}>
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
  )
}


const iconBtn: React.CSSProperties = { padding: 0, width: 18, height: 18, borderRadius: 3, border: 'none', background: 'transparent', color: '#ccc', cursor: 'pointer', fontSize: 11, lineHeight: '18px' }
