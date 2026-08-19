# F-03-01 — W. WORKFLOWS · X. ALTERNATIVES · Y. IMPLEMENTATION (OURS)

---

## W. REAL WORKFLOWS

### W.1 TASK: select and move a character's hand (raw-shape hand with fill+stroke)
1. Press `V` (Selection tool active).
2. Click **inside the hand's fill** → the fill highlights (speckled). The stroke does **not** highlight (E12).
3. Realize you need both → **double-click the fill** → fill + stroke selected together (E5).
4. Drag from the fill → both move; release → one `MoveCommand` (undoable).
5. (Alternative to steps 2–3: marquee fully around the hand → region selected, then drag.)

### W.2 TASK: select an instance behind a raw shape on the SAME layer
1. Click → the **raw shape** (drawn later, on top) wins… actually raw shapes sit **below** groups/symbols (E10), so the **instance** wins the top hit.
2. If the instance is on a **lower layer**, click still returns the top-most layer's object first.
3. To reach a behind object: **lock/hide** the covering layer, or switch that layer to **Outline mode**, then click (L.2).

### W.3 TASK: marquee-select several drawing objects without grabbing the background
1. Ensure **Contact-Sensitive Selection = ON** (Preferences → General) so partial enclosure counts (E9).
2. Drag a marquee that merely **touches** each object → all selected (with ON).
3. With OFF, the same marquee would select only fully-enclosed objects.

### W.4 TASK: select everything on one layer between keyframes
1. In the timeline, **click a frame cell** on that layer between two keyframes → the layer's content at that span is selected on stage (E8).

### W.5 TASK: grab a group's child without ungrouping
1. Click the group (selects whole group).
2. **Double-click** → edit-in-place; outside dims (E11).
3. Click the child → child selected.
4. **Double-click a blank spot** → Edit All → back to the group as one entity.

---

## X. ALTERNATIVE METHODS (same result, different routes)

| Goal | Method A | Method B | Method C | Best for |
|---|---|---|---|---|
| Select fill+stroke of a shape | double-click the fill (E5) | Shift+click fill then stroke | marquee around the shape | A: fastest; C: many shapes at once |
| Select connected strokes | double-click one segment (E4) | Shift+click each segment | marquee | A: fastest |
| Add to selection | Shift+click | Shift+marquee | Select-mode (mobile) | depends on input |
| Select an object behind | lock/hide top layer | Outline mode on top layer | rearrange (bring forward) | lock = non-destructive |
| Select all on a layer | click a frame cell (E8) | Ctrl+A then deselect others | marquee all | frame-cell = scoped |
| Grab a child in a group | double-click to edit-in-place (E11) | Edit > Edit Selected | ungroup, select, regroup | edit-in-place = non-destructive |

| Method | Speed | Precision | Control | Limitations | Best use case |
|---|---|---|---|---|---|
| Click | ★★★ | ★★★ | single object | sub-object ambiguity (fill/stroke) | routine single-object work |
| Double-click fill | ★★★ | ★★★ | fill+stroke | only same-shape pair | grabbing whole shapes |
| Marquee | ★★ | ★★ | many at once | splits raw shapes (L.1); enclosure rules (L.3) | bulk selection |
| Shift+click | ★★ | ★★★ | exact membership | slower | building precise multi-selections |
| Frame-cell click | ★★★ | ★★ | per-layer span | layer must have keyframes | layer-scoped selection |

---

## Y. IMPLEMENTATION FOR OUR ORIGINAL APP  [OUR IMPLEMENTATION]

> Everything in this section is our design — not Adobe internals.

### Y.1 Algorithm (ordered passes)

```
function hitTest(point, doc, view):
  # Pass 1 — overlays (handles, anchors, bones, pins, camera widget)
  for ov in activeOverlays(topmost-first):
      if ov.contains(point, tolerance): return {kind:'overlay', ref:ov}

  # Pass 2 — stage content
  for layer in doc.scene.layers top→bottom:          # top = frontmost
      if not layer.visible or layer.locked: continue  # L.4 / E7
      frame = layer.frameAt(playhead)                 # current frame (hold rule)
      for node in frame.content back→front:           # stacking order E10
          r = hitTestNode(node, point, tolerance)
          if r: return r

  # Pass 3 — nothing
  return null                                         # clears selection

function hitTestNode(node, point, tol):
  case node.type:
    shape:        # fill first (region), then stroke (edge ± tol) [E12]
      for fill in node.fills:   if pointInPath(point, fill.region, fillRule): return {nodeId, subPath:fill}
      for stroke in node.strokes: if pointOnStroke(point, stroke, tol):     return {nodeId, subPath:stroke}
    drawingObject/group/symbolInstance/text/bitmap:
      if pointInBounds(point, transformedBounds(node)): return {nodeId}
    group (during edit-in-place): recurse children front→back
```

**Key decisions (all [OUR DESIGN DECISION] unless tagged):**
1. **Top-first, front-first traversal** matches E10 (raw shapes below groups/symbols; most-recent-on-top). [OFFICIAL behavior]
2. **Fill-before-stroke within a shape** — matches "click the fill gets the fill" (E12); stroke requires edge proximity.
3. **Edge tolerance** = 4 px desktop / 24 px touch (blueprint Part 03 §3.2.2).
4. **Spatial index** (R-tree per layer) → O(log n) candidate lookup before precise tests.
5. **Alpha-precise bitmap** toggle (L.7) — off by default.
6. **Alt+click cycles** the z-stack at a point (fixes L.2 "no select behind") — returns the next object below the current top hit.
7. **Region-select lock** toggle (fixes L.1 surprise-splits) — when ON, a marquee never splits raw shapes.
8. **No-entry cursor + toast** on locked/hidden hits (fixes L.4 silence).

### Y.2 State machine

```
Idle ──pointerdown──▶ Resolving
Resolving ──hit──▶ Preview(object)
          ──miss──▶ Preview(marquee)
Preview ──pointermove──▶ (marquee preview / live region preview)
        ──pointerup──▶ Commit(selection) ──emit selection:changed──▶ Idle
```

### Y.3 Data model — see 05_data_undo_serialization.md (O).

### Y.4 Commands & undo

Hit testing **produces no command**. The follow-up action (move/delete/fill/transform) is the command; commands capture `prevSelection` and restore it on undo (blueprint Part 36). [OUR DESIGN DECISION; consistent with observed behavior]

### Y.5 Serialization

Selection, marquee, and index caches are **not** serialized; `layers/frames/content/transforms/styles/symbols` are (Part 33). Reload → identical hits (test TS-11).

### Y.6 Desktop input

Mouse + keyboard (V, Shift, Ctrl/Cmd temp-selection, Ctrl+A) + stylus; 1-px tolerance; hover preview optional.

### Y.7 Mobile input

Tap / double-tap / long-press / one-finger marquee / Select-mode; 24-px tolerance; offset loupe; palm rejection.

### Y.8 Performance

R-tree per layer + transformed-bounds cache + fill/stroke exact tests only for candidates; hit < 1 ms @ 10k objects; index rebuild only on dirty frames.

### Y.9 Testing

See 08_tests.md — hit testing is covered by TS-01…TS-14.
