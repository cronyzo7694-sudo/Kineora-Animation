import type { AppContext } from '../controlRegistry'

export function TimelineStrip({ ctx, playhead, layer }: { ctx: AppContext; playhead: number; layer: string }) {
  return (
    <div data-testid="timeline" style={{ height: 96, borderTop: '1px solid #333', background: '#1e1e1e', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 12 }}>
      <span data-testid="timeline-layer" style={{ color: '#aaa', fontSize: 12 }}>{layer}</span>
      <div style={{ flex: 1, height: 40, background: '#2a2a2a', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
        {[1, 5, 10, 15, 20].map((f) => (
          <div key={f} style={{ position: 'absolute', left: f * 24, top: 4, color: '#666', fontSize: 11 }}>{f}</div>
        ))}
        <div data-testid="playhead" style={{ position: 'absolute', left: Math.max(0, (playhead - 1) * 24), top: 16, width: 2, height: 24, background: '#e33', transition: 'left 120ms linear' }} />
      </div>
      <button data-testid="timeline.insert-keyframe" aria-label="Insert keyframe" onClick={() => ctx.notify('use the Keyframe toolbar button')} style={{ padding: 4, borderRadius: 4, border: '1px solid #555', background: '#2a2a2a', color: '#eee' }}>
        ◈ Key
      </button>
    </div>
  )
}
