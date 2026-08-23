import { useState } from 'react'
import type {
  ConfirmationCard,
  InteractionCard,
  InteractionSnapshot,
  ResultCard,
} from './interaction'
import { undoReachability } from './interaction'
import type { AiRuntime } from './runtime'

interface Props {
  state: InteractionSnapshot
  runtime: AiRuntime
  documentId: number
  onApply: () => void
  onEditRequest: (text: string) => void
  onCancel: () => void
  onConfirm: (typed: boolean) => void
  onRefresh: () => void
}

const CARD: React.CSSProperties = {
  border: '1px solid #383838',
  borderRadius: 6,
  padding: 9,
  background: '#1b1b1b',
  color: '#ddd',
  overflowWrap: 'anywhere',
}

function originalRequest(state: InteractionSnapshot): string {
  const card = state.cards.find((candidate) => candidate.kind === 'user-message')
  return card?.kind === 'user-message' ? card.text : ''
}

function ConfirmationView({ card, onConfirm, onCancel }: {
  card: ConfirmationCard
  onConfirm: (typed: boolean) => void
  onCancel: () => void
}) {
  const [typed, setTyped] = useState('')
  const accepted = !card.typedRequired || typed === 'CONFIRM'
  return (
    <section data-testid="ai-card-confirmation" style={{ ...CARD, borderColor: '#8b5e22', background: '#2a2117' }}>
      <strong>{card.typedRequired ? 'Mass-destructive confirmation' : 'Tier-B confirmation'}</strong>
      <div>{card.message}</div>
      <div data-testid="ai-confirm-scope" style={{ fontSize: 11, color: '#d8b06c' }}>
        Affected action rows: {card.affectedActions.length ? card.affectedActions.map((i) => i + 1).join(', ') : 'plan-level approval'}
      </div>
      {card.typedRequired && (
        <label style={{ display: 'grid', gap: 3, marginTop: 6 }}>
          Type CONFIRM
          <input
            data-testid="ai-typed-confirmation"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
          />
        </label>
      )}
      <div style={{ display: 'flex', gap: 6, marginTop: 7 }}>
        <button data-testid="ai-confirm-apply" disabled={!accepted} onClick={() => onConfirm(card.typedRequired)}>
          Confirm
        </button>
        <button data-testid="ai-confirm-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </section>
  )
}

function ResultView({ card, runtime, onRefresh }: {
  card: ResultCard
  runtime: AiRuntime
  onRefresh: () => void
}) {
  const liveUndo = undoReachability({
    transactionDocumentId: card.documentId,
    activeDocumentId: runtime.activeDocumentId(),
    mutationCount: card.mutationCount,
    postTransactionRevision: card.postTransactionRevision,
    currentRevision: runtime.currentRevision(),
  })
  const onUndo = (): void => {
    const recheck = undoReachability({
      transactionDocumentId: card.documentId,
      activeDocumentId: runtime.activeDocumentId(),
      mutationCount: card.mutationCount,
      postTransactionRevision: card.postTransactionRevision,
      currentRevision: runtime.currentRevision(),
    })
    if (!recheck.enabled) return
    runtime.undo()
    onRefresh()
  }
  return (
    <section data-testid="ai-card-result" style={{ ...CARD, borderColor: '#335f43' }}>
      <strong>Result · {card.transactionStatus}</strong>
      <div>Mutations: {card.mutationCount}</div>
      <div>Verification: {card.verification.toUpperCase()}</div>
      <div>Revision: {card.postTransactionRevision ?? 'unavailable'}</div>
      <div>Activity: {card.activityId ?? 'unavailable'}</div>
      <div>Entities: {card.entityBindings.map((binding) => `${binding.alias}:${binding.kind}`).join(', ') || 'none'}</div>
      <button data-testid="ai-undo-transaction" disabled={!liveUndo.enabled} title={liveUndo.reason} onClick={onUndo}>
        Undo this transaction
      </button>
      {!liveUndo.enabled && <div data-testid="ai-undo-reason" style={{ fontSize: 11, color: '#aaa' }}>{liveUndo.reason}</div>}
    </section>
  )
}

