import type { AppContext, Control } from '../controlRegistry'

/**
 * The floating toolbar — a curated projection of the command registry. Each
 * button shares the command's enabled()/whyDisabled() with the menus, so a
 * disabled engine-command is visibly disabled here AND in the menu AND its
 * shortcut reports the same reason (no dead buttons, no silent failures).
 */
export function Toolbar({ controls, ctx }: { controls: Control[]; ctx: AppContext }) {
  return (
    <div role="toolbar" aria-label="Tools" style={{ display: 'flex', gap: 6, padding: 8, borderBottom: '1px solid #333', background: '#1e1e1e', flexWrap: 'wrap' }}>
      {controls.map((c) => {
        const disabled = c.enabled ? !c.enabled(ctx) : false
        const reason = disabled && c.whyDisabled ? c.whyDisabled(ctx) : undefined
        return (
          <button
            key={c.id}
            data-testid={c.id}
            data-disabled={disabled ? 'true' : 'false'}
            aria-label={c.a11y}
            title={disabled ? `${c.tooltip} — ${reason}` : c.tooltip}
            disabled={disabled}
            onClick={() => c.action(ctx)}
            style={{
              padding: '6px 10px',
              borderRadius: 4,
              border: '1px solid #555',
              background: '#2a2a2a',
              color: disabled ? '#777' : '#eee',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.55 : 1,
            }}
          >
            {c.label}
          </button>
        )
      })}
    </div>
  )
}
