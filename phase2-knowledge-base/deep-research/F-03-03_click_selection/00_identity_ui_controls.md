# F-03-03 — CLICK SELECTION

```
SOURCE BLUEPRINT:  Part 03 — Selection System  (animate-blueprint/03_selection_system.md §3.3.1, §3.4)
DEEP FEATURE:      Click selection (single-click + double-click selection & drill-down)
QUEUE ID:          F-03-03
STATUS:            FULLY RESEARCHED → AUDITED (see 03_impl_tests_audit.md)
DEPENDS ON:        F-03-01 Hit testing · F-03-02 Selection data structure
FEEDS:             F-03-04 Shift/multi · F-03-05 Marquee · F-03-10 Sub-object · F-03-11/12/13 type selection
```

---

## A. IDENTITY

| Field | Value |
|---|---|
| 1. Official name | "Select objects with the Selection tool" (Adobe doc heading). The *single click* selects; the *double-click* additionally selects sub-parts or drills into edit modes. |
| 2. Alternate names | Click-to-select, click selection, double-click drill-down. |
| 3. Historical names | Same behavior in Flash era ("click to select"). |
| 4. Purpose | Map a **single pointer press-release** (or two within double-click time) into a selection result: select the hit object/sub-object, clear selection, or enter group/symbol edit. |
| 5. Feature category | Selection subsystem / input mapping. |
| 6. Related features | F-03-01 (which object), F-03-02 (selection state), F-03-04 (shift-add), F-03-05 (marquee = drag), F-03-16 (overlay feedback). |
| 7. Dependencies | Hit-testing, double-click detection (time+delta threshold), edit-mode state (breadcrumb). |
| 8. Current/legacy status | **Current.** Flash-era legacy: double-click a button (with "Enable Buttons" OFF) opened Instance Properties — replaced by Properties panel/context menu (E9). |

---

## EVIDENCE REGISTER

| # | Claim | Status |
|---|---|---|
| E1 | Click a stroke, fill, group, instance, or text block → selects that object. | [OFFICIAL] `selecting-objects.html` |
| E2 | Click a fill = fill only; click a stroke = stroke only; they are treated separately. | [SECONDARY VERIFIED] (tutorial) + [COMMUNITY REPORT] |
| E3 | Double-click a fill → selects the filled shape **and its stroked outline**. | [OFFICIAL] `selecting-objects.html` |
| E4 | Double-click one of a set of connected lines → selects all connected lines. | [OFFICIAL] same |
| E5 | Double-click a **group** (Selection tool) → enters group edit; outside content dims; double-click a blank spot exits (Edit All). | [OFFICIAL] `arranging-objects.html` |
| E6 | Double-click a **symbol instance** on stage → **Edit in Place**; exit via Back button / scene name / Edit > Edit Document / **double-click outside the symbol content**. | [OFFICIAL] `symbols.html` |
| E7 | Temporarily switch to Selection tool from another tool: hold **Control (Win) / Command (Mac)**. | [OFFICIAL] `selecting-objects.html` (au) |
| E8 | **Shift-selecting can be disabled** via an option in General Preferences. | [OFFICIAL] same (multiple locales) |
| E9 | **Enable Simple Buttons** (Control menu) — when ON, buttons respond to mouse events; **to select a button, drag a selection rectangle around it** (click no longer selects). Default = disabled while authoring. | [OFFICIAL] `creating-buttons.html` |
| E10 | Legacy Flash 4/5: with Enable Buttons OFF, **double-click a button** opened Instance Properties (removed workflow). | [OFFICIAL/LEGACY] `create-buttons.html` (kb) |
| E11 | Click a **frame in the Timeline** selects that layer's content between keyframes (stage selection). | [OFFICIAL] `selecting-objects.html` |
| E12 | Double-click to edit a symbol requires the **Selection or Free Transform tool** — the Subselection tool's double-click does **not** enter symbol edit. | [COMMUNITY REPORT] 2022 |
| E13 | Exiting deep nested edit is tedious — no single hotkey returns to the previous nesting level ("Edit Selected" toggle no longer works as it used to). | [COMMUNITY REPORT] 2018 |
| E14 | v19.2 user reported double-click no longer selecting stroke+fill; responder clarifies double-click **stroke** = all strokes, and to get stroke+fill **shift+click each**. | [COMMUNITY REPORT] 2019 (see CONTRADICTION C1) |

