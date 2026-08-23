import { useEffect, useState } from 'react'
import { loadToolColors, resetToolColors, setToolColors, subscribeToolColors, swapToolColors } from '../toolColors'

/**
 * Tools panel colors area — Adobe-like overlapping fill/stroke swatches.
 * Improved: clearer visual hierarchy, better tooltips, more polished.
 */
export function ToolColors({ vertical = false }: { vertical?: boolean } = {}) {
  const [colors, setColors] = useState(loadToolColors)
  useEffect(() => subscribeToolColors(() => setColors(loadToolColors())), [])

  const swatchBtn = (
    testId: string,
    label: string,
    value: string | null,
    onPick: (c: string) => void,
    isFill: boolean,
  ) => (
    <span style={{ position: 'relative', display: 'inline-block' }} title={`${label} color — ${value ?? 'None'} (click to pick)`}>
      <input
        type="color"
        data-testid={testId}
        aria-label={`${label} color`}
        value={value ?? (isFill ? '#ffffff' : '#000000')}
        onChange={(e) => onPick(e.target.value)}
        style={{
          width: isFill ? 22 : 22,
          height: isFill ? 22 : 22,
          padding: 0,
          border: isFill ? '2px solid #fff' : '1px solid #fff',
          borderRadius: 3,
          background: value ?? 'transparent',
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
          position: isFill ? 'relative' : 'absolute',
          left: isFill ? 0 : 10,
          top: isFill ? 0 : 10,
          zIndex: isFill ? 1 : 2,
        }}
      />
      {value === null && (
        <span
          data-testid={`${testId}-none`}
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            left: isFill ? 0 : 10,
            top: isFill ? 0 : 10,
            width: 22,
            height: 22,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#e66',
            fontSize: 16,
            fontWeight: 700,
            lineHeight: 1,
            background: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(229,85,85,0.2) 3px, rgba(229,85,85,0.2) 6px)',
            borderRadius: 2,
            zIndex: isFill ? 1 : 2,
          }}
        >
          ╱
        </span>
      )}
    </span>
  )

  if (vertical) {
    return (
      <div
        data-testid="tool-colors"
        aria-label="Tool colors"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '4px 0' }}
      >
        <div style={{ position: 'relative', width: 32, height: 32, marginBottom: 2 }}>
          {swatchBtn('tool-fill', 'Fill', colors.fill, (c) => setToolColors({ fill: c }), true)}
          {swatchBtn('tool-stroke', 'Stroke', colors.stroke, (c) => setToolColors({ stroke: c }), false)}
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          <button data-testid="tool-fill-none-btn" title="Fill: no color (transparent)" aria-label="Fill none" onClick={() => setToolColors({ fill: null })} style={miniBtn}>∅F</button>
          <button data-testid="tool-stroke-none-btn" title="Stroke: no color (no stroke)" aria-label="Stroke none" onClick={() => setToolColors({ stroke: null })} style={miniBtn}>∅S</button>
        </div>
        <label style={{ color: '#888', fontSize: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }} title="Stroke width in pixels">
          <span>W</span>
          <input
            type="number"
            data-testid="tool-stroke-width"
            aria-label="Stroke width"
            min={0}
            step={1}
            value={colors.strokeWidth}
            onChange={(e) => setToolColors({ strokeWidth: Math.max(0, Number(e.target.value) || 0) })}
            style={{ width: 36, background: '#111', color: '#eee', border: '1px solid #444', borderRadius: 3, fontSize: 10, padding: '1px 3px', textAlign: 'center' }}
          />
        </label>
        <div style={{ display: 'flex', gap: 2 }}>
          <button data-testid="tool-colors-swap" title="Swap fill and stroke colors (like Adobe X)" onClick={() => swapToolColors()} style={miniBtn}>⇄</button>
          <button data-testid="tool-colors-default" title="Default colors — black stroke, white fill (D)" onClick={() => resetToolColors()} style={miniBtn}>D</button>
        </div>
      </div>
    )
  }

  return (
    <div data-testid="tool-colors" aria-label="Tool colors" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px' }}>
      <div style={{ position: 'relative', width: 32, height: 22, display: 'inline-flex' }}>
        {swatchBtn('tool-fill', 'Fill', colors.fill, (c) => setToolColors({ fill: c }), true)}
        {swatchBtn('tool-stroke', 'Stroke', colors.stroke, (c) => setToolColors({ stroke: c }), false)}
      </div>
      <button data-testid="tool-fill-none-btn" title="Fill: no color" aria-label="Fill none" onClick={() => setToolColors({ fill: null })} style={btn}>∅F</button>
      <button data-testid="tool-stroke-none-btn" title="Stroke: no color" aria-label="Stroke none" onClick={() => setToolColors({ stroke: null })} style={btn}>∅S</button>
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
      <button data-testid="tool-colors-swap" title="Swap fill and stroke" onClick={() => swapToolColors()} style={btn}>⇄</button>
      <button data-testid="tool-colors-default" title="Default colors" onClick={() => resetToolColors()} style={btn}>⭯</button>
    </div>
  )
}

const btn: React.CSSProperties = {
  padding: '1px 5px',
  borderRadius: 3,
  border: '1px solid #444',
  background: '#2a2a2a',
  color: '#ddd',
  cursor: 'pointer',
  fontSize: 11,
}
const miniBtn: React.CSSProperties = {
  ...btn,
  padding: '1px 3px',
  fontSize: 9,
  minWidth: 18,
}
