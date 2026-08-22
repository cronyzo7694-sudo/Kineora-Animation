import { useEffect, useRef, useState } from 'react'
import { getCommand, shortcutDisplayFor, type CommandContext } from '../commands'
import { listRecent } from '../file'
import { menus, type MenuDef, type MenuEntry } from '../menus'

// ——— style tokens (H11 §4 / INV-VIS-2: SYS-01 design tokens, no hard-coded
// values — Kineora dark-slate identity via the token definitions) ———
const itemBg = 'var(--kineora-dropdown)'
const hoverBg = 'var(--kineora-btn-primary-bg)'
const text = 'var(--kineora-text)'
const dim = 'var(--kineora-disabled-text)'
const border = 'var(--kineora-border-2)'

interface MenuBarProps {
  ctx: CommandContext
}

/**
 * The professional menu bar. Resolves every entry against the command registry,
 * so status (disabled + reason), checked state and shortcuts always match the
 * single source of truth. Submenus are flyouts (hover + ArrowRight/Left).
 */
export function MenuBar({ ctx }: MenuBarProps) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [openSub, setOpenSub] = useState<string | null>(null)
  const barRef = useRef<HTMLDivElement | null>(null)

  // Esc / outside-click close everything.
  useEffect(() => {
    if (!openId) return
    const onDoc = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenId(null)
        setOpenSub(null)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenId(null)
        setOpenSub(null)
      }
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [openId])

  const toggle = (id: string) => {
    setOpenSub(null)
    setOpenId((cur) => (cur === id ? null : id))
  }
  const switchTo = (id: string) => {
    if (openId) {
      setOpenSub(null)
      setOpenId(id)
    }
  }
  const closeAll = () => {
    setOpenId(null)
    setOpenSub(null)
  }

  return (
    <div ref={barRef} data-testid="menu-bar" role="menubar" aria-label="Main menu" style={{ display: 'flex', background: 'transparent', userSelect: 'none' }}>
      {menus.map((m) => (
        <TopMenu
          key={m.id}
          menu={m}
          open={openId === m.id}
          openSub={openSub}
          setOpenSub={setOpenSub}
          onToggle={() => toggle(m.id)}
          onHover={() => switchTo(m.id)}
          onCloseAll={closeAll}
          ctx={ctx}
        />
      ))}
    </div>
  )
}

function TopMenu({
  menu,
  open,
  openSub,
  setOpenSub,
  onToggle,
  onHover,
  onCloseAll,
  ctx,
}: {
  menu: MenuDef
  open: boolean
  openSub: string | null
  setOpenSub: (s: string | null) => void
  onToggle: () => void
  onHover: () => void
  onCloseAll: () => void
  ctx: CommandContext
}) {
  return (
    <div style={{ position: 'relative' }}>
      <button
        data-testid={menu.id}
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={onToggle}
        onMouseEnter={onHover}
        style={{
          background: open ? hoverBg : 'transparent',
          color: open ? '#fff' : text,
          border: 'none',
          padding: '5px 10px',
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        {menu.label}
      </button>
      {open && (
        <Dropdown
          menu={menu}
          openSub={openSub}
          setOpenSub={setOpenSub}
          onRun={onCloseAll}
          ctx={ctx}
        />
      )}
    </div>
  )
}

function Dropdown({
  menu,
  openSub,
  setOpenSub,
  onRun,
  ctx,
}: {
  menu: MenuDef
  openSub: string | null
  setOpenSub: (s: string | null) => void
  onRun: () => void
  ctx: CommandContext
}) {
  return (
    <div
      data-testid={`${menu.id}-dropdown`}
      role="menu"
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        minWidth: 240,
        background: itemBg,
        border: `1px solid ${border}`,
        boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
        padding: '4px 0',
        zIndex: 50,
      }}
    >
      <Entries menuId={menu.id} entries={menu.items} openSub={openSub} setOpenSub={setOpenSub} onRun={onRun} ctx={ctx} />
    </div>
  )
}

function Entries({
  menuId,
  entries,
  openSub,
  setOpenSub,
  onRun,
  ctx,
}: {
  menuId: string
  entries: MenuEntry[]
  openSub: string | null
  setOpenSub: (s: string | null) => void
  onRun: () => void
  ctx: CommandContext
}) {
  return (
    <>
      {entries.map((e, i) => {
        if (e.type === 'separator') {
          return <div key={`sep-${i}`} style={{ height: 1, background: border, margin: '4px 0' }} />
        }
        if (e.type === 'workspaceList') {
          return <WorkspaceListRows key={`ws-${menuId}`} onRun={onRun} ctx={ctx} />
        }
        if (e.type === 'recentList') {
          return <RecentListRows key={`recent-${menuId}`} onRun={onRun} ctx={ctx} />
        }
        if (e.type === 'submenu') {
          const key = `${menuId}>${e.label}`
          const expanded = openSub === key
          return (
            <div
              key={key}
              data-testid={`sub-${menuId}-${e.label}`}
              role="menuitem"
              aria-haspopup="menu"
              aria-expanded={expanded}
              onMouseEnter={() => setOpenSub(key)}
              style={{ position: 'relative' }}
            >
              <SubRow label={e.label} expanded={expanded} />
              {expanded && (
                <div
                  role="menu"
                  style={{
                    position: 'absolute',
                    left: '100%',
                    top: 0,
                    minWidth: 220,
                    background: itemBg,
                    border: `1px solid ${border}`,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
                    padding: '4px 0',
                  }}
                >
                  <Entries menuId={key} entries={e.items} openSub={openSub} setOpenSub={setOpenSub} onRun={onRun} ctx={ctx} />
                </div>
              )}
            </div>
          )
        }
        return <CommandRow key={`${e.id}${e.input !== undefined ? '-' + String(e.input) : ''}`} entry={e} onRun={onRun} ctx={ctx} />
      })}
    </>
  )
}

