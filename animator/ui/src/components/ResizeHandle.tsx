import { useRef, useState } from 'react'

interface Props {
  testId: string
  /** 'horizontal' = a vertical bar dragged left/right; 'vertical' = a
   *  horizontal bar dragged up/down. */
  orientation?: 'horizontal' | 'vertical'
  /** +1 when dragging RIGHT (horizontal) / DOWN (vertical) increases the
   *  panel size the caller manages; -1 inverts it. */
  direction: 1 | -1
  onBegin?: () => void
  onDelta: (delta: number) => void
  /** Escape cancels the drag (returns to the size at drag start). */
  onCancel?: () => void
}

/**
 * Reusable panel splitter (C-06 §pnl.resize: 6px edges, live preview, min/max
 * clamp by the caller). The 6px strip stays as the invisible grab area; a thin
 * 2px line is drawn in its centre so the divider reads clean and takes no
 * visual space (dark at rest → blue on hover → bright blue while dragging).
 * Mouse-driven with window-level listeners (same pattern as the Stage
 * gestures) so the drag survives leaving the handle. Cancel-safe (C-34):
 * Escape / pointercancel / lostpointercapture / window blur all end the drag —
 * cancellation reverts via `onCancel`. Resizing is pure workspace VIEW state
 * (Part 01 §1.1.2) — it never touches the engine or undo.
 */
export function ResizeHandle({ testId, orientation = 'horizontal', direction, onBegin, onDelta, onCancel }: Props) {
  const dragRef = useRef<{ pos: number } | null>(null)
  const [hover, setHover] = useState(false)
  const [dragging, setDragging] = useState(false)
  const vertical = orientation === 'vertical'

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    dragRef.current = { pos: vertical ? e.clientY : e.clientX }
    setDragging(true)
    onBegin?.()

    const axis = vertical ? (ev: MouseEvent) => ev.clientY : (ev: MouseEvent) => ev.clientX

    const move = (ev: MouseEvent) => {
      if (!dragRef.current) return
      const cur = axis(ev)
      const delta = cur - dragRef.current.pos
      dragRef.current.pos = cur
      onDelta(delta * direction)
    }
    const cancel = () => {
      onCancel?.()
      cleanup()
    }
    const cleanup = () => {
      dragRef.current = null
      setDragging(false)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', cleanup)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointercancel', cancel)
      window.removeEventListener('blur', cancel)
      document.removeEventListener('lostpointercapture', cancel)
    }
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') cancel()
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', cleanup)
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointercancel', cancel)
    window.addEventListener('blur', cancel)
    document.addEventListener('lostpointercapture', cancel)
  }

  const lineColor = dragging ? '#0a7cff' : hover ? '#3d6a99' : '#2c2c2c'

  return (
    <div
      data-testid={testId}
      role="separator"
      aria-label="Resize panel"
      aria-orientation={vertical ? 'horizontal' : 'vertical'}
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        flexShrink: 0,
        touchAction: 'none',
        cursor: vertical ? 'row-resize' : 'col-resize',
        position: 'relative',
        background: 'transparent',
        ...(vertical ? { height: 6, width: '100%' } : { width: 6, height: '100%' }),
      }}
    >
      <div
        style={{
          position: 'absolute',
          background: lineColor,
          borderRadius: 1,
          transition: 'background 0.12s ease',
          ...(vertical
            ? { left: 0, right: 0, top: '50%', height: 2, transform: 'translateY(-50%)' }
            : { top: 0, bottom: 0, left: '50%', width: 2, transform: 'translateX(-50%)' }),
        }}
      />
    </div>
  )
}
