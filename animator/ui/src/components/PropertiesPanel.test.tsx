import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../engine/client', () => ({
  patchTransforms: vi.fn(),
  setNodeProps: vi.fn(),
  setDocumentSettings: vi.fn(() => true),
}))

import { patchTransforms, setDocumentSettings, setNodeProps } from '../engine/client'
import { PropertiesPanel } from './PropertiesPanel'
import type { SelDetailJson, StatusJson } from '../engine/wasmTypes'

const patchTransformsMock = vi.mocked(patchTransforms)
const setNodePropsMock = vi.mocked(setNodeProps)
const setDocumentSettingsMock = vi.mocked(setDocumentSettings)

const notify = vi.fn()

function detail(overrides: Partial<SelDetailJson> = {}): SelDetailJson {
  return {
    id: 1,
    x: 10,
    y: 20,
    w: 100,
    h: 50,
    base_w: 100,
    base_h: 50,
    scale_x: 1,
    scale_y: 1,
    rotation: 0,
    fill: '#ff0000',
    stroke: null,
    stroke_width: 0,
    ...overrides,
  }
}

function makeStatus(overrides: Partial<StatusJson> = {}): StatusJson {
  return {
    playhead: 1,
    selection: [1],
    selection_rects: [],
    selection_details: [detail()],
    undo_len: 0,
    redo_len: 0,
    scene: 'Scene 1',
    layer: 'Layer 1',
    layers: [],
    active_layer: 0,
    fps: 24,
    doc_width: 1920,
    doc_height: 1080,
    background: '#ffffff',
    duration: 60,
    clipboard_len: 0,
    event_log: [],
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  notify.mockClear()
})

describe('PropertiesPanel', () => {
  it('nothing selected → document schema (size/fps/background)', () => {
    render(<PropertiesPanel status={makeStatus({ selection: [], selection_details: [] })} notify={notify} />)
    expect(screen.getByTestId('props-context')).toHaveTextContent('Document')
    expect(screen.getByTestId('doc-width')).toHaveValue('1920')
    expect(screen.getByTestId('doc-height')).toHaveValue('1080')
    expect(screen.getByTestId('doc-fps')).toHaveValue('24')
    expect(screen.queryByTestId('prop-x')).not.toBeInTheDocument()
  })

  it('single selection → object schema with real values', () => {
    render(<PropertiesPanel status={makeStatus()} notify={notify} />)
    expect(screen.getByTestId('props-context')).toHaveTextContent('Object')
    expect(screen.getByTestId('prop-x')).toHaveValue('10')
    expect(screen.getByTestId('prop-y')).toHaveValue('20')
    expect(screen.getByTestId('prop-w')).toHaveValue('100')
    expect(screen.getByTestId('prop-h')).toHaveValue('50')
    expect(screen.getByTestId('prop-rotation')).toHaveValue('0')
    expect(screen.getByTestId('prop-fill')).toBeInTheDocument()
  })

  it('multi selection → common fields only + mixed badge (no fill/stroke)', () => {
    const multi = makeStatus({
      selection: [1, 2],
      selection_details: [detail({ id: 1 }), detail({ id: 2, x: 30 })],
    })
    render(<PropertiesPanel status={multi} notify={notify} />)
    expect(screen.getByTestId('props-context')).toHaveTextContent('Objects (2)')
    expect(screen.getByTestId('props-mixed')).toBeInTheDocument()
    expect(screen.getByTestId('prop-x')).toBeInTheDocument()
    expect(screen.queryByTestId('prop-fill')).not.toBeInTheDocument()
    // X differs across the two objects → shown blank ("mixed")
    expect(screen.getByTestId('prop-x')).toHaveValue('')
  })

  it('editing X commits ONE patchTransforms call per selected object', () => {
    const multi = makeStatus({
      selection: [1, 2],
      selection_details: [detail({ id: 1, x: 10 }), detail({ id: 2, x: 10 })],
    })
    render(<PropertiesPanel status={multi} notify={notify} />)
    const x = screen.getByTestId('prop-x')
    fireEvent.change(x, { target: { value: '55' } })
    fireEvent.blur(x)
    expect(patchTransformsMock).toHaveBeenCalledTimes(1)
    expect(patchTransformsMock).toHaveBeenCalledWith([
      { id: 1, x: 55 },
      { id: 2, x: 55 },
    ])
  })

  it('editing W commits setNodeProps (base property)', () => {
    render(<PropertiesPanel status={makeStatus()} notify={notify} />)
    const w = screen.getByTestId('prop-w')
    fireEvent.change(w, { target: { value: '200' } })
    fireEvent.blur(w)
    expect(setNodePropsMock).toHaveBeenCalledWith([{ id: 1, width: 200 }])
  })

  it('Enter commits and Esc cancels (no engine call)', () => {
    render(<PropertiesPanel status={makeStatus()} notify={notify} />)
    const x = screen.getByTestId('prop-x')
    fireEvent.change(x, { target: { value: '42' } })
    fireEvent.keyDown(x, { key: 'Enter' })
    expect(patchTransformsMock).toHaveBeenCalledTimes(1)

    const y = screen.getByTestId('prop-y')
    fireEvent.change(y, { target: { value: '999' } })
    fireEvent.keyDown(y, { key: 'Escape' })
    expect(patchTransformsMock).toHaveBeenCalledTimes(1) // no second commit
    expect(y).toHaveValue('20') // reverted to engine value
  })

  it('invalid numeric input reverts with an inline error (never silent)', () => {
    render(<PropertiesPanel status={makeStatus()} notify={notify} />)
    const x = screen.getByTestId('prop-x')
    fireEvent.change(x, { target: { value: 'not-a-number' } })
    fireEvent.blur(x)
    expect(patchTransformsMock).not.toHaveBeenCalled()
    expect(screen.getByTestId('prop-x-error')).toBeInTheDocument()
    expect(x).toHaveValue('10') // reverted
  })

  it('unmodified blur produces no command', () => {
    render(<PropertiesPanel status={makeStatus()} notify={notify} />)
    const x = screen.getByTestId('prop-x')
    fireEvent.focus(x)
    fireEvent.blur(x)
    expect(patchTransformsMock).not.toHaveBeenCalled()
  })

  it('document field edit commits setDocumentSettings', () => {
    render(<PropertiesPanel status={makeStatus({ selection: [], selection_details: [] })} notify={notify} />)
    const w = screen.getByTestId('doc-width')
    fireEvent.change(w, { target: { value: '1280' } })
    fireEvent.blur(w)
    expect(setDocumentSettingsMock).toHaveBeenCalledWith({ width: 1280 })
  })

  it('reports engine-not-attached honestly', () => {
    render(<PropertiesPanel status={null} notify={notify} />)
    expect(screen.getByTestId('props-empty')).toHaveTextContent('engine not attached')
    expect(screen.getByTestId('props-context')).toHaveTextContent('—')
  })
})

