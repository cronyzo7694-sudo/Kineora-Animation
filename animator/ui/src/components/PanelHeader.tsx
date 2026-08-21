import type { ReactNode } from 'react'

interface Props {
  id: string
  title: string
  collapsed: boolean
  onToggleCollapse: () => void
  onClose: () => void
  /** Extra controls rendered before the collapse/close buttons (owned by the
   *  panel's owning system, e.g. Layers' add/delete). */
  children?: ReactNode
}

/**
 * Panel chrome (SYS-01 §6.1): title + collapse/expand chevron + close (×).
 * Close = hide (reopen via Window menu / palette); collapse = header-only
 * strip (persisted). The chevron/× carry the locked testIds.
 */
export function PanelHeader({ id, title, collapsed, onToggleCollapse, onClose, children }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderBottom: collapsed ? 'none' : '1px solid #333', flexShrink: 0 }}>
      <button
        data-testid={`T-panel-collapse-${id}`}
        aria-label={collapsed ? `Expand ${title}` : `Collapse ${title}`}
        title={collapsed ? 'Expand panel' : 'Collapse panel'}
        onClick={onToggleCollapse}
        style={{ padding: 0, width: 16, height: 16, borderRadius: 3, border: 'none', background: 'transparent', color: '#888', cursor: 'pointer', fontSize: 10, lineHeight: '16px' }}
      >
        {collapsed ? '▸' : '▾'}
      </button>
      <span data-testid={`panel-title-${id}`} style={{ color: '#ddd', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {title}
      </span>
      {children && <span style={{ display: 'flex', gap: 4, marginLeft: 'auto', alignItems: 'center' }}>{children}</span>}
      {!children && <span style={{ flex: 1 }} />}
      <button
        data-testid={`T-panel-hide-${id}`}
        aria-label={`Hide ${title}`}
        title="Hide panel"
        onClick={onClose}
        style={{ padding: 0, width: 16, height: 16, borderRadius: 3, border: 'none', background: 'transparent', color: '#888', cursor: 'pointer', fontSize: 13, lineHeight: '16px' }}
      >
        ×
      </button>
    </div>
  )
}
