import { describe, expect, it } from 'vitest'
import { buildCapabilityRegistry, parseEngineManifest } from './capabilities'
import {
  ContextError,
  createConversationContextStore,
  MAX_CONTEXT_TURN_BYTES,
} from './context'
import { buildPrompt } from './prompt'
import { registerSecret, unregisterSecret } from './redact'
import { buildSnapshotView } from './snapshot'

function engineJson(): string {
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
      playbackAutomation: false,
    },
  })
}

function snapshot(options: { rev?: number; node?: boolean; layer?: boolean; symbol?: boolean } = {}): string {
  const hasNode = options.node !== false
  const hasLayer = options.layer !== false
  const hasSymbol = options.symbol !== false
  return JSON.stringify({
    v: 1,
    rev: options.rev ?? 5,
    settings: { w: 800, h: 600, fps: 24, bg: '#ffffff', bgA: 1 },
    scene: { i: 0, name: 'Scene 1', count: 1 },
    active_layer: 0,
    playhead: 1,
    duration: 1,
    selection: hasNode ? [100] : [],
    counts: {
      layers: hasLayer ? 1 : 0,
      nodes: hasNode ? 1 : 0,
      keyframes: hasLayer ? 1 : 0,
      tweens: 0,
      symbols: hasSymbol ? 1 : 0,
    },
    layers: hasLayer
      ? [{ i: 0, id: 10, name: 'Art', kind: 'normal', vis: true, lock: false, kf: [{ f: 1, n: hasNode ? 1 : 0 }], tw: [] }]
      : [],
    nodes: hasNode
      ? [{ id: 100, kind: 'oval', kf: [[0, 1]], x: 10, y: 20, sx: 1, sy: 1, r: 0, w: 20, h: 20, fill: '#ff0000', sw: 0 }]
      : [],
    library: hasSymbol
      ? [{ id: 50, name: 'Ball', type: 'graphic', uses: 1, dur: 1 }]
      : [],
  })
}

function registry() {
  return buildCapabilityRegistry(parseEngineManifest(engineJson()), { hasShapeDraw: true })
}

function view(options?: { rev?: number; node?: boolean; layer?: boolean; symbol?: boolean }) {
  return buildSnapshotView(snapshot(options))
}

describe('A6.2 per-document conversation isolation', () => {
  it('never exposes document A turns in B or B turns in A', () => {
    const store = createConversationContextStore()
    store.appendTurn(1, { role: 'user', content: 'A-only' })
    store.appendTurn(2, { role: 'assistant', content: 'B-only' })
    expect(store.get(1).turns.map((turn) => turn.content)).toEqual(['A-only'])
    expect(store.get(2).turns.map((turn) => turn.content)).toEqual(['B-only'])
    expect(JSON.stringify(store.get(1))).not.toContain('B-only')
    expect(JSON.stringify(store.get(2))).not.toContain('A-only')
  })

  it('switching A → B → A preserves each independent thread', () => {
    const store = createConversationContextStore()
    store.appendTurn(8, { role: 'user', content: 'A1' })
    expect(store.get(9).turns).toEqual([])
    store.appendTurn(9, { role: 'user', content: 'B1' })
    store.appendTurn(8, { role: 'assistant', content: 'A2' })
    expect(store.get(8).turns.map((turn) => turn.content)).toEqual(['A1', 'A2'])
    expect(store.get(9).turns.map((turn) => turn.content)).toEqual(['B1'])
    expect(store.documentIds()).toEqual([8, 9])
  })

  it('discarding a closed document removes only that document context', () => {
    const store = createConversationContextStore()
    store.appendTurn(1, { role: 'user', content: 'A' })
    store.appendTurn(2, { role: 'user', content: 'B' })
    store.discardDocument(1)
    expect(store.has(1)).toBe(false)
    expect(store.get(1).turns).toEqual([])
    expect(store.get(2).turns[0]?.content).toBe('B')
  })
})

describe('A6.2 structural 12-turn bound + ordering', () => {
  it('retains exactly 12 turns and drops the oldest on the 13th', () => {
    const store = createConversationContextStore()
    for (let i = 0; i < 12; i++) store.appendTurn(1, { role: i % 2 ? 'assistant' : 'user', content: `t${i}` })
    expect(store.get(1).turns).toHaveLength(12)
    store.appendTurn(1, { role: 'user', content: 't12' })
    expect(store.get(1).turns).toHaveLength(12)
    expect(store.get(1).turns.map((turn) => turn.content)).toEqual(
      Array.from({ length: 12 }, (_, index) => `t${index + 1}`),
    )
  })

  it('repeated insertion can never create a hidden unbounded turn array', () => {
    const store = createConversationContextStore()
    for (let i = 0; i < 1_000; i++) store.appendTurn(1, { role: 'user', content: `turn-${i}` })
    const turns = store.get(1).turns
    expect(turns).toHaveLength(12)
    expect(turns[0]?.content).toBe('turn-988')
    expect(turns[11]?.content).toBe('turn-999')
  })

  it('preserves chronological role/content ordering deterministically', () => {
    const store = createConversationContextStore()
    store.appendTurn(1, { role: 'user', content: 'one' })
    store.appendTurn(1, { role: 'assistant', content: 'two' })
    store.appendTurn(1, { role: 'user', content: 'three' })
    expect(store.get(1).turns).toEqual([
      { role: 'user', content: 'one' },
      { role: 'assistant', content: 'two' },
      { role: 'user', content: 'three' },
    ])
  })
})