/** Dynamic Window ▸ Workspaces list — each saved name runs workspace.load(name). */
function WorkspaceListRows({ onRun, ctx }: { onRun: () => void; ctx: CommandContext }) {
  const names = ctx.listWorkspaces()
  const cmd = getCommand('workspace.load')
  if (!cmd) return null
  if (names.length === 0) {
    return <div style={{ padding: '5px 12px', fontSize: 12, color: dim }}>No saved workspaces</div>
  }
  return (
    <>
      {names.map((name) => {
        const active = ctx.activeWorkspace() === name
        return (
          <button
            key={name}
            data-testid={`menu-item-ws-${name}`}
            role="menuitem"
            onClick={() => {
              onRun()
              cmd.run(ctx, name)
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = hoverBg
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', boxSizing: 'border-box', textAlign: 'left', padding: '5px 12px', fontSize: 13, background: 'transparent', color: text, border: 'none', cursor: 'pointer' }}
          >
            <span style={{ width: 14, display: 'inline-block', textAlign: 'center' }}>{active ? '✓' : ''}</span>
            <span style={{ flex: 1 }}>{name}</span>
          </button>
        )
      })}
    </>
  )
}

/** Dynamic File ▸ Open Recent list — H06 §8: each entry runs the SAME
 *  canonical commandId as Open (file.open) with the entry as input. */
function RecentListRows({ onRun, ctx }: { onRun: () => void; ctx: CommandContext }) {
  const cmd = getCommand('file.open')
  const entries = listRecent()
  if (!cmd) return null
  if (entries.length === 0) {
    return <div style={{ padding: '5px 12px', fontSize: 12, color: dim }}>No recent files</div>
  }
  return (
    <>
      {entries.map((r) => (
        <button
          key={r.title}
          data-testid={`menu-item-recent-${r.title}`}
          role="menuitem"
          onClick={() => {
            onRun()
            cmd.run(ctx, r) // H06: the full entry — file.open handles already-open/guard/load
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = hoverBg
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', boxSizing: 'border-box', textAlign: 'left', padding: '5px 12px', fontSize: 13, background: 'transparent', color: text, border: 'none', cursor: 'pointer' }}
        >
          <span style={{ flex: 1 }}>{r.title}</span>
        </button>
      ))}
    </>
  )
}

function SubRow({ label, expanded }: { label: string; expanded: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '5px 12px',
        fontSize: 13,
        color: text,
        background: expanded ? hoverBg : 'transparent',
        cursor: 'default',
      }}
    >
      <span>{label}</span>
      <span style={{ color: dim }}>▸</span>
    </div>
  )
}

function CommandRow({ entry, onRun, ctx }: { entry: { id: string; input?: unknown; label?: string }; onRun: () => void; ctx: CommandContext }) {
  const cmd = getCommand(entry.id)
  if (!cmd) return null
  const label = entry.label ?? cmd.label
  // H09 §10: menu and shortcut invoke the SAME commandId — for parameterized
  // commands the entry's input is what the shortcut alias would carry.
  const shortcutDisplay = entry.input !== undefined ? shortcutDisplayFor(entry.id, entry.input) : undefined

  const disabledByStatus = cmd.status !== 'FUNCTIONAL'
  const disabledByContext = cmd.status === 'FUNCTIONAL' && cmd.enabled ? !cmd.enabled(ctx) : false
  const disabled = disabledByStatus || disabledByContext
  const reason = disabledByStatus
    ? cmd.reason ?? 'not available'
    : disabledByContext
      ? (cmd.whyDisabled ? cmd.whyDisabled(ctx) : 'not available')
      : undefined
  const isChecked = cmd.checked ? cmd.checked(ctx) : false

  return (
    <button
      data-testid={`menu-item-${cmd.id}${entry.input !== undefined ? '-' + String(entry.input) : ''}`}
      data-disabled={disabled ? 'true' : 'false'}
      role="menuitem"
      disabled={disabled}
      title={disabled ? reason : cmd.source}
      onClick={() => {
        if (disabled) return
        onRun()
        cmd.run(ctx, entry.input)
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        boxSizing: 'border-box',
        textAlign: 'left',
        padding: '5px 12px',
        fontSize: 13,
        background: 'transparent',
        color: disabled ? dim : text,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={(e) => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = hoverBg
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
      }}
    >
      <span style={{ width: 14, display: 'inline-block', textAlign: 'center' }}>{isChecked ? '✓' : ''}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {disabledByStatus && <span style={{ fontSize: 10, color: '#a88' }}>{cmd.status === 'DEFERRED' ? 'future' : 'n/a'}</span>}
      {(cmd.shortcut ?? shortcutDisplay) && <span style={{ color: dim, fontSize: 11, fontFamily: 'ui-monospace, monospace' }}>{cmd.shortcut ?? shortcutDisplay}</span>}
    </button>
  )
}
