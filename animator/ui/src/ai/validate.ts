// ===========================================================================
// AI VALIDATE — the 12-stage fail-closed pipeline (A4 / D-0010 / spec 05 +
// AI-REQ-030/031). Raw model output is UNTRUSTED INPUT.
//
// Architecture contracts honored here:
//   • NO second capability list: every action/param check is derived from the
//     A3 CapabilityRegistry rows (generated from the engine manifest). New
//     engine capabilities with known action families validate WITHOUT edits.
//     Unknown action names fail at stage 3; known-but-unavailable at stage 10.
//   • References resolve deterministically (spec 15) — the model emits
//     reference EXPRESSIONS, never invented ids; numeric ids must already
//     exist in the current snapshot; ambiguity fails with candidates.
//   • Everything is data-in/data-out: this module cannot mutate a document.
//     Apply-time re-validation (A5 runner) is the second fence (AI-REQ-030).
// ===========================================================================

import type { CapabilityAction, CapabilityRegistry, ParamSpec } from './capabilities'
import type { SceneSnapshotView, SnapLayerRow, SnapSymbolRow } from './snapshot'

// ---------------------------------------------------------------------------
// Error taxonomy (stable codes — spec 05/16; consumed by A6 error cards)
// ---------------------------------------------------------------------------

export type AiErrorCode =
  | 'E_PARSE'
  | 'E_SCHEMA'
  | 'E_RANGE'
  | 'E_REF'
  | 'E_STATE'
  | 'E_GUARD'
  | 'E_TIER'
  | 'E_CAPABILITY'
  | 'E_BUDGET'
  | 'E_COMPILE'
  | 'E_UNKNOWN'

export interface ValidationIssue {
  code: AiErrorCode
  /** 1-based pipeline stage (1=parse … 12=dry-run compile). */
  stage: number
  /** Human-facing sentence (Hinglish ok) — safe for direct UI display. */
  message: string
  actionIndex?: number
  actionId?: string
  param?: string
  hint?: string
  /** Reference ambiguity candidates (E_REF). */
  candidates?: Array<{ ref: string; label: string }>
  /** Budget violations: the cap and what was attempted. */
  limit?: number
  actual?: number
}

export type ValidationResult =
  | { ok: true; plan: ValidatedPlan }
  | { ok: false; issues: ValidationIssue[] }

// ---------------------------------------------------------------------------
// Budgets (AI-REQ-070 — prompt content can never raise these)
// ---------------------------------------------------------------------------

export const AI_BUDGETS = Object.freeze({
  maxPlanJsonBytes: 256 * 1024,
  maxActions: 64,
  maxMutatedObjects: 256,
  maxSelectionSize: 1000,
  maxNameLen: 120,
  maxFrame: 200_000,
  maxCopies: 32,
  /** Mass-destructive heuristic (spec 10/12): beyond EITHER threshold the plan
   *  is flagged massDestructive → typed confirmation in the UI (any mode). */
  massDestructiveNodes: 20,
  massDestructiveFraction: 0.5,
  /** Enforced by the orchestrator (A6) — one in-flight request per document. */
  maxInFlightRequests: 1,
})

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export interface AiVariable {
  type: 'number' | 'color' | 'string' | 'boolean'
  value: number | string | boolean
}

