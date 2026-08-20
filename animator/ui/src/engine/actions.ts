// Engine-backed UI actions. Every control routes through here; when the engine
// is absent the action reports an explicit "engine not attached" message — it
// never fakes success (no-fake-features rule).

import {
  clearKeyframe,
  getEngine,
  getEngineStatus,
  insertBlankKeyframe,
  insertKeyframe,
  projectJson,
  redo,
  setPlayhead,
  statusJson,
  undo,
} from './client'

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
    case 'file.save':
      if (!engineAttached()) return void notify(notAttached('save'))
      {
        downloadBlob('kineora-project.json', projectJson(), 'application/json')
        notify('save: downloaded kineora-project.json')
      }
      break
    default:
      notify(`no handler for ${id}`)
  }
}

// ——— playback (slice-1: a real engine playhead loop, stepped by the UI) ———
let playTimer: number | null = null

export function isPlaying(): boolean {
  return playTimer !== null
}

export function stopPlayback(): void {
  if (playTimer !== null) {
    window.clearInterval(playTimer)
    playTimer = null
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
    // Loop over the DERIVED duration (Part 07 §7.0; engineering REQ-TIM-004
    // "seek clamps to [1,duration]") — the playhead never flies past the
    // animation range.
    const dur = Math.max(1, st.duration ?? 1)
    const next = st.playhead >= dur ? 1 : st.playhead + 1
    setPlayhead(next)
  }, Math.round(1000 / fps))
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
