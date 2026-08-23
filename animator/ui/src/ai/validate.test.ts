import { describe, expect, it } from 'vitest'
import { buildCapabilityRegistry, parseEngineManifest, type CapabilityRegistry } from './capabilities'
import { buildSnapshotView, parseSceneSnapshot, type SceneSnapshotView } from './snapshot'
import {
  AI_BUDGETS,
  probeFromSnapshot,
  validatePlan,
  type AiErrorCode,
  type AiVariable,
  type DocStateProbe,
  type ValidationIssue,
  type ValidationOptions,
  type ValidationResult,
} from './validate'

// ---------------------------------------------------------------------------
// Fixtures — mirrors snapshot.rs output. Layer layout is deliberately hostile:
// locked, hidden, folder, hidden-ancestor folder, locked-ancestor folder and a
// duplicate-name pair all exist so the guard/reference stages have real work.
// ---------------------------------------------------------------------------

/** Mirrors the CURRENT engine manifest (same shape as capabilities.test.ts). */
function currentEngineJson(): string {
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
      nodeOpacity: false,
      namedEasings: false,
      paths: false,
      text: false,
      motionTween: false,
      shapeTween: false,
      masks: false,
      camera: false,
      audio: false,
    },
  })
}

/**
 * Layer map (i / id / nature):
 *  0/10 road            — LOCKED
 *  1/11 ghost           — HIDDEN
 *  2/12 ani             — editable main: kf 1,5,10 + BLANK kf 20, tween 1..5
 *  3/13 assets          — FOLDER
 *  4/14 hiddenparent    — HIDDEN FOLDER, child of 13 (cycle probe)
 *  5/15 childofhidden   — effectively hidden via 14
 *  6/16 lockedparent    — LOCKED FOLDER
 *  7/17 childoflocked   — effectively locked via 16
 *  8/18 dup, 9/19 dup   — duplicate-name pair (ambiguity probes)
 */
function fixtureJson(over?: { selection?: number[] }): string {
  return JSON.stringify({
    v: 1,
    rev: 42,
    settings: { w: 1920, h: 1080, fps: 24, bg: '#ffffff', bgA: 1 },
    scene: { i: 0, name: 'Scene 1', count: 1 },
    active_layer: 2,
    playhead: 1,
    duration: 40,
    selection: over?.selection ?? [100],
    counts: { layers: 10, nodes: 5, keyframes: 8, tweens: 1, symbols: 2 },
    layers: [
      { i: 0, id: 10, name: 'road', kind: 'normal', vis: true, lock: true, kf: [{ f: 1, n: 1 }], tw: [] },
      { i: 1, id: 11, name: 'ghost', kind: 'normal', vis: false, lock: false, kf: [{ f: 1, n: 1 }], tw: [] },
      {
        i: 2, id: 12, name: 'ani', kind: 'normal', vis: true, lock: false,
        kf: [{ f: 1, n: 2 }, { f: 5, n: 2 }, { f: 10, n: 1 }, { f: 20, blank: true }],
        tw: [{ s: 1, e: 5, ease: 25 }],
      },
      { i: 3, id: 13, name: 'assets', kind: 'folder', vis: true, lock: false, kf: [], tw: [] },
      { i: 4, id: 14, name: 'hiddenparent', kind: 'folder', vis: false, lock: false, parent: 13, kf: [], tw: [] },
      { i: 5, id: 15, name: 'childofhidden', kind: 'normal', vis: true, lock: false, parent: 14, kf: [{ f: 1, n: 1 }], tw: [] },
      { i: 6, id: 16, name: 'lockedparent', kind: 'folder', vis: true, lock: true, kf: [], tw: [] },
      { i: 7, id: 17, name: 'childoflocked', kind: 'normal', vis: true, lock: false, parent: 16, kf: [{ f: 1, n: 1 }], tw: [] },
      { i: 8, id: 18, name: 'dup', kind: 'normal', vis: true, lock: false, kf: [], tw: [] },
      { i: 9, id: 19, name: 'dup', kind: 'normal', vis: true, lock: false, kf: [], tw: [] },
    ],
    nodes: [
      { id: 100, kind: 'rect', kf: [[2, 1], [2, 5]], x: 10, y: 20, w: 30, h: 40, fill: '#ff0000' },
      { id: 101, kind: 'oval', kf: [[2, 1]], x: 0, y: 0, w: 50, h: 50, fill: '#00ff00' },
      { id: 102, kind: 'rect', kf: [[0, 1]], x: 0, y: 0, w: 10, h: 10, fill: '#0000ff' },
      { id: 103, kind: 'rect', kf: [[5, 1]], x: 0, y: 0, w: 10, h: 10, fill: '#123456' },
      { id: 105, kind: 'rect', kf: [[9, 1]], x: 0, y: 0, w: 10, h: 10, fill: '#654321' },
    ],
    library: [
      { id: 50, name: 'Star', type: 'graphic', uses: 1, dur: 12 },
      { id: 51, name: 'Gem', type: 'graphic', uses: 0, dur: 12 },
    ],
  })
}

const NODE_IDS = [100, 101, 102, 103, 105]
const SYMBOL_IDS = [50, 51]

function makeRegistry(): CapabilityRegistry {
  return buildCapabilityRegistry(parseEngineManifest(currentEngineJson()), {})
}

function opts(over?: Partial<ValidationOptions>): ValidationOptions {
  return { registry: makeRegistry(), snapshot: buildSnapshotView(fixtureJson()), ...over }
}

const J = (v: unknown): string => JSON.stringify(v)

function expectFail(r: ValidationResult): ValidationIssue[] {
  expect(r.ok).toBe(false)
  if (r.ok) throw new Error('unreachable')
  expect(r.issues.length).toBeGreaterThan(0)
  return r.issues
}

function expectOk(r: ValidationResult) {
  if (!r.ok) throw new Error(`expected ok plan, got issues: ${JSON.stringify(r.issues)}`)
  return r.plan
}

/** The bouncing-ball plan from the A4 brief (spec 05 example). */
function bouncingBallJson(): string {
  return J({
    plan: [
      { id: 'a1', action: 'layer.create', params: { name: 'ball' } },
      { id: 'a2', action: 'shape.create', params: { shape: 'oval', x: 930, y: 100, w: 60, h: 60, fill: '#e11d48', layer: { ref: 'a1' } } },
      { id: 'a3', action: 'keyframe.insert', params: { layer: { ref: 'a1' }, frame: 15 } },
      { id: 'a4', action: 'node.transform', params: { node: { ref: 'a2' }, y: 400 } },
      { id: 'a5', action: 'tween.classic.set', params: { layer: { ref: 'a1' }, start: 1, end: 15, ease: -60 } },
    ],
    expected: 'ball drops and picks up a classic tween',
    report: 'Bouncing ball',
  })
}

