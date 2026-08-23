// A6.3 — production orchestration state machine. Coordination only: provider,
// fresh A3 context, A4 validation, mode gates, A5 runner, A6.4 verification,
// A6.2 context, and A6.5 state. It has no direct mutation/WASM command path.

import {
  aiCapabilities,
  aiDocRevision,
  aiSceneSnapshot,
  evaluate,
  hasAiEngineFacades,
  hasAiTransactionFacade,
  hasShapeDrawFacade,
} from '../engine/client'
import { createAdapters, AiError, type CompleteResult, type ProviderAdapter } from './adapters'
import {
  checkUsageReservation,
  type DailyTokenCeilingStore,
} from './budget'
import { buildCapabilityRegistry, parseEngineManifest } from './capabilities'
import type { ConversationContextStore } from './context'
import {
  createBusySnapshot,
  createErrorSnapshot,
  createInteractionStore,
  type InteractionError,
  type InteractionSnapshot,
  type InteractionStore,
  type OrchestratorErrorKind,
  undoReachability,
} from './interaction'
import { defaultKeyVault, type KeyVault } from './keys'
import { buildPrompt, type AiMode, type PromptBuildResult } from './prompt'
import type { ProviderStore, ProviderType } from './providers'
import { redactErrorMessage, redactText } from './redact'
import { transactionRunner, type TransactionResult } from './runner'
import { buildSnapshotView, type SceneSnapshotView } from './snapshot'
import type { UsageMeter } from './usage'
import { probeFromSnapshot, validatePlan, type ValidatedPlan, type ValidationIssue } from './validate'
import { verifyTransaction, type VerificationReport } from './verifier'

export interface AiOrchestratorRequest {
  documentId: number
  userRequest: string
  mode?: AiMode
}

export interface AiConfirmation {
  tierBConfirmed?: boolean
  typedConfirmationAccepted?: boolean
}

export interface AiOrchestratorResult {
  ok: boolean
  status: InteractionSnapshot['phase']
  state: InteractionSnapshot
  structured?: CompleteResult['structured']
  plan?: ValidatedPlan
  transaction?: TransactionResult
  verification?: VerificationReport
  error?: InteractionError
}

export interface AiOrchestratorDeps {
  providerStore: ProviderStore
  keyVault?: KeyVault
  hasConsent(): boolean
  usage: UsageMeter
  ceiling: DailyTokenCeilingStore
  context: ConversationContextStore
  interaction?: InteractionStore
  adapters?: Record<ProviderType, ProviderAdapter>
  transaction?: Pick<typeof transactionRunner, 'run'>
  liveSnapshot?: () => string | null
  liveCapabilities?: () => string | null
  currentRevision?: () => number | null
  currentDocumentId?: () => number | null
  hasEngineFacades?: () => boolean
  hasTransactionFacade?: () => boolean
  hasShapeDraw?: () => boolean
  evaluateFrame?: (frame: number) => ReturnType<typeof evaluate> | null
  /** Approved read-only contract supplied by A6.6/App. Missing = cannot execute. */
  isGestureActive?: () => boolean
  verify?: typeof verifyTransaction
}

interface PendingPlan {
  plan: ValidatedPlan
  userRequest: string
  structured: CompleteResult['structured']
  verificationReplans: number
}

interface InFlight {
  controller: AbortController
  generation: number
}

interface PreparedLive {
  snapshot: SceneSnapshotView
  prompt: PromptBuildResult
}

class OrchestratorFailure extends Error {
  constructor(readonly kind: OrchestratorErrorKind, message: string) {
    super(message)
    this.name = 'OrchestratorFailure'
  }
}

const DEFAULT_MODE: AiMode = 'preview'
const MAX_MALFORMED_REPAIRS = 1
const MAX_VALIDATION_REPAIRS = 1
const MAX_VERIFICATION_REPLANS = 1

