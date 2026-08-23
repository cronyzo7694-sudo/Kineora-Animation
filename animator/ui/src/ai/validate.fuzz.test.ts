import { describe, expect, it } from 'vitest'
import { buildCapabilityRegistry, parseEngineManifest, type CapabilityRegistry } from './capabilities'
import { buildSnapshotView, parseSceneSnapshot, type SceneSnapshotView } from './snapshot'
import {
  AI_BUDGETS,
  validatePlan,
  type AiErrorCode,
  type ValidationOptions,
  type ValidationResult,
} from './validate'

// ---------------------------------------------------------------------------
// A4 adversarial fuzz — model output is UNTRUSTED INPUT. Invariants:
//   1. validatePlan NEVER throws, no matter how hostile the input.
//   2. Every failure uses a stable E_* code, a real stage, and a UI-safe message.
//   3. Any ok:true plan references only supported actions and real snapshot
//      entities (or symbolic plan-local refs) — model text can never reach
//      arbitrary document state.
//   4. The snapshot is byte-identical afterwards (the validator owns no writes).
// ---------------------------------------------------------------------------

const ERROR_CODES: readonly AiErrorCode[] = [
  'E_PARSE', 'E_SCHEMA', 'E_RANGE', 'E_REF', 'E_STATE', 'E_GUARD',
  'E_TIER', 'E_CAPABILITY', 'E_BUDGET', 'E_COMPILE', 'E_UNKNOWN',
]

const KNOWN_ACTIONS = [
  'shape.create', 'node.transform', 'node.setStyle', 'node.setOpacity', 'node.delete',
  'node.duplicate', 'node.arrange', 'node.align', 'layer.create', 'folder.create',
  'layer.rename', 'layer.delete', 'layer.setVisible', 'layer.setLocked', 'layer.reorder',
  'layer.setParent', 'keyframe.insert', 'keyframe.clear', 'keyframe.move', 'frames.insert',
  'tween.classic.set', 'tween.remove', 'tween.motion.set', 'symbol.place', 'symbol.rename',
  'doc.setSettings', 'doc.save', 'scene.inspect', 'selection.set', 'selection.clear',
  'playback.gotoFrame', 'path.draw', 'text.create', 'layer.mask',
]
const UNKNOWN_ACTIONS = ['object.spawn', 'doc.export', 'eval', '__proto__', '', 'LAYER.CREATE', ' layer.create']
const PARAM_NAMES = [
  'shape', 'x', 'y', 'w', 'h', 'fill', 'stroke', 'layer', 'node', 'nodes', 'frame',
  'from', 'to', 'start', 'end', 'ease', 'name', 'value', 'copies', 'alpha', 'symbol',
  'parent', 'level', 'op', '__proto__', 'constructor', 'gravity', '$evil',
]
const HOSTILE_SCALARS: unknown[] = [
  0, 1, -1, 2.5, 1e308, -1e308, 9007199254740993, 200_001,
  '', 'x', 'red', '#fff', '#FFFFFF', '#ff0000', 'n1', 'l2', 's1', '2', '99',
  '$x', '__proto__', 'a\u202Eb', '\u0007', 'गेंद', '💥', '椭圆', 'x'.repeat(500),
  'loop while true do end', '; DROP TABLE layers;--',
  null, true, false,
]
/** Reference-expression shapes the model is ALLOWED to emit (plus broken ones). */
const HOSTILE_REFS: unknown[] = [
  { ref: 'a1' }, { ref: '' }, { ref: 'zzz_unknown' }, { lastCreated: 'a1' },
  { selected: true }, { selected: 1 }, { ordinal: { index: 'first' } },
  { ordinal: { index: 'last' } }, { ordinal: { index: -2 } }, { ordinal: { index: 'middle' } },
  [], [100, 101], [100, 'n2', { ref: 'a1' }], ['n99'],
]

