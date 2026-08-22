// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { outputLog, outputInfo, outputWarn, outputError, outputDebug } from './outputLog'

// outputLog is a process-wide singleton; other suites may have populated it.
// Wipe it before this file runs so id 0 is the first entry.
outputLog.clear()

describe('SYS-10 OutputLog', () => {
  beforeEach(() => outputLog.clear())
  afterEach(() => outputLog.clear())

  it('appends entries with monotonic ids and timestamps', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-22T10:00:00Z'))
    const a = outputInfo('bus', 'hello')
    vi.setSystemTime(new Date('2026-08-22T10:00:05Z'))
    const b = outputError('engine', 'boom')
    expect(a.id).toBe(0)
    expect(b.id).toBe(1)
    expect(a.t).toBe(new Date('2026-08-22T10:00:00Z').getTime())
    expect(b.level).toBe('error')
    vi.useRealTimers()
  })

  it('subscribers receive the full snapshot on append and on subscribe', () => {
    const seen: number[][] = []
    outputInfo('x', 'first')
    const unsub = outputLog.subscribe((entries) => seen.push(entries.map((e) => e.id)))
    expect(seen[seen.length - 1]).toEqual([0])
    outputWarn('x', 'second')
    outputDebug('x', 'third')
    expect(seen[seen.length - 1]).toEqual([0, 1, 2])
    unsub()
    outputInfo('x', 'after-unsub')
    expect(seen.length).toBe(3) // no new callback after unsubscribe
  })

  it('clear() empties the buffer and notifies subscribers', () => {
    outputInfo('a', '1')
    outputInfo('b', '2')
    let calls = 0
    const unsub = outputLog.subscribe(() => calls++)
    const before = calls
    outputLog.clear()
    expect(outputLog.size()).toBe(0)
    expect(outputLog.all()).toEqual([])
    expect(calls).toBeGreaterThan(before)
    unsub()
  })

  it('caps at the configured ring capacity (oldest entries dropped)', () => {
    const small = new (outputLog.constructor as new (cap: number) => typeof outputLog)(3)
    small.append('info', 'a', '1')
    small.append('info', 'a', '2')
    small.append('info', 'a', '3')
    small.append('info', 'a', '4')
    const all = small.all()
    expect(all.map((e) => e.message)).toEqual(['2', '3', '4'])
  })

  it('a throwing subscriber does not break other subscribers', () => {
    const bad = () => {
      throw new Error('subscriber boom')
    }
    const good: number[] = []
    outputLog.subscribe(bad)
    outputLog.subscribe((entries) => good.push(entries.length))
    expect(() => outputInfo('x', 'ok')).not.toThrow()
    expect(good[good.length - 1]).toBe(1)
  })

  it('level helpers route to the correct level', () => {
    outputInfo('s', 'i')
    outputWarn('s', 'w')
    outputError('s', 'e')
    outputDebug('s', 'd')
    const levels = outputLog.all().map((e) => e.level)
    expect(levels).toEqual(['info', 'warn', 'error', 'debug'])
  })
})
