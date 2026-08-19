# F-11-07 — SYMBOL EDITING MODES (edit / in-place / new window / breadcrumb)
```
SOURCE BLUEPRINT: Part 11 §11.3 · DEEP FEATURE: F-11-07 · STATUS: AUDITED
DEPENDS ON: F-11-01/06
```
## A. IDENTITY
1. Official name: symbol-editing mode / Edit in Place / **Edit in New Window**. 4. Purpose: enter a symbol's timeline to edit its definition (which updates all instances). 8. Status: current.

## EVIDENCE
E1 [OFFICIAL] `symbols.html`: **symbol-editing mode** = full-window view of only the symbol; crosshair = registration point; name above stage; enter via double-click Library icon / right-click Edit / Edit > Edit Symbols. E2 [OFFICIAL] same: **Edit in Place** = edit in stage context (other objects dimmed); enter via double-click instance / right-click Edit in Place. E3 [OFFICIAL] same: **Edit in New Window** = edit symbol in a separate window (see symbol + main timeline simultaneously). E4 [OFFICIAL] same: exit via **Back button** / scene name / Edit > Edit Document / **double-click outside the symbol content**. E5 [OFFICIAL] same: editing a symbol updates **all instances**; breadcrumb (Edit bar) shows nesting path.

## D. MODE TABLE
| Mode | View | Enter | Exit |
|---|---|---|---|
| Symbol-editing mode | symbol only | dbl-click Library icon / Edit Symbols (E1) | Back / Edit Document / scene name |
| Edit in Place | in-context (dimmed others) | dbl-click instance (E2) | Back / double-click outside (E4) |
| Edit in New Window | separate window | right-click → Edit In New Window (E3) | close window |

## E. STATES
Breadcrumb shows `Scene ▸ symbol ▸ nested`; dimmed content excluded from selection (F-03-01); edits propagate to all instances (E5).

## L. LIMITATIONS
L.1 Deep-nesting exit is tedious (no one-key exit per level) → ours: Esc = one level, Ctrl+Enter = root (F-03-03 L.2). L.2 Edit-in-new-window is Windows-only-ish (separate window) → ours: tabbed edit (web-friendly).

## M. EDGE CASES
M.1 nested symbol exit path · M.2 edit while another instance selected · M.3 breadcrumb click to jump levels · M.4 double-click outside exit (E4).

## O/P/Q/R/S/Y
Data: `editMode` (view state) + symbol edits (document). Events: `editMode:entered/exited`. Undo: symbol edits = commands. Serialization: edits persisted; editMode not. Mobile: double-tap = edit-in-place; breadcrumb bar with back. Implementation: edit-mode stack (breadcrumb); dim = render non-scope layers dimmed.

## TESTS
TS-01 symbol-edit via Library icon (E1) · TS-02 edit-in-place via double-click (E2) · TS-03 edit-in-new-window (E3) · TS-04 exit paths (E4) · TS-05 edits update all instances (E5) · TS-06 breadcrumb nesting · TS-07 Esc/Ctrl+Enter (ours) · TS-08 dimmed excluded from selection · TS-09 undo definition edit · TS-10 mobile double-tap.
## AUDITS
No contradiction. Self-challenge: overlooked = Edit-in-New-Window (E3, easy to miss) + double-click-outside exit (E4) + tedious deep exit (L.1) — covered.
```
FEATURE COMPLETE: F-11-07 — Symbol editing modes — AUDITED
```
