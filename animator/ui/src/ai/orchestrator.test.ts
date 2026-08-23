import { describe, expect, it, vi } from 'vitest'
import type { ActivityRecord } from './activity'
import type { CompleteResult, ProviderAdapter } from './adapters'
import { AiError } from './adapters'
import { createDailyTokenCeilingStore } from './budget'
import { createConversationContextStore } from './context'
import { createInteractionStore } from './interaction'
import { createKeyVault, type StorageLike } from './keys'
import { AiOrchestrator, type AiOrchestratorDeps } from './orchestrator'
import { createProviderStore } from './providers'
import type { TransactionResult } from './runner'
import { createUsageMeter } from './usage'
import type { VerificationReport } from './verifier'

function memoryStorage(): StorageLike {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value) },
    removeItem: (key) => { values.delete(key) },
  }
}

function manifest(classicTween = true): string {
  return JSON.stringify({
    v: 1,
    engine: 'kineora-core',
    manifestFormat: 'kineora-ai-manifest',
    shapes: ['rect', 'oval'],
    nodeFamilies: ['shape', 'symbol'],
    features: {
      classicTween,
      perKeyTransform: true,
      symbols: true,
      folders: true,
      instanceLoopModes: true,
      scenes: true,
      frameLabels: true,
      arrangeAlign: true,
      strokeAtDraw: true,
      selectionByIds: true,
      compositeUndo: true,
      playbackAutomation: false,
    },
  })
}

function snapshot(options: {
  rev?: number
  width?: number
  nodes?: number
  locked?: boolean
  withCreatedShape?: boolean
} = {}): string {
  const count = options.nodes ?? (options.withCreatedShape ? 1 : 0)
  const nodes = Array.from({ length: count }, (_, index) => ({
    id: 100 + index,
    kind: index === 0 && options.withCreatedShape ? 'oval' : 'rect',
    kf: [[0, 1]],
    x: index === 0 && options.withCreatedShape ? 10 : index * 20,
    y: index === 0 && options.withCreatedShape ? 20 : 0,
    sx: 1,
    sy: 1,
    r: 0,
    w: index === 0 && options.withCreatedShape ? 30 : 10,
    h: index === 0 && options.withCreatedShape ? 40 : 10,
    fill: index === 0 && options.withCreatedShape ? '#ff0000' : '#000000',
    sw: 0,
  }))
  return JSON.stringify({
    v: 1,
    rev: options.rev ?? 1,
    settings: { w: options.width ?? 800, h: 600, fps: 24, bg: '#ffffff', bgA: 1 },
    scene: { i: 0, name: 'Scene 1', count: 1 },
    active_layer: 0,
    playhead: 1,
    duration: 1,
    selection: nodes.map((node) => node.id),
    counts: { layers: 1, nodes: nodes.length, keyframes: 1, tweens: 0, symbols: 0 },
    layers: [{
      i: 0,
      id: 10,
      name: 'Art',
      kind: 'normal',
      vis: true,
      lock: options.locked ?? false,
      kf: [{ f: 1, n: nodes.length }],
      tw: [],
    }],
    nodes,
    library: [],
  })
}

const SHAPE_PLAN = JSON.stringify({
  plan: [{
    id: 'shape1',
    action: 'shape.create',
    params: { shape: 'oval', x: 10, y: 20, w: 30, h: 40, fill: '#ff0000' },
  }],
  expected: [],
  report: 'Create oval',
})

const TIER_B_PLAN = JSON.stringify({
  plan: [{ action: 'doc.setSettings', params: { width: 900 } }],
  expected: [],
  report: 'Resize stage',
})

function deletionPlan(count: number): string {
  return JSON.stringify({
    plan: [{ action: 'node.delete', params: { nodes: Array.from({ length: count }, (_, index) => 100 + index) } }],
    expected: [],
    report: 'Delete selected nodes',
  })
}

