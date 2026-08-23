import { useState } from 'react'
import { ToolColors } from './ToolColors'
import { ToolOptions } from './ToolOptions'

/**
 * TOOLS PANEL — the vertical, icon-only strip on the left, like Adobe Animate.
 * Improved: more tools, better styling, honest coming-soon toasts.
 */

export interface ToolDef {
  id: string
  label: string
  shortcut: string
  icon: JSX.Element
  comingSoon?: boolean
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const icons = {
  select: (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path d="M5 3.2 L5 15.2 L8.2 12.2 L10.4 16.8 L12.6 15.7 L10.5 11.4 L15 11.2 Z" fill="currentColor" />
    </svg>
  ),
  subselect: (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path d="M5 3.2 L5 15.2 L8.2 12.2 L10.4 16.8 L12.6 15.7 L10.5 11.4 L15 11.2 Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="10" cy="10" r="1.5" fill="currentColor" />
    </svg>
  ),
  transform: (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <rect x="5.5" y="5.5" width="9" height="9" {...stroke} strokeDasharray="2 1.6" />
      <rect x="3.4" y="3.4" width="2.6" height="2.6" fill="currentColor" />
      <rect x="14" y="3.4" width="2.6" height="2.6" fill="currentColor" />
      <rect x="3.4" y="14" width="2.6" height="2.6" fill="currentColor" />
      <rect x="14" y="14" width="2.6" height="2.6" fill="currentColor" />
    </svg>
  ),
  lasso: (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path d="M4 6 C3 8 5 10 7 11 C9 12 11 13 13 12 C15 11 16 9 15 7 C14 5 12 4 10 5 C8 6 6 5 4 6 Z" {...stroke} />
      <path d="M4 6 L3 3" {...stroke} />
    </svg>
  ),
  pen: (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path d="M3 17 L4.5 15.5 L14 6 L16 8 L6.5 17.5 Z" {...stroke} />
      <path d="M12 4 L16 8" {...stroke} />
    </svg>
  ),
  text: (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path d="M4 5 H16 M10 5 V15 M6 15 H14" {...stroke} />
    </svg>
  ),
  line: (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path d="M4 16 L16 4" {...stroke} />
    </svg>
  ),
  rect: (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <rect x="3.5" y="5.5" width="13" height="9" {...stroke} />
    </svg>
  ),
  oval: (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <ellipse cx="10" cy="10" rx="6.5" ry="4.5" {...stroke} />
    </svg>
  ),
  pencil: (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path d="M4 14 L5 16 L7 15 L14 8 L12 6 L5 13 Z" {...stroke} />
    </svg>
  ),
  brush: (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path d="M4 15 C4 15 6 12 9 10 C12 8 14 6 15 4 C15 4 17 6 15 8 C13 10 11 12 9 14 C7 16 4 15 4 15 Z" fill="currentColor" />
    </svg>
  ),
  bucket: (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path d="M8.6 3.2 3.9 7.9a1.4 1.4 0 0 0 0 2l4.6 4.6a1.4 1.4 0 0 0 2 0l4.7-4.7z" {...stroke} />
      <path d="M7.4 2 10 4.6" {...stroke} />
      <path d="M16.6 12.4c.9 1.3 1.4 2.2 1.4 2.8a1.4 1.4 0 0 1-2.8 0c0-.6.5-1.5 1.4-2.8z" fill="currentColor" />
    </svg>
  ),
  ink: (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path d="M8 2.6h4v2.2l1.8 2.2v9.4a1 1 0 0 1-1 1H7.2a1 1 0 0 1-1-1V7l1.8-2.2z" {...stroke} />
      <path d="M6.2 11.4h7.6" {...stroke} />
    </svg>
  ),
  eraser: (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path d="M3 12 L8 7 L15 14 L10 17 Z" {...stroke} />
      <path d="M8 7 L12 3 L17 8 L15 14" {...stroke} />
    </svg>
  ),
  eyedropper: (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path d="M12.4 3.2a2 2 0 0 1 2.8 2.8l-1.1 1.1 1 1-1.3 1.3-1-1-5.4 5.4-2.6.8.8-2.6 5.4-5.4-1-1 1.3-1.3 1 1z" {...stroke} />
    </svg>
  ),
  hand: (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path d="M7 9V4.6a1.1 1.1 0 0 1 2.2 0V9m0-1.2V3.8a1.1 1.1 0 0 1 2.2 0V9m0-.8V5.2a1.1 1.1 0 0 1 2.2 0V11m-8.6-.6V8.2a1.1 1.1 0 0 1 2.2 0V12" {...stroke} />
      <path d="M4.8 11.2v1.4c0 2.6 2 4.6 4.8 4.6s4.8-1.9 4.8-4.6V8" {...stroke} />
    </svg>
  ),
  zoom: (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <circle cx="8.6" cy="8.6" r="4.9" {...stroke} />
      <path d="M12.4 12.4 17 17" {...stroke} />
      <path d="M6.4 8.6h4.4M8.6 6.4v4.4" {...stroke} />
    </svg>
  ),
}

/** Selection area */
export const TOOLS_AREA_SELECT: ToolDef[] = [
  { id: 'select', label: 'Selection Tool', shortcut: 'V', icon: icons.select },
  { id: 'subselect', label: 'Subselection Tool', shortcut: 'A', icon: icons.subselect, comingSoon: true },
  { id: 'transform', label: 'Free Transform Tool', shortcut: 'Q', icon: icons.transform },
  { id: 'lasso', label: 'Lasso Tool', shortcut: 'L', icon: icons.lasso, comingSoon: true },
]

/** Drawing area */
export const TOOLS_AREA_DRAW: ToolDef[] = [
  { id: 'pen', label: 'Pen Tool', shortcut: 'P', icon: icons.pen, comingSoon: true },
  { id: 'text', label: 'Text Tool', shortcut: 'T', icon: icons.text, comingSoon: true },
  { id: 'line', label: 'Line Tool', shortcut: 'N', icon: icons.line, comingSoon: true },
  { id: 'rect', label: 'Rectangle Tool', shortcut: 'R', icon: icons.rect },
  { id: 'oval', label: 'Oval Tool', shortcut: 'O', icon: icons.oval, comingSoon: true },
  { id: 'pencil', label: 'Pencil Tool', shortcut: 'Y', icon: icons.pencil, comingSoon: true },
  { id: 'brush', label: 'Brush Tool', shortcut: 'B', icon: icons.brush, comingSoon: true },
]

/** Painting area */
export const TOOLS_AREA_PAINT: ToolDef[] = [
  { id: 'bucket', label: 'Paint Bucket Tool', shortcut: 'K', icon: icons.bucket },
  { id: 'ink', label: 'Ink Bottle Tool', shortcut: 'S', icon: icons.ink },
  { id: 'eyedropper', label: 'Eyedropper Tool', shortcut: 'I', icon: icons.eyedropper },
  { id: 'eraser', label: 'Eraser Tool', shortcut: 'E', icon: icons.eraser, comingSoon: true },
]

export const TOOLS_AREA: ToolDef[] = [...TOOLS_AREA_SELECT, ...TOOLS_AREA_DRAW, ...TOOLS_AREA_PAINT]

/** View area */
export const VIEW_AREA: ToolDef[] = [
  { id: 'hand', label: 'Hand Tool', shortcut: 'H', icon: icons.hand },
  { id: 'zoom', label: 'Zoom Tool', shortcut: 'Z', icon: icons.zoom },
]

interface Props {
  tool: string
  onPick: (tool: string) => void
  notify?: (msg: string) => void
}

export function ToolsPanel({ tool, onPick, notify }: Props) {
  const [hover, setHover] = useState<ToolDef | null>(null)

  const button = (t: ToolDef) => {
    const active = tool === t.id
    const isComingSoon = !!t.comingSoon
    return (
      <button
        key={t.id}
        data-testid={`tool-${t.id}`}
        data-active={active ? 'true' : 'false'}
        data-coming-soon={isComingSoon ? 'true' : 'false'}
        aria-pressed={active}
        aria-label={`${t.label} (${t.shortcut})${isComingSoon ? ' — coming soon' : ''}`}
        title={`${t.label} (${t.shortcut})${isComingSoon ? ' — coming soon' : ''}`}
        onMouseEnter={() => setHover(t)}
        onMouseLeave={() => setHover((h) => (h?.id === t.id ? null : h))}
        onFocus={() => setHover(t)}
        onBlur={() => setHover((h) => (h?.id === t.id ? null : h))}
        onClick={() => {
          if (isComingSoon) {
            notify?.(`${t.label} — coming soon (next unit)`)
            return
          }
          onPick(t.id)
        }}
        style={{
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 5,
          border: active ? '1px solid #5a8fc0' : '1px solid transparent',
          background: active ? '#2d5aa7' : isComingSoon ? 'transparent' : 'transparent',
          color: active ? '#eaf3ff' : isComingSoon ? '#555' : '#c9c9c9',
          cursor: isComingSoon ? 'not-allowed' : 'pointer',
          padding: 0,
          opacity: isComingSoon ? 0.5 : 1,
          transition: 'all 0.12s',
        }}
      >
        {t.icon}
      </button>
    )
  }

  return (
    <div
      data-testid="tools-panel"
      aria-label="Tools"
      style={{
        width: 42,
        flexShrink: 0,
        background: '#1e1e1e',
        borderRight: '1px solid #2a2a2a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        padding: '6px 0',
        position: 'relative',
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>{TOOLS_AREA_SELECT.map(button)}</div>
      <div data-testid="tools-divider" style={{ width: 24, height: 1, background: '#333', margin: '6px 0' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>{TOOLS_AREA_DRAW.map(button)}</div>
      <div style={{ width: 24, height: 1, background: '#333', margin: '6px 0' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>{TOOLS_AREA_PAINT.map(button)}</div>
      <div style={{ width: 24, height: 1, background: '#333', margin: '6px 0' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>{VIEW_AREA.map(button)}</div>

      <div style={{ width: 24, height: 1, background: '#333', margin: '6px 0' }} />
      <ToolColors vertical />

      <div style={{ width: 24, height: 1, background: '#333', margin: '6px 0' }} />
      <ToolOptions tool={tool} vertical />

      {hover && (
        <div
          data-testid="tool-tip"
          role="tooltip"
          style={{
            position: 'absolute',
            left: 46,
            top: 4,
            whiteSpace: 'nowrap',
            background: '#111',
            border: '1px solid #444',
            borderRadius: 5,
            padding: '4px 8px',
            color: '#eee',
            fontSize: 11,
            pointerEvents: 'none',
            zIndex: 30,
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          <span style={{ fontWeight: 600 }}>{hover.label}</span> <span style={{ color: '#8ab4e8' }}>({hover.shortcut})</span>
          {hover.comingSoon && <span style={{ color: '#e8a020', marginLeft: 6 }}>— coming soon</span>}
        </div>
      )}
    </div>
  )
}
