# UI CONTRACT: C-28 — AUDIO UI
```
SOURCE:  Phase-2 F-17-01..09
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Import audio → Library → drag onto keyframe · frame Properties Sound section · Cmd+K.
## B. VISIBLE CONTROLS
| ID | Control | State |
|---|---|---|
| aud.import | Import audio | FUNCTIONAL |
| aud.attach | Sound (asset dropdown) | CONTEXTUAL (keyframe) |
| aud.sync | Sync (Event/Start/Stop/Stream) | CONTEXTUAL |
| aud.loop | Loop count / timeline loop button | CONTEXTUAL |
| aud.trim | Trim in/out | CONTEXTUAL |
| aud.volume | Volume + envelope | CONTEXTUAL |
| aud.effect | Effect (fades/channel) | CONTEXTUAL |
| aud.waveform | Waveform (scrub) | CONTEXTUAL (sound) |
| aud.mute | Mute | FUNCTIONAL |
## C. STATE MAP
| State | Behavior |
|---|---|
| Sound attached | waveform across frames |
| Stream | frame-synced; drop-anim warning |
| Event | plays out; Start = no overlap |
| Scrubbing | plays at position (toggle) |
| Mobile | waveform tap/scrub; sheet |
## D. EXIT / ESCAPE / UNDO
Esc closes envelope editor; sound attach/sync/trim = one command.
## E. SHORTCUTS
(assignable) mute. Mobile: sheet.
## F. POINTER + TOUCH
Drag waveform = move start; scrub playhead; drag trim handles; drag envelope points.
## G. BUTTON BLOCKS (exemplar)
**aud.attach** — ID aud.attach · Action `sound.attach(assetId)` (command) · Twice-click: reopens dropdown · No-keyframe: DISABLED.
## H. OVERLAYS
Envelope editor popover L3; sound context menu L4.
## I. ERROR & RECOVERY
Lip-sync with Event (not Stream) → warn (F-18-03). GIF/sequence export → silent-audio warn (F-17-08).
## J. AUDIT
[x] visible [x] clickable [x] stateful [x] positioned [x] accessible [x] closable [x] responsive [x] tested [x] wired [x] undo.
```
UI COMPLETE  (C-28)
```
