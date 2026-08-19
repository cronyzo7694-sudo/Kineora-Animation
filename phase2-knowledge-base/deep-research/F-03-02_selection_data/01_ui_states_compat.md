# F-03-02 — B. UI LOCATION · E. STATES · F. COMPATIBILITY · G. OPTIONS

---

## B. EXACT UI LOCATION (where the selection structure surfaces)

The structure itself is invisible; it surfaces through four readouts/controls:

```
Preferences (Edit/Animate > Preferences) > General
 ├─ Highlight Color section                    ← per-object-type bounding-box colors [E6]
 ├─ Contact-Sensitive Selection and Lasso      ← (F-03-01 G; governs what can enter targets)
 └─ (selection-related prefs)

Properties panel
 └─ Position and Size section
     └─ Registration/Transformation point toggle   ← readoutPoint [E8]

Info panel (Window > Info)
 ├─ size / location / registration-point / RGB(A) / pointer  [E7]
 └─ Registration/Transformation point toggle button          [E8]

Timeline panel
 ├─ Frame cells (click → selectedFrames, span-based per [E9])
 └─ Layer rows (click → selectedLayers / activeLayerId)

View menu
 └─ Hide Edges   ← suppresses selection highlight [E5]
```

- 9. Main location: n/a (distributed — see above).
- 10–13. Menu/toolbar/panel/context paths: as listed.
- 14. Shortcuts: Ctrl+Shift+A (deselect all), Ctrl+A (select all), Shift+click (deselect individual) [E4].
- 15. Workspace dependency: none.
- 16. Visibility conditions: readouts only show when a selection exists.
- 17. Disabled conditions: readouts empty/zero when nothing selected.
- 18. Context-sensitive: `commonType` decides which Properties schema renders (single vs mixed) [E1/E2].

---

## E. FEATURE STATES (what the structure holds in each state)

| State | `kind` | `targets` | `bounds` | `commonType` | Readouts |
|---|---|---|---|---|---|
| Nothing selected | `none` | [] | null | null | document schema (Properties) |
| Single object | `objects` | [1] | object AABB | exact type | full type schema [E1] |
| Multiple (same type) | `objects` | [n] | union AABB | that type | type schema + union dims |
| Mixed types | `objects` | [n] | union AABB | `mixed` | **only x/y/w/h** [E2] |
| Fill sub-object | `objects` | [{node,subPath:fill}] | fill region box | `shape.fill` | fill style schema |
| Stroke sub-object | `objects` | [{node,subPath:stroke}] | stroke bounds | `shape.stroke` | stroke style schema |
| Anchors (Subselection) | `anchors` | anchorIds | anchor cloud box | `path` | anchor/handle readout |
| Frames (timeline) | `objects`\|`none` (stage unchanged) | — | — | — | frame schema (Part 26) |
| Layers (timeline) | (stage unchanged) | — | — | — | layer ops enabled |
| Locked layer content | excluded (never enters targets) | — | — | — | — |
| Hidden layer content | excluded | — | — | — | — |
| During playback | resolves at current frame (F-03-01 E-states) | — | — | — | — |

**AVAILABLE / PARTIAL / DISABLED / DIFFERENT:**
- **AVAILABLE:** all normal states; selection structure always writable.
- **PARTIAL:** mixed selection (only common props); anchor selection (only path ops).
- **DISABLED:** nothing — the structure has no failure mode; it degrades to `none`.
- **BEHAVES DIFFERENTLY:** during playback (targets re-resolved per frame); edit-in-place (targets scoped to edit context).

---

## F. OBJECT COMPATIBILITY (how each type maps into `targets`)

| Object type | Target form | `commonType` | Notes |
|---|---|---|---|
| Raw shape (fill) | `{nodeId, subPath:"fills[i]"}` | `shape.fill` | fill-only selection (F-03-01 E12) |
| Raw shape (stroke) | `{nodeId, subPath:"strokes[i]"}` | `shape.stroke` | stroke-only selection |
| Drawing object | `{nodeId}` | `drawingObject` | atomic |
| Group | `{nodeId}` | `group` | atomic (children inside edit scope) |
| Symbol instance (graphic/movie clip/button) | `{nodeId}` | `symbolInstance` | atomic |
| Bitmap | `{nodeId}` | `bitmap` | atomic |
| Text block | `{nodeId}` | `text` | atomic; double-click → text-edit |
| Bone | `{nodeId}` (bone ID) | `bone` | Part 14 |
| Warp pin | `{nodeId, subPath:"warp.pins[i]"}` | `warpPin` | Part 02d |
| Camera | (not in `targets`) | — | camera is not a stage selection |
| Frame | timeline domain | — | `selectedFrames` [E9/E11] |
| Layer | timeline domain | — | `selectedLayers` |
| Scene | n/a | — | scene panel |
| Audio | n/a | — | waveform/frame attachment |

---

## G. OPTION MATRIX

| Option | Default | ON | OFF | Deps | Conflicts | Edge cases |
|---|---|---|---|---|---|---|
| **Highlight color per type** [E6] | per-type preset | selected objects of that type draw that box color | — | Preferences | none | color-blind users set distinct hues |
| **Reg/Transform readout** [E8] | registration | Info/Properties show registration-point coords | show transformation-point coords | a selection exists | none | identical values when the two points coincide |
| **Span-based selection** [E9] | [UNCERTAIN] (ours: ON) | one cell click selects the keyframe span | one cell = one frame | timeline | none | single-frame spans = same either way |
| **Contact-sensitive** (cross-ref F-03-01 G) | ON | touched objects enter targets | enclosed only | marquee/lasso | none | raw shapes always region-select |
| **Hide Edges** [E5] | OFF | highlight suppressed | highlight shown | any selection | none | still selectable; just not drawn |
| **Deselect individual** (Shift+click) [E4] | — | removes that item from targets | — | multi-selection | none | last item removed → `none` |
