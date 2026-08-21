import { useEffect, useReducer, useRef, useState } from 'react'
import { getCommand } from '../commands'
import type { CommandContext } from '../commands'
import { bus } from '../bus'
import { activeDocId, docList } from '../engine/client'
import { reorderDocument } from '../file'
import type { DocJson } from '../engine/wasmTypes'

interface Props {
  ctx: CommandContext
}

interface TabMenu {
  /** The right-clicked document's STABLE id — captured at right-click time
   *  (H03 §7: never a DOM index, never the active pointer, never a stale
   *  closure over a tab element). */
  docId: number
  x: number
  y: number
}

/**
 * Document tabs — the SYS-01 strip CHROME over the SYS-02 open-set (H02 §8:
 * ONE source of truth = the engine's DocManager; this component is a pure
 * VIEW of it and owns NO document state of its own — no competing registry).
 *
 * H02 approved contract:
 *  - left-click / Enter / Space → `tab.activate(docId)` (stable ID)
 *  - the activated tab receives focus after activation (D-AMB-003)
 *  - per-tab × → `tab.close(docId)` → H07 guard → H02 open-set/active update
 *  - drag → open-set reorder (`openSet:changed{reordered}` only; the active
 *    document is unchanged; no dirty, no undo)
 *  - Ctrl+Tab / Ctrl+Shift+Tab are NOT implemented (PROPOSED only, H02 §10)
 *
 * H03 approved contract (tab context menu + destructive safety):
 *  - right-click → context menu with EXACTLY ONE item: "Close" (H03 §6.2 —
 *    Close Others is an Adobe-only feature, EXCLUDED; no invented items)
 *  - opening the menu is NON-DESTRUCTIVE: it never closes/discards/mutates/
 *    ACTIVATES anything, and emits NO events (H03 §6.1/§14, INV-DSTR-1/2)
 *  - the menu targets the right-clicked document by stable ID; right-click
 *    does NOT activate the target (INV-DSTR-2)
 *  - Close item → `tab.close(targetDocId)` — the SAME canonical commandId as
 *    the tab × (H02 §12, no drift) → H04/H07 guard flow
 *  - Esc / outside-click / focus-loss → CANCEL (no mutation); target doc
 *    removed while open → DISMISS (safe invalidation, H03 §17)
 *
 * H04 approved contract (dirty indicator):
 *  - the ● follows each DOCUMENT (per-doc dirty, never the active pointer);
 *    it updates on `document:changed` (H04 §10) — not on polling
 *  - aria-live="polite" + aria-label="unsaved changes" (H04 §13)
 *
 * Colors = SYS-01 design tokens (no hard-coded colors, H02 §19/H03 §16).
 */
