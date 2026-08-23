// A6.5 — serializable, non-visual interaction/card state for future A6.6 UI.
// Model/provider text is retained only as redacted plain data. This module has
// no DOM, React, provider, validator, snapshot, or engine mutation access.

import type { AiEngineEntityBinding } from '../engine/client'
import type { ActivityRecord } from './activity'
import { redactText } from './redact'
import type { ValidatedPlan, ValidationIssue } from './validate'
import type { VerificationReport } from './verifier'

export type InteractionPhase =
  | 'idle'
  | 'generating'
  | 'awaitingApproval'
  | 'awaitingTypedConfirmation'
  | 'executing'
  | 'verifying'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'unavailable'
  | 'busy'

export type OrchestratorErrorKind =
  | 'no-provider'
  | 'no-key'
  | 'no-consent'
  | 'usage-ceiling'
  | 'busy'
  | 'aborted'
  | 'provider'
  | 'malformed-output'
  | 'validation'
  | 'tier-confirmation'
  | 'gesture-busy'
  | 'transaction'
  | 'verification'
  | 'unverifiable'
  | 'capability'
  | 'state'
  | 'document-closed'

export interface InteractionError {
  kind: OrchestratorErrorKind
  message: string
  sourceCode?: string
  issues?: readonly Readonly<ValidationIssue>[]
}

export interface UndoReachability {
  enabled: boolean
  reason: string
}

interface CardBase {
  seq: number
}

export interface UserMessageCard extends CardBase {
  kind: 'user-message'
  text: string
}

export interface AssistantMessageCard extends CardBase {
  kind: 'assistant-message'
  text: string
}

export interface PlanCard extends CardBase {
  kind: 'plan'
  /** Exact A4 output. Never regenerated/humanized by this state layer. */
  plan: Readonly<ValidatedPlan>
}

export interface ProgressCard extends CardBase {
  kind: 'progress'
  stage: 'generating' | 'repairing' | 'executing' | 'verifying'
  current?: number
  total?: number
  detail: string
}

export interface ConfirmationCard extends CardBase {
  kind: 'confirmation'
  tierB: boolean
  typedRequired: boolean
  affectedActions: readonly number[]
  message: string
}

export interface VerificationCard extends CardBase {
  kind: 'verification'
  report: Readonly<VerificationReport>
}

export interface ResultCard extends CardBase {
  kind: 'result'
  transactionStatus: 'applied' | 'rolled-back' | 'failed' | 'not-executed'
  mutationCount: number
  verification: VerificationReport['verdict']
  documentId: number
  postTransactionRevision: number | null
  activityId?: string
  entityBindings: readonly Readonly<AiEngineEntityBinding>[]
  undo: Readonly<UndoReachability>
}

export interface ErrorCard extends CardBase {
  kind: 'error'
  error: Readonly<InteractionError>
}

export interface ActivityGroupCard extends CardBase {
  kind: 'activity'
  activity: Readonly<ActivityRecord>
}

export type InteractionCard =
  | UserMessageCard
  | AssistantMessageCard
  | PlanCard
  | ProgressCard
  | ConfirmationCard
  | VerificationCard
  | ResultCard
  | ErrorCard
  | ActivityGroupCard

export type InteractionCardInput = InteractionCard extends infer Card
  ? Card extends { seq: number }
    ? Omit<Card, 'seq'>
    : never
  : never

export interface InteractionSnapshot {
  readonly documentId: number
  readonly phase: InteractionPhase
  readonly cards: readonly Readonly<InteractionCard>[]
}

export interface InteractionStore {
  begin(documentId: number, userText: string): InteractionSnapshot
  transition(documentId: number, phase: InteractionPhase): InteractionSnapshot
  addCard(documentId: number, card: InteractionCardInput): InteractionSnapshot
  get(documentId: number): InteractionSnapshot
  clear(documentId: number): void
  disposeDocument(documentId: number): void
  isDisposed(documentId: number): boolean
  documentIds(): readonly number[]
}

