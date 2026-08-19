# F-11-09 — INSTANCE PROPERTIES (color effect, filters, loop, name)
```
SOURCE BLUEPRINT: Part 11 §11.5 · DEEP FEATURE: F-11-09 · STATUS: AUDITED
DEPENDS ON: F-11-01 · FEEDS: F-09-02 (filter tween), F-26-05 (panel)
```
## A. IDENTITY
1. Official name: (instance properties). 4. Purpose: per-instance transform, color effect, filters, loop, and instance name — separate from the symbol definition. 8. Status: current.

## EVIDENCE
E1 [OFFICIAL] `symbol-instances.html`: each instance has its own properties separate from the symbol: **tint, transparency, brightness**; redefine behavior (graphic↔movie clip); loop/first-frame (graphic); instance name (button/movie clip); **skew/rotate/scale** without affecting the symbol. E2 [OFFICIAL] same: **color effect** modes (brightness/tint/alpha/advanced). E3 [OFFICIAL] Part 26: **filters** per instance (drop shadow/blur/glow/bevel/gradient glow/gradient bevel/adjust color). E4 [OFFICIAL] `symbol-instances.html`: location x/y = **registration point** coords; Info panel shows RGB(A) if solid fill.

## F. INSTANCE PROPERTY TABLE
| Property | Per-instance | Tweenable |
|---|---|---|
| transform (x/y/scale/rotation/skew) | yes | yes (motion) |
| color effect (brightness/tint/alpha/advanced) | yes | yes (alpha/tint/brightness) |
| filters | yes | yes (per-param) |
| loop mode + firstFrame (graphic) | yes | discrete (swap) |
| instance name | yes | no |
| symbol type (graphic/mc/button) | redefinable (E1) | no |

## E. STATES
Instance ≠ definition (F-11-01); changing symbol type redefines behavior (E1).

## L. LIMITATIONS
L.1 Alpha hidden in Color Effect dropdown → ours: top-level opacity slider (W6, carried). L.2 Filters are per-instance only (not per-symbol) → ours: optional "apply to all instances" (P2).

## M. EDGE CASES
M.1 tint 100% = solid recolor · M.2 advanced mode (RGB offsets) · M.3 filter on a graphic (tweenable in motion) · M.4 redefine graphic→movie clip (E1).

## O/P/Q/R/S/Y
Data: instance record (Part 33 §33.7). Events: `document:changed`. Undo: one command per property commit (coalesced). Serialization: persisted. Mobile: Properties sheet. Implementation: Instance node carries `colorEffect`, `filters[]`, `loop`, `instanceName`.

## TESTS
TS-01 instance transform ≠ definition (E1) · TS-02 tint/brightness/alpha · TS-03 advanced mode · TS-04 filter add/param · TS-05 filter tween (motion) · TS-06 loop modes (graphic) · TS-07 instance name · TS-08 redefine type (E1) · TS-09 alpha slider (ours) · TS-10 undo · TS-11 reload.
## AUDITS
No contradiction. Self-challenge: overlooked = redefine-type (E1) + alpha-hidden-dropdown (W6) + registration-point x/y (E4) — covered.
```
FEATURE COMPLETE: F-11-09 — Instance properties — AUDITED
```
