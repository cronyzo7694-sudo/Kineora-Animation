# PART 03 — SELECTION SYSTEM
### The complete selection model: how anything on the stage gets selected, what changes per object type, and how to implement it. This is the foundation every tool, panel, and command builds on.

---

## 3.0 Why selection is the spine of the editor

Nearly every editing action is: **select something → inspect it (Properties/Info/Transform) → act on it (move, transform, delete, style, tween, rig)**. Selection is therefore not a feature bolted on — it is a **first-class data structure** in the editor core. Getting it right means:

- Tools (Part 02) only *produce* selections and *consume* the current selection.
- Panels (Part 26) render themselves from the selection's **type + property schema**.
- Commands (Part 36) store *which nodes they touched* so undo/redo can restore selection.
- Rendering draws a **selection overlay** (bounding box, handles, anchors) that is never part of export.

### The two layers of selection

| Layer | Meaning | Persisted? |
|---|---|---|
| **Selection state (UI)** | Which node(s)/sub-parts are currently selected | Transient — not saved in the document; restored only for convenience on undo |
| **Document model** | The actual nodes, paths, transforms | Persisted (Part 33) |

The selection state holds **references (IDs)** to model objects, never copies. Mutating a selected object mutates the model; the selection simply points at it.

### Selection data structure (original app)

```jsonc
{
  "selection": {
    "kind": "objects",            // 'objects' | 'anchors' | 'frames' | 'bones' | 'warpPins' | 'camera' | 'none'
    "mode": "normal",             // 'normal' | 'subselection' (anchor-level)
    "targets": [
      { "nodeId": "n123" },                     // whole node selected
      { "nodeId": "n456", "subPath": "fills[0]" },   // sub-object (a fill/stroke of a raw shape)
      { "nodeId": "n789", "anchorIndex": 3 }    // anchor-level (Subselection tool)
    ],
    "anchorIds": [],              // when kind==='anchors'
    "bounds": { "x": 0, "y": 0, "w": 0, "h": 0 },   // union bounding box (computed, cached)
    "commonType": "shape"         // computed: the common ancestor type for Properties panel
  }
}
```

Rules:
- `targets` may mix node types (mixed selection) — then only **common** properties are shown.
- Sub-object selections (fill-only / stroke-only) are modeled as `nodeId + subPath` so the model isn't split prematurely; a subsequent move/cut performs the split (Part 06).
- Anchor selection (`kind:'anchors'`) is produced by the Subselection tool and consumed by the path editor.

---

## 3.1 Selection tool vs Subselection tool — two selection modes

| | **Selection (V)** | **Subselection (A)** |
|---|---|---|
| Selects | Whole objects + (in merge mode) fill/stroke sub-objects | Anchors + Bézier handles of a path |
| Visual | Bounding box + transform handles | Anchor dots + tangent handles |
| Produces | `kind:'objects'` | `kind:'anchors'` |
| Used for | Move/transform/arrange/style | Path editing (Part 05/06), motion-path editing (Part 10) |

Both modes coexist: switching tools keeps the *underlying* object selected but changes what's emphasized (Animate keeps the object selected; our app shows the same — selecting an object with `A` shows its anchors).

---

## 3.2 Hit-testing (how a click becomes a selection)

Hit-testing answers: **"what is under the pointer at (x, y)?"** It runs top-down through the render order.

### 3.2.1 Hit-test order (render order = front-to-back)

1. **Overlays** (handles, anchors, bones, warp pins, camera widget) — these win first (you can grab a handle).
2. **Top-most layer** → **front-most object** → recurse into groups/symbols (edit depth).
3. Locked/hidden layers are skipped (3.7).
4. Empty hit → stage background (clears selection).

### 3.2.2 Hit-test algorithm

```
function hitTest(point, doc, view):
  for layer in visibleLayersTopToBottom:          # skip hidden & locked
    for node in layer.frame(playhead).content backToFront:
      r = hitTestNode(node, point)
      if r: return r
  return null   # empty stage

function hitTestNode(node, point):
  case node.type:
    shape / drawingObject:  point-in-path (winding rule) → {nodeId} else edge-hit (within 4px) → {nodeId, subPath:stroke}
    group:                  recurse children (front→back)
    symbolInstance:         point in instance bounds → {nodeId}
    text:                   point in text box → {nodeId}
    bitmap:                 point in bitmap rect (alpha>0 if precise) → {nodeId}
    brushStroke/warpAsset:  point in stroke outline / mesh → {nodeId}
```

