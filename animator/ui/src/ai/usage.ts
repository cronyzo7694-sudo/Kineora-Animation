// ===========================================================================
// AI USAGE — token/cost meter foundations (A2 / spec 11+20). Session counters
// in memory; DAILY totals persisted (they back the user-settable daily ceiling
// — AI-REQ-070 — enforced later by the orchestrator in A6). No provider
// billing APIs are polled; numbers come from response `usage` fields only and
// are therefore approximate.
// ===========================================================================

import type { StorageLike } from './keys'

export const AI_USAGE_KEY = 'kineora.ai.usage.v1'

export interface UsageRecord {
  configId: string
  model: string
  inputTokens?: number
  outputTokens?: number
}

export interface UsageTotals {
  requests: number
  inputTokens: number
  outputTokens: number
}

export interface UsageMeter {
  /** Record one completed request (call AFTER a successful complete()). */
  record(rec: UsageRecord): void
  session(): UsageTotals
  today(): UsageTotals
  resetSession(): void
  subscribe(fn: () => void): () => void
}

function dayKey(now: () => number): string {
  return new Date(now()).toISOString().slice(0, 10)
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function n(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0
}

export function createUsageMeter(storage?: StorageLike, now: () => number = Date.now): UsageMeter {
  let sessionTotals: UsageTotals = { requests: 0, inputTokens: 0, outputTokens: 0 }
  let day: UsageTotals = { requests: 0, inputTokens: 0, outputTokens: 0 }
  let dayStamp = dayKey(now)
  const listeners = new Set<() => void>()

  if (storage) {
    try {
      const raw = storage.getItem(AI_USAGE_KEY)
      if (raw) {
        const parsed: unknown = JSON.parse(raw)
        if (isRecord(parsed) && parsed.day === dayStamp && isRecord(parsed.totals)) {
          day = {
            requests: n(parsed.totals.requests),
            inputTokens: n(parsed.totals.inputTokens),
            outputTokens: n(parsed.totals.outputTokens),
          }
        }
      }
    } catch {
      /* corrupt blob: start fresh */
    }
  }

  function flush(): void {
    if (!storage) return
    storage.setItem(AI_USAGE_KEY, JSON.stringify({ day: dayStamp, totals: day }))
  }

  function emit(): void {
    for (const fn of [...listeners]) fn()
  }

  return {
    record(rec) {
      const inTok = n(rec.inputTokens)
      const outTok = n(rec.outputTokens)
      const currentDay = dayKey(now)
      if (currentDay !== dayStamp) {
        dayStamp = currentDay
        day = { requests: 0, inputTokens: 0, outputTokens: 0 }
      }
      for (const t of [sessionTotals, day]) {
        t.requests += 1
        t.inputTokens += inTok
        t.outputTokens += outTok
      }
      flush()
      emit()
    },
    session() {
      return { ...sessionTotals }
    },
    today() {
      return { ...day }
    },
    resetSession() {
      sessionTotals = { requests: 0, inputTokens: 0, outputTokens: 0 }
      emit()
    },
    subscribe(fn) {
      listeners.add(fn)
      return () => {
        listeners.delete(fn)
      }
    },
  }
}
