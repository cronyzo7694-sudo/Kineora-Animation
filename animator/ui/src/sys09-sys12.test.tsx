// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { HelpDialog } from './components/HelpDialog'
import { useShortcutScope } from './shortcuts'

// Mock the engine client so seekPlayhead's setPlayheadEngine call is a spy and
// statusJson returns a controllable document. vi.hoisted ensures the spies
// exist when the vi.mock factory runs (factories are hoisted above imports).
const { setPlayheadSpy, statusJsonSpy } = vi.hoisted(() => ({
  setPlayheadSpy: vi.fn((f: number) => f),
  statusJsonSpy: vi.fn(() => ({ playhead: 1, duration: 10, fps: 24 })),
}))
vi.mock('./engine/client', () => ({
  setPlayhead: (f: number) => setPlayheadSpy(f),
  statusJson: () => statusJsonSpy(),
  // Engine is "attached" so togglePlay()/seek paths run for real.
  getEngine: () => ({ kineora_set_playhead: setPlayheadSpy }),
  getEngineStatus: () => ({ kind: 'ok', detail: 'attached' }),
}))

import { bus } from './bus'
import {
  isPaused,
  isPlaying,
  pausePlayback,
  playbackState,
  seekPlayhead,
  setLoopEnabled,
  stopPlayback,
  togglePlay,
} from './engine/actions'
import { getCommand, makeCommandContext } from './commands'

const notify = vi.fn()
const OK = { kind: 'ok' as const, detail: 'attached' }
function ctx(extra: Partial<Parameters<typeof makeCommandContext>[0]> = {}) {
  return makeCommandContext({ notify, engine: OK, ...extra })
}

describe('SYS-09 — STM-PLAYBACK state machine (engineering 04)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    notify.mockClear()
    setPlayheadSpy.mockClear()
    // Default 10-frame/24fps document. Tests that need a different playhead
    // call statusJsonSpy.mockReturnValue(...) INSIDE the test (after this).
    statusJsonSpy.mockReturnValue({ playhead: 1, duration: 10, fps: 24 })
    setLoopEnabled(true)
    stopPlayback()
  })
  afterEach(() => {
    stopPlayback()
    vi.useRealTimers()
  })

  it('starts IDLE; play() transitions to PLAYING and emits playback:started', () => {
    const started = vi.fn()
    bus.on('playback:started', started)
    expect(playbackState()).toBe('IDLE')
    expect(isPlaying()).toBe(false)
    togglePlay(notify)
    expect(playbackState()).toBe('PLAYING')
    expect(isPlaying()).toBe(true)
    expect(isPaused()).toBe(false)
    expect(started).toHaveBeenCalledTimes(1)
  })

  it('PLAYING --toggle--> PAUSED and emits playback:paused (Enter toggles, not stop)', () => {
    const paused = vi.fn()
    bus.on('playback:paused', paused)
    togglePlay(notify) // PLAYING
    togglePlay(notify) // pause
    expect(playbackState()).toBe('PAUSED')
    expect(isPlaying()).toBe(false)
    expect(isPaused()).toBe(true)
    expect(paused).toHaveBeenCalledTimes(1)
    // Paused does not advance frames.
    setPlayheadSpy.mockClear()
    vi.advanceTimersByTime(1000)
    expect(setPlayheadSpy).not.toHaveBeenCalled()
  })

  it('PAUSED --play()--> PLAYING resumes (emits started; ticks advance from current frame)', () => {
    statusJsonSpy.mockReturnValue({ playhead: 4, duration: 10, fps: 24 })
    const started = vi.fn()
    bus.on('playback:started', started)
    togglePlay(notify)
    togglePlay(notify) // PAUSED
    started.mockClear()
    setPlayheadSpy.mockClear()
    togglePlay(notify) // resume
    expect(playbackState()).toBe('PLAYING')
    expect(started).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(50)
    expect(setPlayheadSpy).toHaveBeenLastCalledWith(5)
  })

  it('stop() from PLAYING/PAUSED returns to IDLE and emits playback:stopped', () => {
    const stopped = vi.fn()
    bus.on('playback:stopped', stopped)
    togglePlay(notify)
    stopPlayback()
    expect(playbackState()).toBe('IDLE')
    expect(stopped).toHaveBeenCalledTimes(1)
    stopPlayback() // idempotent — no second event
    expect(stopped).toHaveBeenCalledTimes(1)
  })

  it('pausePlayback() is a no-op when not PLAYING (forbidden transition, no event)', () => {
    const paused = vi.fn()
    bus.on('playback:paused', paused)
    pausePlayback() // IDLE -> no-op
    expect(playbackState()).toBe('IDLE')
    expect(paused).not.toHaveBeenCalled()
  })

  it('loop ON wraps playhead to 1 at the end; loop OFF stops (idle at last frame, no rewind)', () => {
    // loop default ON. Advance slightly past one frame interval (42ms) so the
    // 1000/24 ≈ 41.7ms interval definitely fires once under fake timers.
    statusJsonSpy.mockReturnValue({ playhead: 10, duration: 10, fps: 24 })
    togglePlay(notify)
    vi.advanceTimersByTime(50)
    expect(setPlayheadSpy).toHaveBeenLastCalledWith(1)
    stopPlayback()

    // loop OFF: stops at the end (IDLE, playhead parked at last — NOT rewound)
    setPlayheadSpy.mockClear()
    setLoopEnabled(false)
    statusJsonSpy.mockReturnValue({ playhead: 10, duration: 10, fps: 24 })
    togglePlay(notify)
    vi.advanceTimersByTime(50)
    expect(playbackState()).toBe('IDLE')
    expect(setPlayheadSpy).not.toHaveBeenCalled() // stop does not rewind
  })
})