function safeError(
  kind: OrchestratorErrorKind,
  message: string,
  sourceCode?: string,
  issues?: readonly ValidationIssue[],
): InteractionError {
  return {
    kind,
    message: redactText(message),
    ...(sourceCode ? { sourceCode: redactText(sourceCode) } : {}),
    ...(issues
      ? {
          issues: issues.map((issue) => ({
            ...issue,
            message: redactText(issue.message),
            ...(issue.hint ? { hint: redactText(issue.hint) } : {}),
            ...(issue.actionId ? { actionId: redactText(issue.actionId) } : {}),
            ...(issue.param ? { param: redactText(issue.param) } : {}),
            ...(issue.candidates
              ? {
                  candidates: issue.candidates.map((candidate) => ({
                    ref: redactText(candidate.ref),
                    label: redactText(candidate.label),
                  })),
                }
              : {}),
          })),
        }
      : {}),
  }
}

function compactPlanSummary(plan: ValidatedPlan): string {
  return `Plan ready: ${plan.report} (${plan.actions.length} actions).`
}

function repairRequest(original: string, issue: ValidationIssue, category: 'malformed' | 'validation'): string {
  return [
    original,
    '',
    `LOCAL ${category.toUpperCase()} REPAIR FEEDBACK (attempt 1 of 1):`,
    `${issue.code} stage ${issue.stage}: ${redactText(issue.message)}`,
    'Return one corrected response only. Do not explain, chain, or retry again.',
  ].join('\n')
}

function verificationRepairRequest(original: string, report: VerificationReport): string {
  const failures = report.rows
    .filter((row) => row.status === 'fail')
    .map((row) => `${row.action ?? 'transaction'}: ${row.check}`)
    .join('; ')
  return [
    original,
    '',
    'LOCAL STRUCTURAL VERIFICATION FAILED (replan 1 of 1):',
    redactText(failures || 'post-state contradicted the approved action effects'),
    'Return a corrected plan for explicit PREVIEW approval. Do not claim it executed.',
  ].join('\n')
}

export class AiOrchestrator {
  private readonly deps: Required<Pick<AiOrchestratorDeps,
    | 'providerStore'
    | 'hasConsent'
    | 'usage'
    | 'ceiling'
    | 'context'
  >> & AiOrchestratorDeps
  private readonly interaction: InteractionStore
  private readonly keyVault: KeyVault
  private readonly adapters: Record<ProviderType, ProviderAdapter>
  private readonly transaction: Pick<typeof transactionRunner, 'run'>
  private readonly pending = new Map<number, PendingPlan>()
  private readonly inFlight = new Map<number, InFlight>()
  private readonly generation = new Map<number, number>()

  constructor(deps: AiOrchestratorDeps) {
    this.deps = deps
    this.interaction = deps.interaction ?? createInteractionStore()
    this.keyVault = deps.keyVault ?? defaultKeyVault()
    this.adapters = deps.adapters ?? createAdapters()
    this.transaction = deps.transaction ?? transactionRunner
  }

  state(documentId: number): InteractionSnapshot {
    return this.interaction.get(documentId)
  }

  stop(documentId: number): AiOrchestratorResult {
    const flight = this.inFlight.get(documentId)
    if (flight) {
      flight.controller.abort()
      this.generation.set(documentId, flight.generation + 1)
      this.inFlight.delete(documentId)
      const current = this.interaction.get(documentId)
      if (current.phase === 'generating' || current.phase === 'verifying') {
        this.interaction.transition(documentId, 'cancelled')
      }
      this.interaction.addCard(documentId, {
        kind: 'error',
        error: safeError('aborted', 'Generation cancelled. Document unchanged.'),
      })
      return this.result(false, documentId, undefined, undefined, undefined, safeError('aborted', 'Generation cancelled. Document unchanged.'))
    }
    if (this.pending.has(documentId)) {
      this.pending.delete(documentId)
      const current = this.interaction.get(documentId)
      if (current.phase === 'awaitingApproval' || current.phase === 'awaitingTypedConfirmation') {
        this.interaction.transition(documentId, 'cancelled')
      }
      const error = safeError('aborted', 'Pending plan cancelled. Document unchanged.')
      this.interaction.addCard(documentId, { kind: 'error', error })
      return this.result(false, documentId, undefined, undefined, undefined, error)
    }
    return this.result(false, documentId, undefined, undefined, undefined, safeError('aborted', 'Nothing is currently running.'))
  }

