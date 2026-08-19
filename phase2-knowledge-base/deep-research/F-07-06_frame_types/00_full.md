# F-07-06 — FRAME TYPES (every kind of cell)
```
SOURCE BLUEPRINT: Part 07 §7.2 · DEEP FEATURE: F-07-06 · STATUS: AUDITED
DEPENDS ON: F-07-01/05
```
## A. IDENTITY
1. Official name: (frame types). 4. Purpose: enumerate every kind of frame a timeline cell can be, with its storage + semantics. 8. Status: current.

## EVIDENCE (all [OFFICIAL] unless noted)
E1 `time.html`: keyframe = frame where a new symbol instance appears or ActionScript is added. E2 `time.html`: **blank keyframe** = placeholder for symbols to add later, or explicit blank. E3 `time.html`: keyframe sequence = keyframe + following regular frames. E4 `time.html`: frames after content keyframe gray; after content-less white. E5 `frames-keyframes.html`: **static frame span** (same content for duration) vs **tweened frame span** (content changes per frame). E6 `animation-basics.html`: tween span types (motion/classic/shape/pose) + labels + actions (F-07-05 E5–E8). E7 [COMMUNITY] "Remove Frames" (Shift+F5) vs "Clear Keyframe" (Shift+F6) vs "Delete Frame" distinctions (F-07-11/12).

## F. FRAME TYPE TABLE (storage + semantics)
| Type | Stored? | Content at that frame | Created by |
|---|---|---|---|
| Keyframe (content) | YES | authored content | F6 / draw on keyframe |
| Blank keyframe | YES (as blank) | empty (explicit) | F7 |
| Held/static frame | NO (derived) | repeats nearest keyframe | F5 (extends span) |
| Empty frame | NO | nothing | (default gap) |
| Frame span (static) | NO (derived extent) | same content (E5) | keyframe + held frames |
| Motion tween span | YES (span + property keys) | interpolated (Part 09) | Insert > Motion Tween |
| Classic tween span | YES (flag between keys) | interpolated | Insert > Classic Tween |
| Shape tween span | YES (flag) | morphed | Insert > Shape Tween |
| IK pose span | YES (poses) | armature pose | Insert Pose (Part 14) |
| Frame with action | YES (on keyframe) | content + script | Actions panel |
| Frame with label | YES (on keyframe) | content + label | Properties > Label |

## E. STATES
A single frame can be **multiple things simultaneously**: a motion-tween property keyframe (diamond) that also has a label (flag) and is the current frame (highlight). Overlay rules: type glyph + label flag + action "a" + selection + playhead.

## L. LIMITATIONS
L.1 Sparse derivation means "empty" vs "held" look identical if the hold has no content (white both) → ours: subtle pattern to distinguish held-empty from never-had-keyframe (P2). L.2 Frames can't hold two targets (one target per tween span, Part 09).

## M. EDGE CASES
M.1 blank keyframe mid-hold breaks the hold · M.2 keyframe at frame 1 (default) · M.3 label+action+keyframe combined · M.4 tween span followed by static frames · M.5 pose span with one pose (holds).

## O/P/Q/R/S/Y
Data: `frames[]` sparse records (F-07-01 O); type = discriminator. Events: `timeline:changed` on type change. Undo: type conversions (F6/F7/clear) = commands. Serialization: stored frames persisted; derived cells not. Mobile: long-press frame → type ops menu. Implementation: `FrameRecord` union type; `evaluate` dispatches per type.

## TESTS
TS-01 keyframe stores content · TS-02 blank stores empty-explicit · TS-03 held derives from nearest keyframe · TS-04 empty gap derives nothing · TS-05 static span = same content (E5) · TS-06 tween span = sampled · TS-07 action/label persist on keyframe · TS-08 combined glyphs · TS-09 blank breaks hold · TS-10 undo F6/F7 · TS-11 reload identical.
## AUDITS
No contradiction. Self-challenge: overlooked = combined states + blank-breaks-hold + one-target-per-span — covered.
```
FEATURE COMPLETE: F-07-06 — Frame types — AUDITED
```