describe('PropertiesPanel — fill / stroke / fps / background (foundation regression)', () => {
  it('fill color change commits setNodeProps with the hex color (one command)', () => {
    render(<PropertiesPanel status={makeStatus()} notify={notify} />)
    const fill = screen.getByTestId('prop-fill')
    fireEvent.change(fill, { target: { value: '#00ff00' } })
    fireEvent.blur(fill)
    expect(setNodePropsMock).toHaveBeenCalledTimes(1)
    expect(setNodePropsMock).toHaveBeenCalledWith([{ id: 1, fill: '#00ff00' }])
  })

  it('fill color field is EDITABLE (value prop updates — the read-only regression)', () => {
    render(<PropertiesPanel status={makeStatus()} notify={notify} />)
    const fill = screen.getByTestId('prop-fill')
    fireEvent.change(fill, { target: { value: '#123abc' } })
    expect(fill).toHaveValue('#123abc') // draft updates → field not read-only
  })

  it('enabling stroke commits stroke_enabled=true with the color', () => {
    render(<PropertiesPanel status={makeStatus()} notify={notify} />)
    const cb = screen.getByTestId('prop-stroke-enabled')
    expect(cb).not.toBeChecked() // stroke is null by default
    fireEvent.click(cb)
    expect(setNodePropsMock).toHaveBeenCalledWith([{ id: 1, stroke_enabled: true, stroke: '#000000' }])
  })

  it('stroke color change commits stroke_enabled=true with the new color', () => {
    render(<PropertiesPanel status={makeStatus({ selection_details: [detail({ stroke: '#000000' })] })} notify={notify} />)
    const sc = screen.getByTestId('prop-stroke')
    fireEvent.change(sc, { target: { value: '#0000ff' } })
    fireEvent.blur(sc)
    expect(setNodePropsMock).toHaveBeenCalledWith([{ id: 1, stroke_enabled: true, stroke: '#0000ff' }])
  })

  it('stroke width change commits setNodeProps', () => {
    render(<PropertiesPanel status={makeStatus({ selection_details: [detail({ stroke: '#000000' })] })} notify={notify} />)
    const sw = screen.getByTestId('prop-stroke-width')
    fireEvent.change(sw, { target: { value: '10' } })
    fireEvent.blur(sw)
    expect(setNodePropsMock).toHaveBeenCalledWith([{ id: 1, stroke_width: 10 }])
  })

  it('fps change commits setDocumentSettings({fps}) (engine-connected)', () => {
    render(<PropertiesPanel status={makeStatus({ selection: [], selection_details: [] })} notify={notify} />)
    const fps = screen.getByTestId('doc-fps')
    fireEvent.change(fps, { target: { value: '30' } })
    fireEvent.blur(fps)
    expect(setDocumentSettingsMock).toHaveBeenCalledWith({ fps: 30 })
  })

  it('background color change commits setDocumentSettings({background})', () => {
    render(<PropertiesPanel status={makeStatus({ selection: [], selection_details: [] })} notify={notify} />)
    const bg = screen.getByTestId('doc-bg')
    fireEvent.change(bg, { target: { value: '#000000' } })
    fireEvent.blur(bg)
    expect(setDocumentSettingsMock).toHaveBeenCalledWith({ background: '#000000' })
  })
})

