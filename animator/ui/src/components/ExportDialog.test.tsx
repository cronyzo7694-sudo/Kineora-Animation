import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../engine/client', () => ({
  getEngineStatus: () => ({ kind: 'ok' as const, detail: 'mock' }),
  getEngine: () => ({}),
  statusJson: () => ({
    doc_id: 1,
    doc_title: 'My Movie',
    playhead: 7,
    doc_width: 1920,
    doc_height: 1080,
    background: '#ffffff',
    duration: 10,
    fps: 24,
  }),
  evaluate: () => [{ id: 1, x: 0, y: 0, w: 100, h: 100, rotation: 0, fill: '#ff0000', stroke: null, stroke_width: 0 }],
  exportSvgScaled: vi.fn((_f: number, _s: number) => '<svg>mock</svg>'),
}))

vi.mock('../engine/actions', () => ({
  downloadBlob: vi.fn(),
  downloadCanvasBlob: vi.fn(),
}))

import { exportSvgScaled } from '../engine/client'
import { downloadBlob, downloadCanvasBlob } from '../engine/actions'
import { ExportDialog } from './ExportDialog'
import type { EngineStatus } from '../controlRegistry'

const exportSvgScaledMock = vi.mocked(exportSvgScaled)
const downloadBlobMock = vi.mocked(downloadBlob)
const downloadCanvasBlobMock = vi.mocked(downloadCanvasBlob)
const notify = vi.fn()
const onClose = vi.fn()

function renderDialog(engine: EngineStatus = { kind: 'ok', detail: 'mock' }) {
  return render(<ExportDialog open engine={engine} onClose={onClose} notify={notify} />)
}

beforeEach(() => {
  vi.clearAllMocks()
  notify.mockClear()
  onClose.mockClear()
})

