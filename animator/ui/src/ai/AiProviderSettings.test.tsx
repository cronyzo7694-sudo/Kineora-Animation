import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AiProviderSettings } from './AiProviderSettings'
import type { StorageLike } from './keys'
import { AI_KEYS_KEY, createKeyVault } from './keys'
import { AI_PROVIDERS_KEY, createProviderStore, hasConsent } from './providers'
import { clearSecretRegistry } from './redact'

function memStorage(): StorageLike & { dump(): Record<string, string> } {
  const m = new Map<string, string>()
  return {
    getItem: (k) => (m.has(k) ? (m.get(k) as string) : null),
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    dump: () => Object.fromEntries(m),
  }
}

const KEY = 'sk-componenttest-9988776655'

function setup() {
  const storage = memStorage()
  const vault = createKeyVault(storage)
  const store = createProviderStore(storage)
  const adapters = {
    openai: {
      type: 'openai' as const,
      complete: vi.fn(),
      testConnection: vi.fn(async () => ({ ok: true, latencyMs: 5, detail: 'model available' })),
    },
    anthropic: {
      type: 'anthropic' as const,
      complete: vi.fn(),
      testConnection: vi.fn(async () => ({ ok: true, latencyMs: 6 })),
    },
    gemini: {
      type: 'gemini' as const,
      complete: vi.fn(),
      testConnection: vi.fn(async () => ({ ok: true, latencyMs: 7 })),
    },
    'openai-compatible': {
      type: 'openai-compatible' as const,
      complete: vi.fn(),
      testConnection: vi.fn(async () => ({ ok: true, latencyMs: 8 })),
    },
  }
  const utils = render(
    <AiProviderSettings storage={storage} vault={vault} store={store} adapters={adapters} />,
  )
  return { storage, vault, store, adapters, ...utils }
}

function acceptConsent() {
  fireEvent.click(screen.getByTestId('ai-consent-accept'))
}

function fillForm(label: string, model: string, key?: string) {
  fireEvent.change(screen.getByTestId('ai-label'), { target: { value: label } })
  fireEvent.change(screen.getByTestId('ai-model'), { target: { value: model } })
  if (key !== undefined)
    fireEvent.change(screen.getByTestId('ai-key-input'), { target: { value: key } })
}

beforeEach(() => {
  clearSecretRegistry()
})

describe('AiProviderSettings — consent gate', () => {
  it('shows the consent dialog first and blocks settings until accepted', () => {
    const { storage } = setup()
    expect(screen.getByTestId('ai-consent-dialog')).toBeInTheDocument()
    expect(screen.queryByTestId('ai-settings')).not.toBeInTheDocument()
    expect(screen.getByTestId('ai-consent-items').children.length).toBe(5)

    acceptConsent()
    expect(screen.getByTestId('ai-settings')).toBeInTheDocument()
    expect(hasConsent(storage)).toBe(true)
  })
})

describe('AiProviderSettings — key security', () => {
  it('key lands in the VAULT (memory), NEVER in the persisted provider config', () => {
    const { storage, vault } = setup()
    acceptConsent()
    fillForm('Personal OpenAI', 'gpt-4o-mini', KEY)
    fireEvent.click(screen.getByTestId('ai-save-config'))

    const providersBlob = storage.dump()[AI_PROVIDERS_KEY] ?? ''
    expect(providersBlob).toContain('Personal OpenAI')
    expect(providersBlob).not.toContain(KEY)
    expect(storage.dump()[AI_KEYS_KEY]).toBeUndefined() // memory-only: nothing persisted by default
    expect(vault.describe().count).toBe(1)
  })

  it('persist opt-in shows the warning and stores the key; memory default does not warn', () => {
    const { storage, vault } = setup()
    acceptConsent()
    expect(screen.queryByTestId('ai-persist-warning')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('ai-persist-key'))
    expect(screen.getByTestId('ai-persist-warning')).toBeInTheDocument()

    fillForm('Work', 'gpt-4o', KEY)
    fireEvent.click(screen.getByTestId('ai-save-config'))
    expect(storage.dump()[AI_KEYS_KEY] ?? '').toContain(KEY)
    expect(vault.describe()).toEqual({ count: 1, persistedCount: 1 })
  })

  it('delete key removes it from the vault only (config stays)', () => {
    const { vault, store } = setup()
    acceptConsent()
    fillForm('Personal', 'gpt-4o-mini', KEY)
    fireEvent.click(screen.getByTestId('ai-save-config'))
    const cfgId = store.list()[0].id
    expect(vault.has(cfgId)).toBe(true)
    // Open the config for editing, then delete the key via its row action.
    fireEvent.click(screen.getByTestId(`ai-config-edit-${cfgId}`))
    fireEvent.click(screen.getByTestId('ai-delete-key'))
    expect(vault.has(cfgId)).toBe(false)
    expect(store.list().length).toBe(1) // config itself is not deleted by key deletion
  })
})

describe('AiProviderSettings — validation + connection test', () => {
  it('invalid drafts show an error and persist nothing', () => {
    const { storage } = setup()
    acceptConsent()
    fillForm('', 'gpt-4o-mini')
    fireEvent.click(screen.getByTestId('ai-save-config'))
    expect(screen.getByTestId('ai-form-error')).toHaveTextContent(/Label/)
    expect(storage.dump()[AI_PROVIDERS_KEY]).toBeUndefined()
  })

  it('test connection runs the adapter and records the success metadata', async () => {
    const { store, adapters } = setup()
    acceptConsent()
    fillForm('Personal', 'gpt-4o-mini', KEY)
    fireEvent.click(screen.getByTestId('ai-save-config'))
    const cfgId = store.list()[0].id

    fireEvent.click(screen.getByTestId(`ai-config-edit-${cfgId}`))
    fireEvent.click(screen.getByTestId('ai-test-connection'))
    expect(await screen.findByTestId('ai-test-result')).toHaveTextContent(/OK · /)
    expect(adapters.openai.testConnection).toHaveBeenCalledTimes(1)
    expect(store.get(cfgId)?.lastTestOk?.latencyMs).toBe(5)
  })

  it('test without a key refuses politely, no network call', async () => {
    const { store, adapters } = setup()
    acceptConsent()
    fillForm('Personal', 'gpt-4o-mini') // no key
    fireEvent.click(screen.getByTestId('ai-save-config'))
    const cfgId = store.list()[0].id
    fireEvent.click(screen.getByTestId(`ai-config-edit-${cfgId}`))
    fireEvent.click(screen.getByTestId('ai-test-connection'))
    expect(await screen.findByTestId('ai-test-result')).toHaveTextContent(/Key missing/)
    expect(adapters.openai.testConnection).not.toHaveBeenCalled()
  })
})