  async generate(input: AiOrchestratorRequest): Promise<AiOrchestratorResult> {
    const mode = input.mode ?? DEFAULT_MODE
    if (mode !== 'ask' && mode !== 'preview' && mode !== 'apply') {
      throw new Error('AUTO/unknown mode is prohibited')
    }
    if (this.inFlight.has(input.documentId)) {
      const error = safeError('busy', 'Is document ke liye ek AI request already chal rahi hai.')
      return { ok: false, status: 'busy', state: createBusySnapshot(input.documentId, error.message), error }
    }

    this.pending.delete(input.documentId)
    this.interaction.begin(input.documentId, input.userRequest)

    const provider = this.deps.providerStore.active()
    if (!provider) return this.fail(input.documentId, 'unavailable', safeError('no-provider', 'AI provider configure karo.'))
    const key = this.keyVault.get(provider.id)
    if (!key) return this.fail(input.documentId, 'unavailable', safeError('no-key', 'Active provider ki API key missing hai.'))
    if (!this.deps.hasConsent()) {
      return this.fail(input.documentId, 'unavailable', safeError('no-consent', 'AI data-sharing consent required hai.'))
    }
    const ceiling = this.deps.ceiling.get()
    if (ceiling === null) {
      return this.fail(input.documentId, 'unavailable', safeError('usage-ceiling', 'Daily token ceiling configure karo.'))
    }
    if (this.deps.ceiling.isExhausted()) {
      return this.fail(input.documentId, 'failed', safeError('usage-ceiling', 'Daily token ceiling exhausted hai.'))
    }
    if (!this.hasEngine()) {
      return this.fail(input.documentId, 'unavailable', safeError('capability', 'A3 AI engine facades unavailable hain; WASM rebuild required.'))
    }

    const generation = (this.generation.get(input.documentId) ?? 0) + 1
    this.generation.set(input.documentId, generation)
    const controller = new AbortController()
    const flight = { controller, generation }
    this.inFlight.set(input.documentId, flight)

    try {
      if (mode === 'ask') {
        const prepared = this.prepareLive(input.documentId, input.userRequest, mode)
        const response = await this.complete(provider, key, prepared.prompt, controller.signal)
        if (!this.isCurrent(input.documentId, flight)) return this.cancelled(input.documentId)
        const assistant = redactText(response.text)
        this.deps.context.appendTurn(input.documentId, { role: 'user', content: input.userRequest })
        this.deps.context.appendTurn(input.documentId, { role: 'assistant', content: assistant })
        this.interaction.addCard(input.documentId, { kind: 'assistant-message', text: assistant })
        this.interaction.transition(input.documentId, 'completed')
        return this.result(true, input.documentId, undefined, undefined, undefined, undefined, response.structured)
      }

      let malformedRepairs = 0
      let validationRepairs = 0
      let request = input.userRequest
      let finalResponse: CompleteResult | undefined
      let plan: ValidatedPlan | undefined

      while (!plan) {
        const prepared = this.prepareLive(input.documentId, request, mode)
        const response = await this.complete(provider, key, prepared.prompt, controller.signal)
        if (!this.isCurrent(input.documentId, flight)) return this.cancelled(input.documentId)
        finalResponse = response
        const untrusted = redactText(response.text)
        // Provider latency can overlap human edits. Re-read A3 truth AFTER the
        // response; the planning snapshot is advisory, never validation authority.
        const validationLive = this.readLiveTruth()
        const validation = validatePlan(untrusted, {
          registry: validationLive.registry,
          snapshot: validationLive.snapshot,
          probeCache: probeFromSnapshot(validationLive.snapshot),
          mode,
        })
        if (validation.ok) {
          plan = validation.plan
          break
        }
        const first = validation.issues[0] ?? {
          code: 'E_UNKNOWN' as const,
          stage: 0,
          message: 'validation failed without an issue',
        }
        const malformed = first.code === 'E_PARSE'
        if (malformed && malformedRepairs < MAX_MALFORMED_REPAIRS) {
          malformedRepairs += 1
          request = repairRequest(input.userRequest, first, 'malformed')
          this.interaction.addCard(input.documentId, { kind: 'progress', stage: 'repairing', detail: 'Malformed output repair 1/1' })
          continue
        }
        if (!malformed && validationRepairs < MAX_VALIDATION_REPAIRS) {
          validationRepairs += 1
          request = repairRequest(input.userRequest, first, 'validation')
          this.interaction.addCard(input.documentId, { kind: 'progress', stage: 'repairing', detail: 'Validation repair 1/1' })
          continue
        }
        return this.fail(
          input.documentId,
          'failed',
          safeError(malformed ? 'malformed-output' : 'validation', first.message, first.code, validation.issues),
          finalResponse?.structured,
        )
      }

      this.deps.context.appendTurn(input.documentId, { role: 'user', content: input.userRequest })
      this.deps.context.appendTurn(input.documentId, { role: 'assistant', content: compactPlanSummary(plan) })
      this.interaction.addCard(input.documentId, { kind: 'plan', plan })
      if (finalResponse?.structured === 'degraded') {
        this.interaction.addCard(input.documentId, {
          kind: 'progress',
          stage: 'generating',
          detail: 'Provider structured-output mode degraded; strict local A4 validation passed.',
        })
      }
      this.pending.set(input.documentId, {
        plan,
        userRequest: input.userRequest,
        structured: finalResponse?.structured ?? 'none',
        verificationReplans: 0,
      })

      if (plan.massDestructive) {
        this.interaction.transition(input.documentId, 'awaitingTypedConfirmation')
        this.addConfirmation(input.documentId, plan, true)
        return this.result(true, input.documentId, plan, undefined, undefined, undefined, finalResponse?.structured)
      }
      if (mode === 'preview' || plan.requiresConfirmation) {
        this.interaction.transition(input.documentId, 'awaitingApproval')
        this.addConfirmation(input.documentId, plan, false)
        return this.result(true, input.documentId, plan, undefined, undefined, undefined, finalResponse?.structured)
      }
      return await this.executePending(input.documentId, {})
    } catch (error) {
      if (controller.signal.aborted || (error instanceof AiError && error.kind === 'aborted')) {
        return this.cancelled(input.documentId)
      }
      return this.fail(
        input.documentId,
        'failed',
        error instanceof OrchestratorFailure
          ? safeError(error.kind, error.message)
          : safeError('provider', redactErrorMessage(error), error instanceof AiError ? error.kind : undefined),
      )
    } finally {
      const current = this.inFlight.get(input.documentId)
      if (current === flight) this.inFlight.delete(input.documentId)
    }
  }

