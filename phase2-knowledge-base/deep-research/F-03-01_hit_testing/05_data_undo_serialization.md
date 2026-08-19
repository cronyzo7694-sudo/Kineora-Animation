# F-03-01 — O. DATA MODEL · P. EVENTS · Q. UNDO/REDO · R. SERIALIZATION

---

## O. DATA MODEL (logically required)

Separated into the three layers (blueprint Part 03 §3.0):

### DOCUMENT STATE (persisted — Part 33)
```jsonc
// The hit-test INPUTS (not the selection itself):
"layers": [
  { "id":"L1", "visible": true, "locked": false, "type":"normal",
    "frames": [ { "type":"keyframe", "content":[
        { "id":"n1", "type":"shape", "path":{...}, "fills":[...], "strokes":[...] },   // raw shape
        { "id":"n2", "type":"drawingObject", ... },
        { "id":"n3", "type":"symbolInstance", "symbolId":"arm" },
        { "id":"n4", "type":"group", "children":[...] },
        { "id":"n5", "type":"text", ... },
        { "id":"n6", "type":"bitmap", "width":512, "height":512 }
    ] } ]
  }
]
// Object stack order = content array order (back→front) [OFFICIAL E10]
```
Hit testing **reads** `layers[]` (top→bottom), each layer's **current-frame content** (front→back), and each object's **transform** + **geometry** (path/fills/strokes, or bounds). It **writes nothing**.

### VIEW STATE (not persisted)
```jsonc
"selection": {
  "kind": "objects",
  "targets": [
    { "nodeId":"n1", "subPath":"fills[0]" },      // fill sub-object
    { "nodeId":"n1", "subPath":"strokes[0]" },    // stroke sub-object
    { "nodeId":"n3" }                              // whole instance
  ],
  "bounds": { "x":0,"y":0,"w":0,"h":0 },          // union box (computed, cached)
  "commonType": "shape"
}
```

### TEMPORARY INTERACTION STATE (marquee in progress)
```jsonc
{ "marquee": { "active": true, "start":{x,y}, "current":{x,y},
               "previewTargets":[...], "contactSensitive": true } }
```
Plus per-hit-test caches (not part of the document): the **spatial index** and **transformed-bounds cache** (see V/performance).

---

## P. EVENTS

> Adobe's internal event names are not public → the event model below is **[OUR DESIGN DECISION]**, aligned with blueprint Part 32 (event bus).

| Event | Trigger | Payload | Subscribers | UI response |
|---|---|---|---|---|
| `selection:changed` | click / marquee / select-all / deselect / undo-restore | `{ prevTargets, targets, kind, commonType, bounds }` | Properties panel, Info panel, Transform panel, overlay renderer, context-menu builder, Actions panel | re-render each panel's schema; redraw overlay |
| `selection:preview` (throttled) | marquee drag continuation | `{ previewTargets }` | overlay renderer | live marquee highlight |
| `hit:locked` / `hit:hidden` | click resolves to skipped content | `{ point, layerId }` | toast service, cursor manager | "no-entry" cursor / toast (our improvement, L.4) |
| `document:changed` | (post-hit) a command mutates the model | `{ type, targets }` | stage, timeline, properties | re-render changed region |

**Emit rule:** `selection:changed` fires **once per gesture** (never per pointer-move); `selection:preview` is throttled (~60 Hz) during drag only.

---

## Q. UNDO / REDO

| Question | Answer |
|---|---|
| Is a click-selection one undoable operation? | **No.** Selection is view state; it does not enter the undo stack. |
| Does dragging (marquee) create one? | The marquee itself: **no**. The **follow-up command** (move/cut/delete/fill) is one undoable entry. |
| Does multi-selection create one? | **No** (selection only). |
| Does property editing create one? | **Yes** — each property commit is one command (Part 36). |
| What happens after undo? | The command is reverted; **selection is restored** to what was captured *before* the command ran (commands store `prevSelection`). |
| After redo? | Command re-applied; selection restored to the command's post-state. |
| After save/reload? | Selection is not persisted → cleared on reload (R below). |

**Coalescing rule:** marquee + immediate move = still one command (the move). Rapid click-click-click selections produce **no** undo entries at all.

---

## R. SERIALIZATION

| Question | Answer |
|---|---|
| What must persist? | Layer visibility/lock, frame content, object transforms/geometry — i.e., the **hit-test inputs**. |
| What can be regenerated? | The selection, spatial index, transformed-bounds cache, marquee state. |
| What references must remain stable? | `nodeId` and `symbolId` (rename-safe, Part 33 convention). |
| What is document state? | layers, frames, content, transforms, styles, symbols. |
| What is UI-only? | `selection`, `marquee`, playhead, view zoom/pan, panel layout. |

**Consequence for hit testing:** a reloaded document must be **re-hit-testable identically** — this is a test (08_tests.md, TS-11).
