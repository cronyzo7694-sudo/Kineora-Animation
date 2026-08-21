import { useEffect, type RefObject } from 'react'

/**
 * Minimal modal focus trap (H00 §17 / H01 §9: "Dialog: focus trap").
 * While `open`, Tab / Shift+Tab cycle through the dialog's enabled focusable
 * elements only — focus can never escape to the dimmed canvas behind. Uses
 * the capture phase so it runs before other key handlers; Esc handling stays
 * with each dialog's own contract.
 */
export function useFocusTrap(open: boolean, rootRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const root = rootRef.current
      if (!root) return
      const items = Array.from(
        root.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1)
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || !root.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !root.contains(active))) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, rootRef])
}
