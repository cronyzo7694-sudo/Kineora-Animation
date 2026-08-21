// Engine-backed UI actions. Every control routes through here; when the engine
// is absent the action reports an explicit "engine not attached" message — it
// never fakes success (no-fake-features rule).

import {
  clearKeyframe,
  clearSelection,
  deleteFrame,
  getEngine,
  getEngineStatus,
  insertBlankKeyframe,
  insertFrame,
  insertKeyframe,
  projectJson,
  redo,
  selectAll,
  setPlayhead,
  statusJson,
  undo,
} from './client'
import { bus } from '../bus'

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
      if (!engineAttached()) return void notify(notAttached('undo'))
      notify(undo() ? 'undo: done' : 'undo: nothing to undo')
      break
    case 'edit.redo':
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
      if (!engineAttached()) return void notify(notAttached('save'))
      {
        downloadBlob('kineora-project.json', projectJson(), 'application/json')
        bus.emit('saving:changed', { state: 'saved', time: new Date().toLocaleTimeString() })
        notify('save: downloaded kineora-project.json')
      }
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

// ——— playback (slice-1: a real engine playhead loop, stepped by the UI) ———
let playTimer: number | null = null
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

export function isPlaying(): boolean {
  return playTimer !== null
}

export function stopPlayback(): void {
  if (playTimer !== null) {
    window.clearInterval(playTimer)
    playTimer = null
    bus.emit('playback:stopped', {})
  }
}

/** Toggle playback. Each tick is a REAL engine call (kineora_set_playhead). */
export function togglePlay(notify: Notify): void {
  if (!engineAttached()) {
    notify(notAttached('play'))
    return
  }
  if (playTimer !== null) {
    stopPlayback()
    notify('play: paused')
    return
  }
  const fps = statusJson()?.fps ?? 24
  playTimer = window.setInterval(() => {
    const st = statusJson()
    if (!st) return
    // Playback range = [1, derived duration] (Part 07 §7.0; REQ-TIM-004).
    const dur = Math.max(1, st.duration ?? 1)
    if (!loopEnabled && st.playhead >= dur) {
      // Loop OFF → stop at the last frame (pause at end).
      stopPlayback()
      notify('play: finished (loop off)')
      return
    }
    const next = st.playhead >= dur ? 1 : st.playhead + 1
    setPlayhead(next)
  }, Math.round(1000 / fps))
  bus.emit('playback:started', {})
  notify('play: started')
}

/** Best-effort convenience: step the playhead forward one frame (real call). */
export function stepPlayhead(notify: Notify): void {
  if (!engineAttached()) {
    notify(notAttached('play'))
    return
  }
  const st = statusJson()
  setPlayhead((st?.playhead ?? 0) + 1)
  notify('play: stepped')
}
