import { useEffect, useRef, useState } from 'react'
import { library, patchTransforms, setDocumentSettings, setInstanceLoop, setNodeProps, swapInstance } from '../engine/client'
import { SelectionActions } from './SelectionActions'
import { listInk, selectedInkIds, subscribeInk, updateInk } from '../editor/inkStore'
import type { ColorPreview } from '../render/canvasRenderer'
import type { SelDetailJson, StatusJson } from '../engine/wasmTypes'
import { PanelHeader } from './PanelHeader'
import { ToolInspector, toolLabel } from './ToolInspector'

interface Props {
  status: StatusJson | null
  /** Active tool — Properties shows its inspector (Adobe-style). */
  tool?: string
  notify: (msg: string) => void
  /** Dock width (C-06 panel resize); the panel fills the dock column. */
  width?: number
  collapsed?: boolean
  onToggleCollapse?: () => void
  onClose?: () => void
  /**
   * Live preview channel (Part 26.12 "color controls live" + C-09 "live
   * preview; commit on release"): called during field editing so the Stage
   * can repaint instantly, and with `null` on commit/cancel/unmount. The
   * preview is renderer-only — engine state is only written on commit.
   */
  onPreview?: (p: ColorPreview | null) => void
}

/**
 * Properties panel (Part 26 / C-09) — context-bound inspector.
 * Precedence for slice-1 (REQ-PRP-001): stage selection (single → object
 * schema; multi → common fields X/Y/W/H + "mixed" badge) → document schema
 * (nothing selected). Tool-options schema is a later unit.
 * Every commit = one engine command (one undo entry). Color controls update
 * LIVE (renderer-only preview during drag/typing) and commit one command on
 * release (blur / picker-close / Enter); Esc cancels. Numeric fields commit on
 * Enter/blur with validation (Part 26.12).
 */
