# F-03-04 — SHIFT TOGGLE / MULTI-SELECT

```
SOURCE BLUEPRINT:  Part 03 — Selection System  (animate-blueprint/03_selection_system.md §3.3.2, §3.4.10)
DEEP FEATURE:      Shift toggle / multi-selection (add, remove, additive marquee, mixed selection)
QUEUE ID:          F-03-04
STATUS:            FULLY RESEARCHED → AUDITED (see 02_impl_tests_audit.md)
DEPENDS ON:        F-03-01 Hit testing · F-03-02 Data structure · F-03-03 Click selection
FEEDS:             F-03-05 Marquee · F-03-10 Sub-object · F-04-02 Move (Shift+drag constrains there)
```

---

## A. IDENTITY

| Field | Value |
|---|---|
| 1. Official name | "Add to a selection" / "Deselect individual items" (Adobe doc headings). The mechanism = holding **Shift** while selecting. |
| 2. Alternate names | Shift-select, shift-click, additive selection, toggle selection, multi-select. |
| 3. Historical names | Same in Flash era. |
| 4. Purpose | Build a selection of **multiple objects** incrementally, and remove individual members — without losing the rest of the selection. |
| 5. Feature category | Selection subsystem / input mapping. |
| 6. Related features | F-03-03 (click), F-03-05 (marquee), F-03-02 (mixed selection state), F-04-02 (Shift+drag = constrained move). |
| 7. Dependencies | F-03-01 hit test; the "Shift Select" preference (F-03-03 C.1). |
| 8. Current/legacy status | **Current.** The "Shift Select" preference gate exists across Flash→Animate. |

---

## EVIDENCE REGISTER

| # | Claim | Status |
|---|---|---|
| E1 | **Add to a selection:** hold **Shift** while making more selections. | [OFFICIAL] `selecting-objects.html` |
| E2 | **Deselect individual items:** Selection tool + hold Shift + click the item. | [OFFICIAL] same |
| E3 | **Deselect all:** Edit > Deselect All / Ctrl+Shift+A (Cmd+Shift+A). | [OFFICIAL] same |
| E4 | **Shift-selecting can be disabled** via General Preferences ("deselect the option"). | [OFFICIAL] same (au/be locales) |
| E5 | **Shift+drag an already-selected object = constrain movement to 45°** (a MOVE behavior, not selection). | [OFFICIAL] `moving-copying-objects.html` |
| E6 | Arrow keys nudge selection **1 px**; **Shift+arrow = 10 px**. | [OFFICIAL] same |
| E7 | Moving a **multiple selection** drags **all** members together (one command). | [OFFICIAL] same |
| E8 | **Mixed selection** (multiple items incl. different types) → Properties shows pixel dimensions + x/y of the **set**. | [OFFICIAL] `selecting-objects.html` |
| E9 | **Timeline frame selection:** Shift+click = add contiguous; **Ctrl/Cmd+click = non-contiguous**; drag = range; **frame-based is the default**; span-based opt-in via hamburger → Span Based Selection. | [OFFICIAL] `frames-keyframes.html` |
| E10 | **Shift+marquee** on stage = additive (implied by E1 "while making more selections" incl. dragging). | [INFERENCE from E1 phrasing; consistent across locales] |

**Corrections propagated:** F-03-02 C2 ("span-based default") is now resolved by E9: **default is frame-based**. Span-based is opt-in. (Recorded in F-03-02 audit as follow-up.)

---

## B. EXACT UI LOCATION

```
Tools panel → Selection tool (V)          ← primary
Preferences (Edit/Animate > Preferences) > General
 └─ "Shift Select" (disable Shift-selecting)     [E4]
Edit menu → Deselect All (Ctrl+Shift+A)          [E3]
Keyboard: Shift (modifier), Ctrl/Cmd (non-contiguous frames) [E9]
```

---

## C. EVERY CONTROL

### C.1 Shift (modifier) — the three-way behavior

