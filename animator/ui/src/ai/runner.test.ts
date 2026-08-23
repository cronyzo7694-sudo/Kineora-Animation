import { describe, expect, it } from 'vitest'
import type { AiEngineTransactionResult } from '../engine/client'
import { buildCapabilityRegistry, parseEngineManifest } from './capabilities'
import { createActivityStore } from './activity'
import { registerSecret, unregisterSecret } from './redact'
import { buildSnapshotView } from './snapshot'
import { TransactionRunner, type TransactionEngine } from './runner'
import { validatePlan, type ValidatedPlan } from './validate'

interface SnapshotOptions {
  rev?: number
  selection?: number[]
  node?: boolean
  hidden?: boolean
  locked?: boolean
  ancestorHidden?: boolean
  ancestorLocked?: boolean
  playhead?: number
  activeLayer?: number
  tween?: boolean
}

function snapshot(options: SnapshotOptions = {}): string {
  const withFolder = options.ancestorHidden === true || options.ancestorLocked === true
  const nodeLayer = withFolder ? 1 : 0
  const layers = [
    ...(withFolder
      ? [{
          i: 0, id: 9, name: 'Folder', kind: 'folder', vis: !options.ancestorHidden,
          lock: options.ancestorLocked === true, kf: [], tw: [],
        }]
      : []),
    {
      i: nodeLayer,
      id: 10,
      name: 'Art',
      kind: 'normal',
      vis: !options.hidden,
      lock: options.locked === true,
      ...(withFolder ? { parent: 9 } : {}),
      kf: options.tween
        ? [{ f: 1, n: 1 }, { f: 10, n: 1 }]
        : [{ f: 1, n: options.node === false ? 0 : 1 }],
      tw: [],
    },
  ]
  return JSON.stringify({
    v: 1,
    rev: options.rev ?? 0,
    settings: { w: 800, h: 600, fps: 24, bg: '#ffffff', bgA: 1 },
    scene: { i: 0, name: 'Scene 1', count: 1 },
    active_layer: options.activeLayer ?? nodeLayer,
    playhead: options.playhead ?? 1,
    duration: options.tween ? 10 : 1,
    selection: options.selection ?? [],
    counts: {
      layers: layers.length,
      nodes: options.node === false ? 0 : 1,
      keyframes: options.tween ? 2 : 1,
      tweens: 0,
      symbols: 0,
    },
    layers,
    nodes: options.node === false
      ? []
      : [{ id: 100, kind: 'rect', kf: options.tween ? [[nodeLayer, 1], [nodeLayer, 10]] : [[nodeLayer, 1]], x: 10, y: 20, sx: 1, sy: 1, r: 0, w: 20, h: 20, fill: '#ff0000', sw: 0 }],
    library: [],
  })
}

function manifest(overrides: Record<string, boolean> = {}): string {
  return JSON.stringify({
    v: 1,
    engine: 'kineora-core',
    manifestFormat: 'kineora-ai-manifest',
    shapes: ['rect', 'oval'],
    nodeFamilies: ['shape', 'symbol'],
    features: {
      classicTween: true,
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
      ...overrides,
    },
  })
}

function validated(raw: object, snap = snapshot()): ValidatedPlan {
  const view = buildSnapshotView(snap)
  const registry = buildCapabilityRegistry(parseEngineManifest(manifest()), { hasShapeDraw: true })
  const result = validatePlan(JSON.stringify(raw), { registry, snapshot: view, mode: 'preview' })
  if (!result.ok) throw new Error(JSON.stringify(result.issues))
  return result.plan
}

function successFor(planJson: string): AiEngineTransactionResult {
  const parsed = JSON.parse(planJson) as ValidatedPlan
  return {
    ok: true,
    outcome: 'applied',
    rolledBack: false,
    mutationCount: parsed.actions.length,
    actions: parsed.actions.map((action) => ({
      index: action.index,
      ...(action.id ? { id: action.id } : {}),
      action: action.action,
      status: 'applied',
      summary: action.humanText,
    })),
    bindings: [],
  }
}

function engine(overrides: Partial<TransactionEngine> = {}): TransactionEngine {
  return {
    liveSnapshot: () => snapshot(),
    liveCapabilities: () => manifest(),
    hasShapeDraw: () => true,
    activeDocId: () => 7,
    execute: (planJson) => successFor(planJson),
    ...overrides,
  }
}

