import { useEffect, useState } from 'react'
import { loadToolOptions, setToolOptions, subscribeToolOptions } from '../toolOptions'

/**
 * The Tools panel "options area" — Adobe: "the options area contains modifiers
 * for the currently selected tool. Modifiers affect the tool's painting or
 * editing operations."
 *
 * Only the modifiers that actually exist are shown: an empty options area for a
 * tool without modifiers is honest, a fake one is not.
 */
export function ToolOptions({ tool, vertical = false }: { tool: string; vertical?: boolean }) {
  const [opts, setOpts] = useState(loadToolOptions)
  useEffect(() => subscribeToolOptions(() => setOpts(loadToolOptions())), [])

  if (tool === 'pencil' || tool === 'brush' || tool === 'eraser') {
    return (
      <div
        data-testid="tool-options"
        aria-label="Tool options"
        style={
          vertical
            ? { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '2px 0' }
            : { display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px' }
        }
      >
        <button
          type="button"
          data-testid="ink-size-btn"
          title={`Size ${opts.inkSize}px — click to cycle`}
          onClick={() => {
            const steps = tool === 'brush' ? [8, 12, 20, 32] : [2, 4, 8, 16]
            const i = steps.findIndex((s) => s >= opts.inkSize)
            setToolOptions({ inkSize: steps[(i + 1) % steps.length] })
          }}
          style={{
            width: 22,
            height: 18,
            padding: 0,
            borderRadius: 3,
            border: '1px solid #3a3a3a',
            background: '#252525',
            color: '#ddd',
            cursor: 'pointer',
            fontSize: 9,
          }}
        >
          {opts.inkSize}
        </button>
      </div>
    )
  }

  if (tool !== 'zoom') return null

  const btn = (mode: 'in' | 'out', label: string, title: string) => (
    <button
      data-testid={`zoom-mode-${mode}`}
      aria-pressed={opts.zoomMode === mode}
      title={title}
      onClick={() => setToolOptions({ zoomMode: mode })}
      style={{
        padding: '1px 6px',
        borderRadius: 3,
        border: '1px solid #555',
        background: opts.zoomMode === mode ? '#3a5a7a' : '#2a2a2a',
        color: '#eee',
        cursor: 'pointer',
        fontSize: 11,
      }}
    >
      {label}
    </button>
  )

  return (
    <div
      data-testid="tool-options"
      aria-label="Tool options"
      style={
        vertical
          ? { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '2px 0' }
          : { display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px' }
      }
    >
      {!vertical && <span style={{ color: '#888', fontSize: 11 }}>Zoom:</span>}
      {btn('in', vertical ? '⊕' : '⊕ Enlarge', 'Zoom in on click (Alt+click reverses)')}
      {btn('out', vertical ? '⊖' : '⊖ Reduce', 'Zoom out on click (Alt+click reverses)')}
    </div>
  )
}
