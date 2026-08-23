import { useEffect, useRef, useState } from 'react'
import { loadToolColors, resetToolColors, setToolColors, subscribeToolColors, swapToolColors } from '../toolColors'

type Pop = 'fill' | 'stroke' | 'width' | null

/**
 * Tools-panel colors area — Adobe Animate: overlapping Fill/Stroke chips,
 * swap, black&white, no-color. Click a chip → picker popover. Stroke width
 * lives on a W button, never as a loose number on the 36px rail.
 */
export function ToolColors({ vertical = false }: { vertical?: boolean } = {}) {
  const [colors, setColors] = useState(loadToolColors)
  const [pop, setPop] = useState<Pop>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => subscribeToolColors(() => setColors(loadToolColors())), [])

  useEffect(() => {
    if (!pop) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPop(null)
    }
    const onPtr = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setPop(null)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPtr)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPtr)
    }
  }, [pop])

  const toggle = (next: Pop) => setPop((p) => (p === next ? null : next))

  const chip = (which: 'fill' | 'stroke', testId: string, value: string | null) => {
    const isFill = which === 'fill'
    return (
      <button
        type="button"
        data-testid={testId}
        aria-label={`${isFill ? 'Fill' : 'Stroke'} color`}
        title={`${isFill ? 'Fill' : 'Stroke'} — ${value ?? 'None'} (click to pick)`}
        onClick={() => toggle(which)}
        style={{
          width: 18,
          height: 18,
          padding: 0,
          border: isFill ? '2px solid #fff' : '1.5px solid #ddd',
          borderRadius: 2,
          background: value ?? '#2a2a2a',
          cursor: 'pointer',
          position: 'absolute',
          left: isFill ? 0 : 10,
          top: isFill ? 0 : 10,
          zIndex: isFill ? 1 : 2,
          boxShadow: '0 1px 3px rgba(0,0,0,0.55)',
        }}
      >
        {value === null && (
          <span
            data-testid={which === 'fill' ? 'tool-fill-none' : 'tool-stroke-none'}
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#e66',
              fontSize: 13,
              fontWeight: 700,
              background: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(229,85,85,0.25) 3px, rgba(229,85,85,0.25) 6px)',
            }}
          >
            ╱
          </span>
        )}
      </button>
    )
  }

  const popover = (
    <div
      data-testid="tool-color-popover"
      style={{
        position: 'absolute',
        left: 38,
        bottom: 4,
        zIndex: 40,
        background: '#1c1c1c',
        border: '1px solid #444',
        borderRadius: 6,
        padding: 8,
        minWidth: 150,
        boxShadow: '0 8px 22px rgba(0,0,0,0.55)',
      }}
    >
      {pop === 'fill' || pop === 'stroke' ? (
        <>
          <div style={{ color: '#aaa', fontSize: 10, marginBottom: 6 }}>{pop === 'fill' ? 'Fill color' : 'Stroke color'}</div>
          <input
            type="color"
            data-testid={pop === 'fill' ? 'tool-fill' : 'tool-stroke'}
            aria-label={pop === 'fill' ? 'Fill color' : 'Stroke color'}
            value={pop === 'fill' ? (colors.fill ?? '#ffffff') : (colors.stroke ?? '#000000')}
            onChange={(e) => setToolColors(pop === 'fill' ? { fill: e.target.value } : { stroke: e.target.value })}
            style={{ width: '100%', height: 28, padding: 0, border: '1px solid #333', background: 'transparent', cursor: 'pointer' }}
          />
          <button
            data-testid={pop === 'fill' ? 'tool-fill-none-btn' : 'tool-stroke-none-btn'}
            onClick={() => setToolColors(pop === 'fill' ? { fill: null } : { stroke: null })}
            style={popBtn}
          >
            No color
          </button>
        </>
      ) : (
        <>
          <div style={{ color: '#aaa', fontSize: 10, marginBottom: 6 }}>Stroke width</div>
          <input
            type="number"
            data-testid="tool-stroke-width"
            aria-label="Stroke width"
            min={0}
            step={1}
            value={colors.strokeWidth}
            onChange={(e) => setToolColors({ strokeWidth: Math.max(0, Number(e.target.value) || 0) })}
            style={{ width: '100%', background: '#111', color: '#eee', border: '1px solid #444', borderRadius: 3, fontSize: 12, padding: '4px 6px' }}
          />
        </>
      )}
    </div>
  )

  return (
    <div
      ref={rootRef}
      data-testid="tool-colors"
      aria-label="Tool colors"
      style={{
        display: 'flex',
        flexDirection: vertical ? 'column' : 'row',
        alignItems: 'center',
        gap: vertical ? 5 : 8,
        padding: vertical ? '4px 0' : '0 8px',
        position: 'relative',
      }}
    >
      <div style={{ position: 'relative', width: 30, height: 30, flexShrink: 0 }}>
        {chip('fill', 'tool-fill-chip', colors.fill)}
        {chip('stroke', 'tool-stroke-chip', colors.stroke)}
      </div>
      <div style={{ display: 'flex', flexDirection: vertical ? 'column' : 'row', gap: 2, alignItems: 'center' }}>
        <button data-testid="tool-colors-swap" title="Swap fill and stroke (X)" onClick={() => swapToolColors()} style={mini}>
          ⇄
        </button>
        <button data-testid="tool-colors-default" title="Default colors — white fill, black stroke (D)" onClick={() => resetToolColors()} style={mini}>
          D
        </button>
        <button data-testid="tool-stroke-width-btn" title={`Stroke width ${colors.strokeWidth}px`} onClick={() => toggle('width')} style={mini}>
          W
        </button>
      </div>
      {pop && popover}
    </div>
  )
}

const mini: React.CSSProperties = {
  padding: 0,
  width: 20,
  height: 16,
  borderRadius: 3,
  border: '1px solid #3a3a3a',
  background: '#252525',
  color: '#ccc',
  cursor: 'pointer',
  fontSize: 10,
}
const popBtn: React.CSSProperties = {
  marginTop: 6,
  width: '100%',
  padding: '4px 6px',
  borderRadius: 3,
  border: '1px solid #444',
  background: '#2a2a2a',
  color: '#ddd',
  cursor: 'pointer',
  fontSize: 11,
}
