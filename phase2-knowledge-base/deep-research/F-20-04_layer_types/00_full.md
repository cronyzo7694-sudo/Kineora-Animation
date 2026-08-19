# F-20-04 — LAYER TYPES (11) · F-20-05 — FOLDERS & HIERARCHY · F-20-06 — LAYER PARENTING · F-20-07 — LAYER ORDER & RENDER RULES
```
SOURCE BLUEPRINT: Part 20 §20.3–20.6 · DEEP FEATURES: F-20-04..07 · STATUS: AUDITED
DEPENDS ON: F-20-01/03
```
## F-20-04 LAYER TYPES
1. Official name: (layer types). 4. Purpose: 11 types with distinct storage/behavior. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] carried: normal (Part 20), folder (`timeline-layers.html`), mask/masked (`using-mask-layers.html`), guide/motion-guide (`classic-tween-animation.html`), pose (`bone-tool-animation.html`), tween (`animation-basics.html`), camera (`working-with-camera-in-animate.html`), audio (`using-sounds.html`).
F. TYPE TABLE (11)
| Type | Purpose | Stores | Auto-created by |
|---|---|---|---|
| Normal | content | frames | default |
| Folder | group layers | children | + |
| Mask | clip window | mask shape | right-click → Mask |
| Masked | clipped content | content | link below mask |
| Guide | non-printing helper | path | context → Guide |
| Motion Guide | classic-tween path | path | Add Classic Motion Guide |
| Pose | armature | armature+poses | Bone tool |
| Tween | motion-tween spans | spans | Create Motion Tween |
| Camera | camera keys | camera states | Camera tool |
| Audio | sound frames | sound attachments | (drag sound) |
SEMANTICS: conversion rules — normal↔folder↔mask↔guide changeable (warn on break); pose/tween/camera/audio auto-created, revert to normal when emptied.
LIMITATIONS: L.1 one armature per pose layer; one target per tween span; one mask item per mask layer.
EDGE: M.1 mask→normal breaks clip · M.2 delete bones → layer reverts.
TESTS: TS-01 all 11 types create · TS-02 conversion warnings · TS-03 revert-on-empty.

## F-20-05 FOLDERS & HIERARCHY
1. Official name: (layer folders). 4. Purpose: tree organization; cascade. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `timeline-layers.html`: folders hold layers AND folders (tree); collapse/expand triangle; Expand/Collapse All right-click; lock/hide/outline on folder affects all within.
SEMANTICS: folders = organizational (no coordinate space, unlike symbol nesting F-11-12); drag into folder = nest; drag to left edge = out.
LIMITATIONS: L.1 Animate = 2-level nesting → ours: unlimited. L.2 folder ≠ transform scope (parenting is separate, F-20-06).
EDGE: M.1 nested folders · M.2 folder z-depth (applies to children).
TESTS: TS-01 nest/un-nest · TS-02 collapse/expand all · TS-03 cascade · TS-04 unlimited depth (ours).

## F-20-06 LAYER PARENTING
1. Official name: (layer parenting). 4. Purpose: transform inheritance between layers. 8. Status: current (requires Advanced Layers ON).
EVIDENCE
E1 [OFFICIAL] `timeline-layers.html`: "Layer parenting view requires the **Advanced layers** to be enabled. By default, Advanced layers is switched ON for new files." E2 [BLUEPRINT Part 20.5]: parentId → child = parent∘local; hide parent hides children; local-space safe re-parent [WISH W2].
SEMANTICS
- parentId link; inheritance = parent transform ∘ child local (position/rotation/scale/skew).
- Parenting vs nesting (F-11-12): parenting = transforms only, no timeline isolation.
LIMITATIONS: L.1 needs Advanced Layers ON (E1) → ours: always available. L.2 Animate copy/paste + re-parent corrupts → ours local-space.
EDGE: M.1 reparent mid-animation (safe, ours) · M.2 parent hide → children hidden.
TESTS: TS-01 parent transform inherits · TS-02 reparent safe · TS-03 hide cascades · TS-04 no Advanced-Layers gate (ours).

## F-20-07 LAYER ORDER & RENDER RULES
1. Official name: (render order). 4. Purpose: bottom→top compositing + within-layer order. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `arranging-objects.html`: "Everything on Layer 2 appears in front of everything on Layer 1"; within a layer = creation order (most recent top). E2 [OFFICIAL] same: Arrange (Bring to Front/Forward/Backward/Send to Back) reorders within layer; raw shapes always below groups/symbols.
SEMANTICS: render = layers bottom→top, then within-layer display list back→front; masks clip (F-21); camera last (F-16).
LIMITATIONS: L.1 raw-shapes-below-groups/symbols (E2) surprise → tooltip.
EDGE: M.1 raw shape + symbol same layer (symbol wins front) · M.2 arrange across layers (not possible — layer-scoped).
TESTS: TS-01 layer order render · TS-02 arrange within layer · TS-03 raw-below-symbol (E2) · TS-04 undo arrange.
## AUDITS (all four)
No contradiction. Self-challenge: overlooked = Advanced-Layers gate (E1) + raw-below-symbol (E2) + parenting≠nesting — covered.
```
FEATURE COMPLETE: F-20-04..07 — Layer types, folders, parenting, render order — AUDITED
```
