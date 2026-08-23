import { describe, expect, it } from 'vitest'
import type { ActivityRecord } from './activity'
import type { TransactionResult } from './runner'
import { buildSnapshotView } from './snapshot'
import type { ValidatedAction, ValidatedPlan } from './validate'
import { verifyTransaction } from './verifier'

function action(overrides: Partial<ValidatedAction> = {}): ValidatedAction {
  return {
    index: 0,
    id: 'shape1',
    action: 'shape.create',
    params: { shape: 'oval', x: 10, y: 20, w: 30, h: 40, fill: '#ff0000' },
    targets: [],
    humanText: 'oval',
    tier: 'A',
    ...overrides,
  }
}

function plan(actions: ValidatedAction[] = [action()], expected: string[] = []): ValidatedPlan {
  return {
    actions,
    expected,
    report: 'test plan',
    requiresConfirmation: false,
    massDestructive: null,
    budget: { actions: actions.length, estimatedMutations: actions.length },
    validatedAt: {
      docRevision: 1,
      sceneIndex: 0,
      activeLayer: 0,
      playhead: 1,
      selection: [100],
      layers: [{ index: 0, id: 10 }],
      capabilityEngine: 'kineora-core',
    },
  }
}

function activity(bindings: ActivityRecord['entityBindings'] = [{ alias: 'shape1', kind: 'node', id: 100 }]): ActivityRecord {
  return {
    id: 'tx-1',
    docId: 1,
    label: 'AI — test',
    startedAt: 1,
    finishedAt: 2,
    outcome: 'applied',
    actions: [],
    events: [],
    mutationCount: 1,
    entityBindings: bindings,
  }
}

function transaction(overrides: Partial<TransactionResult> = {}): TransactionResult {
  return {
    ok: true,
    outcome: 'applied',
    mutationCount: 1,
    activity: activity(),
    ...overrides,
  }
}

function snapshot(overrides: { x?: number; fill?: string; rev?: number; nodes?: boolean } = {}) {
  return buildSnapshotView(JSON.stringify({
    v: 1,
    rev: overrides.rev ?? 2,
    settings: { w: 800, h: 600, fps: 24, bg: '#ffffff', bgA: 1 },
    scene: { i: 0, name: 'Scene 1', count: 1 },
    active_layer: 0,
    playhead: 1,
    duration: 10,
    selection: overrides.nodes === false ? [] : [100],
    counts: { layers: 1, nodes: overrides.nodes === false ? 0 : 1, keyframes: 2, tweens: 1, symbols: 1 },
    layers: [{
      i: 0,
      id: 10,
      name: 'Art',
      kind: 'normal',
      vis: true,
      lock: false,
      kf: [{ f: 1, n: overrides.nodes === false ? 0 : 1 }, { f: 10, n: overrides.nodes === false ? 0 : 1, label: 'end' }],
      tw: [{ s: 1, e: 10, ease: 25 }],
    }],
    nodes: overrides.nodes === false ? [] : [{
      id: 100,
      kind: 'oval',
      kf: [[0, 1], [0, 10]],
      x: overrides.x ?? 10,
      y: 20,
      sx: 1,
      sy: 1,
      r: 0,
      w: 30,
      h: 40,
      fill: overrides.fill ?? '#ff0000',
      sw: 0,
    }],
    library: [{ id: 50, name: 'Ball', type: 'graphic', uses: 1, dur: 1 }],
  }))
}

describe('A6.4 minimal structural verifier', () => {
  it('returns pass for a successful observable action-derived postcondition', () => {
    const report = verifyTransaction({ plan: plan(), transaction: transaction(), postSnapshot: snapshot() })
    expect(report.verdict).toBe('pass')
    expect(report.structurallyVerified).toBe(true)
    expect(report.rows[0]).toMatchObject({ status: 'pass', action: 'shape.create' })
  })

  it('returns fail when fresh observable post-state contradicts the plan', () => {
    const report = verifyTransaction({ plan: plan(), transaction: transaction(), postSnapshot: snapshot({ x: 999 }) })
    expect(report.verdict).toBe('fail')
    expect(report.rows[0]?.status).toBe('fail')
  })

  it('returns unverifiable for an effect not exposed by current contracts', () => {
    const duplicate = action({ id: undefined, action: 'node.duplicate', params: { nodes: [100] } })
    const report = verifyTransaction({ plan: plan([duplicate]), transaction: transaction(), postSnapshot: snapshot() })
    expect(report.verdict).toBe('unverifiable')
  })

  it('returns unverifiable when a required A5 entity binding is missing', () => {
    const report = verifyTransaction({
      plan: plan(),
      transaction: transaction({ activity: activity([]) }),
      postSnapshot: snapshot(),
    })
    expect(report.verdict).toBe('unverifiable')
    expect(report.rows[0]?.check).toContain('binding')
  })

  it('returns unverifiable when the fresh A3 runtime snapshot is unavailable', () => {
    const report = verifyTransaction({ plan: plan(), transaction: transaction(), postSnapshot: null })
    expect(report).toMatchObject({ verdict: 'unverifiable', snapshotRevision: null })
  })

  it('returns fail immediately for an A5 rollback/failure', () => {
    const failed = transaction({ ok: false, outcome: 'rolled-back', mutationCount: 0 })
    const report = verifyTransaction({ plan: plan(), transaction: failed, postSnapshot: snapshot() })
    expect(report.verdict).toBe('fail')
    expect(report.rows[0]?.evidence).toBe('rolled-back')
  })

  it('never interprets free-form expected[] as executable predicates', () => {
    const malicious = 'document.querySelector("body").remove(); expect pixel-perfect image'
    const report = verifyTransaction({
      plan: plan([action()], [malicious]),
      transaction: transaction(),
      postSnapshot: snapshot(),
    })
    expect(report.verdict).toBe('unverifiable')
    expect(report.rows.at(-1)).toEqual({
      status: 'unverifiable',
      check: 'free-form expected[] is display text only',
      evidence: malicious,
    })
  })

  it('uses the supplied fresh post-state and never caches/reuses stale pre-state', () => {
    const first = verifyTransaction({ plan: plan(), transaction: transaction(), postSnapshot: snapshot({ x: 10, rev: 2 }) })
    const second = verifyTransaction({ plan: plan(), transaction: transaction(), postSnapshot: snapshot({ x: 500, rev: 3 }) })
    expect(first.verdict).toBe('pass')
    expect(second.verdict).toBe('fail')
    expect(second.snapshotRevision).toBe(3)
  })

  it('uses evaluate(frame) only for supported frame-geometry checks', () => {
    const transform = action({ id: undefined, action: 'node.transform', params: { node: 100, x: 55 } })
    const report = verifyTransaction({
      plan: plan([transform]),
      transaction: transaction(),
      postSnapshot: snapshot(),
      evaluateFrame: () => [{ id: 100, x: 55, y: 20, w: 30, h: 40, rotation: 0, fill: '#ff0000', stroke: null, stroke_width: 0 }],
    })
    expect(report.verdict).toBe('pass')
  })

  it('is deterministic for identical inputs and returns frozen rows', () => {
    const input = { plan: plan(), transaction: transaction(), postSnapshot: snapshot() }
    expect(verifyTransaction(input)).toEqual(verifyTransaction(input))
    const report = verifyTransaction(input)
    expect(Object.isFrozen(report)).toBe(true)
    expect(Object.isFrozen(report.rows)).toBe(true)
    expect(Object.isFrozen(report.rows[0])).toBe(true)
  })
})
