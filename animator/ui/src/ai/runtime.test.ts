import { describe, expect, it } from 'vitest'
import type { StorageLike } from './keys'
import { createAiRuntime } from './runtime'

function memoryStorage(): StorageLike {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value) },
    removeItem: (key) => { values.delete(key) },
  }
}

describe('A6 runtime gesture-idle bridge', () => {
  it('starts idle and exposes only the Stage busy/idle boolean', () => {
    const runtime = createAiRuntime(memoryStorage())
    expect(runtime.isGestureActive()).toBe(false)
    runtime.setGestureActive(true)
    expect(runtime.isGestureActive()).toBe(true)
    runtime.setGestureActive(false)
    expect(runtime.isGestureActive()).toBe(false)
  })
})
