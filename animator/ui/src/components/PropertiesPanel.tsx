import { useEffect, useState } from 'react'
import { patchTransforms, setDocumentSettings, setNodeProps } from '../engine/client'
import type { SelDetailJson, StatusJson } from '../engine/wasmTypes'

interface Props {
  status: StatusJson | null
  notify: (msg: string) => void
}

/**
 * Properties panel (Part 26 / C-09) — context-bound inspector.
 * Precedence for slice-1 (REQ-PRP-001): stage selection (single → object
 * schema; multi → common fields X/Y/W/H + "mixed" badge) → document schema
 * (nothing selected). Tool-options schema is a later unit.
 * Every commit = one engine command (one undo entry); Enter/blur commit,
 * Esc cancels, invalid input reverts with an inline error (never silent).
 */
export function PropertiesPanel({ status, notify }: Props) {
  const attached = status !== null
  const details: SelDetailJson[] = status?.selection_details ?? []
  const single = details.length === 1 ? details[0] : null
  const multi = details.length > 1

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
    setNodeProps(details.map((d) => ({ id: d.id, [field]: value })))
  }

  const commitFill = (color: string) => {
    if (!guard('edit fill')) return
    setNodeProps(details.map((d) => ({ id: d.id, fill: color })))
  }

  const commitStrokeEnabled = (enabled: boolean, color: string) => {
    if (!guard('edit stroke')) return
    setNodeProps(details.map((d) => ({ id: d.id, stroke_enabled: enabled, stroke: color })))
  }

  const commitStrokeWidth = (value: number) => {
    if (!guard('edit stroke')) return
    setNodeProps(details.map((d) => ({ id: d.id, stroke_width: value })))
  }

  const commitDoc = (patch: { width?: number; height?: number; fps?: number; background?: string }) => {
    if (!guard('edit document')) return
    setDocumentSettings(patch)
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

  const contextChip = !attached ? '—' : details.length === 0 ? 'Document' : multi ? `Objects (${details.length})` : 'Object'

  return (
    <aside data-testid="properties-panel" aria-label="Properties" style={{ width: 220, background: '#1e1e1e', borderLeft: '1px solid #333', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderBottom: '1px solid #333' }}>
        <span style={{ color: '#ddd', fontSize: 12, fontWeight: 700 }}>Properties</span>
        <span data-testid="props-context" style={{ color: '#8ef', fontSize: 11, background: '#2a2a2a', padding: '1px 8px', borderRadius: 8 }}>{contextChip}</span>
      </div>

      <div style={{ padding: 8, overflowY: 'auto', flex: 1, fontSize: 12, color: '#bbb' }}>
        {!attached && (
          <div data-testid="props-empty" style={{ color: '#e66' }}>Properties unavailable — engine not attached.</div>
        )}

        {attached && details.length === 0 && (
          <div>
            <SectionTitle>Document</SectionTitle>
            <NumberField testId="doc-width" label="Width" value={status ? fmt(status.doc_width) : ''} min={2} onCommit={(n) => commitDoc({ width: n })} />
            <NumberField testId="doc-height" label="Height" value={status ? fmt(status.doc_height) : ''} min={2} onCommit={(n) => commitDoc({ height: n })} />
            <NumberField testId="doc-fps" label="Frame rate (fps)" value={status ? String(status.fps) : ''} min={1} max={120} step={1} onCommit={(n) => commitDoc({ fps: Math.round(n) })} />
            <Field label="Background">
              <input
                type="color"
                data-testid="doc-bg"
                value={status?.background ?? '#ffffff'}
                onBlur={(e) => commitDoc({ background: e.target.value })}
                style={{ width: 40, height: 22, border: '1px solid #555', background: '#111', cursor: 'pointer' }}
              />
            </Field>
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
            <NumberField testId="prop-x" label="X" value={sharedX === null ? '' : fmt(sharedX)} onCommit={(n) => commitTransform('x', n)} />
            <NumberField testId="prop-y" label="Y" value={sharedY === null ? '' : fmt(sharedY)} onCommit={(n) => commitTransform('y', n)} />
            <NumberField testId="prop-w" label="W" value={sharedW === null ? '' : fmt(sharedW)} min={0} onCommit={(n) => commitBase('width', n)} />
            <NumberField testId="prop-h" label="H" value={sharedH === null ? '' : fmt(sharedH)} min={0} onCommit={(n) => commitBase('height', n)} />

            {single && (
              <>
                <SectionTitle>Transform</SectionTitle>
                <NumberField testId="prop-rotation" label="Rotation (°)" value={fmt(single.rotation)} onCommit={(n) => commitTransform('rotation', n)} />
                <NumberField testId="prop-scale-x" label="Scale X (%)" value={fmt(single.scale_x * 100)} onCommit={(n) => commitScale('scale_x', n)} />
                <NumberField testId="prop-scale-y" label="Scale Y (%)" value={fmt(single.scale_y * 100)} onCommit={(n) => commitScale('scale_y', n)} />

                <SectionTitle>Fill</SectionTitle>
                <Field label="Fill color">
                  <input type="color" data-testid="prop-fill" value={single.fill} onBlur={(e) => commitFill(e.target.value)} style={{ width: 40, height: 22, border: '1px solid #555', background: '#111', cursor: 'pointer' }} />
                </Field>

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
                    <Field label="Stroke color">
                      <input type="color" data-testid="prop-stroke" value={single.stroke} onBlur={(e) => commitStrokeEnabled(true, e.target.value)} style={{ width: 40, height: 22, border: '1px solid #555', background: '#111', cursor: 'pointer' }} />
                    </Field>
                    <NumberField testId="prop-stroke-width" label="Stroke width" value={fmt(single.stroke_width)} min={0} onCommit={(n) => commitStrokeWidth(n)} />
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
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

/** One-line numeric editor: Enter/blur commit (one command), Esc cancels,
 *  invalid input shows an inline error and reverts (never silent). */
function NumberField({ label, value, onCommit, min, max, step, testId }: {
  label: string
  value: string
  onCommit: (n: number) => void
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

  const current = value === '' ? null : Number(value)

  const commit = () => {
    const t = draft.trim()
    if (t === '') {
      setDraft(value)
      setError('')
      return
    }
    const n = Number(t)
    if (!Number.isFinite(n) || (min !== undefined && n < min) || (max !== undefined && n > max)) {
      setError(`invalid (${min !== undefined ? `≥${min} ` : ''}${max !== undefined ? `≤${max}` : ''})`.trim())
      setDraft(value)
      return
    }
    if (current === null || n !== current) onCommit(n)
    setError('')
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
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') {
              setDraft(value)
              setError('')
            }
          }}
          style={{ width: 84, background: '#111', color: '#eee', border: error ? '1px solid #e66' : '1px solid #444', borderRadius: 3, padding: '2px 6px', fontSize: 12 }}
        />
      </label>
      {error && <div data-testid={`${testId}-error`} style={{ color: '#e66', fontSize: 10, marginLeft: 2 }}>{error}</div>}
    </div>
  )
}

function fmt(n: number): string {
  if (!Number.isFinite(n)) return '0'
  return Math.abs(n - Math.round(n)) < 1e-9 ? String(Math.round(n)) : String(Number(n.toFixed(2)))
}
