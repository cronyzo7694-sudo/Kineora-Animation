import { useEffect, useState } from 'react'
import { loadToolColors, resetToolColors, setToolColors, subscribeToolColors, swapToolColors } from '../toolColors'

/**
 * The Tools panel "colors area" (Adobe: "the colors area contains modifiers for
 * stroke and fill colors… controls for quickly resetting colors to the default,
 * setting the stroke and fill color settings to None, and swapping fill and
 * stroke colors").
 *
 * These swatches are AUTHORING state: they decide what the Rectangle tool
 * draws and what the Paint Bucket / Ink Bottle apply. They never touch the
 * document by themselves, so they create no undo entry and never dirty a file.
 */
export function ToolColors({ vertical = false }: { vertical?: boolean } = {}) {
  const [colors, setColors] = useState(loadToolColors)
  useEffect(() => subscribeToolColors(() => setColors(loadToolColors())), [])

  const swatch = (
    testId: string,
    label: string,
    value: string | null,
    onPick: (c: string) => void,
    onNone: () => void,
  ) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }} title={`${label} color`}>
      {!vertical && <span style={{ color: '#888', fontSize: 11 }}>{label}</span>}
      <span style={{ position: 'relative', display: 'inline-block' }}>
        <input
          type="color"
          data-testid={testId}
          aria-label={`${label} color`}
          value={value ?? '#000000'}
          onChange={(e) => onPick(e.target.value)}
          style={{ width: 24, height: 20, padding: 0, border: '1px solid #555', borderRadius: 3, background: '#111', cursor: 'pointer' }}
        />
        {value === null && (
          <span
            data-testid={`${testId}-none`}
            aria-hidden
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e66', fontSize: 14, lineHeight: 1 }}
          >
            ╱
          </span>
        )}
      </span>
      <button
        data-testid={`${testId}-none-btn`}
        title={`${label}: no color`}
        aria-label={`${label} none`}
        onClick={onNone}
        style={btn}
      >
        ∅
      </button>
    </span>
  )

  return (
    <div
      data-testid="tool-colors"
      aria-label="Tool colors"
      style={
        vertical
          ? { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '2px 0' }
          : { display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px' }
      }
    >
      {swatch('tool-fill', 'Fill', colors.fill, (c) => setToolColors({ fill: c }), () => setToolColors({ fill: null }))}
      {swatch('tool-stroke', 'Stroke', colors.stroke, (c) => setToolColors({ stroke: c }), () => setToolColors({ stroke: null }))}
      <label style={{ color: '#888', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        W
        <input
          type="number"
          data-testid="tool-stroke-width"
          aria-label="Stroke width"
          min={0}
          step={1}
          value={colors.strokeWidth}
          onChange={(e) => setToolColors({ strokeWidth: Number(e.target.value) })}
          style={{ width: 44, background: '#111', color: '#eee', border: '1px solid #444', borderRadius: 3, fontSize: 11, padding: '1px 3px' }}
        />
      </label>
      <button data-testid="tool-colors-swap" title="Swap fill and stroke colors" onClick={() => swapToolColors()} style={btn}>
        ⇄
      </button>
      <button data-testid="tool-colors-default" title="Reset to default colors (black stroke, white fill)" onClick={() => resetToolColors()} style={btn}>
        ⭯
      </button>
    </div>
  )
}

const btn: React.CSSProperties = {
  padding: '1px 5px',
  borderRadius: 3,
  border: '1px solid #555',
  background: '#2a2a2a',
  color: '#eee',
  cursor: 'pointer',
  fontSize: 11,
}
