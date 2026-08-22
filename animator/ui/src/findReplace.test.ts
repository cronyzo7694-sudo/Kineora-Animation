import { describe, expect, it } from 'vitest'
import {
  editableColorHits,
  findColors,
  findSymbols,
  normalizeHex,
  unsupportedTargetReason,
  type FindReplaceDoc,
} from './findReplace'

const doc: FindReplaceDoc = {
  nodes: {
    '1': { Rect: { fill: '#FF0000', stroke: '#00ff00' } },
    '2': { Rect: { fill: '#ff0000', stroke: null } },
    '3': { SymbolInstance: { symbol_id: 10 } },
    '4': { Rect: { fill: '#0000ff' } },
  },
  scenes: [
    {
      layers: [
        { visible: true, locked: false, keyframes: { '1': { Keyframe: { content: [1, 3] } } } },
        { visible: false, locked: false, keyframes: { '1': { Keyframe: { content: [2] } } } },
        { visible: true, locked: true, keyframes: { '1': { Keyframe: { content: [4] } } } },
      ],
    },
  ],
}

describe('findReplace H03', () => {
  it('normalizes 3-digit hex', () => {
    expect(normalizeHex('#F00')).toBe('#ff0000')
  })

  it('finds fills and strokes case-insensitively (T-find)', () => {
    const hits = findColors(doc, '#f00', { scope: 'document', sceneIndex: 0, selection: [], fills: true, strokes: true })
    expect(hits.map((h) => h.nodeId).sort()).toEqual([1, 2])
  })

  it('skips locked/hidden on replace (T-replace-locked)', () => {
    const hits = findColors(doc, '#f00', { scope: 'document', sceneIndex: 0, selection: [], fills: true, strokes: false })
    expect(editableColorHits(hits).map((h) => h.nodeId)).toEqual([1])
  })

  it('selection scope only searches selection', () => {
    const hits = findColors(doc, '#f00', { scope: 'selection', sceneIndex: 0, selection: [2], fills: true, strokes: false })
    expect(hits.map((h) => h.nodeId)).toEqual([2])
  })

  it('finds symbol instances and marks locked/hidden', () => {
    const hits = findSymbols(doc, 10)
    expect(hits).toHaveLength(1)
    expect(hits[0].locked).toBe(false)
  })

  it('text/font/sound are unsupported (0 matches, not invented)', () => {
    expect(unsupportedTargetReason('text')).toMatch(/0 matches/)
    expect(unsupportedTargetReason('sound')).toMatch(/0 matches/)
    expect(unsupportedTargetReason('color')).toBeNull()
  })

  it('no matches → empty (T-find-none)', () => {
    expect(findColors(doc, '#abcdef', { scope: 'document', sceneIndex: 0, selection: [], fills: true, strokes: true })).toEqual([])
  })
})
