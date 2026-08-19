# F-03-01 — L. LIMITATIONS · M. EDGE CASES

---

## L. LIMITATIONS

| # | Limitation | Trigger | Expected | Actual | Visible result | Severity | Version | Source | Workaround | Preserve in our app? | Better alternative (ours) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| L.1 | Contact-sensitivity does **not** apply to raw shapes | marquee over a raw shape | object-style enclosed/touched selection | region always selected by intersection | partial-region speckled highlight; move splits shape | Medium | all | [OFFICIAL] E9 + [COMMUNITY] E13 | click instead of marquee; use object drawing mode | Preserve (it IS the merge model) | offer a "region-select lock" toggle to make marquee never split |
| L.2 | No "select behind" cycling | click on overlapping stack | reach the lower object | top-most only | can't grab the back object | Medium | all | [INFERENCE] E15 | lock/hide top layer; use Outline mode; rearrange | Improve | **Alt+click cycles down the stack** (list of candidates at that point) |
| L.3 | Groups/instances/text require full enclosure to marquee-select | marquee partly over a group | selection | not selected (unless contact-sensitive ON) | nothing selected | Low | all | [OFFICIAL] E2/E9 | use contact-sensitive ON, or click | Preserve (matches muscle memory) | keep, but show enclosure requirement in a tooltip |
| L.4 | Locked/hidden content silently unselectable | click/marquee over it | selection | nothing, no message | cursor over "dead" area | Low | all | [OFFICIAL] E7 | check layer eye/padlock | Improve | "no-entry" cursor + toast on click |
| L.5 | Fill/stroke are separate hits | click near edge | select whole shape | selects whichever sub-object was hit | moving one splits it | Medium (surprise) | all | [COMMUNITY] E12 | double-click fill to grab both | Preserve | highlight *which* sub-object will be selected on hover |
| L.6 | Selection drops when the object disappears on scrub | scrub past object's span | selection persists | selection cleared | highlight vanishes | Low | all | [INFERENCE from Part 03 §3.10] | keep span lengths equal | Improve | remember last selection & restore if it reappears |
| L.7 | Hit = bounding rect for bitmaps (no alpha test) | click transparent corner of a PNG | no selection | bitmap selected | transparent region selects | Low | current | [INFERENCE] | use precise PNGs / draw a shape | Improve | alpha-precise hit test toggle |
| L.8 | Editable only at current edit scope | click child while at top level | select child | selects container | must double-click to descend | Low (by design) | all | [OFFICIAL] E11 | double-click / Edit Selected | Preserve | breadcrumb + keyboard descend (Enter) |

---

## M. EDGE CASES

| # | Case | Behavior | Source |
|---|---|---|---|
| M.1 | Empty selection (click empty) | clears; no doc change; no undo | [OFFICIAL] E1-adjacent |
| M.2 | Multiple selection + plain click | collapses to the single clicked object | [OFFICIAL] E6-adjacent |
| M.3 | Multiple + Shift-click selected object | removes that object (toggle) | [OFFICIAL] E6 |
| M.4 | Nested objects | container wins at top level; child only inside edit-in-place | [OFFICIAL] E11 |
| M.5 | Deep nesting (symbol in symbol in symbol) | hit = outermost instance; descend via repeated double-clicks | [INFERENCE] |
| M.6 | Locked object (Arrange > Lock) | skipped like a locked layer (per-object) | blueprint Part 03 §3.7 |
| M.7 | Hidden object | n/a in Animate (no per-object hide); our app adds it → skipped | [OUR DESIGN DECISION] |
| M.8 | Extreme values (huge/NaN coords) | [UNCERTAIN] Animate behavior; our app clamps/ignores NaN in hit math | [OUR DESIGN DECISION] |
| M.9 | Off-stage (pasteboard) objects | hit-testable on the pasteboard (authoring); not exported | [OFFICIAL] pasteboard docs |
| M.10 | Zero-size object | click may miss (zero area); marquee can still catch if enclosed | [INFERENCE] |
| M.11 | Negative scale (flipped) | hit uses transformed geometry (mirrored bounds) | [INFERENCE] |
| M.12 | Rotated object | hit uses rotated bounds; marquee uses axis-aligned intersection | [INFERENCE] |
| M.13 | Deleted parent (group/symbol) | children removed with it; instances of deleted symbol → placeholder | [INFERENCE; ours: warn] |
| M.14 | Deleted child (group) | group remains; remaining children re-hit-test | [INFERENCE] |
| M.15 | Broken reference (missing asset) | [UNCERTAIN] Animate shows placeholder; ours: select + toast | [OUR DESIGN DECISION] |
| M.16 | Copy/paste selection | pasted object becomes selected at paste point | [OBSERVED] |
| M.17 | Duplicate (Ctrl+D) | duplicate becomes selected (offset) | [OBSERVED] |
| M.18 | Undo/redo | selection restored to the command's captured state | blueprint Part 36 |
| M.19 | Save/reload | selection is NOT persisted (view state) | blueprint Part 03 §3.0 |
| M.20 | Import/export | no selection effect | — |
| M.21 | Playback | hit set = current frame; vanishing selection dropped (L.6) | [INFERENCE] |
| M.22 | Editing during playback | allowed; hits resolve at the live frame | [INFERENCE] |
| M.23 | Two objects exactly overlapping | top-most (most recently created) wins (E10) | [OFFICIAL] |
| M.24 | Stroke-only shape (no fill) | click must land on the stroke (centerline ± edge radius); clicking "inside" the outline hits nothing | [INFERENCE; our edge radius = 4 px] |
| M.25 | Fill-only shape (no stroke) | click anywhere in the fill region selects it | [INFERENCE] |
