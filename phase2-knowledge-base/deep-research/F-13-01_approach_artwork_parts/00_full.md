# F-13-01 — APPROACH SELECTION · F-13-02 — ARTWORK PREPARATION · F-13-03 — PARTS → SYMBOLS
```
SOURCE BLUEPRINT: Part 13 §13.0–13.2 · DEEP FEATURES: F-13-01/02/03 · STATUS: AUDITED
DEPENDS ON: F-11-*, F-12-* · FEEDS: F-13-04..12, Part 14
```
## F-13-01 APPROACH SELECTION
1. Official name: (animation approach). 4. Purpose: choose cut-out/puppet vs frame-by-frame vs hybrid per production. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] Adobe walk-cycle guide: "Character rig or artwork: Can be hand-drawn frames, **vector puppets in Adobe Animate** or rigged models." E2 [SECONDARY] Udemy course: dissect into movable parts → symbols → pivot points + classic tween (cut-out); traditional drawing method = in-between frames (frame-by-frame). E3 [BLUEPRINT Part 13.0]: hybrid = cut-out body + hand-drawn accents (industry standard).
SEMANTICS (the 3 approaches)
| Approach | Movement | Rig |
|---|---|---|
| Cut-out/puppet | symbols hinged at joints | hierarchy+pivots (+bones) |
| Frame-by-frame | redraw per frame | drawings+onion skin |
| Hybrid | cut-out body + hand-drawn accents | both |
LIMITATIONS: L.1 cut-out looks rigid → hybrid accents. L.2 frame-by-frame expensive → cut-out for budget.
EDGE: M.1 front vs 3/4 vs profile rigs (E2 — different dissection).
TESTS: TS-01 select approach per project · TS-02 cut-out rig builds · TS-03 hybrid mix · TS-04 front+3/4 rigs coexist.

## F-13-02 ARTWORK PREPARATION
1. Official name: (artwork preparation). 4. Purpose: prepare parts: one per joint, overlap at joints, clean cuts. 8. Status: current.
EVIDENCE
E1 [SECONDARY] flash-powertools "Types of joints": **two overlapping circles** — rotation pivots at circle center, joint never breaks (the standard joint). E2 [SECONDARY] Udemy: draw parts, trace/color, group/convert to symbols. E3 [BLUEPRINT Part 13.1]: overlap at joints (no gaps), front/back ordering.
SEMANTICS
- One part per movable joint (head, torso, upper/lower arm, hand, upper/lower leg, foot, eyes/brows/mouth).
- Overlap at joints (upper arm overlaps torso); clean cuts (object mode / symbols).
- Front/back stacking decided (torso behind arms; one arm front, one back).
LIMITATIONS: L.1 gap-on-rotate if no overlap → ours: joint circles auto-hint (P2). L.2 bitmap parts cut hard to edit → vector preferred.
EDGE: M.1 circular-joint vs pivot-joint (E1) · M.2 arm-front vs arm-back.
TESTS: TS-01 parts cut clean · TS-02 overlap at joints · TS-03 circle joints (E1) · TS-04 ordering set.

## F-13-03 PARTS → SYMBOLS
1. Official name: (convert parts to symbols). 4. Purpose: each part → Library symbol (rig bootstrap). 8. Status: current.
EVIDENCE
E1 [OFFICIAL] F-11-06: F8 convert; registration grid at joint. E2 [OFFICIAL] F-07-14: Distribute to Layers (each object → own layer). E3 [BLUEPRINT Part 13.2]: naming convention `ch_part_side`; movie clip for self-animating parts, graphic for parent-driven (mouth).
SEMANTICS
- Each part → symbol; registration point at joint (F-11-06).
- Distribute to Layers → one layer per part.
- Type: movie clip (independently animating) / graphic (parent-driven, e.g., mouth).
LIMITATIONS: L.1 Animate layer naming = creation order (F-07-14 L.1) → ours: name from part. L.2 registration at joint needs 9-grid or post-move (F-11-06 L.1).
EDGE: M.1 part already a symbol (skip) · M.2 multi-part single symbol (head group).
TESTS: TS-01 each part → symbol · TS-02 registration at joint · TS-03 distribute to layers · TS-04 naming (ours) · TS-05 undo.
## AUDITS (all three)
No contradiction. Self-challenge: overlooked = circle-joint technique (E1) + registration-at-joint + distribute-to-layers bootstrap — covered.
```
FEATURE COMPLETE: F-13-01/02/03 — Approach, artwork, parts→symbols — AUDITED
```
