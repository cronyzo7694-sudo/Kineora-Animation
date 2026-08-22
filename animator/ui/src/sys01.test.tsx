import { beforeEach, describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import App from './App'
import { bus } from './bus'

beforeEach(() => {
  try {
    localStorage.removeItem('kineora.workspace')
    localStorage.removeItem('kineora.workspace.panelLayout')
  } catch {
    /* ignore */
  }
})

describe('SYS-01 panel chrome — close × + collapse (T-panel-hide / T-panel-collapse)', () => {
  it('the close button on a panel hides it and Window menu can reopen', () => {
    render(<App />)
    expect(screen.getByTestId('library-panel')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('T-panel-hide-library'))
    expect(screen.queryByTestId('library-panel')).not.toBeInTheDocument()
    // reopen via the Window menu (same panel.show command)
    fireEvent.click(screen.getByTestId('menu.window'))
    fireEvent.click(screen.getByTestId('menu-item-panel.show-library'))
    expect(screen.getByTestId('library-panel')).toBeInTheDocument()
  })

  it('collapse toggles a panel to header-only and back', () => {
    render(<App />)
    expect(screen.getByTestId('library-list')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('T-panel-collapse-library'))
    expect(screen.queryByTestId('library-list')).not.toBeInTheDocument() // body hidden
    expect(screen.getByTestId('panel-title-library')).toBeInTheDocument() // header kept
    fireEvent.click(screen.getByTestId('T-panel-collapse-library'))
    expect(screen.getByTestId('library-list')).toBeInTheDocument()
  })

  it('layers panel close + collapse work independently', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('T-panel-collapse-layers'))
    expect(screen.queryByTestId('layer-row-0')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('T-panel-hide-layers'))
    expect(screen.queryByTestId('layers-panel')).not.toBeInTheDocument()
  })
})

describe('SYS-01 workspace save/switch/reset (T-ws-*)', () => {
  it('New Workspace saves/lists; switching restores the layout you left', () => {
    window.prompt = () => 'Rig 1'
    render(<App />)
    const handle = screen.getByTestId('resize-layers')
    const resize = (dx: number) => {
      fireEvent.mouseDown(handle, { button: 0, clientX: 500 })
      fireEvent.mouseMove(window, { clientX: 500 + dx })
      fireEvent.mouseUp(window)
    }
    resize(100) // 200 → 300
    expect(screen.getByTestId('layers-panel')).toHaveStyle('width: 300px')

    fireEvent.click(screen.getByTestId('menu.window'))
    fireEvent.mouseEnter(screen.getByTestId('sub-menu.window-Workspaces'))
    fireEvent.click(screen.getByTestId('menu-item-workspace.saveNew'))
    resize(100) // 300 → 400 (Rig 1 keeps tracking)

    // switch to Essentials → the 300 it was left at
    fireEvent.click(screen.getByTestId('menu.window'))
    fireEvent.mouseEnter(screen.getByTestId('sub-menu.window-Workspaces'))
    fireEvent.click(screen.getByTestId('menu-item-ws-Essentials'))
    expect(screen.getByTestId('layers-panel')).toHaveStyle('width: 300px')

    // switch back to Rig 1 → 400
    fireEvent.click(screen.getByTestId('menu.window'))
    fireEvent.mouseEnter(screen.getByTestId('sub-menu.window-Workspaces'))
    fireEvent.click(screen.getByTestId('menu-item-ws-Rig 1'))
    expect(screen.getByTestId('layers-panel')).toHaveStyle('width: 400px')
  })

  it('Reset Workspace clears workspace prefs back to the Essentials default', () => {
    window.prompt = () => 'Rig X'
    render(<App />)
    fireEvent.click(screen.getByTestId('menu.window'))
    fireEvent.mouseEnter(screen.getByTestId('sub-menu.window-Workspaces'))
    fireEvent.click(screen.getByTestId('menu-item-workspace.saveNew'))

    fireEvent.click(screen.getByTestId('reset-workspace'))
    expect(screen.getByTestId('layers-panel')).toHaveStyle('width: 200px')
    // named workspace cleared (§6.2 "PREFS (clear)")
    fireEvent.click(screen.getByTestId('menu.window'))
    fireEvent.mouseEnter(screen.getByTestId('sub-menu.window-Workspaces'))
    expect(screen.queryByTestId('menu-item-ws-Rig X')).not.toBeInTheDocument()
  })

  it('Save Current Workspace persists without a prompt (uses the active name)', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('menu.window'))
    fireEvent.mouseEnter(screen.getByTestId('sub-menu.window-Workspaces'))
    fireEvent.click(screen.getByTestId('menu-item-workspace.saveCurrent'))
    expect(screen.getByTestId('statusbar')).toBeInTheDocument()
    // Essentials saved; switcher lists it
    fireEvent.click(screen.getByTestId('ws-switch'))
    expect(screen.getByTestId('ws-switch-Essentials')).toBeInTheDocument()
  })

  it('header switcher switches workspaces and exposes save/reset', () => {
    window.prompt = () => 'B'
    render(<App />)
    fireEvent.click(screen.getByTestId('ws-switch'))
    fireEvent.click(screen.getByTestId('ws-save-new'))
    fireEvent.click(screen.getByTestId('ws-switch'))
    expect(screen.getByTestId('ws-switch-B')).toBeInTheDocument()
  })
})

