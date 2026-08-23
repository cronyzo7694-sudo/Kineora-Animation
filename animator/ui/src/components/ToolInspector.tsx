import { useEffect, useState, type CSSProperties } from 'react'
import {
  addAnchorOnSegment,
  convertAnchors,
  deleteSelectedAnchors,
  endInkEdit,
  listInk,
  selectedAnchors,
  setAnchorXY,
  subscribeInk,
} from '../editor/inkStore'
import { loadToolColors, setToolColors, subscribeToolColors } from '../toolColors'
import { loadToolOptions, setToolOptions, subscribeToolOptions } from '../toolOptions'
import { SelectionActions } from './SelectionActions'
import { ToolColors } from './ToolColors'
import { ToolOptions } from './ToolOptions'

const LABELS: Record<string, string> = {
  select: 'Selection Tool',
  subselect: 'Subselection Tool',
  transform: 'Free Transform Tool',
  lasso: 'Lasso Tool',
  pen: 'Pen Tool',
  text: 'Text Tool',
  line: 'Line Tool',
  rect: 'Rectangle Tool',
  oval: 'Oval Tool',
  pencil: 'Pencil Tool',
  brush: 'Brush Tool',
  bucket: 'Paint Bucket Tool',
  ink: 'Ink Bottle Tool',
  eyedropper: 'Eyedropper Tool',
  eraser: 'Eraser Tool',
  hand: 'Hand Tool',
  zoom: 'Zoom Tool',
}

export function toolLabel(tool: string): string {
  return LABELS[tool] ?? tool
}

function hint(tool: string): string {
  switch (tool) {
    case 'rect':
      return 'Drag to draw a rectangle. Shift = square. Alt = from center. Fill + Stroke apply to the next shape.'
    case 'oval':
      return 'Drag to draw an oval. Shift = circle. Alt = from center. Fill + Stroke apply to the next shape.'
    case 'line':
      return 'Click-drag a two-point line. Shift constrains to H/V. Stroke color and width apply.'
    case 'pen':
      return 'Click anchors. Enter finishes, Shift+Enter closes with fill. Esc cancels.'
    case 'pencil':
      return 'Freehand stroke. Size and stroke color apply to the next line.'
    case 'brush':
      return 'Thick freehand stroke. Size and stroke color apply to the next brush mark.'
    case 'text':
      return 'Click the Stage to place text. Fill is the text color. Set size below.'
    case 'bucket':
      return 'Click a fill to paint it with the current Fill color.'
    case 'ink':
      return 'Click a stroke to apply the current Stroke color and width.'
    case 'eyedropper':
      return 'Click an object to pick up its fill and stroke, then switches to Paint Bucket.'
    case 'eraser':
      return 'Drag over objects to erase them. Size is the hit radius.'
    case 'zoom':
      return 'Click to zoom, Alt-click to reverse, or drag a region. Enlarge / Reduce below.'
    case 'hand':
      return 'Drag the Stage to pan. Hold Space from any tool for a temporary Hand.'
    case 'lasso':
      return 'Drag a freeform loop to select objects inside it.'
    case 'subselect':
      return 'Click a path to show squares. Drag a square to move it (Shift-click several). Alt-drag a corner to pull Bezier handles. Double-click a segment to add a point. Delete removes selected points. Arrows nudge 1px (Shift=10).'
    case 'transform':
      return 'Select an object, then drag handles to scale or the circle to rotate.'
    case 'select':
      return 'Click to select. Drag a corner/edge square to resize, the top circle to rotate freely. Drag inside the box to move. Shift/Ctrl-click adds. Properties also has 90° rotate / flip.'
    default:
      return 'Click an object to inspect its position, size, fill and stroke.'
  }
}

function usesFill(tool: string): boolean {
  return ['rect', 'oval', 'pen', 'text', 'bucket', 'eyedropper'].includes(tool)
}

function usesStroke(tool: string): boolean {
  return ['rect', 'oval', 'line', 'pen', 'pencil', 'brush', 'ink', 'eyedropper'].includes(tool)
}

function usesSize(tool: string): boolean {
  return ['pencil', 'brush', 'eraser'].includes(tool)
}

