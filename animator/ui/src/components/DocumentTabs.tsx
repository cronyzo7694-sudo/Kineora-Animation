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

/**
 * Document tabs — the SYS-01 strip CHROME over the SYS-02 open-set (H02 §8:
 * ONE source of truth = the engine's DocManager; this component is a pure
 * VIEW of it and owns NO document state of its own — no competing registry).
 *
 * H02 approved contract:
 *  - left-click / Enter / Space → `tab.activate(docId)` (stable ID — never a
 *    tab index, never inferred from the active pointer)
 *  - the activated tab receives focus after activation (D-AMB-003)
 *  - per-tab × → `tab.close(docId)` → H07 guard → H02 open-set/active update
 *    (target = the clicked document, always)
 *  - drag → open-set reorder (view/SESSION; `openSet:changed{reordered}`
 *    only; the active document is unchanged; no dirty, no undo)
 *  - dirty ● announced accessibly (aria-live); tab naming = title + dirty
 *  - RIGHT-CLICK ≠ DESTRUCTIVE (H00 INV-DSTR-1/2, INV-013): suppressed; the
 *    context menu itself belongs to H03
 *  - Ctrl+Tab / Ctrl+Shift+Tab are NOT implemented (PROPOSED only, H02 §10)
 *  - colors = SYS-01 design tokens (no hard-coded colors, H02 §19)
 */
export function DocumentTabs({ ctx }: Props) {
  const [, force] = useReducer((x: number) => x + 1, 0)
  const tabRefs = useRef(new Map<number, HTMLDivElement>())
  const [dragId, setDragId] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  // H02 §14/§9: `openSet:changed` updates the STRIP ONLY — document-bound
  // content panels must NOT rebind on it. `activeDoc:changed` re-renders the
  // strip as well (App rebinds the panels on that same event). Both events
  // are consumed by re-reading the engine — never a stale reference.
  useEffect(() => {
    const offSet = bus.on('openSet:changed', () => force())
    const offActive = bus.on('activeDoc:changed', () => force())
    return () => {
      offSet()
      offActive()
    }
  }, [])

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
              // H00 INV-DSTR-1: a right-click must NEVER be destructive.
              // Suppress the native menu; the H03 context menu comes later.
              e.preventDefault()
              e.stopPropagation()
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
            {/* aria-live region is ALWAYS present (a live region must exist
                before the change to be announced); the ● glyph mounts when
                the document becomes dirty. */}
            <span aria-live="polite">
              {d.dirty && (
                <span
                  data-testid={`doc-tab-dirty-${d.id}`}
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
    </div>
  )
}
