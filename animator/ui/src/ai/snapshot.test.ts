import { describe, expect, it } from 'vitest'
import { buildSnapshotView, parseSceneSnapshot, SnapshotError } from './snapshot'

/** Mirrors snapshot.rs output for: layer "ball" w/ kf 1+15 (oval at 1), tween. */
function fixtureJson(): string {
  return JSON.stringify({
    v: 1,
    rev: 7,
    settings: { w: 1920, h: 1080, fps: 24, bg: '#ffffff', bgA: 1 },
    scene: { i: 0, name: 'Scene 1', count: 1 },
    active_layer: 0,
    playhead: 1,
    duration: 30,
    selection: [47],
    counts: { layers: 1, nodes: 1, keyframes: 2, tweens: 1, symbols: 1 },
    layers: [
      {
        i: 0,
        id: 7,
        name: 'ball',
        kind: 'normal',
        vis: true,
        lock: false,
        kf: [{ f: 1, n: 1 }, { f: 15, label: 'contact', n: 1 }],
        tw: [{ s: 1, e: 30, ease: 60 }],
      },
    ],
    nodes: [
      {
        id: 47,
        kind: 'oval',
        kf: [[0, 1], [0, 15]],
        x: 930, y: 100, sx: 1, sy: 1, r: 0,
        w: 60, h: 60,
        fill: '#e11d48',
        sw: 1,
      },
    ],
    library: [{ id: 3, name: 'Ball', type: 'graphic', uses: 0, dur: 12 }],
  })
}

describe('parseSceneSnapshot', () => {
  it('parses a valid engine snapshot', () => {
    const s = parseSceneSnapshot(fixtureJson())
    expect(s.rev).toBe(7)
    expect(s.settings.fps).toBe(24)
    expect(s.layers[0].tw[0]).toEqual({ s: 1, e: 30, ease: 60 })
    expect(s.nodes[0].fill).toBe('#e11d48')
    expect(s.nodes[0].stroke).toBeUndefined() // null stroke is omitted compactly
  })

  it('rejects garbage and wrong versions fail-closed', () => {
    expect(() => parseSceneSnapshot('not json')).toThrow(/parse fail/)
    expect(() => parseSceneSnapshot('{"v":2}')).toThrow(/unsupported snapshot version/)
    expect(() => parseSceneSnapshot('"a string"')).toThrow(/not an object/)
    let code: string | undefined
    try {
      parseSceneSnapshot('nope')
    } catch (e) {
      code = e instanceof SnapshotError ? e.code : undefined
    }
    expect(code).toBe('E_SNAPSHOT')
  })

  it('tolerates missing sections with safe defaults', () => {
    const s = parseSceneSnapshot('{"v":1}')
    expect(s.counts.nodes).toBe(0)
    expect(s.layers).toEqual([])
    expect(s.rev).toBe(0)
  })
})

describe('SceneSnapshotView — aliases + lookup (reference resolution feed)', () => {
  it('assigns deterministic aliases n1/l1/s1 in document order', () => {
    const v = buildSnapshotView(fixtureJson())
    expect(v.aliasOf(47, 'n')).toBe('n1')
    expect(v.aliasOf(7, 'l')).toBe('l1')
    expect(v.aliasOf(3, 's')).toBe('s1')
    expect(v.idOf('n1')).toBe(47)
    expect(v.idOf('l1')).toBe(7)
    expect(v.idOf('s1')).toBe(3)
    expect(v.idOf('n99')).toBeUndefined()
  })

  it('node()/layer()/symbol() resolve by id, alias, or bare alias number', () => {
    const v = buildSnapshotView(fixtureJson())
    expect(v.node(47)?.kind).toBe('oval')
    expect(v.node('n1')?.id).toBe(47)
    expect(v.node('1')?.id).toBe(47)
    expect(v.node('n2')).toBeUndefined()
    expect(v.layer(0)?.name).toBe('ball') // bare number = layer index
    expect(v.layer('l1')?.id).toBe(7)
    expect(v.symbol('s1')?.name).toBe('Ball')
  })

  it('is frozen — no mutation path through a snapshot (AI-REQ-003)', () => {
    const v = buildSnapshotView(fixtureJson())
    expect(Object.isFrozen(v.raw)).toBe(true)
    expect(Object.isFrozen(v.raw.nodes)).toBe(true)
    expect(Object.isFrozen(v.raw.nodes[0])).toBe(true)
  })
})

describe('SceneSnapshotView — prompt text', () => {
  it('renders a compact, information-complete prompt block', () => {
    const text = buildSnapshotView(fixtureJson()).toPromptText()
    expect(text).toContain('rev=7')
    expect(text).toContain('1920x1080 @24fps')
    expect(text).toContain('selection: n1')
    expect(text).toContain('layer l1 "ball"')
    expect(text).toContain('1..30 ease=60')
    expect(text).toContain('node n1 oval fill=#e11d48 stroke=none')
    expect(text).toContain('l1@1')
    expect(text).toContain('counts:')
  })

  it('truncates long names to keep tokens bounded', () => {
    const long = JSON.parse(fixtureJson())
    long.layers[0].name = 'x'.repeat(80)
    const text = buildSnapshotView(JSON.stringify(long)).toPromptText()
    expect(text).toContain('…')
    expect(text).not.toContain('x'.repeat(80))
  })
})
