import { getCommand } from '../commands'
import type { CommandContext } from '../commands'

interface Props {
  ctx: CommandContext
  /** Current scene name (breadcrumb root). */
  scene: string
}

/**
 * Edit bar / breadcrumb (C-38, app.breadcrumb chrome). At the document root it
 * shows "Scene ▸" and NO Back button; at edit depth > 0 (SYS-19 symbol editing)
 * it shows the depth path + Back (edit.exitOneLevel) and root (edit.exitRoot)
 * buttons. Both buttons run the SAME command ids the palette/shortcut use —
 * single commandId mapping (§30). No silent no-op: the buttons only render
 * when their command is enabled.
 */
export function EditBar({ ctx, scene }: Props) {
  const depth = ctx.editDepth()
  const back = getCommand('edit.exitOneLevel')
  const root = getCommand('edit.exitRoot')
  const backEnabled = back && (back.enabled ? back.enabled(ctx) : true)
  const rootEnabled = root && (root.enabled ? root.enabled(ctx) : true)

  return (
    <div data-testid="edit-bar" aria-label="Edit bar" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 12px', background: '#161616', borderBottom: '1px solid #2a2a2a', fontSize: 12, color: '#999' }}>
      <span data-testid="breadcrumb" style={{ color: '#8ef' }}>
        {scene}
        {depth > 0 ? ` ▸ symbol (depth ${depth})` : ''}
      </span>
      {depth > 0 && backEnabled && back && (
        <button data-testid="nav-back" aria-label="Back one level" title="Back one level (Esc)" onClick={() => back.run(ctx)} style={{ padding: '1px 8px', borderRadius: 4, border: '1px solid #555', background: '#2a2a2a', color: '#ddd', cursor: 'pointer', fontSize: 11 }}>
          ← Back
        </button>
      )}
      {depth > 0 && rootEnabled && root && (
        <button data-testid="nav-root" aria-label="Exit to document" title="Exit to document (Ctrl+Enter)" onClick={() => root.run(ctx)} style={{ padding: '1px 8px', borderRadius: 4, border: '1px solid #555', background: '#2a2a2a', color: '#ddd', cursor: 'pointer', fontSize: 11 }}>
          ⤒ Root
        </button>
      )}
    </div>
  )
}
