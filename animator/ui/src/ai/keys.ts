// ===========================================================================
// AI KEYVAULT — BYOK credential store (A2 / D-0010 / AI-REQ-062; threat model
// in TOOLS_RESEARCH/AI_AGENT/12 §API key storage).
//
// RULES (binding):
//   • MEMORY-ONLY by default. A browser restart drops every key unless the
//     user explicitly opts into persistence per config.
//   • Persistence = localStorage (XSS/devtools-readable — the UI shows
//     PERSIST_WARNING next to the opt-in checkbox; we never call it "secure").
//   • Keys never enter: project files, snapshots, activity logs, prompts,
//     URLs (Gemini uses the x-goog-api-key HEADER, not ?key=), or this file's
//     own log/return shapes. Every stored key registers with redact.ts.
//   • No .env / bundle baking of user keys — ever.
// ===========================================================================

import { registerSecret, unregisterSecret } from './redact'

export const AI_KEYS_KEY = 'kineora.ai.keys.v1'

export const PERSIST_WARNING =
  'Key is browser mein save hogi (localStorage — DevTools/extensions isse padh sakti hain). Sirf apni personal machine par use karo.'

export interface KeyVault {
  /** Store a key. persist=false (default) = memory only. Returns where it landed. */
  set(configId: string, key: string, opts?: { persist?: boolean }): 'memory' | 'persisted'
  get(configId: string): string | undefined
  has(configId: string): boolean
  isPersisted(configId: string): boolean
  /** Remove from memory AND (if present) persistent storage. */
  remove(configId: string): void
  /** Wipe everything (all configs), both tiers. */
  clear(): void
  /** Debug-safe description: booleans/counts only, never key material. */
  describe(): { count: number; persistedCount: number }
}

/** Minimal storage contract so tests inject memory; production passes localStorage. */
export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function createKeyVault(storage?: StorageLike): KeyVault {
  const memory = new Map<string, string>()
  const persistedIds = new Set<string>()

  // Hydrate persisted tier on construction.
  if (storage) {
    try {
      const raw = storage.getItem(AI_KEYS_KEY)
      if (raw) {
        const parsed: unknown = JSON.parse(raw)
        if (isRecord(parsed)) {
          for (const [id, key] of Object.entries(parsed)) {
            if (typeof key === 'string' && key.length > 0) {
              memory.set(id, key)
              persistedIds.add(id)
              registerSecret(key)
            }
          }
        }
      }
    } catch {
      // Corrupt/foreign storage: ignore — a broken blob must never break the app.
    }
  }

  function flushPersisted(): void {
    if (!storage) return
    if (persistedIds.size === 0) {
      storage.removeItem(AI_KEYS_KEY)
      return
    }
    const blob: Record<string, string> = {}
    for (const id of persistedIds) {
      const key = memory.get(id)
      if (key !== undefined) blob[id] = key
    }
    storage.setItem(AI_KEYS_KEY, JSON.stringify(blob))
  }

  return {
    set(configId, key, opts) {
      if (!configId || typeof key !== 'string' || key.length === 0) return 'memory'
      const previous = memory.get(configId)
      if (previous !== undefined && previous !== key) unregisterSecret(previous)
      memory.set(configId, key)
      registerSecret(key)
      const persist = opts?.persist === true && storage !== undefined
      if (persist) persistedIds.add(configId)
      else persistedIds.delete(configId)
      flushPersisted()
      return persist ? 'persisted' : 'memory'
    },
    get(configId) {
      return memory.get(configId)
    },
    has(configId) {
      return memory.has(configId)
    },
    isPersisted(configId) {
      return persistedIds.has(configId)
    },
    remove(configId) {
      const previous = memory.get(configId)
      if (previous !== undefined) unregisterSecret(previous)
      memory.delete(configId)
      persistedIds.delete(configId)
      flushPersisted()
    },
    clear() {
      for (const key of memory.values()) unregisterSecret(key)
      memory.clear()
      persistedIds.clear()
      if (storage) storage.removeItem(AI_KEYS_KEY)
    },
    describe() {
      return { count: memory.size, persistedCount: persistedIds.size }
    },
  }
}

/** Shared app vault (lazy singleton; tests build their own via createKeyVault). */
let shared: KeyVault | null = null
export function defaultKeyVault(): KeyVault {
  if (!shared) {
    const storage =
      typeof localStorage === 'undefined' ? undefined : (localStorage as StorageLike)
    shared = createKeyVault(storage)
  }
  return shared
}

/** Test hook. */
export function resetDefaultKeyVault(): void {
  shared?.clear()
  shared = null
}
