import { describe, expect, it, vi } from 'vitest'
import type { ActivityRecord } from './activity'
import type { CompleteResult, ProviderAdapter } from './adapters'
import { createDailyTokenCeilingStore } from './budget'
import { createConversationContextStore } from './context'
import { createBusySnapshot, createInteractionStore, type InteractionPhase } from './interaction'
import { createKeyVault, type StorageLike } from './keys'
import { AiOrchestrator } from './orchestrator'
import { createProviderStore } from './providers'
import type { TransactionResult } from './runner'
import { buildSnapshotView } from './snapshot'
import { createUsageMeter } from './usage'
import type { VerificationReport } from './verifier'

function memoryStorage(): StorageLike {
  const data = new Map<string, string>()
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => { data.set(key, value) },
    removeItem: (key) => { data.delete(key) },
  }
}

function manifest(): string {
  return JSON.stringify({
    v: 1,
    engine: 'kineora-core',
    manifestFormat: 'kineora-ai-manifest',
    shapes: ['rect', 'oval'],
    nodeFamilies: ['shape'],
    features: {
      classicTween: true,
      perKeyTransform: true,
      symbols: true,
      folders: true,
      frameLabels: true,
      arrangeAlign: true,
      strokeAtDraw: true,
      selectionByIds: true,
      compositeUndo: true,
      playbackAutomation: false,
    },
  })
}

function snapshot(nodes = 1, rev = 1): string {
  const rows = Array.from({ length: nodes }, (_, index) => ({
    id: 100 + index,
    kind: 'oval',
    kf: [[0, 1]],
    x: index * 20,
    y: 0,
    sx: 1,
    sy: 1,
    r: 0,
    w: 10,
    h: 10,
    fill: '#ff0000',
    sw: 0,
  }))
  return JSON.stringify({
    v: 1,
    rev,
    settings: { w: 800, h: 600, fps: 24, bg: '#ffffff', bgA: 1 },
    scene: { i: 0, name: 'Scene 1', count: 1 },
    active_layer: 0,
    playhead: 1,
    duration: 1,
    selection: rows.map((node) => node.id),
    counts: { layers: 1, nodes, keyframes: 1, tweens: 0, symbols: 0 },
    layers: [{ i: 0, id: 10, name: 'Art', kind: 'normal', vis: true, lock: false, kf: [{ f: 1, n: nodes }], tw: [] }],
    nodes: rows,
    library: [],
  })
}

const PLAN = JSON.stringify({
  plan: [{ id: 'shape1', action: 'shape.create', params: { shape: 'oval', x: 1, y: 1, w: 10, h: 10, fill: '#ff0000' } }],
  expected: [],
  report: 'shape',
})

const MASS_PLAN = JSON.stringify({
  plan: [{ action: 'node.delete', params: { nodes: [100, 101, 102] } }],
  expected: [],
  report: 'delete',
})

function activity(docId: number): ActivityRecord {
  return {
    id: `tx-${docId}`,
    docId,
    label: 'AI — test',
    startedAt: 1,
    finishedAt: 2,
    outcome: 'applied',
    actions: [],
    events: [],
    mutationCount: 1,
    entityBindings: [{ alias: 'shape1', kind: 'node', id: 100 }],
  }
}

function transaction(docId: number): TransactionResult {
  return { ok: true, outcome: 'applied', mutationCount: 1, activity: activity(docId) }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail })
  return { promise, resolve, reject }
}

async function waitForCalls(mock: ReturnType<typeof vi.fn>, count: number): Promise<void> {
  for (let attempts = 0; attempts < 30 && mock.mock.calls.length < count; attempts += 1) {
    await Promise.resolve()
  }
  expect(mock).toHaveBeenCalledTimes(count)
}

