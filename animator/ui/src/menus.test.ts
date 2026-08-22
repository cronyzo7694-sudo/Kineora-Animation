import { describe, expect, it } from 'vitest'
import { getCommand } from './commands'
import { menus, type MenuEntry } from './menus'

function* walk(entries: MenuEntry[]): Generator<MenuEntry> {
  for (const e of entries) {
    yield e
    if (e.type === 'submenu') yield* walk(e.items)
  }
}

describe('menu tree (Blueprint Part 01 §1.2 + Adobe menu bar)', () => {
  it('has the 11 professional top-level menus in order', () => {
    expect(menus.map((m) => m.label)).toEqual([
      'File',
      'Edit',
      'View',
      'Insert',
      'Modify',
      'Text',
      'Commands',
      'Control',
      'Debug',
      'Window',
      'Help',
    ])
  })

  it('every menu entry references a command that exists in the registry', () => {
    const missing: string[] = []
    for (const m of menus) {
      for (const e of walk(m.items)) {
        if (e.type === 'command' && !getCommand(e.id)) missing.push(`${m.id} → ${e.id}`)
      }
    }
    expect(missing).toEqual([])
  })

  it('every top-level menu exposes at least one FUNCTIONAL command (Text/Commands are intentionally fully deferred)', () => {
    const fullyDeferred = new Set(['menu.text', 'menu.commands'])
    for (const m of menus) {
      const entries = [...walk(m.items)]
      const functional = entries.filter((e) => e.type === 'command' && getCommand(e.id)?.status === 'FUNCTIONAL')
      if (fullyDeferred.has(m.id)) {
        // Honest deferral: every item is DEFERRED/UNAVAILABLE with a reason.
        for (const e of entries) {
          if (e.type === 'command') {
            const c = getCommand(e.id)!
            expect(c.status, `${m.id} → ${e.id} should be deferred`).not.toBe('FUNCTIONAL')
            expect(c.reason, `${m.id} → ${e.id} needs a reason`).toBeTruthy()
          }
        }
        continue
      }
      expect(functional.length, `${m.id} has no functional commands`).toBeGreaterThan(0)
    }
  })

  it('required menu command ids are present', () => {
    const ids = [...menus.flatMap((m) => [...walk(m.items)])].filter((e) => e.type === 'command').map((e) => (e as { id: string }).id)
    for (const required of [
      'file.new',
      'file.open',
      'file.save',
      'file.export',
      'edit.undo',
      'edit.redo',
      'edit.selectAll',
      'edit.deselectAll',
      'view.zoomIn',
      'view.zoomFit',
      'insert.newSymbol',
      'timeline.insertframe',
      'timeline.keyframe',
      'modify.document',
      'modify.convertSymbol',
      'timeline.play',
      'control.loop',
      'panel.timeline',
      'panel.library',
      'window.hideAllPanels',
      'window.resetWorkspace',
      'debug.clearOutput',
      'debug.copyOutput',
      'help.shortcuts',
      'help.about',
    ]) {
      expect(ids, `missing menu command ${required}`).toContain(required)
    }
  })
})