| # | Field | Value |
|---|---|---|
| 19. Name | Shift |
| 20. Purpose | Context-dependent: (a) toggle-add on click, (b) additive marquee on empty-drag, (c) constrain-to-45° on object-drag. |
| 24. Default | n/a (modifier) |
| 29–35. States | held/not held |
| 36. Visibility | always (desktop); mobile = Select-mode button |

**The three Shift behaviors (disambiguation — critical):**
| Context | Shift effect | Where spec'd |
|---|---|---|
| Shift+**click** object | toggle membership (add if absent, remove if present) | E1/E2 → this feature |
| Shift+**drag on empty** | additive marquee | E10 → F-03-05 |
| Shift+**drag on selected object** | constrained move (45°) | E5 → **F-04-02** (not selection!) |

### C.2 "Shift Select" preference (gate)

| # | Field | Value |
|---|---|---|
| 19. Name | Shift Select (exact label not quoted; behavior "disable the Shift-selecting option") |
| 20. Purpose | Disable Shift+click add/remove entirely. |
| 24. Default | **ON** [INFERENCE — docs frame disabling as opt-out] |
| 25. Allowed | boolean |
| 36. Visibility | Preferences → General |

---

## D. INTERACTIONS (action → response chain)

| Action | UI response | State change | Doc change | Event | Undo |
|---|---|---|---|---|---|
| Shift+click unselected object | object joins highlight | target added; bounds recompute | none | `selection:changed` | none |
| Shift+click selected object | object leaves highlight | target removed; bounds recompute | none | `selection:changed` | none |
| Shift+click last remaining member | highlight clears | `kind:'none'` | none | `selection:changed` | none |
| Shift+drag on empty | additive marquee preview | union of marquee hits added | none | `selection:preview` → `selection:changed` | none |
| Shift+drag on selected object | objects move constrained 45° | (transform, not selection) | transform.x/y | `document:changed` | **one MoveCommand** |
| Shift+arrow | nudge 10 px | (transform) | x/y | `document:changed` | one NudgeCommand |
| Ctrl+Shift+A | clear | `kind:'none'` | none | `selection:changed` | none |
| Ctrl/Cmd+click (timeline frame) | add non-contiguous frame | selectedFrames add | none | `timelineSelection:changed` | none |

---

## E. FEATURE STATES

| State | Shift+click behavior |
|---|---|
| Nothing selected | adds the clicked object (first member) |
| Single selected | adds/removes the clicked object |
| Multiple selected | toggles membership (E2); can reduce to zero |
| Shift Select disabled | behaves as plain click (replaces) [E4] |
| Mixed types selected | toggles regardless of type; `commonType` recomputes (F-03-02) |
| Locked/hidden target | no-op (hit skipped) |
| During playback | resolves at live frame |
| Edit-in-place | only in-scope targets toggle-able |

---

## F. OBJECT COMPATIBILITY (shift-toggle per type)

| Type | Shift+click |
|---|---|
| Raw shape fill / stroke | toggles that sub-object (fill or stroke independently) |
| Drawing object / group / instance / text / bitmap | toggles the whole object |
| Bone | toggles bone membership (Part 14: Shift+click multi-select bones) |
| Warp pin | toggles pin |
| Frame (timeline) | contiguous add (Shift) / non-contiguous (Ctrl/Cmd) [E9] |
| Layer | n/a (layer rows use their own multi-select) |
| Camera / audio / scene | n/a |

---

## O. DATA MODEL (produced state)

```jsonc
"selection": {
  "kind":"objects",
  "targets":[ {"nodeId":"n1","subPath":"fills[0]"}, {"nodeId":"n3"}, {"nodeId":"n7"} ],  // toggled membership
  "bounds": { "x":0,"y":0,"w":240,"h":180 },   // union AABB (recomputed on every toggle)
  "commonType": "mixed"                          // recomputed (F-03-02 O)
}
```

