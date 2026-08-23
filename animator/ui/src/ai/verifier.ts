// A6.4 — minimal structural verifier. It consumes only the approved A4 plan,
// A5 result, and a FRESH A3 post-state. Free-form expected[] remains display
// text and is never parsed as code/selectors/predicates. No visual verification.

import type { RectItemJson } from '../engine/wasmTypes'
import type { TransactionResult } from './runner'
import type { SceneSnapshotView, SnapLayerRow, SnapNodeRow, SnapSymbolRow } from './snapshot'
import type { ValidatedAction, ValidatedPlan } from './validate'

export type VerificationVerdict = 'pass' | 'fail' | 'unverifiable'

export interface VerificationRow {
  actionIndex?: number
  action?: string
  status: VerificationVerdict
  check: string
  evidence?: string
}

export interface VerificationReport {
  verdict: VerificationVerdict
  rows: readonly Readonly<VerificationRow>[]
  snapshotRevision: number | null
  structurallyVerified: boolean
}

export interface VerifyTransactionInput {
  plan: ValidatedPlan
  transaction: TransactionResult
  postSnapshot: SceneSnapshotView | null
  evaluateFrame?: (frame: number) => readonly RectItemJson[] | null
}

type BindingKind = 'node' | 'layer' | 'symbol'

function row(
  action: ValidatedAction,
  status: VerificationVerdict,
  check: string,
  evidence?: string,
): VerificationRow {
  return {
    actionIndex: action.index,
    action: action.action,
    status,
    check,
    ...(evidence ? { evidence } : {}),
  }
}

function refAlias(value: unknown): string | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const ref = (value as Record<string, unknown>).ref
  return typeof ref === 'string' ? ref : null
}

function bindingId(
  input: VerifyTransactionInput,
  alias: string,
  kind: BindingKind,
): number | null {
  const binding = input.transaction.activity.entityBindings.find(
    (candidate) => candidate.alias === alias && candidate.kind === kind,
  )
  return binding?.id ?? null
}

function originalLayerId(plan: ValidatedPlan, index: number): number | null {
  return plan.validatedAt.layers.find((layer) => layer.index === index)?.id ?? null
}

function targetLayerId(
  input: VerifyTransactionInput,
  value: unknown,
): number | null {
  if (typeof value === 'number') return originalLayerId(input.plan, value)
  const alias = refAlias(value)
  if (alias) return bindingId(input, alias, 'layer')
  return originalLayerId(input.plan, input.plan.validatedAt.activeLayer)
}

function targetNodeIds(input: VerifyTransactionInput, value: unknown): number[] | null {
  const values = Array.isArray(value) ? value : [value]
  const out: number[] = []
  for (const item of values) {
    if (typeof item === 'number') out.push(item)
    else {
      const alias = refAlias(item)
      const id = alias ? bindingId(input, alias, 'node') : null
      if (id === null) return null
      out.push(id)
    }
  }
  return out
}

function targetSymbolId(input: VerifyTransactionInput, value: unknown): number | null {
  if (typeof value === 'number') return value
  const alias = refAlias(value)
  return alias ? bindingId(input, alias, 'symbol') : null
}

function layerById(view: SceneSnapshotView, id: number | null): SnapLayerRow | undefined {
  return id === null ? undefined : view.raw.layers.find((layer) => layer.id === id)
}

function nodeById(view: SceneSnapshotView, id: number | null): SnapNodeRow | undefined {
  return id === null ? undefined : view.raw.nodes.find((node) => node.id === id)
}

function symbolById(view: SceneSnapshotView, id: number | null): SnapSymbolRow | undefined {
  return id === null ? undefined : view.raw.library.find((symbol) => symbol.id === id)
}

function near(actual: number | undefined, expected: number): boolean {
  return actual !== undefined && Math.abs(actual - expected) <= 0.000_001
}

