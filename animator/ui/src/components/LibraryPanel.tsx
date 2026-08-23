import { useEffect, useState } from 'react'
import { deleteSymbol, hasSymbolFacade, library, placeSymbol, renameSymbol } from '../engine/client'
import type { EngineStatus } from '../controlRegistry'
import type { LibraryItemJson } from '../engine/wasmTypes'
import { subscribeExternalLibrary } from '../externalLibrary'
import { ExternalLibraryPanel } from './ExternalLibraryPanel'
import { PanelHeader } from './PanelHeader'

interface Props {
  engine: EngineStatus
  notify: (msg: string) => void
  onNewSymbol: () => void
  /** Id of the most recently created symbol (highlighted until it changes). */
  highlightId?: number | null
  collapsed?: boolean
  onToggleCollapse?: () => void
  onClose?: () => void
}

const TYPE_ICON: Record<string, string> = { graphic: '◆', movieClip: '▶', button: '⬚' }

/**
 * Library panel (Part 12) — the document's symbol database. Rows show
 * icon/name/type/use-count; double-click renames (ID-safe); Delete prompts on
 * in-use symbols (cancel / break-apart-leave-content); rows are draggable onto
 * the stage (place instance) or onto a selected instance (swap). Honest states:
 * engine unattached / engine build out-of-date / genuinely empty / list.
 */
export function LibraryPanel({ engine, notify, onNewSymbol, highlightId, collapsed = false, onToggleCollapse, onClose }: Props) {
  const [editing, setEditing] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [, setExtTick] = useState(0)
  useEffect(() => subscribeExternalLibrary(() => setExtTick((n) => n + 1)), [])

  const attached = engine.kind === 'ok'
  const supported = attached && hasSymbolFacade()
  const items: LibraryItemJson[] = supported ? library() : []

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

  const place = (it: LibraryItemJson) => {
    const id = placeSymbol(it.id, 80, 80)
    notify(id !== 0 ? `placed "${it.name}"` : 'place blocked (locked/hidden layer)')
  }

  return (
    <aside data-testid="library-panel" aria-label="Library" style={{ width: '100%', boxSizing: 'border-box', background: '#1e1e1e', borderLeft: '1px solid #333', display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
      <PanelHeader id="library" title="Library" collapsed={collapsed} onToggleCollapse={onToggleCollapse ?? (() => {})} onClose={onClose ?? (() => {})}>
        <button
          data-testid="library-create"
          aria-label="New symbol"
          title="New symbol (Ctrl+F8)"
          onClick={onNewSymbol}
          disabled={!attached}
          style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid #555', background: '#2a2a2a', color: '#eee', cursor: attached ? 'pointer' : 'not-allowed', fontSize: 12, opacity: attached ? 1 : 0.5 }}
        >
          + Symbol
        </button>
      </PanelHeader>

      {!collapsed && (
      <ul data-testid="library-list" style={{ listStyle: 'none', margin: 0, padding: 4, overflowY: 'auto', flex: 1, fontSize: 12, color: '#bbb' }}>
        {!attached && (
          <li data-testid="library-engine-error" style={{ padding: 8, color: '#e66' }}>
            Animation engine unavailable — rebuild the WASM engine (<code>npm run wasm</code>) and reload.
          </li>
        )}
        {attached && !supported && (
          <li data-testid="library-stale" style={{ padding: 8, color: '#eeb' }}>
            Engine build out of date — run <code>npm run wasm</code> to enable Symbols &amp; Library.
          </li>
        )}
        {supported && items.length === 0 && (
          <li data-testid="library-empty" style={{ padding: 8, color: '#888', lineHeight: 1.45 }}>
            No symbols yet. Select shapes and press <strong>F8</strong> to convert, or click <strong>+ Symbol</strong>.
          </li>
        )}
        {supported && items.map((it) => (
          <li
            key={it.id}
            data-testid={`library-item-${it.id}`}
            data-highlighted={highlightId === it.id ? 'true' : 'false'}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('kineora/symbol', String(it.id))
              e.dataTransfer.effectAllowed = 'copyMove'
            }}
            onDoubleClick={() => {
              setEditing(it.id)
              setDraft(it.name)
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', borderRadius: 3, cursor: 'grab', background: highlightId === it.id ? '#2f4a6b' : 'transparent', borderBottom: '1px solid #252525' }}
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
              data-testid={`library-place-${it.id}`}
              type="button"
              aria-label={`Place ${it.name} on stage`}
              title="Place on stage (or drag the row)"
              onClick={(e) => {
                e.stopPropagation()
                place(it)
              }}
              style={{ padding: '0 5px', height: 18, borderRadius: 3, border: '1px solid #3a5a80', background: '#1e3348', color: '#cde', cursor: 'pointer', fontSize: 10 }}
            >
              Place
            </button>
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
      )}
      {!collapsed && <ExternalLibraryPanel notify={notify} onCopied={() => setExtTick((n) => n + 1)} />}
    </aside>
  )
}
