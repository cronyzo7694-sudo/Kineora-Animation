# F-21-01 — MASK vs MASKED · F-21-02 — CLIPPING RULES · F-21-03 — ANIMATED MASKS
```
SOURCE BLUEPRINT: Part 21 §21.0–21.3 · DEEP FEATURES: F-21-01/02/03 · STATUS: AUDITED
DEPENDS ON: F-20-04 · FEEDS: F-21-04..06
```
## F-21-01 MASK vs MASKED LAYERS
1. Official name: Mask layer / masked layer. 4. Purpose: a shape that acts as a window revealing the layer(s) below. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `using-mask-layers.html`: mask item = window (reveals linked layers beneath); mask layer = any filled shape/group/text/symbol; **mask layer always masks the layer immediately below**; masked layer indented + icon changes; **lock both to see the effect**. E2 [OFFICIAL] same: mask additional layers = drag below mask / new layer below / Layer Properties → Masked; unlink = drag above mask / Layer Properties → Normal.
SEMANTICS (create workflow)
```
create content layer → new layer above → draw filled shape → right-click mask layer → Mask
→ layer below = masked (indented); lock both to preview (E1)
```
LIMITATIONS: L.1 lock-both-to-preview quirk (E1) → ours: live preview without lock. L.2 one mask item per mask layer (E2).
EDGE: M.1 mask above non-adjacent layer (masks only immediate below + linked) · M.2 unlink via drag above (E2).
TESTS: TS-01 create mask (E1) · TS-02 masked indented · TS-03 link additional (E2) · TS-04 unlink · TS-05 live preview (ours).

## F-21-02 CLIPPING RULES
1. Official name: (mask clipping). 4. Purpose: exact clip semantics. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `using-mask-layers.html`: "Animate **ignores bitmaps, gradients, transparency, colors, and line styles in a mask layer**. Any filled area is completely transparent in the mask; any non-filled area is opaque." E2 [OFFICIAL] same: mask item = filled shape, text, or symbol instance; **mask cannot be inside a button; cannot apply a mask to another mask**; 3D tools can't be used on mask layers.
SEMANTICS
- Only the **fill** (geometry) matters; color/alpha/gradient/bitmap/stroke ignored (E1) — hard-edged clip.
- Content keeps its own colors/effects; mask gates visibility.
- Restrictions: no mask-in-button, no mask-on-mask, no 3D (E2).
LIMITATIONS: L.1 hard-edged only (no soft/alpha in Animate) → ours: alpha mask mode (F-21-05). L.2 mask stroke ignored (E1) → tooltip.
EDGE: M.1 mask with stroke-only (no clip) · M.2 multiple fill windows (union).
TESTS: TS-01 fill-only mask (E1) · TS-02 stroke ignored · TS-03 content keeps colors · TS-04 no mask-in-button (E2) · TS-05 union windows.

## F-21-03 ANIMATED MASKS
1. Official name: (animated mask). 4. Purpose: move/morph/rotate the mask over time. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `using-mask-layers.html`: "Animate a filled shape, type object, or graphic symbol instance on a mask layer" — **shape tween** for a filled shape; **motion tween** for type/graphic/movie clip; unlock → animate → re-lock. E2 [SECONDARY] montilladesign: text mask animation (mask box + tween text = wipe reveal).
SEMANTICS
| Mask kind | Tween |
|---|---|
| Filled shape | shape tween (E1) |
| Type / graphic / movie clip | motion tween (E1) |
| Movie clip mask | animate along a motion path (E1) |
LIMITATIONS: L.1 unlock→animate→re-lock workflow (E1) → ours: animate without lock ceremony.
EDGE: M.1 mask + masked both animate (parallax reveal) · M.2 clip re-evaluated per frame.
TESTS: TS-01 shape-tween mask · TS-02 motion-tween text mask · TS-03 wipe reveal (E2) · TS-04 both-animate.
## AUDITS (all three)
No contradiction. Self-challenge: overlooked = fill-only-ignores-styles (E1) + lock-to-preview + tween-per-mask-kind (E1) — covered.
```
FEATURE COMPLETE: F-21-01/02/03 — Mask layers, clipping rules, animated masks — AUDITED
```
