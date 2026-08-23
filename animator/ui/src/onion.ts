// Onion range + ghost list (Blueprint 15.2.2 / 08_ONION_SKIN.md §5).
// Pure: no DOM, no engine import — Stage supplies `evaluate`.

import type { RectItemJson } from './engine/wasmTypes'
import type { OnionPrefs } from './onionPrefs'

export interface OnionRange {
  start: number
  end: number
}

export interface OnionGhost {
  frame: number
  items: RectItemJson[]
  tint: string
  alpha: number
  outlines: boolean
}

/** Inclusive onion window. Follow travels with the playhead; anchor stays put. */
export function onionRange(prefs: OnionPrefs, playhead: number, duration: number): OnionRange {
  const ph = Math.max(1, playhead)
  const dur = Math.max(1, duration)
  if (prefs.mode === 'anchor') {
    const start = Math.max(1, Math.min(prefs.start, dur))
    const end = Math.max(start, Math.min(prefs.end, Math.max(dur, prefs.end)))
    return { start, end }
  }
  const start = Math.max(1, ph - Math.max(0, prefs.prev))
  const end = Math.max(start, ph + Math.max(0, prefs.next))
  return { start, end }
}

export function ghostAlpha(distance: number, startOpacity: number, decreaseBy: number): number {
  if (distance <= 0) return 0
  const a = startOpacity * Math.pow(1 - decreaseBy, distance)
  return a > 0 && Number.isFinite(a) ? a : 0
}

/**
 * Build the ghost pass. Current playhead is skipped (drawn in the content pass).
 * Hidden layers are already omitted by `evaluate`. Ghosts are never selectable.
 */
export function collectGhosts(
  evaluate: (frame: number) => RectItemJson[],
  prefs: OnionPrefs,
  playhead: number,
  duration: number,
): OnionGhost[] {
  if (!prefs.on) return []
  const { start, end } = onionRange(prefs, playhead, duration)
  const out: OnionGhost[] = []
  for (let f = start; f <= end; f++) {
    if (f === playhead) continue
    const distance = Math.abs(f - playhead)
    const alpha = ghostAlpha(distance, prefs.startOpacity, prefs.decreaseBy)
    if (alpha <= 0) continue
    const items = evaluate(f)
    if (items.length === 0) continue
    out.push({
      frame: f,
      items,
      tint: f < playhead ? prefs.pastTint : prefs.futureTint,
      alpha,
      outlines: prefs.outlines,
    })
  }
  return out
}
