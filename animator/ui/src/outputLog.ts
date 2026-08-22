// ============================================================================
// SYS-10 OUTPUT CONSOLE
//
// A lightweight, in-memory log surface for the Developer panel. Distinct from
// the ad-hoc toast array: toasts are user-facing transient notifications; the
// Output console is a developer-facing persistent log that records bus errors,
// handoff messages, engine events and explicit `output.*` commands for later
// inspection.
//
// Boundary (FL-0009, CROSS_SYSTEM_CONTRACT):
//   - This is VIEW/SESSION state (SYS-10). It is NOT written to the document,
//     never emits document:changed, never creates an undo entry, and is never
//     persisted (it survives only for the session; reload clears it).
//   - Other systems call appendOutput() to report; they do not own rendering.
//
// Capacity: bounded ring buffer (default 500 entries) so a runaway loop cannot
// grow memory unbounded. Subscribers are notified synchronously after append.
// ============================================================================

export type OutputLevel = 'info' | 'warn' | 'error' | 'debug'

export interface OutputEntry {
  /** Monotonic id (0-based); stable per session. */
  id: number
  /** ms since epoch (Date.now). */
  t: number
  level: OutputLevel
  /** Source tag, e.g. "bus", "engine", "handoff", "command". */
  source: string
  message: string
}

type Listener = (entries: OutputEntry[]) => void

const DEFAULT_CAPACITY = 500

export class OutputLog {
  private entries: OutputEntry[] = []
  private nextId = 0
  private listeners = new Set<Listener>()

  constructor(private readonly capacity = DEFAULT_CAPACITY) {}

  append(level: OutputLevel, source: string, message: string): OutputEntry {
    const entry: OutputEntry = {
      id: this.nextId++,
      t: Date.now(),
      level,
      source,
      message,
    }
    this.entries.push(entry)
    if (this.entries.length > this.capacity) {
      this.entries.splice(0, this.entries.length - this.capacity)
    }
    const snapshot = this.entries.slice()
    for (const l of this.listeners) {
      try {
        l(snapshot)
      } catch {
        // isolate a bad subscriber (matches bus failure isolation policy)
      }
    }
    return entry
  }

  clear(): void {
    this.entries = []
    // Reset the id counter too — clear is a full "wipe console", not just a
    // view filter. Subscribers see a fresh stream starting at id 0.
    this.nextId = 0
    const snapshot = this.entries.slice()
    for (const l of this.listeners) {
      try {
        l(snapshot)
      } catch {
        /* isolate */
      }
    }
  }

  all(): OutputEntry[] {
    return this.entries.slice()
  }

  size(): number {
    return this.entries.length
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    // immediate replay so a freshly-mounted panel sees prior entries
    try {
      fn(this.entries.slice())
    } catch {
      /* isolate */
    }
    return () => {
      this.listeners.delete(fn)
    }
  }
}

/**
 * Process-wide Output console (SYS-10). Single instance per runtime.
 * Importing modules may call convenience helpers (info/warn/error/debug).
 */
export const outputLog = new OutputLog()

export const outputInfo = (source: string, msg: string): OutputEntry => outputLog.append('info', source, msg)
export const outputWarn = (source: string, msg: string): OutputEntry => outputLog.append('warn', source, msg)
export const outputError = (source: string, msg: string): OutputEntry => outputLog.append('error', source, msg)
export const outputDebug = (source: string, msg: string): OutputEntry => outputLog.append('debug', source, msg)