**Cross-refs:** F-03-01 E1–E19 (hit rules), F-03-02 E1–E12 (selection state).

---

## B. EXACT UI LOCATION

```
Tools panel → Selection tool (V)          ← the tool that performs click selection
Stage → (click / double-click)            ← the input surface
Preferences (Edit/Animate > Preferences) > General
 ├─ "Shift Select" (disable Shift-selecting)          [E8]
 └─ Contact-Sensitive (cross-ref F-03-01)
Control menu → Enable Simple Buttons                 [E9]
Edit menu → Select All / Deselect All
```

- 14. Shortcuts: `V` (tool); `Ctrl/Cmd` (temp-Selection) [E7]; `Shift` (add/deselect) [F-03-04]; `Ctrl/Cmd+A` / `Ctrl/Cmd+Shift+A`.
- 17. Disabled conditions: clicks on locked/hidden layers select nothing (F-03-01 E7).
- 18. Context-sensitive: result depends on the hit target type (F matrix) and edit scope (E-state).

---

## C. EVERY CONTROL (affecting click selection)

### C.1 "Shift Select" preference [E8]

| # | Field | Value |
|---|---|---|
| 19. Name | Shift Select (exact checkbox label not quoted in docs — behavior: "disable the Shift-selecting option") |
| 20. Purpose | Toggle whether **Shift+click adds to the selection**. |
| 21. Icon concept | checkbox |
| 24. Default value | **ON** (Shift-selecting enabled) [INFERENCE — docs describe disabling it as opt-out] |
| 25. Allowed | boolean |
| 36. Visibility | Preferences → General |

### C.2 Enable Simple Buttons (Control menu) [E9]

| # | Field | Value |
|---|---|---|
| 19. Name | Enable Simple Buttons |
| 20. Purpose | Toggle button **live behavior** on stage: ON = buttons react (Up/Over/Down); OFF = buttons behave as static symbols (selectable by click). |
| 24. Default | **OFF** (buttons disabled while authoring) [OFFICIAL] |
| 25. Allowed | boolean (toggle) |
| 36. Visibility | Control menu (authoring only) |
| Effect on click selection | ON → click on a button **activates** it (no selection); must **marquee** to select [E9]. OFF → click selects the button instance normally. |

---

## G. OPTION MATRIX

| Option | Default | ON | OFF | Dependencies | Conflicts | Edge cases |
|---|---|---|---|---|---|---|
| Shift Select [E8] | ON | Shift+click adds/deselects | Shift+click behaves as plain click (replaces) | none | none | muscle-memory users notice immediately if OFF |
| Enable Simple Buttons [E9] | OFF | button click = activate; **marquee to select** | button click = select | button instances | none | a button can't be both live and click-selected |
| Contact-Sensitive (cross-ref) | ON | — | — | marquee (not click) | none | — |

---

## D. INTERACTIONS (click family)

### D.37 Single click (press+release, no move ≥ threshold)

| Target | Result |
|---|---|
| Raw-shape **fill** | fill selected (speckled); stroke unselected [E1/E2] |
| Raw-shape **stroke** | that stroke selected [E1/E2] |
| Drawing object / group / instance / text / bitmap | whole object selected; bounding box (F-03-02 E3) |
| Empty stage / pasteboard | selection cleared (`kind:'none'`) |
| Locked/hidden layer content | nothing (hit skipped) — F-03-01 N |
| **Button** (Simple Buttons ON) | button activates (no selection) [E9] |
| Overlapping objects | top-most wins (F-03-01 E10) |

### D.38 Double click (two clicks within time+delta threshold)

