# 03 — CURRENT KINEORA (evidence)

HEAD referenced: `29789e5`. Code is evidence (FL-0017).

---

## 1. Two panels, two truths

```
App.tsx
  LEFT DOCK:  LayersPanel          (width layout.layersW, 140–480)
  CENTER:     Stage
  RIGHT DOCK: Properties / Library / Dev
  BOTTOM:     TimelineStrip        (height layout.timelineH, 96–60% vh)
```

[CODE] `App.tsx` ~675–766.

They share **engine status** (`status.layers[]`, `active_layer`, `playhead`) but:

| Concern | LayersPanel | TimelineStrip | Synced? |
|---|---|---|---|
| Row source | `layers` reversed (front first) | same reverse + hide collapsed descendants | **same filter idea**, two copies of `ancestorCollapsed` |
| Row height | flex list, implicit ~24px | `ROW_H = 22` fixed | **NO** |
| Vertical scroll | own `overflowY` on `<ul>` | own `overflowY` on grid | **NO — they do not scroll together** |
| Name column | full name + flags | `NAME_W = 92` truncated name only | **duplicate names** |
| Eye / lock / outline | full F-07-02 | only hidden ✕ | **split** |
| Add / delete / folder | header buttons | **none** | only left panel |
| Frame cells | none | full grid | only bottom |
| Activate layer | click row | click name cell | both call `setActiveLayer` |
| Collapse folder | chevron | hides descendant **rows** | both hide descendants; **two implementations** |

This is why the product feels “alag”: the user edits layers on the left and frames on the bottom, and the **rows are not the same physical row**.

---

## 2. Data model (one scene = one timeline)

```
Document.scenes[i].layers[]     // bottom → top
Layer {
  id, name,
  keyframes: BTreeMap<u32, Frame>,   // Normal only (Folder = empty)
  tweens: BTreeMap<u32, ClassicTween>,
  visible, locked, outline, outline_color,
  kind: Normal | Folder,
  parent_id: Option<LayerId>,        // FOLDER nest, NOT transform parent
  collapsed
}
```

[CODE] `model.rs`. There is **no** `Timeline` struct. Duration = max keyframe frame (`timeline_duration`). Playhead = Session view state.

This already matches Blueprint 7.0 “sparse score”. **Do not add a second timeline object.**

---

## 3. What already works (do not rebuild)

### Frames (SYS-15, TimelineStrip + session.rs)

| Action | Shortcut | Engine | UI |
|---|---|---|---|
| Insert frame | F5 | `insert_frame` | button + shortcut |
| Insert keyframe | F6 | `insert_keyframe` | button + shortcut |
| Blank | F7 | `insert_blank_keyframe` | button |
| Delete frame | Shift+F5 | `delete_frame` | button |
| Clear key | Shift+F6 | `clear_keyframe` | button |
| Cell click = select (playhead does **not** move) | — | view | yes |
| Ruler click/drag = playhead | — | `set_playhead` | yes |
| Range drag select | — | view | yes |
| Copy/cut/paste/reverse/remove/dup frames | menu | session | sequence row |
| Convert to keys / blanks | — | session | buttons |
| Span-edge resize | drag hollow rect | `resize_span` | yes |
| Sequence-move key + hold | drag dot | `move_keyframe_sequence` | overwrite confirm |
| Alt-drag duplicate key | — | `duplicate_keyframe` | yes |
| Classic tween + ease | ~ Tween | `set_classic_tween` | yes |
| Frame label | input | `set_frame_label` | one content key |
| Ruler zoom 50–400% | −/+ | view | yes |
| Loop | button | view `setLoopEnabled` | yes |
| First / last / center | buttons | playhead | yes |
| `.` `,` Alt+`.` Alt+`,` Home End | yes | seek | TimelineStrip scope |

### Layers (SYS-16, LayersPanel + session.rs)

| Action | Engine | UI |
|---|---|---|
| Create layer / folder | `create_layer` / `create_folder` | + / 📁 |
| Delete (folder = subtree) | `delete_layer` | 🗑 |
| Duplicate (leaf deep copy) | `duplicate_layer` | ⧉ — **folder subtree BUG B-4** |
| Rename | `rename_layer` | dbl-click |
| Reorder ▲▼ / HTML5 drag | `move_layer` | yes |
| Drop on folder = nest | `set_layer_parent` | yes |
| Un-nest button | `set_layer_parent(None)` | ↩ |
| Collapse | `set_folder_collapsed` | ▸▾ |
| Eye / lock / outline | set_* | columns |
| Alt+click others | `toggle_other_layers_*` | yes |
| Drag-through column | per-flag commands | yes |
| Outline color | `set_layer_outline_color` | dbl-click swatch |
| `layer:changed{layerId,op}` | client emit | flash |

---

## 4. Known holes that **block** “Adobe-like one timeline”

1. **Physical split** — two components, two scrolls, two row heights.
2. **Timeline name column is a stub** — 92px, no eye/lock/outline, no add/delete.
3. **Folder frame ops** — F5/F6/F7 do not check `is_folder()` (LAYER B-2).
4. **Hidden folder children still evaluate** (LAYER B-1).
5. **Folder lock does not cascade** (LAYER B-3).
6. **Folder duplicate is shallow** (LAYER B-4).
7. **No seconds readout** (Blueprint 7.1.5).
8. **Name|grid splitter missing**.
9. **Onion / EMF missing** (out of this increment).
10. C-08 claims onion/camera/hamburger FUNCTIONAL — **false vs code**.

---

## 5. Row identity (critical for unify)

Engine order = `layers[0]` back … `layers[n-1]` front.

Both UIs **reverse** for display (front at top).

Unify **must**:

- Keep one array: `displayRows = reverse(layers).filter(!ancestorCollapsed)`.
- Bind **both** the chrome cells and the frame cells to `layer.id` (stable), never to a DOM index.
- `active_layer` stays an **engine index** at the Session; UI looks up by id then maps to index when calling wasm.

If chrome and grid are two maps over the same `displayRows`, they cannot desync.

---

## 6. Events (do not add)

Already enough:

- `document:changed{type:'layer'|'frame'|…}`
- `layer:changed{layerId,op}`
- `playhead:moved{frame}` (user seeks)
- `playback:started|stopped|paused`

Unify is a **view projection**. No new bus event (FL-0001).

---

## 7. Persistence

Workspace: `kineora.workspace` already stores panel sizes. Add **only**:

- `timelineNameW` (name-column width) — PREFS, not document.

Do **not** write playhead, zoom, loop, frame selection into the `.kineora` file (already view state).
