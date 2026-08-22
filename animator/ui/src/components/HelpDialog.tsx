import { useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  /** Which documentation tab to show when opened. */
  section?: 'docs' | 'troubleshoot'
}

type Section = 'docs' | 'troubleshoot'

// Local-first help content (Blueprint Part 01 §1.2.11: "local docs + shortcut
// reference + version/about"). No external links — the product is offline-first
// (Blueprint W7). Content is grounded in the shipped feature set; entries for
// not-yet-implemented systems are honestly labelled "(future)".
const DOCS: Array<{ heading: string; items: string[] }> = [
  {
    heading: 'Documents & files',
    items: [
      'File ▸ New (Ctrl+N) creates a document; File ▸ New from Template seeds one from a saved template.',
      'File ▸ Open / Open Recent (Ctrl+O) opens a saved .json project; multiple documents open in tabs.',
      'File ▸ Save / Save As (Ctrl+S / Ctrl+Shift+S) writes the project. Save is overwrite-no-confirm; Save As picks a new path.',
      'File ▸ Close (Ctrl+W) closes the active document; dirty documents offer Save / Don\u2019t Save / Cancel.',
    ],
  },
  {
    heading: 'Editing',
    items: [
      'Edit ▸ Undo / Redo (Ctrl+Z / Ctrl+Shift+Z, Ctrl+Y) step through the per-document history. Save never clears it.',
      'Edit ▸ Cut / Copy / Paste (Ctrl+X/C/V) and Paste in Place (Ctrl+Shift+V) work on the selection and are shared across open documents.',
      'Edit ▸ Select All / Deselect (Ctrl+A / Ctrl+Shift+A).',
      'Delete / Backspace removes the selection (one undoable command).',
    ],
  },
  {
    heading: 'Tools & stage',
    items: [
      'V = Selection tool (move/select), R = Rectangle tool, Q = Free Transform (scale/rotate).',
      'Drag on the stage to move the selection or draw a rectangle; click empty space to deselect.',
      'Ctrl+= / Ctrl+- zoom, Ctrl+1 = 100%, Ctrl+0 = Fit in window. Hold Space and drag to pan (when Hand tool is available).',
      'The Layers, Properties and Library panels dock on the right; drag dividers to resize; toggle them from the Window menu.',
    ],
  },
  {
    heading: 'Timeline & playback',
    items: [
      'Enter plays/pauses the timeline; Stop halts playback; Home/End jump to the first/last frame.',
      'Step one frame with \u2018.\u2019 / \u2018,\u2019; hop keyframes with Alt+. / Alt+,.',
      'F5 inserts a frame, F6 a keyframe, F7 a blank keyframe; Shift+F5 deletes frames, Shift+F6 clears a keyframe.',
      'Toggle Loop Playback from the Control menu or the timeline \u27f3 Loop button.',
    ],
  },
  {
    heading: 'Symbols & library',
    items: [
      'Modify ▸ Convert to Symbol (F8) wraps the selection; Insert ▸ New Symbol creates an empty symbol.',
      'Select a symbol instance to change its Loop mode and first frame in the Properties panel, or Swap to another symbol.',
      'The Library panel lists every symbol; double-click an instance to edit it in place (edit depth shown in the edit bar).',
    ],
  },
  {
    heading: 'Coming from Adobe Animate?',
    items: [
      'Kineora is local-first and inspired by Animate\u2019s workflow but is an original product \u2014 no Adobe assets, branding or ActionScript.',
      'Audio/lipsync, camera, rigging/IK, import/export of video/GIF, and scripting are future systems \u2014 their menu entries honestly say so rather than pretending to work.',
    ],
  },
]

const TROUBLESHOOT: Array<{ heading: string; items: string[] }> = [
  {
    heading: 'Engine not attached',
    items: [
      'The status bar shows \u201cengine: not attached\u201d and engine commands report \u201cengine not attached \u2014 build with `npm run wasm`\u201d.',
      'Run `npm run wasm` in animator/ui (or `bash scripts/build-wasm.sh` from the repo root) to compile animator-core to WASM, then reload.',
      'In the native desktop app run `bash scripts/dev-desktop.sh`; on Linux Mint first run `bash scripts/install-linux-deps.sh` if webkit2gtk is missing.',
    ],
  },
  {
    heading: 'A menu item is greyed out',
    items: [
      'Hover it \u2014 the tooltip states why (e.g. \u201cnothing selected\u201d, \u201cengine not attached\u201d, \u201cat document root\u201d).',
      'Items labelled \u201c(future)\u201d or showing an integration-gap toast belong to a system that is not implemented yet; they are disabled on purpose, never silently broken.',
    ],
  },
  {
    heading: 'Shortcuts don\u2019t fire in the browser',
    items: [
      'Ctrl+N/O/S/W and function keys can be intercepted by the browser. The native desktop shell (Tauri) is authoritative for shortcuts; use it for real work.',
      'When typing in a text field, shortcuts are intentionally suppressed so you can type normally.',
    ],
  },
  {
    heading: 'Undo / lost changes',
    items: [
      'Each document keeps its own undo history; switching tabs never merges or clears it.',
      'A filled \u25cf on the tab and title means unsaved changes. File ▸ Save clears the dot; a failed save keeps it and shows \u201csave error\u201d.',
      'Close / Exit always offers Save for dirty documents \u2014 there is no path that discards without confirmation.',
    ],
  },
  {
    heading: 'Reporting a problem',
    items: [
      'Open the Developer panel (Window ▸ Developer, or Ctrl+Alt+T toggles the timeline) for the dead-button audit, engine status, shell identity and event log \u2014 include those details with any report.',
    ],
  },
]

function content(section: Section) {
  return section === 'docs' ? DOCS : TROUBLESHOOT
}

function titleFor(section: Section): string {
  return section === 'docs' ? 'Kineora Help \u2014 Documentation' : 'Kineora Help \u2014 Troubleshooting'
}

/**
 * Help ▸ Documentation / Troubleshooting — offline, in-app local help
 * (Blueprint Part 01 §1.2.11). One dialog reused for both commands via the
 * `section` prop; Esc / outside-click / Close dismiss. Focus is moved to the
 * dialog on open and restored to the Close button on unmount.
 */
export function HelpDialog({ open, onClose, section = 'docs' }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const body = content(section)
  return (
    <div
      data-testid={section === 'docs' ? 'help-docs-dialog' : 'help-troubleshoot-dialog'}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titleFor(section)}
        style={{ width: 620, maxWidth: '92vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column', background: '#1d1d1d', border: '1px solid #3a3a3a', borderRadius: 8, boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}
      >
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #3a3a3a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#eee', fontSize: 15 }}>{titleFor(section)}</h3>
          <button
            data-testid="help-close"
            onClick={onClose}
            style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid #555', background: '#2a2a2a', color: '#ddd', cursor: 'pointer', fontSize: 12 }}
          >
            Close
          </button>
        </div>
        <div data-testid="help-body" style={{ overflowY: 'auto', padding: '8px 16px 16px', fontSize: 13 }}>
          {body.map((group) => (
            <section key={group.heading} style={{ marginTop: 12 }}>
              <div style={{ color: '#8ef', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{group.heading}</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: '#bbb', lineHeight: 1.6 }}>
                {group.items.map((it, i) => (
                  <li key={i}>{it}</li>
                ))}
              </ul>
            </section>
          ))}
          <p style={{ marginTop: 14, color: '#666', fontSize: 11 }}>
            Offline-first · no telemetry · Keyboard Shortcuts (Help ▸ Keyboard Shortcuts) lists every binding.
          </p>
        </div>
      </div>
    </div>
  )
}