describe('SYS-01 status bar 12 cells + go-to-frame (T-st-*)', () => {
  it('renders the status cells', () => {
    render(<App />)
    for (const id of ['st-activeTool', 'st-selection', 'st-activeLayer', 'st-activeFrame', 'st-activeScene', 'st-activeSymbol', 'st-recording', 'st-playback', 'st-saving', 'st-export', 'st-mode', 'st-snap']) {
      expect(screen.getByTestId(id)).toBeInTheDocument()
    }
  })

  it('frame cell click opens the go-to-frame dialog; Enter jumps; Esc closes', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('st-activeFrame'))
    expect(screen.getByTestId('goto-dialog')).toBeInTheDocument()
    fireEvent.change(screen.getByTestId('goto-input'), { target: { value: '7' } })
    fireEvent.keyDown(screen.getByTestId('goto-input'), { key: 'Enter' })
    expect(screen.queryByTestId('goto-dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('st-activeFrame'))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByTestId('goto-dialog')).not.toBeInTheDocument()
  })

  it('invalid frame number reports instead of silently closing', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('st-activeFrame'))
    fireEvent.change(screen.getByTestId('goto-input'), { target: { value: '0' } })
    fireEvent.keyDown(screen.getByTestId('goto-input'), { key: 'Enter' })
    expect(screen.getByTestId('goto-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('toast')).toHaveTextContent('enter a frame')
  })
})

describe('SYS-01 edit bar / breadcrumb + nav (T-nav-*)', () => {
  it('shows the scene breadcrumb at the document root', () => {
    render(<App />)
    expect(screen.getByTestId('edit-bar')).toBeInTheDocument()
    expect(screen.getByTestId('breadcrumb')).toHaveTextContent('Scene 1')
  })

  it('Back/Root are hidden at depth 0 (no dead stub — §6.6 contract)', () => {
    render(<App />)
    expect(screen.queryByTestId('nav-back')).not.toBeInTheDocument()
    expect(screen.queryByTestId('nav-root')).not.toBeInTheDocument()
  })

  it('st.snap is an honest projection of snap:changed (never a fake static "snap off")', () => {
    render(<App />)
    expect(screen.getByTestId('st-snap')).toHaveTextContent('snap —')
    expect(screen.getByTestId('st-snap')).not.toHaveTextContent('snap off')
    // SYS-04 SnapEngine is absent — we only project the locked event payload.
    act(() => {
      bus.emit('snap:changed', { mode: 'grid' })
    })
    expect(screen.getByTestId('st-snap')).toHaveTextContent('snap grid')
    act(() => {
      bus.emit('snap:changed', { mode: '' })
    })
    expect(screen.getByTestId('st-snap')).toHaveTextContent('snap —')
  })

  it('F4 toggles the Properties panel (C-09 / SYS-01 §9 — not Adobe Ctrl+F3)', () => {
    render(<App />)
    expect(screen.getByTestId('properties-panel')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'F4' })
    expect(screen.queryByTestId('properties-panel')).not.toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'F4' })
    expect(screen.getByTestId('properties-panel')).toBeInTheDocument()
  })

  it('Ctrl+L toggles the Library panel (SYS-01 §7 Window / §9)', () => {
    render(<App />)
    expect(screen.getByTestId('library-panel')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'l', ctrlKey: true })
    expect(screen.queryByTestId('library-panel')).not.toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'l', ctrlKey: true })
    expect(screen.getByTestId('library-panel')).toBeInTheDocument()
  })

  it('edit.exitOneLevel / exitRoot are registered commands (palette-visible, disabled at root)', () => {
    render(<App />)
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    fireEvent.change(screen.getByTestId('palette-input'), { target: { value: 'back one level' } })
    const item = screen.getByTestId('palette-item-edit.exitOneLevel')
    expect(item).toBeInTheDocument()
    expect(item).toBeDisabled() // at root → honest disabled, never a silent no-op
  })
})