function checkLayerAction(
  input: VerifyTransactionInput,
  action: ValidatedAction,
  view: SceneSnapshotView,
): VerificationRow | null {
  const p = action.params
  if (action.action === 'layer.create' || action.action === 'folder.create') {
    if (!action.id) return row(action, 'unverifiable', 'created layer binding is unavailable')
    const id = bindingId(input, action.id, 'layer')
    const layer = layerById(view, id)
    if (id === null) return row(action, 'unverifiable', 'A5 did not return a layer binding')
    if (!layer) return row(action, 'fail', 'created layer is absent from fresh post-state')
    const expectedKind = action.action === 'folder.create' ? 'folder' : 'normal'
    const matches = layer.kind === expectedKind &&
      (typeof p.name !== 'string' || layer.name === p.name)
    return row(action, matches ? 'pass' : 'fail', 'created layer kind/name', `id=${id}`)
  }

  const id = targetLayerId(input, p.layer)
  if (id === null) return row(action, 'unverifiable', 'layer identity cannot be resolved')
  const layer = layerById(view, id)
  if (action.action === 'layer.delete') {
    return row(action, layer ? 'fail' : 'pass', 'deleted layer is absent', `layerId=${id}`)
  }
  if (!layer) return row(action, 'fail', 'target layer is absent from fresh post-state')

  switch (action.action) {
    case 'layer.rename':
      return row(action, layer.name === p.name ? 'pass' : 'fail', 'layer name matches')
    case 'layer.setVisible':
      return row(action, layer.vis === p.value ? 'pass' : 'fail', 'layer visibility matches')
    case 'layer.setLocked':
      return row(action, layer.lock === p.value ? 'pass' : 'fail', 'layer lock state matches')
    case 'layer.setOutline':
      return row(action, Boolean(layer.outline) === p.value ? 'pass' : 'fail', 'layer outline state matches')
    case 'layer.reorder':
      return row(action, layer.i === p.to ? 'pass' : 'fail', 'layer order index matches')
    case 'layer.setParent': {
      const parentId = p.parent === undefined ? undefined : targetLayerId(input, p.parent)
      if (p.parent !== undefined && parentId === null) {
        return row(action, 'unverifiable', 'parent layer identity cannot be resolved')
      }
      return row(action, layer.parent === parentId ? 'pass' : 'fail', 'layer parent relationship matches')
    }
    case 'layer.duplicate':
      return row(action, 'unverifiable', 'A5 does not expose the duplicated layer binding')
    default:
      return null
  }
}

function checkTimelineAction(
  input: VerifyTransactionInput,
  action: ValidatedAction,
  view: SceneSnapshotView,
): VerificationRow | null {
  const p = action.params
  const id = targetLayerId(input, p.layer)
  const layer = layerById(view, id)
  if (id === null) return row(action, 'unverifiable', 'timeline layer identity cannot be resolved')
  if (!layer) return row(action, 'fail', 'timeline layer is absent')
  const at = (frame: number) => layer.kf.find((keyframe) => keyframe.f === frame)

  switch (action.action) {
    case 'keyframe.insert': {
      const keyframe = at(p.frame as number)
      return row(action, keyframe && !keyframe.blank ? 'pass' : 'fail', 'content keyframe exists')
    }
    case 'keyframe.insertBlank': {
      const keyframe = at(p.frame as number)
      return row(action, keyframe?.blank ? 'pass' : 'fail', 'blank keyframe exists')
    }
    case 'keyframe.clear':
      return row(action, at(p.frame as number) ? 'fail' : 'pass', 'cleared keyframe is absent')
    case 'keyframe.move':
      return row(
        action,
        !at(p.from as number) && Boolean(at(p.to as number)) ? 'pass' : 'fail',
        'keyframe moved from source to target',
      )
    case 'keyframe.duplicate':
      return row(action, at(p.to as number) ? 'pass' : 'fail', 'duplicated keyframe exists at target')
    case 'frames.remove': {
      const exists = layer.kf.some((keyframe) => keyframe.f >= (p.start as number) && keyframe.f <= (p.end as number))
      return row(action, exists ? 'fail' : 'pass', 'removed frame range contains no keyframes')
    }
    case 'frames.convertToKeyframes': {
      const missing = Array.from(
        { length: (p.end as number) - (p.start as number) + 1 },
        (_, offset) => (p.start as number) + offset,
      ).some((frame) => !at(frame) || at(frame)?.blank)
      return row(action, missing ? 'fail' : 'pass', 'range contains content keyframes')
    }
    case 'frames.convertToBlankKeyframes': {
      const missing = Array.from(
        { length: (p.end as number) - (p.start as number) + 1 },
        (_, offset) => (p.start as number) + offset,
      ).some((frame) => !at(frame)?.blank)
      return row(action, missing ? 'fail' : 'pass', 'range contains blank keyframes')
    }
    case 'frames.setLabel':
      return row(action, at(p.frame as number)?.label === p.label ? 'pass' : 'fail', 'frame label matches')
    case 'tween.classic.set': {
      const tween = layer.tw.find((candidate) => candidate.s === p.start)
      return row(
        action,
        tween?.e === p.end && near(tween?.ease, p.ease as number) ? 'pass' : 'fail',
        'classic tween span/ease matches',
      )
    }
    case 'tween.remove':
      return row(action, layer.tw.some((candidate) => candidate.s === p.start) ? 'fail' : 'pass', 'tween is absent')
    case 'frames.insert':
    case 'frames.delete':
    case 'frames.reverse':
    case 'frames.duplicate':
      return row(action, 'unverifiable', 'exact frame-range effect requires pre-state/content order not exposed by A3')
    default:
      return null
  }
}

