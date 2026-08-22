# Selection Tool — Research and Implementation Contract

**Status:** Research complete — batch 1  
**Priority:** P0; first tool to make reliable  
**Shortcut:** `V`  
**Primary existing references:** `animate-blueprint/02a_tools_selection_transform.md` T2A.1 and `animate-blueprint/03_selection_system.md`

## 1. Purpose

Selection is the default object-selection and movement tool.

## 1.1 Why this tool matters

Selection is the default tool and the bridge between drawing, animation, properties, and timeline. If selection is unreliable, every other tool feels broken. It must support both a simple cartoon workflow and precision editing without forcing users to understand the internal model.

The tool has four related jobs:

1. Select one or more objects.
2. Move selected objects.
3. Start a marquee selection on empty space.
4. Enter an editing context for groups/symbols or hand off to path editing.

[KINEORA] Raw vector anchor editing belongs to Subselection, not the main Selection tool. Selection may offer a safe “reshape edge” enhancement later, but it is not part of the first implementation contract because it makes accidental edits likely.

## 2. Adobe behavior to retain

[ADOBE] Adobe documents Selection as the general object-selection tool. It selects artwork on the active, visible, unlocked layer; Shift modifies multi-selection; dragging empty stage space creates a marquee; dragging an object moves it; double-click can enter group/symbol editing. Animate also distinguishes merge-shape behavior from object-drawing behavior.

[KINEORA] Keep the mental model but make the hit result explicit:

- click fill/object = select object;
- click empty stage = clear selection;
- Shift-click = toggle membership;
- drag object = move;
- drag empty = marquee;
- double-click symbol/group = enter edit mode only when that feature is available;
- do not silently mutate a different layer or frame.

## 3. UI location and visible state

- Left Tools rail: first tool in the Selection/Transform group.
- Active icon has a high-contrast selected background.
- Cursor is a normal selection arrow over selectable content, open arrow over empty stage, and move cursor over a selected object.
- Tool Options in the contextual Tool tab:
  - Contact selection: `Touching` or `Fully enclosed`.
  - Snap to objects.
  - Snap to grid/guides, when those systems exist.
  - Optional `Show bounding box`.
- Status bar shows `Select`, current layer name, and current frame.
- Properties panel changes with selection. Selection itself is transient and never saved.

## 4. Hit-testing rules

Hit-testing runs in document coordinates after screen→document conversion.

Priority from front to back:

1. visible content in the active edit context;
2. topmost rendered object in layer order;
3. only objects on visible and unlocked layers;
4. selectable object geometry, not editor overlays;
5. stroke hit width includes a minimum screen-space tolerance so thin lines remain selectable at low zoom;
6. empty stage/pasteboard if no object is hit.

[KINEORA] A hidden or locked object is not selectable by normal click or marquee. There is no accidental “select then fail to move”; blocked objects are skipped and the status message may say `Locked layer` when the pointer is over one.

For multiple objects at the same point, repeated click cycles through the hit stack only when the user holds a documented modifier such as Alt/Option. Do not cycle unexpectedly on ordinary clicks.

## 5. Pointer event contract

### Click selection

```text
pointerdown
  -> convert point to document space
  -> hit-test selectable content
  -> store target and modifier snapshot
pointermove < threshold
  -> no document write
pointerup < threshold
  -> no shift: replace selection with target or clear if empty
  -> shift: toggle target; empty does not destroy selection
  -> emit selection:changed
```

The click threshold is 3 document-independent screen pixels. The threshold prevents a tiny hand tremor from becoming a move.

### Move selected object(s)

```text
pointerdown on selected object
  -> ensure target is selected; if not, select it
  -> store pointer-to-object offset and selected IDs
  -> capture pointer
pointermove >= threshold
  -> calculate document-space delta
  -> apply Shift constraint if enabled
  -> run SnapEngine
  -> render preview only
pointerup
  -> validate active frame/layer locks
  -> commit one MoveSelection command with absolute before/after transforms
  -> emit document:changed and selection:changed if needed
```

The preview must continue when the pointer leaves the canvas. Pointer capture is required. Pointercancel, window blur, Escape, and tool switch discard the preview.

### Marquee

```text
pointerdown on empty stage
  -> store start in screen space
pointermove
  -> render editor-only marquee rectangle
pointerup
  -> convert marquee to document-space rectangle
  -> touching mode: bounds/path intersects
  -> enclosed mode: selectable bounds are fully inside
  -> no modifier: replace selection
  -> Shift: add to selection
  -> commit only selection state; no undo/document change
```

The marquee must work after zoom and pan. It must not select editor guides, handles, onion-skin ghosts, hidden layers, or objects outside the current edit context.

## 6. Modifier matrix