  async approve(documentId: number, confirmation: AiConfirmation = {}): Promise<AiOrchestratorResult> {
    const pending = this.pending.get(documentId)
    if (!pending) return this.fail(documentId, 'failed', safeError('state', 'No pending validated plan exists.'))
    if (pending.plan.massDestructive && confirmation.typedConfirmationAccepted !== true) {
      return this.result(true, documentId, pending.plan)
    }
    if (pending.plan.requiresConfirmation && confirmation.tierBConfirmed !== true) {
      return this.result(true, documentId, pending.plan)
    }
    return await this.executePending(documentId, confirmation)
  }

  private prepareLive(documentId: number, request: string, mode: AiMode): PreparedLive {
    const { snapshot, registry } = this.readLiveTruth()
    const promptContext = this.deps.context.forPrompt(documentId, snapshot, request)
    return {
      snapshot,
      prompt: buildPrompt({
        registry,
        snapshot,
        ...promptContext,
        userRequest: request,
        mode,
      }),
    }
  }

  private async complete(
    provider: ReturnType<ProviderStore['active']> & {},
    key: string,
    prompt: PromptBuildResult,
    signal: AbortSignal,
  ): Promise<CompleteResult> {
    const ceiling = this.deps.ceiling.get()
    if (ceiling === null || this.deps.ceiling.isExhausted()) {
      throw new OrchestratorFailure('usage-ceiling', 'Daily token ceiling unavailable or exhausted.')
    }
    const reservation = checkUsageReservation({
      ceiling,
      today: this.deps.usage.today(),
      messages: prompt.messages,
      maxTokens: prompt.maxTokens,
    })
    if (!reservation.allowed) {
      throw new OrchestratorFailure(
        'usage-ceiling',
        `Daily token ceiling exceeded: projected ${reservation.projected} > ${reservation.ceiling}.`,
      )
    }
    const adapter = this.adapters[provider.type]
    const response = await adapter.complete(provider, key, {
      messages: prompt.messages,
      ...(prompt.jsonSchema ? { jsonSchema: prompt.jsonSchema } : {}),
      maxTokens: prompt.maxTokens,
      signal,
    })
    if (signal.aborted) {
      throw new OrchestratorFailure('aborted', 'Generation was aborted before completion could be accepted.')
    }
    this.deps.usage.record({
      configId: provider.id,
      model: provider.model,
      inputTokens: response.usage?.inputTokens,
      outputTokens: response.usage?.outputTokens,
    })
    this.deps.providerStore.touchUsed(provider.id)
    const today = this.deps.usage.today()
    if (today.inputTokens + today.outputTokens > ceiling) this.deps.ceiling.markExhausted()
    return response
  }

