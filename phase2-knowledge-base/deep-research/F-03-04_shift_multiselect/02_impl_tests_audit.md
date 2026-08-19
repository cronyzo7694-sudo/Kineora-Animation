# F-03-04 — W–Y IMPLEMENTATION · TESTS · AUDITS

---

## W. REAL WORKFLOWS

### W.1 Build a multi-part selection across layers
1. `V` → click the torso (layer 1).
2. **Shift+click** the head (layer 2) → both selected (E1).
3. **Shift+click** the arm (layer 3) → three selected.
4. Drag any member → **all move together** (E7); release = one MoveCommand.

### W.2 Remove one item from a big selection
1. Select All (Ctrl+A) → everything on unlocked layers (F-03-01 E7).
2. **Shift+click** the background → it leaves the selection (E2).
3. Now edit the rest.

### W.3 Precise nudge of a multi-selection
1. Select 3 objects.
2. Arrow = 1 px; **Shift+arrow = 10 px** (E6) for coarse nudges.

### W.4 Add non-contiguous timeline frames
1. Timeline: click frame 5.
2. **Ctrl/Cmd+click** frame 12 → non-contiguous add (E9).
3. **Shift+click** frame 20 → contiguous add from the last (E9).

---

## X. ALTERNATIVE METHODS (multi-select routes)

| Goal | Method A | Method B | Method C | Best |
|---|---|---|---|---|
| Multi-select objects | Shift+click each | Shift+marquee (add) | Ctrl+A then Shift+click to prune | depends |
| Remove a member | Shift+click it (E2) | reselect fresh | — | A |
| Move a multi-set | drag any member (E7) | arrow keys | Transform panel | A fastest |
| Constrain move 45° | Shift+drag (E5) | Transform panel | — | A |

---

## Y. IMPLEMENTATION FOR OUR ORIGINAL APP  [OUR IMPLEMENTATION]

### Y.1 Toggle algorithm
```ts
function toggleTarget(target, targets):
  i = targets.findIndex(t => t.nodeId===target.nodeId && t.subPath===target.subPath)
  if i>=0: targets.splice(i,1)          // E2 remove
  else:    targets.push(target)          // E1 add
  recompute bounds + commonType          // F-03-02
  emit selection:changed
```

### Y.2 Shift disambiguation (three-way, from C.1)
1. **Shift+click** (no drag) → toggle (this feature).
2. **Shift+drag on empty** → additive marquee (F-03-05).
3. **Shift+drag on selected object** → constrained move (F-04-02) — **never** toggles.

### Y.3 Preferences
- `shiftSelect` (bool, default ON) gates Y.1 [E4]. Per-tool override (L.4 fix, P2).
- `frameSelectionMode` = `frame-based` (default) | `span-based` [E9] — persisted app pref.

### Y.4 Our improvements (from L)
- **Alt+marquee = subtract** (removes marquee hits from the selection) — fills L.2 gap.
- **45°-lock HUD** during Shift+drag move (L.1 clarity).
- **Remember last selection** for restore (L.5, carried from F-03-02 L.4).
- Sub-object toggle resolves to **replace whole with sub-object** (M.2 clean semantics).

### Y.5 Undo/serialization/performance
- Toggles = view state (no undo); follow-up command = one entry for the set (Q).
- Persist `shiftSelect` + `frameSelectionMode` prefs (R).
- Bounds recompute O(n) over targets; cached (F-03-02 V).

---

## TEST MATRIX (F-03-04)

| ID | Category | Test | Expected |
|---|---|---|---|
| TS-01 | Normal | Shift+click unselected | added (E1) |
| TS-02 | Normal | Shift+click selected | removed (E2) |
| TS-03 | Normal | Shift+click across 3 layers | 3-member multi-set; drag moves all (E7) |
| TS-04 | Normal | Ctrl+Shift+A | all cleared (E3) |
| TS-05 | Normal | Shift+marquee on empty | additive (E10) |
| TS-06 | Normal | Shift+arrow | 10 px nudge (E6) |
| TS-07 | Boundary | Shift+click last member | `kind:'none'` |
| TS-08 | Boundary | Shift Select OFF + Shift+click | replace, not toggle (E4) |
| TS-09 | Boundary | Shift+drag selected object | 45°-constrained move, NOT toggle (E5) |
| TS-10 | Boundary | Shift+drag with 0 move | treated as toggle-click |
| TS-11 | Invalid | Shift+click locked/hidden | no-op |
| TS-12 | Empty | Shift+click empty stage | no change |
| TS-13 | Multi | mixed-type set → Properties | common fields only (E8) |
| TS-14 | Locked | multi-set incl. locked attempt | locked skipped; others toggled |
| TS-15 | Hidden | shift-marquee over hidden | hidden excluded |
| TS-16 | Nested | shift-click child inside edit scope | toggles in scope only |
| TS-17 | Undo | multi-set move → undo | all restored together (E7) |
| TS-18 | Redo | → redo | all re-applied |
| TS-19 | Save/Reload | multi-set → reload | cleared |
| TS-20 | Playback | shift-click tweened instance | toggles at live frame |
| TS-21 | Mobile | Select-mode tap → tap | toggle membership |
| TS-22 | Touch | long-press = add (configurable) | adds |
| TS-23 | Stylus | shift (keyboard) + tap | toggle |
| TS-24 | Performance | 10k objects, toggle to 100 | O(n) bounds; responsive |
| TS-25 | Timeline | Ctrl/Cmd+click non-contiguous frames | disjoint ranges (E9) |
| TS-26 | Timeline | Shift+click frames | contiguous add (E9) |
| TS-27 | Timeline | frame-based default | single frame per click (E9) |
| TS-28 | Our fix | Alt+marquee over selected | subtract (L.2) |
| TS-29 | Our fix | sub-object toggle when whole selected | replaces whole with sub-object (M.2) |

