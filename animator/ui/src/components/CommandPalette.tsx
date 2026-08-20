import { useEffect, useMemo, useRef, useState } from 'react'
import { allCommands, type CommandContext } from '../commands'

interface Props {
  open: boolean
  onClose: () => void
  ctx: CommandContext
}

function fuzzyScore(query: string, hay: string): number {
  const q = query.toLowerCase()
  const h = hay.toLowerCase()
  if (!q) return 0
  if (h.startsWith(q)) return 100 - q.length
  if (h.includes(q)) return 50 - q.length
  let i = 0
  let score = 0
  for (const ch of q) {
    const at = h.indexOf(ch, i)
    if (at < 0) return -1
    score += 10 - (at - i)
    i = at + 1
  }
  return score
}

const CATEGORY_LABEL: Record<string, string> = {
  tools: 'Tools',
  file: 'File',
  edit: 'Edit',
  view: 'View',
  insert: 'Insert',
  modify: 'Modify',
  text: 'Text',
  commands: 'Commands',
  control: 'Control',
  debug: 'Debug',
  window: 'Window',
  help: 'Help',
  timeline: 'Timeline',
  app: 'Application',
}

/**
 * Command palette (C-04): fuzzy search across the WHOLE command registry, so
 * every reachable feature is discoverable even before menus are memorised.
 */
export function CommandPalette({ open, onClose, ctx }: Props) {
  const [query, setQuery] = useState('')
  const [sel, setSel] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setSel(0)
      // focus after mount
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const results = useMemo(() => {
    const scored = allCommands()
      .map((c) => ({ c, s: fuzzyScore(query, `${c.label} ${c.id} ${c.category} ${c.shortcut ?? ''}`) }))
      .filter((r) => r.s >= 0)
      .sort((a, b) => b.s - a.s)
    return scored.map((r) => r.c)
  }, [query])

  useEffect(() => {
    setSel(0)
  }, [query])

  if (!open) return null

  const run = (id: string) => {
    const cmd = results.find((c) => c.id === id)
    if (!cmd) return
    if (cmd.status !== 'FUNCTIONAL') return
    if (cmd.enabled && !cmd.enabled(ctx)) {
      ctx.notify(`${cmd.label}: ${cmd.whyDisabled ? cmd.whyDisabled(ctx) : 'not available'}`)
      return
    }
    onClose()
    cmd.run(ctx)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onClose()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      e.stopPropagation()
      setSel((s) => Math.min(results.length - 1, s + 1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      e.stopPropagation()
      setSel((s) => Math.max(0, s - 1))
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      const cmd = results[sel]
      if (cmd) run(cmd.id)
    }
  }

  return (
    <div
      data-testid="command-palette"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '12vh', zIndex: 100 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div style={{ width: 520, maxWidth: '92vw', background: '#1d1d1d', border: '1px solid #3a3a3a', borderRadius: 8, boxShadow: '0 16px 48px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
        <input
          ref={inputRef}
          data-testid="palette-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search commands, tools, panels…"
          aria-label="Search commands"
          style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontSize: 15, background: 'transparent', color: '#eee', border: 'none', borderBottom: '1px solid #3a3a3a', outline: 'none' }}
        />
        <div data-testid="palette-results" style={{ maxHeight: 320, overflowY: 'auto' }}>
          {results.length === 0 && (
            <div data-testid="palette-empty" style={{ padding: 18, color: '#777', fontSize: 13 }}>
              No results — try “tool”, “panel”, “export”, “tween”.
            </div>
          )}
          {results.slice(0, 40).map((c, i) => {
            const disabled = c.status !== 'FUNCTIONAL' || (c.enabled ? !c.enabled(ctx) : false)
            return (
              <button
                key={c.id}
                data-testid={`palette-item-${c.id}`}
                disabled={disabled}
                onMouseEnter={() => setSel(i)}
                onClick={() => run(c.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  boxSizing: 'border-box',
                  textAlign: 'left',
                  padding: '8px 14px',
                  fontSize: 13,
                  background: i === sel ? '#0a3f7f' : 'transparent',
                  color: disabled ? '#666' : '#ddd',
                  border: 'none',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
              >
                <span style={{ flex: 1 }}>{c.label}</span>
                <span style={{ color: disabled ? '#555' : '#888', fontSize: 11 }}>{CATEGORY_LABEL[c.category] ?? c.category}</span>
                {c.shortcut && (
                  <span style={{ color: disabled ? '#555' : '#8ec8ff', fontSize: 11, fontFamily: 'ui-monospace, monospace' }}>{c.shortcut}</span>
                )}
                {c.status !== 'FUNCTIONAL' && <span style={{ color: '#a88', fontSize: 10 }}>{c.status === 'DEFERRED' ? 'future' : 'n/a'}</span>}
              </button>
            )
          })}
        </div>
        <div data-testid="palette-hint" style={{ padding: '6px 14px', borderTop: '1px solid #3a3a3a', color: '#666', fontSize: 11, display: 'flex', gap: 12 }}>
          <span>↑↓ select</span>
          <span>Enter run</span>
          <span>Esc close</span>
        </div>
      </div>
    </div>
  )
}
