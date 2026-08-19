# F-11-06 — CONVERT TO SYMBOL (F8) + REGISTRATION GRID
```
SOURCE BLUEPRINT: Part 11 §11.2 · DEEP FEATURE: F-11-06 · STATUS: AUDITED
DEPENDS ON: F-11-01
```
## A. IDENTITY
1. Official name: Convert to Symbol (Modify > Convert To Symbol, F8); also New Symbol (Ctrl+F8); drag-to-library. 4. Purpose: wrap stage selection into a Library symbol (definition + instance). 8. Status: current.

## EVIDENCE
E1 [OFFICIAL] `symbols.html`: three ways — Modify > Convert To Symbol / **drag selection to Library** / right-click → Convert To Symbol; dialog = name + behavior + **registration grid** (9 points). E2 [OFFICIAL] same: "Click in the registration grid to position the registration point"; symbol added to library; selection becomes an instance. E3 [OFFICIAL] same: New Symbol (Ctrl+F8) creates an **empty** symbol → symbol-editing mode. E4 [OFFICIAL] same: crosshair = registration point (0,0); moving content relative to crosshair moves the registration point. E5 [COMMUNITY] JSFL: `convertToSymbol` accepts only predefined registration strings (9-grid); custom coords not possible at creation — set after via moving content.

## D. DIALOG CONTROLS
| Control | Purpose | Values |
|---|---|---|
| Name | symbol name | text (unique) |
| Type | behavior | Graphic / Movie Clip / Button |
| Registration grid | origin placement | 9 points (TL/TC/TR/ML/C/MR/BL/BC/BR) |

## E. STATES
Selection → instance (same position); Library gains definition; registration point = chosen grid position (E2).

## L. LIMITATIONS
L.1 Registration limited to 9 grid points at creation (E5) → ours: 9-grid + **custom offset** + free drag after. L.2 Auto-wrap naming (tween1) for classic tween (F-09-03) — different path.

## M. EDGE CASES
M.1 convert empty selection → blocked · M.2 convert a group → symbol of the group · M.3 convert multiple objects → one symbol · M.4 duplicate name → auto-rename (ours: warn).

## O/P/Q/R/S/Y
Data: new Library symbol + instance node. Events: `library:changed`. Undo: one command (convert). Serialization: persisted. Mobile: selection → toolbar "Convert to Symbol" → dialog. Implementation: `convertToSymbol(selection, {name,type,registration})` — wrap content into symbol timeline, place instance at same transform.

## TESTS
TS-01 F8 wraps selection (E1) · TS-02 drag-to-library (E1) · TS-03 9-grid registration (E2) · TS-04 selection becomes instance (E2) · TS-05 Ctrl+F8 empty symbol (E3) · TS-06 crosshair = registration (E4) · TS-07 custom registration offset (ours) · TS-08 duplicate name warn · TS-09 undo · TS-10 mobile dialog.
## AUDITS
No contradiction. Self-challenge: overlooked = 9-grid-only-at-creation (E5) + crosshair-as-registration (E4) + drag-to-library path (E1) — covered.
```
FEATURE COMPLETE: F-11-06 — Convert to symbol — AUDITED
```
