import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { RecoveryDialog } from './RecoveryDialog'
import type { RecoveryCandidate } from '../autosave'

const CANDIDATE: RecoveryCandidate = {
  source: 'native',
  title: 'My Project',
  content: '{}',
  savedAt: 1700000000000,
  projectPath: '/tmp/proj.json',
}

describe('RecoveryDialog (SYS-28 T12–T14 launch recovery prompt)', () => {
  it('renders nothing outside the RECOVERED state', () => {
    render(<RecoveryDialog candidate={null} onAccept={() => {}} onDiscard={() => {}} />)
    expect(screen.queryByTestId('dlg-recovery')).toBeNull()
  })

  it('shows the document title + project path and both T13/T14 actions', () => {
    render(<RecoveryDialog candidate={CANDIDATE} onAccept={() => {}} onDiscard={() => {}} />)
    expect(screen.getByRole('alertdialog', { name: 'Recover unsaved changes' })).toBeTruthy()
    expect(screen.getByText('My Project')).toBeTruthy()
    expect(screen.getByText('/tmp/proj.json')).toBeTruthy()
    expect(screen.getByTestId('dlg-recovery-accept')).toBeTruthy()
    expect(screen.getByTestId('dlg-recovery-discard')).toBeTruthy()
  })

  it('Recover → onAccept (T13); Discard → onDiscard (T14)', () => {
    const onAccept = vi.fn()
    const onDiscard = vi.fn()
    render(<RecoveryDialog candidate={CANDIDATE} onAccept={onAccept} onDiscard={onDiscard} />)
    fireEvent.click(screen.getByTestId('dlg-recovery-accept'))
    expect(onAccept).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByTestId('dlg-recovery-discard'))
    expect(onDiscard).toHaveBeenCalledTimes(1)
  })

  it('busy (accept in flight) disables both buttons — no double-submit', () => {
    const onAccept = vi.fn()
    const onDiscard = vi.fn()
    render(<RecoveryDialog candidate={CANDIDATE} busy onAccept={onAccept} onDiscard={onDiscard} />)
    const accept = screen.getByTestId('dlg-recovery-accept') as HTMLButtonElement
    const discard = screen.getByTestId('dlg-recovery-discard') as HTMLButtonElement
    expect(accept.disabled).toBe(true)
    expect(discard.disabled).toBe(true)
    fireEvent.click(accept)
    fireEvent.click(discard)
    expect(onAccept).not.toHaveBeenCalled()
    expect(onDiscard).not.toHaveBeenCalled()
  })

  it('Escape is INERT — T12 has no cancel transition (only T13/T14 exits)', () => {
    const onAccept = vi.fn()
    const onDiscard = vi.fn()
    render(<RecoveryDialog candidate={CANDIDATE} onAccept={onAccept} onDiscard={onDiscard} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onAccept).not.toHaveBeenCalled()
    expect(onDiscard).not.toHaveBeenCalled()
    expect(screen.getByTestId('dlg-recovery')).toBeTruthy()
  })
})
