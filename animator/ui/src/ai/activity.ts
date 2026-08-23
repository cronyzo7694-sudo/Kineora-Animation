// A5 — session-only, UI-consumable AI transaction activity.
// Deliberately excludes prompts, provider/model details, keys, request text,
// snapshots, file paths, and action params. Every string crosses the existing
// A2 redaction boundary before it is retained.

import { redactText } from './redact'
import type { AiErrorCode, ValidatedPlan, ValidationIssue } from './validate'
import type { AiEngineActionExecution, AiEngineEntityBinding } from '../engine/client'

export type ActivityOutcome = 'running' | 'applied' | 'rolled-back' | 'failed'
export type ActivityActionStatus = 'pending' | 'executing' | 'prepared' | 'applied' | 'rolled-back' | 'failed' | 'skipped'
export type ActivityEventType = 'transaction-started' | 'action-executing' | 'completed' | 'rollback' | 'failure'

export interface ActivityEvent {
  seq: number
  at: number
  type: ActivityEventType
  actionIndex?: number
  actionId?: string
}

export interface ActivityAction {
  index: number
  id?: string
  action: string
  summary: string
  status: ActivityActionStatus
}

export interface ActivityError {
  code: AiErrorCode
  stage: number
  message: string
  actionIndex?: number
  actionId?: string
  hint?: string
}

export interface ActivityRecord {
  id: string
  docId?: number
  label: string
  startedAt: number
  finishedAt?: number
  outcome: ActivityOutcome
  currentActionIndex?: number
  actions: ActivityAction[]
  events: ActivityEvent[]
  error?: ActivityError
  mutationCount: number
  entityBindings: AiEngineEntityBinding[]
}

export interface ActivityStoreOptions {
  now?: () => number
  idFactory?: () => string
}

export interface ActivityStore {
  start(plan: ValidatedPlan, label: string, docId?: number): ActivityRecord
  actionExecuting(recordId: string, index: number): ActivityRecord | null
  applied(
    recordId: string,
    mutationCount: number,
    actions: readonly AiEngineActionExecution[],
    bindings: readonly AiEngineEntityBinding[],
  ): ActivityRecord | null
  failed(
    recordId: string,
    issue: ValidationIssue | ActivityError,
    rolledBack: boolean,
    actions?: readonly AiEngineActionExecution[],
  ): ActivityRecord | null
  get(id: string): ActivityRecord | null
  list(): ActivityRecord[]
  subscribe(listener: (records: ActivityRecord[]) => void): () => void
  clear(): void
}

let nextActivityId = 1

function sanitize(value: string): string {
  return redactText(value).replace(/[\r\n\t]+/g, ' ').trim().slice(0, 500)
}

function sanitizeError(issue: ValidationIssue | ActivityError): ActivityError {
  return {
    code: issue.code,
    stage: issue.stage,
    message: sanitize(issue.message),
    ...(issue.actionIndex !== undefined ? { actionIndex: issue.actionIndex } : {}),
    ...(issue.actionId ? { actionId: sanitize(issue.actionId) } : {}),
    ...('hint' in issue && issue.hint ? { hint: sanitize(issue.hint) } : {}),
  }
}

function cloneRecord(record: ActivityRecord): ActivityRecord {
  return {
    ...record,
    actions: record.actions.map((action) => ({ ...action })),
    events: record.events.map((event) => ({ ...event })),
    entityBindings: record.entityBindings.map((binding) => ({ ...binding })),
    ...(record.error ? { error: { ...record.error } } : {}),
  }
}

function mergeEngineActions(
  local: ActivityAction[],
  engine: readonly AiEngineActionExecution[],
): ActivityAction[] {
  const byIndex = new Map(engine.map((action) => [action.index, action]))
  return local.map((action) => {
    const row = byIndex.get(action.index)
    if (!row) return { ...action }
    return {
      ...action,
      status: row.status,
      summary: sanitize(row.summary ?? action.summary),
    }
  })
}

