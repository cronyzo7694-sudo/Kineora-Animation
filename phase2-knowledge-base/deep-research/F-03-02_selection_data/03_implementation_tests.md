# F-03-02 — W. WORKFLOWS · Y. IMPLEMENTATION (OURS) · TEST MATRIX

---

## W. REAL WORKFLOWS

### W.1 Read the exact position of a selected symbol (reg vs transform)
1. Select the instance → Properties "Position and Size" shows x/y.
2. Click the reg/transform toggle → readout switches between the **registration point** (symbol origin) and the **transformation point** (pivot) coordinates [E8].
3. Use this to place rig parts precisely at joints (Part 13.4).

### W.2 Inspect a mixed selection
1. Shift+click a shape and an instance → `commonType:'mixed'`.
2. Properties shows **only W/H and x/y** (the union) [E2].
3. Deselect the instance (Shift+click it) → Properties returns to the shape's full schema [E4].

### W.3 Select a frame span (then edit it)
1. Timeline: click one frame → span-based selection lights the keyframe span [E9].
2. Frame Properties shows label/sound/tween for the span; frame ops (copy/delete/convert) act on the span.

### W.4 Recover from the "everything selected" state
1. Stage symbol selected → its layer's frames all lit (E10).
2. Click empty stage / press Ctrl+Shift+A → deselect [E4].
3. Click the desired single frame → now a single frame selects (deselect-first rule).

---

## Y. IMPLEMENTATION FOR OUR ORIGINAL APP  [OUR IMPLEMENTATION]

### Y.1 Class & ownership
```ts
class SelectionState {
  kind: 'objects'|'anchors'|'none'
  targets: TargetRef[]              // {nodeId, subPath?, anchorIndex?}
  bounds: Rect|null                  // cached union AABB
  commonType: string                 // cached
  readoutPoint: 'registration'|'transformation'   // view pref
  // timeline domain
  selectedLayers: string[]
  activeLayerId: string|null
  selectedFrames: {layerId, start, end, spanBased}[]
}
```
- **Single owner:** the SelectionController (not scattered in tools). Tools call `controller.set(targets)`; panels subscribe to events.
- **No direct writes** by panels (blueprint Part 32 rule).

### Y.2 Derived-field computation
- `bounds` = union of `transformedAABB(node)` per target (cache; invalidate on `document:changed` touching any target).
- `commonType` = most-specific common category (single → exact; multi same-kind → that kind; mixed → `mixed`).
- Both computed lazily, cached, invalidated on selection change.

### Y.3 Target forms (from F matrix)
- Raw-shape sub-objects use `subPath` (`fills[i]` / `strokes[i]` / `warp.pins[i]`).
- Anchors use `kind:'anchors'` + `anchorIds`.
- Everything else `{nodeId}`.

### Y.4 Events & panels
- Emit `selection:changed`, `timelineSelection:changed`, `readoutPoint:changed`, `selection:hidden:changed`, `selection:lost` (P section). Panels re-render from schema registry keyed by `commonType`.

### Y.5 Undo integration
- Commands capture `prevSelection` (stage + timeline domains) and restore on undo/redo; selection itself never enters the stack (Q).

### Y.6 Serialization
- Persist: `activeLayerId` (optional), `readoutPoint`, highlight colors, span-based toggle (app prefs). Do **not** persist targets/bounds/frames (R).

### Y.7 Improvements over Animate (from L-table)
- **L.2 fix:** explicit "sync stage↔timeline" toggle, default OFF (Animate's coupling is accidental).
- **L.3 fix:** span-based ON by default + visible toggle + tooltip.
- **L.4 fix:** remember last selection across re-open (P2).
- **L.7 fix:** optional tight (OBB) union bounds toggle.

### Y.8 Desktop / mobile / stylus input
- Desktop: click/Shift-click/marquee (F-03-01) → `controller.set`.
- Mobile: tap / Select-mode toggle / long-press (F-03-01 S) → same controller; `readoutPoint` toggle via Info sheet.
- Stylus: no special selection semantics (F-03-01 T).

### Y.9 Performance
- `bounds`/`commonType` cached; selection change is O(n) over targets (n is small); overlay re-render only on `selection:changed` (not per-frame).

---

## TEST MATRIX (F-03-02)

| ID | Category | Test | Expected |
|---|---|---|---|
| TS-01 | Normal | Select one shape | targets=[{nodeId}], commonType='shape', bounds=shape AABB |
| TS-02 | Normal | Select fill only | target has subPath fills[i]; commonType='shape.fill' |
| TS-03 | Normal | Double-click fill | two targets (fill+stroke) same node; commonType='shape' |
| TS-04 | Normal | Mixed select shape+instance | commonType='mixed'; bounds = union AABB |
| TS-05 | Normal | Ctrl+Shift+A | kind='none'; bounds null |
| TS-06 | Normal | Shift+click one item of a multi-select | item removed [E4] |
| TS-07 | Boundary | Shift+click the last item | kind='none' |
| TS-08 | Boundary | Select rotated object | bounds = rotated AABB |
| TS-09 | Boundary | Toggle readoutPoint | Info/Properties x/y swaps reg↔transform [E8] |
| TS-10 | Invalid | NaN-coord node selected | bounds math ignores NaN (no crash) |
| TS-11 | Empty | No selection → Properties | document schema |
| TS-12 | Multi | 3 shapes + 1 text | commonType='mixed'; only x/y/w/h |
| TS-13 | Locked | Ctrl+A with locked layer | locked content excluded from targets [E7] |
| TS-14 | Hidden | marquee over hidden layer | not in targets |
| TS-15 | Nested | select group, then edit-in-place, select child | child target inside edit scope |
| TS-16 | Undo | select→move→undo | move reverted; prevSelection restored |
| TS-17 | Redo | →redo | post-state restored |
| TS-18 | Save/Reload | save with selection → reload | selection cleared (L.4) |
| TS-19 | Import/Export | import then select | normal target forms |
| TS-20 | Playback | scrub past selected object's span | selection:lost; targets drop it |
| TS-21 | Mobile | Select-mode taps | membership toggles |
| TS-22 | Touch | long-press → context menu | target resolves (F-03-01) |
| TS-23 | Stylus | barrel click | context menu; selection unchanged |
| TS-24 | Performance | 10k objects, select-all | bounds computed once, cached; UI responsive |
| TS-25 | Frame domain | click frame cell | selectedFrames = span (spanBased ON) [E9] |
| TS-26 | Frame domain | span-based OFF | single frame selected |
| TS-27 | Frame domain | delete active layer | activeLayerId falls back [M.22] |
| TS-28 | Sync toggle | stage↔timeline sync OFF (ours) | selecting stage object does NOT light its frames |
| TS-29 | Hide Edges | toggle | highlight suppressed, selection intact [E5] |
| TS-30 | Highlight color | set per-type color | box color per type [E6] |
