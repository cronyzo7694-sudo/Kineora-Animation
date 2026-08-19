# F-19-01 — FACIAL RIG CONSTRUCTION · F-19-02 — BLINK SYSTEM · F-19-03 — EYE DIRECTION SYSTEM
```
SOURCE BLUEPRINT: Part 19 §19.0–19.2 · DEEP FEATURES: F-19-01/02/03 · STATUS: AUDITED
DEPENDS ON: F-13 (rig), F-11 (nesting), F-18 (mouth)
```
## F-19-01 FACIAL RIG CONSTRUCTION
1. Official name: (facial rig). 4. Purpose: nest eyes/brows/mouth/head as symbols; each subsystem has its own timeline. 8. Status: current.
EVIDENCE
E1 [BLUEPRINT Part 19.0] the tree:
```
head (MC) ├─ face base ├─ eye_L/R (MC: sclera, eyelid, pupil) ├─ brow_L/R └─ mouth (graphic visemes)
```
E2 [OFFICIAL] F-11-12 nesting (graphic sync / clip free); graphics for parent-driven poses, clips for self-looping.
SEMANTICS: each face part = symbol; one pose per frame (parent-driven via Frame Picker) OR movie clip with own loop (blink).
LIMITATIONS: L.1 nesting depth perf → leaf cache. L.2 part registration shifts → snap to face anchor.
EDGE: M.1 mouth inside jaw (open poses) · M.2 brows above eyes z-order.
TESTS: TS-01 face tree builds · TS-02 part pivots · TS-03 z-order (brows>eyes>mouth) · TS-04 nesting playback.

## F-19-02 BLINK SYSTEM
1. Official name: (blink). 4. Purpose: eyelid animation — timeline-triggered or auto. 8. Status: current (timeline); auto = ours.
EVIDENCE
E1 [BLUEPRINT Part 19.1]: eyelid MC frames open→half→closed→half→open (3-frame on 2s ≈ 6 frames); timeline keyframe triggers; auto-blink = ours (random 2–6 s, avoids speech).
SEMANTICS
- Timeline trigger: keyframe starts the eyelid clip.
- Auto-blink (ours): parameter min/max interval; avoid lip-sync frames.
- Timing: 6–10 frames; close faster than open; every 2–6 s.
DATA: `blink:{eyelidSymbolId, mode:auto|timeline, minIntervalMs, maxIntervalMs, avoidSpeech}`
LIMITATIONS: L.1 manual blinks tedious → auto (ours). L.2 blinking mid-line (mistake) → avoid-speech (ours).
EDGE: M.1 blink during a word (avoid) · M.2 random interval distribution.
TESTS: TS-01 eyelid 3-pose · TS-02 timeline trigger · TS-03 auto interval · TS-04 avoids speech · TS-05 undo.

## F-19-03 EYE DIRECTION SYSTEM
1. Official name: (eye direction / gaze). 4. Purpose: pupil movement + gaze poses + blink-on-change. 8. Status: current.
EVIDENCE
E1 [BLUEPRINT Part 19.2]: pupil symbol inside eye; gaze poses (lookLeft/Right/Up/Down/center) as graphic frames; pupil offset tween; blink on direction change (ours, P2).
SEMANTICS
- Gaze = swap pose OR pupil-offset tween.
- Both eyes driven together (gaze controller).
- Blink on gaze change (subtle realism).
DATA: `gaze:{current, pupilOffset:{x,y}, blinkOnChange}`
LIMITATIONS: L.1 pupil out-of-sclera (clamp) → ours: bounds clamp.
EDGE: M.1 gaze change mid-blink · M.2 both-eyes sync.
TESTS: TS-01 gaze poses · TS-02 pupil tween · TS-03 both-eyes sync · TS-04 clamp bounds · TS-05 blink-on-change.
## AUDITS (all three)
No contradiction. Self-challenge: overlooked = eyelid-3-pose-6-frame timing + avoid-speech-blink + gaze-both-eyes-sync — covered.
```
FEATURE COMPLETE: F-19-01/02/03 — Facial rig, blink, eye direction — AUDITED
```