/** mulberry32 — deterministic so failures reproduce from the seed line. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function fixtureJson(): string {
  return JSON.stringify({
    v: 1,
    rev: 3,
    settings: { w: 1920, h: 1080, fps: 24, bg: '#ffffff', bgA: 1 },
    scene: { i: 0, name: 'Fuzz', count: 1 },
    active_layer: 1,
    playhead: 1,
    duration: 40,
    selection: [100],
    counts: { layers: 3, nodes: 5, keyframes: 3, tweens: 1, symbols: 2 },
    layers: [
      { i: 0, id: 10, name: 'locked', kind: 'normal', vis: true, lock: true, kf: [{ f: 1, n: 1 }], tw: [] },
      { i: 1, id: 11, name: 'main', kind: 'normal', vis: true, lock: false, kf: [{ f: 1, n: 2 }, { f: 5, n: 1 }], tw: [{ s: 1, e: 5, ease: 0 }] },
      { i: 2, id: 12, name: 'folder', kind: 'folder', vis: true, lock: false, kf: [], tw: [] },
    ],
    nodes: [
      { id: 100, kind: 'rect', kf: [[1, 1]], x: 0, y: 0, w: 10, h: 10, fill: '#ff0000' },
      { id: 101, kind: 'oval', kf: [[1, 1]], x: 0, y: 0, w: 10, h: 10, fill: '#00ff00' },
      { id: 102, kind: 'rect', kf: [[0, 1]], x: 0, y: 0, w: 10, h: 10, fill: '#0000ff' },
      { id: 103, kind: 'rect', kf: [[1, 1]], x: 0, y: 0, w: 10, h: 10, fill: '#123456' },
      { id: 104, kind: 'rect', kf: [[1, 5]], x: 0, y: 0, w: 10, h: 10, fill: '#654321' },
    ],
    library: [
      { id: 50, name: 'Star', type: 'graphic', uses: 1, dur: 12 },
      { id: 51, name: 'Gem', type: 'graphic', uses: 0, dur: 12 },
    ],
  })
}

const VALID_NODE_IDS = [100, 101, 102, 103, 104]
const VALID_SYMBOL_IDS = [50, 51]

interface Ctx {
  view: SceneSnapshotView
  registry: CapabilityRegistry
  snapText: string
}

function makeCtx(): Ctx {
  const snapText = fixtureJson()
  const registry = buildCapabilityRegistry(parseEngineManifest(JSON.stringify({
    v: 1,
    engine: 'kineora-core',
    manifestFormat: 'kineora-ai-manifest',
    shapes: ['rect', 'oval'],
    nodeFamilies: ['shape', 'symbol'],
    features: {
      classicTween: true, perKeyTransform: true, symbols: true, folders: true,
      instanceLoopModes: true, scenes: true, frameLabels: true, arrangeAlign: true,
      strokeAtDraw: true, selectionByIds: true, compositeUndo: true,
      nodeOpacity: false, namedEasings: false, paths: false, text: false,
      motionTween: false, shapeTween: false, masks: false, camera: false, audio: false,
    },
  })), {})
  return { view: buildSnapshotView(snapText), registry, snapText }
}

function pick<T>(rng: () => number, pool: readonly T[]): T {
  return pool[Math.floor(rng() * pool.length)] as T
}

function hostileValue(rng: () => number, depth: number): unknown {
  const roll = rng()
  if (depth > 2) return pick(rng, HOSTILE_SCALARS)
  if (roll < 0.55) return pick(rng, HOSTILE_SCALARS)
  if (roll < 0.8) return pick(rng, HOSTILE_REFS)
  if (roll < 0.9) {
    const arr: unknown[] = []
    const n = Math.floor(rng() * 4)
    for (let i = 0; i < n; i++) arr.push(hostileValue(rng, depth + 1))
    return arr
  }
  const obj: Record<string, unknown> = {}
  const n = Math.floor(rng() * 3)
  for (let i = 0; i < n; i++) obj[pick(rng, PARAM_NAMES)] = hostileValue(rng, depth + 1)
  return obj
}

/** Curated VALID actions — folded into the stream so ok:true plans get exercised. */
function validAction(rng: () => number): Record<string, unknown> {
  const which = Math.floor(rng() * 6)
  switch (which) {
    case 0: return { action: 'layer.create', params: { name: 'fuzz' } }
    case 1: return { action: 'selection.clear' }
    case 2: return { action: 'scene.inspect', params: { level: pick(rng, ['status', 'summary', 'detail'] as const) } }
    case 3: return { action: 'node.transform', params: { node: pick(rng, [100, 101, 103, 104] as const), x: Math.floor(rng() * 500) } }
    case 4: return { action: 'keyframe.insert', params: { frame: 2 + Math.floor(rng() * 39) } }
    default:
      return {
        action: 'shape.create',
        params: {
          shape: pick(rng, ['rect', 'oval'] as const),
          x: Math.floor(rng() * 500), y: Math.floor(rng() * 300),
          w: 10, h: 10, fill: '#00ff00',
        },
      }
  }
}