function appliedActivity(): ActivityRecord {
  return {
    id: 'tx-1',
    docId: 1,
    label: 'AI — Create oval',
    startedAt: 1,
    finishedAt: 2,
    outcome: 'applied',
    actions: [{ index: 0, id: 'shape1', action: 'shape.create', summary: 'shape', status: 'applied' }],
    events: [],
    mutationCount: 1,
    entityBindings: [{ alias: 'shape1', kind: 'node', id: 100 }],
  }
}

function txSuccess(): TransactionResult {
  return { ok: true, outcome: 'applied', mutationCount: 1, activity: appliedActivity() }
}

interface HarnessOptions {
  provider?: boolean
  key?: boolean
  consent?: boolean
  ceiling?: number | null
  responses?: Array<string | CompleteResult | Error>
  liveSnapshot?: () => string
  liveCapabilities?: () => string
  transactionResult?: TransactionResult
  verify?: (input: Parameters<NonNullable<AiOrchestratorDeps['verify']>>[0]) => VerificationReport
  gesture?: (() => boolean) | null
  activeDocument?: () => number | null
}

function harness(options: HarnessOptions = {}) {
  const storage = memoryStorage()
  const providerStore = createProviderStore(storage, () => 1)
  let providerId = 'missing'
  if (options.provider !== false) {
    const configured = providerStore.upsert({ type: 'openai', label: 'Test', model: 'test-model' })
    if (!configured) throw new Error('test provider setup failed')
    providerId = configured.id
    providerStore.setActive(providerId)
  }
  const keyVault = createKeyVault()
  if (options.key !== false) keyVault.set(providerId, 'sk-testkey-1234567890')
  const usage = createUsageMeter(storage, () => Date.UTC(2026, 7, 23))
  const ceiling = createDailyTokenCeilingStore(storage, () => Date.UTC(2026, 7, 23))
  if (options.ceiling !== null) ceiling.set(options.ceiling ?? 1_000_000)
  const context = createConversationContextStore()
  const interaction = createInteractionStore()
  const queue = [...(options.responses ?? [SHAPE_PLAN])]
  const complete = vi.fn(async (_cfg, _key, req): Promise<CompleteResult> => {
    const next = queue.shift() ?? SHAPE_PLAN
    if (next instanceof Error) throw next
    if (typeof next === 'string') {
      return { text: next, structured: req.jsonSchema ? 'schema' : 'none', usage: { inputTokens: 10, outputTokens: 5 } }
    }
    return next
  })
  const adapter: ProviderAdapter = {
    type: 'openai',
    complete,
    testConnection: async () => ({ ok: true, latencyMs: 1 }),
  }
  let mutated = false
  const run = vi.fn(() => {
    mutated = true
    return options.transactionResult ?? txSuccess()
  })
  const deps: AiOrchestratorDeps = {
    providerStore,
    keyVault,
    hasConsent: () => options.consent !== false,
    usage,
    ceiling,
    context,
    interaction,
    adapters: { openai: adapter, anthropic: adapter, gemini: adapter, 'openai-compatible': adapter },
    transaction: { run },
    liveSnapshot: options.liveSnapshot ?? (() => mutated ? snapshot({ rev: 2, withCreatedShape: true }) : snapshot()),
    liveCapabilities: options.liveCapabilities ?? (() => manifest()),
    currentRevision: () => mutated ? 2 : 1,
    currentDocumentId: options.activeDocument ?? (() => 1),
    hasEngineFacades: () => true,
    hasTransactionFacade: () => true,
    hasShapeDraw: () => true,
    evaluateFrame: () => [],
    ...(options.gesture === null
      ? {}
      : { isGestureActive: options.gesture ?? (() => false) }),
    ...(options.verify ? { verify: options.verify } : {}),
  }
  return {
    orchestrator: new AiOrchestrator(deps),
    complete,
    run,
    usage,
    ceiling,
    context,
    interaction,
    get mutated() { return mutated },
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => { resolve = done })
  return { promise, resolve }
}

