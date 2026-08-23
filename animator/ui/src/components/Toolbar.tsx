import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { AppContext, Control } from '../controlRegistry'

const GAP = 6
const MORE_W = 64

/**
 * Pure overflow math (unit-tested): how many of `widths` fit into `avail`
 * leaving room for a "More" button when the rest would overflow.
 */
export function computeVisibleCount(widths: number[], avail: number, gap = GAP, moreW = MORE_W): number {
  if (widths.length === 0) return 0
  // No meaningful measurement (e.g. layout not yet done / test environment) →
  // show everything; overflow is only collapsed when we can actually measure.
  if (avail <= 0) return widths.length
  const total = widths.reduce((a, b) => a + b, 0) + gap * (widths.length - 1)
  if (total <= avail) return widths.length
  let used = 0
  let n = 0
  for (let i = 0; i < widths.length; i++) {
    const w = widths[i]
    const next = used + w + (i > 0 ? gap : 0)
    if (next + moreW + gap <= avail) {
      used = next
      n = i + 1
    } else {
      break
    }
  }
  return Math.max(1, n)
}

/**
 * The floating toolbar — a curated projection of the command registry. Each
 * button shares the command's enabled()/whyDisabled() with the menus, so a
 * disabled engine-command is visibly disabled here AND in the menu AND its
 * shortcut reports the same reason (no dead buttons, no silent failures).
 *
 * Overflow (§15 "Toolbar overflow"): when the bar is too narrow for all
 * buttons, the tail collapses into a "⋮ More tools" dropdown — no button is
 * ever lost off-screen.
 */
export function Toolbar({ controls, ctx }: { controls: Control[]; ctx: AppContext }) {
  const [count, setCount] = useState(controls.length)
  const [open, setOpen] = useState(false)
  const barRef = useRef<HTMLDivElement | null>(null)
  const sizesRef = useRef<number[]>([])
  const wrapRef = useRef<HTMLDivElement | null>(null)

  const setItem = (i: number) => (el: HTMLButtonElement | null) => {
    if (el) sizesRef.current[i] = el.offsetWidth
  }

  useLayoutEffect(() => {
    sizesRef.current = new Array(controls.length).fill(0)
    setCount(controls.length)
  }, [controls.length])

  useLayoutEffect(() => {
    const bar = barRef.current
    if (!bar) return
    const measure = () => {
      setCount(computeVisibleCount(sizesRef.current, bar.clientWidth))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(bar)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controls.length])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const hidden = count < controls.length
  const visible = controls.slice(0, count)
  const overflow = controls.slice(count)

  const btn = (c: Control, i: number) => {
    const disabled = c.enabled ? !c.enabled(ctx) : false
    const reason = disabled && c.whyDisabled ? c.whyDisabled(ctx) : undefined
    return (
      <button
        key={c.id}
        ref={setItem(i)}
        data-testid={c.id}
        data-disabled={disabled ? 'true' : 'false'}
        aria-label={c.a11y}
        title={disabled ? `${c.tooltip} — ${reason}` : c.tooltip}
        disabled={disabled}
        onClick={() => c.action(ctx)}
        style={{
          padding: '4px 9px',
          borderRadius: 3,
          border: '1px solid #3a3a3a',
          background: '#252525',
          color: disabled ? '#666' : '#ddd',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.55 : 1,
          whiteSpace: 'nowrap',
          fontSize: 12,
        }}
      >
        {c.label}
      </button>
    )
  }

  return (
    <div ref={barRef} role="toolbar" aria-label="Tools" style={{ display: 'flex', gap: GAP, padding: '4px 8px', borderBottom: '1px solid #2a2a2a', background: '#191919', alignItems: 'center' }}>
      {visible.map((c, i) => btn(c, i))}
      {hidden && (
        <div ref={wrapRef} style={{ position: 'relative', marginLeft: 2 }}>
          <button
            data-testid="toolbar-more"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label="More tools"
            title="More tools"
            onClick={() => setOpen((o) => !o)}
            style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #555', background: '#2a2a2a', color: '#eee', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            ⋮ More
          </button>
          {open && (
            <div data-testid="toolbar-more-menu" role="menu" style={{ position: 'absolute', left: 0, top: '100%', minWidth: 160, background: '#232323', border: '1px solid #3a3a3a', boxShadow: '0 8px 24px rgba(0,0,0,0.55)', padding: '4px 0', zIndex: 60 }}>
              {overflow.map((c) => {
                const disabled = c.enabled ? !c.enabled(ctx) : false
                return (
                  <button
                    key={c.id}
                    data-testid={`toolbar-more-${c.id}`}
                    disabled={disabled}
                    onClick={() => {
                      c.action(ctx)
                      setOpen(false)
                    }}
                    style={{ display: 'block', width: '100%', boxSizing: 'border-box', textAlign: 'left', padding: '5px 12px', fontSize: 12, background: 'transparent', color: disabled ? '#777' : '#ddd', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#0a3f7f')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
                  >
                    {c.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