Implementation notes:
- Maintain a **spatial index** (quadtree / R-tree) per layer for O(log n) hit-tests; rebuild on content change (dirty-flag).
- **Edge hit radius** = 4 px (desktop) / 24 px (touch) — configurable. This is what lets the Selection tool grab a curve edge to reshape.
- **Pixel-accurate bitmaps:** hit-test against the bitmap's alpha channel when "precise" is on (P2); rectangle otherwise.
- **Winding rule:** non-zero vs even-odd — a filled self-intersecting path selects consistently with how it renders (Part 06).

---

## 3.3 Selection operations (every way to select)

### 3.3.1 Click selection
- Click = select the **single top-most** hit object; deselects everything else.
- Click empty = **deselect all**.
- Clicking a **sub-object** of a raw shape (fill vs stroke) selects just that sub-part (3.4).

### 3.3.2 Shift selection (add/remove — "toggle")
- `Shift`+click an unselected object → **add** to selection.
- `Shift`+click a selected object → **remove** from selection.
- Result may be a **mixed selection** (multiple types).

### 3.3.3 Marquee (drag) selection
- Drag on empty space = draw a selection rectangle.
- Two behaviors (user preference, *[WISH W6]* exposed clearly):
  - **Contact-sensitive ON** (Animate default): any object **touched** by the marquee is selected.
  - **Contact-sensitive OFF**: only objects **fully enclosed** are selected.
- Marquee respects locked/hidden layers (skipped).
- Marquee over raw shapes: selects the fill **regions** intersected (partial shape selection) — a distinctive merge-model behavior (3.4).

### 3.3.4 Lasso selection
- Freeform equivalent of marquee (T2A.7): the traced polygon selects everything inside (point-in-polygon), or intersecting if contact-sensitive.

### 3.3.5 Select All / Deselect All
- `Ctrl+A`: select everything on **unlocked, visible** layers of the **current timeline** (not other scenes, not hidden/locked layers).
- `Ctrl+Shift+A`: deselect all.

### 3.3.6 Select by timeline
- Clicking a **frame** (keyframe) can select that frame's content on stage (Animate: click a frame to select its contents on the stage). Our app: clicking a keyframe **also selects its content** when a "select frame content" toggle is on (default off — Animate's default is on for keyframes; we make it explicit).

### 3.3.7 Select by layer
- **Layer selection** (3.6) is separate: clicking a layer row selects the *layer* (for rename/delete/reorder), not its content. `Ctrl+A`-style "select all on layer" is available via right-click → Select All on Layer.

### 3.3.8 Selection memory / reselect
- `Ctrl+Shift+D` is taken by Duplicate; reselect-last-selection is a P2 nicety: store the last non-empty selection and restore it (useful after an accidental deselect).

---

## 3.4 Per-object-type selection behavior (exactly what changes)

This is the heart of Part 03. When each type is selected, the **overlay**, the **Properties schema**, and the **editable operations** change.

### 3.4.1 Raw shape (merge shape) — fill vs stroke sub-objects

- A raw shape is **two selectable sub-objects**: the **fill** and the **stroke(s)**, even though they're one shape in the model.
- **Click fill** → fill selected (shows a dotted/speckled fill highlight). Moving it **cuts** it away from the shape (merge-model split).
- **Click stroke** → that stroke selected. Moving it splits/moves the stroke.
- **Double-click fill** → fill + stroke both selected (the whole shape).
- **Double-click a stroke** → selects the whole **connected stroke chain**.
- **Marquee** selects intersected regions (partial shape) — moving a partially-selected shape cuts that region.
- Selected-shape overlay: **dotted stipple pattern** (concept: highlight the fill with a translucent color + dot texture; our app draws its own pattern), stroke highlighted in its color.
- Properties schema: fill color/style, stroke color/thickness/style, width profile, x/y/w/h.

> **Model note:** fill/stroke sub-selection does NOT split the shape in the model immediately. The split happens on the first *move/cut/delete* command. This preserves undo granularity and keeps the model clean.

### 3.4.2 Drawing object (object-drawing mode)

- Atomic: click selects the **whole object** (fill+stroke together). No sub-object selection.
- Overlay: bounding box + transform handles (Free Transform).
- Double-click → **edit in place** (drill into the object; other content dims; breadcrumb updates).
- Properties schema: x/y/w/h + (in edit) fill/stroke.

### 3.4.3 Group

- Atomic: click selects the group; children are NOT individually selectable from the top level.
- Overlay: bounding box + handles.
- Double-click → edit-in-place (drill into the group; its children become selectable).
- Properties: x/y/w/h; note "Group" type.
- Break Apart (Ctrl+B) dissolves the group into its children.

### 3.4.4 Symbol instance (graphic / movie clip / button)

