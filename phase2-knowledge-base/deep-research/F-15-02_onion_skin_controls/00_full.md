# F-15-02 — ONION SKIN CONTROLS · F-15-03 — ONION SKIN BEHAVIOR & IMPLEMENTATION
```
SOURCE BLUEPRINT: Part 15 §15.2 · DEEP FEATURES: F-15-02, F-15-03 · STATUS: AUDITED
DEPENDS ON: F-07-03 (markers), F-07-05 (render)
```
## F-15-02 ONION SKIN CONTROLS
1. Official name: Onion skinning (Onion Skin button + options). 4. Purpose: ghost neighboring frames to draw in-betweens. 8. Status: current.

## EVIDENCE
E1 [OFFICIAL] `frame-by-frame-animation.html` (2026): current frame = full color; prev/future = tinted; **default color tints**; customize via **Advance Settings** (hold Onion Skin button → Advance Settings). E2 [OFFICIAL] (2021): **Starting opacity slider** (per side) + **Decrease by slider** (% drop per frame); **outline and fill mode**; color = Preferences → **Onion Skin Color** (Past/Present/Future swatches); right-click an onion frame in the header = exclude/include. E3 [OFFICIAL] (2026): drag marker pointer to move; **Control/Command+drag = both sides**; **Edit Multiple Frames** button; **Shift+drag = move the loop range**; anchor markers. E4 [SECONDARY] Activity-9: default markers = **±2 frames** around playhead; dimmer with distance; markers move with playhead. E5 [COMMUNITY] onion outline mode via hold-button → Advanced menu (or layer outline mode).

## C. CONTROLS (complete)
| Control | Behavior |
|---|---|
| Onion Skin button | toggle (E1) |
| Onion Skin Outlines | ghosts as outlines only |
| Edit Multiple Frames | edit ALL frames between markers (E3) |
| Modify Onion Markers | range options (always show / anchor / 2 / 5 / all) |
| Start/End markers (header) | drag = move; Ctrl/Cmd+drag = both sides (E3) |
| Shift+drag markers | move loop range (E3) |
| Anchor markers | lock range (doesn't follow playhead) (E3) |
| Right-click onion frame | exclude/include that frame (E2) |
| Advance Settings (hold button) | opacity (starting + decrease-by), outline/fill, colors (E1/E2) |
| Onion Skin Color (Preferences) | Past/Present/Future tint (E2) |
| Hover the span | plays as colored outlines (preview) (E2) |

## E. STATES
| State | Behavior |
|---|---|
| Onion ON | ±2 frames ghosted (default, E4) |
| Markers moved | custom range |
| Anchored | range fixed while playhead moves (E3) |
| Edit Multiple Frames | ghosts editable |
| Outline mode | paths only (E2/E5) |
| Frame excluded | right-click toggle (E2) |

## F-15-03 BEHAVIOR & IMPLEMENTATION
- Ghosts = **not editable** (except Edit Multiple Frames), **never export** (blueprint).
- Only keyframe drawings ghost (held frames show same content).
- Past = one tint, future = another, current = full color (E1); opacity falls off per frame (decrease-by, E2).
IMPLEMENTATION (ours)
- Ghost pass rendered **under** the current frame; per-frame cached bitmaps (invalidate on edit); outline mode = stroke-only pass; opacity slider maps to alpha; exclude-list = per-frame skip flags.
- Performance: cache per frame; tint via compositing (no re-rasterize); budget 60fps.
LIMITATIONS: L.1 default ±2 fixed → ours: configurable default range. L.2 excluded frames lost on reload → ours: persist exclude set (P2). L.3 edit-multiple-frames risky on heavy scenes → ours: layer-scoped edit-multiple.
EDGE: M.1 markers at doc start (clamp inward, E4) · M.2 onion across a tween (shows computed frames) · M.3 anchored range while scrubbing · M.4 exclude all → no ghosts.
TESTS: TS-01 toggle ghosts (E1) · TS-02 ±2 default (E4) · TS-03 tint past/future (E2) · TS-04 opacity slider (E2) · TS-05 decrease-by (E2) · TS-06 outline mode (E5) · TS-07 edit multiple (E3) · TS-08 marker drag + ctrl-both (E3) · TS-09 anchor (E3) · TS-10 exclude frame (E2) · TS-11 ghosts not exported · TS-12 hover preview (E2) · TS-13 perf cached.
## AUDITS (both)
No contradiction. Self-challenge: overlooked = decrease-by-slider (E2) + ctrl-both-markers (E3) + right-click-exclude (E2) + hover-preview (E2) — covered.
```
FEATURE COMPLETE: F-15-02/03 — Onion skin controls & implementation — AUDITED
```