describe('A6.3 modes and execution gates', () => {
  it('runs a complete ASK flow with zero A5 writes', async () => {
    const h = harness({ responses: ['Scene has one editable layer.'] })
    const result = await h.orchestrator.generate({ documentId: 1, userRequest: 'scene me kya hai?', mode: 'ask' })
    expect(result).toMatchObject({ ok: true, status: 'completed' })
    expect(h.run).not.toHaveBeenCalled()
    expect(h.context.get(1).turns.map((turn) => turn.content)).toEqual([
      'scene me kya hai?', 'Scene has one editable layer.',
    ])
  })

  it('PREVIEW returns the exact validated plan and never executes before approval', async () => {
    const h = harness()
    const result = await h.orchestrator.generate({ documentId: 1, userRequest: 'oval banao', mode: 'preview' })
    expect(result.status).toBe('awaitingApproval')
    expect(result.plan?.actions[0]?.action).toBe('shape.create')
    expect(h.run).not.toHaveBeenCalled()
  })

  it('takes "make a ball" through prompt → provider → A4 → approval → one A5 call → verifier', async () => {
    const h = harness({ responses: [SHAPE_PLAN] })
    const preview = await h.orchestrator.generate({
      documentId: 1,
      userRequest: 'make a ball',
      mode: 'preview',
    })
    expect(preview).toMatchObject({
      status: 'awaitingApproval',
      plan: {
        actions: [{ action: 'shape.create', params: { shape: 'oval' } }],
      },
    })
    const providerRequest = h.complete.mock.calls[0]?.[2]
    expect(providerRequest.messages.at(-1)).toEqual({ role: 'user', content: 'make a ball' })
    expect(providerRequest.messages[0]?.content).toContain('shape.create')
    expect(JSON.stringify(providerRequest)).not.toContain('sk-testkey-1234567890')
    expect(h.run).not.toHaveBeenCalled()

    const applied = await h.orchestrator.approve(1)
    expect(h.run).toHaveBeenCalledTimes(1)
    expect(h.run).toHaveBeenCalledWith(preview.plan)
    expect(applied).toMatchObject({
      ok: true,
      status: 'completed',
      transaction: { ok: true, outcome: 'applied' },
      verification: { verdict: 'pass' },
    })
  })

  it('APPLY executes a Tier-A plan through exactly one A5 transaction', async () => {
    const h = harness()
    const result = await h.orchestrator.generate({ documentId: 1, userRequest: 'oval banao', mode: 'apply' })
    expect(h.run).toHaveBeenCalledTimes(1)
    expect(result).toMatchObject({ ok: true, status: 'completed', verification: { verdict: 'pass' } })
  })

  it('Tier-B always waits for explicit confirmation', async () => {
    let resized = false
    const h = harness({
      responses: [TIER_B_PLAN],
      liveSnapshot: () => snapshot({ rev: resized ? 2 : 1, width: resized ? 900 : 800 }),
      transactionResult: txSuccess(),
    })
    h.run.mockImplementation(() => { resized = true; return txSuccess() })
    const pending = await h.orchestrator.generate({ documentId: 1, userRequest: 'resize', mode: 'apply' })
    expect(pending.status).toBe('awaitingApproval')
    expect(h.run).not.toHaveBeenCalled()
    await h.orchestrator.approve(1)
    expect(h.run).not.toHaveBeenCalled()
    await h.orchestrator.approve(1, { tierBConfirmed: true })
    expect(h.run).toHaveBeenCalledTimes(1)
  })

  it('mass-destructive plans require typed confirmation in addition to Tier-B', async () => {
    const h = harness({ responses: [deletionPlan(3)], liveSnapshot: () => snapshot({ nodes: 5 }) })
    const pending = await h.orchestrator.generate({ documentId: 1, userRequest: 'delete', mode: 'apply' })
    expect(pending.status).toBe('awaitingTypedConfirmation')
    await h.orchestrator.approve(1, { tierBConfirmed: true })
    expect(h.run).not.toHaveBeenCalled()
    await h.orchestrator.approve(1, { tierBConfirmed: true, typedConfirmationAccepted: true })
    expect(h.run).toHaveBeenCalledTimes(1)
  })

  it('surfaces gesture busy and never invents a fallback when the contract is active or missing', async () => {
    const active = harness({ gesture: () => true })
    const activeResult = await active.orchestrator.generate({ documentId: 1, userRequest: 'oval', mode: 'apply' })
    expect(activeResult).toMatchObject({ status: 'busy', error: { kind: 'gesture-busy' } })
    expect(active.run).not.toHaveBeenCalled()

    const missing = harness({ gesture: null })
    const missingResult = await missing.orchestrator.generate({ documentId: 1, userRequest: 'oval', mode: 'apply' })
    expect(missingResult).toMatchObject({ status: 'busy', error: { kind: 'gesture-busy' } })
    expect(missing.run).not.toHaveBeenCalled()
  })
})