- Click selects the **instance** (a *reference* to the symbol definition, not the definition itself).
- Overlay: bounding box + transform handles + the **transform point (pivot)** as a white circle.
- Double-click → **edit the symbol in place** (other content dims; you edit the *definition*, which updates all instances — Part 11).
- Properties schema: instance type, swap symbol, color effect (brightness/tint/alpha/advanced), loop settings (graphic: loop/play-once/single-frame + first frame — via Frame Picker), filters (drop shadow/blur/glow), x/y/w/h.
- **Instance ≠ symbol:** editing the instance transform never touches the symbol; editing the symbol updates every instance.
- Break Apart (Ctrl+B): detaches the instance into raw content (a copy of the symbol's art on this frame); further break-apart of that copy to raw shapes.

### 3.4.5 Text block

- Click selects the text block (bounding box).
- Double-click / click-inside → **text-edit mode** (character selection, caret).
- Properties schema: text string, font, size, color, bold/italic, align, letter/line spacing, static/dynamic/input, embed, anti-alias, selectable (Part 22).

### 3.4.6 Bitmap

- Click selects the bitmap (bounding box, no reshape).
- Properties: bitmap swap/replace, x/y/w/h, (if broken apart) edit pixels.
- Broken-apart bitmap supports region selection (Lasso/Magic Wand).

### 3.4.7 Bone (inside an armature)

- Selecting a bone shows it highlighted (red) + its **bound points** (yellow) when the Bind tool is active.
- Shift+click = multi-select bones; double-click = whole armature.
- Properties: bone length/angle, rotation constraint, translation constraint, joint speed, spring.
- Selecting a pose-layer frame selects the whole armature (Part 14).

### 3.4.8 Warp pins (Asset Warp)

- Selecting a warped asset shows its pins; clicking a pin selects it (draggable). Properties: pin position, warp mode.

### 3.4.9 Camera

- Selecting the camera (via Camera tool / camera layer) shows the camera outline + zoom/rotate widget; Properties: camera x/y/z/zoom/rotation/tint.

### 3.4.10 Multiple / mixed selection

- Multiple objects → one **union bounding box**; Properties shows only common fields (x/y/w/h).
- Mixed types (e.g. shape + instance) → common fields only; type-specific sections hidden.
- The union bounding box is computed from each member's transformed bounds (cache per change).

### 3.4.11 Nothing selected

- Properties shows **document** properties (stage size, fps, background) — the "document context" (Part 26).

---

## 3.5 Selection visual feedback (overlay system)

The overlay is a **render pass on top of the stage**, drawn from selection state, never exported.

| Element | When shown | Concept |
|---|---|---|
| **Selection outline** | Object selected | 1–2 px outline in the highlight color around the object's path/bounds. |
| **Dotted fill highlight** | Raw-shape fill selected | Translucent fill + dot texture over the fill region. |
| **Bounding box** | Object/group/instance/bitmap/text selected | Thin rectangle (union box for multi-select). Color is user-configurable (Animate allows custom bounding-box colors — we do too). |
| **Transform handles** | Free Transform active (Part 04) | 8 handles + rotation zone + pivot. |
| **Anchor dots / tangent handles** | Subselection active | Squares for anchors (filled = selected), dots + lines for handles. |
| **Bone glyphs / bind points** | Armature selected | Bone lines + joint circles; bound points (squares/triangles). |
| **Warp pins** | Warp asset selected | Small circles at pins. |
| **Camera outline** | Camera active | Stage-border camera rectangle + zoom/rotate slider. |
| **Hide Edges** (`Ctrl+Shift+E`) | toggle | Suppresses ALL highlights so you can edit without visual clutter *[WISH W6]*. |

Implementation: one `SelectionOverlayRenderer` reading `selection` + the render tree; drawn last; skipped in export and in thumbnails.

---

## 3.6 Layer selection vs content selection

- Clicking a **layer row** (timeline) selects the **layer** (for rename/reorder/delete/lock/etc.), NOT its stage content. Layer selection is a timeline-panel state.
- The **active layer** (the one you draw into) is indicated by a highlight + pencil icon. Only one layer is active at a time; selecting a frame on a layer makes it active.
- Layer **lock/hide/outline** affect content selection (3.7) but not layer-row selection.

---

## 3.7 Locked & hidden object behavior (rules)

| State | Selection | Editing | Select All | Notes |
|---|---|---|---|---|
| **Locked layer** | Content cannot be selected (hit-test skips it) | Cannot be edited | Skipped | Lock icon in timeline; unlock to select. |
| **Hidden layer** | Not selectable, not rendered on stage | Skipped | Skipped | Content still exists; export may include if "export hidden" off (default excludes). |
| **Outline mode layer** | Selectable normally | Editable | Included | Rendered as outlines only (view aid). |
| **Locked object** (Arrange > Lock) | Cannot select until unlocked | Blocked | Skipped | Per-object lock independent of layer lock. |
| **Hidden object** | n/a (Animate has no per-object hide; our app adds it — P2) | — | — | Optional. |

- **Guides are never selectable** (they're view objects).
- **Mask/masked layers** (Part 21): masked content is selectable normally; the mask shape itself is selectable as a shape on the mask layer.

---

## 3.8 Selection outline vs bounding box vs handles vs anchor point

Precise definitions (these four are commonly confused):

| Term | Meaning | Who shows it |
|---|---|---|
| **Selection outline** | The object's own path/stroke highlighted (follows the true shape). | Selection tool, any selected raw shape/stroke. |
| **Bounding box** | Axis-aligned rectangle around the object(s) (the *outer* box). | Selection + Free Transform. Rotated objects: the box shows the **rotated** bounds (or the unrotated + rotation, per Animate's "show rotated box" behavior). |
| **Transform handles** | Interactive squares/circles on the bounding box (scale/rotate/skew/move) + pivot circle. | Free Transform only. |
| **Anchor point** | A vertex of a vector path (selected via Subselection). | Subselection tool. |

Also distinguish two "centers" (Part 04/11):
- **Registration point** — the (0,0) of a symbol's own coordinate space (defined when the symbol is made). The `x/y` position of an instance refers to where this point lands.
- **Transform point (pivot)** — the movable point around which rotation/scale happen. Independent of the registration point.
- **Selection center** — the computed center of the bounding box (used by Align/Transform-panel "center" and by "re-center pivot").

---

## 3.9 Selection events (what the rest of the app listens to)

```
selection:changed  { prevTargets, targets, kind, commonType, bounds }
```

Subscribed by: Properties panel (re-render schema), Info panel (numbers), Transform panel (numeric fields), Stage overlay (redraw), Actions panel (show target scripts), context-menu builder (which menu items are enabled).

Rules:
- Emit **once per user gesture** (not per pointer move) to avoid re-render storms. During a drag, use a `selection:preview` throttled event if live previews are needed.
- Selection changes are **not** undoable commands (they're view state), BUT undo/redo **restore** the selection that existed when the command ran (store `prevSelection` in each command — Part 36).

---

## 3.10 Selection + timeline/keyframe interaction

- Selection is **frame-scoped**: selecting an object selects it on the **current frame** of its layer. Scrub the playhead → the selection may no longer exist there (Animate keeps the selection if the object persists; our rule: selection persists **while the selected node still exists at the new frame**; otherwise it clears and shows a toast).
- Selecting an object on a **tween span**: you're selecting the tween's **target object**; property edits become property keyframes (Part 09).
- Selecting a **keyframe's content** by clicking the keyframe in the timeline (3.3.6).

---

## 3.11 Mobile translation of selection (Part 31 preview)

| Desktop | Mobile |
|---|---|
| Click | Tap (24 px tolerance) |
| Shift+click (toggle) | "Select mode" toggle — each tap toggles membership; or long-press = add to selection |
| Marquee | Drag on empty (two-finger drag = pan, so marquee = one-finger drag on empty) |
| Lasso | One-finger freehand lasso (a mode) |
| Subselection anchors | Tap path → anchors; drag with loupe; long-press = anchor menu |
| Deselect all | Tap empty space |
| Right-click menu | Long-press |

---

## 3.12 BUILD CHECKPOINT M1 (selection slice)

- [ ] Hit-testing with spatial index; correct front-to-back order; edge hit-radius.
- [ ] Click / Shift-toggle / marquee (both contact-sensitive modes) / lasso / select-all / deselect.
- [ ] Per-type selection behavior implemented for: raw shape (fill/stroke sub-objects), drawing object, group, symbol instance, text, bitmap, bone, warp pins, camera, mixed.
- [ ] Locked/hidden layer and locked-object rules enforced everywhere (hit-test, marquee, select-all).
- [ ] Selection overlay renderer (outline, dotted fill, bounding box, anchors, handles, bones, pins, camera) with Hide Edges toggle.
- [ ] Layer selection distinct from content selection; active-layer tracking.
- [ ] `selection:changed` event wired to Properties/Info/Transform/overlay; no panel reads another directly.
- [ ] Selection persists/clears correctly across playhead scrubbing.
- [ ] All of the above on touch (tap/long-press/select-mode) and desktop.

*Next: `04_transform_system.md` — Move/Scale/Rotate/Skew/Free/Distort/Envelope + numeric + pivot/registration, with the Input→calculation→result→stored-property→keyframe pipeline for every operation.*
