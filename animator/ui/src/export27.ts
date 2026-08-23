// ============================================================================
// SYS-27 IMPORT/EXPORT/PUBLISH — MOD-EXPORT (TS engines, slice 1)
//
// Owner: SYS-27 (AI-D). Replaces two H08 "integration gap" handoff toasts
// with REAL engines, exactly where eng 14 defines them:
//
//   • SEQUENCE export (eng 14 "Sequence: range (#First/#Last) + sidecar
//     fps"): SVG frame files `<base>_NNNN.svg` for a validated frame range
//     + a `<base>_sequence.json` sidecar carrying the fps.
//   • HTML5 publish (eng 14 "HTML5: JS bundle + … + preloader + loop";
//     Part 28.8; P-8 platform default = HTML5 Canvas): ONE self-contained
//     .html file embedding every timeline frame (same `evaluate()` pass as
//     playback — authoring = export) + a JS frame player with fps + loop.
//
// Shared rules honored (eng 14): export uses the SAME evaluate as playback ·
// authoring overlays can never leak (the Rust exporter renders the content
// pass only) · export is NON-MUTATING (no dirty, no undo) · a failed/invalid
// export produces NO files and NO event (INV-ERR-1/2 — everything is built
// BEFORE anything is emitted/downloaded).
//
// Event contract (CROSS_SYSTEM_CONTRACT §D): `export:done{format, path}` —
// producer = SYS-27 (this module is the FIRST emitter; SYS-02 never emits
// it). Emitted ONCE per successful export, after the files are handed to the
// download sink. In browser dev mode `path` = the primary file name (the
// download target is pathless — same honesty rule as SYS-02 Save).
//
// Honest scope (recorded, not hidden — see AI-D_REPORT):
//   • GIF / video (MP4/WebM) / movie stay HANDOFF TOASTS — they need an
//     encoder pipeline (worker pool, muxing) that this slice does not fake.
//   • Cancellable long-running export jobs (STM-EXPORT) = later increment;
//     this slice's exports are synchronous over the rect-model and complete
//     or fail atomically.
//   • IMPORT engines are BLOCKED on MOD-DOC asset entities (BLK-D-006) —
//     the current document model has no bitmap/audio/vector-asset nodes to
//     import INTO. Registered, not guessed.
// ============================================================================

import { bus } from './bus'
import { downloadBlob } from './engine/actions'
import { evaluate, exportSvgScaled, getEngine, getEngineStatus, statusJson } from './engine/client'
import { listInk } from './editor/inkStore'
import { inkToSvg, rasterizeContent } from './render/canvasRenderer'

export interface ExportFile {
  name: string
  content: string
  mime: string
}

export type Notify = (msg: string) => void

function engineOk(): boolean {
  return getEngineStatus().kind === 'ok' && getEngine() !== null
}

/** Frame files are 4-digit padded (`base_0001.svg`) — stable lexicographic
 *  order for downstream tools (eng 14 sequence naming #First/#Last). */
export function sequenceFrameName(baseName: string, frame: number): string {
  return `${baseName}_${String(frame).padStart(4, '0')}.svg`
}

export interface SequenceOptions {
  /** First frame (1-based, inclusive). */
  first: number
  /** Last frame (inclusive). Must be within the document duration. */
  last: number
  /** Supersampling scale (Part 28.1: 1/2/4). Invalid → 1. */
  scale: number
  baseName: string
}

export type BuildResult = { ok: true; files: ExportFile[] } | { ok: false; error: string }

/**
 * Build an SVG frame sequence + fps sidecar (eng 14). PURE with respect to
 * the download sink: returns the complete file list or an error — nothing is
 * written here, so an invalid range can never leave partial output
 * (REQ-EXP-C's "no partials" for the synchronous slice).
 */