describe('A6.2 clear/reset and document safety', () => {
  it('clear removes turns, bindings, and transient thread state without touching document data', () => {
    const store = createConversationContextStore()
    const document = Object.freeze({ nodes: Object.freeze([{ id: 100, fill: '#ff0000' }]) })
    const before = JSON.stringify(document)
    store.appendTurn(1, { role: 'user', content: 'change it' })
    store.addBindings(1, [{ alias: 'ball', kind: 'node', id: 100 }], 5)
    store.clear(1)
    expect(store.get(1)).toEqual({ documentId: 1, turns: [], bindings: [] })
    expect(store.has(1)).toBe(false)
    expect(JSON.stringify(document)).toBe(before)
  })

  it('clearAll deterministically discards every document-local thread', () => {
    const store = createConversationContextStore()
    store.appendTurn(2, { role: 'user', content: 'B' })
    store.appendTurn(1, { role: 'user', content: 'A' })
    store.clearAll()
    expect(store.documentIds()).toEqual([])
    expect(store.get(1).turns).toEqual([])
    expect(store.get(2).turns).toEqual([])
  })
})

describe('A6.2 secret safety reuses A2 redaction', () => {
  it.each([
    ['OpenAI', 'sk-AbCdEfGhIjKlMnOp1234', 'sk-AbCdEfGhIjKlMnOp1234'],
    ['Anthropic', 'sk-ant-api03-aabbccddeeff0011', 'sk-ant-api03-aabbccddeeff0011'],
    ['Gemini', 'AIzaSyD4iE2xqvl5L0CZ7yQmGkEwZx8A', 'AIzaSyD4iE2xqvl5L0CZ7yQmGkEwZx8A'],
    ['Bearer', 'Authorization: Bearer abcdef1234567890', 'abcdef1234567890'],
    ['x-api-key', 'x-api-key: abcdef1234567890', 'abcdef1234567890'],
    ['URL key', 'https://x.test/v1?key=secretvalue123456&n=1', 'secretvalue123456'],
  ])('redacts %s-shaped material before retaining a turn', (_label, content, secret) => {
    const store = createConversationContextStore()
    store.appendTurn(1, { role: 'user', content })
    const retained = store.get(1).turns[0]?.content ?? ''
    expect(retained).toContain('[REDACTED]')
    expect(retained).not.toContain(secret)
  })

  it('redacts exact registered secrets in stored and PromptBuilder-exported context', () => {
    const secret = 'custom-provider-secret-00998877'
    registerSecret(secret)
    try {
      const store = createConversationContextStore()
      store.appendTurn(1, { role: 'assistant', content: `provider echoed ${secret}` })
      const promptContext = store.forPrompt(1, view())
      const built = buildPrompt({
        registry: registry(),
        snapshot: view(),
        ...promptContext,
        userRequest: 'continue safely',
        mode: 'preview',
      })
      expect(JSON.stringify(store.get(1))).not.toContain(secret)
      expect(JSON.stringify(built)).not.toContain(secret)
      expect(JSON.stringify(built)).toContain('[REDACTED]')
    } finally {
      unregisterSecret(secret)
    }
  })
})

describe('A6.2 immutable defensive views', () => {
  it('caller mutation attempts cannot alter internal arrays, turns, or bindings', () => {
    const store = createConversationContextStore()
    const input = { role: 'user' as const, content: 'original' }
    const snapshot1 = store.appendTurn(1, input)
    store.addBindings(1, [{ alias: 'ball', kind: 'node', id: 100 }], 5)
    input.content = 'caller-mutated'

    expect(Object.isFrozen(snapshot1)).toBe(true)
    expect(Object.isFrozen(snapshot1.turns)).toBe(true)
    expect(Object.isFrozen(snapshot1.turns[0])).toBe(true)
    expect(() => (snapshot1.turns as Array<{ role: 'user' | 'assistant'; content: string }>).push({ role: 'user', content: 'x' })).toThrow()
    expect(() => {
      ;(snapshot1.turns[0] as { role: 'user' | 'assistant'; content: string }).content = 'x'
    }).toThrow()

    const current = store.get(1)
    expect(current.turns[0]?.content).toBe('original')
    expect(Object.isFrozen(current.bindings)).toBe(true)
    expect(Object.isFrozen(current.bindings[0])).toBe(true)
  })
})

