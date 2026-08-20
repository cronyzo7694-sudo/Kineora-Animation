import { describe, expect, it } from 'vitest'
import { clampPanePref, distribute, type PaneSpec } from './panelLayout'

// Right dock: Properties (flex) → Library → Debug. Splitter between panes
// resizes the pane BELOW; Properties is the derived remainder.
const SPECS: PaneSpec[] = [
  { min: 320, max: 2400, pref: 0, flex: true }, // Properties
  { min: 96, max: 480, pref: 160 }, // Library
  { min: 120, max: 480, pref: 200 }, // Debug
]

describe('panelLayout.distribute (C-36 no-overflow / no-zero / no-offscreen)', () => {
  it('the flex pane fills the available space (top pane absorbs slack)', () => {
    // 2 splitters × 6px = 12; inner = 1000-12 = 988
    const sizes = distribute(1000, SPECS, 2)
    expect(sizes[1]).toBe(160)
    expect(sizes[2]).toBe(200)
    expect(sizes[0]).toBe(988 - 360) // props = remainder = 628
  })

  it('the flex pane is clamped to its minimum (Properties >= 320)', () => {
    // inner = 500-12 = 488; fixed = 360 → props = 128 → clamped to 320
    const sizes = distribute(500, SPECS, 2)
    expect(sizes[0]).toBe(320)
    expect(sizes[1]).toBe(160)
    expect(sizes[2]).toBe(200)
  })

  it('never produces zero or negative sizes', () => {
    for (const avail of [100, 300, 500, 700, 900, 1200]) {
      for (const s of distribute(avail, SPECS, 2)) {
        expect(s).toBeGreaterThan(0)
      }
    }
  })
})

describe('panelLayout.clampPanePref (sum-aware splitter clamp)', () => {
  it('caps a pane so the others keep their minimums', () => {
    // inner = 700-12 = 688; others min (props 320 + debug 120) = 440 → cap 248
    expect(clampPanePref(700, SPECS, 1, 999, 2)).toBe(248)
  })

  it('respects the pane min as a floor', () => {
    expect(clampPanePref(700, SPECS, 1, -999, 2)).toBe(96)
  })

  it('respects the pane max as an upper bound', () => {
    // inner = 2000-12 = 1988; others min 440 → cap 1548; pane max 480 wins
    expect(clampPanePref(2000, SPECS, 1, 9999, 2)).toBe(480)
  })
})
