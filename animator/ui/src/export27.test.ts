// SYS-27 MOD-EXPORT slice-1 tests — sequence builder, HTML5 publish builder,
// delivery + export:done contract (§D). Engine bridge + download sink mocked
// at the same seams as every other suite; bus is real.
import { beforeEach, describe, expect, it, vi } from 'vitest'

const clientMock = vi.hoisted(() => ({
  getEngine: vi.fn(() => ({})),
  getEngineStatus: vi.fn(() => ({ kind: 'ok' as const, detail: 'attached' })),
  exportSvgScaled: vi.fn((frame: number, scale: number) => `<svg data-frame="${frame}" data-scale="${scale}"/>`),
  statusJson: vi.fn(() => ({
    doc_id: 1,
    doc_title: 'My Movie',
    dirty: false,
    doc_count: 1,
    playhead: 2,
    duration: 5,
    fps: 24,
  })),
}))
vi.mock('./engine/client', () => clientMock)

const actionsMock = vi.hoisted(() => ({ downloadBlob: vi.fn() }))
vi.mock('./engine/actions', () => actionsMock)

import { bus } from './bus'
import {
  buildHtml5Publish,
  buildSvgSequence,
  deliverExport,
  publishHtml5,
  sequenceFrameName,
} from './export27'

beforeEach(() => {
  vi.clearAllMocks()
  // clearAllMocks keeps implementations — re-pin them so a per-test
  // mockImplementation/mockReturnValue can never leak into the next test.
  clientMock.getEngine.mockImplementation(() => ({}))
  clientMock.getEngineStatus.mockImplementation(() => ({ kind: 'ok' as const, detail: 'attached' }))
  clientMock.exportSvgScaled.mockImplementation(
    (frame: number, scale: number) => `<svg data-frame="${frame}" data-scale="${scale}"/>`,
  )
  clientMock.statusJson.mockImplementation(() => ({
    doc_id: 1,
    doc_title: 'My Movie',
    dirty: false,
    doc_count: 1,
    playhead: 2,
    duration: 5,
    fps: 24,
  }))
})

describe('SYS-27 sequence export (eng 14: range #First/#Last + sidecar fps)', () => {
  it('builds one padded SVG per frame + the fps sidecar', () => {
    const r = buildSvgSequence({ first: 2, last: 4, scale: 2, baseName: 'shot' })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.files.map((f) => f.name)).toEqual([
      'shot_0002.svg',
      'shot_0003.svg',
      'shot_0004.svg',
      'shot_sequence.json',
    ])
    expect(r.files[0].content).toBe('<svg data-frame="2" data-scale="2"/>')
    const sidecar = JSON.parse(r.files[3].content)
    expect(sidecar).toEqual({ format: 'svg-sequence', first: 2, last: 4, count: 3, fps: 24, scale: 2 })
  })

  it('validates the range: first<1, last<first, last>duration all REFUSE (no files)', () => {
    for (const [first, last] of [
      [0, 3],
      [3, 2],
      [1, 6], // duration = 5
      [Number.NaN, 3],
    ] as Array<[number, number]>) {
      const r = buildSvgSequence({ first, last, scale: 1, baseName: 'x' })
      expect(r.ok).toBe(false)
    }
    expect(clientMock.exportSvgScaled).not.toHaveBeenCalled()
  })

  it('invalid scale falls back to 1 (Part 28.1 fallback, matches the Rust exporter)', () => {
    const r = buildSvgSequence({ first: 1, last: 1, scale: NaN, baseName: 'x' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.files[0].content).toContain('data-scale="1"')
  })

  it('engine detached / no doc → honest refusal', () => {
    clientMock.getEngineStatus.mockReturnValueOnce({ kind: 'error', detail: 'x' } as never)
    expect(buildSvgSequence({ first: 1, last: 1, scale: 1, baseName: 'x' }).ok).toBe(false)
    clientMock.statusJson.mockReturnValueOnce(null as never)
    expect(buildSvgSequence({ first: 1, last: 1, scale: 1, baseName: 'x' }).ok).toBe(false)
  })

  it('an engine SVG failure mid-range aborts with NO partial file list', () => {
    clientMock.exportSvgScaled.mockImplementation((f: number) => (f === 3 ? '' : `<svg ${f}/>`))
    const r = buildSvgSequence({ first: 1, last: 5, scale: 1, baseName: 'x' })
    expect(r.ok).toBe(false)
  })

  it('padding helper is stable for sorting', () => {
    expect(sequenceFrameName('a', 7)).toBe('a_0007.svg')
    expect(sequenceFrameName('a', 1234)).toBe('a_1234.svg')
  })
})

