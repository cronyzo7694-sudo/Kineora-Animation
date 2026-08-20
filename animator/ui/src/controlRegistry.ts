// Central control registry — the zero-dead-button data model (Phase-2.5 §2).
// The floating TOOLBAR is a curated projection of the full command registry
// (commands.ts): one command id drives the toolbar button, the menu item, the
// shortcut and the palette entry alike.
//
// Backward-compatible exports for existing consumers (App, Toolbar, DebugPanel,
// engine/client): `controls`, `validateRegistry`, `Control`, `ControlState`,
// `Visibility`, `AppContext`, `EngineStatus`.

import { commands, validateCommands, type Command, type CommandContext, type EngineStatus } from './commands'

export type { EngineStatus }
export type AppContext = CommandContext

export type ControlState = 'FUNCTIONAL' | 'DISABLED-BY-CONTEXT' | 'COMING-SOON'
export type Visibility =
  | 'ALWAYS'
  | 'CONTEXTUAL'
  | 'COLLAPSIBLE'
  | 'HIDDEN-WHEN-UNAVAILABLE'
  | 'DISABLED-WHEN-UNAVAILABLE'

export interface Control {
  id: string
  label: string
  a11y: string
  tooltip: string
  state: ControlState
  visibility: Visibility
  shortcut?: string
  /** Contextual availability (menus AND toolbar share it). */
  enabled?: (ctx: AppContext) => boolean
  /** Reason shown in the tooltip when enabled() is false. */
  whyDisabled?: (ctx: AppContext) => string
  action: (ctx: AppContext) => void
}

/** Map a full command to a toolbar control. */
function toControl(c: Command): Control {
  return {
    id: c.id,
    label: c.label,
    a11y: c.label,
    tooltip: c.shortcut ? `${c.label} (${c.shortcut})` : c.label,
    state: 'FUNCTIONAL',
    visibility: 'ALWAYS',
    shortcut: c.shortcut,
    enabled: c.enabled,
    whyDisabled: c.whyDisabled,
    action: (ctx) => c.run(ctx),
  }
}

export const controls: Control[] = commands.filter((c) => c.toolbar).map(toControl)

// Build-time / test-time validation: duplicate IDs, unbound FUNCTIONAL controls,
// missing a11y labels, shortcut conflicts. A functional-looking button must
// never do nothing.
export function validateRegistry(list: Control[] = controls): string[] {
  const errors: string[] = []
  const seen = new Set<string>()
  for (const c of list) {
    if (seen.has(c.id)) errors.push(`duplicate control id: ${c.id}`)
    seen.add(c.id)
    if (c.state === 'FUNCTIONAL' && typeof c.action !== 'function') {
      errors.push(`unbound FUNCTIONAL control: ${c.id}`)
    }
    if (!c.a11y || c.a11y.trim() === '') errors.push(`missing a11y label: ${c.id}`)
  }
  return errors
}

/** Full-registry integrity (ids, reasons, shortcut conflicts). */
export function validateAllCommands(): string[] {
  return validateCommands(commands)
}
