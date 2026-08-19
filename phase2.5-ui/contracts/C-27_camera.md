# UI CONTRACT: C-27 — CAMERA UI
```
SOURCE:  Phase-2 F-16-01..07, F-02-31
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Camera tool (C) / Add Camera button (timeline) + camera Properties + Layer Depth panel + Cmd+K.
## B. VISIBLE CONTROLS
| ID | Control | State |
|---|---|---|
| cam.tool | Camera tool | FUNCTIONAL |
| cam.add | Add Camera | FUNCTIONAL |
| cam.pan | Pan (drag) | CONTEXTUAL (camera) |
| cam.zoom | Zoom (Shift+drag / slider) | CONTEXTUAL |
| cam.rotate | Rotate (Ctrl+drag / slider) | CONTEXTUAL |
| cam.reset | Reset (per property) | CONTEXTUAL |
| cam.fields | x/y/z/zoom/rotation + tint/filters | CONTEXTUAL |
| cam.attach | Attach-to-camera (per layer) | CONTEXTUAL |
| cam.depth | Layer Depth panel (z-depth) | CONTEXTUAL |
| cam.preset | Camera presets (push/pull/pan/shake/truck) | CONTEXTUAL (ours) |
## C. STATE MAP
| State | Behavior |
|---|---|
| Camera enabled | camera layer + border + overlay |
| Camera layer deleted | camera disabled |
| Attached layers | pinned (HUD) |
| Parallax | z-depth per layer |
| Mode chip | "Camera mode" + Esc exits |
| Mobile | one-finger pan / pinch zoom / twist rotate |
## D. EXIT / ESCAPE / UNDO
Esc exits camera tool; camera keys = one command (F-16).
## E. SHORTCUTS
C · Shift+drag zoom · Ctrl+drag rotate. Mobile: gestures.
## F. POINTER + TOUCH
Drag pan; Shift+drag zoom; Ctrl+drag rotate; slider; attach dot click.
## G. BUTTON BLOCKS (exemplar)
**cam.preset.pushin** — ID cam.preset.pushin · Action `camera.preset('push-in')` (writes keys, one command) · Twice-click: merges (idempotent) · No-camera: DISABLED.
## H. OVERLAYS
Camera border + zoom/rotate slider L1; depth panel (dockable).
## I. ERROR & RECOVERY
Camera-vs-view-zoom confusion → distinct border + badge. HUD layer drifting → attach suggestion toast.
## J. AUDIT
[x] visible [x] clickable [x] stateful [x] positioned [x] accessible [x] closable (Esc) [x] responsive [x] tested [x] wired [x] undo.
```
UI COMPLETE  (C-27)
```
