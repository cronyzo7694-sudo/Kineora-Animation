import { useEffect } from 'react'
import type { RecoveryCandidate } from '../autosave'

interface Props {
  /** Non-null while the app is in the transient RECOVERED state (H00 T12). */
  candidate: RecoveryCandidate | null
  onAccept: () => void
  onDiscard: () => void
  /** Accept in flight — both buttons disabled (no double-submit). */
  busy?: boolean
}

/**
 * SYS-28 launch-recovery prompt (H00 §6.3 T12–T14; H10 §5.4). Shown when a
 * `.autosave` slot holds changes newer than the last manual save. Accept →
 * recovered doc ACTIVE(TITLED, CLEAN) (T13); Discard → NO_DOCUMENT, slot
 * cleared (T14 + AS-D4). There is NO cancel/escape path: T12's only exits
 * are T13 and T14 (Esc maps to Discard would be a silent data decision —
 * instead Esc is inert; an explicit button click is required for a
 * destructive-adjacent choice, mirroring the destructive-safety doctrine).
 */
export function RecoveryDialog({ candidate, onAccept, onDiscard, busy = false }: Props) {
  useEffect(() => {
    if (!candidate) return
    const onKey = (e: KeyboardEvent) => {
      // Swallow Escape: T12 has no cancel transition (see docstring).
      if (e.key === 'Escape') e.stopPropagation()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [candidate])

  if (!candidate) return null

  const when = candidate.savedAt ? new Date(candidate.savedAt).toLocaleString() : 'an earlier session'

  return (
    <div data-testid="dlg-recovery" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 95 }}>
      <div role="alertdialog" aria-label="Recover unsaved changes" style={{ width: 400, maxWidth: '92vw', background: 'var(--kineora-surface)', color: 'var(--kineora-text)', border: '1px solid var(--kineora-border-2)', borderRadius: 8, padding: 18, boxShadow: '0 16px 48px rgba(0,0,0,0.7)', colorScheme: 'dark' }}>
        <h3 style={{ margin: '0 0 8px', color: 'var(--kineora-text-bright)', fontSize: 15 }}>Recover unsaved changes?</h3>
        <p style={{ margin: '0 0 16px', color: 'var(--kineora-muted)', fontSize: 13 }}>
          Kineora found autosaved changes for <strong style={{ color: 'var(--kineora-text)' }}>{candidate.title}</strong> from {when} that were never saved
          {candidate.projectPath ? <> to <code style={{ fontSize: 12 }}>{candidate.projectPath}</code></> : null}. Recover them?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {/* T14: Discard = the autosaved changes are lost — danger token (H11 §4). */}
          <button data-testid="dlg-recovery-discard" onClick={onDiscard} disabled={busy} style={{ padding: '6px 14px', borderRadius: 4, border: '1px solid var(--kineora-danger)', background: 'var(--kineora-btn-bg)', color: 'var(--kineora-danger)', cursor: 'pointer', fontSize: 13, opacity: busy ? 0.5 : 1 }}>
            Discard
          </button>
          <button data-testid="dlg-recovery-accept" onClick={onAccept} disabled={busy} style={{ padding: '6px 14px', borderRadius: 4, border: '1px solid var(--kineora-btn-primary-border)', background: 'var(--kineora-btn-primary-bg)', color: 'var(--kineora-accent-text)', cursor: 'pointer', fontSize: 13, opacity: busy ? 0.5 : 1 }}>
            {busy ? 'Recovering…' : 'Recover'}
          </button>
        </div>
      </div>
    </div>
  )
}