describe('A6.3 preflight and concurrency', () => {
  it.each([
    ['no-provider', { provider: false }],
    ['no-key', { key: false }],
    ['no-consent', { consent: false }],
  ] as const)('fails safely for %s', async (kind, options) => {
    const h = harness(options)
    const result = await h.orchestrator.generate({ documentId: 1, userRequest: 'hello' })
    expect(result).toMatchObject({ ok: false, status: 'unavailable', error: { kind } })
    expect(h.complete).not.toHaveBeenCalled()
    expect(h.run).not.toHaveBeenCalled()
  })

  it('rejects before dispatch when daily ceiling reservation exceeds the cap', async () => {
    const h = harness({ ceiling: 1 })
    const result = await h.orchestrator.generate({ documentId: 1, userRequest: 'hello' })
    expect(result.error?.kind).toBe('usage-ceiling')
    expect(h.complete).not.toHaveBeenCalled()
    expect(h.usage.today().requests).toBe(0)
  })

  it('deterministically refuses a second same-document in-flight request', async () => {
    const wait = deferred<CompleteResult>()
    const h = harness({ responses: [] })
    h.complete.mockImplementationOnce(async () => await wait.promise)
    const first = h.orchestrator.generate({ documentId: 1, userRequest: 'first', mode: 'ask' })
    const second = await h.orchestrator.generate({ documentId: 1, userRequest: 'second', mode: 'ask' })
    expect(second).toMatchObject({ ok: false, status: 'busy', error: { kind: 'busy' } })
    wait.resolve({ text: 'done', structured: 'none', usage: { inputTokens: 1, outputTokens: 1 } })
    await first
  })

  it('allows independent in-flight requests for different documents', async () => {
    const a = deferred<CompleteResult>()
    const b = deferred<CompleteResult>()
    const h = harness({ responses: [] })
    h.complete
      .mockImplementationOnce(async () => await a.promise)
      .mockImplementationOnce(async () => await b.promise)
    const first = h.orchestrator.generate({ documentId: 1, userRequest: 'A', mode: 'ask' })
    const second = h.orchestrator.generate({ documentId: 2, userRequest: 'B', mode: 'ask' })
    expect(h.complete).toHaveBeenCalledTimes(2)
    a.resolve({ text: 'A reply', structured: 'none' })
    b.resolve({ text: 'B reply', structured: 'none' })
    await Promise.all([first, second])
    expect(h.context.get(1).turns.map((turn) => turn.content)).toEqual(['A', 'A reply'])
    expect(h.context.get(2).turns.map((turn) => turn.content)).toEqual(['B', 'B reply'])
  })
})

