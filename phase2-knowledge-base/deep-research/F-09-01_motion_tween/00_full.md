# F-09-01 — MOTION TWEEN
```
SOURCE BLUEPRINT: Part 09 §9.1 · DEEP FEATURE: F-09-01 · STATUS: AUDITED
DEPENDS ON: F-07-15 (span creation), F-08-01/02/03/04/05
FEEDS: F-09-02 (property matrix), F-10-* (motion path), F-09-08 (graph editor)
```
## A. IDENTITY
1. Official name: Motion tween (modern tween). 4. Purpose: interpolate a **symbol/text target's properties** over a **span** with **per-property keyframes** and an editable motion path. 8. Status: current (the default modern tween).

## EVIDENCE
E1 [OFFICIAL] `animation-basics.html`: motion tween = contiguous span (blue), selectable as a single object; black dot = target assigned; black diamonds = property keyframes; hollow dot first frame = target removed (span keeps its keys). E2 [OFFICIAL] `creating_a_motion_tween_animation.html`: tween target = **one object per span**; non-symbol objects are wrapped in a symbol; setting a value at a frame creates a property keyframe. E3 [OFFICIAL] same: span can be dragged to another layer; paste/swap a new instance onto the span re-targets. E4 [OFFICIAL] `animation-basics.html`: layer converts to a **tween layer** (tween icon); tween layer can't be drawn on. E5 [COMMUNITY] motion tween applies a property to the **entire span** (unlike classic tween) — rotation starts at span start; workaround = **SPLIT MOTION** (right-click a frame → Split Motion). E6 [OFFICIAL] `adding-custom-eases.html`: Ease slider (hot text) per span + Motion Editor custom eases per property. E7 [OFFICIAL] `editing_the_motion_path…html`: motion path with dots; editable via Selection/Subselection/Free Transform; move/delete/copy path; apply custom stroke as path; Reverse Path.

## D. SEMANTICS
| Aspect | Rule |
|---|---|
| Target | ONE object per span (E2); non-symbol → auto-wrap (prompt) |
| Span | the unit: select/drag/stretch/copy as one (E1) |
| Property keys | per-property, independent frames (F-08-01); set-value-at-playhead = key |
| Motion path | derived from x/y keys (Part 10); editable (E7) |
| Rotation | property key + orientation (F-08-04); applies over the whole span unless split (E5) |
| Layer | tween layer; no drawing (E4) |
| Target removed | hollow dot; keys preserved; re-target by paste/swap (E1/E3) |

## E. STATES
| State | Behavior |
|---|---|
| Span selected | drag/stretch/copy as one (E1) |
| Target removed | hollow dot (E1) |
| Playhead on non-key frame | set value → key created (E2) |
| Playhead on key | set → update |
| Property applied | affects ENTIRE span from its keys (E5) |

## L. LIMITATIONS
L.1 Property affects whole span (E5) → users must **Split Motion** to scope a property to a sub-range. Ours: keep Split Motion + offer per-segment ease (graph editor). L.2 One target per span (E2) → nest symbols for multi-part. L.3 Tween layer blocks drawing (E4) → clear error + suggest new layer. L.4 Auto-wrap to symbol is silent → ours: prompt "convert to symbol to tween?"

## M. EDGE CASES
M.1 target deleted → hollow dot (E1) · M.2 swap target onto span → keys re-applied (E3) · M.3 split motion at a frame → two spans · M.4 stretch span scales all keys · M.5 drag span to another layer (E3) · M.6 roving position keys (F-08-03) · M.7 tween a text → wrapped symbol.

## O/P/Q/R
Data: `TweenSpan { kind:'motion', targetId, start, duration, properties:{...} }` (F-08-01 + Part 33). Events: `timeline:changed`. Undo: span create/split/stretch/swap = commands. Serialization: span + keys persisted.

## S. MOBILE
Long-press frame → Create Motion Tween; drag object at a frame → key auto-created; path edit via tap/drag; Split Motion via long-press frame.

## W. WORKFLOWS
W.1 Basic: draw → F8 symbol → Insert Motion Tween → move playhead → drag object → key → tween. W.2 Scope rotation: create tween → right-click the start frame of rotation → **Split Motion** → rotate in the new sub-span (E5).

## Y. IMPLEMENTATION (OURS)
`MotionTweenSpan` with per-property key arrays; `setPropertyAt()` (F-08-03); `splitMotion(frame)` → two spans sharing target; `stretchSpan(factor)` scales key frames; motion-path derivation (Part 10). All ops = Commands.

## TESTS
TS-01 create span + target · TS-02 non-symbol wraps (prompt) · TS-03 set value → key · TS-04 property spans whole span (E5) · TS-05 split motion scopes (E5) · TS-06 hollow dot target-removed (E1) · TS-07 swap re-target (E3) · TS-08 stretch scales keys · TS-09 drag to layer · TS-10 tween layer blocks drawing (E4) · TS-11 roving keys · TS-12 undo each op · TS-13 mobile create/key · TS-14 reload identical.
## AUDITS
No contradiction (E5 is community + consistent with docs). Self-challenge: overlooked = whole-span property semantics + Split Motion (E5) + target-removed hollow dot (E1) + auto-wrap — covered.
```
FEATURE COMPLETE: F-09-01 — Motion tween — AUDITED
```