export function createActivityStore(options: ActivityStoreOptions = {}): ActivityStore {
  const now = options.now ?? Date.now
  const idFactory = options.idFactory ?? (() => `ai-tx-${nextActivityId++}`)
  const records: ActivityRecord[] = []
  const listeners = new Set<(records: ActivityRecord[]) => void>()

  const publish = (): void => {
    const snapshot = records.map(cloneRecord)
    for (const listener of listeners) listener(snapshot)
  }
  const find = (id: string): ActivityRecord | undefined => records.find((record) => record.id === id)
  const event = (record: ActivityRecord, type: ActivityEventType, index?: number, id?: string): void => {
    record.events.push({
      seq: record.events.length,
      at: now(),
      type,
      ...(index !== undefined ? { actionIndex: index } : {}),
      ...(id ? { actionId: sanitize(id) } : {}),
    })
  }

  return {
    start(plan, label, docId) {
      const record: ActivityRecord = {
        id: idFactory(),
        ...(docId !== undefined ? { docId } : {}),
        label: sanitize(label),
        startedAt: now(),
        outcome: 'running',
        actions: plan.actions.map((action) => ({
          index: action.index,
          ...(action.id ? { id: sanitize(action.id) } : {}),
          action: sanitize(action.action),
          summary: sanitize(action.humanText),
          status: 'pending',
        })),
        events: [],
        mutationCount: 0,
        entityBindings: [],
      }
      event(record, 'transaction-started')
      records.push(record)
      publish()
      return cloneRecord(record)
    },
    actionExecuting(recordId, index) {
      const record = find(recordId)
      const action = record?.actions.find((row) => row.index === index)
      if (!record || record.outcome !== 'running' || !action) return null
      record.currentActionIndex = index
      action.status = 'executing'
      event(record, 'action-executing', action.index, action.id)
      publish()
      return cloneRecord(record)
    },
    applied(recordId, mutationCount, engineActions, bindings) {
      const record = find(recordId)
      if (!record || record.outcome !== 'running') return null
      record.actions = mergeEngineActions(record.actions, engineActions).map((action) => ({
        ...action,
        status: action.status === 'skipped' ? 'skipped' : 'applied',
      }))
      record.entityBindings = bindings.map((binding) => ({
        alias: sanitize(binding.alias),
        kind: binding.kind,
        id: binding.id,
      }))
      record.mutationCount = Math.max(0, Math.trunc(mutationCount))
      record.outcome = 'applied'
      record.finishedAt = now()
      delete record.currentActionIndex
      event(record, 'completed')
      publish()
      return cloneRecord(record)
    },
    failed(recordId, issue, rolledBack, engineActions = []) {
      const record = find(recordId)
      if (!record || record.outcome !== 'running') return null
      record.actions = mergeEngineActions(record.actions, engineActions)
      const failedIndex = issue.actionIndex
      record.actions = record.actions.map((action) => {
        if (action.status === 'failed' || action.status === 'rolled-back' || action.status === 'skipped') {
          return action
        }
        if (failedIndex === action.index) return { ...action, status: 'failed' }
        if (rolledBack && (failedIndex === undefined || action.index < failedIndex)) {
          return { ...action, status: 'rolled-back' }
        }
        return { ...action, status: 'skipped' }
      })
      record.error = sanitizeError(issue)
      record.outcome = rolledBack ? 'rolled-back' : 'failed'
      record.mutationCount = 0
      record.finishedAt = now()
      delete record.currentActionIndex
      if (rolledBack) event(record, 'rollback', issue.actionIndex, issue.actionId)
      event(record, 'failure', issue.actionIndex, issue.actionId)
      publish()
      return cloneRecord(record)
    },
    get(id) {
      const record = find(id)
      return record ? cloneRecord(record) : null
    },
    list() {
      return records.map(cloneRecord)
    },
    subscribe(listener) {
      listeners.add(listener)
      listener(records.map(cloneRecord))
      return () => listeners.delete(listener)
    },
    clear() {
      records.length = 0
      publish()
    },
  }
}

export const activityStore = createActivityStore()