describe('A6.3 abort, repair, and fail-closed output handling', () => {
  it('AbortController Stop cancels generation, releases lock, and never executes stale completion', async () => {
    const wait = deferred<CompleteResult>()
    const h = harness({ responses: [] })
    let signal: AbortSignal | undefined
    h.complete.mockImplementationOnce(async (_cfg, _key, request) => {
      signal = request.signal
      return await wait.promise
    })
    const generation = h.orchestrator.generate({ documentId: 1, userRequest: 'cancel me', mode: 'apply' })
    const stopped = h.orchestrator.stop(1)
    expect(signal?.aborted).toBe(true)
    expect(stopped).toMatchObject({ status: 'cancelled', error: { kind: 'aborted' } })
    wait.resolve({ text: SHAPE_PLAN, structured: 'schema', usage: { inputTokens: 9, outputTokens: 9 } })
    const result = await generation
    expect(result.status).toBe('cancelled')
    expect(h.run).not.toHaveBeenCalled()
    expect(h.usage.today().requests).toBe(0)
  })

  it('repairs malformed output exactly once, then validates the corrected plan', async () => {
    const h = harness({ responses: ['not-json', SHAPE_PLAN] })
    const result = await h.orchestrator.generate({ documentId: 1, userRequest: 'oval', mode: 'preview' })
    expect(result.status).toBe('awaitingApproval')
    expect(h.complete).toHaveBeenCalledTimes(2)
    expect(h.run).not.toHaveBeenCalled()
  })

  it('stops after the one malformed-output repair limit', async () => {
    const h = harness({ responses: ['bad-1', 'bad-2', SHAPE_PLAN] })
    const result = await h.orchestrator.generate({ documentId: 1, userRequest: 'oval', mode: 'preview' })
    expect(result.error?.kind).toBe('malformed-output')
    expect(h.complete).toHaveBeenCalledTimes(2)
    expect(h.run).not.toHaveBeenCalled()
  })

  it('repairs a validation failure exactly once without recursive retries', async () => {
    const invalid = JSON.stringify({ plan: [{ action: 'fly', params: {} }] })
    const h = harness({ responses: [invalid, SHAPE_PLAN] })
    const result = await h.orchestrator.generate({ documentId: 1, userRequest: 'oval', mode: 'preview' })
    expect(result.status).toBe('awaitingApproval')
    expect(h.complete).toHaveBeenCalledTimes(2)
  })

  it('never sends exhausted validation failure to A5', async () => {
    const invalid = JSON.stringify({ plan: [{ action: 'fly', params: {} }] })
    const h = harness({ responses: [invalid, invalid, SHAPE_PLAN] })
    const result = await h.orchestrator.generate({ documentId: 1, userRequest: 'fly', mode: 'apply' })
    expect(result.error?.kind).toBe('validation')
    expect(h.complete).toHaveBeenCalledTimes(2)
    expect(h.run).not.toHaveBeenCalled()
  })
})

