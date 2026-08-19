# F-03-03 — O–Y IMPLEMENTATION · TEST MATRIX · AUDITS

---

## O. DATA MODEL (click result → selection state)

Click selection **writes the selection structure** (F-03-02 O) and, on double-click drill, **edit-mode state**:

```jsonc
// produced by a click:
"selection": { "kind":"objects", "targets":[ { "nodeId":"n1", "subPath":"fills[0]" } ],
               "bounds":{...}, "commonType":"shape.fill" }

// produced by double-click drill (edit-in-place):
"editMode": { "scope":"symbol", "symbolId":"arm", "breadcrumb":["scene","character","arm"] }   // view state
```

| Layer | What click writes |
|---|---|
| DOCUMENT STATE | nothing (selection + edit mode are not document state) |
| VIEW STATE | `selection` (F-03-02) + `editMode` (breadcrumb) |
| TEMPORARY | double-click pending timer (first click + pending second) |

---

## P. EVENTS ([OUR DESIGN DECISION] model)

| Event | Trigger | Payload | Subscribers |
|---|---|---|---|
| `selection:changed` | single/double click | F-03-02 P | panels + overlay |
| `editMode:entered` | double-click group/symbol | `{ scope, symbolId, breadcrumb }` | breadcrumb UI, stage dimming, timeline |
| `editMode:exited` | Back / Esc / double-click-outside | `{ scope }` | same |
| `button:activated` | click live button (Simple Buttons ON) | `{ instanceId, state }` | (routed to behavior system, not selection) |

---

## Q. UNDO / REDO

- A click (single or double) produces **no undo entry** — selection and edit-mode are view state.
- The **edits made inside** edit-in-place ARE commands (normal undo).
- Undo/redo restores `prevSelection` (and, our addition, `prevEditMode`) captured by each command.
- Double-click drill then immediately Back = **zero** undo entries.

---

## R. SERIALIZATION

- `selection`, `editMode`, double-click pending state: **not persisted**.
- `Shift Select`, `Enable Simple Buttons` (last state), double-click thresholds: **app prefs**.
- Document unchanged by clicks → reload clears selection & exits edit mode.

---

## S. MOBILE

| Desktop | Mobile |
|---|---|
| Click | Tap (24 px tolerance) |
| Double-click (drill) | Double-tap |
| Double-click fill (fill+stroke) | Double-tap fill |
| Click empty (clear) | Tap empty |
| Shift+click | Select-mode toggle (or long-press) |
| Ctrl/Cmd temp-Selection | not needed (V button always available) |
| Enable Simple Buttons toggle | toolbar toggle |

Precision: double-tap detection uses the **same time window** as desktop but a larger distance tolerance (24 px); accidental double-taps on small objects are mitigated by the finger loupe (F-03-01 S).

---

## T. STYLUS

- Tap = click (1-px tolerance); double-tap = drill; barrel button = context menu (no drill).
- No pressure/tilt effect on click selection.

---

## U. ACCESSIBILITY

- Keyboard: `V` then `Enter` to **select the top-most object at the last focus point**? [OUR DESIGN DECISION — a keyboard fallback for click]; arrow keys move selection (post-click).
- `Esc` = exit one edit level (L.2 fix); `Ctrl+Enter` = exit to root.
- Focus ring on the selected object; selection announced via live region ("1 shape selected").
- Double-click time threshold respects OS accessibility settings (slower double-click speed).

---

## V. PERFORMANCE

- Click = one hit test (F-03-01 V) + one selection-write (O(1) targets, O(n) bounds for multi).
- Double-click = hit test + edit-mode entry (re-render dimmed scope — cache non-scope layers).
- No per-click heavy work; overlay re-renders once per `selection:changed`.

---

## W. REAL WORKFLOWS

### W.1 Select and move a raw shape (fill+stroke together)
1. `V` → **double-click the fill** → fill+stroke selected [E3].
2. Drag → both move; release = one MoveCommand.

### W.2 Edit a symbol in place, then return
1. Double-click the instance → Edit in Place; outside dims [E6].
2. Edit artwork → all instances update live.
3. **Double-click outside the symbol content** (or click Back) → exit [E6].

### W.3 Reach a button to edit it while it's "live"
1. Control > Enable Simple Buttons is ON → clicking activates the button [E9].
2. **Drag a selection rectangle around the button** → button selected [E9].
3. Edit via Properties (or toggle Simple Buttons OFF and click).

### W.4 Drill 3 levels deep and come back quickly
1. Double-click character → head → eye (3 edits-in-place).
2. (Animate) click Back ×3. (Ours) **Esc ×3** or **Ctrl+Enter** to jump to root [L.2 fix].

---

## X. ALTERNATIVE METHODS (same selection result)

