// ===========================================================================
// AI PROVIDER SETTINGS — BYOK configuration + consent gate (A2 / spec 10-12).
// NOT MOUNTED into App in A2 (mount ships with the chat shell in A6, per the
// approved slice order — D-0010). Fully testable via DI props.
//
// Security invariants enforced HERE (not just in tests):
//   • first use is gated behind the consent dialog (outbound-data inventory),
//   • the key field writes ONLY to the KeyVault — never to ProviderStore,
//   • persistence of a key is explicit opt-in AND shows PERSIST_WARNING,
//   • this component never logs the key, never puts it in the DOM except the
//     password input itself.
// ===========================================================================

import { useEffect, useMemo, useReducer, useState } from 'react'
import type { ProviderAdapter } from './adapters'
import { createAdapters } from './adapters'
import type { KeyVault, StorageLike } from './keys'
import { defaultKeyVault, PERSIST_WARNING } from './keys'
import type { ConfigDraft, ProviderType } from './providers'
import {
  CONSENT_OUTBOUND_ITEMS,
  createProviderStore,
  DEFAULT_ENDPOINTS,
  grantConsent,
  hasConsent,
  MODEL_SUGGESTIONS,
  PRIVACY_LINKS,
  validateConfig,
} from './providers'

export interface AiProviderSettingsProps {
  vault?: KeyVault
  store?: ReturnType<typeof createProviderStore>
  adapters?: Record<ProviderType, ProviderAdapter>
  /** Defaults to localStorage (for consent + stores when not injected). */
  storage?: StorageLike
}

const TYPE_LABELS: Record<ProviderType, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Gemini',
  'openai-compatible': 'OpenAI-compatible',
}

function defaultStorage(): StorageLike | undefined {
  return typeof localStorage === 'undefined' ? undefined : (localStorage as StorageLike)
}

