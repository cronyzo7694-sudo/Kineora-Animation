# UI CONTRACT: C-31 — EXPORT / PUBLISH UI
```
SOURCE:  Phase-2 F-28-01..11
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
File ▸ Export (Image/GIF/Video/Sequence) · Publish Settings + Publish · Cmd+K.
## B. VISIBLE CONTROLS
| ID | Control | State |
|---|---|---|
| exp.image | Export Image (PNG/JPEG/SVG/WebP) | FUNCTIONAL |
| exp.seq | Export PNG/JPEG sequence | FUNCTIONAL |
| exp.gif | Export Animated GIF | FUNCTIONAL |
| exp.video | Export Video (MP4/WebM) | FUNCTIONAL |
| exp.publish | Publish (HTML5 bundle) | FUNCTIONAL |
| exp.profiles | Publish profiles | FUNCTIONAL |
| exp.settings | Per-format settings (scale/fps/quality/loop/range/palette/audio) | CONTEXTUAL |
| exp.progress | Progress + cancel | CONTEXTUAL (running) |
| exp.output | Output log | FUNCTIONAL |
## C. STATE MAP
| State | Behavior |
|---|---|
| Idle | export entries |
| Settings dialog | per-format options |
| Exporting | progress + cancel (never frozen) |
| Done | toast + open-folder |
| Error | log + retry |
| GIF target | silent-audio warn (F-17-08) |
| Mobile | share sheet |
## D. EXIT / ESCAPE / UNDO
Esc cancels dialog/export; export is non-mutating (no undo needed).
## E. SHORTCUTS
Ctrl+Shift+R (export) · Ctrl+Shift+F12 (publish settings). Mobile: share.
## F. POINTER + TOUCH
Dialog fields; range #First/#Last; progress cancel.
## G. BUTTON BLOCKS (exemplar)
**exp.video** — ID exp.video · Action `export.video()` · Twice-click: disabled while running · No-doc: DISABLED.
**exp.progress.cancel** — Action `export.cancel()` (safe partial discard + log).
## H. OVERLAYS
Settings dialog L5; progress in status bar + panel.
## I. ERROR & RECOVERY
Export fail → log + retry + safe state (autosave). Camera applied identically in all exporters (F-16-07).
## J. AUDIT
[x] visible [x] clickable [x] stateful [x] positioned [x] accessible [x] closable [x] responsive [x] tested [x] wired [x] non-mutating.
```
UI COMPLETE  (C-31)
```