describe('SYS-09 — seekPlayhead emits playhead:moved (INT-0012)', () => {
  beforeEach(() => setPlayheadSpy.mockClear())
  it('calls the engine and emits playhead:moved{frame} for user seeks', () => {
    const moved = vi.fn()
    bus.on('playhead:moved', moved)
    seekPlayhead(7)
    expect(setPlayheadSpy).toHaveBeenCalledWith(7)
    expect(moved).toHaveBeenCalledWith({ frame: 7 })
  })
  it('clamps non-positive / non-integer frames to 1', () => {
    const moved = vi.fn()
    bus.on('playhead:moved', moved)
    seekPlayhead(0)
    seekPlayhead(-3)
    seekPlayhead(NaN)
    expect(setPlayheadSpy).toHaveBeenNthCalledWith(1, 1)
    expect(setPlayheadSpy).toHaveBeenNthCalledWith(2, 1)
    expect(setPlayheadSpy).toHaveBeenNthCalledWith(3, 1)
    expect(moved).toHaveBeenCalledTimes(3)
  })
})

describe('SYS-09 — Control menu commands (mute/test handoff, stop enablement)', () => {
  it('control.mute is FUNCTIONAL and reports the SYS-26 handoff (not faked)', () => {
    setPlayheadSpy.mockClear()
    const mute = getCommand('control.mute')!
    expect(mute.status).toBe('FUNCTIONAL')
    mute.run(ctx())
    expect(notify).toHaveBeenLastCalledWith(expect.stringContaining('SYS-26'))
    // Mute must never touch the document / undo.
    expect(setPlayheadSpy).not.toHaveBeenCalled()
  })

  it('control.test is FUNCTIONAL and reports the SYS-27 handoff (not faked)', () => {
    const test = getCommand('control.test')!
    expect(test.status).toBe('FUNCTIONAL')
    test.run(ctx())
    expect(notify).toHaveBeenLastCalledWith(expect.stringContaining('SYS-27'))
  })

  it('control.stop is disabled while IDLE and enabled while PLAYING', () => {
    stopPlayback()
    const stop = getCommand('control.stop')!
    const c = ctx()
    expect(stop.enabled?.(c)).toBe(false)
    expect(stop.whyDisabled?.(c)).toMatch(/stopped/)
    togglePlay(notify)
    expect(stop.enabled?.(c)).toBe(true)
    stopPlayback()
  })

  it('all transport seek commands route through seekPlayhead (emit playhead:moved)', () => {
    const moved = vi.fn()
    bus.on('playhead:moved', moved)
    const c = ctx({ getStatus: () => ({ playhead: 3, duration: 12 } as never) })
    getCommand('control.rewind')!.run(c)
    getCommand('control.firstFrame')!.run(c)
    getCommand('control.stepForward')!.run(c)
    getCommand('control.stepBackward')!.run(c)
    getCommand('control.lastFrame')!.run(c)
    expect(setPlayheadSpy).toHaveBeenCalledWith(1) // rewind/first
    expect(setPlayheadSpy).toHaveBeenCalledWith(4) // step forward 3->4
    expect(setPlayheadSpy).toHaveBeenCalledWith(2) // step back 3->2
    expect(setPlayheadSpy).toHaveBeenCalledWith(12) // last
    expect(moved).toHaveBeenCalledTimes(5)
  })
})

