// Per-object extras that the WASM node model does not own: lock, name,
// opacity, blend, bitmap fill. Persisted beside ink in the project JSON.

import { bus } from '../bus'

export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay'

export interface ObjExtra {
  locked?: boolean
  name?: string
  opacity?: number
  blend?: BlendMode
  /** data-URL or blob URL for a bitmap fill (Adobe “Bitmap fill”). */
  fillImage?: string | null
}

const extras = new Map<number, ObjExtra>()
const listeners = new Set<() => void>()

function emit(): void {
  for (const l of listeners) l()
}

export function subscribeObjProps(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getObjExtra(id: number): ObjExtra {
  return extras.get(id) ?? {}
}

export function isObjectLocked(id: number): boolean {
  return !!extras.get(id)?.locked
}

export function anyLocked(ids: number[]): boolean {
  return ids.some((id) => isObjectLocked(id))
}

export function setObjExtra(id: number, patch: Partial<ObjExtra>): void {
  const prev = extras.get(id) ?? {}
  const next = { ...prev, ...patch }
  extras.set(id, next)
  emit()
  bus.emit('document:changed', { type: 'transform', targets: [id] })
}

export function setObjectsLocked(ids: number[], locked: boolean): void {
  for (const id of ids) {
    const prev = extras.get(id) ?? {}
    extras.set(id, { ...prev, locked })
  }
  emit()
  bus.emit('document:changed', { type: 'transform', targets: ids })
}

export function serializeObjExtras(): Record<string, ObjExtra> {
  const o: Record<string, ObjExtra> = {}
  for (const [id, v] of extras) o[String(id)] = v
  return o
}

export function restoreObjExtras(raw: unknown): void {
  extras.clear()
  if (!raw || typeof raw !== 'object') {
    emit()
    return
  }
  for (const [k, v] of Object.entries(raw as Record<string, ObjExtra>)) {
    const id = Number(k)
    if (Number.isFinite(id) && v && typeof v === 'object') extras.set(id, { ...v })
  }
  emit()
}

export function resetObjExtrasForTests(): void {
  extras.clear()
}