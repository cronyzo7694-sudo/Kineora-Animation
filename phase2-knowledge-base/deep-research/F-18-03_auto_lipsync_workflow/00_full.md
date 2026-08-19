# F-18-03 — AUTO LIP-SYNC WORKFLOW · F-18-04 — ANALYSIS
```
SOURCE BLUEPRINT: Part 18 §18.3–18.4 · DEEP FEATURES: F-18-03, F-18-04 · STATUS: AUDITED
DEPENDS ON: F-18-01/02, F-17 (stream audio)
```
## F-18-03 AUTO LIP-SYNC WORKFLOW
1. Official name: Auto Lip-Sync (Lip Syncing button). 4. Purpose: analyze audio → auto-place viseme keyframes. 8. Status: current (added 2018–2019, Adobe Sensei-assisted).
EVIDENCE
E1 [OFFICIAL] `symbol-instances.html`: select mouth graphic → Properties → **Lip Syncing** → Create lip syncing dialog (**12 default visemes**) → map each viseme to a mouth-pose frame → choose the **audio layer** → **Sync** → keyframes created matching visemes. E2 [OFFICIAL] same: "Auto lip syncing works best with Audio sync setting set to **Stream**"; applies on the frame span where the symbol is present; can pre-select a frame range. E3 [COMMUNITY] UDESCO: workflow steps (mouth symbol → audio layer → select symbol → Lip Syncing → map visemes → choose audio → done → keyframes auto-created).
SEMANTICS (steps)
```
mouth symbol (viseme frames) → import audio (Stream) → place mouth over span
→ select mouth → Lip Syncing → map 12 visemes → pick audio layer → Sync
→ keyframes auto-written (instance firstFrame per viseme)
→ Ctrl+Enter preview
```
LIMITATIONS: L.1 Stream required (E2) → ours: warn if Event. L.2 one audio layer per sync → ours: batch multi-char (F-18-06.9). L.3 viseme mapping manual (12 clicks) → ours: default dictionary + override.
EDGE: M.1 sync over a frame range (E2) · M.2 mouth span shorter than audio (applies only on span) · M.3 re-sync overwrites (undo).
TESTS: TS-01 lip syncing dialog (E1) · TS-02 map viseme → frame · TS-03 choose audio + sync · TS-04 keyframes written · TS-05 stream-required warn (E2) · TS-06 range-scoped (E2) · TS-07 undo (one command).

## F-18-04 ANALYSIS
1. Official name: (speech analysis). 4. Purpose: the phoneme/viseme detection pipeline. 8. Status: current (behavior); internals = our design.
EVIDENCE
E1 [OFFICIAL] `symbol-instances.html`: "after analyzing the specified audio layer… key-frames created matching the audio visemes." E2 [BLUEPRINT Part 18.4] our pipeline.
SEMANTICS (pipeline)
```
audio → VAD (silence threshold) → phoneme recognition [{phoneme,startMs,endMs,confidence}]
→ viseme dictionary → [{viseme,startFrame,endFrame,confidence}]
→ merge same-viseme runs → sub-frame collisions (longest wins)
→ write keyframes {frame, firstFrame=visemePose}
```
LIMITATIONS: L.1 recognizer quality language-dependent → ours: pluggable + confidence display (F-18-06.3). L.2 sub-frame collisions → longest wins.
EDGE: M.1 silence gaps → rest · M.2 fast speech (many visemes/few frames) · M.3 low-confidence segments.
TESTS: TS-01 VAD silence → rest · TS-02 phoneme → viseme · TS-03 merge runs · TS-04 collision longest-wins · TS-05 confidence computed · TS-06 deterministic.
## AUDITS (both)
No contradiction. Self-challenge: overlooked = Stream-required (E2) + range-scoped + longest-wins collision + confidence — covered.
```
FEATURE COMPLETE: F-18-03/04 — Auto lip-sync workflow & analysis — AUDITED
```
