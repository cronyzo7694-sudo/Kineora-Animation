# F-03-02 — SELECTION DATA STRUCTURE

```
SOURCE BLUEPRINT:  Part 03 — Selection System  (animate-blueprint/03_selection_system.md §3.0, §3.9, §3.8)
DEEP FEATURE:      Selection data structure (the representation of "what is selected")
QUEUE ID:          F-03-02
STATUS:            FULLY RESEARCHED → AUDITED (see 06_audit.md)
DEPENDS ON:        F-03-01 Hit testing (produces the targets this structure holds)
FEEDS:             F-03-03 Click · F-03-04 Shift/multi · F-03-05 Marquee · F-03-10 Sub-object · F-03-16 Overlay
```

---

## A. IDENTITY

| Field | Value |
|---|---|
| 1. Official name | No single official name — the observable concept is "the current selection" (selected objects / selected items / mixed selection). Adobe docs describe behavior, not an internal structure. |
| 2. Alternate names | Selection set, active selection, highlighted items. |
| 3. Historical names | Same concept in Flash era ("selected objects"). |
| 4. Purpose | Hold **what is currently selected** (stage objects + timeline frames/layers) so tools, panels, and commands can act on it; carry the derived data (union bounds, common type, readout point) panels display. |
| 5. Feature category | Selection subsystem / editor core state. |
| 6. Related features | F-03-01 Hit testing, F-03-03/04/05/10 (producers), F-03-16 Overlay (consumer), F-03-17 Events, Properties/Info/Transform panels (consumers). |
| 7. Dependencies | Document model (node IDs), hit-testing, panel schema registry. |
| 8. Current/legacy status | **Current** (behavior stable since Flash). Adobe's internal representation is not public → the *structure* below is [OUR DESIGN DECISION]; the *observable behavior* is [OFFICIAL]/[COMMUNITY]. |

---

## EVIDENCE REGISTER

| # | Claim | Status |
|---|---|---|
| E1 | Selecting a single object → Properties shows its stroke, fill, pixel dimensions, and x/y of its **transformation point**. | [OFFICIAL] `selecting-objects.html` |
| E2 | **Mixed selection** (multiple items) → Properties shows **pixel dimensions and x/y of the selected set of items** (union). | [OFFICIAL] same |
| E3 | When an object is selected, a **rectangular box** appears around it. | [OFFICIAL] same |
| E4 | **Deselect All** = Edit > Deselect All / Ctrl+Shift+A. **Deselect individual items** = Shift+click the item with the Selection tool. | [OFFICIAL] same |
| E5 | **Hide Edges** (View > Hide Edges) hides selection highlighting; toggle again to show. | [OFFICIAL] same |
| E6 | **Custom bounding-box colors per object type**: Preferences > General > **Highlight Color** section. | [OFFICIAL] `selecting-objects.html` |
| E7 | **Info panel** shows size, location, registration-point location, **R/G/B/A** (if solid fill), and pointer location. | [OFFICIAL] `symbol-instances.html` |
| E8 | **Registration vs Transformation point toggle**: Info panel button + Properties "Position and Size" section toggle which point's x/y is displayed. | [OFFICIAL] `symbol-instances.html` + `transforming-combining…` |
| E9 | **Span-based selection** (timeline): an option makes clicking one frame cell select the whole range **from the previous keyframe to just before the next keyframe**. | [COMMUNITY REPORT] 2018 thread |
| E10 | **Stage↔timeline selection sync quirk**: selecting a symbol on stage selects **all frames in that layer** (timeline highlights); clicking a frame while the layer is "selected" re-selects all its frames. | [COMMUNITY REPORT] 2023 thread |
| E11 | Clicking a **frame in the timeline** selects that layer's content **between keyframes** (stage). | [OFFICIAL] `selecting-objects.html` |
| E12 | Selection does not include locked/hidden layers (Select All exclusion) — carried from F-03-01 E7. | [OFFICIAL] |

**Cross-references:** F-03-01 evidence E1–E19 (hit behavior), blueprint Part 03 §3.8 (outline vs bounding box vs handles vs anchor) and §3.9 (selection events/undo).

---

## CONTRADICTION AUDIT (C1–C2)

### C1 — Stage selection highlighting all frames of a layer (E10) vs frame-click selecting content between keyframes (E11)
- **Source A [OFFICIAL]** E11: click a frame → selects that layer's content between keyframes.
- **Source B [COMMUNITY REPORT]** E10: select a symbol on stage → "it will select all that frames in that layer"; clicking a single frame afterward can re-select the whole layer's frames.
- **Possible explanation:** the timeline highlights the **frame span(s) that carry the selected object**; with a symbol placed across many frames, that span is large, so "all frames light up." Clicking a frame **within that already-highlighted span** behaves as span-selection (E9) rather than collapsing to one frame — hence the "won't deselect" frustration.
- **Current verified conclusion:** both real; the sync is **span-highlight driven**, and span-based selection (E9) amplifies the confusion. Documented as L.2 with a fix for our app.
- **Confidence:** MEDIUM (B is community; A is official; mechanism is inference).

