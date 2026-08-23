// ===========================================================================
// AI PROVIDERS — provider configuration store + consent state (A2 / D-0010 /
// spec 11). NON-SECRET data only: keys live exclusively in keys.ts (KeyVault).
// A runtime guard strips any secret-shaped field on write, and the consent
// gate (first use) is enforced by the UI before any provider call is offered.
//
// localStorage pattern matches toolColors.ts (sanitize-on-load, subscribe).
// ===========================================================================

import type { StorageLike } from './keys'

export type ProviderType = 'openai' | 'anthropic' | 'gemini' | 'openai-compatible'

export const AI_PROVIDERS_KEY = 'kineora.ai.providers.v1'
export const AI_CONSENT_KEY = 'kineora.ai.consent.v1'

/** Bumped when the consent inventory text changes — old acceptances expire. */
export const CONSENT_VERSION = 1

export interface ProviderConfig {
  id: string
  type: ProviderType
  label: string
  model: string
  /** Required for openai-compatible; optional override for first-party types. */
  endpoint?: string
  createdAt: number
  lastUsedAt?: number
  lastTestOk?: { at: number; latencyMs: number }
}

export const DEFAULT_ENDPOINTS: Record<ProviderType, string> = {
  openai: 'https://api.openai.com',
  anthropic: 'https://api.anthropic.com',
  gemini: 'https://generativelanguage.googleapis.com',
  'openai-compatible': '',
}

/** Curated suggestions only — the UI input is free text (models churn fast). */
export const MODEL_SUGGESTIONS: Record<ProviderType, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini'],
  anthropic: ['claude-sonnet-4-5', 'claude-opus-4-1', 'claude-haiku-4-5'],
  gemini: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'],
  'openai-compatible': ['llama-3.3-70b', 'qwen-2.5-72b', 'mistral-large'],
}

export const PRIVACY_LINKS: Record<ProviderType, string> = {
  openai: 'https://openai.com/policies/privacy-policy',
  anthropic: 'https://www.anthropic.com/legal/privacy',
  gemini: 'https://policies.google.com/privacy',
  'openai-compatible': '',
}

/**
 * Exact outbound-data inventory shown in the consent dialog (spec 12 consent
 * requirement). Keep in sync with PromptBuilder when A6 lands.
 */
export const CONSENT_OUTBOUND_ITEMS: readonly string[] = [
  'Tumhara typed message',
  'Active scene ka read-only summary (layers, shapes, keyframes, colors, positions)',
  'Capability list (is build me kya supported hai)',
  'Chat history (recent messages)',
  'Tumhare defined variables ($vars)',
]

export type ConfigDraft = Omit<ProviderConfig, 'id' | 'createdAt' | 'lastUsedAt' | 'lastTestOk'>

const PROVIDER_TYPES: readonly ProviderType[] = [
  'openai',
  'anthropic',
  'gemini',
  'openai-compatible',
]

