import { beforeEach, describe, expect, it } from 'vitest'
import {
  AUTOSAVE_PREFS_KEY,
  defaultAutosavePrefs,
  formatAutosaveInterval,
  loadAutosavePrefs,
  patchAutosavePrefs,
  resetAutosavePrefsForTests,
  toggleAutosaveEnabled,
} from './autosavePrefs'

beforeEach(() => {
  resetAutosavePrefsForTests()
})

describe('autosave prefs', () => {
  it('defaults: enabled, 30s interval', () => {
    expect(loadAutosavePrefs()).toEqual(defaultAutosavePrefs())
    expect(defaultAutosavePrefs()).toEqual({ enabled: true, intervalSec: 30 })
  })

  it('toggle flips enabled and persists', () => {
    expect(toggleAutosaveEnabled().enabled).toBe(false)
    expect(JSON.parse(localStorage.getItem(AUTOSAVE_PREFS_KEY)!).enabled).toBe(false)
    expect(toggleAutosaveEnabled().enabled).toBe(true)
  })

  it('clamps interval and ignores junk', () => {
    expect(patchAutosavePrefs({ intervalSec: 2 }).intervalSec).toBe(10)
    resetAutosavePrefsForTests()
    localStorage.setItem(AUTOSAVE_PREFS_KEY, '{nope')
    expect(loadAutosavePrefs()).toEqual(defaultAutosavePrefs())
  })

  it('formatAutosaveInterval is human', () => {
    expect(formatAutosaveInterval(30)).toBe('30 sec')
    expect(formatAutosaveInterval(60)).toBe('1 min')
    expect(formatAutosaveInterval(300)).toBe('5 min')
  })
})
