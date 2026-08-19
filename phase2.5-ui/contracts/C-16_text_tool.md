# UI CONTRACT: C-16 — TEXT TOOL UI
```
SOURCE:  Phase-2 F-22-01..08, F-02-09
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Text tool (T) + Text menu + Properties text schema + Cmd+K.
## B. VISIBLE CONTROLS
| ID | Control | State |
|---|---|---|
| t.text | Text tool | FUNCTIONAL |
| txt.type | Static/Dynamic/Input | CONTEXTUAL (text selected) |
| txt.family | Font family | CONTEXTUAL |
| txt.size | Size (pt) | CONTEXTUAL |
| txt.color | Color + alpha | CONTEXTUAL |
| txt.bold/italic | Bold/Italic | CONTEXTUAL |
| txt.align | Align (L/C/R/justify) | CONTEXTUAL |
| txt.letterspacing | Letter spacing + autokern | CONTEXTUAL |
| txt.linespacing | Line spacing | CONTEXTUAL |
| txt.aa | Anti-alias (Bitmap/Animation/Readability/Custom) | CONTEXTUAL |
| txt.selectable | Selectable | CONTEXTUAL |
| txt.embed | Embed Fonts | CONTEXTUAL (dynamic/input) |
| txt.caret | Caret + text selection | CONTEXTUAL (edit mode) |
## C. STATE MAP
| State | Behavior |
|---|---|
| Block selected | block schema |
| Text-edit (caret) | char editing (IME) |
| Static | outlines exported |
| Dynamic | binding field + instance name |
| Input | selectable + max chars |
| Un-embedded (dynamic) | warn badge (F-22-03 L.1) |
| Mobile | system keyboard + IME |
## D. EXIT / ESCAPE / UNDO
Esc exits text-edit (commits); typing coalesced = one undo (F-02-09). Double-click = caret.
## E. SHORTCUTS
T · Ctrl+T font · Ctrl+Shift+T paragraph · Ctrl+←/→ kerning. Mobile: keyboard.
## F. POINTER + TOUCH
Click = place point text; drag = box; double-click = edit; touch: tap + keyboard + drag handles.
## G. BUTTON BLOCKS (exemplar)
**txt.embed** — ID txt.embed · Action `font.embed(glyphSubset)` (command) · Twice-click: reopens subset dialog · No-dynamic-text: HIDDEN-WHEN-UNAVAILABLE.
**txt.aa** — Action `text.setAA(mode)` (one command) · Twice-click: idempotent.
## H. OVERLAYS
Font-embed dialog L5; color popover L3.
## I. ERROR & RECOVERY
Un-embedded export → warn modal (embed/outline/fallback choice, F-22-08). Missing font → fallback + badge.
## J. UI RELIABILITY AUDIT
[x] visible [x] clickable [x] stateful [x] positioned [x] accessible [x] closable (Esc) [x] responsive [x] tested [x] wired [x] undo (coalesced).
```
UI COMPLETE  (C-16)
```
