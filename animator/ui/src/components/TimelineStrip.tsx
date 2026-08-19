import type { AppContext } from '../controlRegistry'

export function TimelineStrip({ ctx }: { ctx: AppContext }) {
  return (
    <div data-testid="timeline" style={{ height: 96, borderTop: '1px solid #333', background: '#1e1e1e', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 12 }}>
      <span style={{ color: '#aaa', fontSize: 12 }}>Layer 1</span>
      <div style={{ flex: 1, height: 40, background: '#2a2a2a', borderRadius: 4, position: 'relative' }}>
        {[1, 5, 10, 15, 20].map((f) => (
          <div key={f} style={{ position: 'absolute', left: f * 24, top: 4, color: '#666', fontSize: 11 }}>{f}</div>
        ))}
        <div data-testid="playhead" style={{ position: 'absolute', left: 24, top: 16, width: 2, height: 24, background: '#e33' }} />
      </div>
      <button data-testid="timeline.insert-keyframe" aria-label="Insert keyframe" onClick={() => ctx.notify('keyframe: engine not attached')} style={{ padding: 4, borderRadius: 4, border: '1px solid #555', background: '#2a2a2a', color: '#eee' }}>
        ◈ Key
      </button>
    </div>
  )
}
