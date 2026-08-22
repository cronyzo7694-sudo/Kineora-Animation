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
export function ToolOptions({ tool }: { tool: string }) {
  const [opts, setOpts] = useState(loadToolOptions)
  useEffect(() => subscribeToolOptions(() => setOpts(loadToolOptions())), [])

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
    <div data-testid="tool-options" aria-label="Tool options" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px' }}>
      <span style={{ color: '#888', fontSize: 11 }}>Zoom:</span>
      {btn('in', '⊕ Enlarge', 'Zoom in on click (Alt+click reverses)')}
      {btn('out', '⊖ Reduce', 'Zoom out on click (Alt+click reverses)')}
    </div>
  )
}
