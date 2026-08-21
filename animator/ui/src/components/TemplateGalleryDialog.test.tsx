import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { TemplateGalleryDialog } from './TemplateGalleryDialog'

const TEMPLATES_KEY = 'kineora.templates'

function seedTemplates(): void {
  localStorage.setItem(
    TEMPLATES_KEY,
    JSON.stringify({
      Banner: {
        name: 'Banner',
        savedAt: 1755800000,
        json: '{"settings":{"width":1920.0,"height":480.0,"fps":24,"backgroundColor":"#ffffff","backgroundAlpha":1,"units":"px","platform":"HTML5 Canvas"},"scenes":[],"nodes":{},"library":[],"next_id":1}',
      },
      'Walk Cycle': {
        name: 'Walk Cycle',
        savedAt: 1755800100,
        json: '{"settings":{"width":800.0,"height":600.0,"fps":30,"backgroundColor":"#000000","backgroundAlpha":1,"units":"px","platform":"WebGL"},"scenes":[],"nodes":{},"library":[],"next_id":1}',
      },
    }),
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.removeItem(TEMPLATES_KEY)
})

function renderDialog(onCreateFromTemplate = vi.fn(), onClose = vi.fn()) {
  render(<TemplateGalleryDialog open onClose={onClose} onCreateFromTemplate={onCreateFromTemplate} />)
  return { onCreateFromTemplate, onClose }
}

describe('TemplateGalleryDialog (H01 v2 §5.3)', () => {
  it('empty store → honest empty state, Open disabled (never a dead button)', () => {
    renderDialog()
    expect(screen.getByTestId('tpl-new-empty')).toHaveTextContent('No templates saved yet')
    expect((screen.getByTestId('tpl-new-open') as HTMLButtonElement).disabled).toBe(true)
  })

  it('lists templates with platform/W×H/fps preview (tpl-new.list)', () => {
    seedTemplates()
    renderDialog()
    screen.getByTestId('tpl-new-item-Banner')
    screen.getByTestId('tpl-new-item-Walk Cycle')
    expect(screen.getByTestId('tpl-new-preview-Banner')).toHaveTextContent('HTML5 Canvas · 1920×480 · 24 fps')
    expect(screen.getByTestId('tpl-new-preview-Walk Cycle')).toHaveTextContent('WebGL · 800×600 · 30 fps')
  })

  it('clicking a row only SELECTS (highlights) — it never seeds a document', () => {
    seedTemplates()
    const { onCreateFromTemplate } = renderDialog()
    fireEvent.click(screen.getByTestId('tpl-new-item-Banner'))
    expect(onCreateFromTemplate).not.toHaveBeenCalled()
    expect(screen.getByTestId('tpl-new-item-Banner').getAttribute('aria-selected')).toBe('true')
  })

  it('Open stays disabled with a reason until a template is selected', () => {
    seedTemplates()
    const { onCreateFromTemplate } = renderDialog()
    const open = screen.getByTestId('tpl-new-open') as HTMLButtonElement
    expect(open.disabled).toBe(true)
    expect(open.title).toBe('Select a template first')
    fireEvent.click(open)
    expect(onCreateFromTemplate).not.toHaveBeenCalled()
  })

  it('selected row → Open seeds from that template and closes (tpl-new.open)', () => {
    seedTemplates()
    const { onCreateFromTemplate, onClose } = renderDialog()
    fireEvent.click(screen.getByTestId('tpl-new-item-Walk Cycle'))
    const open = screen.getByTestId('tpl-new-open') as HTMLButtonElement
    expect(open.disabled).toBe(false)
    fireEvent.click(open)
    expect(onCreateFromTemplate).toHaveBeenCalledWith('Walk Cycle')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Cancel / Esc close without creating anything', () => {
    seedTemplates()
    const { onCreateFromTemplate, onClose } = renderDialog()
    fireEvent.click(screen.getByTestId('tpl-new-item-Banner')) // selection is not a mutation
    fireEvent.click(screen.getByTestId('tpl-new-cancel'))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onCreateFromTemplate).not.toHaveBeenCalled()
  })

  it('Esc closes without creating', () => {
    seedTemplates()
    const { onCreateFromTemplate, onClose } = renderDialog()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onCreateFromTemplate).not.toHaveBeenCalled()
  })
})
