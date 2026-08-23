// A5 — TransactionRunner. Consumes ONLY an A4 ValidatedPlan, rebuilds A3 live
// truth immediately before dispatch, reuses the existing A4 validator/probe,
// and invokes the one A5 engine facade that commits through A1 execute_grouped.

import {
  activeDocId,
  aiCapabilities,
  aiExecuteTransaction,
  aiSceneSnapshot,
  hasShapeDrawFacade,
  type AiEngineTransactionResult,
} from '../engine/client'
import { buildCapabilityRegistry, parseEngineManifest } from './capabilities'
import { activityStore, type ActivityRecord, type ActivityStore } from './activity'
import { redactText } from './redact'
import { buildSnapshotView, type SceneSnapshotView } from './snapshot'
import {
  probeFromSnapshot,
  validatePlan,
  type AiErrorCode,
  type ValidatedAction,
  type ValidatedPlan,
  type ValidationIssue,
} from './validate'

export interface TransactionEngine {
  liveSnapshot(): string | null
  liveCapabilities(): string | null
  hasShapeDraw(): boolean
  activeDocId(): number | undefined
  execute(planJson: string, label: string): AiEngineTransactionResult | null
}

export interface TransactionRunnerOptions {
  engine?: TransactionEngine
  activity?: ActivityStore
}

export interface TransactionResult {
  ok: boolean
  outcome: 'applied' | 'rolled-back' | 'failed'
  mutationCount: number
  activity: ActivityRecord
  error?: ValidationIssue
}

const ERROR_CODES = new Set<AiErrorCode>([
  'E_PARSE',
  'E_SCHEMA',
  'E_RANGE',
  'E_REF',
  'E_STATE',
  'E_GUARD',
  'E_TIER',
  'E_CAPABILITY',
  'E_BUDGET',
  'E_COMPILE',
  'E_UNKNOWN',
])

const defaultEngine: TransactionEngine = {
  liveSnapshot: aiSceneSnapshot,
  liveCapabilities: aiCapabilities,
  hasShapeDraw: hasShapeDrawFacade,
  activeDocId: () => {
    const id = activeDocId()
    return id > 0 ? id : undefined
  },
  execute: aiExecuteTransaction,
}

function issue(
  code: AiErrorCode,
  stage: number,
  message: string,
  action?: ValidatedAction,
): ValidationIssue {
  return {
    code,
    stage,
    message: redactText(message),
    ...(action ? { actionIndex: action.index, ...(action.id ? { actionId: action.id } : {}) } : {}),
  }
}

function sameNumbers(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index])
}

function concreteNodes(action: ValidatedAction): number[] {
  const out: number[] = []
  for (const target of action.targets) {
    if (target.kind === 'node-id' && !out.includes(target.id)) out.push(target.id)
  }
  return out
}

function selectionDependent(action: ValidatedAction, selection: readonly number[]): boolean {
  if (action.action === 'symbol.convert' || action.action === 'symbol.swap' || action.action === 'symbol.setLoop') {
    return true
  }
  const nodes = concreteNodes(action)
  return nodes.length > 0 && sameNumbers(nodes, selection)
}

function usesDefaultLayer(action: ValidatedAction): boolean {
  if (['layer.create', 'folder.create', 'symbol.place', 'symbol.convert'].includes(action.action)) return true
  return [
    'shape.create',
    'keyframe.insert',
    'keyframe.insertBlank',
    'keyframe.clear',
  ].includes(action.action) && action.params.layer === undefined
}

function usesLivePlayhead(action: ValidatedAction): boolean {
  if (action.action === 'shape.create') return action.params.frame === undefined
  return (
    action.action.startsWith('node.') ||
    action.action === 'symbol.convert' ||
    action.action === 'symbol.place' ||
    action.action.startsWith('selection.')
  )
}

function staleIssue(plan: ValidatedPlan, live: SceneSnapshotView): ValidationIssue | null {
  const stamp = plan.validatedAt
  if (!stamp) return issue('E_STATE', 8, 'validated plan is missing its A4 live-state stamp')
  if (stamp.sceneIndex !== live.raw.scene.i) {
    return issue('E_STATE', 8, 'active scene changed after validation — replan required')
  }
  if (stamp.capabilityEngine.length === 0) {
    return issue('E_CAPABILITY', 10, 'validated capability identity is missing')
  }

  for (const action of plan.actions) {
    for (const target of action.targets) {
      if (target.kind !== 'layer-index') continue
      const expectedId = stamp.layers.find((layer) => layer.index === target.index)?.id
      const liveId = live.raw.layers.find((layer) => layer.i === target.index)?.id
      if (expectedId === undefined || liveId !== expectedId) {
        return issue('E_REF', 7, `layer target ${target.index} changed after validation`, action)
      }
    }
  }

  if (!sameNumbers(stamp.selection, live.raw.selection)) {
    const dependent = plan.actions.find((action) => selectionDependent(action, stamp.selection))
    if (dependent) {
      return issue('E_REF', 7, 'selection changed after validation — selected reference is stale', dependent)
    }
  }
  if (stamp.activeLayer !== live.raw.activeLayer) {
    const dependent = plan.actions.find(usesDefaultLayer)
    if (dependent) return issue('E_STATE', 8, 'active layer changed after validation', dependent)
  }
  if (stamp.playhead !== live.raw.playhead) {
    const dependent = plan.actions.find(usesLivePlayhead)
    if (dependent) return issue('E_STATE', 8, 'playhead changed after validation', dependent)
  }
  return null
}

