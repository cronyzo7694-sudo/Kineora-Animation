import { describe, expect, it } from 'vitest'
import {
  AI_DAILY_TOKEN_CEILING_KEY,
  checkUsageReservation,
  createDailyTokenCeilingStore,
  estimateInputReservation,
} from './budget'
import type { StorageLike } from './keys'

function memoryStorage(): StorageLike & { dump(): Record<string, string> } {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value) },
    removeItem: (key) => { values.delete(key) },
    dump: () => Object.fromEntries(values),
  }
}

describe('A6.3 daily token ceiling', () => {
  it('has no invented default and accepts only a positive safe integer', () => {
    const store = createDailyTokenCeilingStore()
    expect(store.get()).toBeNull()
    expect(() => store.set(0)).toThrow()
    expect(() => store.set(1.5)).toThrow()
    store.set(10_000)
    expect(store.get()).toBe(10_000)
  })

  it('persists only the non-secret ceiling preference', () => {
    const storage = memoryStorage()
    const store = createDailyTokenCeilingStore(storage)
    store.set(50_000)
    expect(JSON.parse(storage.dump()[AI_DAILY_TOKEN_CEILING_KEY] ?? '{}')).toEqual({ ceiling: 50_000 })
    expect(JSON.stringify(storage.dump())).not.toMatch(/provider|model|key|prompt/i)
    expect(createDailyTokenCeilingStore(storage).get()).toBe(50_000)
  })

  it('reserves every UTF-8 request byte plus requested max output before dispatch', () => {
    const messages = [{ role: 'user' as const, content: 'हिन्दी request' }]
    const reservedInput = estimateInputReservation(messages)
    const result = checkUsageReservation({
      ceiling: 10_000,
      today: { requests: 2, inputTokens: 100, outputTokens: 50 },
      messages,
      maxTokens: 500,
    })
    expect(result).toMatchObject({
      allowed: true,
      used: 150,
      reservedInput,
      reservedOutput: 500,
      projected: 150 + reservedInput + 500,
    })
  })

  it('refuses a reservation that would exceed the configured ceiling', () => {
    const result = checkUsageReservation({
      ceiling: 100,
      today: { requests: 1, inputTokens: 80, outputTokens: 10 },
      messages: [{ role: 'user', content: 'request' }],
      maxTokens: 20,
    })
    expect(result.allowed).toBe(false)
    expect(result.projected).toBeGreaterThan(result.ceiling)
  })

  it('marks unexpected overage exhausted for that UTC day and resets on the next day', () => {
    let now = Date.UTC(2026, 7, 23)
    const store = createDailyTokenCeilingStore(undefined, () => now)
    store.set(1_000)
    store.markExhausted()
    expect(store.isExhausted()).toBe(true)
    now += 24 * 60 * 60 * 1_000
    expect(store.isExhausted()).toBe(false)
    expect(store.get()).toBe(1_000)
  })
})