export function DocumentTabs({ ctx }: Props) {
  const [, force] = useReducer((x: number) => x + 1, 0)
  const tabRefs = useRef(new Map<number, HTMLDivElement>())
  const menuRef = useRef<HTMLDivElement>(null)
  const menuItemRef = useRef<HTMLDivElement>(null)
  const [dragId, setDragId] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [menu, setMenu] = useState<TabMenu | null>(null)

  // refs so the once-registered event handlers always see fresh values
  const menuRef2 = useRef(menu)
  menuRef2.current = menu

  const focusAfterMenu = (docId: number) => {
    // H03 §16: focus returns to the target tab on dismiss. When the target
    // itself is gone (DISMISS), fall back to the active tab — never a crash.
    tabRefs.current.get(docId)?.focus()
    if (!tabRefs.current.get(docId)) tabRefs.current.get(activeDocId())?.focus()
  }
  const focusAfterMenuRef = useRef(focusAfterMenu)
  focusAfterMenuRef.current = focusAfterMenu

  // H02 §14/§9: `openSet:changed` re-renders the STRIP ONLY (document-bound
  // panels do NOT rebind on it). H03 §17: a lifecycle transition (doc added
  // or removed) while the menu is open → DISMISS; a reorder keeps the menu
  // valid (the target is a stable ID). H04 §10: `document:changed` (any
  // document mutation) re-reads the engine so each tab's dirty ● is
  // immediate — never poll-driven.
  useEffect(() => {
    const offSet = bus.on('openSet:changed', (p) => {
      force()
      const m = menuRef2.current
      if (m && p.change !== 'reordered') {
        const docId = m.docId
        setMenu(null)
        focusAfterMenuRef.current(docId)
      }
    })
    const offActive = bus.on('activeDoc:changed', () => force())
    const offDoc = bus.on('document:changed', () => force())
    return () => {
      offSet()
      offActive()
      offDoc()
    }
  }, [])

  // H03 §17 DISMISS: the target document was removed (closed elsewhere)
  // while the menu is open → the Close item's target no longer exists.
  useEffect(() => {
    if (menu && !docList().some((d) => d.id === menu.docId)) {
      const docId = menu.docId
      setMenu(null)
      focusAfterMenu(docId)
    }
  }, [menu])

  // H03 §16/§17: the menu takes focus on open; Esc = CANCEL, outside-click =
  // CANCEL (no mutation on either path).
  useEffect(() => {
    if (!menu) return
    const docId = menu.docId
    menuItemRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setMenu(null)
        focusAfterMenuRef.current(docId)
      }
    }
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && e.target instanceof Node && menuRef.current.contains(e.target)) return
      setMenu(null)
      focusAfterMenuRef.current(docId)
    }
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('mousedown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('mousedown', onDown)
    }
  }, [menu])

  // The engine is the single source of truth — re-read it on every render.
  const docs: DocJson[] = docList()
  const activeId = activeDocId()

  if (docs.length === 0) {
    return (
      <div
        data-testid="no-doc-tabs"
        style={{
          padding: '3px 12px',
          background: 'var(--kineora-panel-2)',
          borderBottom: '1px solid var(--kineora-border)',
          color: 'var(--kineora-disabled-text)',
          fontSize: 11,
        }}
      >
        No document open — File ▸ New (Ctrl+N) or Open (Ctrl+O)
      </div>
    )
  }

  const activate = (id: number) => {
    if (id === activeId) return // idempotent no-op (H02 edge 11)
    getCommand('tab.activate')?.run(ctx, id)
    // D-AMB-003: the activated tab receives focus after activation.
    tabRefs.current.get(id)?.focus()
  }

  const menuDoc = menu ? docs.find((d) => d.id === menu.docId) : undefined

  return (
    <div
      data-testid="doc-tabs"
      role="tablist"
      aria-label="Open documents"
      style={{
        display: 'flex',
        gap: 2,
        padding: '3px 12px 0',
        background: 'var(--kineora-panel-2)',
        borderBottom: '1px solid var(--kineora-border)',
        alignItems: 'flex-end',
      }}
    >
      {docs.map((d, index) => {
        const active = d.id === activeId
        const isDropTarget = dragId !== null && dropIndex === index && d.id !== dragId
        return (
          <div
            key={d.id}
            ref={(el) => {
              if (el) tabRefs.current.set(d.id, el)
              else tabRefs.current.delete(d.id)
            }}
            data-testid={`doc-tab-${d.id}`}
            data-active={active ? 'true' : 'false'}
            role="tab"
            aria-selected={active}
            aria-label={`${d.title}${d.dirty ? ' — unsaved' : ''}`}
            title={d.title}
            tabIndex={0}
            draggable
            onDragStart={(e) => {
              e.dataTransfer?.setData('text/plain', String(d.id))
              e.dataTransfer.effectAllowed = 'move'
              setDragId(d.id)
            }}
            onDragEnd={() => {
              setDragId(null)
              setDropIndex(null)
            }}
            onDragOver={(e) => {
              if (dragId === null || dragId === d.id) return
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
              setDropIndex(index)
            }}
            onDrop={(e) => {
              e.preventDefault()
              const fromId = Number(e.dataTransfer?.getData('text/plain'))
              setDragId(null)
              setDropIndex(null)
              // H02 app.tab.reorder — chrome view action (no command by
              // design, H02 §12): open-set order is SESSION state.
              if (Number.isFinite(fromId) && fromId > 0 && fromId !== d.id) {
                reorderDocument(fromId, index, ctx.notify)
              }
            }}
            onClick={() => activate(d.id)}
            onKeyDown={(e) => {
              // H02 §19: Enter / Space activate the focused tab.
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                activate(d.id)
              }
            }}
            onContextMenu={(e) => {
              // H03 §6.1/§7/§8: right-click opens the context menu — it
              // NEVER activates, NEVER closes, NEVER emits (INV-DSTR-1/2).
              // The target is this tab's stable Document ID, captured now.
              e.preventDefault()
              e.stopPropagation()
              setMenu({ docId: d.id, x: e.clientX, y: e.clientY })
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 8px',
              fontSize: 12,
              border: `1px solid ${isDropTarget ? 'var(--kineora-accent)' : 'var(--kineora-border)'}`,
              borderBottom: 'none',
              borderRadius: '4px 4px 0 0',
              background: active ? 'var(--kineora-dropdown)' : 'var(--kineora-panel)',
              color: active ? 'var(--kineora-text-bright)' : 'var(--kineora-muted)',
              cursor: 'pointer',
              userSelect: 'none',
              outline: isDropTarget ? '2px solid var(--kineora-accent)' : undefined,
              outlineOffset: -2,
            }}
          >
            <span data-testid={`doc-tab-title-${d.id}`}>{d.title}</span>
            {/* H04 §13: aria-live region is ALWAYS present (a live region
                must exist before the change to be announced); the ● glyph
                mounts when the document becomes dirty. */}
            <span aria-live="polite">
              {d.dirty && (
                <span
                  data-testid={`doc-tab-dirty-${d.id}`}
                  aria-label="unsaved changes"
                  title="unsaved changes"
                  style={{ color: 'var(--kineora-warning)' }}
                >
                  ●
                </span>
              )}
            </span>
            <button
              data-testid={`doc-tab-close-${d.id}`}
              aria-label={`Close ${d.title}`}
              title="Close document"
              onClick={(e) => {
                e.stopPropagation()
                // H02 app.tab.close: TARGET = the clicked document's stable
                // id — never the active-by-inference, never a tab index.
                getCommand('tab.close')?.run(ctx, d.id)
              }}
              style={{
                padding: 0,
                width: 14,
                height: 14,
                borderRadius: 3,
                border: 'none',
                background: 'transparent',
                color: 'var(--kineora-muted)',
                cursor: 'pointer',
                fontSize: 12,
                lineHeight: '14px',
              }}
            >
              ×
            </button>
          </div>
        )
      })}

      {/* H03 tab context menu (L4 overlay, SYS-01 C-07). EXACTLY ONE item —
          "Close" — targeting the right-clicked document's stable id. */}
      {menu && menuDoc && (
        <div
          ref={menuRef}
          data-testid="ctx-tab-menu"
          role="menu"
          aria-label="Tab menu"
          onContextMenu={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: menu.y,
            left: menu.x,
            zIndex: 94,
            minWidth: 140,
            padding: '4px 0',
            background: 'var(--kineora-dropdown)',
            border: '1px solid var(--kineora-border-2)',
            borderRadius: 4,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div
            ref={menuItemRef}
            data-testid="ctx-tab-close"
            role="menuitem"
            tabIndex={0}
            aria-label={`Close ${menuDoc.title}`}
            onClick={() => {
              const target = menu.docId
              setMenu(null)
              // H03 §6.3: the SAME canonical commandId as the tab × (H02 §12
              // — no drift). Dirty target → H04/H07 guard flow; cancel leaves
              // everything unchanged.
              getCommand('tab.close')?.run(ctx, target)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                const target = menu.docId
                setMenu(null)
                getCommand('tab.close')?.run(ctx, target)
              }
            }}
            style={{
              padding: '6px 14px',
              fontSize: 13,
              color: 'var(--kineora-text)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Close
          </div>
        </div>
      )}
    </div>
  )
}