export class InteractionStateError extends Error {
  readonly code = 'E_INTERACTION_STATE'

  constructor(message: string) {
    super(message)
    this.name = 'InteractionStateError'
  }
}

interface InternalState {
  phase: InteractionPhase
  cards: InteractionCard[]
}

const TRANSITIONS: Readonly<Record<InteractionPhase, readonly InteractionPhase[]>> = Object.freeze({
  idle: ['generating'],
  generating: ['awaitingApproval', 'awaitingTypedConfirmation', 'executing', 'completed', 'failed', 'cancelled', 'unavailable'],
  awaitingApproval: ['executing', 'awaitingTypedConfirmation', 'cancelled', 'failed', 'unavailable', 'busy'],
  awaitingTypedConfirmation: ['executing', 'cancelled', 'failed', 'unavailable', 'busy'],
  executing: ['verifying', 'completed', 'failed'],
  verifying: ['completed', 'failed', 'cancelled', 'awaitingApproval'],
  completed: ['idle', 'generating'],
  failed: ['idle', 'generating'],
  cancelled: ['idle', 'generating'],
  unavailable: ['idle', 'generating'],
  busy: ['idle', 'generating'],
})

function validDocumentId(documentId: number): void {
  if (!Number.isSafeInteger(documentId) || documentId <= 0) {
    throw new InteractionStateError('documentId must be a positive safe integer')
  }
}

function safeText(value: string): string {
  return redactText(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/gu, '')
}

function cloneFreeze<T>(value: T): Readonly<T> {
  const cloned = structuredClone(value)
  const freeze = (item: unknown): void => {
    if (typeof item !== 'object' || item === null || Object.isFrozen(item)) return
    for (const child of Object.values(item)) freeze(child)
    Object.freeze(item)
  }
  freeze(cloned)
  return cloned
}

function sanitizedCard(card: InteractionCardInput, seq: number): InteractionCard {
  switch (card.kind) {
    case 'user-message':
    case 'assistant-message':
      return { ...card, seq, text: safeText(card.text) }
    case 'progress':
      return { ...card, seq, detail: safeText(card.detail) }
    case 'confirmation':
      return {
        ...card,
        seq,
        message: safeText(card.message),
        affectedActions: Object.freeze([...card.affectedActions]),
      }
    case 'error':
      return {
        ...card,
        seq,
        error: cloneFreeze({
          ...card.error,
          message: safeText(card.error.message),
          ...(card.error.sourceCode ? { sourceCode: safeText(card.error.sourceCode) } : {}),
          ...(card.error.issues
            ? {
                issues: card.error.issues.map((issue) => ({
                  ...issue,
                  message: safeText(issue.message),
                  ...(issue.hint ? { hint: safeText(issue.hint) } : {}),
                  ...(issue.actionId ? { actionId: safeText(issue.actionId) } : {}),
                  ...(issue.param ? { param: safeText(issue.param) } : {}),
                  ...(issue.candidates
                    ? {
                        candidates: issue.candidates.map((candidate) => ({
                          ref: safeText(candidate.ref),
                          label: safeText(candidate.label),
                        })),
                      }
                    : {}),
                })),
              }
            : {}),
        }),
      }
    case 'plan':
      return { ...card, seq, plan: cloneFreeze(card.plan) }
    case 'verification':
      return { ...card, seq, report: cloneFreeze(card.report) }
    case 'result':
      return {
        ...card,
        seq,
        entityBindings: cloneFreeze(card.entityBindings),
        undo: cloneFreeze(card.undo),
      }
    case 'activity':
      return { ...card, seq, activity: cloneFreeze(card.activity) }
  }
}

function frozenSnapshot(documentId: number, state?: InternalState): InteractionSnapshot {
  const cards = Object.freeze((state?.cards ?? []).map((card) => cloneFreeze(card)))
  return Object.freeze({ documentId, phase: state?.phase ?? 'idle', cards })
}

