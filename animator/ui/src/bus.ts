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
  /** H04 §10 / SYS-01 §27.1: a DOCUMENT mutation happened (edit/import/
   *  undo/redo — anything that may change the dirty snapshot relation).
   *  Producer: the engine client, post-mutation. Payload is advisory
   *  (consumers re-read the engine); `targets` = affected node ids when
   *  known, else []. Never emitted for view/session/workspace/pref changes. */
  'document:changed': { type: string; targets: number[] }
  /** SYS-01 §27.1 (canonical, INT-0010 approved): a LAYER mutation happened.
   *  Producer: MOD-LAYER (the engine client), post-mutation, in ADDITION to
   *  `document:changed{type:'layer'}`. Payload `{layerId, op}` is advisory —
   *  consumers re-read the engine (§27.0 stale rule). `layerId` = the layer's
   *  STABLE id (never an index — indices shift on reorder/delete).
   *  Batch ops ("all others") emit ONE event per affected layer.
   *  View-state changes (active-layer switch) NEVER emit this (no document
   *  mutation; the panels follow the status poll). */
  'layer:changed': { layerId: number; op: LayerOp }
  'export:done': { format: string; path?: string }
  'mode:changed': { modeId: string; active: boolean }
  'snap:changed': { mode: string }
  'recording:changed': { active: boolean }
  'activeDoc:changed': { docId: number }
  /** H02 D-AMB-004 (approved, locked): the ordered open-set changed.
   *  `activeDoc:changed` means ONLY "active pointer changed"; this event
   *  means ONLY "open-set changed". When both happen, emit this FIRST, then
   *  `activeDoc:changed` (H02 §14 — open-set is authoritative before the
   *  dependent UI consumes the active notification). */
  'openSet:changed': { change: 'added' | 'removed' | 'reordered'; docId?: number }
  /** SYS-01 §27.1 / SYS-03 H00 §8 — selection command/mutation update.
   *  Full schema is `{prevTargets,targets,kind,commonType,bounds}`; producers
   *  MUST send prevTargets+targets. Other fields are optional until SYS-14
   *  owns the complete MOD-SELECTION payload. */
  'selection:changed': {
    prevTargets: number[]
    targets: number[]
    kind?: string
    commonType?: string
    bounds?: { x: number; y: number; w: number; h: number } | null
  }
}

/** Layer-mutation op taxonomy for `layer:changed` (SYS-01 §27.1 "layer op" —
 *  the op VALUES are [INFERENCE] from the layer command set; the event name +
 *  payload shape are locked). Each maps to an undoable MOD-LAYER command. */
export type LayerOp =
  | 'added'
  | 'removed'
  | 'renamed'
  | 'visible'
  | 'locked'
  | 'outline'
  | 'outlineColor'
  | 'reordered'
  | 'duplicated'

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