export function buildSvgSequence(opts: SequenceOptions): BuildResult {
  if (!engineOk()) return { ok: false, error: 'export: engine not attached' }
  const st = statusJson()
  if (!st) return { ok: false, error: 'export: no document open' }
  const duration = Math.max(1, st.duration)
  const first = Math.trunc(opts.first)
  const last = Math.trunc(opts.last)
  if (!Number.isFinite(opts.first) || !Number.isFinite(opts.last) || first < 1 || last < first) {
    return { ok: false, error: 'export: invalid frame range (need 1 ≤ first ≤ last)' }
  }
  if (last > duration) {
    return { ok: false, error: `export: last frame ${last} exceeds the timeline (${duration})` }
  }
  const scale = Number.isFinite(opts.scale) && opts.scale > 0 ? opts.scale : 1
  const base = opts.baseName.trim() || 'kineora'
  const files: ExportFile[] = []
  for (let f = first; f <= last; f++) {
    let svg = exportSvgScaled(f, scale)
    if (!svg) return { ok: false, error: `export: engine returned no SVG for frame ${f}` }
    const ink = inkToSvg(listInk(), st.background ?? '#ffffff')
    if (ink) svg = svg.replace(/<\/svg>\s*$/i, `${ink}</svg>`)
    files.push({ name: sequenceFrameName(base, f), content: svg, mime: 'image/svg+xml' })
  }
  // eng 14: "Sequence: range (#First/#Last) + sidecar fps"
  files.push({
    name: `${base}_sequence.json`,
    content: JSON.stringify({ format: 'svg-sequence', first, last, count: last - first + 1, fps: st.fps, scale }),
    mime: 'application/json',
  })
  return { ok: true, files }
}

export interface PublishOptions {
  baseName: string
  /** eng 14 HTML5 "loop" — default true (Blueprint Part 28 preview loops). */
  loop: boolean
  /** Supersampling scale for the embedded frames. Invalid → 1. */
  scale: number
}

/**
 * Build the HTML5 publish output (slice 1): one self-contained HTML file
 * embedding every timeline frame (1..duration) as SVG + a minimal player
 * (preloader-free by construction — frames are inline) honoring fps + loop.
 */
