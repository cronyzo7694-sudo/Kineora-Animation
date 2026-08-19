# UI CONTRACT: C-29 — LIP SYNC UI
```
SOURCE:  Phase-2 F-18-01..07
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Select mouth graphic → Properties → Lip Syncing · Frame Picker (manual) · Cmd+K.
## B. VISIBLE CONTROLS
| ID | Control | State |
|---|---|---|
| lip.syncbtn | Lip Syncing button | CONTEXTUAL (graphic + audio) |
| lip.visememap | 12-viseme mapping (click viseme → pick frame) | CONTEXTUAL (dialog) |
| lip.audiolayer | Audio layer dropdown | CONTEXTUAL |
| lip.sync | Sync (run) | CONTEXTUAL |
| lip.progress | Analysis progress + cancel | CONTEXTUAL (running) |
| lip.phonemelane | Phoneme lane (colored blocks) | CONTEXTUAL (result) |
| lip.confidence | Confidence highlight | CONTEXTUAL |
| lip.drag | Drag phoneme boundary (re-time) | CONTEXTUAL |
| lip.leadlag | Lead/lag offset | CONTEXTUAL |
| lip.framepicker | Frame Picker (per-key correct) | CONTEXTUAL |
| lip.regenerate | Re-run | CONTEXTUAL |
## C. STATE MAP
| State | Behavior |
|---|---|
| Idle | lip-syncing button |
| Dialog | 12 visemes + mapping |
| Analyzing | spinner + progress + cancel (never frozen) |
| Result | phoneme lane + keyframes written |
| Manual correction | frame picker + drag |
| Error | no-audio / no-mouth → message + recovery |
| Mobile | sheet dialog + frame picker |
## D. EXIT / ESCAPE / UNDO
Esc cancels dialog/analysis; auto-pass = ONE undoable command; manual edits = commands.
## E. SHORTCUTS
Ctrl+Enter preview. Mobile: sheet.
## F. POINTER + TOUCH
Click viseme → pick frame; drag boundaries; tap phoneme block → jump.
## G. BUTTON BLOCKS (exemplar)
**lip.sync** — ID lip.sync · Action `lipSync.run()` (one command) · Twice-click: disabled while running (loading) · No-audio: DISABLED + reason.
**lip.regenerate** — Action re-runs (undo replaces previous pass).
## H. OVERLAYS
Lip Sync dialog L5; Frame Picker L3; phoneme lane L1 (timeline overlay).
## I. ERROR & RECOVERY
Event-sync audio → warn + suggest Stream. Analysis fails → toast + retry/cancel. Partial result → keep editable lane.
## J. AUDIT
[x] visible [x] clickable [x] stateful [x] positioned [x] accessible [x] closable (Esc/cancel) [x] responsive [x] tested [x] wired [x] undo (one pass).
```
UI COMPLETE  (C-29)
```