function hostileAction(rng: () => number): Record<string, unknown> {
  if (rng() < 0.12) return validAction(rng)
  const a: Record<string, unknown> = {}
  if (rng() < 0.8) {
    a.action = rng() < 0.75 ? pick(rng, KNOWN_ACTIONS) : pick(rng, UNKNOWN_ACTIONS)
  }
  if (rng() < 0.5) {
    a.id = rng() < 0.8 ? `a${1 + Math.floor(rng() * 6)}` : pick(rng, ['1bad', '', 'a b', 'x'.repeat(40)])
  }
  if (rng() < 0.9) {
    const params: Record<string, unknown> = {}
    const n = Math.floor(rng() * 5)
    for (let i = 0; i < n; i++) params[pick(rng, PARAM_NAMES)] = hostileValue(rng, 0)
    a.params = params
  }
  return a
}

/** One hostile input per roll: raw garbage string, or a plan-shaped JSON doc. */
function hostileInput(rng: () => number): string {
  if (rng() < 0.2) {
    // Not-necessarily-JSON byte soup (still valid UTF-16 text).
    let s = ''
    const n = Math.floor(rng() * 40)
    for (let i = 0; i < n; i++) s += pick(rng, ['{', '}', '[', ']', ',', ':', '"', '\\', 'plan', '1', 'e', ' ', '़', '�'])
    return s
  }
  if (rng() < 0.1) {
    const plan: unknown[] = []
    const n = 1 + Math.floor(rng() * 3)
    for (let i = 0; i < n; i++) plan.push(validAction(rng))
    return JSON.stringify({ plan, report: 'fuzz-valid' })
  }
  const doc: Record<string, unknown> = {}
  if (rng() < 0.9) {
    const plan: unknown[] = []
    const n = 1 + Math.floor(rng() * 8)
    for (let i = 0; i < n; i++) {
      plan.push(rng() < 0.85 ? hostileAction(rng) : hostileValue(rng, 0))
    }
    doc.plan = plan
  }
  if (rng() < 0.3) doc.expected = rng() < 0.5 ? 'done' : ['a', 1]
  if (rng() < 0.3) doc.report = pick(rng, ['ok', '', 42, null])
  return JSON.stringify(doc)
}

function checkFailure(r: ValidationResult): void {
  expect(r.ok).toBe(false)
  if (r.ok) return
  expect(r.issues.length).toBeGreaterThan(0)
  for (const issue of r.issues) {
    expect(ERROR_CODES).toContain(issue.code)
    expect(Number.isInteger(issue.stage)).toBe(true)
    expect(issue.stage).toBeGreaterThanOrEqual(0)
    expect(issue.stage).toBeLessThanOrEqual(12)
    expect(typeof issue.message).toBe('string')
    expect(issue.message.length).toBeGreaterThan(0)
  }
}

function checkSuccess(r: ValidationResult, ctx: Ctx): void {
  expect(r.ok).toBe(true)
  if (!r.ok) return
  const plan = r.plan
  expect(plan.actions.length).toBeLessThanOrEqual(AI_BUDGETS.maxActions)
  expect(plan.budget.estimatedMutations).toBeLessThanOrEqual(AI_BUDGETS.maxMutatedObjects)
  const ownIds = new Set(plan.actions.map((a) => a.id).filter((x): x is string => typeof x === 'string'))
  for (const a of plan.actions) {
    // Only actions the registry currently marks supported may survive.
    const cap = ctx.registry.get(a.action)
    expect(cap, `fuzz ok-plan used unknown action ${a.action}`).toBeDefined()
    expect(cap?.state).toBe('supported')
    // Params must round-trip through JSON EXACTLY (plain data only).
    expect(JSON.parse(JSON.stringify(a.params))).toStrictEqual(a.params)
    expect(a.humanText.length).toBeGreaterThan(0)
    for (const t of a.targets) {
      switch (t.kind) {
        case 'node-id':
          expect(VALID_NODE_IDS).toContain(t.id)
          break
        case 'layer-index':
          expect(t.index).toBeGreaterThanOrEqual(0)
          expect(t.index).toBeLessThanOrEqual(2)
          break
        case 'symbol-id':
          expect(VALID_SYMBOL_IDS).toContain(t.id)
          break
        default:
          // Symbolic plan-local targets must point at the plan's own creators.
          expect(ownIds.has(t.ofActionId)).toBe(true)
      }
    }
  }
}

