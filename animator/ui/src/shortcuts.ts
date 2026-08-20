// ============================================================================
// SHORTCUT DISPATCHER — one normalization + one lookup, used by every surface.
//
// Components attach ONE window keydown listener via `useShortcutScope` with the
// set of command ids they own (their scope). Scopes are DISJOINT, so at app
// runtime a key is handled exactly once even though App, Stage and Timeline
// each listen — but the shortcut→command mapping lives only here (in
// commands.ts), never duplicated in a component.
//
// Honesty rule: a disabled command is never silently swallowed — the dispatcher
// reports WHY it did not run (e.g. "Undo: engine not attached — build …").
// ============================================================================

import { useEffect, useRef } from 'react'
import { findCommandByEvent, type CommandContext } from './commands'

/**
 * Attach a scoped global shortcut listener.
 * @param scope command ids this owner is responsible for
 * @param ctx   latest command context (captured in a ref — listener attached once)
 */
export function useShortcutScope(scope: ReadonlySet<string>, ctx: CommandContext): void {
  const ctxRef = useRef(ctx)
  ctxRef.current = ctx
  const scopeRef = useRef(scope)
  scopeRef.current = scope

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      // Enter/Space on a focused button must trigger the button's native
      // activation, not a global shortcut (never double-fire).
      if ((e.key === 'Enter' || e.key === ' ') && t && (t.tagName === 'BUTTON' || t.tagName === 'A' || t.getAttribute('role') === 'button')) return
      // pure modifier presses never dispatch
      if (e.key === 'Control' || e.key === 'Meta' || e.key === 'Alt' || e.key === 'Shift') return

      const cmd = findCommandByEvent(e)
      if (!cmd || !scopeRef.current.has(cmd.id)) return

      const c = ctxRef.current
      if (cmd.status !== 'FUNCTIONAL') return
      if (cmd.enabled && !cmd.enabled(c)) {
        e.preventDefault()
        const why = cmd.whyDisabled ? cmd.whyDisabled(c) : 'not available'
        c.notify(`${cmd.label}: ${why}`)
        return
      }
      e.preventDefault()
      cmd.run(c)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
