// Engine-backed UI actions. Every control routes through here; when the engine
// is absent the action reports an explicit "engine not attached" message — it
// never fakes success (no-fake-features rule).

import {
  clearKeyframe,
  clearSelection,
  deleteFrame,
  deleteSelection,
  getEngine,
  getEngineStatus,
  insertBlankKeyframe,
  insertFrame,
  insertKeyframe,
  projectJson,
  redo,
  selectAll,
  setPlayhead as setPlayheadEngine,
  statusJson,
  undo,
} from './client'
import { bus } from '../bus'
import { clearInkSelection, deleteInkIds, inkCanRedo, inkCanUndo, inkRedo, inkUndo, selectedInkIds } from '../editor/inkStore'

export type Notify = (msg: string) => void

function engineAttached(): boolean {
  return getEngineStatus().kind === 'ok' && getEngine() !== null
}

function notAttached(action: string): string {
  return `${action}: engine not attached`
}

export function downloadBlob(name: string, text: string, type: string): void {
  const blob = new Blob([text], { type })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

/** Rasterize a canvas to a Blob and download it (PNG/JPEG/WebP image export). */
export function downloadCanvasBlob(canvas: HTMLCanvasElement, name: string, mime: string, quality?: number): void {
  canvas.toBlob((blob) => {
    if (!blob) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    a.click()
    URL.revokeObjectURL(a.href)
  }, mime, quality)
}

/** Discrete engine actions (undo/redo/keyframe/save/export). */
export function performAction(id: string, notify: Notify): void {
  switch (id) {
    case 'edit.undo':
      if (inkCanUndo()) {
        notify(inkUndo() ? 'undo: done' : 'undo: nothing to undo')
        break
      }
      if (!engineAttached()) return void notify(notAttached('undo'))
      notify(undo() ? 'undo: done' : 'undo: nothing to undo')
      break
    case 'edit.redo':
      if (inkCanRedo()) {
        notify(inkRedo() ? 'redo: done' : 'redo: nothing to redo')
        break
      }
      if (!engineAttached()) return void notify(notAttached('redo'))
      notify(redo() ? 'redo: done' : 'redo: nothing to redo')
      break
    case 'timeline.keyframe':
      if (!engineAttached()) return void notify(notAttached('keyframe'))
      {
        const st = statusJson()
        const frame = st?.playhead ?? 1
        const active = st?.layers?.[st.active_layer]
        if (active?.locked) return void notify('keyframe: locked layer — unlock to edit frames')
        notify(insertKeyframe(frame) ? `keyframe copied @ ${frame}` : `frame ${frame} is already a keyframe`)
      }
      break
    case 'timeline.blank':
      if (!engineAttached()) return void notify(notAttached('blank keyframe'))
      {
        const st = statusJson()
        const frame = st?.playhead ?? 1
        const active = st?.layers?.[st.active_layer]
        if (active?.locked) return void notify('blank keyframe: locked layer — unlock to edit frames')
        notify(insertBlankKeyframe(frame) ? `blank keyframe @ ${frame}` : 'blank keyframe: failed')
      }
      break
    case 'timeline.clear':
      if (!engineAttached()) return void notify(notAttached('clear keyframe'))
      {
        const st = statusJson()
        const frame = st?.playhead ?? 1
        const active = st?.layers?.[st.active_layer]
        if (active?.locked) return void notify('clear keyframe: locked layer — unlock to edit frames')
        notify(clearKeyframe(frame) ? `keyframe cleared @ ${frame}` : 'clear keyframe: no keyframe here')
      }
      break
    case 'timeline.insertframe':
      if (!engineAttached()) return void notify(notAttached('insert frame'))
      {
        const st = statusJson()
        const frame = st?.playhead ?? 1
        const active = st?.layers?.[st.active_layer]
        if (active?.locked) return void notify('insert frame: locked layer — unlock to edit frames')
        notify(insertFrame(frame) ? `frame inserted @ ${frame}` : 'insert frame: nothing after the playhead to shift')
      }
      break
    case 'timeline.deleteframe':
      if (!engineAttached()) return void notify(notAttached('delete frame'))
      {
        const st = statusJson()
        const frame = st?.playhead ?? 1
        const active = st?.layers?.[st.active_layer]
        if (active?.locked) return void notify('delete frame: locked layer — unlock to edit frames')
        notify(deleteFrame(frame) ? `frame deleted @ ${frame}` : 'delete frame: nothing to remove here')
      }
      break
    case 'file.save':
      void import('../file').then((m) => m.saveDocument(notify))
      break
    case 'edit.selectAll':
      if (!engineAttached()) return void notify(notAttached('select all'))
      selectAll()
      notify('select all: done')
      break
    case 'edit.deselectAll':
      if (!engineAttached()) return void notify(notAttached('deselect'))
      clearSelection()
      notify('deselect all: done')
      break
    default:
      notify(`no handler for ${id}`)
  }
}

// NOTE: File ▸ New / Open now live in `../file` (SYS-02 document lifecycle);
// actions.ts keeps only the discrete engine actions + playback transport.

// ——— playback (STM-PLAYBACK: IDLE → PLAYING ⇄ PAUSED → IDLE) ———
// Engineering 04 state machine. VIEW state (no undo, not persisted). The
// machine is the single source of truth for transport state; the menu label
// (Play/Pause), StatusBar chip and transport buttons all read playbackState().
//
//   IDLE  --play()-->   PLAYING   (emit playback:started; start tick)
//   PLAYING --pause()--> PAUSED   (emit playback:paused; stop tick)
//   PAUSED --play()-->  PLAYING   (emit playback:started; resume tick)
//   PLAYING/PAUSED --stop()--> IDLE (emit playback:stopped; stop tick)
//   PLAYING --seek(f)----> PLAYING (emit playhead:moved; tick keeps running)
//   PAUSED --seek(f)----> PAUSED  (emit playhead:moved)
// Forbidden transitions (e.g. play on empty doc) are no-ops + a status toast;
// they never throw or partially mutate.
let playTimer: number | null = null
let playback: 'IDLE' | 'PLAYING' | 'PAUSED' = 'IDLE'
// Loop playback toggle (Part 07 §7.1.5 / C-08 tl.loop) — VIEW state (no undo,
// not persisted). Default ON [OUR DESIGN DECISION — the blueprint specifies the
// toggle but not its initial state; looping matches the current behavior].
let loopEnabled = true

export function isLoopEnabled(): boolean {
  return loopEnabled
}

export function setLoopEnabled(on: boolean): void {
  loopEnabled = on
}

/** Current STM-PLAYBACK state (IDLE/PLAYING/PAUSED). */
export function playbackState(): 'IDLE' | 'PLAYING' | 'PAUSED' {
  return playback
}

/** True while the transport is advancing (timer running). */
export function isPlaying(): boolean {
  return playback === 'PLAYING'
}

/** True when paused mid-playback (Enter was pressed once while playing). */
export function isPaused(): boolean {
  return playback === 'PAUSED'
}

function clearTick(): void {
  if (playTimer !== null) {
    window.clearInterval(playTimer)
    playTimer = null
  }
}

function startTick(): void {
  // Idempotent: never stack two intervals (e.g. a redundant play while an
  // interval ref survived). Clear any existing tick first.
  clearTick()
  const fps = statusJson()?.fps ?? 24
  playTimer = window.setInterval(() => {
    const st = statusJson()
    if (!st) return
    // Playback range = [1, derived duration] (Part 07 §7.0; REQ-TIM-004).
    const dur = Math.max(1, st.duration ?? 1)
    if (!loopEnabled && st.playhead >= dur) {
      // Loop OFF → stop at the last frame (idle, playhead parked at end).
      stopPlayback()
      return
    }
    const next = st.playhead >= dur ? 1 : st.playhead + 1
    // Tick is NOT a user seek — call the engine directly (no playhead:moved
    // event; INT-0012: event is advisory and per-tick emission would flood).
    setPlayheadEngine(next)
  }, Math.round(1000 / fps))
}

/** Stop playback and return to IDLE. The playhead is NOT rewound here:
 *  "Rewind" is its own command (control.rewind / Ctrl+Alt+R), matching the
 *  Blueprint Control menu which lists Stop and Rewind separately. The eng-04
 *  "stop → playhead=first" side effect describes the combined Stop button;
 *  Blueprint (higher authority) separates the two, so Stop halts at the
 *  current frame. Recorded in AI-B_REPORT (no silent decision). */
export function stopPlayback(): void {
  if (playback === 'IDLE' && playTimer === null) return
  clearTick()
  playback = 'IDLE'
  bus.emit('playback:stopped', {})
}

/** Pause playback (PLAYING → PAUSED). No-op when not playing. */
export function pausePlayback(): void {
  if (playback !== 'PLAYING') return
  clearTick()
  playback = 'PAUSED'
  bus.emit('playback:paused', {})
}

/**
 * User-initiated seek (menu/button/shortcut) — sets the playhead AND emits
 * `playhead:moved{frame}` so panels can react (INT-0012). Playback ticks call
 * `setPlayheadEngine` directly to avoid per-frame event flooding.
 */
export function seekPlayhead(frame: number): void {
  const f = Math.max(1, Math.floor(frame) || 1)
  setPlayheadEngine(f)
  bus.emit('playhead:moved', { frame: f })
}

/** Toggle playback per STM-PLAYBACK: IDLE/PAUSED → PLAYING; PLAYING → PAUSED.
 *  Each tick is a REAL engine call (kineora_set_playhead). */
export function togglePlay(notify: Notify): void {
  if (!engineAttached()) {
    notify(notAttached('play'))
    return
  }
  if (playback === 'PLAYING') {
    pausePlayback()
    notify('play: paused')
    return
  }
  // IDLE or PAUSED → (re)start. PAUSED resumes from the current playhead.
  startTick()
  playback = 'PLAYING'
  bus.emit('playback:started', {})
  notify(playback === 'PLAYING' ? 'play: started' : 'play: resumed')
}

/** Best-effort convenience: step the playhead forward one frame (real call). */
export function stepPlayhead(notify: Notify): void {
  if (!engineAttached()) {
    notify(notAttached('play'))
    return
  }
  const st = statusJson()
  seekPlayhead((st?.playhead ?? 0) + 1)
  notify('play: stepped')
}
