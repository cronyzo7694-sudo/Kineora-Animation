import { beforeEach, describe, expect, it } from 'vitest'
import type { StorageLike } from './keys'
import { AI_KEYS_KEY, createKeyVault, PERSIST_WARNING } from './keys'
import { clearSecretRegistry, redactText } from './redact'

function memStorage(initial?: Record<string, string>): StorageLike & { dump(): Record<string, string> } {
  const m = new Map<string, string>(Object.entries(initial ?? {}))
  return {
    getItem: (k) => (m.has(k) ? (m.get(k) as string) : null),
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    dump: () => Object.fromEntries(m),
  }
}

beforeEach(() => {
  clearSecretRegistry()
})

describe('KeyVault — memory-only by default', () => {
  it('store has a usable warning constant for the opt-in checkbox', () => {
    expect(PERSIST_WARNING.length).toBeGreaterThan(20)
  })

  it('set() without persist writes NOTHING to storage', () => {
    const storage = memStorage()
    const vault = createKeyVault(storage)
    expect(vault.set('c1', 'sk-livekey-000011112222')).toBe('memory')
    expect(storage.dump()[AI_KEYS_KEY]).toBeUndefined()
    expect(vault.get('c1')).toBe('sk-livekey-000011112222')
    expect(vault.has('c1')).toBe(true)
    expect(vault.isPersisted('c1')).toBe(false)
  })

  it('set() with persist=true writes to storage and hydrates a fresh vault', () => {
    const storage = memStorage()
    const v1 = createKeyVault(storage)
    expect(v1.set('c1', 'sk-livekey-333344445555', { persist: true })).toBe('persisted')

    const v2 = createKeyVault(storage)
    expect(v2.get('c1')).toBe('sk-livekey-333344445555')
    expect(v2.isPersisted('c1')).toBe(true)
  })

  it('switching persist off removes the key from storage', () => {
    const storage = memStorage()
    const vault = createKeyVault(storage)
    vault.set('c1', 'sk-livekey-666677778888', { persist: true })
    vault.set('c1', 'sk-livekey-666677778888', { persist: false })
    expect(storage.dump()[AI_KEYS_KEY]).toBeUndefined()
    expect(vault.get('c1')).toBe('sk-livekey-666677778888')
  })

  it('remove() clears both tiers; clear() wipes all', () => {
    const storage = memStorage()
    const vault = createKeyVault(storage)
    vault.set('a', 'sk-key-aaaaaaaaaaaaaa', { persist: true })
    vault.set('b', 'sk-key-bbbbbbbbbbbbbb')
    vault.remove('a')
    expect(vault.has('a')).toBe(false)
    expect(JSON.parse(storage.dump()[AI_KEYS_KEY] ?? '{}')).toEqual({})
    vault.clear()
    expect(vault.describe()).toEqual({ count: 0, persistedCount: 0 })
    expect(storage.dump()[AI_KEYS_KEY]).toBeUndefined()
  })

  it('describe() never exposes key material', () => {
    const vault = createKeyVault(memStorage())
    vault.set('a', 'sk-key-cccccccccccccc', { persist: false })
    expect(JSON.stringify(vault.describe())).not.toContain('sk-key')
  })

  it('corrupt storage on hydrate is tolerated', () => {
    const storage = memStorage({ [AI_KEYS_KEY]: '{broken json' })
    const vault = createKeyVault(storage)
    expect(vault.describe().count).toBe(0)
  })
})

describe('KeyVault — redaction registry integration', () => {
  it('every stored key becomes redactable wherever it appears', () => {
    const vault = createKeyVault(memStorage())
    const weirdKey = 'totally-weird-format-key-998877'
    vault.set('c1', weirdKey)
    expect(redactText(`provider echoed ${weirdKey} in an error`)).toBe(
      'provider echoed [REDACTED] in an error',
    )
    vault.remove('c1')
    expect(redactText(`echo ${weirdKey}`)).toBe(`echo ${weirdKey}`)
  })
})
