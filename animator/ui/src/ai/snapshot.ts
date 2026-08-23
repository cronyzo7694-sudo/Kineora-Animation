// ===========================================================================
// AI SNAPSHOT — read-only, tiered, aliased, revision-stamped scene view
// (A3 / E-AI-2 / spec 06 + AI-REQ-001/003).
//
// The engine (snapshot.rs) returns compact truth. THIS layer adds what the
// prompt pipeline needs: defensive parsing, deterministic aliases (n1/l1/s1 —
// the model never memorizes raw ids and can never inject them, spec 06/15),
// by-ref lookup, and a token-bounded textual render. The view is frozen —
// code cannot mutate a document through a snapshot (AI-REQ-003).
//
// Staleness: `rev` comes from the engine's E-AI-4 counter. The orchestrator
// (A6) rebuilds a view per turn and after every transaction; the validator's
// apply-time checks (A4/A5) always run against LIVE state — this view is
// advisory, never authority.
// ===========================================================================

// ---------------------------------------------------------------------------
// Rows (mirrors snapshot.rs; unknown extra fields are ignored, missing fields
// get safe defaults — fail-closed on format/version mismatch instead).
// ---------------------------------------------------------------------------

export interface SnapSettingsRow {
  w: number
  h: number
  fps: number
  bg: string
  bgA: number
}

export interface SnapKfRow {
  f: number
  label?: string
  blank?: boolean
  n?: number
}

export interface SnapTweenRow {
  s: number
  e: number
  ease: number
}

export interface SnapLayerRow {
  i: number
  id: number
  name: string
  kind: string
  vis: boolean
  lock: boolean
  outline?: boolean
  oc?: string
  parent?: number
  collapsed?: boolean
  kf: SnapKfRow[]
  tw: SnapTweenRow[]
}

export interface SnapNodeRow {
  id: number
  kind: string
  /** [layerIndex, frame] membership pairs. */
  kf: Array<[number, number]>
  x?: number
  y?: number
  sx?: number
  sy?: number
  r?: number
  w?: number
  h?: number
  fill?: string
  stroke?: string
  sw?: number
  sym?: number
  lp?: string
  ff?: number
}

export interface SnapSymbolRow {
  id: number
  name: string
  type: string
  uses: number
  dur: number
}

export interface SceneSnapshot {
  v: number
  rev: number
  settings: SnapSettingsRow
  scene: { i: number; name: string; count: number }
  activeLayer: number
  playhead: number
  duration: number
  selection: number[]
  counts: { layers: number; nodes: number; keyframes: number; tweens: number; symbols: number }
  layers: SnapLayerRow[]
  nodes: SnapNodeRow[]
  library: SnapSymbolRow[]
}

