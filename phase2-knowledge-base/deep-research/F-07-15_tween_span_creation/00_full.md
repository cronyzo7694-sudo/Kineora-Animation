# F-07-15 — TWEEN SPAN CREATION (+ roving keys, remove tween, convert, reverse path)
```
SOURCE BLUEPRINT: Part 07 §7.4.15 · DEEP FEATURE: F-07-15 · STATUS: AUDITED
DEPENDS ON: F-07-06 · FEEDS: Part 09 (tween internals)
```
## A. IDENTITY
1. Official names: Create Motion Tween / Classic Tween / Shape Tween; span ops: Remove Tween, Convert to Frame-by-Frame, Reverse Path, Switch keyframes to roving, Insert Pose. 4. Purpose: convert content into interpolated spans and manage span-level operations. 8. Status: current.

## EVIDENCE
E1 [OFFICIAL] `animation-basics.html`: motion tween converts the layer to a **tween layer** (tween icon); target object = the selected symbol/text; others auto-wrapped. E2 [OFFICIAL] `using-property-keyframes.html`: **Roving property keyframes** = not tied to a specific frame (X/Y/Z spatial only); appear as **round dots** (vs squares) in Motion Editor; set via span context → Motion Path > **Switch keyframes to roving**. E3 [OFFICIAL] same: **Remove Tween** → static frames; **Convert to Frame by Frame Animation**; **Reverse Path** (Motion Path context). E4 [OFFICIAL] `using-property-keyframes.html`: **F6 in a span adds a property key for all property types** (F-07-09 E3). E5 [OFFICIAL] `animation-basics.html`: shape tween = light-green span; classic = blue+arrow; pose = Insert Pose (Part 14).

## D. SEMANTICS
| Op | Result |
|---|---|
| Create Motion Tween | layer→tween layer; span+target+property keys (E1) |
| Create Classic Tween | span between two keyframes (Part 09.2) |
| Create Shape Tween | morph span (Part 09.3) |
| Insert Pose (pose layer) | armature pose key (Part 14) |
| Switch keys to roving | spatial keys float for constant speed (E2) |
| Remove Tween | span→static (E3) |
| Convert to FBF | bake per-frame (E3) |
| Reverse Path | direction reversed (E3) |

## E. STATES
Tween layer: one target per span; no drawing allowed (Part 09). Roving ON: keys move to keep speed constant (E2); appears round in Motion Editor.

## L. LIMITATIONS
L.1 Roving = X/Y/Z only (no rotation/scale) (E2) → ours: document this; allow roving on any 1-D property (P2). L.2 Drawing blocked on tween layers → ours: clear error + suggest new layer. L.3 One target per span → ours: same (matches Animate), plus multi-object tween via nesting.

## M. EDGE CASES
M.1 create motion tween on a shape → auto-wrap to symbol (prompt) · M.2 create on a text → wrap · M.3 remove tween keeps content · M.4 convert-to-FBF loses easing (warn, F-07-13) · M.5 roving on a 2-key span (no-op) · M.6 pose insert on non-pose layer (blocked).

## O/P/Q/R/S/Y
Data: span records (F-07-01 + Part 09 model). Events: `timeline:changed`. Undo: one command per span op. Serialization: span persisted. Mobile: long-press frame → Create Motion/Classic/Shape Tween. Implementation: `createTween(kind)`, `removeTween`, `convertToFBF`, `reversePath`, `setRoving(span, on)`.

## TESTS
TS-01 motion tween converts layer (E1) · TS-02 non-symbol auto-wraps (prompt) · TS-03 roving = round dots (E2) · TS-04 remove tween → static (E3) · TS-05 convert to FBF (E3) · TS-06 reverse path (E3) · TS-07 F6 all-prop key (E4) · TS-08 draw on tween layer blocked · TS-09 classic/shape span creation · TS-10 insert pose · TS-11 undo · TS-12 mobile.
## AUDITS
No contradiction. Self-challenge: overlooked = roving (round vs square, X/Y/Z only, E2) + auto-wrap + tween-layer drawing block — covered.
```
FEATURE COMPLETE: F-07-15 — Tween span creation — AUDITED
```
