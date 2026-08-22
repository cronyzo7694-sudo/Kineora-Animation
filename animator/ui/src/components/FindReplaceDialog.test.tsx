import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../engine/client', () => ({
  projectJson: () =>
    JSON.stringify({
      nodes: { '1': { Rect: { fill: '#ff0000', stroke: null } } },
      scenes: [{ layers: [{ visible: true, locked: false, keyframes: { '1': { Keyframe: { content: [1] } } } }] }],
    }),
  statusJson: () => ({ selection: [] }),
  library: () => [{ id: 1, name: 'A', type: 'graphic', use_count: 0, duration: 1 }],
  setNodeProps: vi.fn(),
  swapInstance: vi.fn(() => true),
}))

import { setNodeProps } from '../engine/client'
import { FindReplaceDialog } from './FindReplaceDialog'

describe('FindReplaceDialog', () => {
  it('Find All on unknown color reports 0 matches', () => {
    const notify = vi.fn()
    render(<FindReplaceDialog open onClose={() => {}} notify={notify} />)
    fireEvent.change(screen.getByTestId('fr-find-color'), { target: { value: '#123456' } })
    fireEvent.click(screen.getByTestId('fr-find'))
    expect(screen.getByTestId('fr-log')).toHaveTextContent('0 matches')
    expect(notify).toHaveBeenCalledWith('0 matches')
  })

  it('Replace All colors uses one setNodeProps batch', () => {
    const notify = vi.fn()
    render(<FindReplaceDialog open onClose={() => {}} notify={notify} />)
    fireEvent.click(screen.getByTestId('fr-replace-all'))
    expect(vi.mocked(setNodeProps)).toHaveBeenCalled()
    expect(notify.mock.calls[0][0]).toMatch(/one undo/)
  })

  it('text target is honest 0 matches', () => {
    const notify = vi.fn()
    render(<FindReplaceDialog open onClose={() => {}} notify={notify} />)
    fireEvent.change(screen.getByTestId('fr-target'), { target: { value: 'text' } })
    fireEvent.click(screen.getByTestId('fr-find'))
    expect(screen.getByTestId('fr-log').textContent).toMatch(/0 matches/)
  })

  it('Cancel closes', () => {
    const onClose = vi.fn()
    render(<FindReplaceDialog open onClose={onClose} notify={() => {}} />)
    fireEvent.click(screen.getByTestId('fr-cancel'))
    expect(onClose).toHaveBeenCalled()
  })
})
