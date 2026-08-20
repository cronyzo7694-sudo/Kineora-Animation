import { useRef } from 'react'

interface Props {
  testId: string
  /** +1 when dragging RIGHT widens the panel; -1 when dragging LEFT widens it. */
  direction: 1 | -1
  onBegin?: () => void
  onDelta: (dx: number) => void
  /** Escape during a drag cancels it (returns to the width at drag start). */
  onCancel?: () => void
}

/**
 * Panel resize handle (C-06 §pnl.resize: 6px edges, live preview, min-clamp by
 * the caller, Esc cancels the drag back to origin). Mouse-driven with
 * window-level move/up listeners (same pattern as the Stage gestures) so the
 * drag survives leaving the handle. It never touches the document/engine —
 * panel width is pure workspace view state (Part 01 §1.1.2).
 */
export function ResizeHandle({ testId, direction, onBegin, onDelta, onCancel }: Props) {
  const dragRef = useRef<{ x: number } | null>(null)

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    dragRef.current = { x: e.clientX }
    onBegin?.()

    const move = (ev: MouseEvent) => {
      if (!dragRef.current) return
      const dx = ev.clientX - dragRef.current.x
      dragRef.current.x = ev.clientX
      onDelta(dx * direction)
    }
    const cleanup = () => {
      dragRef.current = null
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', cleanup)
      window.removeEventListener('keydown', onKey)
    }
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        onCancel?.()
        cleanup()
      }
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', cleanup)
    window.addEventListener('keydown', onKey)
  }

  return (
    <div
      data-testid={testId}
      role="separator"
      aria-label="Resize panel"
      onMouseDown={onMouseDown}
      style={{ width: 6, flexShrink: 0, cursor: 'col-resize', touchAction: 'none' }}
    />
  )
}
