import type { CSSProperties } from 'react'
import { arrangeSelection, flipSelection, removeTransform, rotateSelection, statusJson } from '../engine/client'
import { selectedInkIds } from '../editor/inkStore'

const btn: CSSProperties = {
  padding: '3px 7px',
  borderRadius: 3,
  border: '1px solid #555',
  background: '#2a2a2a',
  color: '#eee',
  cursor: 'pointer',
  fontSize: 11,
}

/**
 * Adobe-style rotate / flip / reset for the current stage selection.
 * Used in Properties and next to the Selection tool options.
 */
export function SelectionActions({ notify, compact = false }: { notify: (msg: string) => void; compact?: boolean }) {
  const n = (statusJson()?.selection?.length ?? 0) + selectedInkIds().length
  const go = (fn: () => boolean, ok: string) => {
    if (n === 0) {
      notify('select an object first')
      return
    }
    notify(fn() ? ok : 'transform: nothing moved')
  }

  return (
    <div
      data-testid="select-actions"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 4,
        alignItems: 'center',
        margin: compact ? '4px 0' : '6px 0 8px',
      }}
    >
      {!compact && (
        <span style={{ color: '#888', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, width: '100%' }}>
          Rotate / Flip
        </span>
      )}
      <button type="button" data-testid="sel-rot-ccw" title="Rotate 90° CCW" style={btn} onClick={() => go(() => rotateSelection(-90), 'rotate 90° CCW')}>
        ↺ 90°
      </button>
      <button type="button" data-testid="sel-rot-cw" title="Rotate 90° CW" style={btn} onClick={() => go(() => rotateSelection(90), 'rotate 90° CW')}>
        ↻ 90°
      </button>
      <button type="button" data-testid="sel-flip-h" title="Flip Horizontal" style={btn} onClick={() => go(() => flipSelection(true), 'flip horizontal')}>
        ↔ Flip
      </button>
      <button type="button" data-testid="sel-flip-v" title="Flip Vertical" style={btn} onClick={() => go(() => flipSelection(false), 'flip vertical')}>
        ↕ Flip
      </button>
      {!compact && (
        <button type="button" data-testid="sel-reset-xf" title="Remove Transform" style={btn} onClick={() => go(() => removeTransform(), 'transform removed')}>
          Reset
        </button>
      )}
      <span style={{ color: '#888', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, width: '100%', marginTop: compact ? 2 : 4 }}>
        Arrange
      </span>
      <button type="button" data-testid="sel-arr-front" title="Bring to Front (Ctrl+Shift+↑)" style={btn} onClick={() => go(() => arrangeSelection('front'), 'bring to front')}>
        ⤒ Front
      </button>
      <button type="button" data-testid="sel-arr-forward" title="Bring Forward (Ctrl+↑)" style={btn} onClick={() => go(() => arrangeSelection('forward'), 'bring forward')}>
        ↑ Up
      </button>
      <button type="button" data-testid="sel-arr-back" title="Send Backward (Ctrl+↓)" style={btn} onClick={() => go(() => arrangeSelection('backward'), 'send backward')}>
        ↓ Down
      </button>
      <button type="button" data-testid="sel-arr-backmost" title="Send to Back (Ctrl+Shift+↓)" style={btn} onClick={() => go(() => arrangeSelection('back'), 'send to back')}>
        ⤓ Back
      </button>
    </div>
  )
}