function checkNodeAction(
  input: VerifyTransactionInput,
  action: ValidatedAction,
  view: SceneSnapshotView,
): VerificationRow | null {
  const p = action.params
  if (action.action === 'shape.create') {
    if (!action.id) return row(action, 'unverifiable', 'created shape binding is unavailable')
    const id = bindingId(input, action.id, 'node')
    if (id === null) return row(action, 'unverifiable', 'A5 did not return a shape binding')
    const node = nodeById(view, id)
    if (!node) return row(action, 'fail', 'created shape is absent')
    if (typeof p.name === 'string') {
      return row(action, 'unverifiable', 'node names are not exposed by the current engine model')
    }
    const strokeMatches = p.stroke === undefined
      ? true
      : p.stroke === null || p.stroke === 'none'
        ? node.stroke === undefined
        : node.stroke === p.stroke
    const layerId = targetLayerId(input, p.layer)
    const layer = layerById(view, layerId)
    const expectedFrame = typeof p.frame === 'number' ? p.frame : input.plan.validatedAt.playhead
    const membershipMatches = layer
      ? node.kf.some(([layerIndex, frame]) => layerIndex === layer.i && frame === expectedFrame)
      : false
    const matches = node.kind === p.shape && near(node.x, p.x as number) && near(node.y, p.y as number) &&
      near(node.w, p.w as number) && near(node.h, p.h as number) && node.fill === p.fill &&
      strokeMatches && (typeof p.strokeWidth !== 'number' || near(node.sw, p.strokeWidth)) &&
      membershipMatches
    return row(action, matches ? 'pass' : 'fail', 'created shape geometry/style/membership matches', `node=${id}`)
  }

  const key = action.action === 'node.delete' || action.action === 'node.duplicate' ||
    action.action === 'node.arrange' || action.action === 'node.align'
    ? 'nodes'
    : 'node'
  const ids = targetNodeIds(input, p[key])
  if (!ids) return row(action, 'unverifiable', 'node identity/binding cannot be resolved')

  if (action.action === 'node.delete') {
    if (!input.evaluateFrame) return row(action, 'unverifiable', 'evaluate(frame) facade is unavailable')
    const evaluated = input.evaluateFrame(input.plan.validatedAt.playhead)
    if (!evaluated) return row(action, 'unverifiable', 'required frame geometry is unavailable')
    return row(
      action,
      ids.some((id) => evaluated.some((item) => item.id === id)) ? 'fail' : 'pass',
      'deleted nodes are absent at the affected frame',
    )
  }

  if (action.action === 'node.setStyle') {
    for (const id of ids) {
      const node = nodeById(view, id)
      if (!node) return row(action, 'fail', `styled node ${id} is absent`)
      if (typeof p.width === 'number' && !near(node.w, p.width)) return row(action, 'fail', 'node width contradicts plan')
      if (typeof p.height === 'number' && !near(node.h, p.height)) return row(action, 'fail', 'node height contradicts plan')
      if (typeof p.fill === 'string' && node.fill !== p.fill) return row(action, 'fail', 'node fill contradicts plan')
      if (p.stroke === null || p.stroke === 'none') {
        if (node.stroke !== undefined) return row(action, 'fail', 'node stroke was not removed')
      } else if (typeof p.stroke === 'string' && node.stroke !== p.stroke) {
        return row(action, 'fail', 'node stroke contradicts plan')
      }
      if (typeof p.strokeWidth === 'number' && !near(node.sw, p.strokeWidth)) {
        return row(action, 'fail', 'node stroke width contradicts plan')
      }
    }
    return row(action, 'pass', 'node style fields match')
  }

  if (action.action === 'node.transform') {
    if (p.relative === true || p.reset === true) {
      return row(action, 'unverifiable', 'relative/reset transform requires pre-state not supplied to minimal verifier')
    }
    if (!input.evaluateFrame) return row(action, 'unverifiable', 'evaluate(frame) facade is unavailable')
    const evaluated = input.evaluateFrame(input.plan.validatedAt.playhead)
    if (!evaluated) return row(action, 'unverifiable', 'required frame geometry is unavailable')
    for (const id of ids) {
      const item = evaluated.find((candidate) => candidate.id === id)
      const base = nodeById(view, id)
      if (!item || !base) return row(action, 'fail', `transformed node ${id} is absent`)
      if (typeof p.x === 'number' && !near(item.x, p.x)) return row(action, 'fail', 'node x contradicts plan')
      if (typeof p.y === 'number' && !near(item.y, p.y)) return row(action, 'fail', 'node y contradicts plan')
      if (typeof p.rotation === 'number' && !near(item.rotation, p.rotation)) return row(action, 'fail', 'node rotation contradicts plan')
      if (typeof p.scaleX === 'number' && (!base.w || !near(item.w / base.w, p.scaleX))) {
        return row(action, 'fail', 'node scaleX contradicts plan')
      }
      if (typeof p.scaleY === 'number' && (!base.h || !near(item.h / base.h, p.scaleY))) {
        return row(action, 'fail', 'node scaleY contradicts plan')
      }
    }
    return row(action, 'pass', 'resolved node transform matches')
  }

  if (action.action === 'node.duplicate') {
    return row(action, 'unverifiable', 'A5 does not expose duplicate-node bindings')
  }
  if (action.action === 'node.arrange' || action.action === 'node.align') {
    return row(action, 'unverifiable', 'content ordering/alignment reference is not fully exposed by A3')
  }
  return null
}

