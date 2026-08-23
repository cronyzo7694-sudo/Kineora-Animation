import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ActivityRecord } from './activity'
import { AiPanel, AI_PANEL_WIDTH } from './AiPanel'
import { createDailyTokenCeilingStore } from './budget'
import { buildCapabilityRegistry, parseEngineManifest } from './capabilities'
import { createConversationContextStore } from './context'
import { createInteractionStore, type InteractionStore } from './interaction'
import { createKeyVault, type StorageLike } from './keys'
import type { AiOrchestrator, AiOrchestratorResult } from './orchestrator'
import { createProviderStore, hasConsent } from './providers'
import type { AiRuntime } from './runtime'
import { createUsageMeter } from './usage'
import type { ValidatedPlan } from './validate'
import type { VerificationReport } from './verifier'

function storage(): StorageLike {
  const data = new Map<string, string>()
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => { data.set(key, value) },
    removeItem: (key) => { data.delete(key) },
  }
}

function registry() {
  return buildCapabilityRegistry(parseEngineManifest(JSON.stringify({
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
      frameLabels: true,
      arrangeAlign: true,
      strokeAtDraw: true,
      selectionByIds: true,
      compositeUndo: true,
      playbackAutomation: false,
    },
  })), { hasShapeDraw: true })
}

function plan(options: { tier?: 'A' | 'B'; mass?: boolean } = {}): ValidatedPlan {
  const tier = options.tier ?? 'A'
  return {
    actions: [{
      index: 0,
      id: 'shape1',
      action: 'shape.create',
      params: { shape: 'oval', x: 10, y: 20, w: 30, h: 40, fill: '#ff0000' },
      targets: [],
      humanText: 'Create red oval on Art',
      tier,
    }],
    expected: ['Red oval exists'],
    report: 'Create oval',
    requiresConfirmation: tier === 'B',
    massDestructive: options.mass ? { nodes: 25, totalSceneNodes: 30 } : null,
    budget: { actions: 1, estimatedMutations: 1 },
    validatedAt: {
      docRevision: 1,
      sceneIndex: 0,
      activeLayer: 0,
      playhead: 1,
      selection: [],
      layers: [{ index: 0, id: 10 }],
      capabilityEngine: 'kineora-core',
    },
  }
}

function verification(verdict: VerificationReport['verdict']): VerificationReport {
  return {
    verdict,
    rows: [{ actionIndex: 0, action: 'shape.create', status: verdict, check: 'shape exists' }],
    snapshotRevision: 2,
    structurallyVerified: verdict === 'pass',
  }
}

function activity(): ActivityRecord {
  return {
    id: 'tx-1',
    docId: 1,
    label: 'AI — oval',
    startedAt: 1,
    finishedAt: 2,
    outcome: 'applied',
    actions: [{ index: 0, id: 'shape1', action: 'shape.create', summary: 'Create oval', status: 'applied' }],
    events: [],
    mutationCount: 1,
    entityBindings: [{ alias: 'shape1', kind: 'node', id: 100 }],
  }
}

interface FakeRuntime extends AiRuntime {
  generate: ReturnType<typeof vi.fn>
  approve: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
}

function runtime(setup?: (interaction: InteractionStore) => void): FakeRuntime {
  const store = storage()
  const providerStore = createProviderStore(store, () => 1)
  const keyVault = createKeyVault()
  const usage = createUsageMeter(store, () => Date.UTC(2026, 7, 23))
  const ceiling = createDailyTokenCeilingStore(store, () => Date.UTC(2026, 7, 23))
  const context = createConversationContextStore()
  const interaction = createInteractionStore()
  setup?.(interaction)
  const generate = vi.fn(async (input: { documentId: number; userRequest: string }) => {
    interaction.begin(input.documentId, input.userRequest)
    interaction.addCard(input.documentId, { kind: 'assistant-message', text: 'Safe reply' })
    interaction.transition(input.documentId, 'completed')
    return { ok: true, status: 'completed', state: interaction.get(input.documentId) } as AiOrchestratorResult
  })
  const approve = vi.fn(async (documentId: number) => ({
    ok: true,
    status: interaction.get(documentId).phase,
    state: interaction.get(documentId),
  } as AiOrchestratorResult))
  const stop = vi.fn((documentId: number) => ({
    ok: false,
    status: interaction.get(documentId).phase,
    state: interaction.get(documentId),
  } as AiOrchestratorResult))
  const orchestrator = {
    generate,
    approve,
    stop,
    state: (documentId: number) => interaction.get(documentId),
    disposeDocument: (documentId: number) => {
      context.discardDocument(documentId)
      interaction.disposeDocument(documentId)
      return true
    },
  } as unknown as AiOrchestrator
  return {
    storage: store,
    providerStore,
    keyVault,
    adapters: {} as AiRuntime['adapters'],
    usage,
    ceiling,
    context,
    interaction,
    orchestrator,
    hasConsent: () => hasConsent(store),
    capabilityRegistry: () => registry(),
    activeDocumentId: () => 1,
    currentRevision: () => 2,
    disposeDocument: (documentId) => {
      const disposed = orchestrator.disposeDocument(documentId)
      return disposed
    },
    undo: vi.fn(() => true),
    generate,
    approve,
    stop,
  }
}

