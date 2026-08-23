// A6.3 — non-secret daily token ceiling preference + deterministic reservation.
// No numeric default and no pricing/billing model. Existing A2 UsageMeter owns
// actual daily/session counters; this module only stores/enforces the user cap.

import type { ChatMessage } from './adapters'
import type { StorageLike } from './keys'
import type { UsageTotals } from './usage'

export const AI_DAILY_TOKEN_CEILING_KEY = 'kineora.ai.dailyTokenCeiling.v1'

export interface DailyTokenCeilingStore {
  get(): number | null
  set(value: number): void
  clear(): void
  isExhausted(): boolean
  markExhausted(): void
}

export interface UsageReservation {
  allowed: boolean
  ceiling: number
  used: number
  reservedInput: number
  reservedOutput: number
  projected: number
}

interface PersistedCeiling {
  ceiling: number
  exhaustedDay?: string
}

function dayKey(now: () => number): string {
  return new Date(now()).toISOString().slice(0, 10)
}

function parse(raw: string | null): PersistedCeiling | null {
  if (!raw) return null
  try {
    const value: unknown = JSON.parse(raw)
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
    const record = value as Record<string, unknown>
    if (!Number.isSafeInteger(record.ceiling) || (record.ceiling as number) <= 0) return null
    return {
      ceiling: record.ceiling as number,
      ...(typeof record.exhaustedDay === 'string' ? { exhaustedDay: record.exhaustedDay } : {}),
    }
  } catch {
    return null
  }
}

export function createDailyTokenCeilingStore(
  storage?: StorageLike,
  now: () => number = Date.now,
): DailyTokenCeilingStore {
  let state = parse(storage?.getItem(AI_DAILY_TOKEN_CEILING_KEY) ?? null)

  const flush = (): void => {
    if (!storage) return
    if (!state) storage.removeItem(AI_DAILY_TOKEN_CEILING_KEY)
    else storage.setItem(AI_DAILY_TOKEN_CEILING_KEY, JSON.stringify(state))
  }

  return {
    get() {
      return state?.ceiling ?? null
    },
    set(value) {
      if (!Number.isSafeInteger(value) || value <= 0) {
        throw new Error('daily token ceiling must be a positive safe integer')
      }
      state = { ceiling: value }
      flush()
    },
    clear() {
      state = null
      flush()
    },
    isExhausted() {
      return state?.exhaustedDay === dayKey(now)
    },
    markExhausted() {
      if (!state) throw new Error('daily token ceiling is not configured')
      state = { ...state, exhaustedDay: dayKey(now) }
      flush()
    },
  }
}

/** A conservative upper bound: one token reserved per UTF-8 request byte. */
export function estimateInputReservation(messages: readonly ChatMessage[]): number {
  return new TextEncoder().encode(JSON.stringify(messages)).byteLength
}

export function checkUsageReservation(input: {
  ceiling: number
  today: UsageTotals
  messages: readonly ChatMessage[]
  maxTokens: number
}): UsageReservation {
  if (!Number.isSafeInteger(input.ceiling) || input.ceiling <= 0) {
    throw new Error('daily token ceiling must be configured')
  }
  if (!Number.isSafeInteger(input.maxTokens) || input.maxTokens <= 0) {
    throw new Error('maxTokens must be a positive safe integer')
  }
  const used = Math.max(0, input.today.inputTokens) + Math.max(0, input.today.outputTokens)
  const reservedInput = estimateInputReservation(input.messages)
  const projected = used + reservedInput + input.maxTokens
  return {
    allowed: projected <= input.ceiling,
    ceiling: input.ceiling,
    used,
    reservedInput,
    reservedOutput: input.maxTokens,
    projected,
  }
}