- **DOCUMENT STATE:** unchanged by selection toggles.
- **VIEW STATE:** `selection.targets` (ordered; new members append).
- **TEMPORARY:** additive-marquee preview set.

---

## P. EVENTS

| Event | Trigger | Payload | Subscribers |
|---|---|---|---|
| `selection:changed` | each Shift+click / Shift+marquee / deselect-all | F-03-02 P | panels + overlay |
| `timelineSelection:changed` | Shift/Ctrl+click frames | frame ranges | timeline panel |
| (no new event for toggle itself — it is a `selection:changed` with a diff) |

---

## Q. UNDO / REDO

- Shift+click toggles are **view state** → **no undo entries**.
- The **follow-up action** on a multi-selection (move/delete/transform) is **one command** for the whole set (E7).
- Commands capture `prevSelection` and restore the multi-set on undo/redo (F-03-02 Q).

---

## R. SERIALIZATION

- Selection set: **not persisted** (cleared on reload).
- "Shift Select" preference: **persisted** (app prefs).
- Timeline frame-selection mode (frame-based/span-based): **persisted** (app prefs) [E9].

---

## L. LIMITATIONS

| # | Limitation | Trigger | Expected | Actual | Visible | Severity | Version | Source | Workaround | Preserve? | Better alternative (ours) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| L.1 | Shift+drag-ON-object means MOVE, not add | Shift+drag a selected object | add/toggle | constrained 45° move | object moves, selection unchanged | Medium (confusion) | all | [OFFICIAL] E5 | drag on empty for add | Preserve (muscle memory) | show "45° lock" HUD so intent is clear |
| L.2 | No shift-toggle inside marquee (marquee only ADDS) | Shift+marquee over already-selected | toggle-remove | union-add | selected stays selected | Low | all | [INFERENCE] E10 | shift+click to remove | Improve | Alt+marquee = subtract-marquee (ours) |
| L.3 | Mixed selection loses type-specific props | multi-type set | per-type props | common only | Properties degrades | Low | all | [OFFICIAL] E8 | select per type | Preserve | per-type count badge |
| L.4 | Shift-select disable is global (no per-tool) | any tool | — | all tools affected | — | Low | all | [OFFICIAL] E4 | re-enable | Preserve | per-tool override (ours) |
| L.5 | Toggling off the last member = full deselect (no undo path) | Shift+click last item | — | selection empty | all highlights gone | Low | all | [OFFICIAL] E2 | reselect | Improve | remember last selection (P2, F-03-02 L.4) |

---

## M. EDGE CASES

| # | Case | Behavior |
|---|---|---|
| M.1 | Shift+click until empty | `kind:'none'`; no error |
| M.2 | Shift+click a sub-object when its whole shape already selected | adds fill/stroke sub-object to the set (shape appears as both whole + part) — [INFERENCE]; ours: replaces the whole with the sub-object |
| M.3 | Shift+click across layers | allowed — multi-layer selection moves as one (E7) |
| M.4 | Shift+click locked/hidden | no-op |
| M.5 | Shift+click during playback | resolves at live frame |
| M.6 | Shift+marquee that also touches raw shapes | region-add (merge model, F-03-01 L.1) |
| M.7 | Shift Select OFF + Shift+click | plain replace [E4] |
| M.8 | Shift+drag with 0 movement | treated as shift+click (toggle) |
| M.9 | Shift+drag on a mix of selected+unselected | moves the selected set; unselected under cursor not added [INFERENCE] |
| M.10 | Ctrl+Shift+A then Shift+click | fresh single selection |
| M.11 | Undo a move of a multi-set | all members restored together (E7) |
| M.12 | Reload | multi-set cleared |
| M.13 | Timeline Ctrl+click non-contiguous frames | multiple disjoint ranges (E9) |
| M.14 | Shift+drag marquee starting ON a selected object | [UNCERTAIN] — ambiguous; treat as move (L.1) |
| M.15 | Toggle a bone with Shift | adds to bone multi-select (Part 14) |
