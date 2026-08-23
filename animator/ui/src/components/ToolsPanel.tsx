import { useState } from 'react'
import { ToolColors } from './ToolColors'
import { ToolOptions } from './ToolOptions'

/**
 * TOOLS PANEL — the vertical, icon-only strip on the left, like Adobe Animate.
 *
 * Adobe (helpx — Use the Stage and Tools panel for Animate): "The Tools panel is
 * divided into four sections: the tools area contains drawing, painting, and
 * selection tools · the view area contains tools for zooming and panning ·
 * the colors area contains modifiers for stroke and fill colors · the options
 * area contains modifiers for the currently selected tool."
 *
 * Same four sections here, in that order. Buttons carry the icon only; the
 * name + shortcut appear on hover (and as the accessible name), exactly like
 * Animate's tool tips.
 */

export interface ToolDef {
  /** Tool id used by the Stage pointer router. */
  id: string
  label: string
  shortcut: string
  icon: JSX.Element
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

/** 20×20 line icons drawn to read at toolbar size (Animate's tool glyphs). */
const icons = {
  select: (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path d="M5 3.2 L5 15.2 L8.2 12.2 L10.4 16.8 L12.6 15.7 L10.5 11.4 L15 11.2 Z" fill="currentColor" />
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
  rect: (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <rect x="3.5" y="5.5" width="13" height="9" {...stroke} />
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

/** Tools area (drawing / painting / selection) — Adobe's first section. */
export const TOOLS_AREA: ToolDef[] = [
  { id: 'select', label: 'Selection Tool', shortcut: 'V', icon: icons.select },
  { id: 'transform', label: 'Free Transform Tool', shortcut: 'Q', icon: icons.transform },
  { id: 'rect', label: 'Rectangle Tool', shortcut: 'R', icon: icons.rect },
  { id: 'bucket', label: 'Paint Bucket Tool', shortcut: 'K', icon: icons.bucket },
  { id: 'ink', label: 'Ink Bottle Tool', shortcut: 'S', icon: icons.ink },
  { id: 'eyedropper', label: 'Eyedropper Tool', shortcut: 'I', icon: icons.eyedropper },
]

/** View area (zoom / pan) — Adobe's second section. */
export const VIEW_AREA: ToolDef[] = [
  { id: 'hand', label: 'Hand Tool', shortcut: 'H', icon: icons.hand },
  { id: 'zoom', label: 'Zoom Tool', shortcut: 'Z', icon: icons.zoom },
]

interface Props {
  /** Currently active tool id. */
  tool: string
  onPick: (tool: string) => void
}

export function ToolsPanel({ tool, onPick }: Props) {
  const [hover, setHover] = useState<ToolDef | null>(null)

  const button = (t: ToolDef) => {
    const active = tool === t.id
    return (
      <button
        key={t.id}
        data-testid={`tool-${t.id}`}
        data-active={active ? 'true' : 'false'}
        aria-pressed={active}
        aria-label={`${t.label} (${t.shortcut})`}
        // native tooltip = the same text, so the name shows on hover even
        // outside our custom flyout (and for screen readers / e2e)
        title={`${t.label} (${t.shortcut})`}
        onMouseEnter={() => setHover(t)}
        onMouseLeave={() => setHover((h) => (h?.id === t.id ? null : h))}
        onFocus={() => setHover(t)}
        onBlur={() => setHover((h) => (h?.id === t.id ? null : h))}
        onClick={() => onPick(t.id)}
        style={{
          width: 30,
          height: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4,
          border: active ? '1px solid #5a8fc0' : '1px solid transparent',
          background: active ? '#33506b' : 'transparent',
          color: active ? '#eaf3ff' : '#c9c9c9',
          cursor: 'pointer',
          padding: 0,
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
        width: 40,
        flexShrink: 0,
        background: '#232323',
        borderRight: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        padding: '4px 0',
        position: 'relative',
      }}
    >
      {TOOLS_AREA.map(button)}
      <div data-testid="tools-divider" style={{ width: 22, height: 1, background: '#3a3a3a', margin: '4px 0' }} />
      {VIEW_AREA.map(button)}

      {/* colors area */}
      <div style={{ width: 22, height: 1, background: '#3a3a3a', margin: '4px 0' }} />
      <ToolColors vertical />

      {/* options area — modifiers for the current tool (empty when there are none) */}
      <ToolOptions tool={tool} vertical />

      {/* hover tooltip — the tool name + shortcut, Animate-style */}
      {hover && (
        <div
          data-testid="tool-tip"
          role="tooltip"
          style={{
            position: 'absolute',
            left: 44,
            top: 6,
            whiteSpace: 'nowrap',
            background: '#111',
            border: '1px solid #444',
            borderRadius: 4,
            padding: '3px 7px',
            color: '#eee',
            fontSize: 11,
            pointerEvents: 'none',
            zIndex: 30,
          }}
        >
          {hover.label} <span style={{ color: '#8ab4e8' }}>({hover.shortcut})</span>
        </div>
      )}
    </div>
  )
}