  private async executePending(
    documentId: number,
    _confirmation: AiConfirmation,
  ): Promise<AiOrchestratorResult> {
    const pending = this.pending.get(documentId)
    if (!pending) return this.fail(documentId, 'failed', safeError('state', 'No pending plan exists.'))
    if (this.deps.currentDocumentId?.() !== documentId) {
      return this.result(false, documentId, pending.plan, undefined, undefined, safeError('state', 'Pending plan ka document active nahi hai.'))
    }
    if (!this.deps.isGestureActive || this.deps.isGestureActive()) {
      const error = safeError('gesture-busy', 'Editor gesture active/unknown hai; execution safely waiting.')
      return { ok: false, status: 'busy', state: createBusySnapshot(documentId, error.message), plan: pending.plan, error }
    }
    if (!this.hasTransaction()) {
      return this.fail(documentId, 'unavailable', safeError('capability', 'A5 transaction facade unavailable hai.'))
    }

    const currentPhase = this.interaction.get(documentId).phase
    if (currentPhase !== 'executing') this.interaction.transition(documentId, 'executing')
    this.interaction.addCard(documentId, {
      kind: 'progress',
      stage: 'executing',
      total: pending.plan.actions.length,
      detail: 'Executing one atomic A5 transaction…',
    })
    const transaction = this.transaction.run(pending.plan)
    this.interaction.addCard(documentId, { kind: 'activity', activity: transaction.activity })
    if (!transaction.ok) {
      this.pending.delete(documentId)
      const report = verifyTransaction({ plan: pending.plan, transaction, postSnapshot: null })
      this.interaction.addCard(documentId, { kind: 'verification', report })
      return this.fail(
        documentId,
        'failed',
        safeError('transaction', transaction.error?.message ?? 'A5 transaction failed', transaction.error?.code),
        pending.structured,
        pending.plan,
        transaction,
        report,
      )
    }

    this.interaction.transition(documentId, 'verifying')
    this.interaction.addCard(documentId, { kind: 'progress', stage: 'verifying', detail: 'Reading fresh A3 post-state…' })
    const postJson = this.deps.liveSnapshot?.() ?? aiSceneSnapshot()
    const post = postJson ? buildSnapshotView(postJson) : null
    const verification = (this.deps.verify ?? verifyTransaction)({
      plan: pending.plan,
      transaction,
      postSnapshot: post,
      evaluateFrame: this.deps.evaluateFrame ?? ((frame) => evaluate(frame)),
    })
    this.interaction.addCard(documentId, { kind: 'verification', report: verification })

    if (
      verification.verdict === 'fail' &&
      pending.verificationReplans < MAX_VERIFICATION_REPLANS
    ) {
      const replanned = await this.replanAfterVerification(documentId, pending, verification)
      if (replanned) return replanned
    }

    this.pending.delete(documentId)
    const postRevision = post?.rev ?? this.currentRevision()
    if (post && transaction.activity.entityBindings.length > 0) {
      this.deps.context.addBindings(documentId, transaction.activity.entityBindings, post.rev)
      this.deps.context.reconcileBindings(documentId, post)
    }
    this.deps.context.appendTurn(documentId, {
      role: 'assistant',
      content: verification.verdict === 'pass'
        ? `Applied and structurally verified: ${pending.plan.report}`
        : `Applied; structural verification ${verification.verdict}: ${pending.plan.report}`,
    })
    const undo = undoReachability({
      transactionDocumentId: documentId,
      activeDocumentId: this.deps.currentDocumentId?.() ?? null,
      mutationCount: transaction.mutationCount,
      postTransactionRevision: postRevision,
      currentRevision: this.currentRevision(),
    })
    this.interaction.addCard(documentId, {
      kind: 'result',
      transactionStatus: transaction.outcome,
      mutationCount: transaction.mutationCount,
      verification: verification.verdict,
      documentId,
      postTransactionRevision: postRevision,
      activityId: transaction.activity.id,
      entityBindings: transaction.activity.entityBindings,
      undo,
    })
    this.interaction.transition(documentId, 'completed')
    return this.result(
      verification.verdict !== 'fail',
      documentId,
      pending.plan,
      transaction,
      verification,
      verification.verdict === 'fail'
        ? safeError('verification', 'Structural verification failed.')
        : verification.verdict === 'unverifiable'
          ? safeError('unverifiable', 'Applied, but structural verification is incomplete.')
          : undefined,
      pending.structured,
    )
  }