function CardView(props: Props & { card: Readonly<InteractionCard> }) {
  const { card, state } = props
  switch (card.kind) {
    case 'user-message':
      return <div data-testid="ai-card-user" style={{ ...CARD, marginLeft: 26, background: '#203044' }}>{card.text}</div>
    case 'assistant-message':
      return <div data-testid="ai-card-assistant" style={CARD}>{card.text}</div>
    case 'plan':
      return (
        <section data-testid="ai-card-plan" style={{ ...CARD, borderColor: '#365f85' }}>
          <strong>Validated plan · {card.plan.actions.length} actions</strong>
          <ol data-testid="ai-plan-actions" style={{ margin: '6px 0', paddingLeft: 22 }}>
            {card.plan.actions.map((action) => (
              <li key={`${action.index}-${action.id ?? action.action}`} data-tier={action.tier} style={{ color: action.tier === 'B' ? '#f1b96d' : '#ddd' }}>
                <span>{action.humanText}</span> <small>· tier {action.tier}</small>
              </li>
            ))}
          </ol>
          <div>Estimated mutations: {card.plan.budget.estimatedMutations}</div>
          <div>Confirmation: {card.plan.massDestructive ? 'typed required' : card.plan.requiresConfirmation ? 'tier-B required' : 'normal approval'}</div>
          {card.plan.expected.length > 0 && (
            <div data-testid="ai-plan-expected" style={{ marginTop: 5 }}>
              Expected (display only): {card.plan.expected.join(' · ')}
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 7 }}>
            <button data-testid="ai-plan-apply" onClick={props.onApply}>Apply</button>
            <button data-testid="ai-plan-edit" onClick={() => props.onEditRequest(originalRequest(state))}>Edit as text</button>
            <button data-testid="ai-plan-cancel" onClick={props.onCancel}>Cancel</button>
          </div>
        </section>
      )
    case 'progress':
      return (
        <section data-testid="ai-card-progress" style={CARD}>
          <strong>{card.stage}</strong>
          <div>{card.detail}</div>
          {card.current !== undefined && card.total !== undefined && <div>{card.current}/{card.total}</div>}
        </section>
      )
    case 'confirmation':
      return <ConfirmationView card={card} onConfirm={props.onConfirm} onCancel={props.onCancel} />
    case 'verification':
      return (
        <section data-testid="ai-card-verification" data-verdict={card.report.verdict} style={{ ...CARD, borderColor: card.report.verdict === 'pass' ? '#3f7b50' : card.report.verdict === 'fail' ? '#8b3e3e' : '#806b32' }}>
          <strong>{card.report.verdict.toUpperCase()}</strong>
          {card.report.verdict === 'unverifiable' && <div>Kineora available structural state se effect safely verify nahi kar saka.</div>}
          <ul style={{ margin: '5px 0', paddingLeft: 18 }}>
            {card.report.rows.map((row, index) => <li key={index}>{row.status.toUpperCase()} · {row.check}</li>)}
          </ul>
        </section>
      )
    case 'result':
      return <ResultView card={card} runtime={props.runtime} onRefresh={props.onRefresh} />
    case 'error':
      return (
        <section data-testid="ai-card-error" role="alert" style={{ ...CARD, borderColor: '#8b3e3e', background: '#2a1919' }}>
          <strong>{card.error.kind}</strong>
          <div>{card.error.message}</div>
          {card.error.sourceCode && <small>Code: {card.error.sourceCode}</small>}
        </section>
      )
    case 'activity':
      return (
        <details data-testid="ai-card-activity" style={CARD}>
          <summary>Activity · {card.activity.outcome} · {card.activity.mutationCount} mutations</summary>
          <ol>
            {card.activity.actions.map((action) => (
              <li key={action.index}>{action.summary} · {action.status}</li>
            ))}
          </ol>
        </details>
      )
  }
}

export function AiCardStream(props: Props) {
  return (
    <div data-testid="ai-message-stream" role="log" aria-live="polite" style={{ display: 'grid', gap: 7 }}>
      {props.state.cards.map((card) => <CardView key={card.seq} {...props} card={card} />)}
    </div>
  )
}