export function buildHtml5Publish(opts: PublishOptions): BuildResult {
  if (!engineOk()) return { ok: false, error: 'publish: engine not attached' }
  const st = statusJson()
  if (!st) return { ok: false, error: 'publish: no document open' }
  const duration = Math.max(1, st.duration)
  const scale = Number.isFinite(opts.scale) && opts.scale > 0 ? opts.scale : 1
  const base = opts.baseName.trim() || 'kineora'
  const frames: string[] = []
  for (let f = 1; f <= duration; f++) {
    const svg = exportSvgScaled(f, scale)
    if (!svg) return { ok: false, error: `publish: engine returned no SVG for frame ${f}` }
    frames.push(svg)
  }
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(base)} — Kineora Animation</title>
<style>html,body{margin:0;height:100%;display:flex;align-items:center;justify-content:center;background:#111}#stage svg{display:block;max-width:100vw;max-height:100vh}</style>
</head>
<body>
<div id="stage"></div>
<script>
(function () {
  "use strict";
  var frames = ${JSON.stringify(frames)};
  var fps = ${JSON.stringify(st.fps)};
  var loop = ${JSON.stringify(opts.loop)};
  var stage = document.getElementById("stage");
  var i = 0, interval = 1000 / fps, last = 0;
  stage.innerHTML = frames[0];
  function tick(now) {
    if (!last) last = now;
    if (now - last >= interval) {
      last += interval * Math.floor((now - last) / interval);
      i += 1;
      if (i >= frames.length) {
        if (!loop) return; // hold on the final frame (no loop)
        i = 0;
      }
      stage.innerHTML = frames[i];
    }
    window.requestAnimationFrame(tick);
  }
  if (frames.length > 1) window.requestAnimationFrame(tick);
})();
</script>
</body>
</html>
`
  return { ok: true, files: [{ name: `${base}.html`, content: html, mime: 'text/html' }] }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Hand a built export to the download sink and emit `export:done` ONCE
 * (contract §D — after the files are handed over; never on failure).
 * Returns true on success. The download sink is the SAME dev-mode boundary
 * the image export dialog already uses (native file-target = later
 * increment, recorded).
 */
export function deliverExport(format: string, result: BuildResult, notify: Notify): boolean {
  if (!result.ok) {
    notify(result.error)
    return false
  }
  for (const f of result.files) downloadBlob(f.name, f.content, f.mime)
  const primary = result.files[0]?.name ?? ''
  bus.emit('export:done', { format, path: primary })
  notify(`export: ${result.files.length} file${result.files.length === 1 ? '' : 's'} — ${primary}`)
  return true
}

/** `file.publish` engine entry (P-8 default platform = HTML5 Canvas). */
/** Encode the timeline as a WebM video (browser MediaRecorder). */
export async function exportWebmVideo(
  opts: { first: number; last: number; scale: number; fps?: number },
  notify: Notify,
): Promise<boolean> {
  if (!engineOk()) {
    notify('export video: engine not attached')
    return false
  }
  const st = statusJson()
  if (!st) {
    notify('export video: no document open')
    return false
  }
  const first = Math.max(1, Math.trunc(opts.first))
  const last = Math.max(first, Math.trunc(opts.last))
  const fps = Math.max(1, Math.min(60, opts.fps ?? st.fps ?? 24))
  const scale = opts.scale > 0 ? opts.scale : 1
  const ink = listInk()
  const frames: HTMLCanvasElement[] = []
  for (let f = first; f <= last; f++) {
    const canvas = rasterizeContent(
      {
        background: st.background ?? '#ffffff',
        stageW: st.doc_width ?? 1920,
        stageH: st.doc_height ?? 1080,
        items: evaluate(f),
        inkItems: ink,
      },
      scale,
    )
    if (!canvas) {
      notify('export video: rasterizer unavailable')
      return false
    }
    frames.push(canvas)
  }
  if (typeof MediaRecorder === 'undefined') {
    notify('export video: this browser cannot record WebM (MediaRecorder missing)')
    return false
  }
  const out = document.createElement('canvas')
  out.width = frames[0].width
  out.height = frames[0].height
  const ctx = out.getContext('2d')
  if (!ctx) {
    notify('export video: no 2D context')
    return false
  }
  const stream = out.captureStream(fps)
  const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
      ? 'video/webm;codecs=vp8'
      : 'video/webm'
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_000_000 })
  const chunks: BlobPart[] = []
  rec.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data)
  }
  const done = new Promise<Blob>((resolve, reject) => {
    rec.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }))
    rec.onerror = () => reject(new Error('recorder failed'))
  })
  rec.start()
  const interval = 1000 / fps
  for (const frame of frames) {
    ctx.drawImage(frame, 0, 0)
    await new Promise((r) => setTimeout(r, interval))
  }
  rec.stop()
  stream.getTracks().forEach((t) => t.stop())
  let blob: Blob
  try {
    blob = await done
  } catch {
    notify('export video: recording failed')
    return false
  }
  if (blob.size === 0) {
    notify('export video: empty file — try Chrome/Edge')
    return false
  }
  const name = `${(st.doc_title ?? 'kineora').trim() || 'kineora'}.webm`
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
  bus.emit('export:done', { format: 'video', path: name })
  notify(`Exported video “${name}” (${last - first + 1} frames @ ${fps} fps) — check Downloads`)
  return true
}

export function publishHtml5(notify: Notify): boolean {
  const st = statusJson()
  const base = (st as { doc_title?: string } | null)?.doc_title?.trim() || 'kineora'
  return deliverExport('html5', buildHtml5Publish({ baseName: base, loop: true, scale: 1 }), notify)
}
