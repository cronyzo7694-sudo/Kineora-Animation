# UI CONTRACT: C-08 — TIMELINE PANEL UI
```
SOURCE:  Phase-2 F-07-01..16, F-03-08/09
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Timeline panel (bottom, ALWAYS-VISIBLE, min-h 96px, max 60% viewport); Cmd+K "Timeline"; mobile = dedicated bottom sheet.
## B. VISIBLE CONTROLS
| ID | Control | State |
|---|---|---|
| tl.layerlist | Layer rows (eye/lock/outline/name/type) | FUNCTIONAL |
| tl.frameruler | Frame ruler + onion markers | FUNCTIONAL |
| tl.playhead | Playhead | FUNCTIONAL |
| tl.cells | Frame cells | FUNCTIONAL |
| tl.addlayer | Add layer (+/folder) | FUNCTIONAL |
| tl.dellayer | Delete layer | FUNCTIONAL |
| tl.play | Play/pause | FUNCTIONAL |
| tl.first/last | Go to first/last | FUNCTIONAL |
| tl.onion | Onion skin (toggle) | FUNCTIONAL |
| tl.onion.outline | Onion outlines | FUNCTIONAL |
| tl.onion.multi | Edit multiple frames | FUNCTIONAL |
| tl.onion.markers | Modify markers | FUNCTIONAL |
| tl.center | Center playhead | FUNCTIONAL |
| tl.loop | Loop playback | FUNCTIONAL |
| tl.attachcam | Attach-to-camera (per layer) | CONTEXTUAL (camera enabled) |
| tl.addcamera | Add camera | FUNCTIONAL |
| tl.hamburger | Timeline menu (span-based etc.) | FUNCTIONAL |
| tl.resize | Resize handle | FUNCTIONAL |
## C. STATE MAP
| State | Behavior |
|---|---|
| Empty (no doc) | skeleton + "New doc" |
| Normal | layers + frames + playhead |
| Playing | playhead advances; frame cells dim to live |
| Frame selection | selected cells highlight; frame ops enabled |
| Span-based ON | one click = span (chip shows mode) |
| Onion ON | ghosts + markers + tint |
| Camera enabled | camera layer + attach dots |
| Mobile | bottom sheet; long-press menus; ruler pinch |
## D. EXIT / ESCAPE / UNDO
Panel collapsible to 96px (never 0); Esc deselects frames; frame ops = one undo each (F-07).
## E. SHORTCUTS
F5/F6/F7 · Shift+F5/F6 · Enter play · Home/End · ./, · Alt+,/. hop · O/Shift+O/Alt+O onion. Mobile: toolbar + long-press.
## F. POINTER + TOUCH
Click cell = select/jump; drag = range; drag playhead = scrub (pointer capture §22); drag span edge = extend; drag layer = reorder. Touch: tap/long-press/drag-scrub/pinch ruler zoom.
## G. BUTTON BLOCKS (exemplar)
**tl.play** — ID tl.play · Action `playback.toggle()` · Twice-click: toggles (pause) · During-op: disabled (render) · No-doc: DISABLED-BY-CONTEXT.
**tl.dellayer** — Action `layer.delete(active)` (command + confirm if dependents) · Twice-click: second = no-op after first removed · No-layer: DISABLED.
## H. OVERLAYS
Frame context menu L4; layer context menu L4; go-to-frame dialog L5.
## I. ERROR & RECOVERY
Delete mask/pose layer with dependents → confirm modal (C-07). Draw on locked/tween layer → toast reason. Broken tween → dashed + tooltip why.
## J. UI RELIABILITY AUDIT
[x] visible (min 96px) [x] clickable [x] stateful (C matrix) [x] positioned (never covers stage >60%) [x] accessible [x] closable/collapsible+reopen [x] responsive (sheet) [x] tested (no-overlap, min-clamp) [x] wired [x] undo per op.
```
UI COMPLETE  (C-08)
```
