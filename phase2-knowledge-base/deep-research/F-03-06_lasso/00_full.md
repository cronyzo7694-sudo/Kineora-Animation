# F-03-06 — LASSO SELECTION (+ POLYGON MODE, + MAGIC WAND)

```
SOURCE BLUEPRINT:  Part 03 — Selection System  (animate-blueprint/03_selection_system.md §3.3.4)
DEEP FEATURE:      Lasso selection (freeform) + Polygon mode + Magic Wand
QUEUE ID:          F-03-06
STATUS:            FULLY RESEARCHED → AUDITED
DEPENDS ON:        F-03-01 Hit testing · F-03-05 Marquee (contact rules shared)
FEEDS:             F-02-07 (Lasso tool full spec) · F-03-10 (sub-object)
```

## A. IDENTITY
| Field | Value |
|---|---|
| 1. Official name | Lasso tool; sub-modes **Polygon Mode** and **Magic Wand**. |
| 2. Alternate names | Freeform selection, lasso select. |
| 3. Historical names | Same since Flash. |
| 4. Purpose | Select an **irregular area**: freehand loop (Lasso), straight-edge polygon (Polygon), or same-color bitmap region (Magic Wand). |
| 5. Category | Selection subsystem. |
| 6. Related | F-03-05 (marquee = rectangular sibling), F-02-07 (tool), F-03-01 (hit). |
| 7. Dependencies | Contact-sensitivity pref (same as marquee, E3), bitmap break-apart (wand). |
| 8. Status | **Current.** Magic Wand = bitmap-only (broken-apart). |

## EVIDENCE REGISTER
| # | Claim | Status |
|---|---|---|
| E1 | Lasso = freeform loop; release auto-closes the loop (straight line back to start). | [OFFICIAL] `selecting-objects.html` |
| E2 | Polygon mode = click to drop vertices; **double-click** closes. | [OFFICIAL] same |
| E3 | Mixed freehand+straight: **Alt/Option+click** sets straight segment endpoints while lassoing. | [OFFICIAL] same |
| E4 | Lasso honors **contact-sensitivity** (enclosed vs touched) for drawing objects. | [OFFICIAL] same |
| E5 | Lasso selects **raw-shape areas/regions** (partial selection; move splits). | [OFFICIAL] same ("select the inner circle… drag around it") |
| E6 | **Magic Wand** selects **same/similar adjacent colors in a broken-apart bitmap**. | [OFFICIAL] `imported-bitmaps.html` |
| E7 | Wand **Threshold 1–200**; **0 = exact same color only**; higher = broader colors. | [OFFICIAL] same |
| E8 | Wand **Smoothing**: Pixels / Rough / Normal / Smooth (edge anti-aliasing). | [OFFICIAL] same + [SECONDARY] |
| E9 | Wand requires the bitmap to be **broken apart** first (Break Apart → becomes a shape fill). | [OFFICIAL] + [SECONDARY] |
| E10 | **Wand bug:** does not select on a **flipped** (broken-apart) bitmap; workaround: un-flip, or convert to symbol → flip → edit inside. | [COMMUNITY REPORT] 2021 (Adobe employee involved) |

## B. UI LOCATION
```
Tools panel → Lasso (L) → flyout: Polygon Mode | Magic Wand | Magic Wand Properties
Magic Wand Properties → Threshold (1–200), Smoothing (Pixels/Rough/Normal/Smooth)
Preferences → General → Contact-Sensitive Selection and Lasso tools   [shared E3/E4]
```

## C. CONTROLS (Magic Wand properties)
| # | Field | Value |
|---|---|---|
| 19. Name | Threshold | Smoothing |
| 20. Purpose | color-match breadth (E7) | edge smoothness (E8) |
| 24. Default | [UNCERTAIN] (commonly ~20–30) | [UNCERTAIN] (commonly Normal) |
| 25. Allowed | 0–200 (0 = exact match) | Pixels / Rough / Normal / Smooth |
| 26–28. Min/Max/Step | 0 / 200 / 1 | — |
| 36. Visibility | only while Magic Wand active, bitmap broken apart | same |

## D. INTERACTIONS
| Action | Result |
|---|---|
| Freehand drag (Lasso) | loop traced; release closes; area selected per contact pref (objects) / region (raw shapes) |
| Click vertices (Polygon) | straight-edge polygon; double-click closes |
| Alt+click during freehand | straight segment to the next click (E3) |
| Wand click on broken bitmap | flood-select adjacent colors within threshold (E6/E7) |
| Wand on un-broken bitmap | **nothing** (must break apart first, E9) |

## E. STATES
| State | Behavior |
|---|---|
| Nothing selected | AVAILABLE |
| Selection exists | replaces (Shift = add, F-03-04) |
| Contact OFF | objects need full enclosure (E4) |
| Raw shapes | region select regardless (E5, same as marquee F-03-05 L.1) |
| Bitmap not broken apart | Magic Wand DISABLED (E9) |
| Flipped broken bitmap | Magic Wand **broken** (E10 bug) |
| Locked/hidden | skipped |

