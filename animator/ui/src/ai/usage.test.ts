import { describe, expect, it } from 'vitest'
import type { StorageLike } from './keys'
import { AI_USAGE_KEY, createUsageMeter } from './usage'

function memStorage(): StorageLike & { dump(): Record<string, string> } {
  const m = new Map<string, string>()
  return {
    getItem: (k) => (m.has(k) ? (m.get(k) as string) : null),
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    dump: () => Object.fromEntries(m),
  }
}

describe('UsageMeter', () => {
  it('accumulates session + daily totals and persists daily only', () => {
    const storage = memStorage()
    const meter = createUsageMeter(storage)
    meter.record({ configId: 'c1', model: 'm', inputTokens: 100, outputTokens: 40 })
    meter.record({ configId: 'c1', model: 'm', inputTokens: 10, outputTokens: 5 })
    expect(meter.session()).toEqual({ requests: 2, inputTokens: 110, outputTokens: 45 })
    expect(meter.today()).toEqual({ requests: 2, inputTokens: 110, outputTokens: 45 })

    // A "new session" (fresh meter over same storage) keeps daily, drops session.
    const meter2 = createUsageMeter(storage)
    expect(meter2.session()).toEqual({ requests: 0, inputTokens: 0, outputTokens: 0 })
    expect(meter2.today()).toEqual({ requests: 2, inputTokens: 110, outputTokens: 45 })
  })

  it('resets daily counters when the date changes', () => {
    const storage = memStorage()
    let t = Date.UTC(2026, 7, 22, 10, 0, 0)
    const meter = createUsageMeter(storage, () => t)
    meter.record({ configId: 'c', model: 'm', inputTokens: 5, outputTokens: 5 })
    t = Date.UTC(2026, 7, 23, 10, 0, 0)
    meter.record({ configId: 'c', model: 'm', inputTokens: 7, outputTokens: 7 })
    expect(meter.today()).toEqual({ requests: 1, inputTokens: 7, outputTokens: 7 })
    expect(meter.session()).toEqual({ requests: 2, inputTokens: 12, outputTokens: 12 })
  })

  it('ignores malformed token values and notifies subscribers', () => {
    const meter = createUsageMeter(memStorage())
    let pings = 0
    const off = meter.subscribe(() => (pings += 1))
    meter.record({ configId: 'c', model: 'm', inputTokens: Number.NaN, outputTokens: -3 })
    expect(meter.session()).toEqual({ requests: 1, inputTokens: 0, outputTokens: 0 })
    expect(pings).toBe(1)
    off()
    meter.record({ configId: 'c', model: 'm' })
    expect(pings).toBe(1) // unsubscribed listeners stop firing
  })

  it('resetSession clears session but keeps daily', () => {
    const storage = memStorage()
    const meter = createUsageMeter(storage)
    meter.record({ configId: 'c', model: 'm', inputTokens: 3, outputTokens: 3 })
    meter.resetSession()
    expect(meter.session().requests).toBe(0)
    expect(meter.today().requests).toBe(1)
    expect(storage.dump()[AI_USAGE_KEY]).toBeDefined()
  })
})
