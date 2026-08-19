# F-08-01 — KEYFRAME DATA MODEL
```
SOURCE BLUEPRINT: Part 08 §8.1 · DEEP FEATURE: F-08-01 · STATUS: AUDITED
DEPENDS ON: F-07-01/06 · FEEDS: F-08-02..13, Part 09
```
## A. IDENTITY
1. Official name: keyframe / property keyframe. 4. Purpose: the authored truth at a moment — whole-frame (content) or per-property (a single value). 8. Status: current.

## EVIDENCE
E1 [OFFICIAL] `animation-basics.html`: **property keyframes = black diamonds**; frames where you explicitly define property values; **display filter** via span context → View Keyframes > type; **all types displayed by default**. E2 [OFFICIAL] `time.html`: keyframe = new symbol instance / code frame; blank keyframe = placeholder. E3 [OFFICIAL] `time.html`: black dot = single keyframe (whole-frame). E4 [OFFICIAL] `using-property-keyframes.html`: roving = not tied to a frame (X/Y/Z); round dots in Motion Editor. E5 [OFFICIAL] `animation-basics.html`: hollow dot first frame = target removed; span keeps its property keys.

## O. DATA MODEL ([OUR DESIGN DECISION] internals)
```jsonc
// WHOLE-FRAME keyframe (frame-by-frame / classic endpoints)
{ "frame": 1, "type":"keyframe", "content":[nodeIds], "label":null, "actions":[], "sound":SoundAttachment|null }

// PROPERTY keyframe (inside a motion tween span)
{ "frame": 10, "property":"x|y|scaleX|scaleY|rotation|skewX|skewY|alpha|tint|brightness|filter.X",
  "value": 320, "ease":null, "orientation":null, "rotations":0, "roving":false }
```
### Two families (carried from blueprint Part 08.0)
| | Property keyframe | Whole-frame keyframe |
|---|---|---|
| Lives | inside a tween span, per property | a layer cell |
| Stores | one value | entire content |
| Visual | diamond (E1) | dot (E3) |

### DOCUMENT vs VIEW vs TEMPORARY
- DOCUMENT: keyframe records (both families) + labels/actions/sound.
- VIEW: which property types' keys are displayed (E1 filter); playhead.
- TEMPORARY: none intrinsic.

## P. EVENTS
`timeline:changed` (keyframe add/move/delete) · `keyframe:edited` {layerId, frame, property} (value set).

## Q. UNDO / R. SERIALIZATION
- Keyframe add/move/delete = commands (one per op, F-07). Value set = one command (coalesced during slider drag).
- Serialization: keyframe records persisted (sparse); display filter (E1) = view state (not persisted).

## V. PERFORMANCE
Sparse storage (F-07-01); per-property keys are tiny records; O(log n) lookup per property.

## L. LIMITATIONS
L.1 Diamond-vs-dot confusion (property vs whole-frame, E1/E3) → ours: hover tooltip + legend. L.2 One value per property key (no combined key for x+y) → ours: same (x,y independent keys), matches Animate.

## M. EDGE CASES
M.1 target-removed span keeps keys (E5) · M.2 roving key (frame-agnostic, E4) · M.3 key with label+action+sound combined · M.4 property key at span end (diamond) vs start (dot).

## W. WORKFLOWS
W.1 Inspect a tween's keys: right-click span → View Keyframes > Rotation → only rotation diamonds show (E1).

## Y. IMPLEMENTATION (OURS)
`Keyframe` union type; per-property arrays inside `TweenSpan.properties` (Part 09); whole-frame records in `layer.frames`; display filter = view flag.

## TESTS
TS-01 whole-frame key stores content · TS-02 property key stores one value · TS-03 diamond vs dot (E1/E3) · TS-04 view-filter shows only that type (E1) · TS-05 hollow-dot target-removed (E5) · TS-06 roving key frame-agnostic (E4) · TS-07 label+action+sound combined · TS-08 undo add/move/delete · TS-09 reload identical · TS-10 10k keys lookup fast.
## AUDITS
No contradiction. Self-challenge: overlooked = two-family split + view-filter (E1) + hollow-dot (E5) + roving (E4) — covered.
```
FEATURE COMPLETE: F-08-01 — Keyframe data model — AUDITED
```
