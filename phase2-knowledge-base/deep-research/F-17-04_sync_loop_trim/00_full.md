# F-17-04 — SYNC MENU · F-17-05 — LOOP · F-17-06 — TRIM/VOLUME/ENVELOPE
```
SOURCE BLUEPRINT: Part 17 §17.3–17.4 · DEEP FEATURES: F-17-04/05/06 · STATUS: AUDITED
DEPENDS ON: F-17-01/03
```
## F-17-04 SYNC MENU
1. Official name: Sync (Event/Start/Stop/Stream). 4. Purpose: per-keyframe playback behavior. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `using-sounds.html`: **Event** (plays fully, can overlap); **Start** (like Event, but **if the same sound is already playing, no new instance**); **Stop** (silences the specified sound at that keyframe); **Stream** (frame-synced). E2 [OFFICIAL] same: "To synchronize a sound with animation, you start and stop the sound at keyframes"; create an end keyframe → select same sound → Sync=Stop.
SEMANTICS (matrix)
| Sync | Behavior |
|---|---|
| Event | start at key; full play; overlaps allowed |
| Start | start at key; no overlap of same sound |
| Stop | silence specified sound at key (E2) |
| Stream | frame-synced; bounded by span |
LIMITATIONS: L.1 Event overlap surprise → Start as default for sfx (ours). L.2 Stop needs the SAME sound selected (E2) → ours: stop-by-assetId cleaner.
EDGE: M.1 two events overlapping · M.2 start when already playing (no new) · M.3 stop a stream mid-span.
TESTS: TS-01 event starts · TS-02 start no-overlap (E1) · TS-03 stop silences (E2) · TS-04 stream sync · TS-05 sync remembered in Properties (E-using-sounds note).

## F-17-05 LOOP
1. Official name: Loop. 4. Purpose: repeat a sound (count or continuous). 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `using-sounds.html`: loop sound on timeline — repeat a small section continuously over frames; **Audio Looping button on the timeline**; loop within a frame range. E2 [BLUEPRINT Part 17.3]: loop count (0 = none, N = repeat).
SEMANTICS: event loop = repeat until stop; stream loop = repeat within span (E1); timeline loop button = range loop.
LIMITATIONS: L.1 loop count vs continuous distinction → ours: count field + continuous toggle.
EDGE: M.1 loop a trimmed slice · M.2 stream loop shorter than span.
TESTS: TS-01 loop count · TS-02 continuous · TS-03 timeline loop button (E1) · TS-04 stream range loop.

## F-17-06 TRIM / VOLUME / ENVELOPE
1. Official name: (sound editing). 4. Purpose: in/out points, volume, fades. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `using-sounds.html` (F-17 blueprint): Effect menu — Left/Right channel, Fade L→R / R→L, Fade In/Out, Custom. E2 [BLUEPRINT Part 17.4]: trim in/out; volume %; custom envelope (draggable points, ours).
SEMANTICS
| Control | Behavior |
|---|---|
| Trim in/out | play only a slice |
| Effect | channel + fade presets (E1) |
| Volume | per-sound % |
| Envelope | volume curve over duration (ours: drawn over waveform) |
LIMITATIONS: L.1 Animate envelope = modal editor → ours: inline draggable points on waveform. L.2 trim non-destructive (asset intact).
EDGE: M.1 trim then loop · M.2 envelope + fade preset conflict (envelope wins, ours).
TESTS: TS-01 trim in/out · TS-02 fade in/out (E1) · TS-03 channel effects · TS-04 volume % · TS-05 custom envelope (ours) · TS-06 undo.
## AUDITS (all three)
No contradiction. Self-challenge: overlooked = start-no-overlap (E1) + stop-needs-same-sound (E2) + inline-envelope (ours) — covered.
```
FEATURE COMPLETE: F-17-04/05/06 — Sync, loop, trim/volume/envelope — AUDITED
```