| Goal | Method A (click) | Method B | Method C | Best |
|---|---|---|---|---|
| Select fill+stroke | double-click fill [E3] | Shift+click fill, stroke | marquee the shape | A fastest |
| Select connected strokes | double-click a stroke [E4] | Shift+click each | marquee | A |
| Edit a symbol | double-click instance [E6] | right-click → Edit in Place | Edit > Edit Symbols | A fastest; B explicit |
| Select a live button | marquee [E9] | toggle Simple Buttons OFF then click | click in Outline mode | depends |
| Clear selection | click empty | Ctrl+Shift+A | Esc (some contexts) | A/B |

---

## Y. IMPLEMENTATION FOR OUR ORIGINAL APP  [OUR IMPLEMENTATION]

### Y.1 Click/double-click state machine
```
Idle ──pointerdown──▶ Press
Press ──pointerup (no move)──▶ PendingClick (start double-click timer)
PendingClick ──timer expire──▶ Commit(singleClick) → selection:changed → Idle
PendingClick ──second pointerdown/up within time+delta──▶ Commit(doubleClick)
Commit(doubleClick) ──target is group/symbol──▶ editMode:entered + dim
                     ──target is fill/stroke/text/else──▶ selection update
```

### Y.2 Rules ([OUR DESIGN DECISION] where Adobe internals are private)
1. Click = hit test (F-03-01) → build target (F-03-02 F matrix) → `controller.set`.
2. Double-click = per-target table (D.38).
3. **Thresholds:** move ≥ 3 px → drag (not click); double-click time from OS settings; distance 4 px desktop / 24 px touch.
4. **Shift Select** pref gates Shift-add (C.1) [OFFICIAL behavior].
5. **Enable Simple Buttons** pref routes button clicks to activation [OFFICIAL behavior]; ours adds **Alt+click = force-select a live button** (L.1 fix).
6. **Esc = exit one edit level** (L.2 fix); Ctrl+Enter = exit to root.
7. `selection` and `editMode` never enter undo (Q).

### Y.3 Events / panels: P section; breadcrumb subscribes to `editMode:*`.

### Y.4 Undo/serialization: Q/R sections.

### Y.5 Desktop/mobile/stylus/performance: S/T/V sections.

### Y.6 Testing: below.

---

## TEST MATRIX (F-03-03)

| ID | Category | Test | Expected |
|---|---|---|---|
| TS-01 | Normal | Click a shape's fill | fill selected; stroke not [E1/E2] |
| TS-02 | Normal | Click a stroke | stroke selected |
| TS-03 | Normal | Click a group/instance/text/bitmap | whole object selected |
| TS-04 | Normal | Click empty | selection cleared |
| TS-05 | Normal | Double-click a fill | fill+stroke [E3] |
| TS-06 | Normal | Double-click a connected stroke | all connected strokes [E4] |
| TS-07 | Normal | Double-click a group | edit group; outside dims [E5] |
| TS-08 | Normal | Double-click a symbol instance | edit in place [E6] |
| TS-09 | Normal | Double-click outside symbol content | exit edit-in-place [E6] |
| TS-10 | Normal | Double-click blank while group editing | Edit All — exit [E5] |
| TS-11 | Boundary | Two slow clicks (≥ time) | two separate single selections |
| TS-12 | Boundary | Click-drag < 3 px | treated as click |
| TS-13 | Boundary | Double-click with Subselection tool | no symbol edit [E12] |
| TS-14 | Boundary | Shift+click with Shift Select OFF | replaces selection (no add) [E8] |
| TS-15 | Invalid | Click locked/hidden layer | nothing selected |
| TS-16 | Empty | Click empty (already empty) | stays empty; no error |
| TS-17 | Multi | Shift+click third object | added; then Shift+click it again → removed (F-03-04) |
| TS-18 | Locked | Click locked object | skipped |
| TS-19 | Hidden | Click hidden layer | skipped |
| TS-20 | Nested | Double-click 3-deep symbol | descends one level per double-click [E6] |
| TS-21 | Nested | Esc (ours) | exits one level [L.2] |
| TS-22 | Undo | Click → move → undo | selection restored; click itself not in stack |
| TS-23 | Redo | → redo | selection restored |
| TS-24 | Save/Reload | select → save → reload | selection cleared; edit mode exited |
| TS-25 | Import/Export | (no effect) | — |
| TS-26 | Playback | click tweened instance mid-span | selects at live frame |
| TS-27 | Mobile | Tap shape | select; double-tap group = drill |
| TS-28 | Touch | Tap empty | clear; long-press = menu |
| TS-29 | Stylus | tap + barrel | select + context menu |
| TS-30 | Performance | 10k objects click | < 1 ms |
| TS-31 | Buttons | Simple Buttons ON + click button | activates, not selected [E9] |
| TS-32 | Buttons | Simple Buttons ON + marquee button | selected [E9] |
| TS-33 | Buttons | Simple Buttons OFF + click button | selected |
| TS-34 | Buttons | Alt+click live button (ours) | force-select [L.1] |
| TS-35 | Double-click | double-click bitmap | select only (no edit) |
| TS-36 | Double-click | double-click text | text edit |