describe('A6.3 A4/A5/verification/activity integration', () => {
  it('fresh post-provider A3 state rejects a newly locked target before A5', async () => {
    let reads = 0
    const h = harness({
      responses: [JSON.stringify({ plan: [{ action: 'shape.create', params: { shape: 'oval', x: 1, y: 1, w: 10, h: 10, fill: '#ff0000' } }] })],
      liveSnapshot: () => snapshot({ locked: ++reads >= 2 }),
    })
    const result = await h.orchestrator.generate({ documentId: 1, userRequest: 'oval', mode: 'apply' })
    expect(result.error?.kind).toBe('validation')
    expect(h.run).not.toHaveBeenCalled()
  })

  it('capability mismatch is revalidated and never reaches A5', async () => {
    let reads = 0
    const tween = JSON.stringify({ plan: [{ action: 'tween.classic.set', params: { layer: 0, start: 1, end: 2, ease: 0 } }] })
    const h = harness({
      responses: [tween, tween],
      liveCapabilities: () => manifest(++reads < 2),
    })
    const result = await h.orchestrator.generate({ documentId: 1, userRequest: 'tween', mode: 'apply' })
    expect(result.error?.kind).toBe('validation')
    expect(h.run).not.toHaveBeenCalled()
  })

  it('propagates A5 rollback and activity without pretending success', async () => {
    const rolled: TransactionResult = {
      ok: false,
      outcome: 'rolled-back',
      mutationCount: 0,
      activity: { ...appliedActivity(), outcome: 'rolled-back', mutationCount: 0 },
      error: { code: 'E_STATE', stage: 8, message: 'stale target' },
    }
    const h = harness({ transactionResult: rolled })
    const result = await h.orchestrator.generate({ documentId: 1, userRequest: 'oval', mode: 'apply' })
    expect(result).toMatchObject({ ok: false, error: { kind: 'transaction' }, verification: { verdict: 'fail' } })
    expect(result.state.cards.some((card) => card.kind === 'activity')).toBe(true)
  })

  it('records usage only after completed provider responses', async () => {
    const h = harness({ responses: [new AiError('network', 'openai', 'offline')] })
    await h.orchestrator.generate({ documentId: 1, userRequest: 'oval', mode: 'preview' })
    expect(h.usage.today().requests).toBe(0)

    const good = harness({ responses: [SHAPE_PLAN] })
    await good.orchestrator.generate({ documentId: 1, userRequest: 'oval', mode: 'preview' })
    expect(good.usage.today()).toMatchObject({ requests: 1, inputTokens: 10, outputTokens: 5 })
  })

  it('marks an unexpected provider overage exhausted and blocks the next request', async () => {
    const h = harness({
      ceiling: 100_000,
      responses: [
        { text: SHAPE_PLAN, structured: 'schema', usage: { inputTokens: 99_000, outputTokens: 2_000 } },
        SHAPE_PLAN,
      ],
    })
    await h.orchestrator.generate({ documentId: 1, userRequest: 'oval', mode: 'preview' })
    expect(h.ceiling.isExhausted()).toBe(true)
    const second = await h.orchestrator.generate({ documentId: 1, userRequest: 'again', mode: 'preview' })
    expect(second.error?.kind).toBe('usage-ceiling')
    expect(h.complete).toHaveBeenCalledTimes(1)
  })

  it('surfaces structured-output degradation after strict local A4 validation', async () => {
    const h = harness({ responses: [{ text: SHAPE_PLAN, structured: 'degraded', usage: { inputTokens: 1, outputTokens: 1 } }] })
    const result = await h.orchestrator.generate({ documentId: 1, userRequest: 'oval', mode: 'preview' })
    expect(result.structured).toBe('degraded')
    expect(result.state.cards.some((card) => card.kind === 'progress' && card.detail.includes('degraded'))).toBe(true)
  })

  it('redacts provider errors before state/context exposure', async () => {
    const secret = 'sk-supersecret-1234567890'
    const h = harness({ responses: [new AiError('auth', 'openai', `bad ${secret}`)] })
    const result = await h.orchestrator.generate({ documentId: 1, userRequest: 'oval' })
    expect(JSON.stringify(result)).not.toContain(secret)
    expect(JSON.stringify(result)).toContain('[REDACTED]')
  })

  it('performs at most one verification-triggered replan and never auto-executes it', async () => {
    const failReport: VerificationReport = {
      verdict: 'fail',
      rows: [{ status: 'fail', action: 'shape.create', check: 'shape absent' }],
      snapshotRevision: 2,
      structurallyVerified: false,
    }
    const h = harness({ responses: [SHAPE_PLAN, SHAPE_PLAN], verify: () => failReport })
    const result = await h.orchestrator.generate({ documentId: 1, userRequest: 'oval', mode: 'apply' })
    expect(h.run).toHaveBeenCalledTimes(1)
    expect(h.complete).toHaveBeenCalledTimes(2)
    expect(result.status).toBe('awaitingApproval')
    expect(result.plan?.actions[0]?.action).toBe('shape.create')

    const exhausted = await h.orchestrator.approve(1)
    expect(h.run).toHaveBeenCalledTimes(2)
    expect(h.complete).toHaveBeenCalledTimes(2) // no second verification replan
    expect(exhausted.error?.kind).toBe('verification')
  })

  it('produces deterministic transition/card shapes for identical flows', async () => {
    const run = async () => {
      const h = harness({ responses: [SHAPE_PLAN] })
      const result = await h.orchestrator.generate({ documentId: 1, userRequest: 'oval', mode: 'preview' })
      return JSON.stringify(result.state)
    }
    expect(await run()).toBe(await run())
  })
})
