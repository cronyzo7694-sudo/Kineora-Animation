// SYS-03 H03 Find & Replace — command contract (AMB-S03-005).
// Five Blueprint targets only: text · fonts · colors · symbols · sounds.
// Text/fonts/sounds have no MOD-DOC entity yet → honest 0 matches (not invented).

export type FindTarget = 'text' | 'font' | 'color' | 'symbol' | 'sound'
export type ColorScope = 'document' | 'scene' | 'selection'
export type ColorChannel = 'fill' | 'stroke'

export interface ColorHit {
  nodeId: number
  channel: ColorChannel
  value: string
  locked: boolean
}

export interface SymbolHit {
  nodeId: number
  symbolId: number
  locked: boolean
}

export interface FindReplaceDoc {
  nodes?: Record<
    string,
    {
      Rect?: { fill?: string; stroke?: string | null }
      SymbolInstance?: { symbol_id?: number }
    }
  >
  scenes?: Array<{
    layers?: Array<{
      visible?: boolean
      locked?: boolean
      keyframes?: Record<string, { Keyframe?: { content?: number[] } } | string>
    }>
  }>
}

export function normalizeHex(c: string): string {
  const s = c.trim().toLowerCase()
  if (/^#[0-9a-f]{6}$/.test(s)) return s
  if (/^#[0-9a-f]{3}$/.test(s)) {
    return `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`
  }
  return s
}

function contentIds(layer: NonNullable<FindReplaceDoc['scenes']>[0]['layers'] extends (infer L)[] | undefined ? L : never): number[] {
  const ids: number[] = []
  const kfs = layer.keyframes ?? {}
  for (const rec of Object.values(kfs)) {
    if (rec && typeof rec === 'object' && rec.Keyframe?.content) ids.push(...rec.Keyframe.content)
  }
  return ids
}

function nodeOnLockedOrHidden(doc: FindReplaceDoc, nodeId: number): boolean {
  for (const sc of doc.scenes ?? []) {
    for (const layer of sc.layers ?? []) {
      if (contentIds(layer).includes(nodeId)) {
        return layer.locked === true || layer.visible === false
      }
    }
  }
  return false
}

function nodeInScene(doc: FindReplaceDoc, nodeId: number, sceneIndex: number): boolean {
  const sc = doc.scenes?.[sceneIndex]
  if (!sc) return false
  return (sc.layers ?? []).some((l) => contentIds(l).includes(nodeId))
}

export function findColors(
  doc: FindReplaceDoc,
  find: string,
  opts: { scope: ColorScope; sceneIndex: number; selection: number[]; fills: boolean; strokes: boolean },
): ColorHit[] {
  const needle = normalizeHex(find)
  if (!needle) return []
  const out: ColorHit[] = []
  const nodes = doc.nodes ?? {}
  for (const [idStr, node] of Object.entries(nodes)) {
    const id = Number(idStr)
    const rect = node.Rect
    if (!rect) continue
    if (opts.scope === 'selection' && !opts.selection.includes(id)) continue
    if (opts.scope === 'scene' && !nodeInScene(doc, id, opts.sceneIndex)) continue
    const locked = nodeOnLockedOrHidden(doc, id)
    if (opts.fills && rect.fill && normalizeHex(rect.fill) === needle) {
      out.push({ nodeId: id, channel: 'fill', value: rect.fill, locked })
    }
    if (opts.strokes && rect.stroke && normalizeHex(rect.stroke) === needle) {
      out.push({ nodeId: id, channel: 'stroke', value: rect.stroke, locked })
    }
  }
  return out
}

export function findSymbols(doc: FindReplaceDoc, symbolId: number): SymbolHit[] {
  const out: SymbolHit[] = []
  const nodes = doc.nodes ?? {}
  for (const [idStr, node] of Object.entries(nodes)) {
    const inst = node.SymbolInstance
    if (!inst || inst.symbol_id !== symbolId) continue
    const id = Number(idStr)
    out.push({ nodeId: id, symbolId, locked: nodeOnLockedOrHidden(doc, id) })
  }
  return out
}

export function editableColorHits(hits: ColorHit[]): ColorHit[] {
  return hits.filter((h) => !h.locked)
}

export function editableSymbolHits(hits: SymbolHit[]): SymbolHit[] {
  return hits.filter((h) => !h.locked)
}

export function unsupportedTargetReason(target: FindTarget): string | null {
  if (target === 'text' || target === 'font') return 'no text engine (SYS-07 / Node::Text absent) — 0 matches'
  if (target === 'sound') return 'no audio engine (SYS-26) — 0 matches'
  return null
}