  private async replanAfterVerification(
    documentId: number,
    pending: PendingPlan,
    report: VerificationReport,
  ): Promise<AiOrchestratorResult | null> {
    const provider = this.deps.providerStore.active()
    const key = provider ? this.keyVault.get(provider.id) : undefined
    if (!provider || !key || !this.deps.hasConsent()) return null
    let flight = this.inFlight.get(documentId)
    let ownsFlight = false
    if (!flight) {
      const generation = (this.generation.get(documentId) ?? 0) + 1
      this.generation.set(documentId, generation)
      flight = { controller: new AbortController(), generation }
      this.inFlight.set(documentId, flight)
      ownsFlight = true
    }
    const request = verificationRepairRequest(pending.userRequest, report)
    try {
      const prepared = this.prepareLive(documentId, request, 'preview')
      const response = await this.complete(provider, key, prepared.prompt, flight.controller.signal)
      if (!this.isCurrent(documentId, flight)) return null
      const validationLive = this.readLiveTruth()
      const validation = validatePlan(redactText(response.text), {
        registry: validationLive.registry,
        snapshot: validationLive.snapshot,
        probeCache: probeFromSnapshot(validationLive.snapshot),
        mode: 'preview',
      })
      if (!validation.ok) return null
      const corrected: PendingPlan = {
        plan: validation.plan,
        userRequest: pending.userRequest,
        structured: response.structured,
        verificationReplans: pending.verificationReplans + 1,
      }
      this.pending.set(documentId, corrected)
      this.interaction.addCard(documentId, { kind: 'plan', plan: corrected.plan })
      this.interaction.transition(documentId, 'awaitingApproval')
      return this.result(true, documentId, corrected.plan, undefined, report, undefined, response.structured)
    } catch {
      return null
    } finally {
      if (ownsFlight && this.inFlight.get(documentId) === flight) this.inFlight.delete(documentId)
    }
  }