describe('adversarial fuzz — hostile model output (seeded, deterministic)', () => {
  it('never throws, always speaks the E_* taxonomy, never invents entities', () => {
    const ctx = makeCtx()
    const rng = mulberry32(0xa4)
    let okCount = 0
    let failCount = 0
    for (let i = 0; i < 600; i++) {
      const input = hostileInput(rng)
      const r: ValidationResult = validatePlan(input, opts(ctx))
      if (r.ok) {
        okCount += 1
        checkSuccess(r, ctx)
      } else {
        failCount += 1
        checkFailure(r)
      }
    }
    // The generator MUST exercise both paths (otherwise the test proves little).
    expect(failCount).toBeGreaterThan(400)
    expect(okCount).toBeGreaterThan(5)
    // Snapshot untouched by 600 hostile validations (deep-equal; the parsed
    // form renames wire keys like active_layer → activeLayer, so compare
    // structurally, not by wire bytes).
    expect(JSON.parse(JSON.stringify(ctx.view.raw))).toStrictEqual(JSON.parse(JSON.stringify(parseSceneSnapshot(ctx.snapText))))
  })

  it('is deterministic: same seed → same verdicts', () => {
    const ctx = makeCtx()
    const verdicts = (seed: number) => {
      const rng = mulberry32(seed)
      const out: string[] = []
      for (let i = 0; i < 120; i++) {
        const r = validatePlan(hostileInput(rng), opts(ctx))
        out.push(r.ok ? 'ok' : r.issues.map((x) => `${x.code}@${x.stage}`).join('|'))
      }
      return out
    }
    expect(verdicts(7)).toEqual(verdicts(7))
    expect(verdicts(7)).not.toEqual(verdicts(8)) // different seeds really differ
  })

  it('hand-picked nightmare inputs each fail closed', () => {
    const ctx = makeCtx()
    const nightmares: string[] = [
      '\uFEFF{"plan":[]}', // BOM-prefixed JSON
      '{"plan":[{"action":"layer.create","params":{"name":{"$nested":true}}}]}',
      '{"plan":[{"action":"selection.set","params":{"nodes":{"ref":{"deep":{"deeper":1}}}}}]}',
      '{"plan":[{"action":"node.transform","params":{"node":"constructor","x":1}}]}',
      '{"plan":[{"action":"symbol.rename","params":{"symbol":"__proto__","name":"x"}}]}',
      '{"plan":[{"action":"layer.create","params":{"name":"' + '\u0007'.repeat(3) + '"}}]}',
      '{"plan":[{"action":"frames.insert","params":{"layer":1,"start":-5,"end":4}}]}',
      '{"plan":[{"action":"tween.classic.set","params":{"layer":1,"start":1,"end":5,"ease":101}}]}',
      '{"plan":[{"action":"node.delete","params":{"nodes":' + JSON.stringify(Array(999).fill(100)) + '}}]}',
      '{"plan":' + '['.repeat(50) + ']'.repeat(50) + '}',
    ]
    for (const n of nightmares) {
      const r = validatePlan(n, opts(ctx))
      checkFailure(r)
    }
  })

  it('random VALID well-formed plans still pass (generator sanity)', () => {
    const ctx = makeCtx()
    const rng = mulberry32(0xbeef)
    let passed = 0
    for (let i = 0; i < 120; i++) {
      const x = Math.floor(rng() * 400)
      const y = Math.floor(rng() * 400)
      const woid = `fz${i}`
      const plan = {
        plan: [
          { id: woid, action: 'shape.create', params: { shape: pick(rng, ['rect', 'oval']), x, y, w: 10, h: 10, fill: '#ff0000' } },
          { action: 'node.transform', params: { node: { ref: woid }, x: x + 5 } },
        ],
      }
      const r = validatePlan(JSON.stringify(plan), opts(ctx))
      if (r.ok) {
        passed += 1
        checkSuccess(r, ctx)
      } else {
        checkFailure(r) // failures are allowed ONLY via the taxonomy
      }
    }
    expect(passed).toBe(120)
  })
})

function opts(ctx: Ctx): ValidationOptions {
  return { registry: ctx.registry, snapshot: ctx.view }
}