describe('PropertiesPanel — live color preview (Part 26.12 / C-09)', () => {
  it('fill input emits a LIVE preview and NO engine write', () => {
    const onPreview = vi.fn()
    render(<PropertiesPanel status={makeStatus()} notify={notify} onPreview={onPreview} />)
    fireEvent.input(screen.getByTestId('prop-fill'), { target: { value: '#00ff00' } })
    expect(onPreview).toHaveBeenCalledWith({ item: { id: 1, fill: '#00ff00' } })
    expect(setNodePropsMock).not.toHaveBeenCalled()
  })

  it('fill blur commits ONCE and clears the preview', () => {
    const onPreview = vi.fn()
    render(<PropertiesPanel status={makeStatus()} notify={notify} onPreview={onPreview} />)
    const fill = screen.getByTestId('prop-fill')
    fireEvent.input(fill, { target: { value: '#00ff00' } })
    fireEvent.blur(fill)
    expect(setNodePropsMock).toHaveBeenCalledTimes(1)
    expect(setNodePropsMock).toHaveBeenCalledWith([{ id: 1, fill: '#00ff00' }])
    expect(onPreview).toHaveBeenLastCalledWith(null)
  })

  it('change-then-blur produces exactly ONE command (no undo fragmentation)', () => {
    const onPreview = vi.fn()
    render(<PropertiesPanel status={makeStatus()} notify={notify} onPreview={onPreview} />)
    const fill = screen.getByTestId('prop-fill')
    fireEvent.change(fill, { target: { value: '#00ff00' } }) // native change = picker closed
    fireEvent.blur(fill)
    expect(setNodePropsMock).toHaveBeenCalledTimes(1)
  })

  it('background input emits { background } preview; blur commits once', () => {
    const onPreview = vi.fn()
    render(<PropertiesPanel status={makeStatus({ selection: [], selection_details: [] })} notify={notify} onPreview={onPreview} />)
    const bg = screen.getByTestId('doc-bg')
    fireEvent.input(bg, { target: { value: '#000000' } })
    expect(onPreview).toHaveBeenCalledWith({ background: '#000000' })
    expect(setDocumentSettingsMock).not.toHaveBeenCalled()
    fireEvent.blur(bg)
    expect(setDocumentSettingsMock).toHaveBeenCalledTimes(1)
    expect(setDocumentSettingsMock).toHaveBeenCalledWith({ background: '#000000' })
  })

  it('stroke width typing emits a live preview; blur commits once; Esc cancels', () => {
    const onPreview = vi.fn()
    render(<PropertiesPanel status={makeStatus({ selection_details: [detail({ stroke: '#000000' })] })} notify={notify} onPreview={onPreview} />)
    const sw = screen.getByTestId('prop-stroke-width')
    fireEvent.change(sw, { target: { value: '10' } })
    expect(onPreview).toHaveBeenCalledWith({ item: { id: 1, strokeWidth: 10 } })
    expect(setNodePropsMock).not.toHaveBeenCalled()
    fireEvent.blur(sw)
    expect(setNodePropsMock).toHaveBeenCalledTimes(1)
    // Esc mid-edit cancels: no extra commit, preview cleared, draft reverted
    fireEvent.change(sw, { target: { value: '99' } })
    fireEvent.keyDown(sw, { key: 'Escape' })
    expect(setNodePropsMock).toHaveBeenCalledTimes(1)
    expect(onPreview).toHaveBeenLastCalledWith(null)
  })

  it('Esc during fill preview cancels: no commit, preview cleared, draft reverted', () => {
    const onPreview = vi.fn()
    render(<PropertiesPanel status={makeStatus()} notify={notify} onPreview={onPreview} />)
    const fill = screen.getByTestId('prop-fill')
    fireEvent.input(fill, { target: { value: '#00ff00' } })
    fireEvent.keyDown(fill, { key: 'Escape' })
    expect(setNodePropsMock).not.toHaveBeenCalled()
    expect(onPreview).toHaveBeenLastCalledWith(null)
    expect(fill).toHaveValue('#ff0000') // reverted to engine value
  })
})

describe('PropertiesPanel — symbol instances (Part 11 §11.5)', () => {
  it('an instance selection shows the symbol name + type (no fill/stroke)', () => {
    const inst = makeStatus({
      selection_details: [
        { ...detail({ fill: '', stroke: null }), kind: 'instance', symbol_name: 'arm', symbol_type: 'graphic' },
      ],
    })
    render(<PropertiesPanel status={inst} notify={notify} />)
    expect(screen.getByTestId('prop-symbol')).toHaveTextContent('arm')
    expect(screen.getByTestId('prop-symbol')).toHaveTextContent('graphic')
    expect(screen.queryByTestId('prop-fill')).not.toBeInTheDocument()
    expect(screen.queryByTestId('prop-w')).not.toBeInTheDocument()
    expect(screen.getByTestId('prop-x')).toBeInTheDocument()
  })
})
