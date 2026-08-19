# F-03-02 — L. LIMITATIONS · M. EDGE CASES

---

## L. LIMITATIONS

| # | Limitation | Trigger | Expected | Actual | Visible | Severity | Version | Source | Workaround | Preserve? | Better alternative (ours) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| L.1 | Mixed selection shows only x/y/w/h | multi-select different types | per-type props | common only [E2] | Properties degrades to position/size | Low (by design) | all | [OFFICIAL] E2 | select one at a time | Preserve | show a "mixed" badge + per-type count |
| L.2 | Stage↔timeline selection coupling confuses | select a symbol, then click a frame | frame collapses to one | span stays selected | whole layer's frames stay lit [E10] | Medium | current | [COMMUNITY] E10 | click empty area / another layer first | Improve | explicit "sync stage↔timeline" toggle (default off) |
| L.3 | Span-based selection surprises | click one frame | single frame | whole span | many frames highlight [E9] | Medium | all | [COMMUNITY] E9 | toggle span-based off | Improve | ON by default but visible + tooltip |
| L.4 | Selection not persisted | save/reload | — | selection cleared | nothing selected after open | Low | all | blueprint Part 03 §3.0 | re-select | Preserve | remember last selection for re-open (P2) |
| L.5 | Bounding box vs selection outline confusion | select rotated raw shape | — | box = AABB, outline = true path | two different shapes drawn | Low | all | blueprint §3.8 | n/a | Preserve | draw both distinctly (box dashed, outline solid) |
| L.6 | No anchor+object mixed selection | Subselection + Shift on another object | mix anchors & objects | anchors only (tool-scoped) | can't mix | Low | all | [INFERENCE] | two passes | Preserve | keep tool-scoped; allow anchor groups |
| L.7 | Union bounds ignore rotation for precision work | mixed rotated selection | tight hull | AABB union | oversized box | Low | all | [INFERENCE] | rotate manually | Preserve | optional "tight (OBB) union" toggle |

---

## M. EDGE CASES

| # | Case | Behavior |
|---|---|---|
| M.1 | Empty selection | `kind:'none'`, targets [], bounds null; Properties = document schema |
| M.2 | Single sub-object (fill only) | `commonType:'shape.fill'`; moving it splits the shape (F-03-01 E13) |
| M.3 | Fill+stroke both selected (double-click fill) | two targets on same nodeId, different subPaths; `commonType:'shape'` (union) |
| M.4 | Multi-select incl. locked/hidden content | those never enter targets (F-03-01 E7) |
| M.5 | Nested object selected | target = container only (F-03-01 F matrix) |
| M.6 | Deep nesting | targets hold outermost instance; descend via edit-in-place |
| M.7 | Zero-size / NaN object selected | [UNCERTAIN] Animate; ours: NaN excluded from bounds math |
| M.8 | Off-stage (pasteboard) selection | allowed; bounds extend beyond stage; not exported |
| M.9 | Rotated object bounds | AABB union (L.7) |
| M.10 | Deleted parent while selected | `selection:lost` → targets drop the child IDs; clear if empty |
| M.11 | Broken reference (deleted symbol) | instance target persists → our app: select + warn toast |
| M.12 | Copy/paste while selected | new object becomes the selection (paste replaces selection) |
| M.13 | Duplicate (Ctrl+D) | duplicate becomes selection |
| M.14 | Undo after selection-changing command | `prevSelection` restored (Q) |
| M.15 | Redo | post-state selection restored |
| M.16 | Save/reload | selection cleared (L.4) |
| M.17 | Import/export | no selection effect |
| M.18 | Playback scrub past span | `selection:lost` for vanished objects (F-03-01 L.6) |
| M.19 | Edit during playback | targets re-resolve at live frame |
| M.20 | Frame selection spanning a tween | `selectedFrames` may cover a tween span (ops differ: convert-to-keyframes allowed, drawing blocked) |
| M.21 | Multi-frame selection across layers | per-layer ranges in `selectedFrames` |
| M.22 | Active layer deleted | `activeLayerId` falls back to nearest surviving layer |
| M.23 | Deselect individual down to zero | Shift+click last item → `none` [E4] |
| M.24 | Hide Edges while selecting | selection updates, highlight stays hidden [E5] |
| M.25 | readoutPoint when no selection | toggle disabled; readout empty |
