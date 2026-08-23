// A6.2 — bounded, per-document, session-only AI conversation context.
//
// This store has no persistence adapter by design: no localStorage, IndexedDB,
// project model, URL, telemetry, provider, validator, or transaction dependency.
// A3 snapshots remain authoritative for entity existence; bindings exported to
// PromptBuilder are advisory aliases only and never resolve/mutate documents.

import type { AiEngineEntityBinding } from '../engine/client'
import type { PromptConversationTurn, PromptEntityBinding } from './prompt'
import { MAX_CONVERSATION_TURNS } from './prompt'
import { redactText } from './redact'
import type { SceneSnapshotView } from './snapshot'
import { AI_BUDGETS } from './validate'

export type ContextBindingKind = 'node' | 'layer' | 'symbol'

export interface ContextEntityBinding {
  readonly alias: string
  readonly kind: ContextBindingKind
  readonly id: number
  /** Snapshot revision observed immediately after the creating transaction. */
  readonly observedRevision: number
}

export interface DocumentContextSnapshot {
  readonly documentId: number
  readonly turns: readonly Readonly<PromptConversationTurn>[]
  readonly bindings: readonly Readonly<ContextEntityBinding>[]
}

export interface DocumentPromptContext {
  readonly conversation: readonly Readonly<PromptConversationTurn>[]
  /** Only bindings confirmed present by the supplied fresh A3 snapshot. */
  readonly entityBindings: readonly Readonly<PromptEntityBinding>[]
}

export interface ConversationContextStore {
  appendTurn(documentId: number, turn: PromptConversationTurn): DocumentContextSnapshot
  addBindings(
    documentId: number,
    bindings: readonly AiEngineEntityBinding[],
    observedRevision: number,
  ): DocumentContextSnapshot
  /** Remove bindings that a fresh/equal A3 snapshot proves no longer exist. */
  reconcileBindings(documentId: number, snapshot: SceneSnapshotView): DocumentContextSnapshot
  get(documentId: number): DocumentContextSnapshot
  /** Prompt-safe shape accepted directly by A6.1 buildPrompt(). The optional
   * current request is checked against the newest stored user turn so callers
   * cannot accidentally send it twice. */
  forPrompt(
    documentId: number,
    snapshot: SceneSnapshotView,
    currentRequest?: string,
  ): DocumentPromptContext
  clear(documentId: number): void
  discardDocument(documentId: number): void
  clearAll(): void
  has(documentId: number): boolean
  isDisposed(documentId: number): boolean
  documentIds(): readonly number[]
}

export class ContextError extends Error {
  readonly code: 'E_CONTEXT_INPUT' | 'E_CONTEXT_LIMIT'

  constructor(code: ContextError['code'], message: string) {
    super(message)
    this.name = 'ContextError'
    this.code = code
  }
}

/** 12 turns together can never exceed A4's already-approved 256 KiB input cap. */
export const MAX_CONTEXT_TURN_BYTES = Math.floor(
  AI_BUDGETS.maxPlanJsonBytes / MAX_CONVERSATION_TURNS,
)
export const MAX_CONTEXT_BINDINGS = AI_BUDGETS.maxMutatedObjects

const ACTION_ALIAS = /^[A-Za-z][A-Za-z0-9_-]{0,31}$/
const RESERVED_BINDING_KEYS = new Set(['__proto__', 'prototype', 'constructor'])
const UNSAFE_CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200E\u200F\u202A-\u202E]/u
// Context has no legitimate need for filesystem locations. Reject obvious
// absolute/file-URL forms rather than retaining them or inventing path redaction.
const UNSAFE_FILE_PATH = /(?:file:\/\/|(?:^|\s)(?:\/[A-Za-z0-9._-]+\/|[A-Za-z]:[\\/]))/iu

interface InternalThread {
  turns: PromptConversationTurn[]
  bindings: ContextEntityBinding[]
}