function checkSymbolAction(
  input: VerifyTransactionInput,
  action: ValidatedAction,
  view: SceneSnapshotView,
): VerificationRow | null {
  const p = action.params
  if (action.action === 'symbol.create') {
    if (!action.id) return row(action, 'unverifiable', 'created symbol binding is unavailable')
    const id = bindingId(input, action.id, 'symbol')
    if (id === null) return row(action, 'unverifiable', 'A5 did not return a symbol binding')
    const symbol = symbolById(view, id)
    if (!symbol) return row(action, 'fail', 'created symbol is absent')
    const matches = (typeof p.name !== 'string' || symbol.name === p.name) &&
      (typeof p.type !== 'string' || symbol.type === p.type)
    return row(action, matches ? 'pass' : 'fail', 'created symbol name/type matches')
  }
  if (action.action === 'symbol.place') {
    if (!action.id) return row(action, 'unverifiable', 'placed instance binding is unavailable')
    const nodeId = bindingId(input, action.id, 'node')
    const symbolId = targetSymbolId(input, p.symbol)
    if (nodeId === null || symbolId === null) return row(action, 'unverifiable', 'instance/symbol binding is unavailable')
    const node = nodeById(view, nodeId)
    const matches = node?.kind === 'symbol' && node.sym === symbolId &&
      (typeof p.x !== 'number' || near(node.x, p.x)) &&
      (typeof p.y !== 'number' || near(node.y, p.y))
    return row(action, matches ? 'pass' : 'fail', 'placed symbol instance matches')
  }

  const symbolId = targetSymbolId(input, p.symbol)
  if (symbolId === null) return row(action, 'unverifiable', 'symbol identity cannot be resolved')
  const symbol = symbolById(view, symbolId)
  if (action.action === 'symbol.delete') {
    return row(action, symbol ? 'fail' : 'pass', 'deleted symbol is absent')
  }
  if (action.action === 'symbol.rename') {
    return row(action, symbol?.name === p.name ? 'pass' : 'fail', 'symbol name matches')
  }
  if (action.action === 'symbol.convert') {
    return row(action, 'unverifiable', 'A5 does not expose conversion bindings')
  }
  if (action.action === 'symbol.swap' || action.action === 'symbol.setLoop') {
    const instanceId = input.plan.validatedAt.selection[0]
    const instance = nodeById(view, instanceId ?? null)
    if (!instance) return row(action, 'unverifiable', 'selected symbol instance is unavailable')
    if (action.action === 'symbol.swap') {
      return row(action, instance.sym === symbolId ? 'pass' : 'fail', 'instance symbol id matches')
    }
    const expectedLoop = p.loop === 'once' ? 'once' : p.loop === 'single' ? 'single' : 'loop'
    const matches = instance.lp === expectedLoop &&
      (typeof p.firstFrame !== 'number' || instance.ff === p.firstFrame)
    return row(action, matches ? 'pass' : 'fail', 'instance loop settings match')
  }
  return null
}