describe('SYS-09 — Ctrl+Enter context-scoping (D-6 / INT-0013)', () => {
  function Harness({ depth, onExit }: { depth: number; onExit: () => void }) {
    const c = ctx({ editDepth: () => depth, exitEditRoot: onExit })
    // Scope mirrors App's global scope (control.test is in it).
    useShortcutScope(new Set(['control.test', 'edit.exitRoot']), c)
    return <button data-testid="root-btn">x</button>
  }

  it('at document root Ctrl+Enter runs Test Movie (SYS-27 handoff)', () => {
    const onExit = vi.fn()
    render(<Harness depth={0} onExit={onExit} />)
    notify.mockClear()
    fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true })
    expect(notify).toHaveBeenCalledWith(expect.stringContaining('SYS-27'))
    expect(onExit).not.toHaveBeenCalled()
  })

  it('inside a symbol edit Ctrl+Enter runs exitRoot, not Test Movie', () => {
    const onExit = vi.fn()
    render(<Harness depth={2} onExit={onExit} />)
    notify.mockClear()
    fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true })
    expect(onExit).toHaveBeenCalledTimes(1)
    expect(notify).not.toHaveBeenCalledWith(expect.stringContaining('SYS-27'))
  })
})

describe('SYS-12 — Help dialog', () => {
  function HelpHarness() {
    const [section, setSection] = useState<'docs' | 'troubleshoot'>('docs')
    const [open, setOpen] = useState(true)
    const c = ctx({
      openHelp: (s) => {
        setSection(s)
        setOpen(true)
      },
    })
    return (
      <div>
        <button data-testid="docs" onClick={() => getCommand('help.docs')!.run(c)}>
          docs
        </button>
        <button data-testid="trbl" onClick={() => getCommand('help.troubleshoot')!.run(c)}>
          troubleshoot
        </button>
        <HelpDialog open={open} section={section} onClose={() => setOpen(false)} />
      </div>
    )
  }

  it('help.docs and help.troubleshoot are FUNCTIONAL and open their sections; Esc/Close dismiss', () => {
    render(<HelpHarness />)
    expect(screen.getByTestId('help-docs-dialog')).toBeInTheDocument()
    expect(screen.getByText('Documents & files')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('help-close'))
    expect(screen.queryByTestId('help-docs-dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('trbl'))
    expect(screen.getByTestId('help-troubleshoot-dialog')).toBeInTheDocument()
    expect(screen.getByText('Engine not attached')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByTestId('help-troubleshoot-dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('docs'))
    expect(screen.getByTestId('help-docs-dialog')).toBeInTheDocument()
  })

  it('outside-click (backdrop) closes the help dialog', () => {
    render(<HelpHarness />)
    const dlg = screen.getByTestId('help-docs-dialog')
    fireEvent.mouseDown(dlg) // backdrop
    fireEvent.mouseUp(dlg)
    expect(screen.queryByTestId('help-docs-dialog')).not.toBeInTheDocument()
  })
})
