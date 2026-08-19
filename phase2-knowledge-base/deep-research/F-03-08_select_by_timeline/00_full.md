# F-03-08 — SELECT BY TIMELINE / FRAME

```
SOURCE BLUEPRINT:  Part 03 — Selection System  (animate-blueprint/03_selection_system.md §3.3.6, §3.3.7)
DEEP FEATURE:      Select by timeline / frame (frame-click → stage content; frame multi-select; keyframe hop)
QUEUE ID:          F-03-08
STATUS:            FULLY RESEARCHED → AUDITED
DEPENDS ON:        F-03-02 (dual-domain) · F-03-04 (frame multi-select) · F-03-07 (Select All Frames)
```

## A. IDENTITY
| Field | Value |
|---|---|
| 1. Official name | "Select everything on one layer between keyframes" (Adobe doc phrasing); timeline frame selection. |
| 4. Purpose | Use the timeline to select **stage content scoped by frames/layers**, and to select frames themselves for frame operations. |
| 5. Category | Selection subsystem / timeline-domain selection. |
| 8. Status | Current. |

## EVIDENCE REGISTER
| # | Claim | Status |
|---|---|---|
| E1 | **Click a frame in the Timeline** selects everything on that layer **between keyframes** (stage selection). | [OFFICIAL] `selecting-objects.html` |
| E2 | Frame selection: click = one frame; **drag = contiguous range**; Shift+click = contiguous add; **Ctrl/Cmd+click = non-contiguous**. | [OFFICIAL] `frames-keyframes.html` |
| E3 | **Frame-based selection is the default**; span-based (one click = whole keyframe span) is opt-in via hamburger → Span Based Selection. | [OFFICIAL] same |
| E4 | **Alt+, / Alt+.** = jump to prev/next **keyframe** without selecting content. | [COMMUNITY REPORT] 2018 (Adobe employee) |
| E5 | Selecting a symbol on stage highlights its layer's frames; clicking a frame while the layer is "selected" re-selects the whole span (the coupling quirk). | [COMMUNITY REPORT] 2023 |
| E6 | Double-click the playhead = select entire frame column. | [COMMUNITY REPORT] 2023 (F-03-07 E4) |

## B. UI LOCATION
```
Timeline → frame cells (click / drag / Shift / Ctrl-Cmd)
Timeline → hamburger menu → Span Based Selection   [E3]
Keyboard: Alt+, / Alt+.   [E4]
```

## D. INTERACTIONS
| Action | Result |
|---|---|
| Click a frame cell | selects that frame **and** its layer's stage content between keyframes (E1) |
| Drag over cells | contiguous frame range (E2) |
| Shift+click | contiguous add (E2) |
| Ctrl/Cmd+click | non-contiguous add (E2) |
| Alt+, / Alt+. | playhead jumps to prev/next keyframe; **no selection change** (E4) |
| Span-based ON + click | whole keyframe span selected (E3) |

## E. STATES
| State | Behavior |
|---|---|
| Frame-based mode (default) | one cell = one frame (E3) |
| Span-based mode | one click = span (E3) |
| Layer locked | frame still selectable (timeline), but its stage content not selectable via E1 |
| Empty frame | selectable as a frame; no stage content to select |
| Tween span frame | selects the span (motion/classic/shape) — frame ops differ (Part 07) |

## F. OBJECT COMPATIBILITY (timeline-domain)
Frame selection operates on **frames** (not object types); the stage-content side-effect (E1) selects whatever content is in that layer's keyframe span: shapes, drawing objects, groups, instances, text, bitmaps — subject to lock/hide (F-03-01 E7).

## H. TIMELINE INTERACTION (its own domain)
- Frame selection is **independent** of stage selection (F-03-02 dual-domain).
- The only coupling: stage-symbol-selection lights its layer's frames (E5) — the quirk; our app gates it behind an explicit sync toggle (F-03-02 L.2 fix).
- Span-based mode changes click semantics only (E3); drag/Shift/Ctrl still work.

## L. LIMITATIONS
| # | Limitation | Trigger | Actual | Severity | Source | Better (ours) |
|---|---|---|---|---|---|---|
| L.1 | E1 stage-selection side-effect surprises | click frame to select a frame | stage content also selected | Medium | [OFFICIAL] E1 | toggle "frame-click selects content" (default OFF, ours) |
| L.2 | E5 coupling | select symbol → click frame | whole span re-selects | Medium | [COMMUNITY] E5 | explicit sync toggle (carried) |
| L.3 | Alt+,/. undocumented | discoverability | hidden nav aid | Low | [COMMUNITY] E4 | surface in menu + tooltip |

## M. EDGE CASES
M.1 click frame on locked layer (frame selectable, content not) · M.2 click empty frame (no content) · M.3 span-based on a single-frame span (same as one frame) · M.4 non-contiguous Ctrl+click across layers · M.5 frame column double-click (E6) · M.6 frame selection during playback · M.7 selecting a tween span vs a static span (different ops).

## O/P/Q/R
- Data: `timelineSelection = { selectedFrames:[{layerId,start,end,spanBased}], selectedLayers[], activeLayerId }` (F-03-02 O).
- Events: `timelineSelection:changed`.
- Undo: frame selection = view state (no undo); frame ops (copy/delete/move) = commands.
- Serialization: `activeLayerId` optionally persisted; frame selection not.

## S/T/U/V
- Mobile: tap frame = select; long-press = frame menu; drag = range; pinch ruler = zoom.
- Stylus: identical to mouse.
- Accessibility: Alt+,/. as keyboard nav; announce "frame 12 selected".
- Performance: frame selection O(1); E1 stage-side-effect = one hit per content item in the span (cheap).

## W. WORKFLOWS
W.1 Select a layer's span: click a frame between two keyframes → its content selected on stage (E1).
W.2 Hop keyframes without disturbing selection: Alt+, / Alt+. (E4).
W.3 Select a whole tween: Span-based ON → click the span (E3) → frame ops.

## X. ALTERNATIVES
Frame range: drag (contiguous) vs Shift+click (contiguous) vs Ctrl+click (non-contiguous) vs span-click (span-based). Stage content by span: frame-click (E1) vs Ctrl+A then prune. Best: frame-click for span-scoped; Alt+,/. for navigation.

## Y. IMPLEMENTATION (OURS)
- `selectFrame(layerId, frame, {spanBased})` writes `timelineSelection`; optional `selectContentOnFrameClick` flag (default OFF, L.1 fix).
- Sync toggle gates E5 coupling (default OFF).
- Alt+,/. implemented as playhead-jump without selection write.

## TEST MATRIX
TS-01 frame click selects content between keyframes (E1, toggle ON) · TS-02 toggle OFF → frame only (L.1 fix) · TS-03 drag = range · TS-04 Shift+click contiguous · TS-05 Ctrl+click non-contiguous · TS-06 span-based click = span (E3) · TS-07 Alt+,/. jumps without select (E4) · TS-08 locked layer frame select, content not · TS-09 empty frame · TS-10 tween span select · TS-11 column double-click (E6) · TS-12 mobile tap/long-press · TS-13 playback · TS-14 undo none.

## AUDITS
**Contradiction:** none. **Completeness:** complete. **Self-challenge:** overlooked = E1 side-effect + E5 coupling + E4 hidden shortcut — all covered. **Version:** frame/span-based selection documented in current docs (span-based = newer opt-in).

```
FEATURE COMPLETE: F-03-08 — Select by timeline / frame — AUDITED
```