function harness(options: {
  complete?: ProviderAdapter['complete']
  nodes?: number
  verify?: () => VerificationReport
} = {}) {
  const storage = memoryStorage()
  const providerStore = createProviderStore(storage, () => 1)
  const provider = providerStore.upsert({ type: 'openai', label: 'Test', model: 'model' })!
  providerStore.setActive(provider.id)
  const keyVault = createKeyVault()
  keyVault.set(provider.id, 'sk-disposal-test-123456')
  const usage = createUsageMeter(storage, () => Date.UTC(2026, 7, 23))
  const ceiling = createDailyTokenCeilingStore(storage, () => Date.UTC(2026, 7, 23))
  ceiling.set(1_000_000)
  const context = createConversationContextStore()
  const interaction = createInteractionStore()
  let activeDocument = 1
  const complete = vi.fn(options.complete ?? (async () => ({ text: PLAN, structured: 'schema' as const })))
  const adapter: ProviderAdapter = {
    type: 'openai',
    complete,
    testConnection: async () => ({ ok: true, latencyMs: 1 }),
  }
  const run = vi.fn((plan) => transaction(plan.validatedAt.sceneIndex + activeDocument))
  const verify = options.verify ?? (() => ({
    verdict: 'pass' as const,
    rows: [],
    snapshotRevision: 2,
    structurallyVerified: true,
  }))
  const orchestrator = new AiOrchestrator({
    providerStore,
    keyVault,
    hasConsent: () => true,
    usage,
    ceiling,
    context,
    interaction,
    adapters: { openai: adapter, anthropic: adapter, gemini: adapter, 'openai-compatible': adapter },
    transaction: { run },
    liveSnapshot: () => snapshot(options.nodes ?? 1, 2),
    liveCapabilities: () => manifest(),
    currentRevision: () => 2,
    currentDocumentId: () => activeDocument,
    hasEngineFacades: () => true,
    hasTransactionFacade: () => true,
    hasShapeDraw: () => true,
    isGestureActive: () => false,
    verify,
  })
  return {
    orchestrator,
    context,
    interaction,
    complete,
    run,
    usage,
    providerStore,
    keyVault,
    setActive: (documentId: number) => { activeDocument = documentId },
  }
}

describe('A6.8 Phase 2 store disposal invariants', () => {
  it('clears conversation, entity bindings, and PromptBuilder export for the closed document only', () => {
    const h = harness()
    h.context.appendTurn(1, { role: 'user', content: 'A secret context' })
    h.context.addBindings(1, [{ alias: 'ball', kind: 'node', id: 100 }], 2)
    h.context.appendTurn(2, { role: 'user', content: 'B context' })
    expect(h.orchestrator.disposeDocument(1)).toBe(true)
    expect(h.context.get(1)).toEqual({ documentId: 1, turns: [], bindings: [] })
    expect(h.context.isDisposed(1)).toBe(true)
    expect(() => h.context.forPrompt(1, buildSnapshotView(snapshot()))).toThrow(/disposed/)
    expect(h.context.get(2).turns[0]?.content).toBe('B context')
  })

  it.each([
    'generating', 'awaitingApproval', 'awaitingTypedConfirmation', 'executing',
    'verifying', 'completed', 'failed', 'cancelled', 'unavailable',
  ] as InteractionPhase[])('makes %s interaction state unreachable', (phase) => {
    const h = harness()
    h.interaction.begin(1, 'A')
    if (phase !== 'generating') {
      // Build only valid paths; direct terminal alternatives originate at generating.
      if (phase === 'executing' || phase === 'verifying' || phase === 'completed') {
        h.interaction.transition(1, 'executing')
        if (phase === 'verifying' || phase === 'completed') h.interaction.transition(1, 'verifying')
        if (phase === 'completed') h.interaction.transition(1, 'completed')
      } else {
        h.interaction.transition(1, phase)
      }
    }
    h.orchestrator.disposeDocument(1)
    expect(h.interaction.get(1)).toEqual({ documentId: 1, phase: 'idle', cards: [] })
    expect(h.interaction.isDisposed(1)).toBe(true)
    expect(() => h.interaction.begin(1, 'resurrect')).toThrow(/disposed/)
  })

  it('a detached busy snapshot cannot recreate disposed stored interaction state', () => {
    const h = harness()
    const staleBusy = createBusySnapshot(1, 'busy')
    expect(staleBusy.phase).toBe('busy')
    h.orchestrator.disposeDocument(1)
    expect(h.interaction.get(1)).toEqual({ documentId: 1, phase: 'idle', cards: [] })
    expect(() => h.interaction.addCard(1, { kind: 'error', error: { kind: 'busy', message: 'late' } }))
      .toThrow(/disposed/)
  })

  it('is idempotent and safely tombstones an unknown document', () => {
    const h = harness()
    expect(h.orchestrator.disposeDocument(999)).toBe(false)
    expect(h.orchestrator.disposeDocument(999)).toBe(false)
    expect(h.orchestrator.isDisposed(999)).toBe(true)
    expect(() => h.context.appendTurn(999, { role: 'user', content: 'no' })).toThrow(/disposed/)
  })

  it('a new document identity never inherits the closed identity context/bindings', () => {
    const h = harness()
    h.context.appendTurn(1, { role: 'user', content: 'old name, old identity' })
    h.context.addBindings(1, [{ alias: 'oldBall', kind: 'node', id: 100 }], 2)
    h.orchestrator.disposeDocument(1)
    h.context.appendTurn(3, { role: 'user', content: 'same display name, new identity' })
    expect(h.context.get(3).turns[0]?.content).toContain('new identity')
    expect(h.context.get(3).bindings).toEqual([])
    expect(h.context.get(1)).toEqual({ documentId: 1, turns: [], bindings: [] })
  })
})