### C2 — Span-based selection default ON or OFF?
- **Source A [COMMUNITY 2018]:** "timeline options have a span based selection option. **If that is checked**, clicking a single cell will select the whole range…"
- **Source B:** no official doc states the default.
- **Possible explanation:** exists as a toggle; default uncertain (users report it being effectively active, E10).
- **Current verified conclusion:** feature exists; default **[UNCERTAIN]**. Our app: **ON by default** (matches reported behavior) with a visible toggle.
- **Confidence:** LOW (default value).

---

## O. DATA MODEL (the structure — [OUR DESIGN DECISION] for internals)

Selection has **two domains**; they coexist and weakly sync (L.2):

```jsonc
"selection": {
  // DOMAIN 1 — stage objects
  "kind": "objects",                    // 'objects' | 'anchors' | 'none'
  "targets": [                          // ordered list of hit targets (F-03-01)
    { "nodeId":"n1", "subPath":"fills[0]" },   // raw-shape fill sub-object
    { "nodeId":"n1", "subPath":"strokes[0]" }, // raw-shape stroke sub-object
    { "nodeId":"n3" }                          // whole drawing object / instance / group / text / bitmap
  ],
  "anchorIds": [],                      // when kind==='anchors' (Subselection)
  "bounds": { "x":0, "y":0, "w":0, "h":0 },    // union bounding box (derived, cached) [E2/E3]
  "commonType": "shape",                // derived: common ancestor type for Properties panel
  "readoutPoint": "registration",       // 'registration' | 'transformation' — view-state toggle [E8]

  // DOMAIN 2 — timeline (frames/layers)
  "timeline": {
    "selectedLayers": [ "L2" ],                          // layer rows selected (rename/delete/reorder)
    "activeLayerId": "L3",                              // where drawing goes (pencil icon)
    "selectedFrames": [ { "layerId":"L2", "start":1, "end":10, "spanBased":true } ],  // [E9/E11]
    "selectedFrameCount": 10
  }
}
```

### Derived fields & their rules

| Field | How derived | Rule |
|---|---|---|
| `bounds` | union of each target's **axis-aligned transformed bounds** | rotated objects contribute their rotated AABB (blueprint Part 03 §3.4.10); cached, invalidated on transform/doc change |
| `commonType` | most-specific common category of all targets | mixed shape+instance → shows only common fields (x/y/w/h) [E2]; single target → its exact type schema |
| `readoutPoint` | user toggle (Info panel / Properties) | view-state, persists in **app prefs** (not document) [E8] |

### Why the two domains are separate
- Stage selection drives **Properties/Info/Transform/overlay** and editing commands.
- Timeline selection drives **frame/layer ops** (insert/delete/copy frames, layer rename/delete).
- They are **different panels, different commands** — one structure but two independently-managed sub-states (the E10 quirk is the *unintended* coupling; our app makes the coupling **explicit and controllable**, see Y).

### DOCUMENT vs VIEW vs TEMPORARY state
- **Document state:** node IDs, transforms, styles, symbols (what selection *references*).
- **View state:** everything in `selection` above + `readoutPoint` (pref) + Hide-Edges flag.
- **Temporary interaction state:** marquee preview targets, lasso path in progress (never in the selection structure).

---

## P. EVENTS ([OUR DESIGN DECISION] model)

| Event | Trigger | Payload | Subscribers |
|---|---|---|---|
| `selection:changed` | click/marquee/select-all/deselect/undo-restore/object-delete | `{ prevTargets, targets, kind, commonType, bounds }` | Properties, Info, Transform, overlay, context-menu builder |
| `timelineSelection:changed` | frame/layer click/drag in timeline | `{ selectedFrames, selectedLayers, activeLayerId }` | Timeline panel, frame Properties, Edit menu (frame ops enabled/disabled) |
| `readoutPoint:changed` | reg/transform toggle | `{ point }` | Info panel, Properties Position&Size |
| `selection:hidden:changed` | Hide Edges toggle | `{ hidden }` | overlay renderer |
| `selection:lost` | selected node deleted / scrubbed away | `{ nodeIds }` | stage (clear), toast |

**Emit rule:** `selection:changed` once per gesture (F-03-01 P). `selection:lost` is how the structure handles M-edge-cases (deleted/vanished objects).

---

## Q. UNDO / REDO

| Question | Answer |
|---|---|
| Is selection undoable? | **No.** Selection is view state. |
| Does a command restore selection? | **Yes** — every command stores `prevSelection` and restores it on undo/redo (blueprint Part 36). |
| Does timeline frame-selection create undo entries? | **No** (view state). |
| What if the selected object was deleted by an undone command? | `selection:lost` fires; selection clears (or restores to nearest surviving set — our app restores survivors). |
| After save/reload? | Selection is cleared (R). |

---

## R. SERIALIZATION

| What | Persisted? |
|---|---|
| `targets`, `bounds`, `commonType`, `kind`, `anchorIds` | **No** (recomputed on load; cleared) |
| `timeline.selectedFrames/Layers` | **No** |
| `activeLayerId` | **Yes** — saved as a convenience (last-active layer), optional |
| `readoutPoint`, Hide-Edges | **Yes, app prefs** (not the document) |
| Highlight colors per type | **Yes, app prefs** [E6] |
| Span-based selection toggle | **Yes, app prefs** [E9] |

**Invariant:** a reloaded document is re-selectable identically (nodes/IDs stable); the selection itself starts empty.
