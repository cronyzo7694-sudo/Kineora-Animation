import { beforeEach, describe, expect, it, vi } from 'vitest'

const clientMock = vi.hoisted(() => ({
  activeDocId: vi.fn(() => 1),
  library: vi.fn(() => [] as { name: string }[]),
  newSymbol: vi.fn(() => 11),
  importSymbolsFromProject: vi.fn(() => [21]),
  hasImportSymbolsFacade: vi.fn(() => true),
}))
vi.mock('./engine/client', () => clientMock)

import {
  __resetExternalLibraryForTests,
  copyExternalSymbols,
  getExternalLibrary,
  openExternalLibraryFromContent,
  parseExternalLibrary,
} from './externalLibrary'

const PROJECT = JSON.stringify({
  settings: { width: 100, height: 100, fps: 24, backgroundColor: '#fff' },
  scenes: [],
  nodes: {},
  library: [
    { id: 3, name: 'hero', symbol_type: 'Graphic', timeline: [{ keyframes: { '1': { Keyframe: { content: [], transforms: {} } } } }] },
  ],
  next_id: 4,
})

beforeEach(() => {
  __resetExternalLibraryForTests()
  vi.clearAllMocks()
  clientMock.activeDocId.mockReturnValue(1)
  clientMock.hasImportSymbolsFacade.mockReturnValue(true)
  clientMock.importSymbolsFromProject.mockReturnValue([21])
})

describe('SYS-18 external library', () => {
  it('parses symbol rows from project JSON', () => {
    const lib = parseExternalLibrary(PROJECT, 'cast.json', '/tmp/cast.json')
    expect(lib).not.toBeNull()
    expect(lib!.title).toBe('cast')
    expect(lib!.items).toEqual([expect.objectContaining({ id: 3, name: 'hero', type: 'graphic' })])
  })

  it('refuses junk', () => {
    expect(parseExternalLibrary('not-json', 'x')).toBeNull()
  })

  it('copy uses the engine import facade', () => {
    openExternalLibraryFromContent(PROJECT, 'cast')
    expect(copyExternalSymbols([3])).toEqual([21])
    expect(clientMock.importSymbolsFromProject).toHaveBeenCalled()
  })

  it('copy does nothing with no document', () => {
    clientMock.activeDocId.mockReturnValue(0)
    openExternalLibraryFromContent(PROJECT, 'cast')
    expect(copyExternalSymbols([3])).toEqual([])
  })

  it('without import facade, creates an empty named symbol', () => {
    clientMock.hasImportSymbolsFacade.mockReturnValue(false)
    openExternalLibraryFromContent(PROJECT, 'cast')
    expect(copyExternalSymbols([3])).toEqual([11])
    expect(clientMock.newSymbol).toHaveBeenCalledWith('hero', 'graphic')
  })

  it('session stores the opened library', () => {
    expect(getExternalLibrary()).toBeNull()
    openExternalLibraryFromContent(PROJECT, 'cast')
    expect(getExternalLibrary()?.title).toBe('cast')
  })
})
