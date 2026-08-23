// ===========================================================================
// AI CAPABILITIES — the trusted runtime CapabilityRegistry (A3 / E-AI-5 /
// spec 07 + AI-REQ-111/112).
//
// CRITICAL ARCHITECTURE RULE (locked in the engineering handoff): this module
// is a GENERATOR, not a list. Action rows are computed FROM the engine's
// runtime manifest (shapes[], nodeFamilies[], features{}) — so when Kineora
// ships a new node kind or feature, flipping the engine manifest light it up
// here automatically. There is exactly ONE capability truth: the engine.
// Anything the engine reports as missing is generated as an `unsupported` row
// (so the agent can SAY "abhi available nahi hai" instead of inventing it),
// and UI-visible-but-unexposed tools get AI-REQ-112's honest sentence.
//
// The validator (A4) consumes these rows for stage-3/4/5/10 checks; the
// prompt builder (A6) consumes toPromptText().
// ===========================================================================

// ---------------------------------------------------------------------------
// Engine manifest (mirrors snapshot.rs `capabilities()`)
// ---------------------------------------------------------------------------

export interface EngineManifest {
  v: number
  engine: string
  manifestFormat: string
  shapes: string[]
  nodeFamilies: string[]
  features: Record<string, boolean>
}

export class CapabilityError extends Error {
  readonly code = 'E_CAPABILITY'
  constructor(message: string) {
    super(message)
    this.name = 'CapabilityError'
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function parseEngineManifest(json: string): EngineManifest {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    throw new CapabilityError('manifest JSON parse fail')
  }
  if (!isRecord(raw)) throw new CapabilityError('manifest is not an object')
  if (raw.v !== 1 || raw.manifestFormat !== 'kineora-ai-manifest') {
    throw new CapabilityError('unsupported manifest format/version')
  }
  const shapes = Array.isArray(raw.shapes)
    ? raw.shapes.filter((x): x is string => typeof x === 'string')
    : []
  const nodeFamilies = Array.isArray(raw.nodeFamilies)
    ? raw.nodeFamilies.filter((x): x is string => typeof x === 'string')
    : []
  const features: Record<string, boolean> = {}
  if (isRecord(raw.features)) {
    for (const [k, v] of Object.entries(raw.features)) features[k] = v === true
  }
  if (shapes.length === 0) throw new CapabilityError('manifest has no shapes')
  return {
    v: 1,
    engine: typeof raw.engine === 'string' ? raw.engine : 'unknown',
    manifestFormat: 'kineora-ai-manifest',
    shapes,
    nodeFamilies,
    features,
  }
}

// ---------------------------------------------------------------------------
// Registry types
// ---------------------------------------------------------------------------

export type CapabilityState = 'supported' | 'partial' | 'unsupported' | 'deferred'

export type ParamType =
  | 'number'
  | 'frame'
  | 'color'
  | 'string'
  | 'boolean'
  | 'enum'
  | 'node-ref'
  | 'layer-ref'
  | 'symbol-ref'

export interface ParamSpec {
  type: ParamType
  required?: boolean
  options?: readonly string[]
  min?: number
  max?: number
  unit?: string
  doc?: string
}

export interface CapabilityAction {
  action: string
  state: CapabilityState
  /** A = safe · B = confirmation required (spec 04 tiering). */
  tier: 'A' | 'B'
  params: Readonly<Record<string, ParamSpec>>
  /** The engine command / facade this action compiles to (A5). */
  mapsTo: string
  /** Honest limitations surfaced to prompt + user (spec 07/17). */
  limitations?: readonly string[]
}

export interface CapabilityRegistry {
  get(action: string): CapabilityAction | undefined
  list(): readonly CapabilityAction[]
  byState(state: CapabilityState): readonly CapabilityAction[]
  /** Prompt-facing manifest text (capability honesty block for the model). */
  toPromptText(): string
  /** What the engine reported (for staleness/debug surfaces). */
  readonly manifest: EngineManifest
}

/** Runtime probes — engine-connected reality (stale wasm, etc.). */
export interface EngineProbes {
  /** false = attached wasm predates E1 draw_shape — only legacy rect draws. */
  hasShapeDraw?: boolean
}

// ---------------------------------------------------------------------------
// Registry construction — GENERATED from the manifest, never hand-mirrored
// ---------------------------------------------------------------------------

const PX = { type: 'number', unit: 'px' } as const satisfies ParamSpec
const FRAME: ParamSpec = { type: 'frame', required: true, min: 1 }
const COLOR_REQ: ParamSpec = { type: 'color', required: true, doc: '#rrggbb' }

export function buildCapabilityRegistry(
  manifest: EngineManifest,
  probes: EngineProbes,
): CapabilityRegistry {
  const f = (name: string): boolean => manifest.features[name] === true
  const rows: CapabilityAction[] = []
  const add = (row: CapabilityAction): void => {
    rows.push(Object.freeze(row))
  }

  // ---- shapes -------------------------------------------------------------
  const shapeOpts: string[] = [...manifest.shapes]
  const shapeLimitations: string[] = []
  if (probes.hasShapeDraw === false) {
    // Honest stale-wasm degrade (same spirit as the Oval rollout): only the
    // legacy rect path exists on this engine build.
    const kept = shapeOpts.filter((s) => s === 'rect')
    shapeOpts.length = 0
    shapeOpts.push(...(kept.length > 0 ? kept : ['rect']))
    shapeLimitations.push('engine build too old for kineora_draw_shape — wasm rebuild karo (npm run wasm)')
  }
  if (f('strokeAtDraw') !== true) shapeLimitations.push('stroke-at-draw unavailable — style after drawing')
  add({
    action: 'shape.create',
    state: 'supported',
    tier: 'A',
    params: Object.freeze({
      shape: { type: 'enum', required: true, options: Object.freeze(shapeOpts) },
      x: { ...PX, required: true },
      y: { ...PX, required: true },
      w: { ...PX, required: true, min: 0.01 },
      h: { ...PX, required: true, min: 0.01 },
      fill: { ...COLOR_REQ, doc: '#rrggbb (engine always draws a fill — no fill-less shapes yet)' },
      ...(f('strokeAtDraw')
        ? {
            stroke: { type: 'color', doc: 'null = no stroke' } as ParamSpec,
            strokeWidth: { ...PX, min: 0 } as ParamSpec,
          }
        : {}),
      layer: { type: 'layer-ref', doc: 'default active layer (must be editable)' } as ParamSpec,
      frame: { type: 'frame', min: 1, doc: 'default playhead' } as ParamSpec,
      name: { type: 'string', doc: 'optional label used in AI references' } as ParamSpec,
    }),
    mapsTo: 'DrawRect via Session::draw_shape',
    limitations: shapeLimitations.length > 0 ? Object.freeze(shapeLimitations) : undefined,
  })

  // ---- node ops ------------------------------------------------------------
  add({
    action: 'node.transform',
    state: 'supported',
    tier: 'A',
    params: Object.freeze({
      node: { type: 'node-ref', required: true },
      x: PX, y: PX,
      scaleX: PX, scaleY: PX,
      rotation: { type: 'number', unit: 'deg', doc: 'clockwise, center pivot' },
      relative: { type: 'boolean', doc: 'true = dx/dy instead of absolute' },
      reset: { type: 'boolean', doc: 'remove all transform' },
    }),
    mapsTo: 'patch_transforms / rotate_selection / flip / remove_transform',
    limitations: f('perKeyTransform') ? undefined : Object.freeze(['transform keyframes pending']),
  })
  add({
    action: 'node.setStyle',
    state: 'supported',
    tier: 'A',
    params: Object.freeze({
      node: { type: 'node-ref', required: true },
      width: PX, height: PX,
      fill: { type: 'color', doc: '#rrggbb' },
      stroke: { type: 'color', doc: "set 'none' to remove" },
      strokeWidth: PX,
    }),
    mapsTo: 'Session::set_node_props (NodePropsPatch)',
  })
  add({
    action: 'node.setOpacity',
    state: f('nodeOpacity') ? 'supported' : 'unsupported',
    tier: 'A',
    params: Object.freeze({ node: { type: 'node-ref', required: true }, alpha: { type: 'number', min: 0, max: 1 } }),
    mapsTo: 'E-AI-6 (engine pending)',
    limitations: Object.freeze(['engine has no per-node alpha field (audit Q8) — E-AI-6 decision pending']),
  })
  add({
    action: 'node.delete',
    state: 'supported',
    tier: 'B',
    params: Object.freeze({ nodes: { type: 'node-ref', required: true, doc: 'one or more (≤1000)' } }),
    mapsTo: 'DeleteSelection via selection harness',
  })
  add({
    action: 'node.duplicate',
    state: 'supported',
    tier: 'A',
    params: Object.freeze({
      nodes: { type: 'node-ref', required: true },
      copies: { type: 'number', min: 1, max: 32 },
      offset: { ...PX, doc: 'px offset per copy (default DUPLICATE_OFFSET)' },
    }),
    mapsTo: 'duplicate_objects',
  })
  const arrangeAlignState: CapabilityState = f('arrangeAlign') ? 'supported' : 'unsupported'
  add({
    action: 'node.arrange',
    state: arrangeAlignState,
    tier: 'A',
    params: Object.freeze({
      nodes: { type: 'node-ref', required: true },
      op: { type: 'enum', required: true, options: Object.freeze(['bring-to-front', 'bring-forward', 'send-backward', 'send-to-back']) },
    }),
    mapsTo: 'arrange_selection',
  })
  add({
    action: 'node.align',
    state: arrangeAlignState,
    tier: 'A',
    params: Object.freeze({
      nodes: { type: 'node-ref', required: true },
      op: { type: 'enum', required: true, options: Object.freeze(['left', 'center-h', 'right', 'top', 'center-v', 'bottom']) },
      space: { type: 'enum', options: Object.freeze(['selection', 'stage']) },
    }),
    mapsTo: 'align_selection',
  })

  // ---- layers --------------------------------------------------------------
  add({ action: 'layer.create', state: 'supported', tier: 'A', params: Object.freeze({ name: { type: 'string' } }), mapsTo: 'CreateLayer' })
  add({
    action: 'folder.create',
    state: f('folders') ? 'supported' : 'unsupported',
    tier: 'A',
    params: Object.freeze({ name: { type: 'string' } }),
    mapsTo: 'create_folder',
    limitations: f('folders') ? undefined : Object.freeze(['folders pending']),
  })
  add({
    action: 'layer.rename', state: 'supported', tier: 'A',
    params: Object.freeze({ layer: { type: 'layer-ref', required: true }, name: { type: 'string', required: true } }),
    mapsTo: 'RenameLayer',
  })
  add({
    action: 'layer.delete', state: 'supported', tier: 'B',
    params: Object.freeze({ layer: { type: 'layer-ref', required: true } }),
    mapsTo: 'DeleteLayer / DeleteLayerGroup',
    limitations: Object.freeze(['destructive — confirmation always required']),
  })
  for (const [action, mapsTo] of [
    ['layer.setVisible', 'SetLayerVisible'],
    ['layer.setLocked', 'SetLayerLocked'],
    ['layer.setOutline', 'SetLayerOutline'],
  ] as const) {
    add({
      action, state: 'supported', tier: 'A',
      params: Object.freeze({ layer: { type: 'layer-ref', required: true }, value: { type: 'boolean', required: true } }),
      mapsTo,
    })
  }
  add({
    action: 'layer.duplicate', state: 'supported', tier: 'A',
    params: Object.freeze({ layer: { type: 'layer-ref', required: true } }),
    mapsTo: 'DuplicateLayer',
  })
  add({
    action: 'layer.reorder', state: 'supported', tier: 'B',
    params: Object.freeze({ layer: { type: 'layer-ref', required: true }, to: { type: 'number', required: true, min: 0 } }),
    mapsTo: 'ReorderLayer',
  })
  add({
    action: 'layer.setParent',
    state: f('folders') ? 'supported' : 'unsupported',
    tier: 'B',
    params: Object.freeze({ layer: { type: 'layer-ref', required: true }, parent: { type: 'layer-ref', doc: 'folder; omit to unparent' } }),
    mapsTo: 'SetLayerParent',
  })

  // ---- timeline ------------------------------------------------------------
  for (const [action, mapsTo, extra] of [
    ['keyframe.insert', 'InsertKeyframe', {}],
    ['keyframe.insertBlank', 'InsertBlankKeyframe', {}],
    ['keyframe.clear', 'ClearKeyframe', { tier: 'B' as const }],
    ['keyframe.move', 'MoveKeyframe', { from: FRAME, to: FRAME }],
    ['keyframe.duplicate', 'DuplicateKeyframe', { from: FRAME, to: FRAME }],
  ] as const) {
    add({
      action,
      state: 'supported',
      tier: 'tier' in extra ? extra.tier : 'A',
      params: Object.freeze({
        layer: { type: 'layer-ref' },
        ...(action === 'keyframe.insert' ||
        action === 'keyframe.insertBlank' ||
        action === 'keyframe.clear'
          ? { frame: FRAME }
          : {}),
        ...('from' in extra ? { from: extra.from, to: extra.to } : {}),
      }),
      mapsTo,
    })
  }
  for (const [action, mapsTo] of [
    ['frames.insert', 'InsertFrames'],
    ['frames.delete', 'DeleteFrames'],
    ['frames.remove', 'RemoveFrames'],
    ['frames.reverse', 'ReverseFrames'],
    ['frames.duplicate', 'DuplicateFrames'],
    ['frames.convertToKeyframes', 'ConvertToKeyframes'],
    ['frames.convertToBlankKeyframes', 'ConvertToBlankKeyframes'],
  ] as const) {
    add({
      action, state: 'supported', tier: 'B',
      params: Object.freeze({
        layer: { type: 'layer-ref', required: true },
        start: FRAME,
        end: { type: 'frame', required: true, min: 1 },
      }),
      mapsTo,
      limitations: Object.freeze(['timeline structure change — confirmation tier']),
    })
  }
  add({
    action: 'frames.setLabel',
    state: f('frameLabels') ? 'supported' : 'unsupported',
    tier: 'A',
    params: Object.freeze({ layer: { type: 'layer-ref', required: true }, frame: FRAME, label: { type: 'string', required: true } }),
    mapsTo: 'SetFrameLabel',
  })

  // ---- tweens ---------------------------------------------------------------
  add({
    action: 'tween.classic.set',
    state: f('classicTween') ? 'supported' : 'unsupported',
    tier: 'A',
    params: Object.freeze({
      layer: { type: 'layer-ref', required: true },
      start: FRAME,
      end: { type: 'frame', required: true, min: 1 },
      ease: {
        type: 'number', min: -100, max: 100, required: true,
        doc: '0=linear · positive=ease-OUT · negative=ease-IN (quadratic)',
      },
    }),
    mapsTo: 'SetClassicTween',
    limitations: f('namedEasings')
      ? undefined
      : Object.freeze(['named easings (bounce/elastic…) NOT wired to classic tween — numeric ease only']),
  })
  add({
    action: 'tween.remove', state: f('classicTween') ? 'supported' : 'unsupported', tier: 'A',
    params: Object.freeze({ layer: { type: 'layer-ref', required: true }, start: FRAME }),
    mapsTo: 'RemoveClassicTween',
  })
  for (const [action, gate] of [
    ['tween.motion.set', 'motionTween'],
    ['tween.shape.set', 'shapeTween'],
  ] as const) {
    add({
      action, state: f(gate) ? 'supported' : 'unsupported', tier: 'A',
      params: Object.freeze({ layer: { type: 'layer-ref', required: true }, start: FRAME, end: { type: 'frame', required: true } }),
      mapsTo: '(engine pending)',
      limitations: Object.freeze([`${action} — engine model pending (Blueprint Part 09)`]),
    })
  }

  // ---- symbols ---------------------------------------------------------------
  const symbolsState: CapabilityState = f('symbols') ? 'supported' : 'unsupported'
  add({
    action: 'symbol.convert', state: symbolsState, tier: 'B',
    params: Object.freeze({
      name: { type: 'string', required: true },
      type: { type: 'enum', required: true, options: Object.freeze(['graphic', 'movieclip', 'button']) },
    }),
    mapsTo: 'ConvertToSymbol',
  })
  for (const [action, mapsTo, tier] of [
    ['symbol.create', 'CreateSymbol', 'A'],
    ['symbol.place', 'PlaceSymbol', 'A'],
    ['symbol.rename', 'RenameSymbol', 'A'],
    ['symbol.swap', 'SwapInstance', 'A'],
    ['symbol.setLoop', 'SetInstanceLoop', 'A'],
    ['symbol.delete', 'DeleteSymbol (break_apart)', 'B'],
  ] as const) {
    add({
      action, state: symbolsState, tier: tier as 'A' | 'B',
      params: Object.freeze({
        symbol: { type: 'symbol-ref', required: action !== 'symbol.create' },
        name: { type: 'string' },
        x: PX, y: PX,
        loop: { type: 'enum', options: Object.freeze(['loop', 'once', 'single']) },
        firstFrame: { type: 'frame', min: 1 },
      }),
      mapsTo,
    })
  }

  // ---- doc/scene/selection/playback ------------------------------------------
  add({
    action: 'doc.setSettings', state: 'supported', tier: 'B',
    params: Object.freeze({
      width: { type: 'number', min: 1 }, height: { type: 'number', min: 1 },
      fps: { type: 'number', min: 1, max: 240 },
      background: { type: 'color' },
      backgroundAlpha: { type: 'number', min: 0, max: 1 },
    }),
    mapsTo: 'SetDocumentSettings',
    limitations: Object.freeze(['document-wide change — confirmation tier']),
  })
  add({
    action: 'scene.inspect', state: 'supported', tier: 'A',
    params: Object.freeze({
      level: { type: 'enum', options: Object.freeze(['status', 'summary', 'detail']) },
      frame: { type: 'frame', min: 1 },
    }),
    mapsTo: 'read-only snapshot/evaluate (never mutates)',
  })
  add({
    action: 'selection.set',
    state: f('selectionByIds') ? 'supported' : 'unsupported',
    tier: 'A',
    params: Object.freeze({ nodes: { type: 'node-ref', required: true } }),
    mapsTo: 'E-AI-3 set_selection (view state — never undoable)',
  })
  add({
    action: 'selection.clear', state: 'supported', tier: 'A',
    params: Object.freeze({}),
    mapsTo: 'clear_selection',
  })
  add({
    action: 'playback.gotoFrame', state: 'supported', tier: 'A',
    params: Object.freeze({ frame: FRAME }),
    mapsTo: 'UI playback control (not an engine mutation)',
  })

  // ---- honestly-unsupported rows (spec 07 NOT SUPPORTED + AI-REQ-112) --------
  for (const [action, gate, why] of [
    ['path.draw', 'paths', 'Pen/Pencil/Brush/Line — PATH model pending (tools lane E2)'],
    ['path.edit', 'paths', 'PATH model pending (tools lane E2)'],
    ['text.create', 'text', 'text tool — no text node kind yet (tools lane)'],
    ['layer.mask', 'masks', 'mask/guide layers — engine LayerKind queued'],
    ['camera.*', 'camera', 'camera — not in engine'],
    ['audio.*', 'audio', 'audio — not in engine'],
  ] as const) {
    add({
      action, state: f(gate) ? 'supported' : 'unsupported', tier: 'A',
      params: Object.freeze({}),
      mapsTo: '(engine pending)',
      limitations: Object.freeze([why]),
    })
  }

  // ---- deferred rows (exist in Kineora; never AI-exposed in MVP) -------------
  for (const action of ['doc.new', 'doc.open', 'doc.save', 'doc.close'] as const) {
    add({
      action, state: 'deferred', tier: 'B',
      params: Object.freeze({}),
      mapsTo: '(human-only in MVP)',
      limitations: Object.freeze([
        'Ye Kineora mein available hai, lekin AI ke liye exposed nahi hai (document lifecycle human-only — MVP).',
      ]),
    })
  }

  const frozen = Object.freeze(rows)

  return Object.freeze({
    manifest,
    get(action: string) {
      return frozen.find((r) => r.action === action)
    },
    list() {
      return frozen
    },
    byState(state: CapabilityState) {
      return frozen.filter((r) => r.state === state)
    },
    toPromptText() {
      const section = (title: string, rs: readonly CapabilityAction[]) =>
        rs.length === 0
          ? []
          : [
              title,
              ...rs.map(
                (r) =>
                  `- ${r.action} [tier ${r.tier}]` +
                  (Object.keys(r.params).length > 0
                    ? ` params(${Object.entries(r.params)
                        .map(
                          ([k, p]) =>
                            `${k}:${p.type}${p.required ? '*' : ''}` +
                            (p.options ? `{${p.options.join('|')}}` : '') +
                            (p.min !== undefined || p.max !== undefined
                              ? `[${p.min ?? ''}..${p.max ?? ''}]`
                              : ''),
                        )
                        .join(', ')})`
                    : '') +
                  (r.limitations && r.limitations.length > 0 ? ` — ⚠ ${r.limitations.join('; ')}` : ''),
              ),
            ]
      return [
        ...section('SUPPORTED (tier A):', frozen.filter((r) => r.state === 'supported' && r.tier === 'A')),
        ...section('SUPPORTED (tier B — ALWAYS require user confirmation):', frozen.filter((r) => r.state === 'supported' && r.tier === 'B')),
        ...section('NOT AVAILABLE (never plan these — say "abhi available nahi hai" + nearest alternative):', frozen.filter((r) => r.state === 'unsupported')),
        ...section('NOT EXPOSED TO AI (Kineora mein hai; AI ke liye nahi — say so honestly):', frozen.filter((r) => r.state === 'deferred')),
      ].join('\n')
    },
  })
}