describe('A6.8 Phase 2 stale asynchronous completion safety', () => {
  it('aborts in-flight generation and ignores late provider success', async () => {
    const late = deferred<CompleteResult>()
    const h = harness({ complete: async () => await late.promise })
    const request = h.orchestrator.generate({ documentId: 1, userRequest: 'A request', mode: 'preview' })
    await waitForCalls(h.complete, 1)
    expect(h.orchestrator.disposeDocument(1)).toBe(true)
    late.resolve({ text: PLAN, structured: 'schema', usage: { inputTokens: 10, outputTokens: 10 } })
    const result = await request
    expect(result.error?.kind).toBe('document-closed')
    expect(h.run).not.toHaveBeenCalled()
    expect(h.usage.today().requests).toBe(0)
    expect(h.context.get(1).turns).toEqual([])
    expect(h.interaction.get(1).cards).toEqual([])
  })

  it('ignores late provider failure without recreating error cards', async () => {
    const late = deferred<CompleteResult>()
    const h = harness({ complete: async () => await late.promise })
    const request = h.orchestrator.generate({ documentId: 1, userRequest: 'A request', mode: 'preview' })
    await waitForCalls(h.complete, 1)
    h.orchestrator.disposeDocument(1)
    late.reject(new Error('late network failure'))
    const result = await request
    expect(result.error?.kind).toBe('document-closed')
    expect(h.interaction.get(1).cards).toEqual([])
    expect(h.context.get(1).turns).toEqual([])
  })

  it('ignores late malformed provider completion after close', async () => {
    const late = deferred<CompleteResult>()
    const h = harness({ complete: async () => await late.promise })
    const request = h.orchestrator.generate({ documentId: 1, userRequest: 'A request', mode: 'preview' })
    await waitForCalls(h.complete, 1)
    h.orchestrator.disposeDocument(1)
    late.resolve({ text: 'not-json', structured: 'degraded' })
    expect((await request).error?.kind).toBe('document-closed')
    expect(h.complete).toHaveBeenCalledTimes(1)
    expect(h.run).not.toHaveBeenCalled()
  })

  it('invalidates an in-flight validation-repair completion', async () => {
    const repair = deferred<CompleteResult>()
    let call = 0
    const h = harness({
      complete: async () => {
        call += 1
        if (call === 1) return { text: 'not-json', structured: 'degraded' }
        return await repair.promise
      },
    })
    const request = h.orchestrator.generate({ documentId: 1, userRequest: 'repair', mode: 'preview' })
    await waitForCalls(h.complete, 2)
    h.orchestrator.disposeDocument(1)
    repair.resolve({ text: PLAN, structured: 'schema' })
    expect((await request).error?.kind).toBe('document-closed')
    expect(h.run).not.toHaveBeenCalled()
    expect(h.context.get(1).turns).toEqual([])
  })

  it('invalidates a late verification-replan completion without a second A5 call', async () => {
    const replan = deferred<CompleteResult>()
    let call = 0
    const failedVerification: VerificationReport = {
      verdict: 'fail',
      rows: [{ status: 'fail', action: 'shape.create', check: 'shape absent' }],
      snapshotRevision: 2,
      structurallyVerified: false,
    }
    const h = harness({
      verify: () => failedVerification,
      complete: async () => {
        call += 1
        if (call === 1) return { text: PLAN, structured: 'schema' }
        return await replan.promise
      },
    })
    const request = h.orchestrator.generate({ documentId: 1, userRequest: 'apply', mode: 'apply' })
    await waitForCalls(h.complete, 2)
    expect(h.run).toHaveBeenCalledTimes(1)
    h.orchestrator.disposeDocument(1)
    replan.resolve({ text: PLAN, structured: 'schema' })
    expect((await request).error?.kind).toBe('document-closed')
    expect(h.run).toHaveBeenCalledTimes(1)
    expect(h.context.get(1).turns).toEqual([])
    expect(h.interaction.get(1).cards).toEqual([])
  })
})

