// SYS-18 — Open from Libraries (Part 12 §12.2.14).
// Session-only: a read-only view of another project's Library. Copying an
// asset into the ACTIVE document is a real document mutation (undoable).

import { bus } from './bus'
import { activeDocId, hasImportSymbolsFacade, importSymbolsFromProject, library, newSymbol } from './engine/client'
import { prepareForLoad } from './persist'

export interface ExternalLibItem {
  id: number
  name: string
  type: string
  duration: number
}

export interface ExternalLibrary {
  title: string
  path: string
  /** Validated project JSON (formatVersion stamped). */
  content: string
  items: ExternalLibItem[]
}

let current: ExternalLibrary | null = null
const listeners = new Set<() => void>()

function emit(): void {
  for (const fn of [...listeners]) fn()
}

export function subscribeExternalLibrary(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function getExternalLibrary(): ExternalLibrary | null {
  return current
}

export function closeExternalLibrary(): void {
  current = null
  emit()
}

function symbolType(raw: unknown): string {
  if (raw === 'MovieClip' || raw === 'movieClip') return 'movieClip'
  if (raw === 'Button' || raw === 'button') return 'button'
  return 'graphic'
}

function durationOf(sym: Record<string, unknown>): number {
  const tl = sym.timeline
  if (!Array.isArray(tl)) return 1
  let max = 0
  for (const layer of tl) {
    if (!layer || typeof layer !== 'object') continue
    const kf = (layer as { keyframes?: Record<string, unknown> }).keyframes
    if (!kf || typeof kf !== 'object') continue
    for (const k of Object.keys(kf)) {
      const n = Number(k)
      if (Number.isFinite(n)) max = Math.max(max, n)
    }
  }
  return Math.max(1, max)
}

export function parseExternalLibrary(content: string, title: string, path = ''): ExternalLibrary | null {
  const prepared = prepareForLoad(content)
  if (!prepared.ok) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(prepared.content)
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object') return null
  const lib = (parsed as { library?: unknown }).library
  const items: ExternalLibItem[] = []
  if (Array.isArray(lib)) {
    for (const raw of lib) {
      if (!raw || typeof raw !== 'object') continue
      const s = raw as Record<string, unknown>
      // Rust SymbolId newtype serializes as a number; tolerate {0:n} too.
      let sid = 0
      if (typeof s.id === 'number') sid = s.id
      else if (s.id && typeof s.id === 'object' && '0' in (s.id as object)) sid = Number((s.id as { 0: number })[0])
      if (!Number.isFinite(sid) || sid <= 0) continue
      const name = typeof s.name === 'string' && s.name.trim() ? s.name.trim() : `Symbol ${sid}`
      items.push({
        id: sid,
        name,
        type: symbolType(s.symbol_type ?? s.symbolType),
        duration: durationOf(s),
      })
    }
  }
  return { title: title.replace(/\.json$/i, '') || 'External library', path, content: prepared.content, items }
}

export function openExternalLibraryFromContent(content: string, title: string, path = ''): ExternalLibrary | null {
  const lib = parseExternalLibrary(content, title, path)
  if (!lib) return null
  current = lib
  emit()
  return lib
}

function uniqueLocalName(base: string): string {
  const names = new Set(library().map((s) => s.name))
  if (!names.has(base)) return base
  const first = `${base} copy`
  if (!names.has(first)) return first
  let i = 2
  while (names.has(`${base} copy ${i}`)) i += 1
  return `${base} copy ${i}`
}

/** Copy one (or more) symbols into the active document. Returns new ids. */
export function copyExternalSymbols(ids: number[]): number[] {
  const lib = current
  if (!lib || ids.length === 0) return []
  if (activeDocId() === 0) return []
  if (hasImportSymbolsFacade()) {
    const out = importSymbolsFromProject(lib.content, ids)
    if (out.length) bus.emit('document:changed', { type: 'symbol', targets: out })
    return out
  }
  // Pre-import wasm: create empty symbols with the same name/type (honest).
  const out: number[] = []
  for (const id of ids) {
    const item = lib.items.find((it) => it.id === id)
    if (!item) continue
    const nid = newSymbol(uniqueLocalName(item.name), item.type)
    if (nid > 0) out.push(nid)
  }
  return out
}

export function __resetExternalLibraryForTests(): void {
  current = null
}
