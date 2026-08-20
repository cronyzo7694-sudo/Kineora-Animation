import { useState } from 'react'
import { evaluate, exportSvgScaled, statusJson } from '../engine/client'
import { downloadBlob, downloadCanvasBlob } from '../engine/actions'
import { rasterizeContent } from '../render/canvasRenderer'
import type { EngineStatus } from '../controlRegistry'

export type ExportFormat = 'svg' | 'png' | 'jpeg' | 'webp'

interface Props {
  open: boolean
  engine: EngineStatus
  onClose: () => void
  notify: (msg: string) => void
}

const FORMATS: Array<{ id: ExportFormat; label: string; ext: string; mime: string }> = [
  { id: 'svg', label: 'SVG (vector)', ext: 'svg', mime: 'image/svg+xml' },
  { id: 'png', label: 'PNG (raster)', ext: 'png', mime: 'image/png' },
  { id: 'jpeg', label: 'JPEG (raster)', ext: 'jpg', mime: 'image/jpeg' },
  { id: 'webp', label: 'WebP (raster)', ext: 'webp', mime: 'image/webp' },
]
const SCALES = [1, 2, 4]

/**
 * Export dialog (C-31 `exp.image`: Export Image — PNG/JPEG/SVG/WebP; Part 28.1
 * scale 1×/2×/4×). Exports the CURRENT frame from real engine state. Vector
 * (SVG) goes through the Rust exporter; raster formats reuse the same
 * `evaluate()` items through the content-only rasterizer, so authoring = export
 * and overlays/pasteboard/zoom/pan/selection never leak (REQ-EXP-002). Export
 * is non-mutating (no undo). Engine-not-attached = honest disabled state.
 */
export function ExportDialog({ open, engine, onClose, notify }: Props) {
  const [format, setFormat] = useState<ExportFormat>('svg')
  const [scale, setScale] = useState(1)

  if (!open) return null
  const attached = engine.kind === 'ok'
  const status = statusJson()
  const frame = status?.playhead ?? 1

  const doExport = () => {
    if (!attached) {
      notify('export: engine not attached')
      return
    }
    const f = FORMATS.find((x) => x.id === format)!
    if (format === 'svg') {
      const svg = exportSvgScaled(frame, scale)
      if (!svg) {
        notify('export: engine returned no SVG')
        return
      }
      downloadBlob(`kineora.${f.ext}`, svg, f.mime)
      notify(`export: downloaded kineora.${f.ext} (${scale}×)`)
    } else {
      const items = evaluate(frame)
      const st = statusJson()
      const canvas = rasterizeContent(
        {
          background: st?.background ?? '#ffffff',
          stageW: st?.doc_width ?? 1920,
          stageH: st?.doc_height ?? 1080,
          items,
        },
        scale,
      )
      if (!canvas) {
        notify('export: rasterizer unavailable (no 2D context)')
        return
      }
      const quality = format === 'jpeg' ? 0.92 : undefined
      downloadCanvasBlob(canvas, `kineora.${f.ext}`, f.mime, quality)
      notify(`export: downloaded kineora.${f.ext} (${canvas.width}×${canvas.height})`)
    }
    onClose()
  }

  return (
    <div data-testid="export-dialog" role="dialog" aria-label="Export image" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
      <div style={{ background: '#1e1e1e', border: '1px solid #444', borderRadius: 8, padding: 16, width: 300, color: '#ddd', fontSize: 13 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#fff' }}>Export image — frame {frame}</h3>

        <label style={{ display: 'block', marginBottom: 10 }}>
          <span style={{ color: '#999', display: 'block', marginBottom: 3 }}>Format</span>
          <select data-testid="export-format" value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)} style={{ width: '100%', background: '#111', color: '#eee', border: '1px solid #444', borderRadius: 3, padding: 4 }}>
            {FORMATS.map((x) => (
              <option key={x.id} value={x.id}>{x.label}</option>
            ))}
          </select>
        </label>

        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ color: '#999', display: 'block', marginBottom: 3 }}>Scale</span>
          <select data-testid="export-scale" value={scale} onChange={(e) => setScale(Number(e.target.value))} style={{ width: '100%', background: '#111', color: '#eee', border: '1px solid #444', borderRadius: 3, padding: 4 }}>
            {SCALES.map((s) => (
              <option key={s} value={s}>{s}×</option>
            ))}
          </select>
        </label>

        {!attached && (
          <div data-testid="export-not-attached" style={{ color: '#e66', marginBottom: 10, fontSize: 12 }}>
            Engine not attached — export unavailable.
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button data-testid="export-cancel" onClick={onClose} style={{ padding: '5px 12px', borderRadius: 4, border: '1px solid #555', background: '#2a2a2a', color: '#eee', cursor: 'pointer' }}>Cancel</button>
          <button data-testid="export-confirm" disabled={!attached} onClick={doExport} style={{ padding: '5px 12px', borderRadius: 4, border: '1px solid #0a7cff', background: '#0a3f7f', color: '#fff', cursor: attached ? 'pointer' : 'not-allowed' }}>Export</button>
        </div>
      </div>
    </div>
  )
}