describe('golden plans — valid model output passes end-to-end', () => {
  it('A4 bouncing-ball plan: plan-local refs chain correctly', () => {
    const plan = expectOk(validatePlan(bouncingBallJson(), opts()))
    expect(plan.actions.length).toBe(5)
    expect(plan.report).toBe('Bouncing ball')
    expect(plan.expected).toEqual(['ball drops and picks up a classic tween'])

    const [a1, a2, a3, a4, a5] = plan.actions
    expect(a1?.humanText).toBe('Naya layer "ball"')
    // References are RESOLVED but symbolic — the runner (A5) materializes ids.
    expect(a2?.params.layer).toEqual({ ref: 'a1' })
    expect(a2?.targets).toEqual([{ kind: 'layer-new', ofActionId: 'a1' }])
    expect(a4?.params.node).toEqual({ ref: 'a2' })
    expect(a4?.targets).toEqual([{ kind: 'node-new', ofActionId: 'a2' }])
    expect(a3?.targets).toEqual([{ kind: 'layer-new', ofActionId: 'a1' }])
    // Frame 15 does not exist on any snapshot layer — plan-local layer refs
    // bypass live keyframe probes (A5 revalidates), so this must PASS here.
    expect(a5?.humanText).toBe('classic tween 1..15 ease -60 layer (naya, from a1)')

    expect(plan.requiresConfirmation).toBe(false) // all tier A
    expect(plan.massDestructive).toBeNull()
    expect(plan.budget).toEqual({ actions: 5, estimatedMutations: 5 })
  })

  it('read-only plan (inspect + selection + playback) estimates zero mutations', () => {
    const plan = expectOk(validatePlan(J({
      plan: [
        { action: 'scene.inspect', params: { level: 'summary' } },
        { action: 'selection.set', params: { nodes: [100, 'n2'] } },
        { action: 'playback.gotoFrame', params: { frame: 12 } },
      ],
    }), opts()))
    expect(plan.budget.estimatedMutations).toBe(0)
    expect(plan.requiresConfirmation).toBe(false)
    expect(plan.actions[1]?.params.nodes).toEqual([100, 101]) // alias n2 resolved
  })

  it('tier-B actions flip requiresConfirmation without failing', () => {
    const plan = expectOk(validatePlan(J({
      plan: [
        { action: 'layer.rename', params: { layer: 'ani', name: 'ani2' } },
        { action: 'layer.delete', params: { layer: 8 } },
      ],
    }), opts()))
    expect(plan.requiresConfirmation).toBe(true)
    expect(plan.actions[0]?.params.layer).toBe(2) // unique name → index
    expect(plan.actions[0]?.tier).toBe('A')
    expect(plan.actions[1]?.tier).toBe('B')
  })

  it('mass-destructive FRACTION flag: deleting 3 of 5 nodes flags the plan', () => {
    const plan = expectOk(validatePlan(J({
      plan: [{ action: 'node.delete', params: { nodes: [100, 101, 105] } }],
    }), opts()))
    expect(plan.massDestructive).toEqual({ nodes: 3, totalSceneNodes: 5 })
    expect(plan.requiresConfirmation).toBe(true)
  })

  it('mass-destructive COUNT flag: >20 node deletions in one plan', () => {
    const plan = expectOk(validatePlan(J({
      plan: [{ action: 'node.delete', params: { nodes: Array(21).fill(100) as number[] } }],
    }), opts()))
    expect(plan.massDestructive?.nodes).toBe(21)
  })

  it('variables substitute into scalars and re-pass value checks', () => {
    const variables: Record<string, AiVariable> = {
      bx: { type: 'number', value: 930 },
      col: { type: 'color', value: '#00FF00' },
    }
    const plan = expectOk(validatePlan(J({
      plan: [{ action: 'shape.create', params: { shape: 'rect', x: '$bx', y: 50, w: 10, h: 10, fill: '$col' } }],
    }), opts({ variables })))
    expect(plan.actions[0]?.params.x).toBe(930)
    expect(plan.actions[0]?.params.fill).toBe('#00ff00') // normalized lowercase
  })

  it('Hindi (non-ASCII) names are welcome — governed, not rejected', () => {
    const plan = expectOk(validatePlan(J({
      plan: [{ action: 'layer.create', params: { name: 'गेंद उछालो' } }],
    }), opts()))
    expect(plan.actions[0]?.humanText).toContain('गेंद उछालो')
  })
})

describe('stage 1 · E_PARSE', () => {
  it('empty / non-JSON / oversized input fails at stage 1', () => {
    expect(expectFail(validatePlan('', opts()))[0]).toMatchObject({ code: 'E_PARSE', stage: 1 })
    expect(expectFail(validatePlan('   {', opts()))[0]).toMatchObject({ code: 'E_PARSE', stage: 1 })
    expect(expectFail(validatePlan('not json at all', opts()))[0]).toMatchObject({ code: 'E_PARSE', stage: 1 })
    const huge = `{"plan":${' '.repeat(AI_BUDGETS.maxPlanJsonBytes)}[]}`
    const issue = expectFail(validatePlan(huge, opts()))[0]
    expect(issue).toMatchObject({ code: 'E_PARSE', stage: 1, limit: AI_BUDGETS.maxPlanJsonBytes })
    expect(issue.actual).toBeGreaterThan(AI_BUDGETS.maxPlanJsonBytes)
  })
})