function deterministicActivity() {
  let time = 100
  return createActivityStore({ now: () => time++, idFactory: () => 'tx-fixed' })
}

describe('A5 TransactionRunner — live revalidation + one atomic engine dispatch', () => {
  it('executes a single already-validated action', () => {
    const plan = validated({ plan: [{ action: 'layer.create', params: { name: 'Ball' } }], report: 'one' })
    let calls = 0
    const runner = new TransactionRunner({
      engine: engine({ execute: (json) => { calls += 1; return successFor(json) } }),
      activity: deterministicActivity(),
    })
    const result = runner.run(plan)
    expect(result.ok).toBe(true)
    expect(calls).toBe(1)
    expect(result.mutationCount).toBe(1)
    expect(result.activity.outcome).toBe('applied')
    expect(result.activity.events.map((event) => event.type)).toEqual([
      'transaction-started',
      'action-executing',
      'completed',
    ])
  })

  it('preserves validated multi-action order in the single engine dispatch', () => {
    const plan = validated({
      plan: [
        { id: 'l1', action: 'layer.create', params: { name: 'Ball' } },
        { id: 'n1', action: 'shape.create', params: { shape: 'oval', x: 5, y: 6, w: 20, h: 20, fill: '#ff0000', layer: { ref: 'l1' } } },
        { action: 'node.transform', params: { node: { ref: 'n1' }, y: 100 } },
      ],
      report: 'ordered',
    })
    let received: string[] = []
    const runner = new TransactionRunner({
      engine: engine({
        execute: (json) => {
          const fresh = JSON.parse(json) as ValidatedPlan
          received = fresh.actions.map((action) => action.action)
          return successFor(json)
        },
      }),
      activity: deterministicActivity(),
    })
    expect(runner.run(plan).ok).toBe(true)
    expect(received).toEqual(['layer.create', 'shape.create', 'node.transform'])
  })

  it('catches a target deleted after validation before engine dispatch', () => {
    const plan = validated({ plan: [{ action: 'node.transform', params: { node: 100, x: 40 } }] })
    let calls = 0
    const runner = new TransactionRunner({
      engine: engine({ liveSnapshot: () => snapshot({ node: false, rev: 1 }), execute: () => { calls += 1; return null } }),
      activity: deterministicActivity(),
    })
    const result = runner.run(plan)
    expect(result.ok).toBe(false)
    expect(result.error?.code).toBe('E_REF')
    expect(calls).toBe(0)
  })

  it.each([
    ['locked layer', { locked: true }, 'E_GUARD'],
    ['hidden layer', { hidden: true }, 'E_GUARD'],
    ['locked ancestor', { ancestorLocked: true }, 'E_GUARD'],
    ['hidden ancestor', { ancestorHidden: true }, 'E_GUARD'],
  ] as const)('catches a live %s guard', (_label, changed, code) => {
    const changedOptions: SnapshotOptions = changed
    const initial = changedOptions.ancestorHidden || changedOptions.ancestorLocked
      ? snapshot({ ancestorHidden: false, ancestorLocked: false })
      : snapshot()
    const plan = validated({ plan: [{ action: 'node.transform', params: { node: 100, x: 40 } }] }, initial)
    const runner = new TransactionRunner({
      engine: engine({ liveSnapshot: () => snapshot({ ...changedOptions, rev: 1 }) }),
      activity: deterministicActivity(),
    })
    const result = runner.run(plan)
    expect(result.ok).toBe(false)
    expect(result.error?.code).toBe(code)
  })

  it('rejects a stale selected-reference when selection changes without a revision bump', () => {
    const initial = snapshot({ selection: [100] })
    const plan = validated({ plan: [{ action: 'node.transform', params: { node: { selected: true }, x: 50 } }] }, initial)
    const runner = new TransactionRunner({
      engine: engine({ liveSnapshot: () => snapshot({ selection: [] }) }),
      activity: deterministicActivity(),
    })
    const result = runner.run(plan)
    expect(result.ok).toBe(false)
    expect(result.error).toMatchObject({ code: 'E_REF', stage: 7, actionIndex: 0 })
  })

  it('re-checks capability availability against the live manifest', () => {
    const initial = snapshot({ tween: true })
    const plan = validated({ plan: [{ action: 'tween.classic.set', params: { layer: 0, start: 1, end: 10, ease: 0 } }] }, initial)
    const runner = new TransactionRunner({
      engine: engine({ liveSnapshot: () => initial, liveCapabilities: () => manifest({ classicTween: false }) }),
      activity: deterministicActivity(),
    })
    const result = runner.run(plan)
    expect(result.ok).toBe(false)
    expect(result.error?.code).toBe('E_CAPABILITY')
  })

  it('reports a middle-action engine rollback with no final mutations', () => {
    const plan = validated({
      plan: [
        { action: 'layer.create', params: {} },
        { action: 'layer.create', params: {} },
        { action: 'layer.create', params: {} },
      ],
    })
    const runner = new TransactionRunner({
      engine: engine({
        execute: () => ({
          ok: false,
          outcome: 'rolled-back',
          rolledBack: true,
          mutationCount: 0,
          actions: [
            { index: 0, action: 'layer.create', status: 'rolled-back' },
            { index: 1, action: 'layer.create', status: 'failed' },
            { index: 2, action: 'layer.create', status: 'skipped' },
          ],
          bindings: [],
          error: { code: 'E_STATE', stage: 8, message: 'middle stale', actionIndex: 1 },
        }),
      }),
      activity: deterministicActivity(),
    })
    const result = runner.run(plan)
    expect(result).toMatchObject({ ok: false, outcome: 'rolled-back', mutationCount: 0 })
    expect(result.activity.actions.map((action) => action.status)).toEqual(['rolled-back', 'failed', 'skipped'])
  })

  it('reports a final-action rollback deterministically', () => {
    const plan = validated({ plan: [{ action: 'layer.create', params: {} }, { action: 'layer.create', params: {} }] })
    const runner = new TransactionRunner({
      engine: engine({
        execute: () => ({
          ok: false,
          outcome: 'rolled-back',
          rolledBack: true,
          mutationCount: 0,
          actions: [
            { index: 0, action: 'layer.create', status: 'rolled-back' },
            { index: 1, action: 'layer.create', status: 'failed' },
          ],
          bindings: [],
          error: { code: 'E_STATE', stage: 8, message: 'final stale', actionIndex: 1 },
        }),
      }),
      activity: deterministicActivity(),
    })
    const result = runner.run(plan)
    expect(result.error).toMatchObject({ actionIndex: 1, code: 'E_STATE' })
    expect(result.activity.events.map((event) => event.type).slice(-2)).toEqual(['rollback', 'failure'])
  })

  it('revalidates a tampered action name instead of trusting TypeScript shape alone', () => {
    const plan = validated({ plan: [{ action: 'layer.create', params: {} }] })
    const hostile = {
      ...plan,
      actions: [{ ...plan.actions[0], action: 'doc.save' }],
    } as ValidatedPlan
    let calls = 0
    const runner = new TransactionRunner({
      engine: engine({ execute: () => { calls += 1; return null } }),
      activity: deterministicActivity(),
    })
    const result = runner.run(hostile)
    expect(result.ok).toBe(false)
    expect(result.error?.code).toBe('E_CAPABILITY')
    expect(calls).toBe(0)
  })

  it('fails closed when the A4 validation stamp is missing', () => {
    const plan = validated({ plan: [{ action: 'layer.create', params: {} }] })
    const unstamped = { ...plan, validatedAt: undefined } as unknown as ValidatedPlan
    const result = new TransactionRunner({ engine: engine(), activity: deterministicActivity() }).run(unstamped)
    expect(result.error).toMatchObject({ code: 'E_STATE', stage: 8 })
  })

  it('never stores secrets, raw params, prompts, or provider data in activity', () => {
    const key = 'sk-proj-a5-secret-1234567890'
    registerSecret(key)
    try {
      const plan = validated({ plan: [{ action: 'layer.create', params: { name: 'Safe' } }], report: `done ${key}` })
      const runner = new TransactionRunner({ engine: engine(), activity: deterministicActivity() })
      const result = runner.run(plan)
      const text = JSON.stringify(result.activity)
      expect(text).not.toContain(key)
      expect(text).toContain('[REDACTED]')
      expect(text).not.toContain('params')
      expect(text).not.toContain('provider')
      expect(text).not.toContain('prompt')
    } finally {
      unregisterSecret(key)
    }
  })

  it('produces deterministic result/activity records with injected clock and id', () => {
    const plan = validated({ plan: [{ id: 'make', action: 'layer.create', params: {} }], report: 'stable' })
    const run = () => new TransactionRunner({ engine: engine(), activity: deterministicActivity() }).run(plan)
    expect(run()).toEqual(run())
  })
})