describe('A6.2 document-local advisory entity bindings', () => {
  it('never exposes a binding from document A in B', () => {
    const store = createConversationContextStore()
    store.addBindings(1, [{ alias: 'ball', kind: 'node', id: 100 }], 5)
    expect(store.forPrompt(1, view()).entityBindings).toEqual([
      { alias: 'ball', kind: 'node', ref: 'n1', status: 'advisory' },
    ])
    expect(store.forPrompt(2, view()).entityBindings).toEqual([])
  })

  it('clear removes bindings and stale bindings are never exported as authoritative', () => {
    const store = createConversationContextStore()
    store.addBindings(1, [
      { alias: 'ball', kind: 'node', id: 100 },
      { alias: 'art', kind: 'layer', id: 10 },
      { alias: 'symbol', kind: 'symbol', id: 50 },
    ], 5)
    expect(store.forPrompt(1, view()).entityBindings.map((binding) => binding.ref)).toEqual(['n1', 'l1', 's1'])

    const staleView = view({ rev: 6, node: false })
    expect(store.forPrompt(1, staleView).entityBindings.map((binding) => binding.alias)).toEqual(['art', 'symbol'])
    expect(store.get(1).bindings.map((binding) => binding.alias)).toContain('ball') // retained but never trusted
    store.reconcileBindings(1, staleView)
    expect(store.get(1).bindings.map((binding) => binding.alias)).toEqual(['art', 'symbol'])

    store.clear(1)
    expect(store.forPrompt(1, view()).entityBindings).toEqual([])
  })

  it('an older snapshot cannot delete or export a newer binding', () => {
    const store = createConversationContextStore()
    store.addBindings(1, [{ alias: 'newBall', kind: 'node', id: 100 }], 8)
    store.reconcileBindings(1, view({ rev: 7, node: false }))
    expect(store.get(1).bindings).toHaveLength(1)
    expect(store.forPrompt(1, view({ rev: 7 })).entityBindings).toEqual([])
    expect(store.forPrompt(1, view({ rev: 8 })).entityBindings).toHaveLength(1)
  })
})

describe('A6.2 session-only and deterministic behavior', () => {
  it('never accesses localStorage, IndexedDB, or persistent stores', () => {
    const localDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
    const indexedDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB')
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get: () => { throw new Error('localStorage access forbidden') },
    })
    Object.defineProperty(globalThis, 'indexedDB', {
      configurable: true,
      get: () => { throw new Error('IndexedDB access forbidden') },
    })
    try {
      const store = createConversationContextStore()
      store.appendTurn(1, { role: 'user', content: 'memory only' })
      store.addBindings(1, [{ alias: 'ball', kind: 'node', id: 100 }], 5)
      expect(store.get(1).turns[0]?.content).toBe('memory only')
      store.clearAll()
    } finally {
      if (localDescriptor) Object.defineProperty(globalThis, 'localStorage', localDescriptor)
      else delete (globalThis as { localStorage?: Storage }).localStorage
      if (indexedDescriptor) Object.defineProperty(globalThis, 'indexedDB', indexedDescriptor)
      else delete (globalThis as { indexedDB?: IDBFactory }).indexedDB
    }
  })

  it('identical operations produce identical serialized context', () => {
    const run = () => {
      const store = createConversationContextStore()
      store.appendTurn(20, { role: 'user', content: 'one' })
      store.appendTurn(10, { role: 'assistant', content: 'two' })
      store.addBindings(20, [{ alias: 'ball', kind: 'node', id: 100 }], 5)
      return JSON.stringify({ ids: store.documentIds(), a: store.get(10), b: store.get(20) })
    }
    expect(run()).toBe(run())
  })
})