export function createInteractionStore(): InteractionStore {
  const states = new Map<number, InternalState>()
  const disposed = new Set<number>()
  const assertOpen = (documentId: number): void => {
    validDocumentId(documentId)
    if (disposed.has(documentId)) {
      throw new InteractionStateError('document interaction state has been disposed')
    }
  }

  return {
    begin(documentId, userText) {
      assertOpen(documentId)
      const current = states.get(documentId)
      if (current && ['generating', 'executing', 'verifying'].includes(current.phase)) {
        throw new InteractionStateError(`cannot begin while ${current.phase}`)
      }
      const state: InternalState = { phase: 'generating', cards: [] }
      state.cards.push(sanitizedCard({ kind: 'user-message', text: userText }, 0))
      state.cards.push(sanitizedCard({ kind: 'progress', stage: 'generating', detail: 'Generating…' }, 1))
      states.set(documentId, state)
      return frozenSnapshot(documentId, state)
    },
    transition(documentId, phase) {
      assertOpen(documentId)
      const state = states.get(documentId) ?? { phase: 'idle' as const, cards: [] }
      if (state.phase === phase) return frozenSnapshot(documentId, state)
      if (!TRANSITIONS[state.phase].includes(phase)) {
        throw new InteractionStateError(`invalid transition ${state.phase} → ${phase}`)
      }
      state.phase = phase
      states.set(documentId, state)
      return frozenSnapshot(documentId, state)
    },
    addCard(documentId, card) {
      assertOpen(documentId)
      const state = states.get(documentId)
      if (!state) throw new InteractionStateError('cannot add a card before begin()')
      state.cards.push(sanitizedCard(card, state.cards.length))
      return frozenSnapshot(documentId, state)
    },
    get(documentId) {
      validDocumentId(documentId)
      return frozenSnapshot(documentId, disposed.has(documentId) ? undefined : states.get(documentId))
    },
    clear(documentId) {
      validDocumentId(documentId)
      states.delete(documentId)
    },
    disposeDocument(documentId) {
      validDocumentId(documentId)
      states.delete(documentId)
      disposed.add(documentId)
    },
    isDisposed(documentId) {
      validDocumentId(documentId)
      return disposed.has(documentId)
    },
    documentIds() {
      return Object.freeze([...states.keys()].sort((a, b) => a - b))
    },
  }
}

export function createBusySnapshot(documentId: number, message: string): InteractionSnapshot {
  validDocumentId(documentId)
  const error: InteractionError = { kind: 'busy', message: safeText(message) }
  return frozenSnapshot(documentId, {
    phase: 'busy',
    cards: [sanitizedCard({ kind: 'error', error }, 0)],
  })
}

export function createErrorSnapshot(
  documentId: number,
  phase: 'failed' | 'unavailable' | 'cancelled',
  error: InteractionError,
): InteractionSnapshot {
  validDocumentId(documentId)
  return frozenSnapshot(documentId, {
    phase,
    cards: [sanitizedCard({ kind: 'error', error }, 0)],
  })
}

export function undoReachability(input: {
  transactionDocumentId: number
  activeDocumentId: number | null
  mutationCount: number
  postTransactionRevision: number | null
  currentRevision: number | null
}): UndoReachability {
  if (input.transactionDocumentId !== input.activeDocumentId) {
    return { enabled: false, reason: 'Transaction document active nahi hai.' }
  }
  if (input.mutationCount <= 0) {
    return { enabled: false, reason: 'Is result ne document mutate nahi kiya.' }
  }
  if (input.postTransactionRevision === null || input.currentRevision === null) {
    return { enabled: false, reason: 'Revision facade unavailable hai; safe undo verify nahi ho sakta.' }
  }
  if (input.postTransactionRevision !== input.currentRevision) {
    return { enabled: false, reason: 'Naya edit/undo/redo ho chuka hai; yeh transaction ab top par verify nahi hai.' }
  }
  return { enabled: true, reason: 'Transaction current top undo entry ke roop mein reachable hai.' }
}
