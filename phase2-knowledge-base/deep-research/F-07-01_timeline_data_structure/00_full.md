# F-07-01 — TIMELINE DATA STRUCTURE
```
SOURCE BLUEPRINT: Part 07 — Timeline (animate-blueprint/07_timeline.md §7.0, §7.3)
DEEP FEATURE:     Timeline data structure (sparse frames, layers, duration, keyframe sequences)
QUEUE ID:         F-07-01 · STATUS: FULLY RESEARCHED → AUDITED
DEPENDS ON:       (none — foundation) · FEEDS: F-07-02..16, F-08-*
```
## A. IDENTITY
1. Official name: Timeline (Adobe doc). 4. Purpose: the clock + score — maps playhead to time and stores the `layer × frame` grid sparsely. 8. Status: current.

## EVIDENCE
E1 [OFFICIAL] `time.html`: layers listed left; frames in rows right; **timeline header** shows frame numbers; **playhead** = current frame on stage. E2 [OFFICIAL] `time.html`: "A keyframe and the span of regular frames that follow it are known as a **keyframe sequence**." E3 [OFFICIAL] `time.html`: frames after a content keyframe appear **gray**; after a content-less keyframe appear **white**. E4 [OFFICIAL] `time.html`: black dot = single keyframe; hollow rectangle at the **last frame of a span**. E5 [OFFICIAL] `frames-keyframes.html`: frame-based selection default; span-based opt-in. E6 [INFERENCE/blueprint] only keyframes + spans are stored; held frames derived (hold rule).

## O. DATA MODEL ([OUR DESIGN DECISION] internals; observable behavior per E1–E5)
```jsonc
"timeline": {
  "layers": [ Layer, ... ],        // bottom→top; render order = index order
  "duration": 120                   // derived: max frame extent
}
"Layer": {
  "id":"L1", "name":"arm", "type":"normal",
  "visible":true, "locked":false, "outline":false, "outlineColor":"#f00",
  "parentId":null, "zDepth":0, "attachedToCamera":false,
  "frames":[ Frame, ... ]           // SPARSE: only keyframes + tween/pose markers
}
```
### Sparse-storage rules
1. **Only keyframes** (whole-frame or property) and **span markers** (tween/pose) are stored.
2. **Held/static frames** = derived: layer at frame `f` shows the nearest keyframe at/before `f` (hold rule).
3. **Keyframe sequence** = a keyframe + the run of regular frames until the next keyframe (E2).
4. `duration` = max(nextKeyframe-1 / last frame) across layers — recomputed on frame ops.

### DOCUMENT vs VIEW vs TEMPORARY
- DOCUMENT: `layers[]` (frames, content, transforms, styles).
- VIEW: `playhead`, `timelineSelection` (F-03-02), ruler zoom/scroll.
- TEMPORARY: drag-preview of frame spans; paste preview.

## P. EVENTS ([OUR DESIGN DECISION])
`timeline:changed` {layerId?, frameRange?} (structure edits: insert/delete/move frames, add layer) · `playhead:moved` {frame, scrubbing} · `layer:changed` {layerId} (flags/name/type) · `timelineSelection:changed` (F-03-02).

## Q. UNDO / R. SERIALIZATION
- Frame/layer structural edits = commands (one per op, Part 07.4). Playhead/selection = view state (no undo).
- Serialization: `layers[]` (sparse) + layer flags persisted; `duration`, playhead, ruler zoom not persisted (derived/view).

## V. PERFORMANCE
Sparse storage ⇒ file size + memory ∝ keyframes, not frames. A 1000-frame held span = 1 keyframe record. `duration` cached, invalidated on frame ops. 10k-layer doc = O(layers) list ops.

## L. LIMITATIONS
L.1 Layer count limited only by memory (E-adjacent [OFFICIAL] timeline-layers). L.2 Layers don't increase SWF size — only objects do [OFFICIAL]. L.3 No per-frame storage (sparse by design) — a frame-by-frame artist's 1000-keyframe layer IS 1000 records (expected).

## M. EDGE CASES
M.1 empty timeline (1 layer, frame 1 blank) · M.2 layer with zero frames · M.3 duration after deleting last frames shrinks · M.4 multiple keyframe sequences per layer · M.5 frame ops on a tween span (different semantics, F-07-15) · M.6 reload → derived frames re-identical (deterministic).

## W. WORKFLOWS
W.1 Inspect: click frame → playhead moves; header shows number; stage shows that frame's content. W.2 Extend: F5 → one more held frame (F-07-08).

## Y. IMPLEMENTATION (OURS)
- `Timeline = { layers, duration }`; layer `frames` = sorted sparse array (keyframes/spans only).
- `evaluate(layerId, frame)`: binary-search nearest keyframe ≤ frame; return its content or tween sample (Part 09).
- Events as P; dirty-region rendering keyed by layer (Part 32).
- All structural ops → Commands with `prevSelection` capture.

## TESTS
TS-01 new doc = 1 layer/frame1 · TS-02 insert keyframe at 10 → 2 records · TS-03 held frames derive identical content · TS-04 duration = max extent · TS-05 delete last frames → duration shrinks · TS-06 reload → identical evaluation · TS-07 1000-frame hold = 1 record (memory) · TS-08 tween span evaluation delegates to TweenEngine · TS-09 playhead move = view only (no undo) · TS-10 10k layers ops responsive.
## AUDITS
No contradiction. Self-challenge: overlooked = sparse-storage invariant + keyframe-sequence concept (E2) + derived duration — covered. Version stable.
```
FEATURE COMPLETE: F-07-01 — Timeline data structure — AUDITED
```
