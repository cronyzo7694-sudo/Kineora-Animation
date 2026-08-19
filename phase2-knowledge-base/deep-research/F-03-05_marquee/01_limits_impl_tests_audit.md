# F-03-05 — L–Y · TESTS · AUDITS

---

## L. LIMITATIONS

| # | Limitation | Trigger | Expected | Actual | Visible | Severity | Version | Source | Workaround | Preserve? | Better alternative (ours) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| L.1 | Raw shapes always region-select (pref ignored) | partial marquee over raw shape | object-enclosure behavior | region selected; move splits shape | shape cut apart | Medium (surprise) | all | [COMMUNITY] E5 | click instead; object mode | Preserve (merge model) | region-select lock toggle (carried from F-03-01 L.1) |
| L.2 | Enclosure required for groups/instances/text when contact OFF | partial marquee | touched = selected | not selected | nothing | Low | all | [OFFICIAL] E2/E3 | enable contact-sensitive | Preserve | status-bar hint showing current contact mode |
| L.3 | Marquee must start on empty | start on an object | marquee | object moves | object dragged | Medium | all | [OFFICIAL] E9 | start on empty | Preserve | Alt+drag = marquee-from-object (ours) |
| L.4 | No subtract-marquee | marquee over already-selected | remove | union-add only | can't deselect by box | Low | all | [INFERENCE] E10 | shift+click each | Improve | **Alt+marquee = subtract** |
| L.5 | Marquee has no move-while-drawing (spacebar reposition) | mid-drag reposition | n/a in Animate | not supported | — | Low | all | [INFERENCE] (Photoshop has it) | redraw | Improve | Space+drag repositions marquee origin (P2) |
| L.6 | Contact default is contradictory/obscure | new user partial marquee | predictable | varies per doc/version | inconsistent selection | Medium | all | [OFFICIAL×2 conflicting] E3/E4 | set explicitly | Improve | default ON + visible toggle + status hint |

---

## M. EDGE CASES

| # | Case | Behavior |
|---|---|---|
| M.1 | Zero-area marquee (press+release, no move) | treated as click (F-03-03) |
| M.2 | Marquee starting on an object | moves it (E9) |
| M.3 | Marquee fully off-stage (pasteboard) | selects pasteboard content; not exported |
| M.4 | Marquee crossing stage edge | clips to stage/pasteboard; selects what's inside |
| M.5 | Marquee over locked/hidden | those layers skipped (F-03-01 E7) |
| M.6 | Raw-shape partial marquee then drag | region splits away (merge model) |
| M.7 | Contact OFF + marquee that only touches a group | group NOT selected (L.2) |
| M.8 | Shift+marquee over already-selected | union-add (no toggle) (E10) |
| M.9 | Alt+marquee (ours) | subtract |
| M.10 | Marquee during playback | resolves at live frame; vanishing objects drop |
| M.11 | Subselection marquee | selects anchors inside (E8) |
| M.12 | Marquee in edit-in-place | only in-scope content; dimmed content excluded |
| M.13 | Timeline frame marquee | contiguous range (E7) |
| M.14 | Marquee with 0 objects hit | selection cleared (or unchanged with Shift) |
| M.15 | Huge marquee (whole stage) | ≈ Select All (but still skips locked/hidden) |
| M.16 | Marquee over a mask shape | selects the mask shape (F-03-01 F) |
| M.17 | Marquee while Shift-Select disabled | Shift+marquee behaves as plain marquee (replace) [F-03-04 E4] |
| M.18 | Marquee with a stylus | same as mouse (F-03-01 T) |

---

## O. DATA MODEL

```jsonc
// TEMPORARY (during drag):
"marquee": { "active":true, "start":{x,y}, "current":{x,y}, "contactSensitive":true, "additive":false }

// RESULT (view state, written on release):
"selection": { "kind":"objects", "targets":[...], "bounds":{...}, "commonType":"..." }
```

