import { getCommand } from '../commands'
import type { CommandContext } from '../commands'
import { switchActiveDocument } from '../file'
import type { DocJson } from '../engine/wasmTypes'

interface Props {
  ctx: CommandContext
  docs: DocJson[]
  activeId: number
}

/**
 * Document tabs (SYS-02 §12 multi-document): left-click = activate
 * (tab.activate → activeDoc:changed), per-tab × = file.close (same canonical
 * command as File ▸ Close), dirty ● per document.
 *
 * H00 §10 (INV-DSTR-1/2, INV-013 — P0): RIGHT-CLICK ≠ DESTRUCTIVE ACTION.
 * A right-click here only suppresses the native menu and does NOTHING — it can
 * never close/delete/discard a document. The context menu itself (and its
 * guarded Close item) belongs to H03, not here.
 */
export function DocumentTabs({ ctx, docs, activeId }: Props) {
  if (docs.length === 0) {
    return (
      <div data-testid="no-doc-tabs" style={{ padding: '3px 12px', background: '#131313', borderBottom: '1px solid #2a2a2a', color: '#777', fontSize: 11 }}>
        No document open — File ▸ New (Ctrl+N) or Open (Ctrl+O)
      </div>
    )
  }
  const closeCmd = getCommand('file.close')

  return (
    <div data-testid="doc-tabs" style={{ display: 'flex', gap: 2, padding: '3px 12px 0', background: '#131313', borderBottom: '1px solid #2a2a2a', alignItems: 'flex-end' }}>
      {docs.map((d) => {
        const active = d.id === activeId
        return (
          <div
            key={d.id}
            data-testid={`doc-tab-${d.id}`}
            data-active={active ? 'true' : 'false'}
            role="tab"
            aria-selected={active}
            title={d.title}
            onClick={() => {
              if (d.id === activeId) return
              // H00 §12: switch through the canonical path (engine switch +
              // activeDoc:changed) so document-bound UI rebinds immediately.
              switchActiveDocument(d.id, ctx.notify)
            }}
            onContextMenu={(e) => {
              // H00 INV-DSTR-1: invoking the right-click surface must NEVER
              // perform a destructive action. Suppress the native menu; the
              // H03 context menu will be attached here later.
              e.preventDefault()
              e.stopPropagation()
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', fontSize: 12,
              border: '1px solid #2a2a2a', borderBottom: 'none', borderRadius: '4px 4px 0 0',
              background: active ? '#232f3d' : '#1a1a1a', color: active ? '#fff' : '#999', cursor: 'pointer', userSelect: 'none',
            }}
          >
            <span data-testid={`doc-tab-title-${d.id}`}>{d.title}</span>
            {d.dirty && <span data-testid={`doc-tab-dirty-${d.id}`} title="unsaved changes" style={{ color: '#eec13b' }}>●</span>}
            <button
              data-testid={`doc-tab-close-${d.id}`}
              aria-label={`Close ${d.title}`}
              title="Close document (Ctrl+W)"
              onClick={(e) => {
                e.stopPropagation()
                closeCmd?.run(ctx)
              }}
              style={{ padding: 0, width: 14, height: 14, borderRadius: 3, border: 'none', background: 'transparent', color: '#888', cursor: 'pointer', fontSize: 12, lineHeight: '14px' }}
            >
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}
