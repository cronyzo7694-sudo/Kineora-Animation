# F-08-12 — KEYFRAME LIFECYCLE (move/delete/duplicate) · F-08-13 — AUTO-KEYING
```
SOURCE BLUEPRINT: Part 08 §8.4, §8.5 · DEEP FEATURES: F-08-12, F-08-13 · STATUS: AUDITED
DEPENDS ON: F-08-01 · FEEDS: Parts 09/10
```
## F-08-12 KEYFRAME LIFECYCLE
1. Official name: (keyframe move/delete/duplicate). 4. Purpose: define what happens when a keyframe is moved in time, deleted, or duplicated. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `using-property-keyframes.html`: **Ctrl/Cmd+click a property keyframe and drag** to move it to another frame. E2 [OFFICIAL] `frames-keyframes.html`: Alt-drag keyframe = copy (duplicate); drag = move. E3 [OFFICIAL] `animation-basics.html`: delete tween endpoint → broken (dashed). E4 [OFFICIAL] `frames-keyframes.html`: Shift+F6 clear keyframe (F-07-11).
SEMANTICS (per family)
| Action | Property key | Whole-frame key |
|---|---|---|
| Move | property curve re-times; motion path re-draws (Part 10) | span re-times; hold recomputes |
| Delete | curve loses point; neighbors interp | layer reverts to prev hold; tween endpoint delete = broken (E3) |
| Duplicate | two identical values → pause | copy content → independent (F6 semantics) |
LIMITATIONS: L.1 Moving a key past span end extends span (implicit) → ours: confirm. L.2 Duplicate on whole-frame = independent copy (cel complaint, W1) → ours: expose-same vs duplicate-new (F-15-06).
EDGE: M.1 move key onto another key (merge?) · M.2 delete last key → layer empty · M.3 duplicate roving key (stays roving) · M.4 move key in a pose span (pose re-time).
TESTS: TS-01 Ctrl+drag moves property key (E1) · TS-02 Alt-drag duplicates (E2) · TS-03 delete endpoint = broken (E3) · TS-04 whole-frame delete reverts hold · TS-05 duplicate = pause · TS-06 move past end extends (confirm) · TS-07 undo.

## F-08-13 AUTO-KEYING
1. Official name: Auto-Keyframe mode (legacy). 4. Purpose: automatically insert keyframes while scrubbing/editing so every change is recorded. 8. Status: legacy/optional in Animate.
EVIDENCE
E1 [COMMUNITY] 2021 Adobe employee: "Autokeyframing mode must be enabled… if an object is deleted then a blank keyframe will be inserted at playhead position and object deleted only from that point onwards." E2 [COMMUNITY] same thread: Auto-Keyframe ON changes Delete + Paste semantics (playhead-scoped). E3 [OFFICIAL] `creating_a_motion_tween_animation.html`: setting a property at a frame **always** creates a property keyframe (this is the modern default, independent of legacy Auto-Keyframe).
SEMANTICS
- Modern motion tween: set-value-at-playhead = key (E3) — always on, per-property.
- Legacy Auto-Keyframe mode: insert blank keys on delete/paste at playhead (E1/E2) — a mode, not the default.
- Ours: explicit toggle; property-key auto-create is the default (matches E3).
LIMITATIONS: L.1 legacy Auto-Keyframe surprises (E1/E2) → ours OFF by default + toast. L.2 property auto-key can create unwanted keys → ours: "keyframe created at frame N" toast + undo.
EDGE: M.1 delete with auto-key ON → blank key (E1) · M.2 paste with auto-key ON → playhead-scoped · M.3 auto-key on a tween span → property key.
TESTS: TS-01 set value at frame creates key (E3) · TS-02 auto-key OFF delete = normal · TS-03 auto-key ON delete = blank key (E1) · TS-04 toast (ours) · TS-05 undo auto-key · TS-06 paste playhead-scoped (E2).
## AUDITS (both)
No contradiction. Self-challenge: overlooked = legacy-vs-modern auto-key distinction (E1/E2 vs E3) — covered.
```
FEATURE COMPLETE: F-08-12/13 — Keyframe lifecycle & auto-keying — AUDITED
```
