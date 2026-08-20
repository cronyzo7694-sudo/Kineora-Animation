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
        insertKeyframe(frame)
        notify(`keyframe inserted @ ${frame}`)
      }
      break
    case 'timeline.blank':
      if (!engineAttached()) return void notify(notAttached('blank keyframe'))
      {
        const st = statusJson()
        const frame = st?.playhead ?? 1
        notify(insertBlankKeyframe(frame) ? `blank keyframe @ ${frame}` : 'blank keyframe: blocked (locked layer)')
      }
      break
    case 'timeline.clear':
      if (!engineAttached()) return void notify(notAttached('clear keyframe'))
      {
        const st = statusJson()
        const frame = st?.playhead ?? 1
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
    const next = (st.playhead % (fps * 10)) + 1 // crude 10-second loop (slice 1)
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
