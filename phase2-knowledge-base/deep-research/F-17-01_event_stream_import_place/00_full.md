# F-17-01 — EVENT vs STREAM · F-17-02 — IMPORT & FORMATS · F-17-03 — PLACEMENT & WAVEFORM
```
SOURCE BLUEPRINT: Part 17 §17.0–17.2 · DEEP FEATURES: F-17-01/02/03 · STATUS: AUDITED
DEPENDS ON: F-07-16 · FEEDS: F-17-04..09, Part 18
```
## F-17-01 EVENT vs STREAM
1. Official name: event sound / stream sound. 4. Purpose: two playback behaviors — the core audio distinction. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `using-sounds.html`: **Event** = must download completely before playing; continues until explicitly stopped. **Stream** = begins as soon as enough data; **synchronized to the Timeline**; "Animate forces animation to keep pace with stream sounds… skips frames"; "stream sound can never play longer than the length of the frames it occupies." E2 [OFFICIAL] same: stream sounds stop when the SWF stops playing.
SEMANTICS (table)
| | Event | Stream |
|---|---|---|
| Starts | after full load | as soon as buffered |
| Timeline | independent (plays out) | frame-synced (drops anim frames) |
| Stops | until explicit stop | with timeline; ≤ span length |
| Use | music/sfx | dialogue (lip-sync) |
LIMITATIONS: L.1 stream drops animation frames (by design) → ours: warn + quality option. L.2 event can overlap (multiple playing) → Start sync handles (F-17-04).
EDGE: M.1 event longer than span (plays out) · M.2 stream shorter span (cut).
TESTS: TS-01 event plays out (E1) · TS-02 stream frame-synced (E1) · TS-03 stream cuts at span end · TS-04 stream stops with timeline (E2).

## F-17-02 IMPORT & FORMATS
1. Official name: (audio import). 4. Purpose: bring audio into the Library. 8. Status: current.
EVIDENCE
E1 [BLUEPRINT Part 17.1]: MP3/WAV/AIFF; ours + OGG/FLAC/M4A; video-with-audio import. E2 [OFFICIAL] Part 27.3: audio → Library sound asset.
SEMANTICS: import → sound asset {id, name, durationMs, sampleRate, channels, dataRef}; waveform preview in Library.
LIMITATIONS: L.1 format coverage (Animate: MP3/WAV/AIFF) → ours: + OGG/FLAC/M4A (cross-platform).
EDGE: M.1 import video audio separately · M.2 long audio memory.
TESTS: TS-01 MP3/WAV import · TS-02 OGG/FLAC (ours) · TS-03 waveform preview · TS-04 video audio extraction.

## F-17-03 PLACEMENT & WAVEFORM
1. Official name: (place audio on timeline). 4. Purpose: attach sound to a keyframe; waveform display. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `using-sounds.html`: "Add a sound from the library to the Timeline" — select a keyframe, choose Sound from Properties (or drag from Library). E2 [OFFICIAL] same: "A representation of the sound file appears in the Timeline" (waveform). E3 [BLUEPRINT Part 17.2]: one sound per layer best practice.
SEMANTICS: sound attaches to a **keyframe**; waveform drawn across following frames (extent = duration × fps); scrub plays at position.
LIMITATIONS: L.1 one sound per keyframe → ours: same + multi-sound mix (P2). L.2 waveform zoom tied to ruler zoom.
EDGE: M.1 sound on a blank keyframe (plays nothing visible) · M.2 waveform across scene end (clamps).
TESTS: TS-01 attach to keyframe (E1) · TS-02 waveform extent (E2) · TS-03 scrub plays · TS-04 fps remap (F-17-07).
## AUDITS (all three)
No contradiction. Self-challenge: overlooked = event-plays-out-vs-stream-cut + sound-on-keyframe + waveform-extent-fps — covered.
```
FEATURE COMPLETE: F-17-01/02/03 — Event/Stream, import, placement — AUDITED
```