describe('A6.8 Phase 2 pending plan/confirmation disposal', () => {
  it('closed PREVIEW approval fails closed and cannot call A5', async () => {
    const h = harness()
    const pending = await h.orchestrator.generate({ documentId: 1, userRequest: 'preview', mode: 'preview' })
    expect(pending.status).toBe('awaitingApproval')
    h.orchestrator.disposeDocument(1)
    const approved = await h.orchestrator.approve(1)
    expect(approved.error?.kind).toBe('document-closed')
    expect(h.run).not.toHaveBeenCalled()
    expect(h.interaction.get(1).cards).toEqual([])
  })

  it('closed typed confirmation fails closed and cannot call A5', async () => {
    const h = harness({ nodes: 5, complete: async () => ({ text: MASS_PLAN, structured: 'schema' }) })
    const pending = await h.orchestrator.generate({ documentId: 1, userRequest: 'delete', mode: 'apply' })
    expect(pending.status).toBe('awaitingTypedConfirmation')
    h.orchestrator.disposeDocument(1)
    const approved = await h.orchestrator.approve(1, {
      tierBConfirmed: true,
      typedConfirmationAccepted: true,
    })
    expect(approved.error?.kind).toBe('document-closed')
    expect(h.run).not.toHaveBeenCalled()
  })

  it('closed documents cannot start new generation or recreate cards/turns', async () => {
    const h = harness()
    h.orchestrator.disposeDocument(1)
    const result = await h.orchestrator.generate({ documentId: 1, userRequest: 'resurrect', mode: 'ask' })
    expect(result.error?.kind).toBe('document-closed')
    expect(h.complete).not.toHaveBeenCalled()
    expect(h.interaction.get(1).cards).toEqual([])
    expect(() => h.context.appendTurn(1, { role: 'user', content: 'resurrect' })).toThrow(/disposed/)
  })
})

describe('A6.8 Phase 2 multi-document isolation', () => {
  it('disposing A leaves B context/cards/provider/key/usage state untouched', () => {
    const h = harness()
    h.context.appendTurn(1, { role: 'user', content: 'A' })
    h.context.appendTurn(2, { role: 'user', content: 'B' })
    h.interaction.begin(1, 'A card')
    h.interaction.begin(2, 'B card')
    h.orchestrator.disposeDocument(1)
    expect(h.context.get(2).turns[0]?.content).toBe('B')
    expect(h.interaction.get(2).cards[0]).toMatchObject({ text: 'B card' })
    expect(h.providerStore.active()).toBeTruthy()
    expect(h.keyVault.has(h.providerStore.active()!.id)).toBe(true)
    expect(h.usage.today().requests).toBe(0)
  })

  it('aborting A does not abort B in-flight request; B can complete normally', async () => {
    const a = deferred<CompleteResult>()
    const b = deferred<CompleteResult>()
    let call = 0
    const h = harness({
      complete: async () => {
        call += 1
        return await (call === 1 ? a.promise : b.promise)
      },
    })
    const requestA = h.orchestrator.generate({ documentId: 1, userRequest: 'A', mode: 'ask' })
    const requestB = h.orchestrator.generate({ documentId: 2, userRequest: 'B', mode: 'ask' })
    await waitForCalls(h.complete, 2)
    h.orchestrator.disposeDocument(1)
    b.resolve({ text: 'B answer', structured: 'none' })
    a.resolve({ text: 'A late', structured: 'none' })
    const [resultA, resultB] = await Promise.all([requestA, requestB])
    expect(resultA.error?.kind).toBe('document-closed')
    expect(resultB.ok).toBe(true)
    expect(h.context.get(2).turns.map((turn) => turn.content)).toEqual(['B', 'B answer'])
  })

  it('B can still preview and approve after A is disposed', async () => {
    const h = harness()
    h.orchestrator.disposeDocument(1)
    h.setActive(2)
    const pending = await h.orchestrator.generate({ documentId: 2, userRequest: 'shape', mode: 'preview' })
    expect(pending.status).toBe('awaitingApproval')
    await h.orchestrator.approve(2)
    expect(h.run).toHaveBeenCalledTimes(1)
  })

  it('active-document switching alone disposes neither document', () => {
    const h = harness()
    h.context.appendTurn(1, { role: 'user', content: 'A' })
    h.context.appendTurn(2, { role: 'user', content: 'B' })
    h.setActive(2)
    h.setActive(1)
    expect(h.context.get(1).turns[0]?.content).toBe('A')
    expect(h.context.get(2).turns[0]?.content).toBe('B')
    expect(h.orchestrator.isDisposed(1)).toBe(false)
    expect(h.orchestrator.isDisposed(2)).toBe(false)
  })

  it('close/reopen sequence cannot resurrect a tombstoned identity', async () => {
    const h = harness()
    h.context.appendTurn(1, { role: 'user', content: 'old A' })
    h.orchestrator.disposeDocument(1)
    h.setActive(3)
    await h.orchestrator.generate({ documentId: 3, userRequest: 'new document', mode: 'ask' })
    expect(h.context.get(3).turns[0]?.content).toBe('new document')
    expect(h.context.get(1).turns).toEqual([])
    expect((await h.orchestrator.generate({ documentId: 1, userRequest: 'old id', mode: 'ask' })).error?.kind)
      .toBe('document-closed')
  })
})