function usesTextSize(tool: string): boolean {
  return tool === 'text'
}

function usesZoom(tool: string): boolean {
  return tool === 'zoom'
}

const field: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8 }
const input: CSSProperties = { width: 72, background: '#111', color: '#eee', border: '1px solid #444', borderRadius: 3, padding: '2px 6px', fontSize: 12 }

/**
 * Adobe-style per-tool inspector. Only the modifiers that belong to the
 * active tool are shown — Rectangle does not show text size, Zoom does not
 * show fill chips, etc.
 */
export function ToolInspector({ tool, notify }: { tool: string; notify?: (msg: string) => void }) {
  const [colors, setColors] = useState(loadToolColors)
  const [opts, setOpts] = useState(loadToolOptions)
  useEffect(() => subscribeToolColors(() => setColors(loadToolColors())), [])
  useEffect(() => subscribeToolOptions(() => setOpts(loadToolOptions())), [])

  return (
    <div data-testid="props-tool">
      <div style={{ color: '#888', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6, margin: '4px 0 6px', borderBottom: '1px solid #333', paddingBottom: 2 }}>
        Tool
      </div>
      <div data-testid="props-tool-name" style={{ color: '#8ec8ff', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
        {toolLabel(tool)}
      </div>
      <p data-testid="props-tool-hint" style={{ margin: '0 0 10px', color: '#888', fontSize: 11, lineHeight: 1.45 }}>
        {hint(tool)}
      </p>

      {(usesFill(tool) || usesStroke(tool)) && (
        <div style={{ background: '#191919', border: '1px solid #333', borderRadius: 6, padding: '8px 8px 6px', marginBottom: 8 }}>
          <div style={{ color: '#888', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
            {usesFill(tool) && usesStroke(tool) ? 'Fill / Stroke' : usesFill(tool) ? 'Fill' : 'Stroke'}
          </div>
          <ToolColors />
          {usesStroke(tool) && (
            <label style={field}>
              <span style={{ color: '#999' }}>Stroke width</span>
              <input
                data-testid="prop-tool-stroke-width"
                type="number"
                min={0}
                max={64}
                value={colors.strokeWidth}
                onChange={(e) => setToolColors({ strokeWidth: Math.max(0, Number(e.target.value) || 0) })}
                style={input}
              />
            </label>
          )}
        </div>
      )}

      {usesSize(tool) && (
        <label style={field}>
          <span style={{ color: '#999' }}>{tool === 'eraser' ? 'Eraser size' : 'Size'}</span>
          <input
            data-testid="prop-tool-size"
            type="range"
            min={tool === 'brush' ? 8 : 1}
            max={tool === 'brush' ? 48 : 32}
            value={opts.inkSize}
            onChange={(e) => setToolOptions({ inkSize: Number(e.target.value) })}
            style={{ flex: 1, accentColor: '#0a7cff' }}
          />
          <span data-testid="prop-tool-size-val" style={{ width: 28, textAlign: 'right', color: '#ddd' }}>{opts.inkSize}</span>
        </label>
      )}

      {usesTextSize(tool) && (
        <label style={field}>
          <span style={{ color: '#999' }}>Font size</span>
          <input
            data-testid="prop-tool-font-size"
            type="number"
            min={8}
            max={200}
            value={opts.fontSize}
            onChange={(e) => setToolOptions({ fontSize: Math.max(8, Number(e.target.value) || 24) })}
            style={input}
          />
        </label>
      )}

      {usesZoom(tool) && <ToolOptions tool="zoom" />}
      {tool === 'select' && (
        <>
          <ToolOptions tool="select" />
          <SelectionActions notify={notify ?? (() => {})} />
        </>
      )}
      {tool === 'transform' && <SelectionActions notify={notify ?? (() => {})} />}
      {tool === 'subselect' && <SubselectFields notify={notify ?? (() => {})} />}

      {(tool === 'pencil' || tool === 'brush' || tool === 'eraser') && (
        <div style={{ marginTop: 4 }}>
          <ToolOptions tool={tool} />
        </div>
      )}
    </div>
  )
}
