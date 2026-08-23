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

  if (tool === 'pencil') {
    const mode = opts.pencilMode || 'smooth'
    const modeBtn = (id: 'straighten' | 'smooth' | 'ink', glyph: string, title: string) => (
      <button
        type="button"
        data-testid={`opt-pencil-${id}`}
        title={title}
        aria-pressed={mode === id}
        onClick={() => setToolOptions({ pencilMode: id })}
        style={{
          width: 22,
          height: 18,
          padding: 0,
          borderRadius: 3,
          border: '1px solid #3a3a3a',
          background: mode === id ? '#2d5aa7' : '#252525',
          color: '#ddd',
          cursor: 'pointer',
          fontSize: 9,
        }}
      >
        {glyph}
      </button>
    )
    return (
      <div
        data-testid="tool-options"
        aria-label="Pencil options"
        style={
          vertical
            ? { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '2px 0' }
            : { display: 'flex', alignItems: 'center', gap: 3, padding: '0 8px' }
        }
      >
        {modeBtn('straighten', '∠', 'Straighten')}
        {modeBtn('smooth', '∿', 'Smooth')}
        {modeBtn('ink', '✎', 'Ink')}
        <button
          type="button"
          data-testid="ink-size-btn"
          title={`Weight ${opts.inkSize}px`}
          onClick={() => {
            const steps = [2, 4, 8, 16]
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

  if (tool === 'brush') {
    const modes = ['normal', 'fills', 'behind', 'selection', 'inside'] as const
    const mode = opts.brushMode || 'normal'
    return (
      <div
        data-testid="tool-options"
        aria-label="Brush options"
        style={
          vertical
            ? { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '2px 0' }
            : { display: 'flex', alignItems: 'center', gap: 3, padding: '0 8px' }
        }
      >
        <button
          type="button"
          data-testid="opt-brush-mode"
          title={`Paint ${mode} — click to cycle`}
          onClick={() => {
            const i = modes.indexOf(mode)
            setToolOptions({ brushMode: modes[(i + 1) % modes.length] })
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
            fontSize: 8,
          }}
        >
          {mode[0].toUpperCase()}
        </button>
        <button
          type="button"
          data-testid="ink-size-btn"
          title={`Size ${opts.inkSize}px`}
          onClick={() => {
            const steps = [8, 12, 20, 32]
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

  if (tool === 'eraser') {
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

  if (tool === 'select') {
    const chk = (key: 'snapToObjects' | 'snapToPixels' | 'contactSensitive', label: string, title: string) => (
      <label
        key={key}
        title={title}
        style={{
          display: 'flex',
          alignItems: vertical ? 'center' : 'center',
          gap: 4,
          color: '#ccc',
          fontSize: 10,
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <input
          data-testid={`select-opt-${key}`}
          type="checkbox"
          checked={opts[key]}
          onChange={(e) => setToolOptions({ [key]: e.target.checked })}
          style={{ margin: 0 }}
        />
        {!vertical && <span>{label}</span>}
        {vertical && <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: 0.4 }}>{label}</span>}
      </label>
    )
    return (
      <div
        data-testid="tool-options"
        aria-label="Selection options"
        style={
          vertical
            ? { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '2px 0' }
            : { display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', flexWrap: 'wrap' }
        }
      >
        {chk('snapToObjects', 'Snap obj', 'Snap to Objects — edges of other items and the stage')}
        {chk('snapToPixels', 'Snap px', 'Snap to Pixels — whole-pixel moves')}
        {chk('contactSensitive', 'Contact', 'Contact-sensitive selection — marquee selects anything it touches')}
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
