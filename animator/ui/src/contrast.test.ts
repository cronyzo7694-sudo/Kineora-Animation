import { describe, expect, it } from 'vitest'
import { contrastOn, tooClose } from './contrast'

describe('contrastOn — never white-on-white', () => {
  it('turns white fill on white background into ink black', () => {
    expect(contrastOn('#ffffff', '#ffffff')).toBe('#111111')
    expect(contrastOn('#fff', '#ffffff')).toBe('#111111')
  })

  it('keeps a dark fill on a light background', () => {
    expect(contrastOn('#111111', '#ffffff')).toBe('#111111')
  })

  it('tooClose detects similar luminances', () => {
    expect(tooClose('#ffffff', '#fefefe')).toBe(true)
    expect(tooClose('#000000', '#ffffff')).toBe(false)
  })
})
