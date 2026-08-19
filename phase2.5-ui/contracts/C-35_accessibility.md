# UI CONTRACT: C-35 — ACCESSIBILITY SYSTEM
```
SOURCE:  00_UI_RELIABILITY_MASTER.md §26
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Cross-cutting (every control).
## B. REQUIREMENTS (all controls)
| ID | Requirement |
|---|---|
| a11y.name | accessible name on every control |
| a11y.role | correct role (button/slider/menu/…) |
| a11y.focus | visible focus indicator (token `focus-ring`) |
| a11y.kbd | keyboard operation (Tab/Enter/Space/Esc) |
| a11y.sr | screen-reader labels + aria-live (selection count, state changes) |
| a11y.touch | ≥44px touch targets |
| a11y.contrast | WCAG AA via tokens |
| a11y.motion | reduced-motion respected (durations) |
| a11y.escape | keyboard users can escape overlays + navigate critical controls |
## C. STATE MAP
| State | Behavior |
|---|---|
| Focus | visible ring |
| Overlay open | focus trap; Esc closes |
| Selection change | aria-live announce "N objects selected" |
| Long op | announced "processing" |
| Error | announced + inline |
## D. EXIT / ESCAPE / UNDO
Esc closes overlays; keyboard full navigation.
## E. SHORTCUTS
Tab/Shift+Tab · Enter/Space activate · Esc close · Cmd+K palette (keyboard-first).
## F. POINTER + TOUCH
Touch targets ≥44px; stylus fine (1px).
## G. BUTTON BLOCKS (exemplar)
Any button: a11y name = its label; focus = ring; Enter/Space = click.
## H. OVERLAYS
Focus trap in modals (Tab cycles inside); toast aria-live polite.
## I. ERROR & RECOVERY
Announce errors; recovery path keyboard-reachable.
## J. AUDIT
[x] visible [x] clickable [x] stateful [x] positioned [x] accessible (this IS the gate) [x] closable [x] responsive [x] tested (screen-reader + keyboard-only pass) [x] wired.
```
UI COMPLETE  (C-35)
```
