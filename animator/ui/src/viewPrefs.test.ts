import { beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_GRID_SIZE,
  VIEW_PREFS_KEY,
  defaultViewPrefs,
  loadViewPrefs,
  patchViewPrefs,
  resetViewPrefsForTests,
  setPreviewMode,
  subscribeViewPrefs,
  toggleViewFlag,
} from './viewPrefs'

beforeEach(() => {
  resetViewPrefsForTests()
})

describe('SYS-04 view prefs (app prefs, never document)', () => {
  it('defaults: pasteboard on, overlays off, full preview, 20px grid (AMB-SYS04-001)', () => {
    const d = defaultViewPrefs()
    expect(d.workArea).toBe(true)
    expect(d.rulers).toBe(false)
    expect(d.grid).toBe(false)
    expect(d.hideEdges).toBe(false)
    expect(d.preview).toBe('full')
    expect(d.gridSize).toBe(DEFAULT_GRID_SIZE)
  })

  it('toggle flips a flag and persists', () => {
    expect(loadViewPrefs().grid).toBe(false)
    expect(toggleViewFlag('grid').grid).toBe(true)
    expect(JSON.parse(localStorage.getItem(VIEW_PREFS_KEY)!).grid).toBe(true)
    expect(toggleViewFlag('grid').grid).toBe(false)
  })

  it('setPreviewMode is exclusive', () => {
    setPreviewMode('outline')
    expect(loadViewPrefs().preview).toBe('outline')
    setPreviewMode('full')
    expect(loadViewPrefs().preview).toBe('full')
  })

  it('corrupt storage falls back to defaults', () => {
    resetViewPrefsForTests()
    localStorage.setItem(VIEW_PREFS_KEY, '{not json')
    expect(loadViewPrefs()).toEqual(defaultViewPrefs())
  })

  it('subscribers fire on change (and can unsubscribe)', () => {
    let n = 0
    const off = subscribeViewPrefs(() => {
      n += 1
    })
    toggleViewFlag('rulers')
    expect(n).toBe(1)
    off()
    toggleViewFlag('rulers')
    expect(n).toBe(1)
  })

  it('unknown keys in storage are ignored (no invented fields)', () => {
    localStorage.setItem(VIEW_PREFS_KEY, JSON.stringify({ rulers: true, extra: 1, gridSize: -4 }))
    resetViewPrefsForTests()
    localStorage.setItem(VIEW_PREFS_KEY, JSON.stringify({ rulers: true, extra: 1, gridSize: -4 }))
    const v = loadViewPrefs()
    expect(v.rulers).toBe(true)
    expect(v.gridSize).toBe(DEFAULT_GRID_SIZE)
    expect((v as unknown as { extra?: number }).extra).toBeUndefined()
  })

  it('patchViewPrefs is a view-only write (prefs key, not workspace/document)', () => {
    patchViewPrefs({ hideEdges: true })
    expect(localStorage.getItem('kineora.workspace')).toBeNull()
    expect(localStorage.getItem(VIEW_PREFS_KEY)).toContain('hideEdges')
  })
})