---

## CONTRADICTION AUDIT

### C1 — Is Shift+marquee additive-only, or does it toggle?
- **Source A [OFFICIAL]** "To add to a selection, hold down the Shift key while making more selections" (E1) — "making more selections" includes dragging.
- **Source B [OFFICIAL]** "Deselect individual items: hold Shift and click" (E2) — removal is documented for **click**, not drag.
- **Possible explanation:** click = toggle (add/remove); marquee = union (add only). No doc describes marquee-subtraction.
- **Current verified conclusion:** Shift+click toggles; Shift+marquee adds. Marquee-subtract is **[UNCERTAIN]/not documented** → our app adds Alt+marquee subtract (L.2).
- **Confidence:** MEDIUM-HIGH.

### C2 — F-03-02 C2 follow-up (span-based default)
- **New [OFFICIAL] evidence (E9):** "In **frame-based selection (the default)**, you select individual frames. In span-based selection…" — default = frame-based; span-based is opt-in (hamburger → Span Based Selection).
- **Resolution:** F-03-02 C2 [UNCERTAIN] now resolved → **default = frame-based**. F-03-02 audit updated by reference.
- **Confidence:** HIGH.

---

## COMPLETENESS MATRIX

| Category | Status | | Category | Status |
|---|---|---|---|---|
| UI | COMPLETE | | Rigging | COMPLETE (bone shift-multi) |
| Controls | COMPLETE (Shift 3-way, Shift-Select pref) | | Masks/Camera/Audio | COMPLETE (n/a) |
| Options | COMPLETE | | Import/Export | COMPLETE |
| States | COMPLETE (E) | | Undo | COMPLETE (Q) |
| Object compatibility | COMPLETE (F) | | Redo | COMPLETE |
| Timeline | COMPLETE (E9 frames) | | Serialization | COMPLETE (R) |
| Keyframes | COMPLETE (frame multi-select) | | Mobile/Touch | COMPLETE (TS-21/22) |
| Symbols | COMPLETE | | Stylus | COMPLETE (TS-23) |
| Layers | COMPLETE (cross-layer) | | Accessibility | COMPLETE (Select-mode alt for keyboard-less) |
| Tweens | COMPLETE (TS-20) | | Performance | COMPLETE (TS-24) |
| Limitations | COMPLETE (L.1–L.5) | | Edge cases | COMPLETE (M.1–M.15) |
| Workflows | COMPLETE (W.1–W.4) | | Testing | COMPLETE (TS-01…TS-29) |
| Version differences | COMPLETE (Flash→Animate stable) | | Source verification | COMPLETE (E1–E10) |

**No unresolved major gaps.** M.14 (Shift+drag starting on a selected object) tagged [UNCERTAIN] with a defined fallback (treat as move).

---

## SELF-CHALLENGE AUDIT

- **Q1 overlooked?** The **three-way Shift semantics** (toggle / additive-marquee / 45°-move) — the single most-missed distinction. Documented in C.1 with a disambiguation table + tests TS-05/06/09.
- **Q2 interaction with other systems?** Move (E7 one command for the set), Properties (mixed degradation E8), timeline (frame multi-select E9), rigging (bone shift-multi), playback (live frame).
- **Q3 abnormal actions?** Shift+drag with 0 movement, toggle-to-empty, sub-object-vs-whole toggle, Shift-Select-OFF muscle-memory, marquee-subtract attempt — all covered (M/TS).
- **Q4 version changes?** Behavior stable Flash→Animate; the "Shift Select" preference persists; span-based frame selection is a newer opt-in (E9). No removals.

---

## FEATURE COMPLETE

- Research pass 1 ✔ (official: add/remove, deselect-all, nudge, mixed selection, move multi-set)
- Research pass 2 ✔ (official frames-keyframes: frame/span-based defaults, non-contiguous Ctrl+click)
- Source verification ✔ (E1–E10)
- Contradiction audit ✔ (C1, C2 — incl. F-03-02 correction)
- Completeness audit ✔
- Self-challenge audit ✔
- Limitations ✔ (L.1–L.5) · Edge cases ✔ (M.1–M.15)
- Dependencies ✔ (F-03-01/02/03)
- Implementation ✔ (Y) · Mobile ✔ · Testing ✔ (TS-01…TS-29)

```
FEATURE COMPLETE:
F-03-04 — Shift toggle / multi-select

STATUS:
AUDITED
```