describe('stage 2 · E_SCHEMA envelope', () => {
  it('non-object JSON documents fail', () => {
    for (const doc of ['42', '"text"', '[{"action":"layer.create"}]', 'null']) {
      expect(expectFail(validatePlan(doc, opts()))[0]).toMatchObject({ code: 'E_SCHEMA', stage: 2 })
    }
  })
  it('missing / empty / non-array plan fails', () => {
    expect(expectFail(validatePlan('{}', opts()))[0].message).toContain('"plan" array missing')
    expect(expectFail(validatePlan(J({ plan: [] }), opts()))[0].message).toContain('khaali')
    expect(expectFail(validatePlan(J({ plan: 'x' }), opts()))[0].message).toContain('"plan" array missing')
  })
  it('non-object action members fail with their index', () => {
    const issues = expectFail(validatePlan(J({ plan: [42, { action: 'layer.create' }] }), opts()))
    expect(issues[0]).toMatchObject({ code: 'E_SCHEMA', stage: 2, actionIndex: 0 })
  })
  it('action ids: format + uniqueness enforced before anything else', () => {
    expect(expectFail(validatePlan(J({ plan: [{ id: '1bad', action: 'layer.create' }] }), opts()))[0].message)
      .toContain('id invalid')
    expect(expectFail(validatePlan(J({ plan: [{ id: 'x'.repeat(33), action: 'layer.create' }] }), opts()))[0].message)
      .toContain('id invalid')
    expect(expectFail(validatePlan(J({
      plan: [{ id: 'a1', action: 'layer.create' }, { id: 'a1', action: 'layer.create' }],
    }), opts()))[0].message).toContain('duplicate action id')
  })
  it('expected[] accepts strings only', () => {
    expect(expectFail(validatePlan(J({ plan: [{ action: 'selection.clear' }], expected: [123] }), opts()))[0].message)
      .toContain('sirf strings')
  })
  it('envelope __proto__ key does not pollute and does not pass', () => {
    const r = validatePlan(J({ __proto__: { polluted: 1 }, plan: [{ action: 'selection.clear' }] }), opts())
    expectOk(r)
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})

describe('stage 3 · action vocabulary (fail closed)', () => {
  it('unknown actions fail with a no-manufacture hint', () => {
    const issue = expectFail(validatePlan(J({ plan: [{ action: 'object.spawn3DModel' }] }), opts()))[0]
    expect(issue).toMatchObject({ code: 'E_SCHEMA', stage: 3, actionIndex: 0 })
    expect(issue.message).toContain('unknown action')
    expect(issue.hint).toContain('registry')
  })
  it('non-string action names fail', () => {
    expect(expectFail(validatePlan(J({ plan: [{ action: 42 }] }), opts()))[0].stage).toBe(3)
    expect(expectFail(validatePlan(J({ plan: [{}] }), opts()))[0].stage).toBe(3)
  })
})

describe('stage 4 · closed param schema', () => {
  it('unknown params are rejected', () => {
    const issue = expectFail(validatePlan(J({
      plan: [{ action: 'shape.create', params: { shape: 'oval', x: 1, y: 1, w: 10, h: 10, fill: '#ff0000', gravity: 9.8 } }],
    }), opts()))[0]
    expect(issue).toMatchObject({ code: 'E_SCHEMA', stage: 4, param: 'gravity' })
  })
  it('prototype members do NOT leak past the closed schema', () => {
    for (const key of ['toString', 'constructor', '__proto__', 'hasOwnProperty']) {
      const r = validatePlan(J({ plan: [{ action: 'selection.clear', params: { [key]: 1 } }] }), opts())
      expect(expectFail(r)[0]).toMatchObject({ code: 'E_SCHEMA', stage: 4, param: key })
    }
  })
  it('missing required params are rejected in one batch', () => {
    const issues = expectFail(validatePlan(J({
      plan: [{ action: 'shape.create', params: { shape: 'oval', x: 1, y: 1, w: 10, h: 10 } }],
    }), opts()))
    expect(issues.some((i) => i.param === 'fill' && i.stage === 4)).toBe(true)
    const issues2 = expectFail(validatePlan(J({ plan: [{ action: 'node.transform', params: { x: 1 } }] }), opts()))
    expect(issues2[0]).toMatchObject({ code: 'E_SCHEMA', stage: 4, param: 'node' })
    const issues3 = expectFail(validatePlan(J({ plan: [{ action: 'frames.insert', params: { layer: 2, start: 1 } }] }), opts()))
    expect(issues3[0]).toMatchObject({ code: 'E_SCHEMA', stage: 4, param: 'end' })
  })
})

describe('stage 5 · parameter values — NO coercion, NO expressions', () => {
  const shape = (p: Record<string, unknown>) =>
    J({ plan: [{ action: 'shape.create', params: { shape: 'oval', x: 1, y: 1, w: 10, h: 10, fill: '#ff0000', ...p } }] })

  it('string numbers and arithmetic expressions rejected', () => {
    expect(expectFail(validatePlan(shape({ x: '100px' }), opts()))[0]).toMatchObject({ code: 'E_RANGE', stage: 5, param: 'x' })
    expect(expectFail(validatePlan(shape({ x: '1+2' }), opts()))[0]).toMatchObject({ code: 'E_RANGE', stage: 5, param: 'x' })
    expect(expectFail(validatePlan(shape({ x: '930' }), opts()))[0]).toMatchObject({ code: 'E_RANGE', stage: 5 })
  })
  it('boundary numbers: frame must be a safe whole 1..200000', () => {
    expect(expectFail(validatePlan(J({ plan: [{ action: 'playback.gotoFrame', params: { frame: 2.5 } }] }), opts()))[0].message)
      .toContain('whole frame')
    expect(expectFail(validatePlan(J({ plan: [{ action: 'playback.gotoFrame', params: { frame: 0 } }] }), opts()))[0])
      .toMatchObject({ code: 'E_RANGE', stage: 5 })
    const over = expectFail(validatePlan(J({ plan: [{ action: 'playback.gotoFrame', params: { frame: AI_BUDGETS.maxFrame + 1 } }] }), opts()))[0]
    expect(over).toMatchObject({ code: 'E_RANGE', limit: AI_BUDGETS.maxFrame, actual: AI_BUDGETS.maxFrame + 1 })
    expect(expectOk(validatePlan(J({ plan: [{ action: 'playback.gotoFrame', params: { frame: 200000 } }] }), opts())).actions.length)
      .toBe(1) // boundary itself is legal
    // Absurd magnitudes the wasm u32 could never address are fenced by the range.
    expect(expectFail(validatePlan(J({ plan: [{ action: 'playback.gotoFrame', params: { frame: Number.MAX_SAFE_INTEGER } }] }), opts()))[0])
      .toMatchObject({ code: 'E_RANGE', stage: 5 })
    // Non-safe/non-whole doubles fail the integer fence explicitly.
    expect(expectFail(validatePlan(J({ plan: [{ action: 'playback.gotoFrame', params: { frame: 1.0000000000001 } }] }), opts()))[0].message)
      .toContain('safe integer')
  })
  it('spec min/max enforced (w≥0.01, ease -100..100, fps 1..240)', () => {
    expect(expectFail(validatePlan(shape({ w: 0 }), opts()))[0].message).toContain('≥ 0.01')
    expect(expectFail(validatePlan(J({ plan: [{ action: 'tween.classic.set', params: { layer: 2, start: 1, end: 5, ease: 200 } }] }), opts()))[0].message)
      .toContain('≤ 100')
    expect(expectFail(validatePlan(J({ plan: [{ action: 'doc.setSettings', params: { fps: 500 } }] }), opts()))[0].message)
      .toContain('≤ 240')
  })
  it('colors: only #rrggbb; names and short hex rejected; case normalized', () => {
    expect(expectFail(validatePlan(shape({ fill: 'red' }), opts()))[0]).toMatchObject({ code: 'E_RANGE', param: 'fill' })
    expect(expectFail(validatePlan(shape({ fill: '#FFF' }), opts()))[0]).toMatchObject({ code: 'E_RANGE', param: 'fill' })
    expect(expectFail(validatePlan(shape({ fill: 16711680 }), opts()))[0]).toMatchObject({ code: 'E_RANGE', param: 'fill' })
    const plan = expectOk(validatePlan(shape({ fill: '#A1B2C3', stroke: '#FF00FF', strokeWidth: 2 }), opts()))
    expect(plan.actions[0]?.params.fill).toBe('#a1b2c3')
    expect(plan.actions[0]?.params.stroke).toBe('#ff00ff')
  })
  it('color tri-state: null and "none" are legal (stroke removal)', () => {
    expectOk(validatePlan(shape({ stroke: null }), opts()))
    expectOk(validatePlan(shape({ stroke: 'none' }), opts()))
  })
  it('booleans and enums are strict', () => {
    expect(expectFail(validatePlan(J({ plan: [{ action: 'layer.setVisible', params: { layer: 2, value: 'yes' } }] }), opts()))[0])
      .toMatchObject({ code: 'E_RANGE', stage: 5, param: 'value' })
    expect(expectFail(validatePlan(shape({ shape: 'circle' }), opts()))[0].message).toContain('rect | oval')
  })
  it('strings: length cap and control/format characters', () => {
    const longName = 'x'.repeat(AI_BUDGETS.maxNameLen + 1)
    const over = expectFail(validatePlan(J({ plan: [{ action: 'layer.create', params: { name: longName } }] }), opts()))[0]
    expect(over).toMatchObject({ code: 'E_RANGE', limit: AI_BUDGETS.maxNameLen })
    expect(expectFail(validatePlan(J({ plan: [{ action: 'layer.create', params: { name: 'a\u202Eb' } }] }), opts()))[0].message)
      .toContain('control/invisible')
    expect(expectFail(validatePlan(J({ plan: [{ action: 'layer.create', params: { name: 'tab\tname' } }] }), opts()))[0].message)
      .toContain('control/invisible')
  })
})

describe('stage 6 · variables (scalars only, re-validated)', () => {
  it('undefined $variable fails with a drawer hint', () => {
    const issue = expectFail(validatePlan(J({
      plan: [{ action: 'node.transform', params: { node: 100, x: '$speed' } }],
    }), opts()))[0]
    expect(issue).toMatchObject({ code: 'E_SCHEMA', stage: 6, param: 'x' })
    expect(issue.message).toContain('$speed define nahi')
  })
  it('$variables can NEVER fabricate reference targets', () => {
    const r = validatePlan(J({
      plan: [{ action: 'node.transform', params: { node: '$target', x: 1 } }],
    }), opts({ variables: { target: { type: 'number', value: 100 } } }))
    expect(expectFail(r)[0]).toMatchObject({ code: 'E_SCHEMA', stage: 6, param: 'node' })
  })
  it('substituted values re-pass stage 5 (no blind trust)', () => {
    const r = validatePlan(J({
      plan: [{ action: 'shape.create', params: { shape: 'rect', x: 1, y: 1, w: 10, h: 10, fill: '$col' } }],
    }), opts({ variables: { col: { type: 'number', value: 123 } } }))
    expect(expectFail(r)[0]).toMatchObject({ code: 'E_RANGE', stage: 5, param: 'fill' })
    const hostile = validatePlan(J({
      plan: [{ action: 'layer.create', params: { name: '$nm' } }],
    }), opts({ variables: { nm: { type: 'string', value: 'bad\u202Ename' } } }))
    expect(expectFail(hostile)[0].message).toContain('control/invisible')
  })
  it('uppercase-initial $Names are not variable syntax at all', () => {
    const r = validatePlan(J({ plan: [{ action: 'node.transform', params: { node: 100, x: '$Speed' } }] }), opts())
    expect(expectFail(r)[0]).toMatchObject({ code: 'E_RANGE', stage: 5, param: 'x' })
  })
})

describe('stage 7 · reference resolution (deterministic, fail with candidates)', () => {
  it('numeric node ids must already exist (invented/stale ids fail)', () => {
    const ok = expectOk(validatePlan(J({ plan: [{ action: 'node.transform', params: { node: 100, x: 5 } }] }), opts()))
    expect(ok.actions[0]?.params.node).toBe(100)
    expect(ok.actions[0]?.targets).toEqual([{ kind: 'node-id', id: 100 }])
    const bad = expectFail(validatePlan(J({ plan: [{ action: 'node.transform', params: { node: 999, x: 5 } }] }), opts()))[0]
    expect(bad).toMatchObject({ code: 'E_REF', stage: 7 })
    expect(bad.message).toContain('invented ya stale')
    expect(expectFail(validatePlan(J({ plan: [{ action: 'node.transform', params: { node: -1, x: 5 } }] }), opts()))[0].message)
      .toContain('invalid')
    expect(expectFail(validatePlan(J({ plan: [{ action: 'node.transform', params: { node: 1.5, x: 5 } }] }), opts()))[0].message)
      .toContain('invalid')
  })
  it('numeric layer references are INDICES in the CURRENT snapshot', () => {
    expectOk(validatePlan(J({ plan: [{ action: 'layer.rename', params: { layer: 9, name: 'x' } }] }), opts()))
    const bad = expectFail(validatePlan(J({ plan: [{ action: 'layer.rename', params: { layer: 99, name: 'x' } }] }), opts()))[0]
    expect(bad).toMatchObject({ code: 'E_REF', stage: 7 })
    expect(bad.message).toContain('0..9')
  })
  it('numeric symbol ids must exist in the library', () => {
    expectOk(validatePlan(J({ plan: [{ action: 'symbol.rename', params: { symbol: 50, name: 'S' } }] }), opts()))
    expect(expectFail(validatePlan(J({ plan: [{ action: 'symbol.rename', params: { symbol: 999, name: 'S' } }] }), opts()))[0].message)
      .toContain('library me exist nahi')
  })
  it('aliases resolve via the snapshot view; wrong kind prefix fails', () => {
    const ok = expectOk(validatePlan(J({ plan: [{ action: 'node.transform', params: { node: 'n1', x: 1 } }] }), opts()))
    expect(ok.actions[0]?.params.node).toBe(100)
    const wrong = expectFail(validatePlan(J({ plan: [{ action: 'layer.rename', params: { layer: 'n1', name: 'x' } }] }), opts()))[0]
    expect(wrong.message).toContain('l-alias chahiye')
    expect(expectFail(validatePlan(J({ plan: [{ action: 'node.transform', params: { node: 'n99', x: 1 } }] }), opts()))[0].message)
      .toContain('snapshot ka nahi hai')
  })
  it('bare numeric strings alias per kind', () => {
    const nodePlan = expectOk(validatePlan(J({ plan: [{ action: 'node.transform', params: { node: '2', x: 1 } }] }), opts()))
    expect(nodePlan.actions[0]?.params.node).toBe(101) // 'n2'
    const layerPlan = expectOk(validatePlan(J({ plan: [{ action: 'layer.rename', params: { layer: '1', name: 'x' } }] }), opts()))
    expect(layerPlan.actions[0]?.params.layer).toBe(0) // 'l1' → row 0
  })
  it('unique names resolve for layers and symbols; nodes honestly cannot', () => {
    const l = expectOk(validatePlan(J({ plan: [{ action: 'layer.rename', params: { layer: 'ani', name: 'x' } }] }), opts()))
    expect(l.actions[0]?.params.layer).toBe(2)
    const s = expectOk(validatePlan(J({ plan: [{ action: 'symbol.rename', params: { symbol: 'Gem', name: 'G' } }] }), opts()))
    expect(s.actions[0]?.params.symbol).toBe(51)
    const nodeByName = expectFail(validatePlan(J({ plan: [{ action: 'node.transform', params: { node: 'hero', x: 1 } }] }), opts()))[0]
    expect(nodeByName.message).toContain('nodes ke paas names nahi hote')
    expect(nodeByName.hint).toContain('{"ref"')
  })
  it('ambiguous names fail WITH candidates (never guess)', () => {
    const issue = expectFail(validatePlan(J({ plan: [{ action: 'layer.rename', params: { layer: 'dup', name: 'x' } }] }), opts()))[0]
    expect(issue).toMatchObject({ code: 'E_REF', stage: 7 })
    expect(issue.message).toContain('kaunsa')
    expect(issue.candidates?.length).toBe(2)
    expect(issue.candidates?.[0]?.ref).toBe('l9')
    expect(issue.candidates?.[1]?.label).toContain('id 19')
  })
  it('unknown names fail plainly', () => {
    expect(expectFail(validatePlan(J({ plan: [{ action: 'layer.rename', params: { layer: 'nope', name: 'x' } }] }), opts()))[0].message)
      .toContain('nahi mila')
  })
  it('plan-local {ref} and {lastCreated} resolve symbolically and kind-check', () => {
    const okPlan = J({
      plan: [
        { id: 'a1', action: 'layer.create', params: { name: 'x' } },
        { id: 'a2', action: 'shape.create', params: { shape: 'rect', x: 1, y: 1, w: 10, h: 10, fill: '#ff0000', layer: { lastCreated: 'a1' } } },
      ],
    })
    const ok = expectOk(validatePlan(okPlan, opts()))
    expect(ok.actions[1]?.params.layer).toEqual({ ref: 'a1' })
    expect(ok.actions[1]?.targets).toEqual([{ kind: 'layer-new', ofActionId: 'a1' }])

    const kindMismatch = validatePlan(J({
      plan: [
        { id: 'a1', action: 'shape.create', params: { shape: 'rect', x: 1, y: 1, w: 10, h: 10, fill: '#ff0000' } },
        { action: 'layer.rename', params: { layer: { ref: 'a1' }, name: 'x' } },
      ],
    }), opts())
    expect(expectFail(kindMismatch)[0].message).toContain('ek node banata hai')
  })
  it('forward refs fail — creators must PRECEDE the reference', () => {
    const r = validatePlan(J({
      plan: [
        { id: 'a1', action: 'node.transform', params: { node: { ref: 'a2' }, x: 1 } },
        { id: 'a2', action: 'shape.create', params: { shape: 'rect', x: 1, y: 1, w: 10, h: 10, fill: '#ff0000' } },
      ],
    }), opts())
    expect(expectFail(r)[0]).toMatchObject({ code: 'E_REF', stage: 7, actionIndex: 0 })
  })
  it('{selected:true} resolves against the live selection — node refs only', () => {
    const ok = expectOk(validatePlan(J({ plan: [{ action: 'node.transform', params: { node: { selected: true }, x: 1 } }] }), opts()))
    expect(ok.actions[0]?.params.node).toBe(100)
    const empty = expectFail(validatePlan(J({ plan: [{ action: 'node.transform', params: { node: { selected: true }, x: 1 } }] }), opts({
      snapshot: buildSnapshotView(fixtureJson({ selection: [] })),
    })))[0]
    expect(empty.message).toContain('selection khaali')
    const wrongKind = expectFail(validatePlan(J({ plan: [{ action: 'layer.rename', params: { layer: { selected: true }, name: 'x' } }] }), opts()))[0]
    expect(wrongKind.message).toContain('sirf node refs')
  })
  it('{ordinal} resolves layers only and bounds-check', () => {
    const first = expectOk(validatePlan(J({ plan: [{ action: 'layer.rename', params: { layer: { ordinal: { index: 'first' } }, name: 'x' } }] }), opts()))
    expect(first.actions[0]?.params.layer).toBe(0)
    const last = expectOk(validatePlan(J({ plan: [{ action: 'layer.rename', params: { layer: { ordinal: { index: 'last' } }, name: 'x' } }] }), opts()))
    expect(last.actions[0]?.params.layer).toBe(9)
    expect(expectFail(validatePlan(J({ plan: [{ action: 'layer.rename', params: { layer: { ordinal: { index: 99 } }, name: 'x' } }] }), opts()))[0].message)
      .toContain('scene me nahi hai')
    expect(expectFail(validatePlan(J({ plan: [{ action: 'node.transform', params: { node: { ordinal: { index: 0 } }, x: 1 } }] }), opts()))[0].message)
      .toContain('sirf layer refs')
  })
  it('node lists: resolve each member, cap at selection budget, node-only', () => {
    const ok = expectOk(validatePlan(J({ plan: [{ action: 'node.delete', params: { nodes: [100, 'n2'] } }] }), opts()))
    expect(ok.actions[0]?.params.nodes).toEqual([100, 101])
    expect(expectFail(validatePlan(J({ plan: [{ action: 'node.delete', params: { nodes: [] } }] }), opts()))[0].message)
      .toContain('khaali list')
    const capped = expectFail(validatePlan(J({ plan: [{ action: 'node.delete', params: { nodes: Array(AI_BUDGETS.maxSelectionSize + 1).fill(100) as number[] } }] }), opts()))[0]
    expect(capped).toMatchObject({ code: 'E_REF', limit: AI_BUDGETS.maxSelectionSize })
    expect(expectFail(validatePlan(J({ plan: [{ action: 'layer.duplicate', params: { layer: [2] } }] }), opts()))[0].message)
      .toContain('array form sirf node lists')
  })
  it('mixed plan-local + concrete members in a node list', () => {
    const ok = expectOk(validatePlan(J({
      plan: [
        { id: 'a1', action: 'shape.create', params: { shape: 'oval', x: 1, y: 1, w: 10, h: 10, fill: '#ff0000' } },
        { action: 'node.delete', params: { nodes: [100, { ref: 'a1' }] } },
      ],
    }), opts()))
    expect(ok.actions[1]?.params.nodes).toEqual([100, { ref: 'a1' }])
    expect(ok.actions[1]?.targets).toEqual([{ kind: 'node-id', id: 100 }, { kind: 'node-new', ofActionId: 'a1' }])
  })
})

describe('stage 8 · live document state', () => {
  it('keyframe ops need a CONTENT keyframe at the source', () => {
    expect(expectFail(validatePlan(J({ plan: [{ action: 'keyframe.move', params: { layer: 2, from: 2, to: 3 } }] }), opts()))[0])
      .toMatchObject({ code: 'E_STATE', stage: 8 })
    expect(expectFail(validatePlan(J({ plan: [{ action: 'keyframe.move', params: { layer: 2, from: 1, to: 1 } }] }), opts()))[0].message)
      .toContain('no-op')
    // frame 20 IS a keyframe but BLANK — not movable via content ops
    expect(expectFail(validatePlan(J({ plan: [{ action: 'keyframe.move', params: { layer: 2, from: 20, to: 3 } }] }), opts()))[0].message)
      .toContain('content keyframe nahi hai')
    expectOk(validatePlan(J({ plan: [{ action: 'keyframe.duplicate', params: { layer: 2, from: 1, to: 3 } }] }), opts()))
  })
  it('keyframe.clear needs an existing keyframe', () => {
    expect(expectFail(validatePlan(J({ plan: [{ action: 'keyframe.clear', params: { layer: 2, frame: 3 } }] }), opts()))[0])
      .toMatchObject({ code: 'E_STATE', stage: 8 })
    expectOk(validatePlan(J({ plan: [{ action: 'keyframe.clear', params: { layer: 2, frame: 1 } }] }), opts()))
  })
  it('tween spans: start<end and BOTH endpoints need keyframes', () => {
    expect(expectFail(validatePlan(J({ plan: [{ action: 'tween.classic.set', params: { layer: 2, start: 10, end: 1, ease: 0 } }] }), opts()))[0].message)
      .toContain('tween span galat')
    expect(expectFail(validatePlan(J({ plan: [{ action: 'tween.classic.set', params: { layer: 2, start: 1, end: 7, ease: 0 } }] }), opts()))[0].message)
      .toContain('end frame 7 par content keyframe nahi')
    expectOk(validatePlan(J({ plan: [{ action: 'tween.classic.set', params: { layer: 2, start: 1, end: 5, ease: -40 } }] }), opts()))
  })
  it('tween.remove needs an existing span', () => {
    expect(expectFail(validatePlan(J({ plan: [{ action: 'tween.remove', params: { layer: 2, start: 3 } }] }), opts()))[0])
      .toMatchObject({ code: 'E_STATE', stage: 8 })
    expectOk(validatePlan(J({ plan: [{ action: 'tween.remove', params: { layer: 2, start: 1 } }] }), opts()))
  })
  it('frames.ranges: start ≤ end', () => {
    expect(expectFail(validatePlan(J({ plan: [{ action: 'frames.insert', params: { layer: 2, start: 10, end: 5 } }] }), opts()))[0].message)
      .toContain('frames range galat')
    expectOk(validatePlan(J({ plan: [{ action: 'frames.insert', params: { layer: 2, start: 1, end: 5 } }] }), opts()))
  })
  it('layer.reorder bounds the target slot', () => {
    expect(expectFail(validatePlan(J({ plan: [{ action: 'layer.reorder', params: { layer: 2, to: 99 } }] }), opts()))[0].message)
      .toContain('valid range 0..9')
    expectOk(validatePlan(J({ plan: [{ action: 'layer.reorder', params: { layer: 2, to: 0 } }] }), opts()))
  })
  it('layer.setParent: folder-only, no self, no cycles', () => {
    expect(expectFail(validatePlan(J({ plan: [{ action: 'layer.setParent', params: { layer: 2, parent: 2 } }] }), opts()))[0].message)
      .toContain('apne hi andar')
    expect(expectFail(validatePlan(J({ plan: [{ action: 'layer.setParent', params: { layer: 2, parent: 1 } }] }), opts()))[0].message)
      .toContain('folder nahi hai')
    // hiddenparent(4) already lives under assets(3) → parenting 3 under 4 cycles
    expect(expectFail(validatePlan(J({ plan: [{ action: 'layer.setParent', params: { layer: 3, parent: 4 } }] }), opts()))[0].message)
      .toContain('cycle')
    expectOk(validatePlan(J({ plan: [{ action: 'layer.setParent', params: { layer: 2, parent: 3 } }] }), opts()))
  })
  it('plan-local layer refs skip live probes (regression: frames.insert on {ref})', () => {
    const plan = expectOk(validatePlan(J({
      plan: [
        { id: 'a1', action: 'layer.create', params: { name: 'tl' } },
        { action: 'frames.insert', params: { layer: { ref: 'a1' }, start: 1, end: 30 } },
        { action: 'tween.remove', params: { layer: { ref: 'a1' }, start: 1 } },
        { action: 'keyframe.clear', params: { layer: { ref: 'a1' }, frame: 7 } },
      ],
    }), opts()))
    expect(plan.actions.length).toBe(4)
  })
})

describe('stage 9 · guards — engine B-5 family mirrored (+ tier policy)', () => {
  const shapeOn = (layer: number) =>
    J({ plan: [{ action: 'shape.create', params: { shape: 'rect', x: 1, y: 1, w: 10, h: 10, fill: '#ff0000', layer } }] })

  it('locked layers refuse content ops', () => {
    expect(expectFail(validatePlan(shapeOn(0), opts()))[0]).toMatchObject({ code: 'E_GUARD', stage: 9, param: 'layer' })
    expect(expectFail(validatePlan(shapeOn(0), opts()))[0].message).toContain('locked')
  })
  it('hidden layers refuse content ops', () => {
    expect(expectFail(validatePlan(shapeOn(1), opts()))[0].message).toContain('hidden')
  })
  it('folder layers refuse content ops', () => {
    expect(expectFail(validatePlan(shapeOn(3), opts()))[0].message).toContain('folder')
  })
  it('ancestor flags are EFFECTIVE: child of hidden folder', () => {
    expect(expectFail(validatePlan(shapeOn(5), opts()))[0].message).toContain('hidden ancestor')
  })
  it('ancestor flags are EFFECTIVE: child of locked folder', () => {
    expect(expectFail(validatePlan(shapeOn(7), opts()))[0].message).toContain('locked ancestor')
  })
  it('node ops check every layer the node lives on', () => {
    expect(expectFail(validatePlan(J({ plan: [{ action: 'node.transform', params: { node: 102, x: 1 } }] }), opts()))[0].message)
      .toContain('locked')
    expect(expectFail(validatePlan(J({ plan: [{ action: 'node.transform', params: { node: 103, x: 1 } }] }), opts()))[0].message)
      .toContain('hidden')
    expect(expectFail(validatePlan(J({ plan: [{ action: 'node.delete', params: { nodes: [100, 102] } }] }), opts()))[0])
      .toMatchObject({ code: 'E_GUARD', stage: 9 })
  })
  it('keyframe ops refuse guarded layers too', () => {
    expect(expectFail(validatePlan(J({ plan: [{ action: 'keyframe.insert', params: { layer: 0, frame: 9 } }] }), opts()))[0])
      .toMatchObject({ code: 'E_GUARD', stage: 9 })
    expect(expectFail(validatePlan(J({ plan: [{ action: 'keyframe.clear', params: { layer: 1, frame: 1 } }] }), opts()))[0])
      .toMatchObject({ code: 'E_GUARD', stage: 9 })
  })
  it('visibility/lock toggles themselves are NOT guarded (unlock path must stay open)', () => {
    expectOk(validatePlan(J({ plan: [{ action: 'layer.setVisible', params: { layer: 1, value: true } }] }), opts()))
    expectOk(validatePlan(J({ plan: [{ action: 'layer.setLocked', params: { layer: 0, value: false } }] }), opts()))
  })
  it('ASK mode blocks every mutation but allows scene.inspect', () => {
    const ask = expectFail(validatePlan(J({ plan: [{ action: 'layer.create', params: {} }] }), opts({ mode: 'ask' })))[0]
    expect(ask).toMatchObject({ code: 'E_TIER', stage: 9 })
    expect(ask.message).toContain('ASK mode')
    expect(expectFail(validatePlan(J({ plan: [{ action: 'playback.gotoFrame', params: { frame: 2 } }] }), opts({ mode: 'ask' })))[0].code)
      .toBe('E_TIER')
    expectOk(validatePlan(J({ plan: [{ action: 'scene.inspect', params: { level: 'detail' } }] }), opts({ mode: 'ask' })))
  })
})

describe('stage 10 · capability honesty (single source = engine manifest)', () => {
  it('known-but-unsupported actions fail at stage 10, not stage 3', () => {
    const r = validatePlan(J({ plan: [{ action: 'node.setOpacity', params: { node: 100, alpha: 0.5 } }] }), opts())
    const issue = expectFail(r)[0]
    expect(issue).toMatchObject({ code: 'E_CAPABILITY', stage: 10 })
    expect(issue.message).toContain('available nahi')
    expect(issue.hint).toContain('per-node alpha')
  })
  it('motion/shape tweens and pen paths honestly report "engine pending"', () => {
    expect(expectFail(validatePlan(J({ plan: [{ action: 'tween.motion.set', params: { layer: 2, start: 1, end: 5 } }] }), opts()))[0])
      .toMatchObject({ code: 'E_CAPABILITY', stage: 10 })
    expect(expectFail(validatePlan(J({ plan: [{ action: 'path.draw', params: {} }] }), opts()))[0])
      .toMatchObject({ code: 'E_CAPABILITY', stage: 10 })
  })
  it('deferred rows say "UI me hai, AI ke liye exposed nahi" (AI-REQ-112)', () => {
    const issue = expectFail(validatePlan(J({ plan: [{ action: 'doc.save' }] }), opts()))[0]
    expect(issue).toMatchObject({ code: 'E_CAPABILITY', stage: 10 })
    expect(issue.hint).toContain('exposed nahi')
  })
  it('a feature flip in the MANIFEST re-gates actions with zero validator edits', () => {
    const future = JSON.parse(currentEngineJson()) as { features: Record<string, boolean> }
    future.features.classicTween = false
    const reg = buildCapabilityRegistry(parseEngineManifest(JSON.stringify(future)), {})
    const r = validatePlan(J({ plan: [{ action: 'tween.classic.set', params: { layer: 2, start: 1, end: 5, ease: 0 } }] }), opts({ registry: reg }))
    expect(expectFail(r)[0]).toMatchObject({ code: 'E_CAPABILITY', stage: 10 })
  })
  it('a NEW engine shape validates with zero validator edits (dynamic discovery)', () => {
    const future = JSON.parse(currentEngineJson()) as { shapes: string[] }
    future.shapes = ['rect', 'oval', 'polystar']
    const reg = buildCapabilityRegistry(parseEngineManifest(JSON.stringify(future)), {})
    const good = validatePlan(J({
      plan: [{ action: 'shape.create', params: { shape: 'polystar', x: 1, y: 1, w: 10, h: 10, fill: '#ff0000' } }],
    }), opts({ registry: reg }))
    expectOk(good)
    // …while the CURRENT registry honestly rejects it at stage 5 (enum).
    expect(expectFail(validatePlan(J({
      plan: [{ action: 'shape.create', params: { shape: 'polystar', x: 1, y: 1, w: 10, h: 10, fill: '#ff0000' } }],
    }), opts()))[0]).toMatchObject({ code: 'E_RANGE', stage: 5, param: 'shape' })
  })
})

describe('stage 11 · budgets (prompt can never raise these)', () => {
  it('action count cap (64) — 65th action fails the whole plan', () => {
    const actions = Array.from({ length: 65 }, () => ({ action: 'layer.create', params: {} }))
    const issue = expectFail(validatePlan(J({ plan: actions }), opts()))[0]
    expect(issue).toMatchObject({ code: 'E_BUDGET', stage: 11, limit: 64, actual: 65 })
    const atCap = Array.from({ length: 64 }, () => ({ action: 'layer.create', params: {} }))
    expectOk(validatePlan(J({ plan: atCap }), opts()))
  })
  it('estimated-mutation cap (256) catches duplicate storms', () => {
    const r = validatePlan(J({
      plan: [{ action: 'node.duplicate', params: { nodes: Array(9).fill(100) as number[], copies: 32 } }],
    }), opts())
    const issue = expectFail(r)[0]
    expect(issue).toMatchObject({ code: 'E_BUDGET', stage: 11, limit: 256, actual: 288 })
  })
  it('budget counters are reported on success', () => {
    const plan = expectOk(validatePlan(bouncingBallJson(), opts()))
    expect(plan.budget.actions).toBe(5)
    expect(plan.budget.estimatedMutations).toBeLessThanOrEqual(AI_BUDGETS.maxMutatedObjects)
  })
})

describe('stage 12 · dry-run compile output rows', () => {
  it('humanText is present and specific for every action', () => {
    const plan = expectOk(validatePlan(bouncingBallJson(), opts()))
    for (const a of plan.actions) expect(a.humanText.length).toBeGreaterThan(0)
    expect(plan.actions[1]?.humanText).toBe('oval at (930,100) 60×60 fill #e11d48')
  })
  it('registry rows without a bespoke string get a readable generic row', () => {
    const plan = expectOk(validatePlan(J({
      plan: [{ action: 'symbol.place', params: { symbol: 51, x: 10, y: 10 } }],
    }), opts()))
    expect(plan.actions[0]?.humanText).toContain('symbol.place')
    expect(plan.actions[0]?.humanText).toContain('symbol=51')
  })
  it('probeCache failure degrades to E_UNKNOWN, never a crash', () => {
    const sabotaged = { layerCount: () => { throw new Error('probe boom') } } as unknown as DocStateProbe
    const r = validatePlan(J({
      plan: [{ action: 'shape.create', params: { shape: 'rect', x: 1, y: 1, w: 10, h: 10, fill: '#ff0000', layer: 2 } }],
    }), opts({ probeCache: sabotaged }))
    const issue = expectFail(r)[0]
    expect(issue).toMatchObject({ code: 'E_UNKNOWN', stage: 0 })
    expect(issue.message).toContain('probe boom')
  })
})

describe('probeFromSnapshot — effective visibility/lock walks ancestors', () => {
  it('effective flags and subtree math match the fixture layout', () => {
    const view: SceneSnapshotView = buildSnapshotView(fixtureJson())
    const probe = probeFromSnapshot(view)
    expect(probe.layerCount()).toBe(10)
    expect(probe.layerEffectiveUnlocked(0)).toBe(false) // road locked
    expect(probe.layerEffectiveVisible(1)).toBe(false) // ghost hidden
    expect(probe.layerEffectiveVisible(5)).toBe(false) // via 14
    expect(probe.layerEffectiveUnlocked(7)).toBe(false) // via 16
    expect(probe.layerEffectiveVisible(4)).toBe(false) // folder itself hidden
    expect(probe.layerKind(3)).toBe('folder')
    expect(probe.layerDescendantsCount(3)).toBe(2) // 14 → 15
    expect(probe.layerDescendantsCount(6)).toBe(1)
    expect(probe.contentKeyframeExists(2, 1)).toBe(true)
    expect(probe.contentKeyframeExists(2, 20)).toBe(false) // blank keyframe
    expect(probe.nodeLayers(100)).toEqual([2])
    expect(probe.nodesInLayer(2)).toBe(2)
    expect(probe.symbolExists(51)).toBe(true)
    expect(probe.timelineDuration()).toBe(40)
  })
})


describe('AI-REQ-023 — frame reuse & minimal mutation stay REPRESENTABLE', () => {
  it('the vocabulary carries reuse/duplicate families (not recreate-everything)', () => {
    const reg = makeRegistry()
    // Reuse without recreation: duplicate existing content, place existing symbols.
    for (const a of ['keyframe.duplicate', 'frames.duplicate', 'node.duplicate', 'layer.duplicate', 'symbol.place']) {
      expect(reg.get(a)?.state).toBe('supported') // if this fails, reuse regressed
    }
    // Minimal mutation families exist beside them.
    for (const a of ['node.transform', 'node.setStyle', 'keyframe.move', 'layer.rename']) {
      expect(reg.get(a)?.state).toBe('supported')
    }
  })
  it('a position-only edit validates as PARTIAL params — unchanged channels absent', () => {
    const plan = expectOk(validatePlan(J({
      plan: [{ action: 'node.transform', params: { node: 100, y: 400 } }],
    }), opts()))
    const p = plan.actions[0]?.params ?? {}
    expect(p.y).toBe(400)
    // No x/scale/rotation keys at all → the engine patch preserves current values.
    for (const k of ['x', 'scaleX', 'scaleY', 'rotation', 'relative', 'reset']) {
      expect(Object.prototype.hasOwnProperty.call(p, k)).toBe(false)
    }
  })
  it('keyframe reuse duplicates EXISTING content instead of demanding recreation params', () => {
    const plan = expectOk(validatePlan(J({
      plan: [{ action: 'keyframe.duplicate', params: { layer: 2, from: 1, to: 7 } }],
    }), opts()))
    // Just coordinates — no shape/style payload means "copy what is already there".
    expect(plan.actions[0]?.params).toEqual({ layer: 2, from: 1, to: 7 })
  })
})

describe('budgets are constants — no escalation through prompt or caller content', () => {
  it('AI_BUDGETS is frozen and ignores would-be overrides', () => {
    expect(Object.isFrozen(AI_BUDGETS)).toBe(true)
    const hostile = opts() as ValidationOptions & { budgets?: unknown }
    hostile.budgets = { maxActions: 1e9, maxMutatedObjects: 1e9 }
    const actions = Array.from({ length: 65 }, () => ({ action: 'layer.create', params: {} }))
    expect(expectFail(validatePlan(J({ plan: actions }), hostile))[0])
      .toMatchObject({ code: 'E_BUDGET', limit: AI_BUDGETS.maxActions })
    expect(AI_BUDGETS.maxInFlightRequests).toBe(1) // one in-flight plan — enforced by A6 orchestrator
  })
})

describe('purity — no path from model input to document mutation', () => {
  it('the snapshot view arrives deep-frozen and leaves untouched', () => {
    const view = buildSnapshotView(fixtureJson())
    expect(Object.isFrozen(view.raw)).toBe(true)
    expect(Object.isFrozen(view.raw.layers)).toBe(true)
    expect(Object.isFrozen(view.raw.nodes)).toBe(true)
    const before = fixtureJson()
    const o = opts({ snapshot: view })
    // A maximal, noisy, valid plan + a hostile invalid one.
    expectOk(validatePlan(bouncingBallJson(), o))
    expectOk(validatePlan(J({ plan: [{ action: 'node.delete', params: { nodes: [100, 101, 105] } }] }), o)) // flagged, not blocked
    expect(JSON.parse(JSON.stringify(view.raw))).toStrictEqual(JSON.parse(JSON.stringify(parseSceneSnapshot(before))))
  })
  it('validated params contain only JSON-safe plain data (round-trip strict)', () => {
    const plan = expectOk(validatePlan(bouncingBallJson(), opts()))
    for (const a of plan.actions) {
      expect(JSON.parse(JSON.stringify(a.params))).toStrictEqual(a.params)
    }
  })
  it('concrete targets always point at real snapshot entities', () => {
    const plan = expectOk(validatePlan(J({
      plan: [
        { action: 'selection.set', params: { nodes: [100, 'n2'] } },
        { action: 'layer.rename', params: { layer: 'ani', name: 'x' } },
        { action: 'symbol.rename', params: { symbol: 's1', name: 'y' } },
      ],
    }), opts()))
    const [sel, ren, sym] = plan.actions
    for (const t of sel?.targets ?? []) {
      expect(t.kind).toBe('node-id')
      if (t.kind === 'node-id') expect(NODE_IDS).toContain(t.id)
    }
    expect(ren?.targets).toEqual([{ kind: 'layer-index', index: 2 }])
    expect(sym?.targets).toEqual([{ kind: 'symbol-id', id: 50 }])
    if (sym?.targets[0]?.kind === 'symbol-id') expect(SYMBOL_IDS).toContain(sym.targets[0].id)
  })
  it('error codes stay within the stable taxonomy', () => {
    const known: readonly AiErrorCode[] = [
      'E_PARSE', 'E_SCHEMA', 'E_RANGE', 'E_REF', 'E_STATE', 'E_GUARD',
      'E_TIER', 'E_CAPABILITY', 'E_BUDGET', 'E_COMPILE', 'E_UNKNOWN',
    ]
    const hostile = [
      '', '{{{', '[]', J({ plan: null }), J({ plan: [{}] }),
      J({ plan: [{ action: 'nope' }] }),
      J({ plan: [{ action: 'layer.create', params: { bogus: 1 } }] }),
      J({ plan: [{ action: 'node.transform', params: { node: 999 } }] }),
      J({ plan: [{ action: 'shape.create', params: { shape: 'rect', x: 1, y: 1, w: 10, h: 10, fill: '#ff0000', layer: 0 } }] }),
      J({ plan: [{ action: 'doc.save' }] }),
    ]
    for (const h of hostile) {
      const r = validatePlan(h, opts())
      expect(r.ok).toBe(false)
      if (!r.ok) for (const i of r.issues) expect(known).toContain(i.code)
    }
  })
})