| Modifier | Click | Move | Marquee |
|---|---|---|---|
| None | Replace selection | Move selected objects | Replace selection |
| Shift | Toggle object | Optional axis constraint only when the pointer moved | Add to selection |
| Alt/Option | Cycle hit stack only if implemented | Duplicate-drag; source stays in place | No special behavior |
| Ctrl/Cmd | Temporary select while another tool is active | Temporary selection handoff | — |
| Space | — | Pan instead of moving | Pan instead of marquee |
| Escape | Cancel pending gesture | Discard preview | Discard marquee |

[KINEORA] Axis constraint uses the dominant first movement axis. Once locked, it stays on X or Y until release. Optional 45° constraint can be added later, but must not conflict with Alt duplicate.

## 7. Selection data and model writes

Selection is session state:

```text
SelectionState {
  ordered_ids: NodeId[],
  active_id: Option<NodeId>,
  anchor_screen: Option<Point>,
  mode: Replace | Add | Toggle | Marquee,
  source_layer: Option<LayerId>
}
```

A selection click writes only session state. Moving writes the selected node transforms for the active frame:

```text
Document.scene.layers[].keyframes[].transforms[NodeId]
```

For a held frame, the command must apply the documented auto-keyframe rule before writing. For an animated/tweened object, the move command edits the effective interpolated state and creates an explicit keyframe/override according to the timeline contract.

[CODE] The repository already has selection, hit-testing, layer-aware move, transform preview, and selection details for the current rectangle/symbol model. The future path model must expose the same stable `NodeId` interface so Selection does not need a separate implementation for every node type.

## 8. Object-type behavior

| Object | Click | Drag | Double-click |
|---|---|---|---|
| Rect / ellipse / path object | Select whole object | Move | Enter edit mode only if grouped/symbolized |
| Raw merge shape | Select the shape as a node in MVP | Move | Later: enter raw-shape editing |
| Stroke-only path | Select stroke object | Move | Later: Subselection |
| Brush fill | Select painted object | Move | Later: paint edit mode |
| Symbol instance | Select instance | Move instance transform | Enter symbol edit context |
| Text | Select text box | Move box | Enter text editing |
| Bitmap | Select image bounds | Move/transform | Open image properties, not pixel editor |
| Locked/hidden content | Skip | Never mutate | Never enter |

## 9. Properties and timeline interaction

- Selecting an object updates the Object context in Properties.
- Selecting a frame in Timeline updates Frame context; if both object and frame are selected, the approved precedence rule decides which tab is active.
- Clicking an object on a layer makes that layer active and highlights its combined Timeline row.
- Selection does not move the playhead.
- Move on a keyframe edits the current keyframe.
- Move on a held frame auto-keys by the global MVP policy: create a keyframe, copy held content, apply the move, and show a visible toast. A later preference may disable Auto-Key and then show an explicit `Create keyframe to edit this frame` action.
- Move on a tween span creates an intermediate property keyframe or breaks/adjusts the tween according to the tween specification. Never silently overwrite a tween endpoint.

## 10. Undo and errors

One drag = one undo entry. A click, selection toggle, or marquee is not an undo entry. A duplicate-drag is one command containing source duplication plus final transform.

User-facing errors:

- `Selection blocked: layer is locked.`
- `Selection blocked: layer is hidden.`
- `Cannot edit outside the current symbol timeline.`
- `Cannot move content on this frame without creating a keyframe.`
- `Nothing selected.`

Errors must not leave a partially modified document.

## 11. Acceptance tests

1. Click a rectangle: it selects and Properties shows its transform.
2. Click empty stage: selection clears and Properties returns to Document context.
3. Shift-click two objects: both remain selected and Properties shows common fields.
4. Drag selected object after 200% zoom: document movement equals pointer movement divided by zoom.
5. Pan, then select: hit-test still targets the visible object.
6. Drag from empty stage: marquee selects touching objects in Touching mode.
7. Fully enclosed mode excludes objects crossing the marquee boundary.
8. Lock a layer: click/marquee skip its content and a clear message appears.
9. Drag outside the canvas: pointer capture continues and release commits one move.
10. Pointercancel/Escape/window blur: preview disappears, no command is created.
11. Alt-drag duplicates once and creates one undo entry.
12. Export after selection: selection box and marquee are absent.

## 12. Dependencies and implementation files

Dependencies: viewport conversion, spatial hit-test, selection session state, transform command, layer lock/visibility, Properties binding, Timeline active-frame state.

Expected implementation locations:

- `animator/ui/src/editor/selectionTool.ts` — new pure interaction controller.
- `animator/ui/src/editor/gesture.ts` — keep shared thresholds and coordinate helpers.
- `animator/ui/src/editor/transformMath.ts` — existing transform geometry.
- `animator/ui/src/components/Stage.tsx` — pointer capture and tool dispatch.
- `animator/ui/src/render/canvasRenderer.ts` — selection overlay only.
- `animator/core/src/session.rs` — selection and effective transform resolution.
- `animator/core/src/command.rs` — MoveSelection / duplicate-drag command invariants.
- `animator/core/src/wasm.rs` and `ui/src/engine/client.ts` — stable bridge.

Do not implement this as direct React state mutation. The engine remains authoritative for document changes.
