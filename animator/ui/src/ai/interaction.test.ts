import { describe, expect, it } from 'vitest'
import type { ActivityRecord } from './activity'
import {
  createBusySnapshot,
  createInteractionStore,
  InteractionStateError,
  undoReachability,
} from './interaction'
import { registerSecret, unregisterSecret } from './redact'
import type { ValidatedPlan } from './validate'
import type { VerificationReport } from './verifier'

function plan(): ValidatedPlan {
  return {
    actions: [{
      index: 0,
      id: 'make',
      action: 'layer.create',
      params: { name: 'Ball' },
      targets: [],
      humanText: 'Naya layer "Ball"',
      tier: 'A',
    }],
    expected: ['Ball layer exists'],
    report: 'Create Ball layer',
    requiresConfirmation: false,
    massDestructive: null,
    budget: { actions: 1, estimatedMutations: 1 },
    validatedAt: {
      docRevision: 1,
      sceneIndex: 0,
      activeLayer: 0,
      playhead: 1,
      selection: [],
      layers: [{ index: 0, id: 10 }],
      capabilityEngine: 'kineora-core',
    },
  }
}

function verification(verdict: VerificationReport['verdict']): VerificationReport {
  return {
    verdict,
    rows: [{ actionIndex: 0, action: 'layer.create', status: verdict, check: 'layer exists' }],
    snapshotRevision: 2,
    structurallyVerified: verdict === 'pass',
  }
}

function activity(): ActivityRecord {
  return {
    id: 'tx-1',
    docId: 1,
    label: 'AI — Create Ball',
    startedAt: 1,
    finishedAt: 2,
    outcome: 'applied',
    actions: [{ index: 0, id: 'make', action: 'layer.create', summary: 'create', status: 'applied' }],
    events: [{ seq: 0, at: 1, type: 'transaction-started' }],
    mutationCount: 1,
    entityBindings: [{ alias: 'make', kind: 'layer', id: 11 }],
  }
}

describe('A6.5 interaction state transitions', () => {
  it('accepts the valid generation → approval → execution → verification → completion path', () => {
    const store = createInteractionStore()
    expect(store.begin(1, 'make a layer').phase).toBe('generating')
    expect(store.transition(1, 'awaitingApproval').phase).toBe('awaitingApproval')
    expect(store.transition(1, 'executing').phase).toBe('executing')
    expect(store.transition(1, 'verifying').phase).toBe('verifying')
    expect(store.transition(1, 'completed').phase).toBe('completed')
  })

  it('rejects invalid transitions fail-closed', () => {
    const store = createInteractionStore()
    expect(() => store.transition(1, 'completed')).toThrow(InteractionStateError)
    store.begin(1, 'x')
    expect(() => store.transition(1, 'verifying')).toThrow(/invalid transition/)
    expect(() => store.begin(1, 'second')).toThrow(/cannot begin/)
  })

  it('represents busy without overwriting an in-flight stored state', () => {
    const store = createInteractionStore()
    store.begin(1, 'first')
    const busy = createBusySnapshot(1, 'already running')
    expect(busy.phase).toBe('busy')
    expect(store.get(1).phase).toBe('generating')
  })
})

describe('A6.5 cards preserve approved data and safety gates', () => {
  it('preserves the exact A4 plan in immutable plan state', () => {
    const store = createInteractionStore()
    store.begin(1, 'request')
    store.transition(1, 'awaitingApproval')
    const approved = plan()
    const state = store.addCard(1, { kind: 'plan', plan: approved })
    const card = state.cards.find((candidate) => candidate.kind === 'plan')
    expect(card?.kind === 'plan' ? card.plan : null).toEqual(approved)
    expect(Object.isFrozen(card)).toBe(true)
    if (card?.kind === 'plan') expect(Object.isFrozen(card.plan.actions)).toBe(true)
  })

  it('represents Tier-B and typed mass confirmation independently', () => {
    const store = createInteractionStore()
    store.begin(1, 'delete')
    store.transition(1, 'awaitingTypedConfirmation')
    const state = store.addCard(1, {
      kind: 'confirmation',
      tierB: true,
      typedRequired: true,
      affectedActions: [0, 2],
      message: 'typed confirmation required',
    })
    const card = state.cards.at(-1)
    expect(card).toMatchObject({ kind: 'confirmation', tierB: true, typedRequired: true })
  })

  it('combines transaction result, verification, activity, bindings, and undo state', () => {
    const store = createInteractionStore()
    store.begin(1, 'request')
    store.transition(1, 'executing')
    store.addCard(1, { kind: 'activity', activity: activity() })
    store.transition(1, 'verifying')
    store.addCard(1, { kind: 'verification', report: verification('pass') })
    store.addCard(1, {
      kind: 'result',
      transactionStatus: 'applied',
      mutationCount: 1,
      verification: 'pass',
      documentId: 1,
      postTransactionRevision: 2,
      activityId: 'tx-1',
      entityBindings: [{ alias: 'make', kind: 'layer', id: 11 }],
      undo: { enabled: true, reason: 'reachable' },
    })
    expect(store.transition(1, 'completed').cards.map((card) => card.kind)).toEqual([
      'user-message', 'progress', 'activity', 'verification', 'result',
    ])
  })

  it('represents deterministic error and cancellation states', () => {
    const store = createInteractionStore()
    store.begin(1, 'request')
    store.transition(1, 'cancelled')
    store.addCard(1, { kind: 'error', error: { kind: 'aborted', message: 'cancelled' } })
    expect(store.get(1)).toMatchObject({ phase: 'cancelled' })
    expect(store.get(1).cards.at(-1)).toMatchObject({ kind: 'error', error: { kind: 'aborted' } })
  })
})