  private addConfirmation(documentId: number, plan: ValidatedPlan, typed: boolean): void {
    this.interaction.addCard(documentId, {
      kind: 'confirmation',
      tierB: plan.requiresConfirmation,
      typedRequired: typed,
      affectedActions: plan.actions
        .filter((action) => action.tier === 'B')
        .map((action) => action.index),
      message: typed
        ? 'Mass-destructive plan ko typed confirmation chahiye.'
        : plan.requiresConfirmation
          ? 'Tier-B actions ko explicit confirmation chahiye.'
          : 'Preview plan apply karne ke liye approval chahiye.',
    })
  }

  private fail(
    documentId: number,
    phase: 'failed' | 'unavailable',
    error: InteractionError,
    structured?: CompleteResult['structured'],
    plan?: ValidatedPlan,
    transaction?: TransactionResult,
    verification?: VerificationReport,
  ): AiOrchestratorResult {
    const current = this.interaction.get(documentId)
    if (current.phase === 'idle') {
      const state = createErrorSnapshot(documentId, phase, error)
      return {
        ok: false,
        status: state.phase,
        state,
        ...(structured ? { structured } : {}),
        ...(plan ? { plan } : {}),
        ...(transaction ? { transaction } : {}),
        ...(verification ? { verification } : {}),
        error,
      }
    }
    if (current.phase !== phase) this.interaction.transition(documentId, phase)
    this.interaction.addCard(documentId, { kind: 'error', error })
    return this.result(false, documentId, plan, transaction, verification, error, structured)
  }

  private cancelled(documentId: number): AiOrchestratorResult {
    const current = this.interaction.get(documentId)
    if (current.phase === 'generating' || current.phase === 'verifying') {
      this.interaction.transition(documentId, 'cancelled')
    }
    const error = safeError('aborted', 'Generation cancelled. Document unchanged.')
    return this.result(false, documentId, undefined, undefined, undefined, error)
  }

  private result(
    ok: boolean,
    documentId: number,
    plan?: ValidatedPlan,
    transaction?: TransactionResult,
    verification?: VerificationReport,
    error?: InteractionError,
    structured?: CompleteResult['structured'],
  ): AiOrchestratorResult {
    const state = this.interaction.get(documentId)
    return {
      ok,
      status: state.phase,
      state,
      ...(structured ? { structured } : {}),
      ...(plan ? { plan } : {}),
      ...(transaction ? { transaction } : {}),
      ...(verification ? { verification } : {}),
      ...(error ? { error } : {}),
    }
  }

  private isCurrent(documentId: number, flight: InFlight): boolean {
    return this.inFlight.get(documentId) === flight &&
      this.generation.get(documentId) === flight.generation &&
      !flight.controller.signal.aborted
  }

  private hasEngine(): boolean {
    return (this.deps.hasEngineFacades ?? hasAiEngineFacades)()
  }

  private hasTransaction(): boolean {
    return (this.deps.hasTransactionFacade ?? hasAiTransactionFacade)()
  }

  private hasShapeDraw(): boolean {
    return (this.deps.hasShapeDraw ?? hasShapeDrawFacade)()
  }

  private readLiveTruth() {
    const snapshot = buildSnapshotView(this.liveSnapshotOrThrow())
    const registry = buildCapabilityRegistry(
      parseEngineManifest(this.liveCapabilitiesOrThrow()),
      { hasShapeDraw: this.hasShapeDraw() },
    )
    return { snapshot, registry }
  }

  private liveSnapshotOrThrow(): string {
    const value = (this.deps.liveSnapshot ?? aiSceneSnapshot)()
    if (!value) throw new Error('fresh A3 scene snapshot unavailable')
    return value
  }

  private liveCapabilitiesOrThrow(): string {
    const value = (this.deps.liveCapabilities ?? aiCapabilities)()
    if (!value) throw new Error('fresh A3 capability manifest unavailable')
    return value
  }

  private currentRevision(): number | null {
    return (this.deps.currentRevision ?? aiDocRevision)()
  }
}