function verifyAction(
  input: VerifyTransactionInput,
  action: ValidatedAction,
  view: SceneSnapshotView,
): VerificationRow {
  if (action.action === 'scene.inspect') return row(action, 'pass', 'read-only scene inspection required no mutation')
  if (action.action === 'selection.clear') {
    return row(action, view.raw.selection.length === 0 ? 'pass' : 'fail', 'selection is empty')
  }
  if (action.action === 'selection.set') {
    const ids = targetNodeIds(input, action.params.nodes)
    if (!ids) return row(action, 'unverifiable', 'selection targets cannot be resolved')
    const matches = ids.length === view.raw.selection.length && ids.every((id, index) => view.raw.selection[index] === id)
    return row(action, matches ? 'pass' : 'fail', 'selection order/ids match')
  }
  if (action.action === 'doc.setSettings') {
    const p = action.params
    const s = view.raw.settings
    const matches =
      (typeof p.width !== 'number' || near(s.w, p.width)) &&
      (typeof p.height !== 'number' || near(s.h, p.height)) &&
      (typeof p.fps !== 'number' || near(s.fps, p.fps)) &&
      (typeof p.background !== 'string' || s.bg === p.background) &&
      (typeof p.backgroundAlpha !== 'number' || near(s.bgA, p.backgroundAlpha))
    return row(action, matches ? 'pass' : 'fail', 'document settings match')
  }
  return checkLayerAction(input, action, view) ??
    checkTimelineAction(input, action, view) ??
    checkNodeAction(input, action, view) ??
    checkSymbolAction(input, action, view) ??
    row(action, 'unverifiable', 'minimal verifier has no safe observable for this action')
}

export function verifyTransaction(input: VerifyTransactionInput): VerificationReport {
  if (!input.transaction.ok || input.transaction.outcome !== 'applied') {
    return Object.freeze({
      verdict: 'fail' as const,
      rows: Object.freeze([
        Object.freeze({
          status: 'fail' as const,
          check: 'A5 transaction must be applied before structural verification',
          evidence: input.transaction.outcome,
        }),
      ]),
      snapshotRevision: input.postSnapshot?.rev ?? null,
      structurallyVerified: false,
    })
  }
  if (!input.postSnapshot) {
    return Object.freeze({
      verdict: 'unverifiable' as const,
      rows: Object.freeze([
        Object.freeze({
          status: 'unverifiable' as const,
          check: 'fresh A3 post-state snapshot is unavailable',
        }),
      ]),
      snapshotRevision: null,
      structurallyVerified: false,
    })
  }

  const rows: VerificationRow[] = input.plan.actions.map((action) =>
    verifyAction(input, action, input.postSnapshot as SceneSnapshotView),
  )
  for (const expectation of input.plan.expected) {
    rows.push({
      status: 'unverifiable',
      check: 'free-form expected[] is display text only',
      evidence: expectation,
    })
  }
  const verdict: VerificationVerdict = rows.some((candidate) => candidate.status === 'fail')
    ? 'fail'
    : rows.some((candidate) => candidate.status === 'unverifiable')
      ? 'unverifiable'
      : 'pass'
  const frozenRows = Object.freeze(rows.map((candidate) => Object.freeze({ ...candidate })))
  return Object.freeze({
    verdict,
    rows: frozenRows,
    snapshotRevision: input.postSnapshot.rev,
    structurallyVerified: verdict === 'pass',
  })
}