function rawPlan(plan: ValidatedPlan): string {
  return JSON.stringify({
    plan: plan.actions.map((action) => ({
      ...(action.id ? { id: action.id } : {}),
      action: action.action,
      params: action.params,
    })),
    expected: plan.expected,
    report: plan.report,
  })
}

function normalizeEngineIssue(result: AiEngineTransactionResult): ValidationIssue {
  const error = result.error
  const code = error && ERROR_CODES.has(error.code as AiErrorCode)
    ? (error.code as AiErrorCode)
    : 'E_UNKNOWN'
  return {
    code,
    stage: error?.stage ?? 0,
    message: redactText(error?.message ?? 'engine transaction failed'),
    ...(error?.actionIndex !== undefined ? { actionIndex: error.actionIndex } : {}),
    ...(error?.actionId ? { actionId: error.actionId } : {}),
  }
}

export class TransactionRunner {
  private readonly engine: TransactionEngine
  private readonly activity: ActivityStore

  constructor(options: TransactionRunnerOptions = {}) {
    this.engine = options.engine ?? defaultEngine
    this.activity = options.activity ?? activityStore
  }

  run(plan: ValidatedPlan): TransactionResult {
    const label = redactText(`AI — ${plan.report}`).replace(/[\r\n\t]+/g, ' ').trim().slice(0, 240)
    const started = this.activity.start(plan, label, this.engine.activeDocId())

    const fail = (problem: ValidationIssue, rolledBack = false, engineActions: AiEngineTransactionResult['actions'] = []): TransactionResult => {
      const safeProblem: ValidationIssue = {
        ...problem,
        message: redactText(problem.message),
        ...(problem.hint ? { hint: redactText(problem.hint) } : {}),
        ...(problem.actionId ? { actionId: redactText(problem.actionId) } : {}),
      }
      const activity = this.activity.failed(started.id, safeProblem, rolledBack, engineActions)
      if (!activity) throw new Error('activity record disappeared during transaction')
      return {
        ok: false,
        outcome: rolledBack ? 'rolled-back' : 'failed',
        mutationCount: 0,
        activity,
        error: safeProblem,
      }
    }

    let live: SceneSnapshotView
    let manifestJson: string
    try {
      const snapshotJson = this.engine.liveSnapshot()
      manifestJson = this.engine.liveCapabilities() ?? ''
      if (!snapshotJson) return fail(issue('E_STATE', 8, 'live document snapshot unavailable'))
      if (!manifestJson) return fail(issue('E_CAPABILITY', 10, 'live capability manifest unavailable'))
      live = buildSnapshotView(snapshotJson)
    } catch (error) {
      return fail(issue('E_UNKNOWN', 0, `live-state read failed: ${error instanceof Error ? error.message : String(error)}`))
    }

    const stale = staleIssue(plan, live)
    if (stale) return fail(stale)

    let fresh: ValidatedPlan
    try {
      const manifest = parseEngineManifest(manifestJson)
      if (manifest.engine !== plan.validatedAt.capabilityEngine) {
        return fail(issue('E_CAPABILITY', 10, 'engine capability identity changed after validation'))
      }
      const registry = buildCapabilityRegistry(manifest, { hasShapeDraw: this.engine.hasShapeDraw() })
      const result = validatePlan(rawPlan(plan), {
        registry,
        snapshot: live,
        probeCache: probeFromSnapshot(live),
        mode: 'preview',
      })
      if (!result.ok) return fail(result.issues[0] ?? issue('E_UNKNOWN', 0, 'live revalidation failed'))
      fresh = result.plan
    } catch (error) {
      return fail(issue('E_UNKNOWN', 0, `live revalidation failed: ${error instanceof Error ? error.message : String(error)}`))
    }

    // Engine application is synchronous and atomic. These ordered dispatch
    // events let future A6 render the current row without retaining params.
    for (const action of fresh.actions) this.activity.actionExecuting(started.id, action.index)

    const engineResult = this.engine.execute(JSON.stringify(fresh), label)
    if (!engineResult) {
      return fail(issue('E_CAPABILITY', 10, 'A5 transaction facade unavailable — rebuild wasm'))
    }
    if (!engineResult.ok) {
      return fail(normalizeEngineIssue(engineResult), engineResult.rolledBack, engineResult.actions)
    }

    const completed = this.activity.applied(
      started.id,
      engineResult.mutationCount,
      engineResult.actions,
      engineResult.bindings,
    )
    if (!completed) throw new Error('activity record disappeared during transaction')
    return {
      ok: true,
      outcome: 'applied',
      mutationCount: engineResult.mutationCount,
      activity: completed,
    }
  }
}

export const transactionRunner = new TransactionRunner()
