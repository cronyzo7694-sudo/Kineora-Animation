import type { AppContext, Control } from '../controlRegistry'

export function Toolbar({ controls, ctx }: { controls: Control[]; ctx: AppContext }) {
  return (
    <div role="toolbar" aria-label="Tools" style={{ display: 'flex', gap: 6, padding: 8, borderBottom: '1px solid #333', background: '#1e1e1e' }}>
      {controls.map((c) => (
        <button
          key={c.id}
          data-testid={c.id}
          aria-label={c.a11y}
          title={`${c.tooltip}${c.shortcut ? ` (${c.shortcut})` : ''}`}
          disabled={c.state !== 'FUNCTIONAL'}
          onClick={() => c.action(ctx)}
          style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #555', background: '#2a2a2a', color: '#eee', cursor: 'pointer' }}
        >
          {c.label}
          {c.state === 'COMING-SOON' ? ' ⏳' : ''}
        </button>
      ))}
    </div>
  )
}