describe('ExportDialog (C-31 exp.image)', () => {
  it('shows format + scale pickers and the current frame', () => {
    renderDialog()
    expect(screen.getByTestId('export-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('export-format')).toHaveValue('svg')
    expect(screen.getByTestId('export-scale')).toHaveValue('1')
    expect(screen.getByText(/frame 7/)).toBeInTheDocument()
  })

  it('default SVG export downloads the SVG via the engine (current frame + scale)', () => {
    renderDialog()
    fireEvent.click(screen.getByTestId('export-confirm'))
    expect(exportSvgScaledMock).toHaveBeenCalledWith(7, 1)
    expect(downloadBlobMock).toHaveBeenCalledWith('kineora.svg', '<svg>mock</svg>', 'image/svg+xml')
    expect(onClose).toHaveBeenCalled()
  })

  it('SVG at 2× passes the scale through to the engine', () => {
    renderDialog()
    fireEvent.change(screen.getByTestId('export-scale'), { target: { value: '2' } })
    fireEvent.click(screen.getByTestId('export-confirm'))
    expect(exportSvgScaledMock).toHaveBeenCalledWith(7, 2)
  })

  it('PNG export rasterizes the content at exact stage pixels and downloads', () => {
    renderDialog()
    fireEvent.change(screen.getByTestId('export-format'), { target: { value: 'png' } })
    fireEvent.click(screen.getByTestId('export-confirm'))
    expect(downloadCanvasBlobMock).toHaveBeenCalledTimes(1)
    const [canvas, name, mime] = downloadCanvasBlobMock.mock.calls[0]
    expect(name).toBe('kineora.png')
    expect(mime).toBe('image/png')
    expect((canvas as HTMLCanvasElement).width).toBe(1920)
    expect((canvas as HTMLCanvasElement).height).toBe(1080)
    expect(downloadBlobMock).not.toHaveBeenCalled()
  })

  it('PNG at 2× rasterizes at doubled dimensions (supersampling)', () => {
    renderDialog()
    fireEvent.change(screen.getByTestId('export-format'), { target: { value: 'png' } })
    fireEvent.change(screen.getByTestId('export-scale'), { target: { value: '2' } })
    fireEvent.click(screen.getByTestId('export-confirm'))
    const [canvas] = downloadCanvasBlobMock.mock.calls[0]
    expect((canvas as HTMLCanvasElement).width).toBe(3840)
    expect((canvas as HTMLCanvasElement).height).toBe(2160)
  })

  it('JPEG export uses image/jpeg mime', () => {
    renderDialog()
    fireEvent.change(screen.getByTestId('export-format'), { target: { value: 'jpeg' } })
    fireEvent.click(screen.getByTestId('export-confirm'))
    expect(downloadCanvasBlobMock.mock.calls[0][2]).toBe('image/jpeg')
  })

  it('WebP export uses image/webp mime', () => {
    renderDialog()
    fireEvent.change(screen.getByTestId('export-format'), { target: { value: 'webp' } })
    fireEvent.click(screen.getByTestId('export-confirm'))
    expect(downloadCanvasBlobMock.mock.calls[0][2]).toBe('image/webp')
  })

  it('engine not attached → honest message + disabled export (no download)', () => {
    renderDialog({ kind: 'error', detail: 'not built' })
    expect(screen.getByTestId('export-not-attached')).toBeInTheDocument()
    expect(screen.getByTestId('export-confirm')).toBeDisabled()
    fireEvent.click(screen.getByTestId('export-confirm'))
    expect(downloadBlobMock).not.toHaveBeenCalled()
    expect(downloadCanvasBlobMock).not.toHaveBeenCalled()
  })

  it('Cancel closes without exporting', () => {
    renderDialog()
    fireEvent.click(screen.getByTestId('export-cancel'))
    expect(onClose).toHaveBeenCalled()
    expect(downloadBlobMock).not.toHaveBeenCalled()
    expect(downloadCanvasBlobMock).not.toHaveBeenCalled()
  })

  it('closed dialog renders nothing', () => {
    render(<ExportDialog open={false} engine={{ kind: 'ok', detail: 'mock' }} onClose={onClose} notify={notify} />)
    expect(screen.queryByTestId('export-dialog')).not.toBeInTheDocument()
  })
})

// ——— SYS-27 slice 1: SVG sequence mode (INT-AID-003) ———
import { bus } from '../bus'

describe('ExportDialog — SVG sequence (eng 14 range + sidecar)', () => {
  it('selecting the sequence format reveals the range inputs (default = full timeline)', () => {
    renderDialog()
    expect(screen.queryByTestId('export-seq-range')).not.toBeInTheDocument()
    fireEvent.change(screen.getByTestId('export-format'), { target: { value: 'svgseq' } })
    expect(screen.getByTestId('export-seq-range')).toBeInTheDocument()
    expect(screen.getByTestId('export-seq-first')).toHaveValue(1)
    expect(screen.getByTestId('export-seq-last')).toHaveValue(10) // duration
  })

  it('exports the range + sidecar, emits export:done{sequence}, closes', () => {
    const events: unknown[] = []
    const off = bus.on('export:done', (p) => events.push(p))
    renderDialog()
    fireEvent.change(screen.getByTestId('export-format'), { target: { value: 'svgseq' } })
    fireEvent.change(screen.getByTestId('export-seq-first'), { target: { value: '2' } })
    fireEvent.change(screen.getByTestId('export-seq-last'), { target: { value: '4' } })
    fireEvent.click(screen.getByTestId('export-confirm'))
    // 3 frames + 1 sidecar
    expect(downloadBlobMock).toHaveBeenCalledTimes(4)
    expect(downloadBlobMock.mock.calls[0][0]).toBe('My Movie_0002.svg')
    expect(downloadBlobMock.mock.calls[3][0]).toBe('My Movie_sequence.json')
    expect(events).toEqual([{ format: 'sequence', path: 'My Movie_0002.svg' }])
    expect(onClose).toHaveBeenCalled()
    off()
  })

  it('an invalid range refuses: nothing downloaded, no event, dialog STAYS open', () => {
    const events: unknown[] = []
    const off = bus.on('export:done', (p) => events.push(p))
    renderDialog()
    fireEvent.change(screen.getByTestId('export-format'), { target: { value: 'svgseq' } })
    fireEvent.change(screen.getByTestId('export-seq-last'), { target: { value: '99' } }) // > duration 10
    fireEvent.click(screen.getByTestId('export-confirm'))
    expect(downloadBlobMock).not.toHaveBeenCalled()
    expect(events).toEqual([])
    expect(notify).toHaveBeenCalledWith(expect.stringContaining('exceeds the timeline'))
    expect(onClose).not.toHaveBeenCalled()
    off()
  })

  it('single-frame image exports now emit export:done (contract §D)', () => {
    const events: { format: string }[] = []
    const off = bus.on('export:done', (p) => events.push(p))
    renderDialog()
    fireEvent.click(screen.getByTestId('export-confirm')) // svg default
    expect(events).toEqual([{ format: 'svg', path: 'kineora.svg' }])
    off()
  })
})