export function PropertiesPanel({ status, tool = '', notify, width, onPreview, collapsed = false, onToggleCollapse, onClose }: Props) {
  const attached = status !== null
  const [, setInkTick] = useState(0)
  useEffect(() => subscribeInk(() => setInkTick((n) => n + 1)), [])
  const inkSel = listInk().filter((it) => selectedInkIds().includes(it.id))
  const details: SelDetailJson[] = status?.selection_details ?? []
  const single = details.length === 1 ? details[0] : null
  const multi = details.length > 1
  /** BUG-P-001 — objects that actually own base W/H (instances do not). */
  const baseEditable = details.filter((d) => d.kind !== 'instance')
  const anyInstance = details.some((d) => d.kind === 'instance')

  const guard = (action: string): boolean => {
    if (!attached) {
      notify(`${action}: engine not attached`)
      return false
    }
    return true
  }

  const commitTransform = (field: 'x' | 'y' | 'rotation', value: number) => {
    if (!guard('edit property')) return
    patchTransforms(details.map((d) => ({ id: d.id, [field]: value })))
  }

  const commitScale = (axis: 'scale_x' | 'scale_y', percent: number) => {
    if (!guard('edit property')) return
    patchTransforms(details.map((d) => ({ id: d.id, [axis]: percent / 100 })))
  }

  const commitBase = (field: 'width' | 'height', value: number) => {
    if (!guard('edit property')) return
    // BUG-P-001: symbol instances have no base W/H (the engine ignores the
    // patch for them), so never send one — a mixed selection must not look
    // like it resized the instances too.
    setNodeProps(baseEditable.map((d) => ({ id: d.id, [field]: value })))
  }

  const commitFill = (color: string) => {
    if (!guard('edit fill')) return
    setNodeProps(details.map((d) => ({ id: d.id, fill: color })))
    notify(`fill → ${color}`)
  }

  const commitStrokeEnabled = (enabled: boolean, color: string) => {
    if (!guard('edit stroke')) return
    setNodeProps(details.map((d) => ({ id: d.id, stroke_enabled: enabled, stroke: color })))
    notify(enabled ? `stroke → ${color}` : 'stroke removed')
  }

  const commitStrokeWidth = (value: number) => {
    if (!guard('edit stroke')) return
    setNodeProps(details.map((d) => ({ id: d.id, stroke_width: value })))
    notify(`stroke width → ${value}`)
  }

  const commitDoc = (patch: { width?: number; height?: number; fps?: number; background?: string }) => {
    if (!guard('edit document')) return
    setDocumentSettings(patch)
    notify('document settings updated')
  }

  // ——— value helpers (multi-select shows a value only when all agree) ———
  const shared = <T,>(pick: (d: SelDetailJson) => T): T | null => {
    if (details.length === 0) return null
    const first = pick(details[0])
    return details.every((d) => pick(d) === first) ? first : null
  }

  const sharedX = shared((d) => d.x)
  const sharedY = shared((d) => d.y)
  const sharedW = shared((d) => d.base_w)
  const sharedH = shared((d) => d.base_h)

  // ——— live-preview builders (renderer-only; engine written only on commit) ———
  const previewBg = (c: string | null) => onPreview?.(c === null ? null : { background: c })
  const previewFill = (c: string | null) => onPreview?.(c === null ? null : single ? { item: { id: single.id, fill: c } } : null)
  const previewStrokeColor = (c: string | null) => onPreview?.(c === null ? null : single ? { item: { id: single.id, stroke: c } } : null)
  const previewStrokeWidth = (n: number | null) => onPreview?.(n === null ? null : single ? { item: { id: single.id, strokeWidth: n } } : null)

  const contextChip = !attached
    ? '—'
    : inkSel.length > 0
      ? inkSel.length === 1
        ? `Ink (${inkSel[0].kind})`
        : `Ink (${inkSel.length})`
      : details.length === 0
        ? tool && tool !== 'select'
          ? toolLabel(tool)
          : 'Document'
        : multi
          ? `Objects (${details.length})`
          : 'Object'

  return (
    <aside data-testid="properties-panel" aria-label="Properties" style={{ width: width ?? 220, height: '100%', background: '#1e1e1e', borderLeft: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
      <PanelHeader id="properties" title="Properties" collapsed={collapsed} onToggleCollapse={onToggleCollapse ?? (() => {})} onClose={onClose ?? (() => {})}>
        <span data-testid="props-context" style={{ color: '#8ab4e8', fontSize: 11, background: '#252525', padding: '1px 8px', borderRadius: 8 }}>{contextChip}</span>
      </PanelHeader>

      {!collapsed && (
      <div style={{ padding: 8, overflowY: 'auto', flex: 1, fontSize: 12, color: '#bbb' }}>
        {!attached && (
          <div data-testid="props-empty" style={{ color: '#e66' }}>Properties unavailable — engine not attached.</div>
        )}

        {attached && inkSel.length > 0 && (
          <div>
            <SectionTitle>Ink object</SectionTitle>
            <div style={{ color: '#8ec8ff', fontSize: 11, marginBottom: 8 }}>{inkSel.length} selected · {inkSel[0].kind}</div>
            {inkSel.length === 1 && inkSel[0].kind === 'text' && (
              <Field label="Text">
                <input
                  data-testid="prop-ink-text"
                  value={inkSel[0].text ?? ''}
                  onChange={(e) => updateInk(inkSel[0].id, { text: e.target.value })}
                  style={{ width: 130, background: '#111', color: '#eee', border: '1px solid #444', borderRadius: 3, padding: '2px 4px', fontSize: 11 }}
                />
              </Field>
            )}
            {inkSel.length === 1 && inkSel[0].kind !== 'text' && (
              <>
                <ColorField
                  testId="prop-ink-stroke"
                  label="Stroke"
                  value={inkSel[0].stroke ?? '#000000'}
                  onCommit={(c) => updateInk(inkSel[0].id, { stroke: c })}
                />
                <NumberField
                  testId="prop-ink-width"
                  label="Width"
                  value={fmt(inkSel[0].strokeWidth)}
                  min={0}
                  onCommit={(n) => updateInk(inkSel[0].id, { strokeWidth: n })}
                />
              </>
            )}
          </div>
        )}

        {attached && !!tool && <ToolInspector tool={tool} notify={notify} />}

        {attached && details.length === 0 && inkSel.length === 0 && (
          <div>
            <SectionTitle>Document</SectionTitle>
            <NumberField testId="doc-width" label="Width" value={status ? fmt(status.doc_width) : ''} min={2} onCommit={(n) => commitDoc({ width: n })} />
            <NumberField testId="doc-height" label="Height" value={status ? fmt(status.doc_height) : ''} min={2} onCommit={(n) => commitDoc({ height: n })} />
            <NumberField testId="doc-fps" label="Frame rate (fps)" value={status ? String(status.fps) : ''} min={1} max={120} step={1} onCommit={(n) => commitDoc({ fps: Math.round(n) })} />
            <ColorField testId="doc-bg" label="Background" value={status?.background ?? '#ffffff'} onPreview={previewBg} onCommit={(c) => commitDoc({ background: c })} />
          </div>
        )}

        {attached && details.length > 0 && (
          <div>
            {multi && (
              <div data-testid="props-mixed" style={{ color: '#eeb', marginBottom: 6, fontSize: 11 }}>
                Mixed selection — common fields only.
              </div>
            )}
            <SectionTitle>Position &amp; Size</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 8px' }}>
            <NumberField testId="prop-x" label="X" value={sharedX === null ? '' : fmt(sharedX)} onCommit={(n) => commitTransform('x', n)} />
            <NumberField testId="prop-y" label="Y" value={sharedY === null ? '' : fmt(sharedY)} onCommit={(n) => commitTransform('y', n)} />
            </div>
            {!anyInstance && (
              <>
                <NumberField testId="prop-w" label="W" value={sharedW === null ? '' : fmt(sharedW)} min={0} onCommit={(n) => commitBase('width', n)} />
                <NumberField testId="prop-h" label="H" value={sharedH === null ? '' : fmt(sharedH)} min={0} onCommit={(n) => commitBase('height', n)} />
              </>
            )}

            {single && single.kind === 'instance' && (
              <div style={{ marginTop: 6 }}>
                <div data-testid="prop-symbol" style={{ padding: '4px 6px', background: '#232f3d', borderRadius: 4, color: '#8ec8ff', fontSize: 11 }}>
                  Symbol: <strong>{single.symbol_name ?? '(unknown)'}</strong>
                  <span style={{ color: '#666', marginLeft: 6 }}>{single.symbol_type}</span>
                  {single.empty && <span data-testid="prop-symbol-empty" style={{ color: '#eeb', marginLeft: 6 }}>(empty)</span>}
                </div>

                <SectionTitle>Swap Symbol</SectionTitle>
                <Field label="Swap to">
                  <select
                    data-testid="prop-swap"
                    value={single.symbol_id ?? ''}
                    onChange={(e) => {
                      const target = Number(e.target.value)
                      if (!target || target === single.symbol_id) return
                      if (swapInstance(single.id, target)) notify(`symbol swapped`)
                    }}
                    style={{ width: 130, background: '#111', color: '#eee', border: '1px solid #444', borderRadius: 3, padding: '2px 4px', fontSize: 11 }}
                  >
                    {library().map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </Field>

                <SectionTitle>Playback</SectionTitle>
                <Field label="Mode">
                  <select
                    data-testid="prop-loop-mode"
                    value={single.loop_mode ?? 'loop'}
                    onChange={(e) => {
                      const mode = e.target.value
                      if (setInstanceLoop(single.id, mode, single.first_frame ?? 1)) notify(`loop mode → ${mode}`)
                    }}
                    style={{ width: 130, background: '#111', color: '#eee', border: '1px solid #444', borderRadius: 3, padding: '2px 4px', fontSize: 11 }}
                  >
                    <option value="loop">Loop</option>
                    <option value="playOnce">Play Once</option>
                    <option value="singleFrame">Single Frame</option>
                  </select>
                </Field>
                <NumberField
                  testId="prop-first-frame"
                  label="First frame"
                  value={fmt(single.first_frame ?? 1)}
                  min={1}
                  step={1}
                  onCommit={(n) => {
                    if (setInstanceLoop(single.id, single.loop_mode ?? 'loop', Math.round(n))) notify(`first frame → ${Math.round(n)}`)
                  }}
                />
              </div>
            )}

            {details.length > 0 && tool !== 'select' && tool !== 'transform' && (
              <SelectionActions notify={notify} />
            )}

            {single && (
              <>
                <SectionTitle>Transform</SectionTitle>
                <NumberField testId="prop-rotation" label="Rotation (°)" value={fmt(single.rotation)} onCommit={(n) => commitTransform('rotation', n)} />
                <NumberField testId="prop-scale-x" label="Scale X (%)" value={fmt(single.scale_x * 100)} onCommit={(n) => commitScale('scale_x', n)} />
                <NumberField testId="prop-scale-y" label="Scale Y (%)" value={fmt(single.scale_y * 100)} onCommit={(n) => commitScale('scale_y', n)} />

                {single.kind !== 'instance' && (
                  <>
                    <SectionTitle>Fill</SectionTitle>
                    <ColorField testId="prop-fill" label="Fill color" value={single.fill} onPreview={previewFill} onCommit={commitFill} />

                    <SectionTitle>Stroke</SectionTitle>
                    <Field label="Enabled">
                      <input
                        type="checkbox"
                        data-testid="prop-stroke-enabled"
                        checked={single.stroke !== null}
                        onChange={(e) => commitStrokeEnabled(e.target.checked, single.stroke ?? '#000000')}
                      />
                    </Field>
                    {single.stroke !== null && (
                      <>
                        <ColorField testId="prop-stroke" label="Stroke color" value={single.stroke} onPreview={previewStrokeColor} onCommit={(c) => commitStrokeEnabled(true, c)} />
                        <NumberField testId="prop-stroke-width" label="Stroke width" value={fmt(single.stroke_width)} min={0} onPreview={previewStrokeWidth} onCommit={(n) => commitStrokeWidth(n)} />
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
      )}
    </aside>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ color: '#888', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6, margin: '10px 0 4px', borderBottom: '1px solid #333', paddingBottom: 2 }}>{children}</div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: 6 }}>
      <span style={{ color: '#999' }}>{label}</span>
      {children}
    </label>
  )
}

/** Hex color editor (Part 23): local draft + onChange keeps the field editable.
 *  LIVE preview (Part 26.12 / C-09): every `input` event (picker drag) pushes a
 *  renderer-only preview — no engine write, so no undo fragmentation. ONE
 *  command is committed on release (picker close / blur / Enter); Esc cancels.
 *  Commit is idempotent (lastCommitted dedupe) so close-then-blur = one command. */
function ColorField({ label, value, onCommit, onPreview, testId }: {
  label: string
  value: string
  onCommit: (color: string) => void
  onPreview?: (color: string | null) => void
  testId: string
}) {
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const lastCommittedRef = useRef(value)

  useEffect(() => {
    setDraft(value)
    lastCommittedRef.current = value
  }, [value])

  // clear any live preview when the field unmounts (context switched away)
  useEffect(() => {
    return () => onPreview?.(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // native `change` = picker dialog closed (Chromium): commit the final value.
  // (React's onChange fires on `input` for color inputs, so we listen natively.)
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    const onNativeChange = () => {
      const v = el.value
      setDraft(v)
      if (v !== lastCommittedRef.current) {
        onCommit(v)
        lastCommittedRef.current = v
      }
      onPreview?.(null)
    }
    el.addEventListener('change', onNativeChange)
    return () => el.removeEventListener('change', onNativeChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const commit = () => {
    if (draft !== lastCommittedRef.current) {
      onCommit(draft)
      lastCommittedRef.current = draft
    }
    onPreview?.(null)
  }

  const live = (v: string) => {
    setDraft(v)
    onPreview?.(v) // LIVE: renderer-only, no engine write
  }

  return (
    <Field label={label}>
      <input
        ref={inputRef}
        type="color"
        data-testid={testId}
        value={draft}
        onChange={(e) => live(e.currentTarget.value)}
        onInput={(e) => live(e.currentTarget.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') {
            setDraft(value)
            lastCommittedRef.current = value
            onPreview?.(null)
          }
        }}
        style={{ width: 40, height: 22, border: '1px solid #555', background: '#111', cursor: 'pointer' }}
      />
    </Field>
  )
}

/** One-line numeric editor: Enter/blur commit (one command), Esc cancels,
 *  invalid input shows an inline error and reverts (never silent).
 *  Optional live preview (C-09): a valid draft pushes a renderer-only preview
 *  while typing; an invalid/empty draft clears it. No engine write until commit. */
function NumberField({ label, value, onCommit, onPreview, min, max, step, testId }: {
  label: string
  value: string
  onCommit: (n: number) => void
  onPreview?: (n: number | null) => void
  min?: number
  max?: number
  step?: number
  testId: string
}) {
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState('')
  useEffect(() => {
    setDraft(value)
    setError('')
  }, [value])

  // clear any live preview when the field unmounts (context switched away)
  useEffect(() => {
    return () => onPreview?.(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const current = value === '' ? null : Number(value)

  const validNumber = (t: string): number | null => {
    const n = Number(t)
    if (t.trim() === '' || !Number.isFinite(n)) return null
    if (min !== undefined && n < min) return null
    if (max !== undefined && n > max) return null
    return n
  }

  const commit = () => {
    const t = draft.trim()
    if (t === '') {
      setDraft(value)
      setError('')
      onPreview?.(null)
      return
    }
    const n = Number(t)
    if (!Number.isFinite(n) || (min !== undefined && n < min) || (max !== undefined && n > max)) {
      setError(`invalid (${min !== undefined ? `≥${min} ` : ''}${max !== undefined ? `≤${max}` : ''})`.trim())
      setDraft(value)
      onPreview?.(null)
      return
    }
    if (current === null || n !== current) onCommit(n)
    setError('')
    onPreview?.(null)
  }

  return (
    <div style={{ marginBottom: 4 }}>
      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <span style={{ color: '#999' }}>{label}</span>
        <input
          data-testid={testId}
          value={draft}
          placeholder={value === '' ? '—' : undefined}
          step={step}
          onChange={(e) => {
            setDraft(e.target.value)
            onPreview?.(validNumber(e.target.value)) // LIVE preview (no engine write)
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') {
              setDraft(value)
              setError('')
              onPreview?.(null)
            }
          }}
          style={{ width: 84, background: '#111', color: '#eee', border: error ? '1px solid #e66' : '1px solid #444', borderRadius: 3, padding: '2px 6px', fontSize: 12 }}
        />
      </label>
      {error && <div data-testid={`${testId}-error`} style={{ color: '#e66', fontSize: 10, marginLeft: 2 }}>{error}</div>}
    </div>
  )
}

function toolHint(tool: string): string {
  switch (tool) {
    case 'rect':
    case 'oval':
      return 'Drag on the Stage to draw. Shift constrains. Fill and stroke below apply to the next shape.'
    case 'line':
    case 'pen':
    case 'pencil':
    case 'brush':
      return 'Stroke color and width apply to the next stroke. Pencil/Brush size is in the options below.'
    case 'text':
      return 'Click the Stage to place text. Fill color is the text color (never white-on-white).'
    case 'bucket':
      return 'Click a fill to paint it with the current Fill color.'
    case 'ink':
      return 'Click a stroke to apply the current Stroke color and width.'
    case 'zoom':
      return 'Click to zoom, Alt-click to zoom out, or drag a region. Use Enlarge/Reduce below.'
    case 'hand':
      return 'Drag the Stage to pan. Spacebar temporarily activates Hand from any tool.'
    case 'eraser':
      return 'Drag over objects to erase them. Size cycles in the options below.'
    default:
      return 'Select an object on the Stage to edit its position, size, and colors here.'
  }
}

function fmt(n: number): string {
  if (!Number.isFinite(n)) return '0'
  return Math.abs(n - Math.round(n)) < 1e-9 ? String(Math.round(n)) : String(Number(n.toFixed(2)))
}