- **DOCUMENT STATE:** unchanged by marquee (selection only).
- **VIEW STATE:** selection targets.
- **TEMPORARY:** marquee rect + preview targets.

---

## P. EVENTS

| Event | Trigger | Payload | Subscribers |
|---|---|---|---|
| `selection:preview` (throttled ~60 Hz) | marquee drag continuation | `{ rect, previewTargets }` | overlay renderer |
| `selection:changed` | marquee release | F-03-02 P | panels + overlay |
| `timelineSelection:changed` | frame marquee | frame ranges | timeline panel |

---

## Q. UNDO / REDO

- Marquee itself = view state → **no undo entry**.
- Follow-up command (move/delete/transform of the marquee'd set) = **one command**.
- Commands capture `prevSelection`; undo restores the pre-marquee selection.

---

## R. SERIALIZATION

- `marquee` temp + `selection` = **not persisted**.
- `contactSensitive` preference = **persisted** (app prefs).
- Document unchanged → reload clears selection.

---

## S. MOBILE

| Desktop | Mobile |
|---|---|
| Marquee (drag on empty) | One-finger drag on empty |
| Shift+marquee (add) | Select-mode ON + marquee |
| Contact-sensitive toggle | status-bar/toolbar toggle |
| Marquee reposition (spacebar) | drag handles on the marquee rect (ours) |
| Timeline frame marquee | finger drag across frame cells |

Touch threshold larger (12 px) to avoid accidental marquees; region-select lock protects raw shapes (L.1).

---

## T. STYLUS / U. ACCESSIBILITY / V. PERFORMANCE

- **Stylus:** drag = marquee (identical); pressure/tilt irrelevant.
- **Accessibility:** contact mode announced; a keyboard alternative (our "select-by-direction keys + Enter") for no-pointer use; marquee preview respects reduced-motion (no animated dashes).
- **Performance:** bounds pre-filter via spatial index, precise test only for candidates (F-03-01 V); preview throttled.

---

## W. REAL WORKFLOWS

### W.1 Bulk-select a scene's objects
1. `V` → drag a marquee across the stage → objects inside (per contact mode) selected.
2. Shift+marquee again to add another area.
3. Drag any member → all move (one command).

### W.2 Select only fully-enclosed objects
1. Preferences → General → **deselect** Contact-Sensitive (E3).
2. Marquee → only fully-enclosed atomic objects selected (raw shapes still region-select — L.1).

### W.3 Select a frame range in the timeline
1. Drag across frame cells → contiguous range (E7).
2. Ctrl/Cmd+click another frame → non-contiguous add.
3. `Alt+,` / `Alt+.` to hop keyframes without disturbing selection (E11).

### W.4 Carve out a raw-shape region (deliberate split)
1. Marquee partially over a raw shape → region selected (E5).
2. Drag → region splits off (merge model, Part 06).

---

## X. ALTERNATIVE METHODS

| Goal | Method A | Method B | Best |
|---|---|---|---|
| Bulk select | Marquee | Ctrl+A then Shift+click to prune | A for area, B for whole stage |
| Add area | Shift+marquee | Shift+click each | A |
| Remove from selection | Alt+marquee (ours) | Shift+click each | A (bulk) |
| Exact enclosure | contact OFF + marquee | click each | A |
| Frame range | drag frames | Shift+click / Ctrl+click | depends |

---

## Y. IMPLEMENTATION FOR OUR ORIGINAL APP  [OUR IMPLEMENTATION]

### Y.1 Gesture pipeline
```
pointerdown on empty → mode=marquee (anchor=point)
pointermove ≥ threshold → active marquee (rect from anchor); compute preview targets (throttled)
  targets = querySpatialIndex(rect) → filter:
     atomic objects:  contactSensitive ? touches(rect) : contains(rect, bounds)   [E3]
     raw shapes:      intersect(rect, region) → region target                     [E5]
     anchors (subsel): anchors inside rect                                        [E8]
  Shift held → union-add; Alt held → subtract
pointerup → commit selection; emit selection:changed
```

### Y.2 Rules
- Threshold 3 px desktop / 12 px touch (D).
- Start-on-object = move, never marquee (E9); **Alt+drag from an object = marquee** (L.3 fix).
- Contact-sensitive **default ON** (touched) + visible toggle + status hint (L.6 fix).
- **Alt+marquee = subtract** (L.4 fix).
- Space+drag repositions the in-progress marquee (L.5 fix, P2).

### Y.3 Data/events/undo/serialization — O/P/Q/R sections.

### Y.4 Performance — spatial index + throttled preview (V).

### Y.5 Testing — below.

---

## TEST MATRIX (F-03-05)

| ID | Category | Test | Expected |
|---|---|---|---|
| TS-01 | Normal | Marquee around 3 drawing objects (contact ON) | all 3 selected |
| TS-02 | Normal | Marquee touching 2 of them (contact ON) | both selected (E3) |
| TS-03 | Normal | Same marquee, contact OFF | only enclosed selected (E3) |
| TS-04 | Normal | Marquee partially over a raw shape | region selected (E5) |
| TS-05 | Normal | Shift+marquee | additive (E10) |
| TS-06 | Normal | Timeline drag over frames | contiguous range (E7) |
| TS-07 | Boundary | Press+release no move | click, not marquee |
| TS-08 | Boundary | Marquee start ON an object | move, not marquee (E9) |
| TS-09 | Boundary | Marquee crossing stage edge | clips; selects inside |
| TS-10 | Invalid | Marquee over locked/hidden | skipped |
| TS-11 | Empty | Marquee over nothing | selection cleared |
| TS-12 | Multi | Alt+marquee over selected (ours) | subtract (L.4) |
| TS-13 | Locked | marquee incl. locked object | locked skipped, rest selected |
| TS-14 | Hidden | marquee over hidden layer | excluded |
| TS-15 | Nested | marquee over group child at top level | group selected (not child) |
| TS-16 | Undo | marquee → move → undo | move reverted; prevSelection restored |
| TS-17 | Redo | → redo | re-applied |
| TS-18 | Save/Reload | marquee set → reload | cleared |
| TS-19 | Playback | marquee tweened instance mid-span | selects at live frame |
| TS-20 | Mobile | one-finger drag empty | marquee; two-finger = pan |
| TS-21 | Touch | Select-mode + marquee | additive |
| TS-22 | Stylus | drag marquee | identical to mouse |
| TS-23 | Performance | 10k objects marquee | bounds pre-filter; responsive |
| TS-24 | Subselection | marquee over a path | anchors inside selected (E8) |
| TS-25 | Contact OFF | partial marquee over group | NOT selected (E2) |
| TS-26 | Our fix | Alt+drag from an object | marquee, not move (L.3) |
| TS-27 | Our fix | region-select lock ON + partial raw marquee | whole shape, no split (L.1) |
| TS-28 | Raw split | region-select lock OFF + partial + drag | region splits (E5) |

---

## CONTRADICTION AUDIT

### C1 — Contact-sensitive DEFAULT state
- **Source A [OFFICIAL]** `selecting-objects.html` (multiple locales): defines the checkbox semantics (ON = partial; OFF = enclosed) but states **no explicit default**.
- **Source B [OFFICIAL]** `drawing-preferences.html` (sa_en locale): "**By default**, objects are only selected when the tool's marquee rectangle **completely surrounds** the object. Deselecting this option selects entire objects when they are only partially enclosed…" — internally inconsistent (first sentence = enclosed default; second sentence's "deselecting → partial" contradicts Source A's semantics), and possibly a bad localization.
- **Community signal:** 2017 user with default prefs saw a **partial** marquee select/cut a raw shape — but raw shapes ignore the pref (E5), so this doesn't resolve the atomic-object default.
- **Possible explanation:** Source B is a localization error (sa_en pages are known to be auto-translated); Source A is authoritative for semantics but silent on default. The historical Flash default is contact-sensitive **ON** (touched).
- **Current verified conclusion:** semantics = [OFFICIAL] (A). Default = **[UNCERTAIN]** (A silent; B garbled; history suggests ON).
- **Our decision:** default **ON** (touched) + visible toggle + status-bar hint showing the active mode.
- **Confidence:** semantics HIGH; default LOW.

### C2 — "Marquee on a raw shape always region-selects" vs "contact-sensitive governs all"
- **Source A [OFFICIAL]** `drawing-preferences.html`: contact options are scoped "when you create shapes using **Object Drawing mode**."
- **Source B [COMMUNITY]** 2017: raw shape partial marquee → region select/cut.
- **Resolution:** consistent — the pref is **object-mode-scoped**; raw shapes always region-select (L.1). No contradiction, just scope.
- **Confidence:** HIGH.

---

## COMPLETENESS MATRIX

| Category | Status | | Category | Status |
|---|---|---|---|---|
| UI | COMPLETE | | Rigging | COMPLETE (bone enclosure) |
| Controls | COMPLETE (contact toggle) | | Masks | COMPLETE |
| Options | COMPLETE (C.1 matrix) | | Camera/Audio | COMPLETE (n/a) |
| States | COMPLETE (E) | | Import/Export | COMPLETE |
| Object compatibility | COMPLETE (F, 10 types) | | Undo/Redo | COMPLETE (Q) |
| Timeline | COMPLETE (frame marquee E7) | | Serialization | COMPLETE (R) |
| Keyframes | COMPLETE (Alt+,/. E11) | | Mobile/Touch | COMPLETE (S, TS-20/21) |
| Symbols | COMPLETE (enclosure E2) | | Stylus | COMPLETE (TS-22) |
| Layers | COMPLETE (locked/hidden skip) | | Accessibility | COMPLETE (U) |
| Tweens | COMPLETE (TS-19) | | Performance | COMPLETE (TS-23) |
| Limitations | COMPLETE (L.1–L.6) | | Edge cases | COMPLETE (M.1–M.18) |
| Workflows | COMPLETE (W.1–W.4) | | Testing | COMPLETE (TS-01…TS-28) |
| Version differences | COMPLETE (Flash→Animate stable) | | Source verification | COMPLETE (E1–E11) |

**No unresolved major gaps.** C1 default tagged [UNCERTAIN] with an explicit our-decision. M.4/12/17 [INFERENCE] with defined behavior.

---

## SELF-CHALLENGE AUDIT

- **Q1 overlooked?** Marquee **starting on an object moves it** (E9) — the most common mistake; the **click-vs-marquee threshold**; and **raw shapes ignoring the contact pref** (L.1). All documented + tested (TS-07/08/04).
- **Q2 interaction with other systems?** Merge model (split on region move), timeline frames (E7), playback (live frame), subselection (anchors E8), panels (mixed commonType).
- **Q3 abnormal actions?** Zero-area, start-on-object, off-stage, subtract attempt, contact-OFF partial, marquee-while-playing, huge marquee, stylus — all covered (M).
- **Q4 version changes?** Contact preference persists Flash→Animate; default is [UNCERTAIN] (C1); no removal.

---

## FEATURE COMPLETE

- Research pass 1 ✔ (official: marquee/enclosure/contact/lasso/timeline)
- Research pass 2 ✔ (community: raw-shape split, timeline marquee, Alt+,/. nav, stage↔timeline quirk)
- Source verification ✔ (E1–E11)
- Contradiction audit ✔ (C1 default, C2 scope)
- Completeness audit ✔
- Self-challenge audit ✔
- Limitations ✔ (L.1–L.6) · Edge cases ✔ (M.1–M.18)
- Dependencies ✔ (F-03-01/02/03/04)
- Implementation ✔ (Y) · Mobile ✔ (S) · Testing ✔ (TS-01…TS-28)

```
FEATURE COMPLETE:
F-03-05 — Marquee selection

STATUS:
AUDITED
```
