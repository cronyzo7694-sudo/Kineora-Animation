import { describe, expect, it } from 'vitest'
import {
  buildCapabilityRegistry,
  CapabilityError,
  parseEngineManifest,
} from './capabilities'

/** Mirrors the CURRENT engine manifest (snapshot.rs `capabilities()`). */
function currentEngineJson(): string {
  return JSON.stringify({
    v: 1,
    engine: 'kineora-core',
    manifestFormat: 'kineora-ai-manifest',
    shapes: ['rect', 'oval'],
    nodeFamilies: ['shape', 'symbol'],
    features: {
      classicTween: true,
      perKeyTransform: true,
      symbols: true,
      folders: true,
      instanceLoopModes: true,
      scenes: true,
      frameLabels: true,
      arrangeAlign: true,
      strokeAtDraw: true,
      selectionByIds: true,
      compositeUndo: true,
      nodeOpacity: false,
      namedEasings: false,
      paths: false,
      text: false,
      motionTween: false,
      shapeTween: false,
      masks: false,
      camera: false,
      audio: false,
    },
  })
}

describe('parseEngineManifest', () => {
  it('accepts the current engine manifest', () => {
    const m = parseEngineManifest(currentEngineJson())
    expect(m.shapes).toEqual(['rect', 'oval'])
    expect(m.features.classicTween).toBe(true)
    expect(m.features.paths).toBe(false)
  })

  it('rejects bad formats fail-closed', () => {
    expect(() => parseEngineManifest('x')).toThrow(CapabilityError)
    expect(() => parseEngineManifest('{"v":1}')).toThrow(CapabilityError)
    expect(() =>
      parseEngineManifest('{"v":1,"manifestFormat":"kineora-ai-manifest","shapes":[]}'),
    ).toThrow(/no shapes/)
  })
})

describe('CapabilityRegistry — generated from the manifest (single source of truth)', () => {
  it('shape.create mirrors the engine shape kinds exactly', () => {
    const reg = buildCapabilityRegistry(parseEngineManifest(currentEngineJson()), {})
    const create = reg.get('shape.create')
    expect(create?.state).toBe('supported')
    expect(create?.params.shape.options).toEqual(['rect', 'oval'])
    expect(create?.params.fill.required).toBe(true)
    expect(create?.mapsTo).toContain('draw_shape')
  })

  it('DYNAMIC DISCOVERY: a new engine shape lights up with ZERO registry changes', () => {
    const future = JSON.parse(currentEngineJson())
    future.shapes = ['rect', 'oval', 'polystar'] // tomorrow's engine
    future.features.polyStar = true
    const reg = buildCapabilityRegistry(parseEngineManifest(JSON.stringify(future)), {})
    expect(reg.get('shape.create')?.params.shape.options).toEqual(['rect', 'oval', 'polystar'])
  })

  it('feature gates flip state without any code edit (classicTween OFF → unsupported)', () => {
    const future = JSON.parse(currentEngineJson())
    future.features.classicTween = false
    const reg = buildCapabilityRegistry(parseEngineManifest(JSON.stringify(future)), {})
    const tw = reg.get('tween.classic.set')
    expect(tw?.state).toBe('unsupported')
  })

  it('stale-wasm probe degrades honestly (oval drops out, rect stays)', () => {
    const reg = buildCapabilityRegistry(parseEngineManifest(currentEngineJson()), {
      hasShapeDraw: false,
    })
    const create = reg.get('shape.create')
    expect(create?.params.shape.options).toEqual(['rect'])
    expect(create?.limitations?.join(' ')).toContain('too old')
  })
})

describe('CapabilityRegistry — honesty rows + prompt text', () => {
  const reg = buildCapabilityRegistry(parseEngineManifest(currentEngineJson()), {})

  it('today’s unsupported capabilities are PRESENT as unsupported rows (never invented)', () => {
    for (const action of ['path.draw', 'text.create', 'node.setOpacity', 'tween.motion.set']) {
      expect(reg.get(action)?.state).toBe('unsupported')
      expect(reg.get(action)?.limitations?.length).toBeGreaterThan(0)
    }
  })

  it('classic tween advertises the named-easing limitation (Penner not wired)', () => {
    expect(reg.get('tween.classic.set')?.limitations?.join(' ')).toContain('named easings')
    expect(reg.get('tween.classic.set')?.params.ease.min).toBe(-100)
    expect(reg.get('tween.classic.set')?.params.ease.max).toBe(100)
  })

  it('document lifecycle is deferred with the AI-REQ-112 honest sentence', () => {
    const row = reg.get('doc.open')
    expect(row?.state).toBe('deferred')
    expect(row?.limitations?.join(' ')).toContain('AI ke liye exposed nahi hai')
  })

  it('unknown actions are not in the registry (validator stage 3 fails closed)', () => {
    expect(reg.get('doc.deleteEverything')).toBeUndefined()
    expect(reg.get('path.magic')).toBeUndefined()
  })

  it('tier B rows mark destructive/structural actions for confirmation', () => {
    expect(reg.get('layer.delete')?.tier).toBe('B')
    expect(reg.get('frames.reverse')?.tier).toBe('B')
    expect(reg.get('doc.setSettings')?.tier).toBe('B')
    expect(reg.get('shape.create')?.tier).toBe('A')
  })

  it('prompt text separates supported / not-available / not-exposed sections', () => {
    const text = reg.toPromptText()
    expect(text).toContain('SUPPORTED (tier A):')
    expect(text).toContain('SUPPORTED (tier B')
    expect(text).toContain('NOT AVAILABLE')
    expect(text).toContain('NOT EXPOSED TO AI')
    expect(text).toContain('shape:enum*{rect|oval}')
    expect(text).toContain('ease:number*[-100..100]')
  })
})