function validDocumentId(documentId: number): void {
  if (!Number.isSafeInteger(documentId) || documentId <= 0) {
    throw new ContextError('E_CONTEXT_INPUT', 'documentId must be a positive safe integer')
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function sanitizeTurn(value: unknown): PromptConversationTurn {
  if (!isPlainRecord(value)) {
    throw new ContextError('E_CONTEXT_INPUT', 'conversation turn must be a plain object')
  }
  const keys = Object.keys(value)
  if (keys.some((key) => key !== 'role' && key !== 'content')) {
    throw new ContextError('E_CONTEXT_INPUT', 'conversation turn contains unknown fields')
  }
  if (value.role !== 'user' && value.role !== 'assistant') {
    throw new ContextError('E_CONTEXT_INPUT', 'conversation role must be user or assistant')
  }
  if (typeof value.content !== 'string' || value.content.trim().length === 0) {
    throw new ContextError('E_CONTEXT_INPUT', 'conversation content must be a non-empty string')
  }
  if (UNSAFE_CONTROL.test(value.content)) {
    throw new ContextError('E_CONTEXT_INPUT', 'conversation content contains unsafe control characters')
  }
  if (UNSAFE_FILE_PATH.test(value.content)) {
    throw new ContextError('E_CONTEXT_INPUT', 'conversation content contains a forbidden file path')
  }
  const content = redactText(value.content)
  if (new TextEncoder().encode(content).byteLength > MAX_CONTEXT_TURN_BYTES) {
    throw new ContextError(
      'E_CONTEXT_LIMIT',
      `conversation turn exceeds ${MAX_CONTEXT_TURN_BYTES} UTF-8 bytes`,
    )
  }
  return Object.freeze({ role: value.role, content })
}

function sanitizeBinding(
  value: unknown,
  observedRevision: number,
): ContextEntityBinding {
  if (!isPlainRecord(value)) {
    throw new ContextError('E_CONTEXT_INPUT', 'entity binding must be a plain object')
  }
  const keys = Object.keys(value)
  if (keys.some((key) => !['alias', 'kind', 'id'].includes(key))) {
    throw new ContextError('E_CONTEXT_INPUT', 'entity binding contains unknown fields')
  }
  if (
    typeof value.alias !== 'string' ||
    !ACTION_ALIAS.test(value.alias) ||
    RESERVED_BINDING_KEYS.has(value.alias) ||
    redactText(value.alias) !== value.alias
  ) {
    throw new ContextError('E_CONTEXT_INPUT', 'entity binding alias is invalid or secret-shaped')
  }
  if (value.kind !== 'node' && value.kind !== 'layer' && value.kind !== 'symbol') {
    throw new ContextError('E_CONTEXT_INPUT', 'entity binding kind is invalid')
  }
  if (!Number.isSafeInteger(value.id) || (value.id as number) <= 0) {
    throw new ContextError('E_CONTEXT_INPUT', 'entity binding id must be a positive safe integer')
  }
  if (!Number.isSafeInteger(observedRevision) || observedRevision < 0) {
    throw new ContextError('E_CONTEXT_INPUT', 'observedRevision must be a non-negative safe integer')
  }
  return Object.freeze({
    alias: value.alias,
    kind: value.kind,
    id: value.id as number,
    observedRevision,
  })
}

function bindingRef(
  binding: ContextEntityBinding,
  snapshot: SceneSnapshotView,
): string | null {
  if (snapshot.rev < binding.observedRevision) return null
  if (binding.kind === 'node') {
    if (!snapshot.raw.nodes.some((node) => node.id === binding.id)) return null
    return snapshot.aliasOf(binding.id, 'n') ?? null
  }
  if (binding.kind === 'layer') {
    if (!snapshot.raw.layers.some((layer) => layer.id === binding.id)) return null
    return snapshot.aliasOf(binding.id, 'l') ?? null
  }
  if (!snapshot.raw.library.some((symbol) => symbol.id === binding.id)) return null
  return snapshot.aliasOf(binding.id, 's') ?? null
}

function frozenSnapshot(documentId: number, thread?: InternalThread): DocumentContextSnapshot {
  const turns = Object.freeze(
    (thread?.turns ?? []).map((turn) => Object.freeze({ ...turn })),
  )
  const bindings = Object.freeze(
    (thread?.bindings ?? []).map((binding) => Object.freeze({ ...binding })),
  )
  return Object.freeze({ documentId, turns, bindings })
}

export function createConversationContextStore(): ConversationContextStore {
  // The Map and every contained array are closure-private. No returned object
  // shares either collection, preventing accidental external mutation.
  const threads = new Map<number, InternalThread>()
  const disposed = new Set<number>()

  const assertOpen = (documentId: number): void => {
    validDocumentId(documentId)
    if (disposed.has(documentId)) {
      throw new ContextError('E_CONTEXT_INPUT', 'document AI context has been disposed')
    }
  }

  const getOrCreate = (documentId: number): InternalThread => {
    assertOpen(documentId)
    let thread = threads.get(documentId)
    if (!thread) {
      thread = { turns: [], bindings: [] }
      threads.set(documentId, thread)
    }
    return thread
  }

  return {
    appendTurn(documentId, turn) {
      assertOpen(documentId)
      const safe = sanitizeTurn(turn)
      const thread = getOrCreate(documentId)
      thread.turns.push(safe)
      if (thread.turns.length > MAX_CONVERSATION_TURNS) {
        thread.turns.splice(0, thread.turns.length - MAX_CONVERSATION_TURNS)
      }
      return frozenSnapshot(documentId, thread)
    },

    addBindings(documentId, bindings, observedRevision) {
      assertOpen(documentId)
      // Validate the whole batch before creating/changing internal state.
      const safe = bindings.map((binding) => sanitizeBinding(binding, observedRevision))
      const thread = getOrCreate(documentId)
      const additions = safe.filter(
        (binding) => !thread.bindings.some((current) => current.alias === binding.alias),
      ).length
      if (thread.bindings.length + additions > MAX_CONTEXT_BINDINGS) {
        throw new ContextError(
          'E_CONTEXT_LIMIT',
          `entity bindings exceed ${MAX_CONTEXT_BINDINGS}`,
        )
      }
      for (const binding of safe) {
        const index = thread.bindings.findIndex((current) => current.alias === binding.alias)
        if (index >= 0) thread.bindings[index] = binding
        else thread.bindings.push(binding)
      }
      return frozenSnapshot(documentId, thread)
    },

    reconcileBindings(documentId, snapshot) {
      validDocumentId(documentId)
      if (disposed.has(documentId)) return frozenSnapshot(documentId)
      const thread = threads.get(documentId)
      if (!thread) return frozenSnapshot(documentId)
      thread.bindings = thread.bindings.filter((binding) => {
        // An older snapshot cannot authoritatively delete a newer binding.
        if (snapshot.rev < binding.observedRevision) return true
        return bindingRef(binding, snapshot) !== null
      })
      return frozenSnapshot(documentId, thread)
    },

    get(documentId) {
      validDocumentId(documentId)
      return frozenSnapshot(documentId, disposed.has(documentId) ? undefined : threads.get(documentId))
    },

    forPrompt(documentId, snapshot, currentRequest) {
      assertOpen(documentId)
      const thread = threads.get(documentId)
      if (currentRequest !== undefined) {
        const current = sanitizeTurn({ role: 'user', content: currentRequest })
        const newest = thread?.turns[thread.turns.length - 1]
        if (newest?.role === 'user' && newest.content === current.content) {
          throw new ContextError(
            'E_CONTEXT_INPUT',
            'current user request is already the newest stored conversation turn',
          )
        }
      }
      const conversation = Object.freeze(
        (thread?.turns ?? []).map((turn) => Object.freeze({ ...turn })),
      )
      const entityBindings = Object.freeze(
        (thread?.bindings ?? []).flatMap((binding): PromptEntityBinding[] => {
          const ref = bindingRef(binding, snapshot)
          return ref
            ? [Object.freeze({ alias: binding.alias, kind: binding.kind, ref, status: 'advisory' })]
            : []
        }),
      )
      return Object.freeze({ conversation, entityBindings })
    },

    clear(documentId) {
      validDocumentId(documentId)
      threads.delete(documentId)
    },

    discardDocument(documentId) {
      validDocumentId(documentId)
      threads.delete(documentId)
      disposed.add(documentId)
    },

    clearAll() {
      threads.clear()
      disposed.clear()
    },

    has(documentId) {
      validDocumentId(documentId)
      return !disposed.has(documentId) && threads.has(documentId)
    },

    isDisposed(documentId) {
      validDocumentId(documentId)
      return disposed.has(documentId)
    },

    documentIds() {
      return Object.freeze([...threads.keys()].sort((a, b) => a - b))
    },
  }
}
