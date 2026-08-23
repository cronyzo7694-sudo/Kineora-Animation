import { describe, expect, it } from 'vitest'
import type { StorageLike } from './keys'
import {
  AI_CONSENT_KEY,
  AI_PROVIDERS_KEY,
  createProviderStore,
  grantConsent,
  hasConsent,
  revokeConsent,
  validateConfig,
} from './providers'

function memStorage(initial?: Record<string, string>): StorageLike & { dump(): Record<string, string> } {
  const m = new Map<string, string>(Object.entries(initial ?? {}))
  return {
    getItem: (k) => (m.has(k) ? (m.get(k) as string) : null),
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    dump: () => Object.fromEntries(m),
  }
}

const openAiDraft = {
  type: 'openai' as const,
  label: 'Personal OpenAI',
  model: 'gpt-4o-mini',
}

describe('validateConfig', () => {
  it('accepts a first-party config without endpoint', () => {
    expect(validateConfig(openAiDraft)).toBeNull()
  })

  it('requires an endpoint for openai-compatible', () => {
    expect(
      validateConfig({ type: 'openai-compatible', label: 'L', model: 'm' }),
    ).toMatch(/endpoint zaroori/)
    expect(
      validateConfig({
        type: 'openai-compatible',
        label: 'L',
        model: 'm',
        endpoint: 'http://localhost:1234',
      }),
    ).toBeNull()
  })

  it('rejects bad shapes with human sentences', () => {
    expect(validateConfig({ ...openAiDraft, label: ' ' })).toMatch(/Label/)
    expect(validateConfig({ ...openAiDraft, model: '' })).toMatch(/Model/)
    expect(validateConfig({ ...openAiDraft, endpoint: 'not-a-url' })).toMatch(/http/)
  })
})

describe('ProviderStore', () => {
  it('CRUD + active selection + persistence round-trip', () => {
    const storage = memStorage()
    const s1 = createProviderStore(storage)
    const a = s1.upsert(openAiDraft)
    expect(a).not.toBeNull()
    if (!a) return
    const b = s1.upsert({ type: 'gemini', label: 'Work Gemini', model: 'gemini-2.5-flash' })
    expect(b).not.toBeNull()
    expect(s1.active()?.id).toBe(a?.id) // first config becomes active by default
    s1.setActive(b ? b.id : null)
    expect(s1.active()?.id).toBe(b?.id)

    const s2 = createProviderStore(storage)
    expect(s2.list().length).toBe(2)
    expect(s2.active()?.id).toBe(b?.id)

    s2.remove(b ? b.id : '')
    expect(s2.active()?.id).toBe(a?.id) // active falls back to the remaining config
  })

  it('upsert returns null on invalid drafts and writes nothing', () => {
    const storage = memStorage()
    const s = createProviderStore(storage)
    expect(s.upsert({ ...openAiDraft, label: '' })).toBeNull()
    expect(storage.dump()[AI_PROVIDERS_KEY]).toBeUndefined()
  })

  it('touchUsed + markTested persist metadata', () => {
    const storage = memStorage()
    let tick = 1000
    const s = createProviderStore(storage, () => (tick += 1))
    const a = s.upsert(openAiDraft)
    if (!a) throw new Error('save failed')
    s.touchUsed(a.id)
    s.markTested(a.id, 42)
    const reloaded = createProviderStore(storage).get(a.id)
    expect(reloaded?.lastUsedAt).toBeGreaterThan(1000)
    expect(reloaded?.lastTestOk?.latencyMs).toBe(42)
  })

  it('NEVER persists secret-shaped fields, even if smuggled into a draft', () => {
    const storage = memStorage()
    const s = createProviderStore(storage)
    const dirtyDraft = {
      ...openAiDraft,
      // Adversarial: a caller (or compromised UI) tried to sneak a key along.
      key: 'sk-should-never-persist-000',
      apiKey: 'sk-should-never-persist-111',
    } as unknown as Parameters<typeof s.upsert>[0]
    const saved = s.upsert(dirtyDraft)
    expect(saved).not.toBeNull()
    const raw = storage.dump()[AI_PROVIDERS_KEY] ?? ''
    expect(raw).not.toContain('sk-should-never-persist')
    expect(raw).not.toContain('"key"')
    expect(raw).not.toContain('"apiKey"')
  })

  it('corrupt storage is tolerated', () => {
    const s = createProviderStore(memStorage({ [AI_PROVIDERS_KEY]: 'not json{' }))
    expect(s.list()).toEqual([])
  })
})

describe('consent gate', () => {
  it('starts without consent, grants with version, revokes cleanly', () => {
    const storage = memStorage()
    expect(hasConsent(storage)).toBe(false)
    grantConsent(storage, () => 777)
    expect(hasConsent(storage)).toBe(true)
    expect(storage.dump()[AI_CONSENT_KEY]).toContain('"version":1')
    revokeConsent(storage)
    expect(hasConsent(storage)).toBe(false)
  })

  it('stale consent versions do not count as consent', () => {
    const storage = memStorage({ [AI_CONSENT_KEY]: JSON.stringify({ version: 0, at: 1 }) })
    expect(hasConsent(storage)).toBe(false)
  })
})