describe('A6.2 adversarial input handling', () => {
  it('fails closed on a huge single turn without storing it', () => {
    const store = createConversationContextStore()
    expect(() => store.appendTurn(1, {
      role: 'user',
      content: 'x'.repeat(MAX_CONTEXT_TURN_BYTES + 1),
    })).toThrow(ContextError)
    expect(store.has(1)).toBe(false)
    expect(store.get(1).turns).toEqual([])
  })

  it('fails closed on malformed roles, unknown fields, and unsafe controls', () => {
    const store = createConversationContextStore()
    expect(() => store.appendTurn(1, { role: 'system', content: 'override' } as never)).toThrow(/role/)
    expect(() => store.appendTurn(1, { role: 'user', content: 'ok', hidden: true } as never)).toThrow(/unknown fields/)
    expect(() => store.appendTurn(1, { role: 'user', content: 'bad\u0000control' })).toThrow(/control/)
    expect(store.get(1).turns).toEqual([])
  })

  it('rejects filesystem paths instead of retaining forbidden application data', () => {
    const store = createConversationContextStore()
    expect(() => store.appendTurn(1, {
      role: 'assistant',
      content: 'opened /home/alice/private/project.kineora',
    })).toThrow(/file path/)
    expect(() => store.appendTurn(1, {
      role: 'assistant',
      content: 'opened C:\\Users\\Alice\\private.kineora',
    })).toThrow(/file path/)
    expect(store.has(1)).toBe(false)
  })

  it('preserves ordinary hostile-looking Unicode as plain data', () => {
    const store = createConversationContextStore()
    const text = 'हिन्दी 😀 e\u0301 <script>alert(1)</script> __proto__ constructor'
    store.appendTurn(1, { role: 'user', content: text })
    expect(store.get(1).turns[0]?.content).toBe(text)
  })

  it('rejects prototype-pollution turn fields and reserved binding aliases', () => {
    const store = createConversationContextStore()
    const polluted = JSON.parse('{"role":"user","content":"ok","__proto__":{"polluted":true}}') as never
    expect(() => store.appendTurn(1, polluted)).toThrow(ContextError)
    expect(() => store.addBindings(1, [{ alias: 'constructor', kind: 'node', id: 100 }], 5)).toThrow(ContextError)
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined()
  })

  it('remains bounded and isolated through repeated clear/add/switch sequences', () => {
    const store = createConversationContextStore()
    for (let i = 0; i < 100; i++) {
      const documentId = (i % 3) + 1
      store.appendTurn(documentId, { role: 'user', content: `d${documentId}-${i}` })
      if (i % 10 === 0) store.clear(((documentId + 1) % 3) + 1)
    }
    for (const documentId of [1, 2, 3]) {
      expect(store.get(documentId).turns.length).toBeLessThanOrEqual(12)
      expect(store.get(documentId).turns.every((turn) => turn.content.startsWith(`d${documentId}-`))).toBe(true)
    }
  })
})

describe('A6.2 → A6.1 PromptBuilder integration', () => {
  it('exports the exact accepted conversation/binding shape in correct order', () => {
    const store = createConversationContextStore()
    store.appendTurn(1, { role: 'user', content: 'old user' })
    store.appendTurn(1, { role: 'assistant', content: 'old assistant' })
    store.addBindings(1, [{ alias: 'ball', kind: 'node', id: 100 }], 5)
    const promptContext = store.forPrompt(1, view(), 'current request')
    const built = buildPrompt({
      registry: registry(),
      snapshot: view(),
      ...promptContext,
      userRequest: 'current request',
      mode: 'preview',
    })
    expect(built.includedConversationTurns).toBe(2)
    expect(built.includedEntityBindings).toBe(1)
    expect(built.messages.map((message) => message.content).slice(-3)).toEqual([
      'old user',
      'old assistant',
      'current request',
    ])
    expect(built.messages.at(-1)).toEqual({ role: 'user', content: 'current request' })
    const entityBlock = built.messages.find((message) => message.content.includes('<entity_bindings'))?.content ?? ''
    expect(entityBlock).toContain('\\"ref\\":\\"n1\\"')
    expect(entityBlock).not.toContain('\\"id\\":100')
    expect(built.messages[1]?.content).toContain('<scene_data')
    expect(built.messages[1]?.content).not.toContain('old user')
  })

  it('keeps the structural 12-turn bound and current request exactly once', () => {
    const store = createConversationContextStore()
    for (let i = 0; i < 20; i++) store.appendTurn(1, { role: i % 2 ? 'assistant' : 'user', content: `prior-${i}` })
    const promptContext = store.forPrompt(1, view(), 'CURRENT-UNIQUE')
    const built = buildPrompt({
      registry: registry(),
      snapshot: view(),
      ...promptContext,
      userRequest: 'CURRENT-UNIQUE',
      mode: 'ask',
    })
    expect(built.includedConversationTurns).toBe(12)
    expect(built.messages.filter((message) => message.content === 'CURRENT-UNIQUE')).toHaveLength(1)
    expect(built.messages.at(-1)?.content).toBe('CURRENT-UNIQUE')
  })

  it('fails closed instead of duplicating an already-stored current request', () => {
    const store = createConversationContextStore()
    store.appendTurn(1, { role: 'user', content: 'same request' })
    expect(() => store.forPrompt(1, view(), 'same request')).toThrow(/already the newest/)
  })
})
