import { useEffect, useReducer, useState } from 'react'
import { AiProviderSettings } from './AiProviderSettings'
import { AiCardStream } from './AiCards'
import type { AiMode } from './prompt'
import { redactText } from './redact'
import type { AiRuntime } from './runtime'

export interface AiPanelProps {
  runtime: AiRuntime
  documentId: number | null
  onClose: () => void
}

const MIN_WIDTH = 320
const MAX_WIDTH = 480
const DEFAULT_WIDTH = 380

function clampWidth(value: number): number {
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, value))
}

export function AiPanel({ runtime, documentId, onClose }: AiPanelProps) {
  const [, force] = useReducer((value: number) => value + 1, 0)
  const [collapsed, setCollapsed] = useState(false)
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [capabilitiesOpen, setCapabilitiesOpen] = useState(false)
  const [mode, setMode] = useState<AiMode>('preview')
  const [draft, setDraft] = useState('')
  const [keyWarning, setKeyWarning] = useState(false)
  const [ceilingDraft, setCeilingDraft] = useState(() => String(runtime.ceiling.get() ?? ''))
  const [ceilingError, setCeilingError] = useState('')
  const [clearConfirm, setClearConfirm] = useState(false)
  const [interactionState, setInteractionState] = useState(() =>
    documentId
      ? runtime.orchestrator.state(documentId)
      : { documentId: 0, phase: 'unavailable' as const, cards: [] },
  )

  useEffect(() => runtime.providerStore.subscribe(force), [runtime, force])
  useEffect(() => runtime.usage.subscribe(force), [runtime, force])
  useEffect(() => {
    setInteractionState(
      documentId
        ? runtime.orchestrator.state(documentId)
        : { documentId: 0, phase: 'unavailable', cards: [] },
    )
    force()
    setClearConfirm(false)
  }, [documentId, runtime])

  const state = interactionState
  const provider = runtime.providerStore.active()
  const hasKey = provider ? runtime.keyVault.has(provider.id) : false
  const consent = runtime.hasConsent()
  const ceiling = runtime.ceiling.get()
  const sessionUsage = runtime.usage.session()
  const dailyUsage = runtime.usage.today()
  const usedToday = dailyUsage.inputTokens + dailyUsage.outputTokens
  const remaining = ceiling === null ? null : Math.max(0, ceiling - usedToday)
  const registry = runtime.capabilityRegistry()
  const generating = state.phase === 'generating' || state.phase === 'verifying'
  const originalRequest = state.cards.find((card) => card.kind === 'user-message')
  const originalText = originalRequest?.kind === 'user-message' ? originalRequest.text : ''

  const refresh = (): void => {
    setInteractionState(
      documentId
        ? runtime.orchestrator.state(documentId)
        : { documentId: 0, phase: 'unavailable', cards: [] },
    )
    force()
  }

  const send = async (request = draft): Promise<void> => {
    if (!documentId || request.trim() === '' || keyWarning || redactText(request) !== request || generating) return
    setDraft('')
    setKeyWarning(false)
    const pending = runtime.orchestrator.generate({ documentId, userRequest: request, mode })
    refresh()
    const result = await pending
    setInteractionState(result.state)
    force()
  }

  const stop = (): void => {
    if (!documentId) return
    const result = runtime.orchestrator.stop(documentId)
    setInteractionState(result.state)
    force()
  }

  const apply = async (): Promise<void> => {
    if (!documentId) return
    const result = await runtime.orchestrator.approve(documentId)
    setInteractionState(result.state)
    force()
  }

  const confirm = async (typed: boolean): Promise<void> => {
    if (!documentId) return
    const result = await runtime.orchestrator.approve(documentId, {
      tierBConfirmed: true,
      typedConfirmationAccepted: typed,
    })
    setInteractionState(result.state)
    force()
  }

  const cancel = (): void => {
    if (!documentId) return
    const result = runtime.orchestrator.stop(documentId)
    setInteractionState(result.state)
    force()
  }

  const editRequest = (text: string): void => {
    cancel()
    setDraft(text)
    setKeyWarning(false)
  }

  const clear = (): void => {
    if (!documentId) return
    runtime.context.clear(documentId)
    runtime.interaction.clear(documentId)
    setClearConfirm(false)
    setDraft('')
    setKeyWarning(false)
    refresh()
  }

  const saveCeiling = (): void => {
    const value = Number(ceilingDraft)
    if (!Number.isSafeInteger(value) || value <= 0) {
      setCeilingError('Positive whole-token ceiling required hai.')
      return
    }
    runtime.ceiling.set(value)
    setCeilingError('')
    refresh()
  }

  const examples: string[] = []
  if (registry?.get('scene.inspect')?.state === 'supported') examples.push('Scene me kya kya hai?')
  const shape = registry?.get('shape.create')
  if (shape?.state === 'supported') {
    const kinds = shape.params.shape.options?.join('/') ?? 'shape'
    examples.push(`Supported ${kinds} banao`)
  }
  if (registry?.get('node.setStyle')?.state === 'supported') examples.push('Selected shape ko blue karo')
  if (registry?.get('layer.rename')?.state === 'supported') examples.push('Selected layer rename karo')

  return (
    <aside
      data-testid="ai-panel"
      aria-label="Kineora AI panel"
      data-collapsed={collapsed ? 'true' : 'false'}
      style={{
        position: 'fixed',
        zIndex: 40,
        right: 10,
        top: 42,
        bottom: 28,
        width: collapsed ? 44 : clampWidth(width),
        minWidth: collapsed ? 44 : MIN_WIDTH,
        maxWidth: collapsed ? 44 : MAX_WIDTH,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #3b3b3b',
        borderRadius: 8,
        background: '#151515',
        boxShadow: '0 8px 28px rgba(0,0,0,.55)',
        color: '#ddd',
        overflow: 'hidden',
        fontSize: 12,
      }}
    >
      <header style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '7px 8px', borderBottom: collapsed ? 'none' : '1px solid #333' }}>
        <button data-testid="ai-collapse" aria-label={collapsed ? 'Expand Kineora AI' : 'Collapse Kineora AI'} onClick={() => setCollapsed((value) => !value)}>
          {collapsed ? '◂' : '▸'}
        </button>
        {!collapsed && (
          <>
            <strong style={{ color: '#8edfff' }}>Kineora AI</strong>
            <span data-testid="ai-header-provider" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {provider ? `${provider.label} / ${provider.model}` : 'No provider configured'} · {hasKey ? 'key ✓' : 'key ✗'}
            </span>
            <span data-testid="ai-header-mode" style={{ color: '#bcd' }}>{mode.toUpperCase()}</span>
            <button data-testid="ai-settings-toggle" aria-label="AI settings" onClick={() => setSettingsOpen((value) => !value)}>⚙</button>
            <button data-testid="ai-close" aria-label="Close Kineora AI" onClick={onClose}>×</button>
          </>
        )}
      </header>

      {!collapsed && (
        <>
          <section data-testid="ai-readiness" style={{ padding: '6px 9px', borderBottom: '1px solid #292929', color: provider && hasKey && consent && ceiling !== null ? '#76c893' : '#e5b567' }}>
            {!documentId
              ? 'No active document'
              : !provider
                ? 'No provider configured'
                : !hasKey
                  ? 'API key missing'
                  : !consent
                    ? 'Consent required'
                    : ceiling === null
                      ? 'Usage ceiling not configured'
                      : registry === null
                        ? 'Live AI capabilities unavailable — WASM rebuild required'
                        : 'Provider configured · AI context ready'}
          </section>

          <section style={{ borderBottom: '1px solid #292929' }}>
            <button data-testid="ai-capability-toggle" onClick={() => setCapabilitiesOpen((value) => !value)} style={{ width: '100%', textAlign: 'left' }}>
              Main kya kar sakta hoon is build me {capabilitiesOpen ? '▾' : '▸'}
            </button>
            {capabilitiesOpen && (
              <div data-testid="ai-capability-banner" style={{ padding: 8, maxHeight: 150, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                {registry ? registry.toPromptText() : 'Live capability registry unavailable.'}
              </div>
            )}
          </section>

          {settingsOpen && (
            <section data-testid="ai-settings-pane" style={{ overflow: 'auto', maxHeight: '55%', borderBottom: '1px solid #333' }}>
              <AiProviderSettings
                storage={runtime.storage}
                store={runtime.providerStore}
                vault={runtime.keyVault}
                adapters={runtime.adapters}
                onStateChange={refresh}
              />
              <div style={{ padding: 12, display: 'grid', gap: 5 }}>
                <label>
                  Daily token ceiling
                  <input data-testid="ai-ceiling-input" value={ceilingDraft} onChange={(event) => setCeilingDraft(event.target.value)} inputMode="numeric" />
                </label>
                <button data-testid="ai-ceiling-save" onClick={saveCeiling}>Save ceiling</button>
                {ceilingError && <div role="alert">{ceilingError}</div>}
              </div>
            </section>
          )}

          <main data-testid="ai-panel-body" style={{ flex: 1, overflow: 'auto', padding: 8 }}>
            {state.cards.length === 0 && (
              <div data-testid="ai-empty-state" style={{ color: '#aaa' }}>
                <strong>Animation command center</strong>
                {examples.length > 0 ? (
                  <ul>{examples.map((example) => <li key={example}>{example}</li>)}</ul>
                ) : (
                  <p>Live supported capabilities attach hone par safe examples dikhenge.</p>
                )}
              </div>
            )}
            <AiCardStream
              state={state}
              runtime={runtime}
              documentId={documentId ?? 0}
              onApply={() => void apply()}
              onEditRequest={editRequest}
              onCancel={cancel}
              onConfirm={(typed) => void confirm(typed)}
              onRefresh={refresh}
            />
            {originalText && state.phase !== 'generating' && (
              <button data-testid="ai-regenerate" onClick={() => void send(originalText)}>Regenerate</button>
            )}
            {(state.phase === 'failed' || state.phase === 'unavailable' || state.phase === 'cancelled') && originalText && (
              <button data-testid="ai-retry" onClick={() => void send(originalText)}>Retry</button>
            )}
          </main>

          <section style={{ padding: 8, borderTop: '1px solid #333', display: 'grid', gap: 6 }}>
            <select data-testid="ai-mode" aria-label="AI mode" value={mode} onChange={(event) => setMode(event.target.value as AiMode)}>
              <option value="ask">ASK</option>
              <option value="preview">PREVIEW</option>
              <option value="apply">APPLY</option>
            </select>
            <textarea
              data-testid="ai-composer"
              aria-label="Kineora AI request"
              rows={3}
              value={draft}
              onChange={(event) => {
                const safe = redactText(event.target.value)
                setDraft(safe)
                setKeyWarning(safe !== event.target.value)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  void send()
                }
              }}
              placeholder="Animation request likho…"
            />
            {keyWarning && (
              <div data-testid="ai-key-warning" role="alert" style={{ color: '#ef9a9a' }}>
                Ye API key jaisa lag raha hai. Key ko Settings me daalo; request store/send nahi hogi.
              </div>
            )}
            <div style={{ display: 'flex', gap: 6 }}>
              {generating ? (
                <button data-testid="ai-stop" onClick={stop}>Stop</button>
              ) : (
                <button data-testid="ai-send" disabled={!documentId || draft.trim() === '' || keyWarning} onClick={() => void send()}>Send</button>
              )}
              {!clearConfirm ? (
                <button data-testid="ai-clear" onClick={() => setClearConfirm(true)}>Clear conversation</button>
              ) : (
                <>
                  <button data-testid="ai-clear-confirm" onClick={clear}>Confirm clear</button>
                  <button data-testid="ai-clear-cancel" onClick={() => setClearConfirm(false)}>Keep</button>
                </>
              )}
            </div>
          </section>

          <footer data-testid="ai-usage-footer" style={{ padding: '6px 8px', borderTop: '1px solid #292929', color: '#888' }}>
            Context: {runtime.context.get(documentId ?? 1).turns.length}/12 turns · Session {sessionUsage.inputTokens + sessionUsage.outputTokens} tok · Today {usedToday} tok · Ceiling {ceiling ?? 'not configured'} · Remaining {remaining ?? 'unavailable'}
            <label style={{ display: 'block', marginTop: 4 }}>
              Panel width {clampWidth(width)}px
              <input
                data-testid="ai-width"
                type="range"
                min={MIN_WIDTH}
                max={MAX_WIDTH}
                value={clampWidth(width)}
                onChange={(event) => setWidth(clampWidth(Number(event.target.value)))}
              />
            </label>
          </footer>
        </>
      )}
    </aside>
  )
}

export const AI_PANEL_WIDTH = Object.freeze({ min: MIN_WIDTH, max: MAX_WIDTH, default: DEFAULT_WIDTH })