describe('SYS-27 HTML5 publish (eng 14: player + fps + loop; P-8 default platform)', () => {
  it('embeds EVERY timeline frame + fps + loop into one self-contained file', () => {
    const r = buildHtml5Publish({ baseName: 'My Movie', loop: true, scale: 1 })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.files).toHaveLength(1)
    expect(r.files[0].name).toBe('My Movie.html')
    expect(r.files[0].mime).toBe('text/html')
    for (let f = 1; f <= 5; f++) expect(r.files[0].content).toContain(`data-frame=\\"${f}\\"`)
    expect(r.files[0].content).toContain('var fps = 24')
    expect(r.files[0].content).toContain('var loop = true')
  })

  it('no-loop publish holds the final frame (loop=false serialized)', () => {
    const r = buildHtml5Publish({ baseName: 'x', loop: false, scale: 1 })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.files[0].content).toContain('var loop = false')
  })

  it('escapes the document title in the HTML head', () => {
    clientMock.statusJson.mockReturnValue({
      ...clientMock.statusJson(),
      doc_title: '<b>evil</b>',
    } as never)
    const r = buildHtml5Publish({ baseName: '<b>evil</b>', loop: true, scale: 1 })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.files[0].content).toContain('<title>&lt;b&gt;evil&lt;/b&gt; — Kineora Animation</title>')
  })
})

describe('SYS-27 delivery + export:done contract (CROSS_SYSTEM_CONTRACT §D)', () => {
  it('success: downloads every file, emits export:done ONCE with {format, path}', () => {
    const events: unknown[] = []
    const off = bus.on('export:done', (p) => events.push(p))
    const notify = vi.fn()
    const ok = deliverExport('sequence', buildSvgSequence({ first: 1, last: 2, scale: 1, baseName: 's' }), notify)
    expect(ok).toBe(true)
    expect(actionsMock.downloadBlob).toHaveBeenCalledTimes(3) // 2 frames + sidecar
    expect(events).toEqual([{ format: 'sequence', path: 's_0001.svg' }])
    off()
  })

  it('failure: notifies the reason, downloads NOTHING, emits NOTHING (INV-ERR-1/2)', () => {
    const events: unknown[] = []
    const off = bus.on('export:done', (p) => events.push(p))
    const notify = vi.fn()
    const ok = deliverExport('sequence', buildSvgSequence({ first: 9, last: 1, scale: 1, baseName: 's' }), notify)
    expect(ok).toBe(false)
    expect(actionsMock.downloadBlob).not.toHaveBeenCalled()
    expect(events).toEqual([])
    expect(notify).toHaveBeenCalledWith(expect.stringContaining('invalid frame range'))
    off()
  })

  it('publishHtml5 command entry: full pipeline + export:done{html5}', () => {
    clientMock.statusJson.mockReturnValue({
      doc_id: 1,
      doc_title: 'My Movie',
      dirty: false,
      doc_count: 1,
      playhead: 1,
      duration: 3,
      fps: 12,
    } as never)
    const events: { format: string; path?: string }[] = []
    const off = bus.on('export:done', (p) => events.push(p))
    const notify = vi.fn()
    expect(publishHtml5(notify)).toBe(true)
    expect(events).toEqual([{ format: 'html5', path: 'My Movie.html' }])
    off()
  })

  it('rapid repeated exports are independent (stateless engines — two full deliveries)', () => {
    const notify = vi.fn()
    deliverExport('sequence', buildSvgSequence({ first: 1, last: 1, scale: 1, baseName: 'a' }), notify)
    deliverExport('sequence', buildSvgSequence({ first: 1, last: 1, scale: 1, baseName: 'b' }), notify)
    expect(actionsMock.downloadBlob).toHaveBeenCalledTimes(4) // 2 × (frame + sidecar)
  })

  it('export is NON-MUTATING: no document:changed, no saving:changed', () => {
    const forbidden: string[] = []
    const off1 = bus.on('document:changed', () => forbidden.push('document:changed'))
    const off2 = bus.on('saving:changed', () => forbidden.push('saving:changed'))
    deliverExport('sequence', buildSvgSequence({ first: 1, last: 2, scale: 1, baseName: 's' }), vi.fn())
    publishHtml5(vi.fn())
    expect(forbidden).toEqual([])
    off1()
    off2()
  })
})