export function AiProviderSettings(props: AiProviderSettingsProps) {
  const storage = props.storage ?? defaultStorage()
  const vault = useMemo(() => props.vault ?? defaultKeyVault(), [props.vault])
  const store = useMemo(
    () => props.store ?? createProviderStore(storage),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.store],
  )
  const adapters = useMemo(() => props.adapters ?? createAdapters(), [props.adapters])

  const [consented, setConsented] = useState<boolean>(() => hasConsent(storage))
  const [, force] = useReducer((x: number) => x + 1, 0)
  useEffect(() => store.subscribe(force), [store])

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [type, setType] = useState<ProviderType>('openai')
  const [label, setLabel] = useState('')
  const [endpoint, setEndpoint] = useState('')
  const [model, setModel] = useState('')
  const [keyInput, setKeyInput] = useState('')
  const [persistKey, setPersistKey] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)

  const configs = store.list()

  function resetForm(): void {
    setEditingId(null)
    setType('openai')
    setLabel('')
    setEndpoint('')
    setModel('')
    setKeyInput('')
    setPersistKey(false)
    setFormError(null)
  }

  function loadIntoForm(id: string): void {
    const cfg = store.get(id)
    if (!cfg) return
    setEditingId(cfg.id)
    setType(cfg.type)
    setLabel(cfg.label)
    setEndpoint(cfg.endpoint ?? '')
    setModel(cfg.model)
    setKeyInput('')
    setPersistKey(vault.isPersisted(cfg.id))
    setFormError(null)
    setTestResult(null)
  }

  function onSave(): void {
    const draft: ConfigDraft & { id?: string } = {
      type,
      label,
      model,
      endpoint: endpoint === '' ? undefined : endpoint,
    }
    if (editingId) draft.id = editingId
    const error = validateConfig(draft)
    if (error !== null) {
      setFormError(error)
      return
    }
    const saved = store.upsert(draft)
    if (!saved) {
      setFormError('Config save nahi hui — validation fail.')
      return
    }
    const trimmedKey = keyInput.trim()
    if (trimmedKey.length > 0) {
      vault.set(saved.id, trimmedKey, { persist: persistKey })
      setKeyInput('')
    }
    resetForm()
  }

  async function onTestConnection(): Promise<void> {
    const cfg = editingId ? store.get(editingId) : undefined
    if (!cfg) {
      setTestResult('Pehle config save karo, phir test karo.')
      return
    }
    const key = vault.get(cfg.id)
    if (!key) {
      setTestResult('Key missing hai — pehle key save karo.')
      return
    }
    setTesting(true)
    setTestResult(null)
    try {
      const res = await adapters[cfg.type].testConnection(cfg, key)
      if (res.ok) {
        store.markTested(cfg.id, res.latencyMs)
        setTestResult(`OK · ${res.latencyMs}ms${res.detail ? ` · ${res.detail}` : ''}`)
      } else {
        setTestResult(`FAIL · ${res.detail ?? 'connection nahi bana'}`)
      }
    } finally {
      setTesting(false)
    }
  }

  if (!consented) {
    return (
      <div data-testid="ai-consent-dialog" role="dialog" aria-label="AI consent" style={{ padding: 12 }}>
        <h3 style={{ margin: '0 0 8px' }}>Kineora AI — pehli baar</h3>
        <p style={{ margin: '0 0 8px' }}>
          AI chat use karne par ye cheezein tumhare chosen provider ko bheji jayengi:
        </p>
        <ul data-testid="ai-consent-items" style={{ margin: '0 0 8px', paddingLeft: 18 }}>
          {CONSENT_OUTBOUND_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p style={{ margin: '0 0 8px' }}>
          Kabhi nahi bheja jayega: API key (siway usi provider ko), doosre documents, file paths,
          clipboard, app logs. Key default me sirf memory me rehti hai (restart = delete).
        </p>
        <p style={{ margin: '0 0 12px', fontSize: 12, opacity: 0.8 }}>
          Privacy: {PRIVACY_LINKS.openai} · {PRIVACY_LINKS.anthropic} · {PRIVACY_LINKS.gemini}
        </p>
        <button
          data-testid="ai-consent-accept"
          onClick={() => {
            grantConsent(storage)
            setConsented(true)
          }}
        >
          Samajh gaya — AI setup karo
        </button>
      </div>
    )
  }

  return (
    <div data-testid="ai-settings" style={{ padding: 12, display: 'grid', gap: 8 }}>
      <h3 style={{ margin: 0 }}>AI Provider (BYOK)</h3>

      {configs.length > 0 && (
        <div data-testid="ai-config-list" style={{ display: 'grid', gap: 4 }}>
          {configs.map((c) => (
            <div key={c.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <label style={{ display: 'flex', gap: 4, alignItems: 'center', flex: 1 }}>
                <input
                  type="radio"
                  name="ai-active-config"
                  checked={store.active()?.id === c.id}
                  onChange={() => store.setActive(c.id)}
                  data-testid={`ai-config-active-${c.id}`}
                />
                {c.label} · {TYPE_LABELS[c.type]} · {c.model}
                {vault.has(c.id) ? ' · key ✓' : ' · key ✗'}
              </label>
              <button data-testid={`ai-config-edit-${c.id}`} onClick={() => loadIntoForm(c.id)}>
                Edit
              </button>
              <button
                data-testid={`ai-config-delete-${c.id}`}
                onClick={() => {
                  vault.remove(c.id)
                  store.remove(c.id)
                  if (editingId === c.id) resetForm()
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <label style={{ display: 'grid', gap: 2 }}>
        Provider
        <select
          data-testid="ai-provider-type"
          value={type}
          onChange={(e) => setType(e.target.value as ProviderType)}
        >
          {(Object.keys(TYPE_LABELS) as ProviderType[]).map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: 'grid', gap: 2 }}>
        Label
        <input
          data-testid="ai-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Personal OpenAI"
        />
      </label>

      {(type === 'openai-compatible' || endpoint !== '') && (
        <label style={{ display: 'grid', gap: 2 }}>
          Endpoint (base URL)
          <input
            data-testid="ai-endpoint"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder={DEFAULT_ENDPOINTS[type] || 'https://your-server/v1-root'}
          />
        </label>
      )}

      <label style={{ display: 'grid', gap: 2 }}>
        Model
        <input
          data-testid="ai-model"
          list="ai-model-suggestions"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder={MODEL_SUGGESTIONS[type][0]}
        />
        <datalist id="ai-model-suggestions">
          {MODEL_SUGGESTIONS[type].map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </label>

      <label style={{ display: 'grid', gap: 2 }}>
        API key {editingId && vault.has(editingId) ? '(saved hai — nayi daalne par replace)' : ''}
        <input
          data-testid="ai-key-input"
          type="password"
          autoComplete="off"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          placeholder="yahan paste karo — chat me kabhi nahi"
        />
      </label>

      <label style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
        <input
          data-testid="ai-persist-key"
          type="checkbox"
          checked={persistKey}
          onChange={(e) => setPersistKey(e.target.checked)}
        />
        <span>
          Is browser mein key save rakho
          {persistKey && (
            <span data-testid="ai-persist-warning" style={{ display: 'block', fontSize: 12, color: '#b45309' }}>
              {PERSIST_WARNING}
            </span>
          )}
        </span>
      </label>

      {formError && (
        <div data-testid="ai-form-error" role="alert" style={{ color: '#b91c1c' }}>
          {formError}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6 }}>
        <button data-testid="ai-save-config" onClick={onSave}>
          {editingId ? 'Update config' : 'Save config'}
        </button>
        <button data-testid="ai-test-connection" onClick={() => void onTestConnection()} disabled={testing}>
          {testing ? 'Testing…' : 'Test connection'}
        </button>
        {editingId && (
          <button data-testid="ai-delete-key" onClick={() => editingId && vault.remove(editingId)}>
            Delete key
          </button>
        )}
      </div>

      {testResult && (
        <div data-testid="ai-test-result" style={{ fontSize: 13 }}>
          {testResult}
        </div>
      )}
    </div>
  )
}
