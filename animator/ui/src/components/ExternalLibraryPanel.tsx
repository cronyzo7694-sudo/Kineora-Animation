import { copyExternalSymbols, getExternalLibrary, closeExternalLibrary, type ExternalLibItem } from '../externalLibrary'

interface Props {
  notify: (msg: string) => void
  onCopied?: (ids: number[]) => void
}

const TYPE_ICON: Record<string, string> = { graphic: '◆', movieClip: '▶', button: '⬚' }

export function ExternalLibraryPanel({ notify, onCopied }: Props) {
  const lib = getExternalLibrary()
  if (!lib) return null

  const copyOne = (it: ExternalLibItem) => {
    const ids = copyExternalSymbols([it.id])
    if (ids.length === 0) {
      notify(`copy failed: "${it.name}" could not be imported`)
      return
    }
    notify(`copied "${it.name}" into this document's Library`)
    onCopied?.(ids)
  }

  const copyAll = () => {
    const ids = copyExternalSymbols(lib.items.map((i) => i.id))
    if (ids.length === 0) {
      notify('copy all: nothing imported')
      return
    }
    notify(`copied ${ids.length} symbol(s) from "${lib.title}"`)
    onCopied?.(ids)
  }

  return (
    <div
      data-testid="ext-lib-panel"
      style={{
        borderTop: '1px solid #2a4a6b',
        background: '#16202c',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 120,
        maxHeight: 220,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderBottom: '1px solid #243040' }}>
        <span style={{ color: '#7eb8ff', fontSize: 10, fontWeight: 700, letterSpacing: 0.4 }}>EXTERNAL</span>
        <span data-testid="ext-lib-title" title={lib.path || lib.title} style={{ flex: 1, minWidth: 0, color: '#ddd', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {lib.title}
        </span>
        <span style={{ color: '#666', fontSize: 10 }}>read-only</span>
        {lib.items.length > 0 && (
          <button
            data-testid="ext-lib-copy-all"
            type="button"
            onClick={copyAll}
            style={{ padding: '1px 6px', borderRadius: 3, border: '1px solid #3a5a80', background: '#1e3348', color: '#cde', cursor: 'pointer', fontSize: 10 }}
          >
            Copy all
          </button>
        )}
        <button
          data-testid="ext-lib-close"
          type="button"
          aria-label="Close external library"
          onClick={() => {
            closeExternalLibrary()
            notify('external library closed')
          }}
          style={{ padding: 0, width: 18, height: 18, border: 'none', background: 'transparent', color: '#888', cursor: 'pointer' }}
        >
          ×
        </button>
      </div>
      <ul data-testid="ext-lib-list" style={{ listStyle: 'none', margin: 0, padding: 4, overflowY: 'auto', flex: 1, fontSize: 12, color: '#bbb' }}>
        {lib.items.length === 0 && (
          <li data-testid="ext-lib-empty" style={{ padding: 8, color: '#888' }}>
            This project has no symbols to reuse.
          </li>
        )}
        {lib.items.map((it) => (
          <li
            key={it.id}
            data-testid={`ext-lib-item-${it.id}`}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 6px', borderBottom: '1px solid #1c2836' }}
          >
            <span style={{ width: 14, textAlign: 'center', color: '#8ec8ff' }}>{TYPE_ICON[it.type] ?? '◆'}</span>
            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</span>
            <span style={{ color: '#555', fontSize: 10 }}>{it.type}</span>
            <button
              data-testid={`ext-lib-copy-${it.id}`}
              type="button"
              onClick={() => copyOne(it)}
              style={{ padding: '1px 7px', borderRadius: 3, border: '1px solid #3a5a80', background: '#1e3348', color: '#cde', cursor: 'pointer', fontSize: 10 }}
            >
              Copy
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