export class SnapshotError extends Error {
  readonly code = 'E_SNAPSHOT'
  constructor(message: string) {
    super(message)
    this.name = 'SnapshotError'
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function numOr(v: unknown, d: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : d
}

function strOr(v: unknown, d: string): string {
  return typeof v === 'string' ? v : d
}

function boolOr(v: unknown, d: boolean): boolean {
  return typeof v === 'boolean' ? v : d
}

/** Parse + normalize engine snapshot JSON. Throws SnapshotError on garbage. */
export function parseSceneSnapshot(json: string): SceneSnapshot {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    throw new SnapshotError('snapshot JSON parse fail')
  }
  if (!isRecord(raw)) throw new SnapshotError('snapshot is not an object')
  if (raw.v !== 1) throw new SnapshotError(`unsupported snapshot version: ${String(raw.v)}`)

  const settings = isRecord(raw.settings) ? raw.settings : {}
  const scene = isRecord(raw.scene) ? raw.scene : {}
  const counts = isRecord(raw.counts) ? raw.counts : {}

  const layers: SnapLayerRow[] = Array.isArray(raw.layers)
    ? raw.layers.filter(isRecord).map((l) => ({
        i: numOr(l.i, 0),
        id: numOr(l.id, 0),
        name: strOr(l.name, ''),
        kind: strOr(l.kind, 'normal'),
        vis: boolOr(l.vis, true),
        lock: boolOr(l.lock, false),
        ...(l.outline === true ? { outline: true, oc: strOr(l.oc, '#ff0000') } : {}),
        ...(typeof l.parent === 'number' ? { parent: l.parent } : {}),
        ...(l.collapsed === true ? { collapsed: true } : {}),
        kf: Array.isArray(l.kf)
          ? l.kf.filter(isRecord).map((k) => ({
              f: numOr(k.f, 0),
              ...(typeof k.label === 'string' ? { label: k.label } : {}),
              ...(k.blank === true ? { blank: true } : {}),
              ...(typeof k.n === 'number' ? { n: numOr(k.n, 0) } : {}),
            }))
          : [],
        tw: Array.isArray(l.tw)
          ? l.tw
              .filter(isRecord)
              .map((t) => ({ s: numOr(t.s, 0), e: numOr(t.e, 0), ease: numOr(t.ease, 0) }))
          : [],
      }))
    : []

  const nodes: SnapNodeRow[] = Array.isArray(raw.nodes)
    ? raw.nodes.filter(isRecord).map((n) => {
        const row: SnapNodeRow = {
          id: numOr(n.id, 0),
          kind: strOr(n.kind, 'rect'),
          kf: Array.isArray(n.kf)
            ? n.kf
                .filter((p): p is [unknown, unknown] => Array.isArray(p) && p.length === 2)
                .map((p) => [numOr(p[0], 0), numOr(p[1], 0)] as [number, number])
            : [],
        }
        for (const key of ['x', 'y', 'sx', 'sy', 'r', 'w', 'h', 'sw', 'sym', 'ff'] as const) {
          if (typeof n[key] === 'number') row[key] = n[key] as number
        }
        if (typeof n.fill === 'string') row.fill = n.fill
        if (typeof n.stroke === 'string') row.stroke = n.stroke
        if (typeof n.lp === 'string') row.lp = n.lp
        return row
      })
    : []

  const library: SnapSymbolRow[] = Array.isArray(raw.library)
    ? raw.library.filter(isRecord).map((s) => ({
        id: numOr(s.id, 0),
        name: strOr(s.name, ''),
        type: strOr(s.type, 'graphic'),
        uses: numOr(s.uses, 0),
        dur: numOr(s.dur, 1),
      }))
    : []

  return {
    v: 1,
    rev: numOr(raw.rev, 0),
    settings: {
      w: numOr(settings.w, 1920),
      h: numOr(settings.h, 1080),
      fps: numOr(settings.fps, 24),
      bg: strOr(settings.bg, '#ffffff'),
      bgA: numOr(settings.bgA, 1),
    },
    scene: {
      i: numOr(scene.i, 0),
      name: strOr(scene.name, 'Scene 1'),
      count: numOr(scene.count, 1),
    },
    activeLayer: numOr(raw.active_layer, 0),
    playhead: numOr(raw.playhead, 1),
    duration: numOr(raw.duration, 1),
    selection: Array.isArray(raw.selection)
      ? raw.selection.filter((x): x is number => typeof x === 'number')
      : [],
    counts: {
      layers: numOr(counts.layers, 0),
      nodes: numOr(counts.nodes, 0),
      keyframes: numOr(counts.keyframes, 0),
      tweens: numOr(counts.tweens, 0),
      symbols: numOr(counts.symbols, 0),
    },
    layers,
    nodes,
    library,
  }
}

// ---------------------------------------------------------------------------
// View: aliases + lookup + frozen read-only access
// ---------------------------------------------------------------------------

export interface SceneSnapshotView {
  /** E-AI-4 revision at build time (staleness checks). */
  readonly rev: number
  /** Frozen parsed snapshot. */
  readonly raw: SceneSnapshot
  /** Deterministic alias for a node ('n1'…) / layer ('l1'…) / symbol ('s1'…). */
  aliasOf(id: number, kind: 'n' | 'l' | 's'): string | undefined
  /** Reverse: alias back to the real id (never trust model-produced ids). */
  idOf(alias: string): number | undefined
  /** Lookup by real id OR alias. */
  node(ref: number | string): SnapNodeRow | undefined
  layer(ref: number | string): SnapLayerRow | undefined
  symbol(ref: number | string): SnapSymbolRow | undefined
  /** Token-bounded text render for the prompt (A6 PromptBuilder consumes). */
  toPromptText(): string
}

function trunc(name: string): string {
  return name.length > 40 ? `${name.slice(0, 37)}…` : name
}

export function buildSnapshotView(json: string): SceneSnapshotView {
  const raw = parseSceneSnapshot(json)

  const aliasToId = new Map<string, number>()
  const idToAlias = new Map<string, string>() // `${kind}${id}` → alias
  raw.nodes.forEach((n, i) => {
    const alias = `n${i + 1}`
    aliasToId.set(alias, n.id)
    idToAlias.set(`n${n.id}`, alias)
  })
  raw.layers.forEach((l, i) => {
    const alias = `l${i + 1}`
    aliasToId.set(alias, l.id)
    idToAlias.set(`l${l.id}`, alias)
  })
  raw.library.forEach((s, i) => {
    const alias = `s${i + 1}`
    aliasToId.set(alias, s.id)
    idToAlias.set(`s${s.id}`, alias)
  })

  // Freeze the whole graph: a snapshot has NO write path (AI-REQ-003).
  const freezeDeep = <T>(v: T): T => {
    if (Array.isArray(v)) {
      v.forEach(freezeDeep)
      Object.freeze(v)
    } else if (typeof v === 'object' && v !== null) {
      Object.values(v).forEach(freezeDeep)
      Object.freeze(v)
    }
    return v
  }
  freezeDeep(raw)

  function resolve(ref: number | string, fallbackKind: 'n' | 'l' | 's'): number | undefined {
    if (typeof ref === 'number') return ref
    const id = aliasToId.get(ref)
    if (id !== undefined) return id
    return aliasToId.get(`${fallbackKind}${ref}`)
  }

  return {
    rev: raw.rev,
    raw,
    aliasOf(id, kind) {
      return idToAlias.get(`${kind}${id}`)
    },
    idOf(alias) {
      return aliasToId.get(alias)
    },
    node(ref) {
      const id = resolve(ref, 'n')
      return raw.nodes.find((n) => n.id === id)
    },
    layer(ref) {
      if (typeof ref === 'number') {
        // Bare numbers are layer INDICES (matching snapshot rows + session fns).
        return raw.layers.find((l) => l.i === ref)
      }
      const id = resolve(ref, 'l')
      return raw.layers.find((l) => l.id === id)
    },
    symbol(ref) {
      const id = resolve(ref, 's')
      return raw.library.find((s) => s.id === id)
    },
    toPromptText(): string {
      const s = raw.settings
      const lines: string[] = []
      lines.push(
        `KINEORA SNAPSHOT rev=${raw.rev} | stage ${s.w}x${s.h} @${s.fps}fps bg=${s.bg}` +
          ` | scene[${raw.scene.i}] "${trunc(raw.scene.name)}" (${raw.scene.count} scenes)` +
          ` | playhead=${raw.playhead} duration=${raw.duration}`,
      )
      const selAliases = raw.selection
        .map((id) => idToAlias.get(`n${id}`) ?? `#${id}`)
        .join(' ')
      lines.push(`selection: ${selAliases || '(none)'}`)
      for (const l of raw.layers) {
        const la = idToAlias.get(`l${l.id}`) ?? `l${l.i + 1}`
        const flags = [
          l.kind !== 'normal' ? l.kind : null,
          l.vis ? null : 'hidden',
          l.lock ? 'locked' : null,
          l.outline ? 'outline' : null,
          l.collapsed ? 'collapsed' : null,
        ]
          .filter(Boolean)
          .join(',')
        const kf = l.kf
          .map((k) => `${k.f}${k.blank ? '(blank)' : ''}${k.label ? ` "${trunc(k.label)}"` : ''}`)
          .join(',')
        const tw = l.tw.map((t) => `${t.s}..${t.e} ease=${t.ease}`).join(';')
        lines.push(
          `layer ${la} "${trunc(l.name)}"${flags ? ` [${flags}]` : ''} kf:${kf || '-'} tw:${tw || '-'}`,
        )
      }
      for (const n of raw.nodes) {
        const na = idToAlias.get(`n${n.id}`) ?? `n${n.id}`
        const where = n.kf.map(([li, f]) => `l${li + 1}@${f}`).join(',')
        if (n.kind === 'symbol') {
          const sa = n.sym !== undefined ? (idToAlias.get(`s${n.sym}`) ?? `s${n.sym}`) : '?'
          lines.push(
            `node ${na} symbol→${sa} at (${n.x},${n.y}) s(${n.sx},${n.sy}) r${n.r} on ${where}`,
          )
        } else {
          lines.push(
            `node ${na} ${n.kind} fill=${n.fill ?? '-'} stroke=${n.stroke ?? 'none'}/${n.sw ?? '-'}` +
              ` size=${n.w}x${n.h} at (${n.x},${n.y}) s(${n.sx},${n.sy}) r${n.r} on ${where}`,
          )
        }
      }
      if (raw.library.length > 0) {
        lines.push(
          `library: ${raw.library
            .map((sy) => `${idToAlias.get(`s${sy.id}`) ?? sy.id} "${trunc(sy.name)}" ${sy.type} uses=${sy.uses} dur=${sy.dur}`)
            .join(' | ')}`,
        )
      }
      lines.push(
        `counts: layers=${raw.counts.layers} nodes=${raw.counts.nodes} keyframes=${raw.counts.keyframes} tweens=${raw.counts.tweens} symbols=${raw.counts.symbols}`,
      )
      return lines.join('\n')
    },
  }
}
