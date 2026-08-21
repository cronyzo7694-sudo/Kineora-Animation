import { useEffect, useRef, useState } from 'react'

interface Props {
  active: string
  names: string[]
  onSwitch: (name: string) => void
  onSaveCurrent: () => void
  onSaveNew: () => void
  onReset: () => void
}

/**
 * Workspace switcher (app.workspace.switch, §6.2): dropdown listing saved
 * workspaces + Save Current / New Workspace… / Reset Workspace. Click outside
 * or Esc closes. Resolves to the same workspace commands as the Window menu.
 */
export function WorkspaceSwitcher({ active, names, onSwitch, onSaveCurrent, onSaveNew, onReset }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const item = (label: string, onClick: () => void, testId?: string, activeFlag = false) => (
    <button
      key={label}
      data-testid={testId}
      onClick={() => {
        onClick()
        setOpen(false)
      }}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%', boxSizing: 'border-box', textAlign: 'left',
        padding: '5px 12px', fontSize: 12, background: 'transparent', color: '#ddd', border: 'none', cursor: 'pointer',
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#0a3f7f')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
    >
      <span style={{ width: 14, display: 'inline-block', textAlign: 'center' }}>{activeFlag ? '✓' : ''}</span>
      <span>{label}</span>
    </button>
  )

  return (
    <div ref={ref} data-testid="workspace-switcher" style={{ position: 'relative' }}>
      <button
        data-testid="ws-switch"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{ padding: '2px 10px', borderRadius: 4, border: '1px solid #555', background: '#2a2a2a', color: '#ddd', cursor: 'pointer', fontSize: 11 }}
      >
        Workspace: <strong style={{ color: '#8ef' }}>{active}</strong> ▾
      </button>
      {open && (
        <div data-testid="ws-switch-menu" role="menu" style={{ position: 'absolute', right: 0, top: '100%', minWidth: 200, background: '#232323', border: '1px solid #3a3a3a', boxShadow: '0 8px 24px rgba(0,0,0,0.55)', padding: '4px 0', zIndex: 60 }}>
          {names.map((n) => item(n, () => onSwitch(n), `ws-switch-${n}`, n === active))}
          <div style={{ height: 1, background: '#3a3a3a', margin: '4px 0' }} />
          {item('Save Current Workspace', onSaveCurrent, 'ws-save-current')}
          {item('New Workspace…', onSaveNew, 'ws-save-new')}
          {item('Reset Workspace', onReset, 'ws-reset')}
        </div>
      )}
    </div>
  )
}
