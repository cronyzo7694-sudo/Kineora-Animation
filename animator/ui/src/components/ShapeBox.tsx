import { useEffect, useState, type CSSProperties } from 'react'
import {
  BUILTIN_SHAPES,
  deleteCustomShape,
  listCustomShapes,
  saveCustomShape,
  shapeLabel,
  subscribeCustomShapes,
  type ShapeId,
} from '../editor/shapeLibrary'
import { listInk, selectedInkIds } from '../editor/inkStore'
import { loadToolOptions, setToolOptions, subscribeToolOptions } from '../toolOptions'

const cell: CSSProperties = {
  width: 34,
  height: 28,
  borderRadius: 4,
  border: '1px solid #444',
  background: '#191919',
  color: '#ddd',
  fontSize: 9,
  cursor: 'pointer',
  padding: 0,
  overflow: 'hidden',
}

/** Adobe Rectangle-tool flyout + extra presets + custom (saved paths). */
export function ShapeBox({ notify }: { notify: (msg: string) => void }) {
  const [opts, setOpts] = useState(loadToolOptions)
  const [, tick] = useState(0)
  useEffect(() => subscribeToolOptions(() => setOpts(loadToolOptions())), [])
  useEffect(() => subscribeCustomShapes(() => tick((n) => n + 1)), [])
  const custom = listCustomShapes()
  const pick = (id: string) => {
    setToolOptions({ shapePreset: id })
    notify(`shape: ${shapeLabel(id)}`)
  }
  const groups = [
    { title: 'Basic', ids: BUILTIN_SHAPES.filter((s) => s.group === 'basic') },
    { title: 'Polygons', ids: BUILTIN_SHAPES.filter((s) => s.group === 'poly') },
    { title: 'Stars', ids: BUILTIN_SHAPES.filter((s) => s.group === 'star') },
    { title: 'Symbols', ids: BUILTIN_SHAPES.filter((s) => s.group === 'symbol') },
  ]
  return (
    <div data-testid="shape-box" style={{ margin: '8px 0' }}>
      <div style={{ color: '#888', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
        Shape box
      </div>
      {groups.map((g) => (
        <div key={g.title} style={{ marginBottom: 6 }}>
          <div style={{ color: '#666', fontSize: 10, marginBottom: 3 }}>{g.title}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {g.ids.map((s) => (
              <button
                key={s.id}
                type="button"
                data-testid={`shape-${s.id}`}
                data-active={opts.shapePreset === s.id ? 'true' : 'false'}
                title={s.label}
                onClick={() => pick(s.id)}
                style={{
                  ...cell,
                  borderColor: opts.shapePreset === s.id ? '#5a8fc0' : '#444',
                  background: opts.shapePreset === s.id ? '#243656' : '#191919',
                  color: opts.shapePreset === s.id ? '#cfe4ff' : '#ddd',
                }}
              >
                {s.label.split(' ')[0].slice(0, 6)}
              </button>
            ))}
          </div>
        </div>
      ))}
      {custom.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          <div style={{ color: '#666', fontSize: 10, marginBottom: 3 }}>Custom</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {custom.map((s) => (
              <span key={s.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                <button
                  type="button"
                  data-testid={`shape-custom-${s.id}`}
                  onClick={() => pick(`custom:${s.id}` as ShapeId)}
                  style={{
                    ...cell,
                    width: 'auto',
                    padding: '0 6px',
                    borderColor: opts.shapePreset === `custom:${s.id}` ? '#5a8fc0' : '#444',
                  }}
                >
                  {s.name}
                </button>
                <button
                  type="button"
                  title="Delete custom shape"
                  onClick={() => deleteCustomShape(s.id)}
                  style={{ ...cell, width: 18, height: 18, fontSize: 10 }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 6 }}>
        <label style={{ color: '#999', fontSize: 11 }}>
          Sides
          <input
            data-testid="shape-sides"
            type="number"
            min={3}
            max={32}
            value={opts.polySides}
            onChange={(e) => setToolOptions({ polySides: Number(e.target.value) })}
            style={{ width: '100%', background: '#111', color: '#eee', border: '1px solid #444', borderRadius: 3, padding: '2px 4px' }}
          />
        </label>
        <label style={{ color: '#999', fontSize: 11 }}>
          Corner %
          <input
            data-testid="shape-corner"
            type="number"
            min={0}
            max={49}
            value={opts.cornerRadius}
            onChange={(e) => setToolOptions({ cornerRadius: Number(e.target.value) })}
            style={{ width: '100%', background: '#111', color: '#eee', border: '1px solid #444', borderRadius: 3, padding: '2px 4px' }}
          />
        </label>
      </div>
      <button
        type="button"
        data-testid="shape-save-custom"
        onClick={() => {
          const sel = listInk().filter((it) => selectedInkIds().includes(it.id) && it.kind !== 'text' && it.points.length >= 3)
          if (sel.length === 0) {
            notify('select a path (Pen / star / polygon) first')
            return
          }
          const name = window.prompt('Custom shape name', 'My shape')
          if (!name) return
          const rec = saveCustomShape(name, sel[0].points)
          notify(rec ? `saved custom shape “${rec.name}”` : 'could not save shape')
        }}
        style={{
          marginTop: 8,
          width: '100%',
          padding: '4px 6px',
          background: '#2a2a2a',
          color: '#eee',
          border: '1px solid #555',
          borderRadius: 4,
          fontSize: 11,
          cursor: 'pointer',
        }}
      >
        Save selection as custom shape
      </button>
    </div>
  )
}