| Target | Result |
|---|---|
| Raw-shape **fill** | fill **+ stroke** selected together [E3] |
| Raw-shape **stroke** (connected) | all connected stroke segments [E4] |
| Group | **Edit group in place**; outside dims [E5] |
| Symbol instance | **Edit in Place** (symbol edit); outside dims; breadcrumb updates [E6] |
| Text block | enter **text edit** (caret) [blueprint Part 03 §3.4.5 — OBSERVED] |
| Blank spot (while editing a group) | **Edit All** — exit group edit [E5] |
| Outside symbol content (while edit-in-place) | exit edit-in-place [E6] |
| Button (legacy, Simple Buttons OFF) | opened Instance Properties (removed) [E10] |
| With Subselection tool | **does not** enter symbol edit [E12] |

**Double-click detection rule (our app):** two clicks within `doubleClickTime` (system, ~500 ms) and `doubleClickDistance` (≤ 4 px desktop / ≤ 24 px touch) = double-click; otherwise two single clicks. The **first click of a double-click performs the single-click selection** before the drill (user sees selection flash, then edit mode).

### D.45 Keyboard modifier (during click)

| Modifier | Effect |
|---|---|
| Shift | add/deselect target (F-03-04); disabled if Shift Select OFF [E8] |
| Ctrl/Cmd (held, other tool active) | temporarily activate Selection tool [E7] |

### D.48 Touch: tap = click; double-tap = double-click (drill); tap empty = clear; long-press = context menu.

### D.49 Stylus: tap = click (1-px tolerance); double-tap = double-click; barrel = context menu.

---

## E. FEATURE STATES

| State | Click behavior |
|---|---|
| Nothing selected | AVAILABLE — click selects |
| Single selected | AVAILABLE — click replaces |
| Multiple selected | AVAILABLE — click collapses to single hit; Shift toggles (F-03-04) |
| Edit-in-place (group/symbol) | PARTIAL — clicks resolve inside edit scope; dimmed content not clickable; blank/double-outside exits [E5/E6] |
| Simple Buttons ON | DIFFERENT — button clicks activate instead of select [E9] |
| Layer locked/hidden | DISABLED for that layer |
| During playback | DIFFERENT — resolves at current frame (F-03-01 E) |
| Subselection tool active | DIFFERENT — anchors, not objects (F-03-02) |

---

## F. OBJECT COMPATIBILITY (click result per type)

| Type | Single click | Double click |
|---|---|---|
| Raw shape fill | fill | fill+stroke [E3] |
| Raw shape stroke | stroke | connected strokes [E4] |
| Drawing object | whole | edit-in-place (object) |
| Group | whole | edit group [E5] |
| Graphic instance | instance | edit in place [E6] |
| Movie clip instance | instance | edit in place [E6] |
| Button instance (buttons OFF) | instance | edit in place [E6] |
| Button instance (buttons ON) | activates [E9] | activates |
| Bitmap | bitmap | select (no edit) |
| Text | block | text edit |
| Bone | bone (Part 14) | (armature rules) |
| Mask shape | shape | (shape rules) |
| Camera / frame / layer / scene / audio | n/a (not stage click targets) | n/a |

---

## H/I/J/K — TIMELINE · SYMBOL · LAYER · CROSS-FEATURE (click-specific)

- **H. Timeline:** stage click = object selection at current frame; a **timeline frame-cell click** selects that layer's content between keyframes [E11] — the reverse mapping (F-03-02 L.2 covers the coupling).
- **I. Symbol:** double-click instance = Edit in Place [E6]; the **instance** (not inner frames) is the single-click unit. Exit paths: Back / scene name / Edit Document / double-click outside [E6].
- **J. Layer:** locked/hidden excluded; outline-mode layers still clickable (F-03-01 J).
- **K. Cross-feature:** click → `selection:changed` → panels re-bind (F-03-02 P). Click during playback resolves live. Click on a button with Simple Buttons ON routes to the button's event, not selection [E9].

---

## N. ERROR / FAILURE BEHAVIOR

| Failure | Result | Class |
|---|---|---|
| Click locked/hidden | no selection, no message | Silent skip (F-03-01 N) |
| Double-click expecting edit with Subselection active | nothing happens [E12] | Silent (tool-scope) |
| Double-click a bitmap/text | no drill (only select / text-edit) | Designed |
| Click a live button expecting selection | button activates | Designed [E9] |
| Double-click with Shift held | [UNCERTAIN] — Shift+double-click not documented; treat as shift of the double-click result | Mark [UNCERTAIN] |
