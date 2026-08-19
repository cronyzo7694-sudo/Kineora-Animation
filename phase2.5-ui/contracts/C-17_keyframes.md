# UI CONTRACT: C-17 — KEYFRAME EDITING UI
```
SOURCE:  Phase-2 F-08-01..13
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Timeline frame cells (right-click/long-press) + Insert menu + Properties (label/sound) + Cmd+K.
## B. VISIBLE CONTROLS
| ID | Control | State |
|---|---|---|
| kf.insert | Insert Frame/Keyframe/Blank (F5/F6/F7) | DISABLED-BY-CONTEXT (no doc) |
| kf.delete/clear/remove | Delete/Clear/Remove frames | CONTEXTUAL (frame selected) |
| kf.copy/paste/move | Copy/Cut/Paste/Move/Duplicate frames | CONTEXTUAL |
| kf.reverse | Reverse Frames | CONTEXTUAL (≥2 keyframes) |
| kf.convert | Convert to Keyframes/Blank | CONTEXTUAL |
| kf.label | Frame label (name/comment/anchor) | CONTEXTUAL (keyframe) |
| kf.sound | Sound attachment | CONTEXTUAL (keyframe) |
| kf.viewkeys | View Keyframes > type | CONTEXTUAL (motion span) |
| kf.diamond/dot | Property diamond vs standard dot (hover tooltip) | FUNCTIONAL (visual) |
## C. STATE MAP
| State | Behavior |
|---|---|
| Keyframe selected | label/sound ops enabled |
| Tween span selected | view-keys + F6 all-prop |
| Broken tween | dashed + tooltip why |
| Auto-key ON | toast on auto-insert (F-08-13) |
| Mobile | long-press frame menu |
## D. EXIT / ESCAPE / UNDO
Esc deselects frames; every keyframe op = one command (F-08-12).
## E. SHORTCUTS
F5/F6/F7 · Shift+F5/F6 · Ctrl+C/V frames · Alt+,/. hop. Mobile: menu.
## F. POINTER + TOUCH
Click cell = select; drag = range; Ctrl/Cmd+click = non-contiguous; drag key = move (pointer capture).
## G. BUTTON BLOCKS (exemplar)
**kf.insert.key** — ID kf.insert.key · Action `insertKeyframe()` (one command, copies prev) · Twice-click: second re-copies (no-op-ish, idempotent) · No-doc: DISABLED.
## H. OVERLAYS
Frame context menu L4; label dialog L5.
## I. ERROR & RECOVERY
Keyframe on tween-span with F7 → blocked + reason. Broken tween → tooltip + re-link.
## J. AUDIT
[x] visible [x] clickable [x] stateful [x] positioned [x] accessible [x] closable [x] responsive [x] tested [x] wired [x] undo.
```
UI COMPLETE  (C-17)
```
