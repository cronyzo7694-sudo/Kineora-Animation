import { useEffect, useRef, useState } from 'react'
import { loadToolColors, resetToolColors, setToolColors, subscribeToolColors, swapToolColors } from '../toolColors'

/**
 * The Tools panel "colors area" (Blueprint Part 01 §1.3.1: "Stroke chip, Fill
 * chip, swap button, black&white, no-color — clicking a chip opens Color
 * picker (Part 23); default fill/stroke for new shapes").
 *
 * Layout contract (the rail carries BUTTONS ONLY):
 *   - Fill chip + Stroke chip + Black&White (reset) + Swap are buttons on the
 *     rail; clicking a chip opens its color popover (picker + No color).
 *   - The stroke WIDTH is numeric — numerics never live on the rail, so it
 *     opens in a popover from the "W" modifier button (or lives in the
 *     Properties panel), and feeds the Ink Bottle / shape tools.
 *
 * These swatches are AUTHORING state: they decide what the shape tools draw
 * and what the Paint Bucket / Ink Bottle apply. They never touch the document
 * by themselves, so they create no undo entry and never dirty a file.
 */

type PopTarget = 'fill' | 'stroke' | 'width'

export function ToolColors({ vertical = false }: { vertical?: boolean } = {}) {
  const [colors, setColors] = useState(loadToolColors)
  const [open, setOpen] = useState<PopTarget | null>(null)
  const [anchorTop, setAnchorTop] = useState(2)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => subscribeToolColors(() => setColors(loadToolColors())), [])

  // Popover hygiene: outside pointer closes, Esc closes (capture so the stage
  // never treats it as a draw-cancel while a color popover is open).
  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      setOpen(null)
    }
    document.addEventListener('pointerdown', onPointer, true)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('pointerdown', onPointer, true)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  const toggle = (target: PopTarget, el: HTMLElement) => {
    const root = rootRef.current
    if (root && vertical) {
      setAnchorTop(Math.max(2, el.getBoundingClientRect().top - root.getBoundingClientRect().top))
    }
    setOpen((o) => (o === target ? null : target))
  }

  const chip = (target: 'fill' | 'stroke', label: string, value: string | null) => (
    <button
      key={target}
      data-testid={`tool-${target}-chip`}
      data-open={open === target ? 'true' : 'false'}
      aria-label={`${label} color (click for picker)`}
      aria-expanded={open === target}
      title={`${label} color — click to change`}
      onClick={(e) => toggle(target, e.currentTarget)}
      style={{
        position: 'relative',
        width: 26,
        height: 19,
        padding: 0,
        borderRadius: 3,
        border: open === target ? '1px solid #5a8fc0' : '1px solid #666',
        background: value ?? '#151515',
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    >
      {value === null && (
        <span
          data-testid={`tool-${target}-none`}
          aria-hidden
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e66', fontSize: 15, lineHeight: 1 }}
        >
          ╱
        </span>
      )}
    </button>
  )

  const small = (testId: string, label: string, title: string, onClick: (el: HTMLElement) => void) => (
    <button
      data-testid={testId}
      aria-label={title}
      title={title}
      onClick={(e) => onClick(e.currentTarget)}
      style={{
        minWidth: 16,
        height: 19,
        padding: '0 3px',
        borderRadius: 3,
        border: '1px solid #555',
        background: '#2a2a2a',
        color: '#eee',
        cursor: 'pointer',
        fontSize: 11,
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {label}
    </button>
  )

  const popValue = open === 'fill' ? colors.fill : colors.stroke

  return (
    <div
      ref={rootRef}
      data-testid="tool-colors"
      aria-label="Tool colors"
      style={
        vertical
          ? { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '2px 0', position: 'relative' }
          : { display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px', position: 'relative' }
      }
    >
      {chip('fill', 'Fill', colors.fill)}
      {chip('stroke', 'Stroke', colors.stroke)}
      <span style={{ display: 'inline-flex', gap: 3 }}>
        {small('tool-colors-swap', '⇄', 'Swap fill and stroke colors', () => swapToolColors())}
        {small('tool-colors-default', '⬛', 'Black & White (default: black stroke, white fill)', () => resetToolColors())}
        {small('tool-stroke-width-btn', 'W', 'Stroke width… (opens the numeric field)', (el) => toggle('width', el))}
      </span>

      {open && (
        <div
          data-testid="tool-color-popover"
          role="dialog"
          aria-label={open === 'width' ? 'Stroke width' : open === 'fill' ? 'Fill color' : 'Stroke color'}
          style={
            vertical
              ? { position: 'absolute', left: 'calc(100% + 6px)', top: anchorTop, zIndex: 40 }
              : { position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 40 }
          }
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#1a1a1a',
              border: '1px solid #444',
              borderRadius: 5,
              padding: 6,
              boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
              whiteSpace: 'nowrap',
            }}
          >
            {open === 'width' ? (
              <label style={{ color: '#bbb', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                Stroke width
                <input
                  type="number"
                  data-testid="tool-stroke-width"
                  aria-label="Stroke width"
                  min={0}
                  step={1}
                  value={colors.strokeWidth}
                  onChange={(e) => setToolColors({ strokeWidth: Number(e.target.value) })}
                  autoFocus
                  style={{ width: 52, background: '#111', color: '#eee', border: '1px solid #444', borderRadius: 3, fontSize: 11, padding: '2px 4px' }}
                />
              </label>
            ) : (
              <>
                <input
                  type="color"
                  data-testid={open === 'fill' ? 'tool-fill' : 'tool-stroke'}
                  aria-label={open === 'fill' ? 'Fill color' : 'Stroke color'}
                  value={popValue ?? '#000000'}
                  onChange={(e) => (open === 'fill' ? setToolColors({ fill: e.target.value }) : setToolColors({ stroke: e.target.value }))}
                  style={{ width: 40, height: 26, padding: 0, border: '1px solid #555', borderRadius: 3, background: '#111', cursor: 'pointer' }}
                />
                <button
                  data-testid={open === 'fill' ? 'tool-fill-none-btn' : 'tool-stroke-none-btn'}
                  aria-label={`${open === 'fill' ? 'Fill' : 'Stroke'}: no color`}
                  onClick={() => (open === 'fill' ? setToolColors({ fill: null }) : setToolColors({ stroke: null }))}
                  style={{ padding: '2px 6px', borderRadius: 3, border: '1px solid #555', background: '#2a2a2a', color: '#eee', cursor: 'pointer', fontSize: 11 }}
                >
                  ∅ No color
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
