import { useEffect, useMemo } from 'react'
import { allCommands, shortcutAliases, shortcutDisplayFor } from '../commands'
import { menus } from '../menus'

interface Props {
  open: boolean
  onClose: () => void
}

const CATEGORY_ORDER: Array<[string, string]> = [
  ['tools', 'Tools'],
  ['file', 'File'],
  ['edit', 'Edit'],
  ['view', 'View'],
  ['insert', 'Insert'],
  ['modify', 'Modify'],
  ['text', 'Text'],
  ['commands', 'Commands'],
  ['control', 'Control'],
  ['window', 'Window'],
  ['help', 'Help'],
  ['timeline', 'Timeline'],
  ['app', 'Application'],
]

/**
 * Edit ▸ Keyboard Shortcuts / Help ▸ Keyboard Shortcuts — a read-only viewer
 * generated from the shortcut registry (C-32). Rebinding itself is a future
 * feature (the dialog honestly lists the keys that work today).
 */
export function ShortcutsDialog({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // H09 §6/§10: shortcut rows = direct command bindings + alias bindings for
  // parameterized commands (file.import('stage'|'library'), file.export('image'))
  // — the shortcut column shows the same binding the menu shows.
  const groups = useMemo(() => {
    return CATEGORY_ORDER.map(([cat, label]) => {
      const rows: { key: string; label: string; shortcut: string; testId: string }[] = []
      for (const c of allCommands().filter((x) => x.category === cat)) {
        if (c.shortcut) {
          rows.push({ key: c.id, label: c.label, shortcut: c.shortcut, testId: `shortcut-${c.id}` })
        }
        for (const [, alias] of Object.entries(shortcutAliases)) {
          if (alias.id !== c.id) continue
          const display = shortcutDisplayFor(c.id, alias.input)
          if (!display) continue
          const entry = menus
            .flatMap((m) => m.items.flatMap((i) => (i.type === 'submenu' ? i.items : [i])))
            .find((i) => i.type === 'command' && i.id === c.id && i.input === alias.input)
          rows.push({
            key: `${c.id}-${String(alias.input)}`,
            label: entry && entry.type === 'command' ? entry.label ?? c.label : c.label,
            shortcut: display,
            testId: `shortcut-${c.id}-${String(alias.input)}`,
          })
        }
      }
      return { label, items: rows }
    }).filter((g) => g.items.length > 0)
  }, [])

  if (!open) return null

  return (
    <div data-testid="shortcuts-dialog" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-label="Keyboard shortcuts" style={{ width: 560, maxWidth: '92vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column', background: '#1d1d1d', border: '1px solid #3a3a3a', borderRadius: 8, boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #3a3a3a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#eee', fontSize: 15 }}>Keyboard Shortcuts</h3>
          <button data-testid="shortcuts-close" onClick={onClose} style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid #555', background: '#2a2a2a', color: '#ddd', cursor: 'pointer', fontSize: 12 }}>
            Close
          </button>
        </div>
        <div style={{ overflowY: 'auto', padding: '8px 16px 16px', fontSize: 13 }}>
          {groups.map((g) => (
            <section key={g.label} style={{ marginTop: 10 }}>
              <div style={{ color: '#8ef', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{g.label}</div>
              {g.items.map((row) => (
                <div key={row.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#bbb' }}>
                  <span>{row.label}</span>
                  <span data-testid={row.testId} style={{ color: '#8ec8ff', fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>
                    {row.shortcut}
                  </span>
                </div>
              ))}
            </section>
          ))}
          <p style={{ marginTop: 12, color: '#666', fontSize: 11 }}>
            Mac: Ctrl = Cmd. Shortcuts use Animate muscle-memory defaults (Part 29). Rebindable shortcut editing is a future feature.
          </p>
        </div>
      </div>
    </div>
  )
}