describe('A6.5 plain-data security and isolation', () => {
  it('retains hostile HTML/Markdown as inert plain text data', () => {
    const store = createInteractionStore()
    const text = '<img src=x onerror=alert(1)> **not executable** [x](javascript:alert(1))'
    const state = store.begin(1, text)
    expect(state.cards[0]).toEqual({ seq: 0, kind: 'user-message', text })
    expect(typeof (state.cards[0] as { text?: string }).text).toBe('string')
  })

  it('redacts secrets from user, assistant, progress, and error card text', () => {
    const secret = 'interaction-secret-12345678'
    registerSecret(secret)
    try {
      const store = createInteractionStore()
      store.begin(1, `user ${secret}`)
      store.addCard(1, { kind: 'assistant-message', text: `assistant ${secret}` })
      store.addCard(1, { kind: 'error', error: { kind: 'provider', message: `error ${secret}` } })
      expect(JSON.stringify(store.get(1))).not.toContain(secret)
      expect(JSON.stringify(store.get(1))).toContain('[REDACTED]')
    } finally {
      unregisterSecret(secret)
    }
  })

  it('returned snapshots cannot mutate internal card state', () => {
    const store = createInteractionStore()
    const first = store.begin(1, 'original')
    expect(Object.isFrozen(first)).toBe(true)
    expect(Object.isFrozen(first.cards)).toBe(true)
    expect(() => (first.cards as unknown as Array<{ seq: number }>).push({ seq: 99 })).toThrow()
    expect(() => {
      ;(first.cards[0] as { text?: string }).text = 'mutated'
    }).toThrow()
    expect(store.get(1).cards[0]).toMatchObject({ kind: 'user-message', text: 'original' })
  })

  it('keeps interaction state isolated by document', () => {
    const store = createInteractionStore()
    store.begin(2, 'B')
    store.begin(1, 'A')
    expect(store.get(1).cards[0]).toMatchObject({ text: 'A' })
    expect(store.get(2).cards[0]).toMatchObject({ text: 'B' })
    expect(store.documentIds()).toEqual([1, 2])
  })
})

describe('A6.5 revision-based undo reachability', () => {
  it('enables only for same doc, positive mutation, and exact revision', () => {
    expect(undoReachability({
      transactionDocumentId: 1,
      activeDocumentId: 1,
      mutationCount: 2,
      postTransactionRevision: 8,
      currentRevision: 8,
    }).enabled).toBe(true)
  })

  it.each([
    [{ transactionDocumentId: 1, activeDocumentId: 2, mutationCount: 1, postTransactionRevision: 8, currentRevision: 8 }, 'active'],
    [{ transactionDocumentId: 1, activeDocumentId: 1, mutationCount: 0, postTransactionRevision: 8, currentRevision: 8 }, 'mutate'],
    [{ transactionDocumentId: 1, activeDocumentId: 1, mutationCount: 1, postTransactionRevision: null, currentRevision: 8 }, 'unavailable'],
    [{ transactionDocumentId: 1, activeDocumentId: 1, mutationCount: 1, postTransactionRevision: 8, currentRevision: 9 }, 'edit/undo/redo'],
  ] as const)('disables honestly when reachability condition fails', (input, reason) => {
    const result = undoReachability(input)
    expect(result.enabled).toBe(false)
    expect(result.reason).toContain(reason)
  })
})
