import { beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_VISIBILITY,
  DEFAULT_WORKSPACE_NAME,
  WORKSPACE_PREFS_KEY,
  defaultSnapshot,
  listWorkspaceNames,
  loadWorkspacePrefs,
  loadWorkspaceSnapshot,
  resetWorkspacePrefs,
  saveWorkspaceSnapshot,
  workspaceExists,
} from './workspace'
import { DEFAULT_LAYOUT } from './panelLayout'

beforeEach(() => {
  try {
    localStorage.removeItem(WORKSPACE_PREFS_KEY)
    localStorage.removeItem('kineora.workspace.panelLayout')
  } catch {
    /* ignore */
  }
})

describe('workspace prefs (SYS-01 §7/§18)', () => {
  it('no stored prefs → defaults with the Essentials workspace', () => {
    const { prefs, corrupt } = loadWorkspacePrefs()
    expect(corrupt).toBe(false)
    expect(prefs.active).toBe(DEFAULT_WORKSPACE_NAME)
    expect(prefs.workspaces[DEFAULT_WORKSPACE_NAME].layout).toEqual(DEFAULT_LAYOUT)
  })

  it('save → list → load round-trips visibility + collapse + layout', () => {
    const snap = defaultSnapshot()
    snap.visibility.library = false
    snap.collapsed.properties = true
    snap.layout.layersW = 300
    saveWorkspaceSnapshot('My Rig', snap)

    expect(workspaceExists('My Rig')).toBe(true)
    expect(listWorkspaceNames()).toContain('My Rig')
    const loaded = loadWorkspaceSnapshot('My Rig')
    expect(loaded?.visibility.library).toBe(false)
    expect(loaded?.collapsed.properties).toBe(true)
    expect(loaded?.layout.layersW).toBe(300)
  })

  it('duplicate name overwrites (recreate covers M-1)', () => {
    saveWorkspaceSnapshot('X', { ...defaultSnapshot(), layout: { ...DEFAULT_LAYOUT, layersW: 222 } })
    saveWorkspaceSnapshot('X', { ...defaultSnapshot(), layout: { ...DEFAULT_LAYOUT, layersW: 333 } })
    expect(loadWorkspaceSnapshot('X')?.layout.layersW).toBe(333)
  })

  it('corrupt JSON → defaults + corrupt flag (auto-reset contract)', () => {
    localStorage.setItem(WORKSPACE_PREFS_KEY, '{not json')
    const { prefs, corrupt } = loadWorkspacePrefs()
    expect(corrupt).toBe(true)
    expect(prefs.active).toBe(DEFAULT_WORKSPACE_NAME)
    expect(prefs.workspaces[DEFAULT_WORKSPACE_NAME].visibility).toEqual(DEFAULT_VISIBILITY)
  })

  it('unknown panel ids in stored visibility are ignored, not fatal', () => {
    localStorage.setItem(
      WORKSPACE_PREFS_KEY,
      JSON.stringify({ active: 'Essentials', workspaces: { Essentials: { layout: {}, visibility: { library: false, bogus: 'x' }, collapsed: {} } } }),
    )
    const { prefs, corrupt } = loadWorkspacePrefs()
    expect(corrupt).toBe(false)
    expect(prefs.workspaces.Essentials.visibility.library).toBe(false)
    expect(prefs.workspaces.Essentials.visibility.layers).toBe(false) // U-G7 default preserved
  })

  it('missing active workspace → default snapshot substituted', () => {
    localStorage.setItem(WORKSPACE_PREFS_KEY, JSON.stringify({ active: 'Gone', workspaces: {} }))
    const { prefs } = loadWorkspacePrefs()
    expect(prefs.workspaces[prefs.active]).toBeDefined()
  })

  it('out-of-range layout sizes are clamped to panel bounds', () => {
    localStorage.setItem(
      WORKSPACE_PREFS_KEY,
      JSON.stringify({ active: 'Essentials', workspaces: { Essentials: { layout: { layersW: 999999 }, visibility: {}, collapsed: {} } } }),
    )
    const { prefs } = loadWorkspacePrefs()
    expect(prefs.workspaces.Essentials.layout.layersW).toBe(480) // LAYERS_W max
  })

  it('reset removes the prefs key', () => {
    saveWorkspaceSnapshot('A', defaultSnapshot())
    resetWorkspacePrefs()
    expect(localStorage.getItem(WORKSPACE_PREFS_KEY)).toBeNull()
    expect(loadWorkspacePrefs().prefs.active).toBe(DEFAULT_WORKSPACE_NAME)
  })

  it('blank name falls back to Essentials', () => {
    saveWorkspaceSnapshot('   ', defaultSnapshot())
    expect(workspaceExists(DEFAULT_WORKSPACE_NAME)).toBe(true)
  })
})
