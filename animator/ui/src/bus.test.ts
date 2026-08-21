import { describe, expect, it, vi } from 'vitest'
import { EventBus } from './bus'

describe('MOD-BUS (SYS-01 §27)', () => {
  it('delivers an event to all subscribers in order', () => {
    const b = new EventBus()
    const seen: string[] = []
    b.on('tool:changed', () => seen.push('a'))
    b.on('tool:changed', () => seen.push('b'))
    b.emit('tool:changed', { toolId: 'select' })
    expect(seen).toEqual(['a', 'b'])
  })

  it('unsubscribe stops delivery', () => {
    const b = new EventBus()
    const fn = vi.fn()
    const off = b.on('panel:changed', fn)
    off()
    b.emit('panel:changed', { id: 'library', change: 'visibility', visible: false })
    expect(fn).not.toHaveBeenCalled()
  })

  it('once fires exactly once', () => {
    const b = new EventBus()
    const fn = vi.fn()
    b.once('workspace:changed', fn)
    b.emit('workspace:changed', { name: 'a' })
    b.emit('workspace:changed', { name: 'b' })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('a throwing subscriber is isolated: others still run, error routed to the sink', () => {
    const b = new EventBus()
    const errors: Array<[string, unknown]> = []
    b.setErrorHandler((e, err) => errors.push([e, err]))
    const after = vi.fn()
    b.on('playback:started', () => {
      throw new Error('boom')
    })
    b.on('playback:started', after)
    b.emit('playback:started', {})
    expect(after).toHaveBeenCalledTimes(1)
    expect(errors.length).toBe(1)
    expect(errors[0][0]).toBe('playback:started')
  })

  it('duplicate emission is safe (idempotent delivery)', () => {
    const b = new EventBus()
    const fn = vi.fn()
    b.on('playhead:moved', fn)
    b.emit('playhead:moved', { frame: 3 })
    b.emit('playhead:moved', { frame: 3 })
    expect(fn).toHaveBeenCalledTimes(2) // delivered, but consumers re-read model (§27 stale)
  })

  it('clear removes all listeners (test isolation)', () => {
    const b = new EventBus()
    const fn = vi.fn()
    b.on('mode:changed', fn)
    b.clear()
    b.emit('mode:changed', { modeId: 'transform', active: true })
    expect(fn).not.toHaveBeenCalled()
  })
})
