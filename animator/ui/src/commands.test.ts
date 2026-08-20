import { describe, expect, it } from 'vitest'
import {
  commands,
  eventToCanonical,
  findCommandByEvent,
  getCommand,
  shortcutToCanonical,
  validateCommands,
} from './commands'
import { validateAllCommands, validateRegistry, controls } from './controlRegistry'

describe('command registry integrity (zero dead buttons)', () => {
  it('passes full validation: unique ids, bound FUNCTIONAL, reasons, no shortcut conflicts', () => {
    expect(validateCommands(commands)).toEqual([])
  })

  it('every command id is unique', () => {
    const ids = commands.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every FUNCTIONAL command has a run', () => {
    for (const c of commands.filter((c) => c.status === 'FUNCTIONAL')) {
      expect(typeof c.run, `run missing on ${c.id}`).toBe('function')
    }
  })

  it('every DEFERRED/UNAVAILABLE command carries a human reason (never a silent grey box)', () => {
    for (const c of commands.filter((c) => c.status !== 'FUNCTIONAL')) {
      expect(c.reason, `reason missing on ${c.id}`).toBeTruthy()
    }
  })

  it('detects a shortcut conflict between two commands', () => {
    const errs = validateCommands([
      { id: 'a', label: 'A', category: 'app', status: 'FUNCTIONAL', source: 't', shortcut: 'Ctrl+Z', run: () => {} },
      { id: 'b', label: 'B', category: 'app', status: 'FUNCTIONAL', source: 't', shortcut: 'Ctrl+Z', run: () => {} },
    ])
    expect(errs.some((e) => e.includes('shortcut conflict'))).toBe(true)
  })

  it('rejects a FUNCTIONAL command with no run', () => {
    const errs = validateCommands([
      { id: 'x', label: 'X', category: 'app', status: 'FUNCTIONAL', source: 't' } as never,
    ])
    expect(errs.some((e) => e.includes('no run'))).toBe(true)
  })

  it('toolbar controls pass the legacy registry validation (0 dead buttons)', () => {
    expect(validateRegistry(controls)).toEqual([])
    expect(validateAllCommands()).toEqual([])
  })

  it('toolbar is a projection of the command registry (same ids/actions)', () => {
    for (const c of controls) {
      const cmd = getCommand(c.id)
      expect(cmd, `toolbar control ${c.id} has no command`).toBeTruthy()
    }
  })
})

describe('shortcut canonicalization', () => {
  it('parses display strings to canonical form', () => {
    expect(shortcutToCanonical('Ctrl+Shift+Z')).toBe('ctrl+shift+z')
    expect(shortcutToCanonical('Shift+F5')).toBe('shift+f5')
    expect(shortcutToCanonical('Ctrl+=')).toBe('ctrl+=')
    expect(shortcutToCanonical('Ctrl+Shift+=')).toBe('ctrl+=') // same physical gesture
    expect(shortcutToCanonical('Alt+,')).toBe('alt+,')
    expect(shortcutToCanonical('.')).toBe('.')
    expect(shortcutToCanonical('Ctrl+Alt+T')).toBe('ctrl+alt+t')
  })

  it('normalizes keyboard events', () => {
    expect(eventToCanonical({ key: 'z', ctrlKey: true })).toBe('ctrl+z')
    expect(eventToCanonical({ key: 'Z', ctrlKey: true, shiftKey: true })).toBe('ctrl+shift+z')
    expect(eventToCanonical({ key: 'F5', shiftKey: true })).toBe('shift+f5')
    expect(eventToCanonical({ key: '=', ctrlKey: true })).toBe('ctrl+=')
    expect(eventToCanonical({ key: '+', ctrlKey: true, shiftKey: true })).toBe('ctrl+=')
    expect(eventToCanonical({ key: '.', altKey: true })).toBe('alt+.')
    expect(eventToCanonical({ key: 'Enter' })).toBe('enter')
    expect(eventToCanonical({ key: 'Home' })).toBe('home')
  })

  it('resolves events to the right command', () => {
    expect(findCommandByEvent({ key: 'z', ctrlKey: true })?.id).toBe('edit.undo')
    expect(findCommandByEvent({ key: 'z', ctrlKey: true, shiftKey: true })?.id).toBe('edit.redo')
    expect(findCommandByEvent({ key: 'y', ctrlKey: true })?.id).toBe('edit.redo') // Ctrl+Y alias
    expect(findCommandByEvent({ key: 'F6' })?.id).toBe('timeline.keyframe')
    expect(findCommandByEvent({ key: 'F6', shiftKey: true })?.id).toBe('timeline.clear')
    expect(findCommandByEvent({ key: 'F8', ctrlKey: true })?.id).toBe('insert.newSymbol')
    expect(findCommandByEvent({ key: 'F8' })?.id).toBe('modify.convertSymbol')
    expect(findCommandByEvent({ key: '.', altKey: true })?.id).toBe('control.nextKeyframe')
    expect(findCommandByEvent({ key: 'Enter' })?.id).toBe('timeline.play')
  })
})