function renderPanel(rt = runtime(), documentId: number | null = 1) {
  const close = vi.fn()
  const rendered = render(<AiPanel runtime={rt} documentId={documentId} onClose={close} />)
  return { rt, close, ...rendered }
}

describe('A6.6 panel shell/header/capabilities', () => {
  it('renders, collapses, closes, and stays within approved width constraints', () => {
    const { close } = renderPanel()
    const panel = screen.getByTestId('ai-panel')
    expect(panel).toBeInTheDocument()
    expect(panel).toHaveStyle(`width: ${AI_PANEL_WIDTH.default}px`)
    fireEvent.change(screen.getByTestId('ai-width'), { target: { value: '480' } })
    expect(panel).toHaveStyle('width: 480px')
    fireEvent.click(screen.getByTestId('ai-collapse'))
    expect(panel).toHaveAttribute('data-collapsed', 'true')
    expect(panel).toHaveStyle('width: 44px')
    fireEvent.click(screen.getByTestId('ai-collapse'))
    fireEvent.click(screen.getByTestId('ai-close'))
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('shows honest provider, key, mode, consent, ceiling, and unavailable states', () => {
    const rt = runtime()
    renderPanel(rt)
    expect(screen.getByTestId('ai-header-provider')).toHaveTextContent('No provider configured')
    expect(screen.getByTestId('ai-header-mode')).toHaveTextContent('PREVIEW')
    expect(screen.getByTestId('ai-readiness')).toHaveTextContent('No provider configured')
  })

  it('shows shared provider/model/key state and all three allowed modes', () => {
    const rt = runtime()
    const cfg = rt.providerStore.upsert({ type: 'openai', label: 'Personal', model: 'gpt-test' })!
    rt.providerStore.setActive(cfg.id)
    rt.keyVault.set(cfg.id, 'sk-test-123456789')
    rt.ceiling.set(50_000)
    renderPanel(rt)
    expect(screen.getByTestId('ai-header-provider')).toHaveTextContent('Personal / gpt-test · key ✓')
    const mode = screen.getByTestId('ai-mode')
    expect(mode).toHaveValue('preview')
    expect(mode.querySelectorAll('option')).toHaveLength(3)
    expect(mode).not.toHaveTextContent('AUTO')
  })

  it('renders the live generated capability banner and honest playback limitation', () => {
    renderPanel()
    fireEvent.click(screen.getByTestId('ai-capability-toggle'))
    const banner = screen.getByTestId('ai-capability-banner')
    expect(banner).toHaveTextContent('shape.create')
    expect(banner).toHaveTextContent('playback.gotoFrame')
    expect(banner).toHaveTextContent('AI ke liye abhi exposed nahi hai')
  })

  it('opens the shared settings surface', () => {
    renderPanel()
    fireEvent.click(screen.getByTestId('ai-settings-toggle'))
    expect(screen.getByTestId('ai-settings-pane')).toBeInTheDocument()
    expect(screen.getByTestId('ai-consent-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('ai-ceiling-input')).toBeInTheDocument()
  })
})

describe('A6.6 composer/focus/safety', () => {
  it('Enter sends while Shift+Enter keeps a newline', async () => {
    const rt = runtime()
    renderPanel(rt)
    const composer = screen.getByTestId('ai-composer')
    fireEvent.change(composer, { target: { value: 'line one' } })
    fireEvent.keyDown(composer, { key: 'Enter', shiftKey: true })
    expect(rt.generate).not.toHaveBeenCalled()
    expect(composer).toHaveValue('line one')
    fireEvent.keyDown(composer, { key: 'Enter' })
    await waitFor(() => expect(rt.generate).toHaveBeenCalledWith(expect.objectContaining({ userRequest: 'line one', mode: 'preview' })))
  })

  it('shows Stop during generation and dispatches only orchestrator.stop', () => {
    const rt = runtime((interaction) => interaction.begin(1, 'running'))
    renderPanel(rt)
    expect(screen.queryByTestId('ai-send')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('ai-stop'))
    expect(rt.stop).toHaveBeenCalledWith(1)
  })

  it('disables Send for empty/no-document and key-shaped input', () => {
    const first = renderPanel(runtime(), null)
    expect(screen.getByTestId('ai-send')).toBeDisabled()
    first.unmount()
    renderPanel()
    fireEvent.change(screen.getByTestId('ai-composer'), { target: { value: 'sk-proj-secret123456789' } })
    expect(screen.getByTestId('ai-key-warning')).toBeInTheDocument()
    expect(screen.getByTestId('ai-composer')).not.toHaveValue('sk-proj-secret123456789')
    expect(screen.getByTestId('ai-composer')).toHaveValue('[REDACTED]')
    expect(screen.getByTestId('ai-send')).toBeDisabled()
  })

  it('supports ASK/PREVIEW/APPLY selection with PREVIEW default and no variables UI', () => {
    renderPanel()
    const mode = screen.getByTestId('ai-mode')
    expect(mode).toHaveValue('preview')
    fireEvent.change(mode, { target: { value: 'ask' } })
    expect(mode).toHaveValue('ask')
    fireEvent.change(mode, { target: { value: 'apply' } })
    expect(mode).toHaveValue('apply')
    expect(screen.queryByText(/\$ autocomplete/i)).not.toBeInTheDocument()
  })

  it('keeps model content as inert text, never executable HTML/Markdown', () => {
    const hostile = '<script>window.__pwned=1</script> [click](javascript:alert(1))'
    const rt = runtime((interaction) => {
      interaction.begin(1, 'x')
      interaction.addCard(1, { kind: 'assistant-message', text: hostile })
      interaction.transition(1, 'completed')
    })
    renderPanel(rt)
    expect(screen.getByTestId('ai-card-assistant')).toHaveTextContent(hostile)
    expect(document.querySelector('script')).toBeNull()
    expect(document.querySelector('a[href^="javascript"]')).toBeNull()
  })
})

describe('A6.6 card rendering', () => {
  it.each([
    ['user-message', 'ai-card-user'],
    ['assistant-message', 'ai-card-assistant'],
    ['progress', 'ai-card-progress'],
    ['error', 'ai-card-error'],
    ['activity', 'ai-card-activity'],
  ] as const)('renders %s cards', (kind, testId) => {
    const rt = runtime((interaction) => {
      interaction.begin(1, 'User text')
      if (kind === 'assistant-message') interaction.addCard(1, { kind, text: 'Assistant text' })
      if (kind === 'error') interaction.addCard(1, { kind, error: { kind: 'provider', message: 'safe error' } })
      if (kind === 'activity') interaction.addCard(1, { kind, activity: activity() })
    })
    renderPanel(rt)
    expect(screen.getAllByTestId(testId).length).toBeGreaterThan(0)
  })

  it('renders the exact A4 plan, tier, expected footer, mutation estimate and actions', () => {
    const approved = plan({ tier: 'B' })
    const rt = runtime((interaction) => {
      interaction.begin(1, 'original request')
      interaction.transition(1, 'awaitingApproval')
      interaction.addCard(1, { kind: 'plan', plan: approved })
    })
    renderPanel(rt)
    expect(screen.getByTestId('ai-plan-actions').children).toHaveLength(approved.actions.length)
    expect(screen.getByText(approved.actions[0]!.humanText)).toBeInTheDocument()
    expect(screen.getByTestId('ai-plan-expected')).toHaveTextContent(approved.expected[0]!)
    expect(screen.getByText('Estimated mutations: 1')).toBeInTheDocument()
    expect(screen.getByText(/tier B/)).toBeInTheDocument()
  })

  it('routes Apply through orchestrator, Cancel never approves, Edit-as-text restores original prose', async () => {
    const rt = runtime((interaction) => {
      interaction.begin(1, 'original prose')
      interaction.transition(1, 'awaitingApproval')
      interaction.addCard(1, { kind: 'plan', plan: plan() })
    })
    renderPanel(rt)
    fireEvent.click(screen.getByTestId('ai-plan-apply'))
    await waitFor(() => expect(rt.approve).toHaveBeenCalledWith(1))
    expect(rt.generate).not.toHaveBeenCalled()
    fireEvent.click(screen.getByTestId('ai-plan-edit'))
    expect(rt.stop).toHaveBeenCalledWith(1)
    expect(screen.getByTestId('ai-composer')).toHaveValue('original prose')
    fireEvent.click(screen.getByTestId('ai-plan-cancel'))
    expect(rt.stop).toHaveBeenCalledTimes(2)
  })

  it('cannot bypass Tier-B or mass typed confirmation', async () => {
    const rt = runtime((interaction) => {
      interaction.begin(1, 'delete')
      interaction.transition(1, 'awaitingTypedConfirmation')
      interaction.addCard(1, {
        kind: 'confirmation', tierB: true, typedRequired: true, affectedActions: [0], message: 'danger',
      })
    })
    renderPanel(rt)
    expect(screen.getByTestId('ai-confirm-apply')).toBeDisabled()
    fireEvent.change(screen.getByTestId('ai-typed-confirmation'), { target: { value: 'wrong' } })
    expect(screen.getByTestId('ai-confirm-apply')).toBeDisabled()
    fireEvent.change(screen.getByTestId('ai-typed-confirmation'), { target: { value: 'CONFIRM' } })
    fireEvent.click(screen.getByTestId('ai-confirm-apply'))
    await waitFor(() => expect(rt.approve).toHaveBeenCalledWith(1, {
      tierBConfirmed: true,
      typedConfirmationAccepted: true,
    }))
  })

  it.each(['pass', 'fail', 'unverifiable'] as const)('renders verification verdict %s exactly', (verdict) => {
    const rt = runtime((interaction) => {
      interaction.begin(1, 'x')
      interaction.transition(1, 'executing')
      interaction.transition(1, 'verifying')
      interaction.addCard(1, { kind: 'verification', report: verification(verdict) })
    })
    renderPanel(rt)
    expect(screen.getByTestId('ai-card-verification')).toHaveAttribute('data-verdict', verdict)
    expect(screen.getByTestId('ai-card-verification')).toHaveTextContent(verdict.toUpperCase())
    if (verdict === 'unverifiable') {
      expect(screen.getByTestId('ai-card-verification')).not.toHaveTextContent(/^PASS$/)
      expect(screen.getByText(/could not safely verify|safely verify nahi/i)).toBeInTheDocument()
    }
  })

  it('renders result and revision-gated undo honestly', () => {
    const rt = runtime((interaction) => {
      interaction.begin(1, 'x')
      interaction.transition(1, 'executing')
      interaction.transition(1, 'verifying')
      interaction.addCard(1, {
        kind: 'result', transactionStatus: 'applied', mutationCount: 1, verification: 'pass', documentId: 1,
        postTransactionRevision: 2, activityId: 'tx-1', entityBindings: [{ alias: 'shape1', kind: 'node', id: 100 }],
        undo: { enabled: true, reason: 'reachable' },
      })
      interaction.transition(1, 'completed')
    })
    renderPanel(rt)
    expect(screen.getByTestId('ai-card-result')).toHaveTextContent('Mutations: 1')
    expect(screen.getByTestId('ai-card-result')).toHaveTextContent('Revision: 2')
    expect(screen.getByTestId('ai-undo-transaction')).toBeEnabled()
    fireEvent.click(screen.getByTestId('ai-undo-transaction'))
    expect(rt.undo).toHaveBeenCalledTimes(1)
  })
})

describe('A6.8 visible bounded conversation history', () => {
  it('renders previous user/assistant turns chronologically from the existing A6.2 store', () => {
    const rt = runtime()
    rt.context.appendTurn(1, { role: 'user', content: 'older user' })
    rt.context.appendTurn(1, { role: 'assistant', content: 'older assistant' })
    renderPanel(rt)
    const history = screen.getByTestId('ai-conversation-history')
    expect(history.children).toHaveLength(2)
    expect(history.children[0]).toHaveTextContent('older user')
    expect(history.children[1]).toHaveTextContent('older assistant')
    expect(screen.queryByTestId('ai-empty-state')).not.toBeInTheDocument()
  })

  it('never renders more than the structurally retained 12 turns', () => {
    const rt = runtime()
    for (let index = 0; index < 20; index += 1) {
      rt.context.appendTurn(1, { role: index % 2 ? 'assistant' : 'user', content: `history-${index}` })
    }
    renderPanel(rt)
    expect(screen.getByTestId('ai-conversation-history').children).toHaveLength(12)
    expect(screen.queryByText('history-7')).not.toBeInTheDocument()
    expect(screen.getByText('history-8')).toBeInTheDocument()
    expect(screen.getByText('history-19')).toBeInTheDocument()
  })

  it('renders current completed interaction exactly once, not once from each store', () => {
    const rt = runtime((interaction) => {
      interaction.begin(1, 'current user')
      interaction.addCard(1, { kind: 'assistant-message', text: 'current assistant' })
      interaction.transition(1, 'completed')
    })
    rt.context.appendTurn(1, { role: 'user', content: 'older user' })
    rt.context.appendTurn(1, { role: 'assistant', content: 'older assistant' })
    rt.context.appendTurn(1, { role: 'user', content: 'current user' })
    rt.context.appendTurn(1, { role: 'assistant', content: 'current assistant' })
    renderPanel(rt)
    expect(screen.getAllByText('current user')).toHaveLength(1)
    expect(screen.getAllByText('current assistant')).toHaveLength(1)
    expect(screen.getByText('older user')).toBeInTheDocument()
    expect(screen.getByText('older assistant')).toBeInTheDocument()
  })

  it('keeps historical turns document-local across A → B → A switching', () => {
    const rt = runtime()
    rt.context.appendTurn(1, { role: 'user', content: 'A history' })
    rt.context.appendTurn(2, { role: 'user', content: 'B history' })
    const rendered = render(<AiPanel runtime={rt} documentId={1} onClose={() => {}} />)
    expect(screen.getByText('A history')).toBeInTheDocument()
    expect(screen.queryByText('B history')).not.toBeInTheDocument()
    rendered.rerender(<AiPanel runtime={rt} documentId={2} onClose={() => {}} />)
    expect(screen.getByText('B history')).toBeInTheDocument()
    expect(screen.queryByText('A history')).not.toBeInTheDocument()
    rendered.rerender(<AiPanel runtime={rt} documentId={1} onClose={() => {}} />)
    expect(screen.getByText('A history')).toBeInTheDocument()
  })

  it('close/reopen retains visible history without project persistence', () => {
    const rt = runtime()
    rt.context.appendTurn(1, { role: 'assistant', content: 'session-only history' })
    const first = render(<AiPanel runtime={rt} documentId={1} onClose={() => {}} />)
    expect(screen.getByText('session-only history')).toBeInTheDocument()
    first.unmount()
    render(<AiPanel runtime={rt} documentId={1} onClose={() => {}} />)
    expect(screen.getByText('session-only history')).toBeInTheDocument()
  })
})

describe('A6.6 document isolation/settings/footer', () => {
  it('close/reopen with the same App-owned runtime preserves document context/state', () => {
    const rt = runtime((interaction) => {
      interaction.begin(1, 'persist while panel closed')
      interaction.transition(1, 'completed')
    })
    const first = render(<AiPanel runtime={rt} documentId={1} onClose={() => {}} />)
    expect(screen.getByText('persist while panel closed')).toBeInTheDocument()
    first.unmount()
    render(<AiPanel runtime={rt} documentId={1} onClose={() => {}} />)
    expect(screen.getByText('persist while panel closed')).toBeInTheDocument()
  })

  it('switches A → B → A without mixing cards/results', () => {
    const rt = runtime((interaction) => {
      interaction.begin(1, 'A only')
      interaction.transition(1, 'completed')
      interaction.begin(2, 'B only')
      interaction.transition(2, 'completed')
    })
    const rendered = render(<AiPanel runtime={rt} documentId={1} onClose={() => {}} />)
    expect(screen.getByText('A only')).toBeInTheDocument()
    expect(screen.queryByText('B only')).not.toBeInTheDocument()
    rendered.rerender(<AiPanel runtime={rt} documentId={2} onClose={() => {}} />)
    expect(screen.getByText('B only')).toBeInTheDocument()
    expect(screen.queryByText('A only')).not.toBeInTheDocument()
    rendered.rerender(<AiPanel runtime={rt} documentId={1} onClose={() => {}} />)
    expect(screen.getByText('A only')).toBeInTheDocument()
  })

  it('shows only live supported empty-state examples', () => {
    renderPanel()
    const empty = screen.getByTestId('ai-empty-state')
    expect(empty).toHaveTextContent('Scene me kya kya hai?')
    expect(empty).toHaveTextContent('rect/oval')
    expect(empty).not.toHaveTextContent(/Pen|Pencil|Brush|Text|vision|image generation|gotoFrame/i)
  })

  it('uses the same provider, key, ceiling, consent and usage stores as orchestration/settings', () => {
    const rt = runtime()
    const cfg = rt.providerStore.upsert({ type: 'openai', label: 'Shared', model: 'shared-model' })!
    rt.providerStore.setActive(cfg.id)
    rt.keyVault.set(cfg.id, 'sk-shared-123456789')
    rt.ceiling.set(12_345)
    rt.usage.record({ configId: cfg.id, model: cfg.model, inputTokens: 10, outputTokens: 5 })
    renderPanel(rt)
    expect(screen.getByTestId('ai-header-provider')).toHaveTextContent('Shared / shared-model · key ✓')
    expect(screen.getByTestId('ai-usage-footer')).toHaveTextContent('Today 15 tok')
    expect(screen.getByTestId('ai-usage-footer')).toHaveTextContent('Ceiling 12345')
    fireEvent.click(screen.getByTestId('ai-settings-toggle'))
    expect(screen.getByTestId('ai-ceiling-input')).toHaveValue('12345')
    fireEvent.change(screen.getByTestId('ai-ceiling-input'), { target: { value: '20000' } })
    fireEvent.click(screen.getByTestId('ai-ceiling-save'))
    expect(rt.ceiling.get()).toBe(20_000)
  })

  it('shares first-use consent state between settings and panel readiness', () => {
    const rt = runtime()
    const cfg = rt.providerStore.upsert({ type: 'openai', label: 'Shared', model: 'model' })!
    rt.providerStore.setActive(cfg.id)
    rt.keyVault.set(cfg.id, 'sk-shared-123456789')
    rt.ceiling.set(10_000)
    renderPanel(rt)
    expect(screen.getByTestId('ai-readiness')).toHaveTextContent('Consent required')
    fireEvent.click(screen.getByTestId('ai-settings-toggle'))
    fireEvent.click(screen.getByTestId('ai-consent-accept'))
    expect(screen.getByTestId('ai-readiness')).toHaveTextContent('AI context ready')
  })

  it('clear requires confirmation and removes only active document context/state', () => {
    const rt = runtime((interaction) => {
      interaction.begin(1, 'A')
      interaction.transition(1, 'completed')
      interaction.begin(2, 'B')
      interaction.transition(2, 'completed')
    })
    rt.context.appendTurn(1, { role: 'user', content: 'A context' })
    rt.context.appendTurn(2, { role: 'user', content: 'B context' })
    renderPanel(rt)
    fireEvent.click(screen.getByTestId('ai-clear'))
    expect(screen.getByTestId('ai-clear-confirm')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('ai-clear-confirm'))
    expect(rt.context.get(1).turns).toEqual([])
    expect(rt.context.get(2).turns).toHaveLength(1)
    expect(rt.interaction.get(2).cards[0]).toMatchObject({ text: 'B' })
  })
})