---

## CONTRADICTION AUDIT

### C1 — Does double-click select fill+stroke? (official vs community regression report)
- **Source A [OFFICIAL]** `selecting-objects.html`: "To select a filled shape and its stroked outline, double-click the fill."
- **Source B [COMMUNITY REPORT 2019]** v19.2 user: double-click no longer selects stroke+fill; responder: double-click **stroke** selects all stroke parts; to get stroke+fill, **shift+click each**.
- **Possible explanation:** (i) user double-clicked the **stroke** (which correctly selects strokes only — E4), or (ii) a transient v19 regression. The official doc (2022/2023) still documents the fill behavior → treat as current.
- **Current verified conclusion:** double-click **fill** = fill+stroke (current, official); double-click **stroke** = connected strokes. Community report = target confusion or transient bug.
- **Confidence:** HIGH for current behavior.

### C2 — Enable Simple Buttons default & selection blocking
- **Source A [OFFICIAL]** "By default, Animate keeps button symbols **disabled** as you create them." + "To select a button… drag a selection rectangle."
- **Source B [OFFICIAL]** same doc: "To enable… choose Control > Enable Simple Buttons."
- **Possible explanation:** none — consistent.
- **Current verified conclusion:** default OFF; ON blocks click-selection (marquee required). No contradiction.
- **Confidence:** HIGH.

---

## COMPLETENESS MATRIX

| Category | Status | | Category | Status |
|---|---|---|---|---|
| UI | COMPLETE | | Rigging | COMPLETE (bone click) |
| Controls | COMPLETE (Shift Select, Simple Buttons) | | Masks | COMPLETE |
| Options | COMPLETE (G) | | Camera | COMPLETE (n/a) |
| States | COMPLETE (E) | | Audio | COMPLETE (n/a) |
| Object compatibility | COMPLETE (F, 17 types) | | Import | COMPLETE |
| Timeline | COMPLETE (E11) | | Export | COMPLETE |
| Keyframes | COMPLETE | | Undo | COMPLETE (Q) |
| Symbols | COMPLETE (E6/E12/E13) | | Redo | COMPLETE |
| Layers | COMPLETE (locked/hidden) | | Serialization | COMPLETE (R) |
| Tweens | COMPLETE (TS-26) | | Mobile/Touch | COMPLETE (S, TS-27/28) |
| Stylus | COMPLETE (T, TS-29) | | Accessibility | COMPLETE (U) |
| Performance | COMPLETE (V, TS-30) | | Limitations | COMPLETE (L.1–L.7) |
| Edge cases | COMPLETE (M.1–M.20) | | Workflows | COMPLETE (W.1–W.4) |
| Testing | COMPLETE (TS-01…TS-36) | | Version differences | COMPLETE (E10 legacy button) |
| Source verification | COMPLETE (E1–E14) | | | |

**No unresolved major gaps.** Remaining uncertainties tagged: E8 checkbox label [UNCERTAIN], M.13 Shift+double-click [UNCERTAIN].

---

## SELF-CHALLENGE AUDIT

- **Q1 overlooked?** Double-click **timing/threshold** (M.1/M.2), the **first-click flash** (L.7), and **tool-scoping** (Subselection can't drill, E12) — all documented. Also the **Enable Simple Buttons** selection-blocking (E9) — a classic overlooked interaction.
- **Q2 interaction with other systems?** Edit-mode (breadcrumb/dimming), playback (live frame), buttons (event routing), undo (no entries), panels (schema re-bind).
- **Q3 abnormal user actions?** Double-click live button, drill 3-deep then panic, Shift+double-click, slow double-click, click during playback — all covered.
- **Q4 version changes?** Flash 4/5 legacy button double-click → Instance Properties (E10, removed); double-click-to-edit unchanged; community-reported v19 regression documented as C1.

---

## FEATURE COMPLETE

- Research pass 1 ✔ (official: click/double-click matrix, edit-in-place, temp-Selection, Simple Buttons)
- Research pass 2 ✔ (community: tool-scope, nesting-exit pain, v19 regression, Shift-select pref)
- Source verification ✔ (E1–E14)
- Contradiction audit ✔ (C1, C2)
- Completeness audit ✔ (no gaps)
- Self-challenge audit ✔
- Limitations ✔ (L.1–L.7) · Edge cases ✔ (M.1–M.20)
- Dependencies ✔ (F-03-01, F-03-02)
- Implementation ✔ (Y) · Mobile ✔ (S) · Testing ✔ (TS-01…TS-36)

```
FEATURE COMPLETE:
F-03-03 — Click selection

STATUS:
AUDITED
```
