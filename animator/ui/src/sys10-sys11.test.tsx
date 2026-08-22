// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { DebugPanel } from './components/DebugPanel'
import { outputLog } from './outputLog'
import { debugViewController, findCommandByEvent, getCommand, makeCommandContext } from './commands'
import { useShortcutScope } from './shortcuts'

describe('SYS-10 — Debug panel + Output console', () => {
  beforeEach(() => outputLog.clear())
  afterEach(() => outputLog.clear())

  it('renders the output log (including entries added before mount) and counts errors/warnings', () => {
    outputLog.append('info', 'bus', 'started')
    outputLog.append('error', 'engine', 'boom')
    outputLog.append('warn', 'handoff', 'future unit')
    render(
      <DebugPanel
        registryErrors={[]}
        toasts={[]}
        engine={{ kind: 'ok', detail: '' }}
        engineLog={[]}
      />,
    )
    expect(screen.getByTestId('output-log')).toBeInTheDocument()
    expect(screen.getByText(/boom/)).toBeInTheDocument()
    expect(screen.getByText(/future unit/)).toBeInTheDocument()
    expect(screen.getByTestId('output-count').textContent).toContain('1 err')
    expect(screen.getByTestId('output-count').textContent).toContain('1 warn')
  })

  it('shows an empty-state when there is no output', () => {
    render(
      <DebugPanel registryErrors={[]} toasts={[]} engine={{ kind: 'ok', detail: '' }} engineLog={[]} />,
    )
    expect(screen.getByText(/no output/i)).toBeInTheDocument()
  })

  it('debug.clearOutput clears the output console', () => {
    outputLog.append('info', 'x', 'one')
    outputLog.append('info', 'x', 'two')
    render(
      <DebugPanel registryErrors={[]} toasts={[]} engine={{ kind: 'ok', detail: '' }} engineLog={[]} />,
    )
    const notify = vi.fn()
    getCommand('debug.clearOutput')!.run(makeCommandContext({ notify }))
    expect(outputLog.size()).toBe(0)
    expect(notify).toHaveBeenCalledWith('output: cleared')
  })

  it('debug.copyOutput reports "nothing to copy" when empty', () => {
    // Ensure the debug controller is registered
    render(
      <DebugPanel registryErrors={[]} toasts={[]} engine={{ kind: 'ok', detail: '' }} engineLog={[]} />,
    )
    expect(debugViewController.current).not.toBeNull()
    const notify = vi.fn()
    getCommand('debug.copyOutput')!.run(makeCommandContext({ notify }))
    expect(notify).toHaveBeenLastCalledWith('output: nothing to copy')
  })

  it('debug.copyOutput writes timestamped lines via navigator.clipboard when available', async () => {
    outputLog.append('error', 'bus', 'kaboom')
    const writeText = vi.fn<(s: string) => Promise<void>>(() => Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    render(
      <DebugPanel registryErrors={[]} toasts={[]} engine={{ kind: 'ok', detail: '' }} engineLog={[]} />,
    )
    const notify = vi.fn()
    getCommand('debug.copyOutput')!.run(makeCommandContext({ notify }))
    // Promise resolves on microtask
    await Promise.resolve()
    expect(writeText).toHaveBeenCalledTimes(1)
    const copied = writeText.mock.calls[0][0] as string
    expect(copied).toContain('[error]')
    expect(copied).toContain('bus')
    expect(copied).toContain('kaboom')
    expect(notify).toHaveBeenLastCalledWith('output: copied to clipboard')
  })

  it('debug.as3 is UNAVAILABLE with a reason (never fakes ActionScript)', () => {
    const as3 = getCommand('debug.as3')!
    expect(as3.status).toBe('UNAVAILABLE')
    expect(as3.reason).toMatch(/actionscript/i)
  })

  it('registry shows 0 dead buttons when there are no errors', () => {
    render(
      <DebugPanel registryErrors={[]} toasts={[]} engine={{ kind: 'ok', detail: '' }} engineLog={[]} />,
    )
    expect(screen.getByTestId('dead-button-count').textContent).toMatch(/0 dead buttons/)
  })
})

describe('SYS-11 — Window ▸ Hide/Show All Panels', () => {
  it('checked reflects whether any panel is visible', () => {
    const noop = () => {}
    const allVisible = makeCommandContext({ notify: noop, panels: { tools: true, timeline: true } })
    expect(getCommand('window.hideAllPanels')!.checked?.(allVisible)).toBe(true)
    const allHidden = makeCommandContext({ notify: noop, panels: { tools: false, timeline: false } })
    expect(getCommand('window.hideAllPanels')!.checked?.(allHidden)).toBe(false)
  })

  it('the command hides all panels when any are visible (menu path — INT-AIA-002)', () => {
    const setAll = vi.fn()
    const ctx = makeCommandContext({
      notify: vi.fn(),
      panels: { tools: true, timeline: true },
      setAllPanelsVisible: setAll,
    })
    getCommand('window.hideAllPanels')!.run(ctx)
    expect(setAll).toHaveBeenCalledTimes(1)
    expect(setAll).toHaveBeenCalledWith(false)
  })

  it('F4 is SYS-01 Properties (C-09), not Hide All — INT-AIA-002', () => {
    expect(getCommand('window.hideAllPanels')!.shortcut).toBeUndefined()
    expect(findCommandByEvent({ key: 'F4' })?.id).toBe('panel.show')
  })

  it('F4 in an <input> does not hide panels while typing', () => {
    const setAll = vi.fn()
    function Scope(): null {
      const ctx = makeCommandContext({
        notify: vi.fn(),
        panels: { tools: true },
        setAllPanelsVisible: setAll,
      })
      useShortcutScope(new Set(['window.hideAllPanels', 'panel.show']), ctx)
      return null
    }
    render(<Scope />)
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    fireEvent.keyDown(input, { key: 'F4' })
    expect(setAll).not.toHaveBeenCalled()
    document.body.removeChild(input)
  })
})
