import { useState } from 'react'
import { deleteSymbol, library, renameSymbol } from '../engine/client'
import type { LibraryItemJson } from '../engine/wasmTypes'

interface Props {
  notify: (msg: string) => void
  onNewSymbol: () => void
}

const TYPE_ICON: Record<string, string> = { graphic: '◆', movieClip: '▶', button: '⬚' }

/**
 * Library panel (Part 12) — the document's symbol database. Rows show
 * icon/name/type/use-count; double-click renames (ID-safe); Delete prompts on
 * in-use symbols (cancel / break-apart-leave-content); rows are draggable onto
 * the stage (place instance) or onto a selected instance (swap — handled by the
 * Stage drop target). Everything reads from real engine state.
 */
export function LibraryPanel({ notify, onNewSymbol }: Props) {
  const [editing, setEditing] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const items: LibraryItemJson[] = library()

  const commitRename = () => {
    if (editing === null) return
    const id = editing
    const name = draft.trim()
    setEditing(null)
    if (name && name !== items.find((i) => i.id === id)?.name) {
      if (renameSymbol(id, name)) notify(`symbol renamed to "${name}"`)
    }
  }

  const remove = (it: LibraryItemJson) => {
    if (it.use_count === 0) {
      if (deleteSymbol(it.id, false)) notify(`symbol "${it.name}" deleted`)
      return
    }
    // in use → prompt (Part 12 §12.2.5)
    if (window.confirm(`"${it.name}" is used ${it.use_count}×. Break apart its instances into raw content and delete it?`)) {
      if (deleteSymbol(it.id, true)) notify(`symbol "${it.name}" deleted (instances broken apart)`)
    }
  }

  return (
    <aside data-testid="library-panel" aria-label="Library" style={{ width: '100%', boxSizing: 'border-box', background: '#1e1e1e', borderLeft: '1px solid #333', display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderBottom: '1px solid #333' }}>
        <span style={{ color: '#ddd', fontSize: 12, fontWeight: 700 }}>Library</span>
        <button data-testid="library-create" aria-label="New symbol" title="New symbol (Ctrl+F8)" onClick={onNewSymbol} style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid #555', background: '#2a2a2a', color: '#eee', cursor: 'pointer', fontSize: 12 }}>
          + Symbol
        </button>
      </div>

      <ul data-testid="library-list" style={{ listStyle: 'none', margin: 0, padding: 4, overflowY: 'auto', flex: 1, fontSize: 12, color: '#bbb' }}>
        {items.length === 0 && (
          <li data-testid="library-empty" style={{ padding: 8, color: '#888' }}>No symbols yet — select objects and press F8, or create one.</li>
        )}
        {items.map((it) => (
          <li
            key={it.id}
            data-testid={`library-item-${it.id}`}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('kineora/symbol', String(it.id))
              e.dataTransfer.effectAllowed = 'copyMove'
            }}
            onDoubleClick={() => {
              setEditing(it.id)
              setDraft(it.name)
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 6px', borderRadius: 4, cursor: 'grab', background: 'transparent' }}
            title={`${it.type} · ${it.duration} frame(s) · used ${it.use_count}× (drag onto the stage to place)`}
          >
            <span style={{ width: 14, textAlign: 'center', color: '#8ec8ff' }}>{TYPE_ICON[it.type] ?? '◆'}</span>
            {editing === it.id ? (
              <input
                data-testid={`library-rename-${it.id}`}
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename()
                  if (e.key === 'Escape') setEditing(null)
                }}
                style={{ flex: 1, minWidth: 0, background: '#111', color: '#eee', border: '1px solid #0a7cff', borderRadius: 3, padding: '2px 4px', fontSize: 12 }}
              />
            ) : (
              <span data-testid={`library-name-${it.id}`} style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</span>
            )}
            <span style={{ color: '#666', fontSize: 10 }}>{it.type}</span>
            <span data-testid={`library-use-${it.id}`} style={{ color: '#0a7cff', width: 18, textAlign: 'right' }}>{it.use_count > 0 ? `×${it.use_count}` : ''}</span>
            <button
              data-testid={`library-delete-${it.id}`}
              aria-label={`Delete ${it.name}`}
              title="Delete symbol"
              onClick={() => remove(it)}
              style={{ padding: 0, width: 18, height: 18, borderRadius: 3, border: 'none', background: 'transparent', color: '#c66', cursor: 'pointer', fontSize: 12 }}
            >
              🗑
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