export function isProviderType(v: unknown): v is ProviderType {
  return typeof v === 'string' && (PROVIDER_TYPES as readonly string[]).includes(v)
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Validation is honest and complete — errors are human sentences. */
export function validateConfig(draft: ConfigDraft): string | null {
  if (!isProviderType(draft.type)) return 'Provider type unknown hai.'
  if (typeof draft.label !== 'string' || draft.label.trim().length === 0)
    return 'Label khaali hai.'
  if (typeof draft.model !== 'string' || draft.model.trim().length === 0)
    return 'Model name khaali hai.'
  if (draft.endpoint !== undefined) {
    if (typeof draft.endpoint !== 'string') return 'Endpoint invalid hai.'
    if (draft.endpoint.length > 0 && !/^https?:\/\//.test(draft.endpoint))
      return 'Endpoint http(s):// se shuru hona chahiye.'
  }
  if (draft.type === 'openai-compatible') {
    if (!draft.endpoint || draft.endpoint.trim().length === 0)
      return 'OpenAI-compatible provider ke liye endpoint zaroori hai (base URL).'
  }
  return null
}

/** Fields that must NEVER appear in persisted config (key material shapes). */
const FORBIDDEN_FIELDS = ['key', 'apiKey', 'apikey', 'api_key', 'secret', 'token', 'password']

function sanitizeConfig(raw: unknown): ProviderConfig | null {
  if (!isRecord(raw)) return null
  if (!isProviderType(raw.type)) return null
  if (typeof raw.id !== 'string' || raw.id.length === 0) return null
  if (typeof raw.label !== 'string' || typeof raw.model !== 'string') return null
  if (typeof raw.createdAt !== 'number') return null
  const cfg: ProviderConfig = {
    id: raw.id,
    type: raw.type,
    label: raw.label,
    model: raw.model,
    createdAt: raw.createdAt,
  }
  if (typeof raw.endpoint === 'string' && raw.endpoint.length > 0) cfg.endpoint = raw.endpoint
  if (typeof raw.lastUsedAt === 'number') cfg.lastUsedAt = raw.lastUsedAt
  if (isRecord(raw.lastTestOk) && typeof raw.lastTestOk.at === 'number') {
    cfg.lastTestOk = {
      at: raw.lastTestOk.at,
      latencyMs:
        typeof raw.lastTestOk.latencyMs === 'number' ? raw.lastTestOk.latencyMs : 0,
    }
  }
  return cfg
}

function uid(): string {
  const c = globalThis.crypto as { randomUUID?: () => string } | undefined
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  return `cfg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

interface PersistedShape {
  configs: ProviderConfig[]
  activeId: string | null
}

export interface ProviderStore {
  list(): ProviderConfig[]
  get(id: string): ProviderConfig | undefined
  active(): ProviderConfig | undefined
  setActive(id: string | null): void
  /** Returns the saved config, or null when validation fails (see validateConfig). */
  upsert(draft: ConfigDraft & { id?: string }): ProviderConfig | null
  remove(id: string): void
  touchUsed(id: string): void
  markTested(id: string, latencyMs: number): void
  subscribe(fn: () => void): () => void
}

export function createProviderStore(storage?: StorageLike, now: () => number = Date.now): ProviderStore {
  let configs: ProviderConfig[] = []
  let activeId: string | null = null
  const listeners = new Set<() => void>()

  if (storage) {
    try {
      const raw = storage.getItem(AI_PROVIDERS_KEY)
      if (raw) {
        const parsed: unknown = JSON.parse(raw)
        if (isRecord(parsed) && Array.isArray(parsed.configs)) {
          configs = parsed.configs
            .map(sanitizeConfig)
            .filter((c): c is ProviderConfig => c !== null)
          activeId = typeof parsed.activeId === 'string' ? parsed.activeId : null
          if (activeId !== null && !configs.some((c) => c.id === activeId)) activeId = null
        }
      }
    } catch {
      // Broken blob: start empty, never crash the editor over a prefs read.
    }
  }

  function emit(): void {
    for (const fn of [...listeners]) fn()
  }

  function flush(): void {
    if (!storage) return
    // Defensive: build the persisted shape field-by-field so nothing
    // secret-shaped can ever ride along, even by accident.
    const shape: PersistedShape = {
      configs: configs.map((c) => {
        const clean: Record<string, unknown> = {
          id: c.id,
          type: c.type,
          label: c.label,
          model: c.model,
          createdAt: c.createdAt,
        }
        if (c.endpoint !== undefined) clean.endpoint = c.endpoint
        if (c.lastUsedAt !== undefined) clean.lastUsedAt = c.lastUsedAt
        if (c.lastTestOk !== undefined) clean.lastTestOk = c.lastTestOk
        for (const f of FORBIDDEN_FIELDS) delete clean[f]
        return clean as unknown as ProviderConfig
      }),
      activeId,
    }
    storage.setItem(AI_PROVIDERS_KEY, JSON.stringify(shape))
  }

  return {
    list() {
      return configs.map((c) => ({ ...c }))
    },
    get(id) {
      const c = configs.find((x) => x.id === id)
      return c ? { ...c } : undefined
    },
    active() {
      const c = configs.find((x) => x.id === activeId)
      return c ? { ...c } : undefined
    },
    setActive(id) {
      activeId = id !== null && configs.some((c) => c.id === id) ? id : null
      flush()
      emit()
    },
    upsert(draft) {
      const error = validateConfig(draft)
      if (error !== null) return null
      const existing = draft.id ? configs.find((c) => c.id === draft.id) : undefined
      const cfg: ProviderConfig = {
        id: existing?.id ?? uid(),
        type: draft.type,
        label: draft.label.trim(),
        model: draft.model.trim(),
        createdAt: existing?.createdAt ?? now(),
        lastUsedAt: existing?.lastUsedAt,
        lastTestOk: existing?.lastTestOk,
      }
      const endpoint = draft.endpoint?.trim()
      if (endpoint) cfg.endpoint = endpoint.replace(/\/+$/, '')
      if (existing) configs = configs.map((c) => (c.id === cfg.id ? cfg : c))
      else {
        configs = [...configs, cfg]
        if (activeId === null) activeId = cfg.id
      }
      flush()
      emit()
      return { ...cfg }
    },
    remove(id) {
      configs = configs.filter((c) => c.id !== id)
      if (activeId === id) activeId = configs[0]?.id ?? null
      flush()
      emit()
    },
    touchUsed(id) {
      configs = configs.map((c) => (c.id === id ? { ...c, lastUsedAt: now() } : c))
      flush()
      emit()
    },
    markTested(id, latencyMs) {
      configs = configs.map((c) =>
        c.id === id ? { ...c, lastTestOk: { at: now(), latencyMs } } : c,
      )
      flush()
      emit()
    },
    subscribe(fn) {
      listeners.add(fn)
      return () => {
        listeners.delete(fn)
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Consent (first-use gate; spec 12: user sees EXACTLY what leaves the device).
// ---------------------------------------------------------------------------

export function hasConsent(storage?: StorageLike): boolean {
  if (!storage) return false
  try {
    const raw = storage.getItem(AI_CONSENT_KEY)
    if (!raw) return false
    const parsed: unknown = JSON.parse(raw)
    return isRecord(parsed) && parsed.version === CONSENT_VERSION && typeof parsed.at === 'number'
  } catch {
    return false
  }
}

export function grantConsent(storage?: StorageLike, now: () => number = Date.now): void {
  if (!storage) return
  storage.setItem(AI_CONSENT_KEY, JSON.stringify({ version: CONSENT_VERSION, at: now() }))
}

export function revokeConsent(storage?: StorageLike): void {
  storage?.removeItem(AI_CONSENT_KEY)
}