export interface ValidationOptions {
  registry: CapabilityRegistry
  snapshot: SceneSnapshotView
  variables?: Record<string, AiVariable>
  /** 'ask' blocks every mutating action at stage 9 (E_TIER). Default preview. */
  mode?: 'ask' | 'preview' | 'apply'
  /** Optional pre-built stage-8 probe (A5 runner reuse across revalidation). */
  probeCache?: DocStateProbe
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

/** A resolved target — symbolic for plan-created things, concrete otherwise. */
export type ResolvedTarget =
  | { kind: 'node-id'; id: number }
  | { kind: 'node-new'; ofActionId: string }
  | { kind: 'layer-index'; index: number }
  | { kind: 'layer-new'; ofActionId: string }
  | { kind: 'symbol-id'; id: number }
  | { kind: 'symbol-new'; ofActionId: string }

export interface ValidatedAction {
  index: number
  id?: string
  action: string
  /** Fully validated params; refs replaced by plain values:
   *  numbers for concrete ids/indices, { ref: actionId } for plan-local. */
  params: Record<string, unknown>
  targets: ResolvedTarget[]
  /** Stage-12 dry-run row — exactly what the plan card/activity log shows. */
  humanText: string
  tier: 'A' | 'B'
}

export interface ValidatedPlan {
  actions: ValidatedAction[]
  expected: string[]
  report: string
  requiresConfirmation: boolean
  massDestructive: { nodes: number; totalSceneNodes: number } | null
  budget: { actions: number; estimatedMutations: number }
}

// ---------------------------------------------------------------------------
// Live-state probe (stage 8/9). A4 ships the snapshot-backed implementation;
// the A5 runner re-binds these against LIVE engine reads for apply-time
// re-validation — same interface, same rules (05: "document = authority").
// ---------------------------------------------------------------------------

export interface DocStateProbe {
  layerCount(): number
  layerKind(index: number): string | undefined
  /** Effective = own flag AND every ancestor (spec 15/04 guards). */
  layerEffectiveVisible(index: number): boolean
  layerEffectiveUnlocked(index: number): boolean
  contentKeyframeExists(layerIndex: number, frame: number): boolean
  nodeExists(id: number): boolean
  nodeLayers(id: number): number[] // layer indices the node appears on
  symbolExists(id: number): boolean
  nodesInLayer(layerIndex: number): number
  layerDescendantsCount(layerIndex: number): number
  timelineDuration(): number
}

export function probeFromSnapshot(view: SceneSnapshotView): DocStateProbe {
  const layers = view.raw.layers

  function parentIndexOf(row: SnapLayerRow): number | undefined {
    if (row.parent === undefined) return undefined
    return layers.find((l) => l.id === row.parent)?.i
  }
  function effective(index: number, field: 'vis' | 'lock'): boolean {
    let row = layers.find((l) => l.i === index)
    while (row) {
      if (field === 'vis' && !row.vis) return false
      if (field === 'lock' && row.lock) return false
      const parent = parentIndexOf(row)
      if (parent === undefined) break
      row = layers.find((l) => l.i === parent)
    }
    return true
  }
  function subtreeSize(index: number): number {
    // Direct children by parent-id chain (folders nest).
    const row = layers.find((l) => l.i === index)
    if (!row) return 0
    let count = 0
    const frontier: number[] = [row.id]
    const seen = new Set<number>(frontier)
    while (frontier.length > 0) {
      const parentId = frontier.pop() as number
      for (const l of layers) {
        if (l.parent === parentId && !seen.has(l.id)) {
          seen.add(l.id)
          frontier.push(l.id)
          count += 1
        }
      }
    }
    return count
  }

  return {
    layerCount: () => layers.length,
    layerKind: (i) => layers.find((l) => l.i === i)?.kind,
    layerEffectiveVisible: (i) => (layers.some((l) => l.i === i) ? effective(i, 'vis') : false),
    layerEffectiveUnlocked: (i) => (layers.some((l) => l.i === i) ? effective(i, 'lock') : false),
    contentKeyframeExists: (layerIndex, frame) =>
      layers
        .find((l) => l.i === layerIndex)
        ?.kf.some((k) => k.f === frame && k.blank !== true) ?? false,
    nodeExists: (id) => view.raw.nodes.some((n) => n.id === id),
    nodeLayers: (id) => [
      ...new Set(
        (view.raw.nodes.find((n) => n.id === id)?.kf ?? []).map(([li]) => li),
      ),
    ],
    symbolExists: (id) => view.raw.library.some((s) => s.id === id),
    nodesInLayer: (layerIndex) =>
      view.raw.nodes.filter((n) => n.kf.some(([li]) => li === layerIndex)).length,
    layerDescendantsCount: subtreeSize,
    timelineDuration: () => view.raw.duration,
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/
// Control/format characters are rejected; ordinary Unicode (Hindi names etc.)
// is fine — hostile input is governed, not mojibake.
const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F\u200E\u200F\u202A-\u202E]/u
const ACTION_ID = /^[a-zA-Z][a-zA-Z0-9_-]{0,31}$/
const VAR_REF = /^\$([a-z][a-zA-Z0-9_]{0,31})$/

class StageFailure extends Error {
  constructor(readonly issues: ValidationIssue[]) {
    super(issues[0]?.message ?? 'validation failed')
  }
}

// ---------------------------------------------------------------------------
// The pipeline
// ---------------------------------------------------------------------------

export function validatePlan(rawText: string, opts: ValidationOptions): ValidationResult {
  // NOTE: never-returning bail-outs are inner FUNCTION DECLARATIONS on purpose —
  // this toolchain (TS 5.9) only honors never-returning control-flow narrowing
  // for declarations, not arrow consts; arrows silently break guard narrowing.
  function fail(issue: ValidationIssue): never {
    throw new StageFailure([issue])
  }
  function failAll(list: ValidationIssue[]): never {
    throw new StageFailure(list)
  }

  try {
    // ---- Stage 1 · PARSE --------------------------------------------------
    if (typeof rawText !== 'string' || rawText.length === 0) {
      fail({ code: 'E_PARSE', stage: 1, message: 'AI ka jawab khaali hai.' })
    }
    if (rawText.length > AI_BUDGETS.maxPlanJsonBytes) {
      fail({
        code: 'E_PARSE', stage: 1,
        message: 'AI ka jawab bahut bada hai.',
        limit: AI_BUDGETS.maxPlanJsonBytes, actual: rawText.length,
      })
    }
    let raw: unknown
    try {
      raw = JSON.parse(rawText)
    } catch {
      fail({
        code: 'E_PARSE', stage: 1,
        message: 'AI ne valid JSON nahi diya.',
        hint: 'orchestrator ek baar schema-reminder ke saath retry karega',
      })
    }

    // ---- Stage 2 · SHAPE --------------------------------------------------
    if (!isRecord(raw)) {
      fail({ code: 'E_SCHEMA', stage: 2, message: 'Jawab {plan:[…]} object hona chahiye.' })
    }
    if (!Array.isArray(raw.plan)) {
      fail({ code: 'E_SCHEMA', stage: 2, message: '"plan" array missing hai.' })
    }
    if (raw.plan.length === 0) {
      fail({ code: 'E_SCHEMA', stage: 2, message: 'plan khaali hai — kuch karne ko nahi mila.' })
    }
    const expected: string[] = []
    if (typeof raw.expected === 'string') expected.push(raw.expected)
    else if (Array.isArray(raw.expected)) {
      for (const e of raw.expected) {
        if (typeof e !== 'string') {
          fail({ code: 'E_SCHEMA', stage: 2, message: 'expected[] me sirf strings chahiye.' })
        }
        expected.push(e)
      }
    }
    const report = typeof raw.report === 'string' && raw.report.trim().length > 0
      ? raw.report.trim().slice(0, 200)
      : 'AI plan'

    // Per-action structural pass (id format + duplicates) before deep stages.
    const rawActions = raw.plan as unknown[]
    const seenIds = new Set<string>()
    const structural: ValidationIssue[] = []
    rawActions.forEach((a, index) => {
      if (!isRecord(a)) {
        structural.push({ code: 'E_SCHEMA', stage: 2, actionIndex: index, message: `action #${index + 1} object nahi hai.` })
        return
      }
      if (a.id !== undefined) {
        if (typeof a.id !== 'string' || !ACTION_ID.test(a.id)) {
          structural.push({ code: 'E_SCHEMA', stage: 2, actionIndex: index, message: `action #${index + 1} ka id invalid hai.`, hint: 'lowercase letter se shuru, ≤32 chars' })
        } else if (seenIds.has(a.id)) {
          structural.push({ code: 'E_SCHEMA', stage: 2, actionIndex: index, actionId: a.id, message: `duplicate action id "${a.id}".` })
        } else {
          seenIds.add(a.id)
        }
      }
    })
    if (structural.length > 0) failAll(structural)

    // ---- Stage 3 · ACTION NAME (in the trusted registry — fail closed) ----
    const capabilities: CapabilityAction[] = []
    rawActions.forEach((a, index) => {
      const rec = a as Record<string, unknown>
      const name = typeof rec.action === 'string' ? rec.action : ''
      const cap = opts.registry.get(name)
      if (!cap) {
        fail({
          code: 'E_SCHEMA', stage: 3, actionIndex: index,
          message: `unknown action "${name}" — ye Kineora AI ke vocabulary me nahi hai.`,
          hint: 'sirf registry ke actions allowed hain (LLM capability manufacture nahi kar sakta)',
        })
      }
      capabilities.push(cap as CapabilityAction)
    })

    // ---- Stages 4+5 · PARAM STRUCTURE + VALUES (from registry schemas) ----
    interface ResolvedParamBag {
      params: Record<string, unknown>
      targets: ResolvedTarget[]
      humanText: string
    }
    const bags: ResolvedParamBag[] = []
    // actionId → what that action creates (plan-local refs for {ref}/lastCreated)
    const creators = new Map<string, 'node' | 'layer' | 'symbol'>()

    rawActions.forEach((a, index) => {
      const rec = a as Record<string, unknown>
      const cap = capabilities[index] as CapabilityAction
      const id = typeof rec.id === 'string' ? rec.id : undefined
      const rawParams = isRecord(rec.params) ? rec.params : {}
      const schema = cap.params
      const structuralIssues: ValidationIssue[] = []

      // Closed schema: unknown params rejected, missing required rejected.
      for (const key of Object.keys(rawParams)) {
        // Own-property ONLY — 'in' would leak Object.prototype members
        // ('toString', 'constructor', '__proto__') past the closed schema.
        if (!Object.prototype.hasOwnProperty.call(schema, key)) {
          structuralIssues.push({
            code: 'E_SCHEMA', stage: 4, actionIndex: index, actionId: id, param: key,
            message: `"${cap.action}" me param "${key}" maane nahi jaa sakta (closed schema).`,
          })
        }
      }
      for (const [key, spec] of Object.entries(schema)) {
        if (spec.required === true && rawParams[key] === undefined) {
          structuralIssues.push({
            code: 'E_SCHEMA', stage: 4, actionIndex: index, actionId: id, param: key,
            message: `"${cap.action}" ke liye "${key}" zaroori hai.`,
          })
        }
      }
      if (structuralIssues.length > 0) failAll(structuralIssues)

      const params: Record<string, unknown> = {}
      const targets: ResolvedTarget[] = []

      for (const [key, spec] of Object.entries(schema)) {
        let value = rawParams[key]
        if (value === undefined) continue

        // ---- Stage 6 hooks: $variable substitution (scalars only) --------
        // Variables can never fabricate targets (spec 13/05 stage 6).
        if (typeof value === 'string' && VAR_REF.test(value)) {
          const spec0 = spec as ParamSpec
          if (spec0.type === 'node-ref' || spec0.type === 'layer-ref' || spec0.type === 'symbol-ref') {
            fail({
              code: 'E_SCHEMA', stage: 6, actionIndex: index, actionId: id, param: key,
              message: `"${key}" par $variable allowed nahi — targets variable se nahi bante.`,
            })
          }
          const name = (VAR_REF.exec(value) as RegExpExecArray)[1]
          const variable = opts.variables?.[name]
          if (!variable) {
            fail({
              code: 'E_SCHEMA', stage: 6, actionIndex: index, actionId: id, param: key,
              message: `$${name} define nahi kiya gaya.`,
              hint: 'Variables drawer me define karo ya literal value do',
            })
          }
          value = (variable as AiVariable).value
          // Resolved values re-pass the full stage-5 checks below (no blind trust).
        }

        // Ref-bearing params resolve at stage 7; everything else checks NOW.
        const checked = checkScalarValue(value, spec as ParamSpec, key, index, id)
        if (checked !== null) structuralIssues.push(checked)
        else params[key] = normalizeScalar(value, spec as ParamSpec)
      }
      if (structuralIssues.length > 0) failAll(structuralIssues)

      // ---- Stage 7 · REFERENCES (deterministic; model never invents ids) --
      for (const [key, spec] of Object.entries(schema)) {
        const value = rawParams[key]
        if (value === undefined) continue
        const spec0 = spec as ParamSpec
        if (spec0.type !== 'node-ref' && spec0.type !== 'layer-ref' && spec0.type !== 'symbol-ref') continue
        const resolved = resolveRef(value, spec0.type, opts.snapshot, creators, cap.action, rawActions, index, id, key)
        params[key] = resolved.plain
        targets.push(...resolved.targets)
      }

      // humanText + per-action semantics happen in later stages; store bag.
      bags.push({ params, targets, humanText: '' })

      // Track creators for {ref}/{lastCreated}.
      if (id && (cap.action === 'shape.create' || cap.action === 'symbol.place')) creators.set(id, 'node')
      else if (id && (cap.action === 'layer.create' || cap.action === 'folder.create')) creators.set(id, 'layer')
      else if (id && cap.action === 'symbol.create') creators.set(id, 'symbol')
    })

    // ---- Stage 8 · DOCUMENT STATE (probe-driven, per-action predicates) ----
    const probe = opts.probeCache ?? probeFromSnapshot(opts.snapshot)
    rawActions.forEach((a, index) => {
      const cap = capabilities[index] as CapabilityAction
      const bag = bags[index] as ResolvedParamBag
      const issue = checkDocState(cap, bag.params, probe, opts.snapshot)
      if (issue) fail({ ...issue, stage: 8, actionIndex: index, actionId: (a as Record<string, unknown>).id as string | undefined })
    })

    // ---- Stage 9 · PERMISSIONS / GUARDS (+ tier policy) --------------------
    const mode = opts.mode ?? 'preview'
    rawActions.forEach((a, index) => {
      const cap = capabilities[index] as CapabilityAction
      const bag = bags[index] as ResolvedParamBag
      const id = (a as Record<string, unknown>).id as string | undefined

      if (mode === 'ask' && cap.action !== 'scene.inspect') {
        fail({
          code: 'E_TIER', stage: 9, actionIndex: index, actionId: id,
          message: 'ASK mode me document mutate nahi hota — Preview/Apply mode chuno.',
        })
      }
      const guardIssue = checkGuards(cap, bag.params, probe, opts.snapshot)
      if (guardIssue) fail({ ...guardIssue, stage: 9, actionIndex: index, actionId: id })
    })

    // ---- Stage 10 · CAPABILITY (known-but-unavailable fails here) ---------
    rawActions.forEach((a, index) => {
      const cap = capabilities[index] as CapabilityAction
      if (cap.state !== 'supported') {
        fail({
          code: 'E_CAPABILITY', stage: 10, actionIndex: index,
          actionId: (a as Record<string, unknown>).id as string | undefined,
          message: `"${cap.action}" is build me available nahi hai (${cap.state}).`,
          hint: cap.limitations?.join('; '),
        })
      }
    })

    // ---- Stage 11 · POLICY / BUDGETS ---------------------------------------
    if (rawActions.length > AI_BUDGETS.maxActions) {
      fail({
        code: 'E_BUDGET', stage: 11,
        message: `plan me ${rawActions.length} actions hain — cap ${AI_BUDGETS.maxActions}. Chhote hisso me todo.`,
        limit: AI_BUDGETS.maxActions, actual: rawActions.length,
      })
    }
    let estimatedMutations = 0
    let deleteNodeCount = 0
    rawActions.forEach((_a, index) => {
      const cap = capabilities[index] as CapabilityAction
      const bag = bags[index] as ResolvedParamBag
      const est = estimateMutations(cap, bag.params, probe)
      estimatedMutations += est.total
      deleteNodeCount += est.deletedNodes
    })
    if (estimatedMutations > AI_BUDGETS.maxMutatedObjects) {
      fail({
        code: 'E_BUDGET', stage: 11,
        message: `plan ~${estimatedMutations} objects mutate karega — cap ${AI_BUDGETS.maxMutatedObjects}.`,
        limit: AI_BUDGETS.maxMutatedObjects, actual: estimatedMutations,
      })
    }
    const totalSceneNodes = opts.snapshot.raw.counts.nodes
    const massDestructive =
      deleteNodeCount > AI_BUDGETS.massDestructiveNodes ||
      (totalSceneNodes > 0 && deleteNodeCount / totalSceneNodes > AI_BUDGETS.massDestructiveFraction)
        ? { nodes: deleteNodeCount, totalSceneNodes }
        : null

    // ---- Stage 12 · DRY-RUN COMPILE (internal consistency + human rows) ----
    const actionIds = new Set(creators.keys())
    rawActions.forEach((_a, index) => {
      const cap = capabilities[index] as CapabilityAction
      const bag = bags[index] as ResolvedParamBag
      for (const t of bag.targets) {
        if ((t.kind === 'node-new' || t.kind === 'layer-new' || t.kind === 'symbol-new') && !actionIds.has(t.ofActionId)) {
          fail({
            code: 'E_COMPILE', stage: 12, actionIndex: index,
            message: 'internal: unresolved plan-local reference survived to compile — plan reject.',
          })
        }
      }
      bag.humanText = humanize(cap, bag.params)
    })

    const validated: ValidatedAction[] = rawActions.map((a, index) => {
      const rec = a as Record<string, unknown>
      const cap = capabilities[index] as CapabilityAction
      const bag = bags[index] as ResolvedParamBag
      return {
        index,
        id: typeof rec.id === 'string' ? rec.id : undefined,
        action: cap.action,
        params: bag.params,
        targets: bag.targets,
        humanText: bag.humanText,
        tier: cap.tier,
      }
    })

    return {
      ok: true,
      plan: {
        actions: validated,
        expected,
        report,
        requiresConfirmation: validated.some((v) => v.tier === 'B'),
        massDestructive,
        budget: { actions: validated.length, estimatedMutations },
      },
    }
  } catch (e) {
    if (e instanceof StageFailure) return { ok: false, issues: e.issues }
    return {
      ok: false,
      issues: [
        {
          code: 'E_UNKNOWN', stage: 0,
          message: `validator internal error: ${e instanceof Error ? e.message.split('\n')[0] : String(e)}`,
        },
      ],
    }
  }
}

// ---------------------------------------------------------------------------
// Scalar checks (stage 5) — NO coercion. Wrong type = reject.
// ---------------------------------------------------------------------------

function checkScalarValue(
  value: unknown,
  spec: ParamSpec,
  param: string,
  actionIndex: number,
  actionId: string | undefined,
): ValidationIssue | null {
  const base = { actionIndex, actionId, param }
  switch (spec.type) {
    case 'number':
    case 'frame': {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        // A string like "100px" or "1+2" is NOT accepted (no coercion, no eval).
        return { ...base, code: 'E_RANGE', stage: 5, message: `"${param}" number chahiye; expressions/strings allowed nahi.` }
      }
      if (spec.type === 'frame' && !Number.isSafeInteger(value)) {
        return { ...base, code: 'E_RANGE', stage: 5, message: `"${param}" whole frame number hona chahiye (safe integer).` }
      }
      if (spec.type === 'frame' && (value < 1 || value > AI_BUDGETS.maxFrame)) {
        return { ...base, code: 'E_RANGE', stage: 5, message: `"${param}" 1..${AI_BUDGETS.maxFrame} ke beech hona chahiye.`, limit: AI_BUDGETS.maxFrame, actual: value }
      }
      if (spec.min !== undefined && value < spec.min) {
        return { ...base, code: 'E_RANGE', stage: 5, message: `"${param}" ≥ ${spec.min} hona chahiye (mila ${value}).` }
      }
      if (spec.max !== undefined && value > spec.max) {
        return { ...base, code: 'E_RANGE', stage: 5, message: `"${param}" ≤ ${spec.max} hona chahiye (mila ${value}).` }
      }
      return null
    }
    case 'color': {
      if (value === null) return null // stroke:null is a legal tri-state "no color"
      if (typeof value === 'string' && value === 'none') return null // stroke removal keyword
      if (typeof value !== 'string' || !HEX_COLOR.test(value)) {
        return { ...base, code: 'E_RANGE', stage: 5, message: `"${param}" #rrggbb color hona chahiye (naam/short-hex nahi).` }
      }
      return null
    }
    case 'string': {
      if (typeof value !== 'string') {
        return { ...base, code: 'E_RANGE', stage: 5, message: `"${param}" string chahiye.` }
      }
      if (value.length > AI_BUDGETS.maxNameLen) {
        return { ...base, code: 'E_RANGE', stage: 5, message: `"${param}" ${AI_BUDGETS.maxNameLen} chars se lamba nahi ho sakta.`, limit: AI_BUDGETS.maxNameLen, actual: value.length }
      }
      if (CONTROL_CHARS.test(value)) {
        return { ...base, code: 'E_RANGE', stage: 5, message: `"${param}" me control/invisible characters allowed nahi.` }
      }
      return null
    }
    case 'boolean':
      return typeof value === 'boolean'
        ? null
        : { ...base, code: 'E_RANGE', stage: 5, message: `"${param}" true/false hona chahiye.` }
    case 'enum':
      if (typeof value !== 'string' || !spec.options || !spec.options.includes(value)) {
        return {
          ...base, code: 'E_RANGE', stage: 5,
          message: `"${param}" inme se hona chahiye: ${(spec.options ?? []).join(' | ')}.`,
        }
      }
      return null
    case 'node-ref':
    case 'layer-ref':
    case 'symbol-ref':
      return null // stage 7
  }
}

function normalizeScalar(value: unknown, spec: ParamSpec): unknown {
  if (spec.type === 'color' && typeof value === 'string') return value.toLowerCase()
  return value
}

// ---------------------------------------------------------------------------
// Reference resolution (stage 7, spec 15)
// ---------------------------------------------------------------------------

interface ResolvedRef {
  /** Plain value stored back into params. */
  plain: unknown
  targets: ResolvedTarget[]
}

function resolveRef(
  value: unknown,
  type: 'node-ref' | 'layer-ref' | 'symbol-ref',
  view: SceneSnapshotView,
  creators: Map<string, 'node' | 'layer' | 'symbol'>,
  actionName: string,
  rawActions: unknown[],
  actionIndex: number,
  actionId: string | undefined,
  param: string,
): ResolvedRef {
  function failRef(message: string, extra?: Partial<ValidationIssue>): never {
    throw new StageFailure([
      { code: 'E_REF', stage: 7, actionIndex, actionId, param, message, ...extra },
    ])
  }
  const kindWanted = type === 'node-ref' ? 'node' : type === 'layer-ref' ? 'layer' : 'symbol'

  // Arrays of node-refs (node.delete nodes:[…]) — resolve each member.
  if (Array.isArray(value)) {
    if (type !== 'node-ref') {
      failRef(`"${param}" array form sirf node lists ke liye allowed hai.`)
    }
    if (value.length === 0) failRef(`"${param}" khaali list hai.`)
    if (value.length > AI_BUDGETS.maxSelectionSize) {
      failRef(`"${param}" me ${value.length} items — selection cap ${AI_BUDGETS.maxSelectionSize}.`, {
        limit: AI_BUDGETS.maxSelectionSize, actual: value.length,
      })
    }
    const plain: unknown[] = []
    const targets: ResolvedTarget[] = []
    value.forEach((v, i) => {
      const r = resolveRef(v, type, view, creators, actionName, rawActions, actionIndex, actionId, `${param}[${i}]`)
      plain.push(r.plain)
      targets.push(...r.targets)
    })
    return { plain, targets }
  }

  // Plan-local references — symbolic; compile (stage 12) guarantees the
  // creator action exists and PRECEDES this action.
  if (isRecord(value) && (typeof value.ref === 'string' || typeof value.lastCreated === 'string')) {
    const pointAt = (typeof value.ref === 'string' ? value.ref : value.lastCreated) as string
    const created = creators.get(pointAt)
    if (!created) {
      failRef(`{"ref":"${pointAt}"} kisi pehle-ke create action se match nahi hota.`, {
        hint: 'ref sirf pehle ke shape.create/symbol.place/layer.create/symbol.create ids point kar sakta hai',
      })
    }
    if (created !== kindWanted) {
      failRef(`{"ref":"${pointAt}"} ek ${created} banata hai, par "${param}" ko ${kindWanted} chahiye.`)
    }
    // Forward refs can't exist (creators map only has earlier actions), so a
    // ref here is by construction backward. Symbolic target:
    const target: ResolvedTarget =
      created === 'node'
        ? { kind: 'node-new', ofActionId: pointAt }
        : created === 'layer'
          ? { kind: 'layer-new', ofActionId: pointAt }
          : { kind: 'symbol-new', ofActionId: pointAt }
    return { plain: { ref: pointAt }, targets: [target] }
  }

  // Selection reference.
  if (isRecord(value) && value.selected === true) {
    if (type === 'node-ref') {
      const sel = view.raw.selection
      if (sel.length === 0) failRef(`"${param}": selection khaali hai — "selected object" resolve nahi hua.`)
      return {
        plain: sel.length === 1 ? sel[0] : [...sel],
        targets: sel.map((id) => ({ kind: 'node-id', id }) as ResolvedTarget),
      }
    }
    failRef(`"${param}" par {selected:true} sirf node refs ke liye hai.`)
  }

  // Ordinal reference (layers): {ordinal:{index:0-based|'first'|'last'}}.
  if (isRecord(value) && isRecord(value.ordinal)) {
    if (type !== 'layer-ref') failRef(`"${param}" par ordinal sirf layer refs ke liye hai.`)
    const layers = view.raw.layers
    const rawIdx = value.ordinal.index
    let idx: number | undefined
    if (rawIdx === 'first') idx = layers.length > 0 ? layers[0]?.i : undefined
    else if (rawIdx === 'last') idx = layers.length > 0 ? layers[layers.length - 1]?.i : undefined
    else if (typeof rawIdx === 'number' && Number.isInteger(rawIdx) && rawIdx >= 0) idx = rawIdx
    if (idx === undefined || !layers.some((l) => l.i === idx)) {
      failRef(`ordinal layer index ${String(rawIdx)} scene me nahi hai (0..${layers.length - 1}).`)
    }
    return { plain: idx, targets: [{ kind: 'layer-index', index: idx as number }] }
  }

  // Numeric: nodes = node id · layers = layer INDEX · symbols = symbol id.
  if (typeof value === 'number') {
    if (!Number.isInteger(value) || value < 0) {
      failRef(`"${param}" ka numeric reference invalid hai.`)
    }
    if (type === 'node-ref') {
      if (!view.raw.nodes.some((n) => n.id === value)) {
        failRef(`node id ${value} scene me exist nahi karta (invented ya stale id).`)
      }
      return { plain: value, targets: [{ kind: 'node-id', id: value }] }
    }
    if (type === 'layer-ref') {
      if (!view.raw.layers.some((l) => l.i === value)) {
        failRef(`layer index ${value} scene me nahi hai (0..${view.raw.layers.length - 1}).`)
      }
      return { plain: value, targets: [{ kind: 'layer-index', index: value }] }
    }
    if (!view.raw.library.some((s) => s.id === value)) {
      failRef(`symbol id ${value} library me exist nahi karta.`)
    }
    return { plain: value, targets: [{ kind: 'symbol-id', id: value }] }
  }

  // Alias ('n1'/'l1'/'s1' or bare '1') or unique NAME.
  if (typeof value === 'string') {
    const aliasMatch = /^([nls])(\d+)$/.exec(value)
    if (aliasMatch) {
      const aliasKind = aliasMatch[1]
      const wantedPrefix = kindWanted === 'node' ? 'n' : kindWanted === 'layer' ? 'l' : 's'
      if (aliasKind !== wantedPrefix) {
        failRef(`"${param}" ko ${wantedPrefix}-alias chahiye, "${value}" ${aliasKind}-alias hai.`)
      }
      const id = view.idOf(value)
      if (id === undefined) failRef(`alias "${value}" is snapshot ka nahi hai.`)
      if (type === 'layer-ref') {
        const row = view.raw.layers.find((l) => l.id === id)
        return { plain: row?.i, targets: [{ kind: 'layer-index', index: row?.i as number }] }
      }
      if (type === 'symbol-ref') return { plain: id, targets: [{ kind: 'symbol-id', id: id as number }] }
      return { plain: id, targets: [{ kind: 'node-id', id: id as number }] }
    }

    // Bare numeric string '1' → alias shorthand per kind.
    if (/^\d+$/.test(value)) {
      const prefix = type === 'node-ref' ? 'n' : type === 'layer-ref' ? 'l' : 's'
      return resolveRef(`${prefix}${value}`, type, view, creators, actionName, rawActions, actionIndex, actionId, param)
    }

    // Name lookup — layers & symbols have names; nodes DON'T (engine gap —
    // E-AI-7). Node names therefore can never resolve: honest failure.
    if (type === 'node-ref') {
      failRef(`nodes ke paas names nahi hote (engine gap) — alias/id/ref/selected use karo.`, {
        hint: 'AI-created nodes ke liye {"ref":"<actionId>"} best hai',
      })
    }
    const rows: ReadonlyArray<SnapLayerRow | SnapSymbolRow> =
      type === 'layer-ref' ? view.raw.layers : view.raw.library
    // Track each match with its alias position (layers & symbols alias by ROW
    // ORDER: l1 = first row) so ambiguity candidates stay deterministic.
    const matches: Array<{ row: SnapLayerRow | SnapSymbolRow; aliasIndex: number }> = []
    rows.forEach((row, aliasIndex) => {
      if (row.name === value) matches.push({ row, aliasIndex })
    })
    if (matches.length === 0) {
      failRef(`"${value}" naam ka koi ${kindWanted} nahi mila.`)
    }
    if (matches.length > 1) {
      failRef(`"${value}" ${matches.length} ${kindWanted}s ko match karta hai — kaunsa?`, {
        candidates: matches.map((m, i) => ({
          ref: `${kindWanted === 'layer' ? 'l' : 's'}${m.aliasIndex + 1}`,
          label: `#${i + 1} "${m.row.name}" (id ${m.row.id})`,
        })),
      })
    }
    const only = matches[0]?.row
    if (!only) failRef(`"${value}" resolve nahi hui.`)
    if (type === 'layer-ref' && 'i' in only) {
      return { plain: only.i, targets: [{ kind: 'layer-index', index: only.i }] }
    }
    return { plain: only.id, targets: [{ kind: 'symbol-id', id: only.id }] }
  }

  failRef(`"${param}" ka reference form samajh nahi aaya.`)
}

// ---------------------------------------------------------------------------
// Stage 8 — document state predicate rules (per action family). These are
// VALIDATION semantics, not capability truth — new engine capabilities that
// reuse existing families need no changes here.
// ---------------------------------------------------------------------------

function checkDocState(
  cap: CapabilityAction,
  params: Record<string, unknown>,
  probe: DocStateProbe,
  view: SceneSnapshotView,
): Omit<ValidationIssue, 'stage' | 'actionIndex' | 'actionId'> | null {
  const p = params
  const err = (code: AiErrorCode, message: string, extra?: Partial<ValidationIssue>) => ({ code, message, ...extra })

  switch (cap.action) {
    case 'shape.create': {
      if (typeof p.layer === 'number' && p.layer >= probe.layerCount()) {
        return err('E_STATE', `layer index ${p.layer} exist nahi karta.`)
      }
      return null
    }
    case 'keyframe.move':
    case 'keyframe.duplicate': {
      // Plan-local layer ({ref}) — content keyframes don't exist in the snapshot
      // YET; skip live probes (A5 runner revalidates against the live engine).
      if (p.layer !== undefined && typeof p.layer !== 'number') return null
      const layer = typeof p.layer === 'number' ? p.layer : view.raw.activeLayer
      if (typeof p.from === 'number' && !probe.contentKeyframeExists(layer, p.from)) {
        return err('E_STATE', `layer ${layer} par frame ${p.from} content keyframe nahi hai.`)
      }
      if (p.from === p.to) return err('E_STATE', 'from aur to same frame — yeh no-op hoga.')
      return null
    }
    case 'keyframe.clear': {
      if (p.layer !== undefined && typeof p.layer !== 'number') return null // plan-local layer
      const layer = typeof p.layer === 'number' ? p.layer : view.raw.activeLayer
      if (typeof p.frame === 'number' && !probe.contentKeyframeExists(layer, p.frame)) {
        return err('E_STATE', `layer ${layer} par frame ${p.frame} keyframe nahi hai — clear karne ko kuch nahi.`)
      }
      return null
    }
    case 'tween.classic.set': {
      if (p.layer !== undefined && typeof p.layer !== 'number') return null // plan-local layer
      const layer = typeof p.layer === 'number' ? p.layer : view.raw.activeLayer
      if (typeof p.start === 'number' && typeof p.end === 'number' && p.start >= p.end) {
        return err('E_STATE', `tween span galat: start ${p.start} end ${p.end} se pehle hona chahiye.`)
      }
      if (typeof p.start === 'number' && !probe.contentKeyframeExists(layer, p.start)) {
        return err('E_STATE', `tween start frame ${p.start} par content keyframe nahi hai.`)
      }
      if (typeof p.end === 'number' && !probe.contentKeyframeExists(layer, p.end)) {
        return err('E_STATE', `tween end frame ${p.end} par content keyframe nahi hai.`)
      }
      return null
    }
    case 'tween.remove': {
      if (p.layer !== undefined && typeof p.layer !== 'number') return null // plan-local layer
      const layer = typeof p.layer === 'number' ? p.layer : view.raw.activeLayer
      const row = view.raw.layers.find((l) => l.i === layer)
      if (typeof p.start === 'number' && !(row?.tw.some((t) => t.s === p.start) ?? false)) {
        return err('E_STATE', `layer ${layer} par frame ${p.start} se koi tween span nahi hai.`)
      }
      return null
    }
    case 'frames.insert':
    case 'frames.delete':
    case 'frames.remove':
    case 'frames.reverse':
    case 'frames.duplicate':
    case 'frames.convertToKeyframes':
    case 'frames.convertToBlankKeyframes': {
      if (p.layer !== undefined && typeof p.layer !== 'number') return null // plan-local layer
      const layer = typeof p.layer === 'number' ? p.layer : -1
      if (layer < 0 || layer >= probe.layerCount()) return err('E_STATE', `layer index ${p.layer} exist nahi karta.`)
      if (typeof p.start === 'number' && typeof p.end === 'number' && p.start > p.end) {
        return err('E_STATE', `frames range galat: start ${p.start} > end ${p.end}.`)
      }
      return null
    }
    case 'layer.reorder': {
      const to = typeof p.to === 'number' ? p.to : -1
      if (to < 0 || to >= probe.layerCount()) {
        return err('E_STATE', `reorder to=${p.to} — valid range 0..${probe.layerCount() - 1}.`)
      }
      return null
    }
    case 'layer.setParent': {
      if (p.parent === undefined) return null // unparent — always fine
      // Plan-local refs ({ref}) — cycle/folder checks need concrete indices;
      // the A5 runner revalidates after materialization.
      if ((p.layer !== undefined && typeof p.layer !== 'number') || typeof p.parent !== 'number') return null
      const childIdx = p.layer as number
      const parentIdx = p.parent as number
      if (childIdx === parentIdx) return err('E_STATE', 'layer apne hi andar nahi ja sakta.')
      if (probe.layerKind(parentIdx) !== 'folder') {
        return err('E_STATE', `parent target folder nahi hai.`)
      }
      // Cycle check: walking up from parent must never reach child.
      const layers = view.raw.layers
      const childRow = layers.find((l) => l.i === childIdx)
      let cursor = layers.find((l) => l.i === parentIdx)
      let hops = 0
      while (cursor && hops < 64) {
        if (childRow && cursor.id === childRow.id) {
          return err('E_STATE', 'parent cycle ban jayega — folder apne descendant ke andar nahi jaa sakta.')
        }
        cursor = layers.find((l) => l.id === cursor?.parent)
        hops += 1
      }
      return null
    }
    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// Stage 9 — guards. Mirrors the engine's B-5 guard family so violations fail
// EARLY with a clear reason (engine still enforces them at apply time).
// ---------------------------------------------------------------------------

function checkGuards(
  cap: CapabilityAction,
  params: Record<string, unknown>,
  probe: DocStateProbe,
  view: SceneSnapshotView,
): Omit<ValidationIssue, 'stage' | 'actionIndex' | 'actionId'> | null {
  const err = (message: string, param?: string) => ({ code: 'E_GUARD' as const, message, param })

  const layerEditable = (index: number): string | null => {
    if (probe.layerKind(index) === 'folder') return `layer ${index} folder hai — uspar content nahi banti`
    if (!probe.layerEffectiveVisible(index)) return `layer ${index} hidden hai (ya koi hidden ancestor folder)`
    if (!probe.layerEffectiveUnlocked(index)) return `layer ${index} locked hai (ya koi locked ancestor folder)`
    return null
  }

  // Plan-local layer refs ({ref}) are not probeable yet (A5 revalidates live);
  // undefined = "active layer" default — that IS probeable.
  const layerPlanLocal = params.layer !== undefined && typeof params.layer !== 'number'
  const layerParamIndex = (): number | undefined =>
    typeof params.layer === 'number' ? params.layer : view.raw.activeLayer

  switch (cap.action) {
    case 'shape.create':
    case 'symbol.place':
    case 'keyframe.insert':
    case 'keyframe.insertBlank':
    case 'keyframe.clear':
    case 'keyframe.move':
    case 'keyframe.duplicate':
    case 'frames.insert':
    case 'frames.delete':
    case 'frames.remove':
    case 'frames.reverse':
    case 'frames.duplicate':
    case 'frames.convertToKeyframes':
    case 'frames.convertToBlankKeyframes':
    case 'tween.classic.set':
    case 'tween.remove':
    case 'frames.setLabel': {
      if (layerPlanLocal) return null
      const idx = layerParamIndex()
      if (idx !== undefined) {
        const blocked = layerEditable(idx)
        if (blocked) return err(`${cap.action}: ${blocked}.`, 'layer')
      }
      return null
    }
    case 'node.transform':
    case 'node.setStyle':
    case 'node.setOpacity':
    case 'node.delete':
    case 'node.duplicate':
    case 'node.arrange':
    case 'node.align': {
      // Every concrete node target must live ONLY on editable layers.
      const nodeIds = collectConcreteNodeIds(cap, params)
      for (const id of nodeIds) {
        for (const layerIdx of probe.nodeLayers(id)) {
          const blocked = layerEditable(layerIdx)
          if (blocked) return err(`${cap.action} node ${id}: ${blocked}.`, 'node')
        }
      }
      return null
    }
    default:
      return null
  }
}

/** Concrete node ids — ONLY from node-ref-typed params (never from scalars
 *  like copies/x/y, which are numbers but not references). */
function collectConcreteNodeIds(cap: CapabilityAction, params: Record<string, unknown>): number[] {
  const out: number[] = []
  for (const [key, spec] of Object.entries(cap.params)) {
    if ((spec as ParamSpec).type !== 'node-ref') continue
    const value = params[key]
    if (typeof value === 'number') out.push(value)
    else if (Array.isArray(value)) {
      for (const v of value) if (typeof v === 'number') out.push(v)
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// Stage 11 — mutation estimates (+ mass-destructive accounting)
// ---------------------------------------------------------------------------

function estimateMutations(
  cap: CapabilityAction,
  params: Record<string, unknown>,
  probe: DocStateProbe,
): { total: number; deletedNodes: number } {
  switch (cap.action) {
    case 'node.delete': {
      const n = collectConcreteNodeIds(cap, params).length
      return { total: n, deletedNodes: n }
    }
    case 'node.duplicate': {
      const nodes = collectConcreteNodeIds(cap, params).length
      const copies = typeof params.copies === 'number' ? Math.min(params.copies, AI_BUDGETS.maxCopies) : 1
      return { total: nodes * copies, deletedNodes: 0 }
    }
    case 'layer.delete': {
      const idx = typeof params.layer === 'number' ? params.layer : -1
      if (idx < 0) return { total: 1, deletedNodes: 0 }
      const nodes = probe.nodesInLayer(idx)
      const descendants = probe.layerDescendantsCount(idx)
      return { total: 1 + nodes + descendants, deletedNodes: nodes }
    }
    case 'frames.delete':
    case 'frames.remove':
    case 'frames.reverse':
    case 'frames.convertToKeyframes':
    case 'frames.convertToBlankKeyframes': {
      const span =
        typeof params.start === 'number' && typeof params.end === 'number'
          ? Math.max(0, params.end - params.start + 1)
          : 1
      return { total: span, deletedNodes: 0 }
    }
    case 'selection.set':
    case 'selection.clear':
    case 'scene.inspect':
    case 'playback.gotoFrame':
      return { total: 0, deletedNodes: 0 }
    default:
      return { total: 1, deletedNodes: 0 }
  }
}

// ---------------------------------------------------------------------------
// Stage 12 — human-readable compile rows (exactly what the user approves)
// ---------------------------------------------------------------------------

function humanize(cap: CapabilityAction, p: Record<string, unknown>): string {
  const refText = (v: unknown): string => {
    if (isRecord(v) && typeof v.ref === 'string') return `(naya, from ${v.ref})`
    if (Array.isArray(v)) return `[${v.map(refText).join(', ')}]`
    return String(v)
  }
  switch (cap.action) {
    case 'layer.create': return `Naya layer${p.name ? ` "${p.name}"` : ''}`
    case 'folder.create': return `Naya folder${p.name ? ` "${p.name}"` : ''}`
    case 'shape.create':
      return `${refText(p.shape)} at (${p.x},${p.y}) ${p.w}×${p.h} fill ${p.fill}${p.stroke ? ` stroke ${p.stroke}/${p.strokeWidth}` : ''}`
    case 'node.transform':
      return `node ${refText(p.node)} transform → ${Object.entries(p)
        .filter(([k]) => k !== 'node')
        .map(([k, v]) => `${k}=${String(v)}`)
        .join(' ')}`
    case 'node.setStyle':
      return `node ${refText(p.node)} style → ${Object.entries(p)
        .filter(([k]) => k !== 'node')
        .map(([k, v]) => `${k}=${String(v)}`)
        .join(' ')}`
    case 'node.delete': return `node DELETE ${refText(p.nodes ?? p.node)}`
    case 'node.duplicate': return `node duplicate ${refText(p.nodes ?? p.node)} ×${String(p.copies ?? 1)}`
    case 'keyframe.insert': return `keyframe @${String(p.frame)} layer ${refText(p.layer ?? 'active')}`
    case 'keyframe.insertBlank': return `BLANK keyframe @${String(p.frame)} layer ${refText(p.layer ?? 'active')}`
    case 'keyframe.clear': return `keyframe CLEAR @${String(p.frame)} layer ${refText(p.layer ?? 'active')}`
    case 'keyframe.move': return `keyframe move ${String(p.from)}→${String(p.to)} layer ${refText(p.layer ?? 'active')}`
    case 'keyframe.duplicate': return `keyframe dup ${String(p.from)}→${String(p.to)} layer ${refText(p.layer ?? 'active')}`
    case 'tween.classic.set': return `classic tween ${String(p.start)}..${String(p.end)} ease ${String(p.ease ?? 0)} layer ${refText(p.layer ?? 'active')}`
    case 'tween.remove': return `tween remove @${String(p.start)} layer ${refText(p.layer ?? 'active')}`
    case 'layer.rename': return `layer ${refText(p.layer)} rename → "${String(p.name)}"`
    case 'layer.delete': return `layer DELETE ${refText(p.layer)}`
    case 'doc.setSettings': return `document settings → ${Object.entries(p).map(([k, v]) => `${k}=${String(v)}`).join(' ')}`
    case 'scene.inspect': return `scene inspect (${String(p.level ?? 'summary')})`
    case 'selection.set': return `selection set ${refText(p.nodes)}`
    case 'selection.clear': return 'selection clear'
    case 'playback.gotoFrame': return `goto frame ${String(p.frame)}`
    default: {
      // Generic family fallback — new capability actions still get readable rows.
      return `${cap.action} ${Object.entries(p)
        .map(([k, v]) => `${k}=${refText(v)}`)
        .join(' ')}`
    }
  }
}
