// ============================================================================
// MOD-BUS — the application event bus (SYS-01 §27 cross-system event contract).
//
// Single channel for cross-panel/cross-system notifications. Rules (from
// §27.0, applied here):
//  - failure: a subscriber that throws must NOT crash other subscribers or
//    the emitter — the error is routed to `bus.onError` (App wires a toast).
//  - duplicate: emitting the same event twice is idempotent (subscribers
//    re-render from the model; the payload is advisory only).
//  - stale: consumers must re-read the single source of truth (the engine /
//    model); the payload is a hint, never authoritative.
//  - sync: all events are delivered synchronously in emit() order.
//
// Engine-derived state (selection/timeline/document/…) is re-read from the
// engine each frame by the status poll — §27.0 explicitly sanctions this
// ("stale → consumers re-read model"). The bus carries the UI-owned events
// (tool/panel/workspace/playback/…) that the shell produces itself.
// ============================================================================

export interface BusEvents {
  'tool:changed': { toolId: string }
  'panel:changed': { id: string; change: 'visibility' | 'collapse' | 'resize'; visible?: boolean; collapsed?: boolean; size?: number }
  'workspace:changed': { name?: string; layout?: unknown }
  'playback:started': Record<string, never>
  'playback:stopped': Record<string, never>
  'playhead:moved': { frame: number }
  'saving:changed': { state: 'idle' | 'saving' | 'saved' | 'error'; time?: string }
  'export:done': { format: string }
  'mode:changed': { modeId: string; active: boolean }
  'snap:changed': { mode: string }
  'recording:changed': { active: boolean }
  'activeDoc:changed': { docId: number }
}

export type BusEventName = keyof BusEvents
export type BusHandler<K extends BusEventName> = (payload: BusEvents[K]) => void

export class EventBus {
  private listeners = new Map<BusEventName, Set<BusHandler<BusEventName>>>()
  private errorHandler: (event: BusEventName, error: unknown) => void = () => {}

  /** Register the failure sink (App routes this to a user-facing toast). */
  setErrorHandler(fn: (event: BusEventName, error: unknown) => void): void {
    this.errorHandler = fn
  }

  on<K extends BusEventName>(name: K, handler: BusHandler<K>): () => void {
    const set = this.listeners.get(name) ?? new Set<BusHandler<BusEventName>>()
    set.add(handler as BusHandler<BusEventName>)
    this.listeners.set(name, set)
    return () => this.off(name, handler)
  }

  off<K extends BusEventName>(name: K, handler: BusHandler<K>): void {
    this.listeners.get(name)?.delete(handler as BusHandler<BusEventName>)
  }

  once<K extends BusEventName>(name: K, handler: BusHandler<K>): () => void {
    const off = this.on(name, (p) => {
      off()
      handler(p)
    })
    return off
  }

  emit<K extends BusEventName>(name: K, payload: BusEvents[K]): void {
    const set = this.listeners.get(name)
    if (!set) return
    for (const h of [...set]) {
      try {
        ;(h as BusHandler<K>)(payload)
      } catch (err) {
        // failure isolation — one bad consumer never breaks the bus
        this.errorHandler(name, err)
      }
    }
  }

  /** Test-only: clear all listeners. */
  clear(): void {
    this.listeners.clear()
  }
}

/** The process-wide bus (single instance — one channel, no duplication). */
export const bus = new EventBus()
