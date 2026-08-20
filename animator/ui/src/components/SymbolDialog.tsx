import { useState } from 'react'
import { convertToSymbol, newSymbol } from '../engine/client'

export type SymbolDialogMode = 'convert' | 'new'

interface Props {
  open: boolean
  mode: SymbolDialogMode
  onClose: () => void
  notify: (msg: string) => void
  /** Called with the new symbol id after a successful New Symbol (Ctrl+F8). */
  onCreated?: (id: number) => void
}

const GRID: Array<[string, number]> = [
  // [label, grid-index] for the 9-point registration grid (Part 11 §11.2)
  ['TL', 0], ['TC', 1], ['TR', 2],
  ['ML', 3], ['C', 4], ['MR', 5],
  ['BL', 6], ['BC', 7], ['BR', 8],
]

/**
 * Convert to Symbol (F8) / New Symbol (Ctrl+F8) dialog — Part 11 §11.2 and
 * Part 12 §12.2.2. Name + type (graphic / movie clip / button) + a 9-point
 * registration grid (convert only). Submits to the engine; one undoable
 * command. Engine-not-attached = honest disabled state.
 */
export function SymbolDialog({ open, mode, onClose, notify, onCreated }: Props) {
  const [name, setName] = useState('')
  const [type, setType] = useState('graphic')
  const [grid, setGrid] = useState(4) // center

  if (!open) return null

  const submit = () => {
    const n = name.trim()
    if (!n) {
      notify('symbol: enter a name')
      return
    }
    if (mode === 'convert') {
      const id = convertToSymbol(n, type, grid)
      if (id === 0) notify('convert: select objects on the stage first')
      else notify(`converted to symbol "${n}"`)
    } else {
      const id = newSymbol(n, type)
      if (id === 0) notify('new symbol: failed (engine unavailable)')
      else {
        notify(`symbol "${n}" created in Library — drag it onto the stage to place`)
        onCreated?.(id)
      }
    }
    setName('')
    onClose()
  }

  return (
    <div data-testid="symbol-dialog" role="dialog" aria-label="Symbol" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
      <div style={{ background: '#1e1e1e', border: '1px solid #444', borderRadius: 8, padding: 16, width: 320, color: '#ddd', fontSize: 13 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#fff' }}>
          {mode === 'convert' ? 'Convert to Symbol' : 'New Symbol'}
        </h3>

        <label style={{ display: 'block', marginBottom: 10 }}>
          <span style={{ color: '#999', display: 'block', marginBottom: 3 }}>Name</span>
          <input
            data-testid="symbol-name"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
              if (e.key === 'Escape') onClose()
            }}
            style={{ width: '100%', background: '#111', color: '#eee', border: '1px solid #444', borderRadius: 3, padding: '4px 8px', fontSize: 13, boxSizing: 'border-box' }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: 10 }}>
          <span style={{ color: '#999', display: 'block', marginBottom: 3 }}>Type</span>
          <select data-testid="symbol-type" value={type} onChange={(e) => setType(e.target.value)} style={{ width: '100%', background: '#111', color: '#eee', border: '1px solid #444', borderRadius: 3, padding: 4 }}>
            <option value="graphic">Graphic</option>
            <option value="movieClip">Movie Clip</option>
            <option value="button">Button</option>
          </select>
        </label>

        {mode === 'convert' && (
          <div style={{ marginBottom: 12 }}>
            <span style={{ color: '#999', display: 'block', marginBottom: 3 }}>Registration point</span>
            <div data-testid="symbol-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, width: 120 }}>
              {GRID.map(([label, g]) => (
                <button
                  key={g}
                  data-testid={`reg-${g}`}
                  data-selected={grid === g ? 'true' : 'false'}
                  onClick={() => setGrid(g)}
                  style={{ padding: 4, borderRadius: 3, border: grid === g ? '1px solid #0a7cff' : '1px solid #555', background: grid === g ? '#0a3f7f' : '#2a2a2a', color: '#eee', cursor: 'pointer', fontSize: 10 }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button data-testid="symbol-cancel" onClick={onClose} style={{ padding: '5px 12px', borderRadius: 4, border: '1px solid #555', background: '#2a2a2a', color: '#eee', cursor: 'pointer' }}>Cancel</button>
          <button data-testid="symbol-confirm" onClick={submit} style={{ padding: '5px 12px', borderRadius: 4, border: '1px solid #0a7cff', background: '#0a3f7f', color: '#fff', cursor: 'pointer' }}>OK</button>
        </div>
      </div>
    </div>
  )
}
