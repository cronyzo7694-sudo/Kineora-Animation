# F-03-18 — SELECTION + TIMELINE/KEYFRAME INTERACTION
```
SOURCE BLUEPRINT: Part 03 §3.10 · DEEP FEATURE: F-03-18 · STATUS: AUDITED
DEPENDS ON: F-03-02/08 · FEEDS: Parts 07–09
```
## A. IDENTITY
1. Official name: (selection scope across frames). 4. Purpose: define how the selection behaves as the playhead moves and how it interacts with keyframes/tweens. 8. Status: current.

## EVIDENCE
E1 [OFFICIAL] Click a frame selects its layer's content between keyframes (F-03-08 E1). E2 [INFERENCE] Selection is **frame-scoped**: an object selected at frame N exists only if present at the current frame; scrubbing past its span drops it (F-03-02 M.18). E3 [OFFICIAL] Tween targets are selectable; editing them creates property keyframes (Part 09). E4 [OFFICIAL] Select All excludes non-current-timeline layers (F-03-07 E1).

## D. BEHAVIOR MATRIX
| Frame type | Selection at that frame |
|---|---|
| Keyframe (content) | content selectable |
| Blank keyframe | nothing to select |
| Held frame | held content selectable (same as keyframe's content) |
| Motion tween span | target instance selectable (per-frame transform) |
| Classic/shape tween | interpolated content selectable (computed) |
| IK pose | bones/armature selectable |

## E. KEYFRAME INTERACTION
- Selecting a tween target then editing a property at the playhead = **property keyframe** write (Part 09).
- Selecting a classic-tween intermediate frame's content → editing inserts a keyframe there (Part 09.2).
- Selecting a keyframe's content (click keyframe) vs selecting the frame (timeline) = two domains (F-03-02).

## L. LIMITATIONS
L.1 Selection drops when object vanishes (scrub) → ours: remember & restore if it reappears (F-03-02 L.4). L.2 Editing tween intermediates can surprise-key → ours: toast "keyframe inserted at frame N".

## M. EDGE CASES
M.1 scrub past span (drop) · M.2 object reappears (restore, ours) · M.3 select tween target mid-span · M.4 select held-frame content (= keyframe content) · M.5 select during playback (live frame) · M.6 blank keyframe (nothing).

## O/P/Q/R/S/Y
Data: selection targets + frame scope; `selection:lost` on vanish. Events: `selection:lost` (E2). Undo: editing = commands. Serialization: selection not persisted; the edit (new keyframe) IS. Mobile: scrub + long-press menus (Part 31). Implementation: on playhead move, validate targets against current frame; drop invalid; optional restore-on-reappear.

## TESTS
TS-01 scrub past span → drop · TS-02 restore on reappear (ours) · TS-03 tween target edit → property key · TS-04 classic intermediate edit → inserts key · TS-05 held frame = keyframe content · TS-06 blank keyframe nothing · TS-07 playback live-frame select · TS-08 two-domain selection independence · TS-09 toast on auto-key (ours) · TS-10 undo of key-insert.

## AUDITS
No contradiction. Self-challenge: overlooked = frame-scoped validation + tween-target property-key writes + drop/restore — covered. Version stable.
```
FEATURE COMPLETE: F-03-18 — Selection + timeline/keyframe interaction — AUDITED
```
