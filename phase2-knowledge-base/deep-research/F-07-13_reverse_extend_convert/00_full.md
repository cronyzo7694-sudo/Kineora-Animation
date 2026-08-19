# F-07-13 — REVERSE / EXTEND / SHORTEN / CONVERT FRAMES
```
SOURCE BLUEPRINT: Part 07 §7.4.10–7.4.12 · DEEP FEATURE: F-07-13 · STATUS: AUDITED
DEPENDS ON: F-07-07/09/12
```
## A. IDENTITY
1. Official names: Reverse Frames; span-edge extend/shorten; Convert to Keyframes / Blank Keyframes; (span) Remove Tween / Convert to Frame-by-Frame. 4. Purpose: reorder keyframes, resize spans, and bake tweens into frame-by-frame. 8. Status: current.

## EVIDENCE
E1 [COMMUNITY] Reverse Frames (right-click selected range) = mirror animation (duplicate → reverse → paste). E2 [OFFICIAL] `using-property-keyframes.html`: **Remove Tween** (span context) → static frames; **Convert to Frame by Frame Animation** (span context) → baked per-frame keys. E3 [OFFICIAL] same: **Reverse Path** (Motion Path context) reverses tween direction. E4 [OFFICIAL] `frames-keyframes.html`: extend/shorten via F5/Shift+F5; span-edge drag (blueprint). E5 [OFFICIAL] `time.html`: keyframe sequence = keyframe + following frames (the unit you extend/shorten).

## D. SEMANTICS
| Op | Result |
|---|---|
| Reverse Frames | reorders selected keyframes end→start (E1) |
| Extend (F5 / edge drag) | +held frames |
| Shorten (Shift+F5 / edge drag) | −held frames |
| Convert to Keyframes | every selected frame → keyframe (bake) |
| Convert to Blank Keyframes | every selected frame → blank key |
| Remove Tween (span) | span → static frames (E2) |
| Convert to Frame-by-Frame (span) | tween → per-frame keys (E2) |
| Reverse Path (motion span) | tween direction reversed (E3) |

## E. STATES
Reverse works on keyframe sequences (tweens must be converted first — E1 workflow). Extend/shorten on tween spans = span resize (all keys scale proportionally, Part 09).

## L. LIMITATIONS
L.1 Reverse doesn't reverse tweens (must convert first, E1) → ours: "Reverse Frames (bake tweens?)" prompt. L.2 Convert-to-FBF loses easing (baked) → warn. L.3 No "reverse path" for classic tween (motion-span only, E3) → ours: reverse frames covers it.

## M. EDGE CASES
M.1 reverse a single keyframe = no-op · M.2 convert empty frames → blank keys · M.3 shorten below 1 frame · M.4 remove tween then re-tween · M.5 reverse path keeps easing (E3).

## O/P/Q/R/S/Y
Data: frame order / span extents / span→keys conversion. Events: `timeline:changed`. Undo: one command per op. Serialization: persisted. Mobile: long-press span → Remove Tween/Convert/Reverse. Implementation: `reverseFrames(range)`, `bakeSpanToKeys(span)`, `removeTween(span)`, `reversePath(span)`.

## TESTS
TS-01 reverse keyframes = mirror (E1) · TS-02 remove tween → static (E2) · TS-03 convert to FBF → per-frame keys (E2) · TS-04 reverse path (E3) · TS-05 extend/shorten span · TS-06 convert empties → blank keys · TS-07 reverse no-op single · TS-08 undo each · TS-09 easing lost on bake (warn) · TS-10 mobile menu.
## AUDITS
No contradiction. Self-challenge: overlooked = reverse-needs-bake (E1) + remove-tween vs convert-to-FBF (E2) + reverse-path (E3) — covered.
```
FEATURE COMPLETE: F-07-13 — Reverse/Extend/Shorten/Convert frames — AUDITED
```
