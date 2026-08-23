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
  /** Adobe Active Layer Only — hide inactive rows (view filter). */
  onlyActive?: boolean
}

/** F-20-01 reference layer model's default outline color. */
const DEFAULT_OUTLINE_COLOR = '#ff0000'

/** Adobe-aligned flag columns (right of the name, next to the frame grid). */
export const CHROME_FLAG_W = 20
export const CHROME_COLOR_W = 10
export const CHROME_FLAGS_PAD = 6
export const CHROME_FLAGS_W = CHROME_FLAG_W + CHROME_FLAG_W + CHROME_COLOR_W + CHROME_FLAGS_PAD

/** The three per-row flag columns (F-07-02 layer row controls). */
type FlagKind = 'visible' | 'locked' | 'outline'

function flagOf(l: LayerJson, kind: FlagKind): boolean {
  return kind === 'visible' ? l.visible : kind === 'locked' ? l.locked : (l.outline ?? false)
}

/** How long a changed row keeps its highlight after `layer:changed`. */
const FLASH_MS = 900

/** Original geometric glyphs (Blueprint 34: never Adobe art). */
function Glyph({ path, fill, size = 12 }: { path: string; fill?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden style={{ display: 'block', margin: '0 auto' }}>
      <path d={path} fill={fill ?? 'none'} stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

const PATH_EYE = 'M1.5 6 C3 3.5 5 2.8 6 2.8 S9 3.5 10.5 6 C9 8.5 7 9.2 6 9.2 S3 8.5 1.5 6 Z M6 4.6 A1.4 1.4 0 1 1 6 7.4 A1.4 1.4 0 1 1 6 4.6'
const PATH_LOCK = 'M4 5.4 V3.8 A2 2 0 0 1 8 3.8 V5.4 M3.4 5.4 H8.6 V10.2 H3.4 Z'
const PATH_PAGE = 'M3.2 1.6 H7.2 L9 3.4 V10.4 H3.2 Z M7.2 1.6 V3.4 H9'
const PATH_FOLDER = 'M2 3.2 H5 L6 4.4 H10 V9.4 H2 Z'

/**
 * Layers panel (Part 20 / C-22) — a projection of the engine's real layer list.
 * Improved: Adobe-like polished rows, clearer eye/lock, better folder UX.
 */
export function TimelineChrome({ status, notify, rowHeight, variant = 'dock', onlyActive = false }: Props) {
  const [editing, setEditing] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [dragging, setDragging] = useState<number | null>(null)
  const [colorEdit, setColorEdit] = useState<{ index: number; draft: string } | null>(null)
  const [flash, setFlash] = useState<Set<number>>(new Set())
  const flashTimer = useRef<number | undefined>(undefined)
  const dragRef = useRef<{ kind: FlagKind; initial: Map<number, boolean>; toggled: Set<number> } | null>(null)
  const ignoreRowClickRef = useRef(false)

  const layers: LayerJson[] = status?.layers ?? []
  const attached = status !== null
  const rows = displayRows(layers).filter((l) => !onlyActive || l.active)
  const nameTid = (i: number) => (variant === 'chrome' ? `timeline-layer-name-${i}` : `layer-name-${i}`)
  const hiddenTid = (i: number) => (variant === 'chrome' ? `timeline-layer-hidden-${i}` : `layer-hidden-${i}`)
  const rowTid = (i: number) => (variant === 'chrome' ? `timeline-chrome-row-${i}` : `layer-row-${i}`)

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

  const applyFlag = (kind: FlagKind, engineIndex: number, next: boolean): void => {
    if (kind === 'visible') setLayerVisible(engineIndex, next)
    else if (kind === 'locked') setLayerLocked(engineIndex, next)
    else setLayerOutline(engineIndex, next)
  }

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

  const onFlagPointerEnter = (kind: FlagKind, engineIndex: number) => {
    const s = dragRef.current
    if (!s || s.kind !== kind) return
    const id = layers[engineIndex]?.id
    if (id === undefined || s.toggled.has(id)) return
    s.toggled.add(id)
    applyFlag(kind, engineIndex, !(s.initial.get(id) ?? flagOf(layers[engineIndex], kind)))
  }

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

  const flagBtn = (on: boolean, isVisibleCol = false): React.CSSProperties => ({
    width: CHROME_FLAG_W,
    height: 20,
    flexShrink: 0,
    padding: 0,
    border: '1px solid transparent',
    borderRadius: 3,
    background: on ? (isVisibleCol ? 'rgba(229,85,85,0.15)' : 'rgba(126,184,255,0.15)') : 'transparent',
    color: on ? (isVisibleCol ? '#e55' : '#7eb8ff') : '#5a5a5a',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.12s',
  })

  return (
    <ul data-testid={variant === 'chrome' ? 'timeline-chrome' : 'layers-list'} style={{ listStyle: 'none', margin: 0, padding: 0, overflow: 'visible', flex: 1 }}>
        <style>{`
          li.tl-row:hover { background: #2a2a2a !important; }
          li.tl-row[data-active=\"true\"]:hover { background: #335a9a !important; }
          li.tl-row:hover .tl-flag-ghost { opacity: 0.85 !important; }
          li.tl-row:hover .tl-nudge { opacity: 1 !important; }
          .tl-flag-btn:hover { background: rgba(255,255,255,0.08) !important; border-color: rgba(255,255,255,0.15) !important; }
        `}</style>
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
            gap: 3,
            padding: variant === 'chrome' ? '0 2px 0 6px' : '3px 4px 3px 6px',
            height: rowHeight ?? 26,
            boxSizing: 'border-box',
            borderRadius: 0,
            cursor: 'pointer',
            background: active ? '#2d5aa7' : dragging === l.engineIndex ? '#3a3a3a' : isFolder ? (l.collapsed ? '#252525' : '#222') : '#1e1e1e',
            borderLeft: active ? '3px solid #7eb8ff' : '3px solid transparent',
            borderBottom: '1px solid #252525',
            boxShadow: flashed ? 'inset 0 0 0 1px #7eb8ff' : 'none',
            color: active ? '#fff' : isFolder ? '#c9c9c9' : '#d4d4d4',
            fontSize: 12,
            fontWeight: active ? 500 : 400,
            userSelect: 'none',
            transition: 'background 0.1s',
          }
          return (
            <li
              key={l.id}
              data-testid={rowTid(l.engineIndex)}
              data-active={active ? 'true' : 'false'}
              data-changed={flashed ? 'true' : 'false'}
              className="tl-row"
              draggable
              onDragStart={(e) => {
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
              <span style={{ width: depth * 14, flexShrink: 0 }} data-testid={`layer-indent-${l.engineIndex}`} />
              {isFolder ? (
                <button
                  data-testid={`layer-collapse-${l.engineIndex}`}
                  aria-label={l.collapsed ? `Expand ${l.name}` : `Collapse ${l.name}`}
                  title={l.collapsed ? 'Expand folder — click to show children' : 'Collapse folder — click to hide children'}
                  onClick={(e) => {
                    e.stopPropagation()
                    setFolderCollapsed(l.engineIndex, !l.collapsed)
                  }}
                  style={typeBtn}
                >
                  <span style={{ fontSize: 10, lineHeight: '12px', width: 10, color: '#888' }}>{l.collapsed ? '▸' : '▾'}</span>
                  <Glyph path={PATH_FOLDER} fill={isFolder ? '#6a9eff' : 'currentColor'} size={13} />
                </button>
              ) : (l.parent_id ?? 0) > 0 ? (
                <button
                  data-testid={`layer-unnest-${l.engineIndex}`}
                  aria-label={`Remove ${l.name} from folder`}
                  title="Move out of folder (click to un-nest)"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (setLayerParent(l.engineIndex, null)) notify('layer un-nested')
                  }}
                  style={typeBtn}
                >
                  ↩
                </button>
              ) : (
                <span data-testid={`layer-type-${l.engineIndex}`} title="Normal layer — contains artwork" aria-hidden style={{ width: 18, flexShrink: 0, color: active ? '#cfe4ff' : '#7a7a7a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Glyph path={PATH_PAGE} size={12} />
                </span>
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
                  style={{ flex: 1, minWidth: 0, background: '#111', color: '#eee', border: '1px solid #7eb8ff', borderRadius: 3, padding: '2px 6px', fontSize: 12 }}
                />
              ) : (
                <span data-testid={nameTid(l.engineIndex)} title={`${l.name} — double-click to rename, drag to reorder`} style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: 0.2 }}>
                  {l.name}
                </span>
              )}

              <span
                data-testid={`layer-edit-state-${l.engineIndex}`}
                title={
                  blockedActive
                    ? 'Active layer is locked or hidden — cannot edit'
                    : active
                      ? 'Active layer — editable (pencil shows active)'
                      : 'Click to make active'
                }
                style={{ width: 14, textAlign: 'center', color: blockedActive ? '#ff8a8a' : active ? '#7eb8ff' : 'transparent', fontSize: 11, flexShrink: 0 }}
              >
                {blockedActive ? '⊘' : active ? '✎' : ''}
              </span>

              <span data-testid={`layer-sel-${l.engineIndex}`} title={l.selected_objects > 0 ? `${l.selected_objects} object${l.selected_objects !== 1 ? 's' : ''} selected on this layer` : 'No selection on this layer'} style={{ width: 14, textAlign: 'center', color: l.selected_objects > 0 ? '#7eb8ff' : 'transparent', fontSize: 8, flexShrink: 0 }}>
                {l.selected_objects > 0 ? '●' : ''}
              </span>

              <button data-testid={`layer-up-${l.engineIndex}`} aria-label={`Move ${l.name} up`} title="Move layer up (bring forward)" disabled={l.engineIndex >= layers.length - 1} onClick={(e) => { e.stopPropagation(); up(l.engineIndex) }} style={nudgeBtn} className="tl-nudge">▲</button>
              <button data-testid={`layer-down-${l.engineIndex}`} aria-label={`Move ${l.name} down`} title="Move layer down (send backward)" disabled={l.engineIndex <= 0} onClick={(e) => { e.stopPropagation(); down(l.engineIndex) }} style={nudgeBtn} className="tl-nudge">▼</button>

              <button
                data-testid={`layer-eye-${l.engineIndex}`}
                data-layer-col
                data-hidden={l.visible ? 'false' : 'true'}
                aria-label={l.visible ? `Hide ${l.name}` : `Show ${l.name}`}
                title={l.visible ? 'Hide layer — click to hide, Alt+click to hide others, drag through column to hide multiple' : 'Show layer — hidden layers are not rendered or exported'}
                onPointerDown={(e) => onFlagPointerDown(e, 'visible', l.engineIndex)}
                onPointerEnter={() => onFlagPointerEnter('visible', l.engineIndex)}
                onClick={(e) => onFlagClick(e, 'visible', l.engineIndex)}
                style={flagBtn(!l.visible, true)}
                className="tl-flag-btn"
              >
                {l.visible ? (
                  <span className="tl-flag-ghost" style={{ opacity: 0.35 }}><Glyph path={PATH_EYE} size={12} /></span>
                ) : (
                  <span data-testid={hiddenTid(l.engineIndex)} title="Layer hidden — not rendered, not exported" style={{ color: '#e55', fontSize: 12, fontWeight: 700, lineHeight: '12px' }}>
                    ✕
                  </span>
                )}
              </button>
              <button
                data-testid={`layer-lock-${l.engineIndex}`}
                data-layer-col
                data-on={l.locked ? 'true' : 'false'}
                aria-label={l.locked ? `Unlock ${l.name}` : `Lock ${l.name}`}
                title={l.locked ? 'Unlock layer — locked layers cannot be edited' : 'Lock layer — click to lock, Alt+click to lock others, drag through column'}
                onPointerDown={(e) => onFlagPointerDown(e, 'locked', l.engineIndex)}
                onPointerEnter={() => onFlagPointerEnter('locked', l.engineIndex)}
                onClick={(e) => onFlagClick(e, 'locked', l.engineIndex)}
                style={flagBtn(l.locked)}
                className="tl-flag-btn"
              >
                {l.locked ? <Glyph path={PATH_LOCK} size={12} /> : <span className="tl-flag-ghost" style={{ opacity: 0.25 }}><Glyph path={PATH_LOCK} size={12} /></span>}
              </button>

              {colorEdit && colorEdit.index === l.engineIndex ? (
                <input
                  data-testid={`layer-outline-color-${l.engineIndex}`}
                  aria-label={`Outline color for ${l.name}`}
                  title="Outline color — pick a color, Esc to cancel"
                  type="color"
                  value={colorEdit.draft}
                  onChange={(e) => setColorEdit((c) => (c ? { ...c, draft: e.target.value } : c))}
                  onBlur={commitColorEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') cancelColorEdit()
                  }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  style={{ width: 26, height: 18, padding: 0, border: '1px solid #7eb8ff', borderRadius: 3, background: '#111', cursor: 'pointer', flexShrink: 0 }}
                />
              ) : (
                <button
                  data-testid={`layer-outline-${l.engineIndex}`}
                  data-layer-col
                  data-outline={l.outline ? 'true' : 'false'}
                  data-color={outlineColor}
                  aria-label={l.outline ? `Turn off outline mode for ${l.name}` : `Turn on outline mode for ${l.name}`}
                  title={`Outline mode (${outlineColor}) — click to toggle outline-only view, double-click to change color, Alt+click for others`}
                  onPointerDown={(e) => onFlagPointerDown(e, 'outline', l.engineIndex)}
                  onPointerEnter={() => onFlagPointerEnter('outline', l.engineIndex)}
                  onClick={(e) => onFlagClick(e, 'outline', l.engineIndex)}
                  onDoubleClick={(e) => startColorEdit(e, l.engineIndex)}
                  style={{
                    width: CHROME_COLOR_W,
                    height: 18,
                    flexShrink: 0,
                    padding: 0,
                    marginRight: CHROME_FLAGS_PAD,
                    borderRadius: 3,
                    border: l.outline ? `2px solid ${outlineColor}` : '1px solid #333',
                    background: outlineColor,
                    cursor: 'pointer',
                    opacity: l.outline ? 1 : 0.6,
                    boxSizing: 'border-box',
                    boxShadow: l.outline ? `0 0 4px ${outlineColor}60` : 'none',
                  }}
                />
              )}
            </li>
          )
        })}
        </ul>
  )
}


const typeBtn: React.CSSProperties = { padding: 0, width: 24, height: 18, borderRadius: 3, border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 2, flexShrink: 0 }
const nudgeBtn: React.CSSProperties = { padding: 0, width: 14, height: 16, borderRadius: 3, border: 'none', background: 'transparent', color: '#555', cursor: 'pointer', fontSize: 9, lineHeight: '16px', flexShrink: 0, opacity: 0.4, transition: 'opacity 0.12s' }
