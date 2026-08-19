# F-29-01..12 — KEYBOARD SHORTCUTS (full part)
```
SOURCE BLUEPRINT: Part 29 · DEEP FEATURES: F-29-01..12 · STATUS: AUDITED
DEPENDS ON: (cross-cutting) · FEEDS: F-31 (mobile translation), F-34 (buttons)
```
## A. IDENTITY
1. Official name: Keyboard shortcuts (Edit > Keyboard Shortcuts). 4. Purpose: the complete hotkey reference + rebindable editor. 8. Status: current.
## EVIDENCE
E1 [OFFICIAL] Part 29 blueprint + `selecting-objects.html` (V/Ctrl temp-Selection, Ctrl+A/Shift+A). E2 [OFFICIAL] `frames-keyframes.html` (F5/F6/F7, Shift+F5/F6). E3 [COMMUNITY] Domestika/DefKey lists (V/A/Q/W/L/P/T/N/R/O/Shift+Y/Y/B/M/K/S/I/E/U/C/H/Z/F; Ctrl+E toggle edit; Ctrl+B break apart; Ctrl+G/U group/ungroup; Ctrl+Shift+V paste-in-place; Ctrl+Shift+O optimize; Ctrl+K align). E4 [OUR DESIGN DECISION] additions (O/Shift+O/Alt+O onion; D cel-expose; Ctrl+Shift+P nested-preview).
## F-29-01 TOOLS
V/A/Q/F/L/P/T/N/R/O/Shift+Y/Y/B/E/U/I/K/S/M/C/H/Z/Shift+H/Shift+Alt+H; temp-Hand=Space; temp-Selection=Ctrl/Cmd (E1).
## F-29-02 FILE/EDIT
Ctrl+N/O/W/S/Shift+S/R/I/Shift+R/Q; Ctrl+Z/Shift+Z(redo)/X/C/V/Shift+V/D/A/Shift+A/F/U/Shift+Alt+K.
## F-29-03 SELECTION
Shift+click toggle; marquee; Ctrl+Shift+E hide-edges.
## F-29-04 TRANSFORM
Shift constrain; Alt center/opposite; arrows nudge 1px; Shift+arrows 10px; Ctrl+↑/↓ arrange; Ctrl+Shift+↑/↓ front/back; Ctrl+G/U; Ctrl+Alt+S scale-rotate.
## F-29-05 TIMELINE/FRAMES
F5/F6/F7; Shift+F5 delete; Shift+F6 clear; F8 convert; Ctrl+F8 new symbol.
## F-29-06 PLAYBACK
Enter; Ctrl+Alt+R rewind; Home/End; ./; Ctrl+. next key (assignable); Alt+,/. keyframe hop (F-03-08 E4); Ctrl+Enter test.
## F-29-07 LAYERS
+ button; assignable insert/folder/delete.
## F-29-08 SYMBOLS
F8 / Ctrl+F8 / Ctrl+B / Ctrl+E (toggle edit) / Ctrl+G/U.
## F-29-09 VIEW
Ctrl+=/-/1/0; Ctrl+Shift+Alt+R rulers; Ctrl+' grid; Ctrl+; guides; Ctrl+Shift+W work-area; Ctrl+L library; Ctrl+K align; Ctrl+J doc.
## F-29-10 TEXT
Ctrl+T font; Ctrl+Shift+T paragraph; Ctrl+←/→ kerning.
## F-29-11 OUR ADDITIONS
O/Shift+O/Alt+O onion; D cel-expose; Ctrl+Shift+P nested-preview; Ctrl+Shift+G graph (rebindable).
## F-29-12 SHORTCUT EDITOR
Rebind, conflict detection, reset, import/export (JSON).
## L. LIMITATIONS
L.1 keep Flash muscle-memory defaults [WISH W8]. L.2 conflicts (Pencil Shift+Y vs Pen P) → editor detects.
## M. EDGE CASES
M.1 rebind conflict · M.2 Mac vs Win (Ctrl↔Cmd) · M.3 reset to default.
## O/P/Q/R/S/Y
Data: shortcut map (app prefs, JSON). Events: `shortcuts:changed`. Undo: n/a. Serialization: prefs persisted. Mobile: shortcuts → toolbar buttons (F-31). Implementation: `ShortcutRegistry` (map commandId → key); input adapter resolves.
## TESTS
TS-01 V/A/Q/F5/F6/F7 default · TS-02 shift-add · TS-03 Ctrl+E toggle edit · TS-04 Ctrl+B break · TS-05 rebind works · TS-06 conflict detect · TS-07 reset · TS-08 Mac keys · TS-09 mobile toolbar mapping · TS-10 prefs persist.
## AUDITS
No contradiction. Self-challenge: overlooked = temp-Selection (Ctrl) + Alt-keyframe-hop + Pencil-Shift+Y conflict + Mac-Cmd mapping — covered.
```
FEATURE COMPLETE: F-29-01..12 — Keyboard shortcuts — AUDITED
```