## F. OBJECT COMPATIBILITY
| Type | Lasso/Polygon | Magic Wand |
|---|---|---|
| Raw shape | region select | n/a |
| Drawing object/group/instance/text | whole (enclosed/touched per pref) | n/a |
| Broken-apart bitmap | region (shape) select | **color region** (E6) |
| Un-broken bitmap | whole (enclosed/touched) | **no effect** (E9) |
| Bone/warp pin | whole (per pref) | n/a |
| Camera/audio/scene | n/a | n/a |

## L. LIMITATIONS
| # | Limitation | Trigger | Actual | Severity | Source | Preserve? | Better (ours) |
|---|---|---|---|---|---|---|---|
| L.1 | Wand needs Break Apart first | wand on bitmap | nothing | Medium | [OFFICIAL] E9 | Preserve (explicit) | auto-prompt "Break Apart to use Wand?" |
| L.2 | Wand fails on flipped bitmap | flipped + wand | no selection | Medium | [COMMUNITY] E10 | Fix | implement wand in **local bitmap space** (flip-independent) |
| L.3 | Wand threshold is global per-tool | per-image tuning | one value for all | Low | [OFFICIAL] | Preserve | per-selection threshold chip (P2) |
| L.4 | Lasso loop auto-closes with straight line | sloppy loop | straight-line fill of gap | Low | [OFFICIAL] E1 | Preserve | preview the closing line during drag |

## M. EDGE CASES
M.1 tiny loop (< threshold) → treated as click; M.2 self-intersecting loop → winding rule (F-03-01); M.3 loop fully off-stage → pasteboard selection; M.4 wand on 1-pixel region → 1-px selection; M.5 wand threshold 0 on anti-aliased edge → speckled; M.6 wand after flip (E10); M.7 wand on gradient bitmap → color-banding selection; M.8 Alt+click straight segments mid-lasso (E3); M.9 polygon double-click-to-close too early; M.10 wand during playback → live frame; M.11 shift+wand = additive; M.12 undo = none (selection), follow-up move/delete = one command.

## O. DATA MODEL · P. EVENTS · Q. UNDO · R. SERIALIZATION
- Produces same `selection` structure as marquee (F-03-05 O); wand additionally stores the **click seed + threshold + smoothing** in temp interaction state.
- Events: `selection:preview` (lasso trace), `selection:changed` (close/wand).
- Undo: lasso/wand selection = view state (no undo); follow-up command = one entry; commands capture prevSelection.
- Serialization: threshold/smoothing = app prefs; selection not persisted.

## S. MOBILE · T. STYLUS
- Lasso = one-finger freehand trace; Polygon = tap-per-vertex, double-tap close; Wand = tap a color; threshold/smoothing sliders always visible (Options).
- Stylus: lasso trace = mouse-identical; wand tap = 1-px precision.

## U. ACCESSIBILITY · V. PERFORMANCE
- Keyboard-less: wand via tap; polygon via tap; announced "N pixels selected".
- Wand = flood-fill BFS (F-03-01 V) on the broken bitmap's raster; lasso = point-in-polygon against spatial index.

## W. WORKFLOWS
W.1 Clean a scan: import → Break Apart → Wand (threshold 30, Smoothing Normal) click background → Delete → line art remains (then Trace Bitmap if needed).
W.2 Cut an organic shape: Lasso around it → drag → region splits off (E5).
W.3 Straight-edge region: Polygon mode → click vertices → double-click close.

## X. ALTERNATIVES
Select-by-color region: Wand (fast, bitmap-only) vs Lasso freehand (any shape) vs marquee (rectangular). Wand = fastest for flat colors; lasso = any shape; polygon = precise straight cuts.

## Y. IMPLEMENTATION (OURS)
- `LassoTool` with 3 modes; wand = BFS flood-fill on the broken bitmap buffer (per-channel threshold) — **computed in local bitmap space so flips are irrelevant** (fixes E10); lasso/polygon = polygonize pointer path → point-in-polygon against candidates.
- Wand on un-broken bitmap → **prompt to break apart** (L.1 fix).
- Threshold/smoothing as tool options (C table); preview throttled.

## TEST MATRIX
TS-01 freehand selects area (contact ON) · TS-02 contact OFF enclosure · TS-03 raw-shape region select · TS-04 polygon vertices + double-click close · TS-05 Alt+click straight segments · TS-06 wand same-color region · TS-07 threshold 0 exact match · TS-08 threshold 200 broad · TS-09 wand on un-broken → no-op/prompt · TS-10 wand on flipped bitmap (ours: works) · TS-11 shift+wand additive · TS-12 undo none/follow-up one · TS-13 mobile trace/tap-close/tap-wand · TS-14 stylus · TS-15 perf flood-fill < 50 ms on 4K bitmap · TS-16 self-intersecting loop (winding) · TS-17 off-stage loop · TS-18 wand during playback.

## AUDITS (summary)
**Contradiction:** none unresolved. Wand-threshold default [UNCERTAIN] (docs give range, not default). **Completeness:** all categories complete; wand-on-flip is the key discovered gap (E10) → fixed in ours. **Self-challenge:** overlooked = break-apart prerequisite (E9) + flip bug (E10) + winding on self-intersecting loops — all covered. **Version:** wand unchanged since Flash; smoothing options stable.

```
FEATURE COMPLETE: F-03-06 — Lasso selection (+ Polygon, + Magic Wand) — AUDITED
```
