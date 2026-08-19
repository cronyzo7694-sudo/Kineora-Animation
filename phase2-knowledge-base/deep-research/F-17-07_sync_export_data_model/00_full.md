# F-17-07 — TIMELINE SYNCHRONIZATION · F-17-08 — EXPORT SYNC · F-17-09 — AUDIO DATA MODEL
```
SOURCE BLUEPRINT: Part 17 §17.5–17.7 · DEEP FEATURES: F-17-07/08/09 · STATUS: AUDITED
DEPENDS ON: F-17-01/03/04
```
## F-17-07 TIMELINE SYNCHRONIZATION
1. Official name: (audio-timeline sync). 4. Purpose: the frame↔time rules + scrubbing. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `using-sounds.html`: "To play back the sound, drag the playhead in the Timeline" (scrub plays sound). E2 [OFFICIAL] same: stream = frame-synced (drop anim frames); event = triggered at keyframe. E3 [BLUEPRINT Part 17.5]: fps remap — `sound frames = ceil(duration × fps)`; changing fps re-maps waveform.
SEMANTICS
- Sound starts at its keyframe; stream bounded by span; stop-key ends early.
- Scrub plays stream (and event in ours) audio; mute toggle.
- fps change → waveform extent recomputes (E3).
LIMITATIONS: L.1 scrub-audio CPU-heavy → ours: toggle. L.2 event scrub in Animate = limited → ours: full scrub-audio.
EDGE: M.1 fps change mid-project · M.2 scrub over loop boundary · M.3 mute during playback.
TESTS: TS-01 scrub plays (E1) · TS-02 fps remap (E3) · TS-03 mute · TS-04 stream bounded · TS-05 event scrub (ours).

## F-17-08 EXPORT SYNC
1. Official name: (audio export). 4. Purpose: keep A/V sync per target. 8. Status: current.
EVIDENCE
E1 [BLUEPRINT Part 17.6]: video = mux sample-exact per frame; HTML = audio asset + startAt/loop/sync metadata; GIF/sequence = silent (warn).
SEMANTICS (matrix)
| Target | Audio |
|---|---|
| Video (MP4/MOV) | muxed, frame-accurate |
| HTML5/Web | asset + runtime sync metadata |
| GIF | none (warn) |
| PNG sequence | none (sidecar WAV, ours) |
| Project | assets + refs (lossless) |
LIMITATIONS: L.1 GIF silent → warn. L.2 sequence no audio → sidecar option (ours).
EDGE: M.1 trimmed/looped export sync · M.2 stream export (frame drop on web).
TESTS: TS-01 video mux sync · TS-02 HTML metadata · TS-03 GIF warn · TS-04 sequence sidecar (ours) · TS-05 project round-trip.

## F-17-09 AUDIO DATA MODEL
EVIDENCE: [BLUEPRINT Part 17.7] (our design).
O. MODEL
```jsonc
// asset
{ "type":"sound","id":"s_voice01","name":"voice01","durationMs":4200,"sampleRate":44100,"channels":1,"dataRef":"assets/voice01.mp3" }
// keyframe attachment
{ "type":"keyframe","sound":{ "assetId":"s_voice01","sync":"stream|event|start|stop","loop":0,
  "trimStartMs":0,"trimEndMs":4200,"volume":1.0,"envelope":[{t:0,v:1},{t:1,v:1}] } }
```
DOCUMENT vs VIEW: asset + attachment = document; playhead/scrub/mute = view.
TESTS: TS-01 asset round-trip · TS-02 attachment (sync/loop/trim/envelope) · TS-03 reload identical · TS-04 dataRef indirection.
## AUDITS (all three)
No contradiction. Self-challenge: overlooked = fps-remap (E3) + scrub-plays (E1) + GIF-silent-warn + sample-exact mux — covered.
```
FEATURE COMPLETE: F-17-07/08/09 — Timeline sync, export sync, audio data model — AUDITED
```
