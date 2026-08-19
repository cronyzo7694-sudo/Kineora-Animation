# F-03-01 — CONTRADICTION · COMPLETENESS · SELF-CHALLENGE AUDITS

---

## CONTRADICTION AUDIT

### CONTRADICTION C1 — "double-click selects stroke + fill" (which sub-object was clicked?)
- **Source A [OFFICIAL]** helpx `selecting-objects.html`: "To select a filled shape and its stroked outline, **double-click the fill**."
- **Source B [COMMUNITY REPORT]** community thread (2019): "double click a stroke to select all parts of the stroke… to select both stroke and fill, **shift click** over each." (implies double-click-stroke ≠ fill+stroke)
- **Possible explanation:** the two statements describe **different targets**. Double-click **fill** → fill+stroke (A). Double-click **stroke** → all *connected strokes* only (B), consistent with E4 ("double-click one of the lines selects connected lines").
- **Current verified conclusion:** both correct; behavior is target-dependent. Documented as E5 (fill) and E4/E14 (stroke).
- **Confidence:** HIGH.

### CONTRADICTION C2 — contact-sensitivity scope (raw shapes vs drawing objects)
- **Source A [OFFICIAL]** `drawing-preferences.html`: the contact option is specified "when you create shapes using **Object Drawing mode**."
- **Source B [COMMUNITY REPORT]** "Selection Tool cuts my Objects" (2017): marquee partially covering a (raw) shape selects a **region** regardless.
- **Possible explanation:** the preference governs *object-mode* objects (atomic). Raw shapes **always** region-select on partial marquee (merge model) — not governed by the pref.
- **Current verified conclusion:** the pref applies to object-drawing/group/instance enclosure; raw shapes always region-select. Documented L.1.
- **Confidence:** MEDIUM-HIGH (B is community, but matches merge-model docs).

### CONTRADICTION C3 — "select only strokes / only fills" toggle exists?
- **Source A [OFFICIAL]** `selecting-objects.html` (2023): "You can choose to select only an object's strokes or only its fills."
- **Source B** — no current doc or community source locates a dedicated toggle; the practical mechanism is click-stroke vs click-fill (E12).
- **Possible explanation:** (i) the sentence describes the inherent click behavior, or (ii) a legacy/removed sub-option. No current UI control found.
- **Current verified conclusion:** behavior is real via click targeting; a dedicated toggle is **[UNCERTAIN]** (E16). Our app implements click-targeting + an explicit **stroke/fill filter** in Select mode (P2).
- **Confidence:** LOW (toggle existence).

### CONTRADICTION C4 — "select behind" exists in Animate?
- **Source A [COMMUNITY REPORT]** thread describes Ctrl/Cmd+click-to-select-behind — but the thread is **Illustrator-scoped** (CS3, Appearance panel references).
- **Source B** — no Adobe Animate doc describes select-behind.
- **Possible explanation:** source A is the wrong product. Animate has no documented select-behind.
- **Current verified conclusion:** [INFERENCE] no select-behind in Animate; workarounds = lock/hide/outline/rearrange (L.2). Our app adds Alt+click cycling.
- **Confidence:** MEDIUM-HIGH.

---

## COMPLETENESS MATRIX

| Category | Status | Notes |
|---|---|---|
| UI | COMPLETE | B section |
| Controls | COMPLETE | C (contact-sensitivity, Shift, layer flags) |
| Options | COMPLETE | G matrix |
| States | COMPLETE | E (12 states) |
| Object compatibility | COMPLETE | F (18 types) |
| Timeline | COMPLETE | H |
| Keyframes | COMPLETE | H |
| Symbols | COMPLETE | I |
| Layers | COMPLETE | J |
| Tweens | COMPLETE | H (motion/classic/shape hits) |
| Rigging | COMPLETE | F (bone) |
| Masks | COMPLETE | F/J |
| Camera | COMPLETE | F (not a stage hit) |
| Audio | COMPLETE | F (not a stage hit) |
| Import | COMPLETE | K/TS-36 |
| Export | COMPLETE | TS-37 |
| Undo | COMPLETE | Q |
| Redo | COMPLETE | Q |
| Serialization | COMPLETE | R |
| Mobile | COMPLETE | S |
| Touch | COMPLETE | S + TS-40..45 |
| Stylus | COMPLETE | T + TS-46..48 |
| Accessibility | COMPLETE | U |
| Performance | COMPLETE | V + TS-49..51 |
| Limitations | COMPLETE | L (8 rows) |
| Edge cases | COMPLETE | M (25 rows) |
| Workflows | COMPLETE | W (5 tasks) |
| Testing | COMPLETE | 08_tests.md (54 tests) |
| Version differences | COMPLETE (as known) | E17 [UNCERTAIN] — no documented change |
| Source verification | COMPLETE | evidence register E1–E19 |

**No unresolved major gaps.** Remaining uncertainties are explicitly tagged: E16 (toggle existence, LOW), E17 (version change, no source), M.8/M.15/M.16/M.17 (edge behavior = our design decision where Adobe behavior is not public).

---

## SELF-CHALLENGE AUDIT

### Q1: "What would a developer most likely overlook?"
- **Answer:** that **raw shapes and object-mode objects follow DIFFERENT marquee rules** (region-intersection vs enclosure) — the single most-missed behavior. → Documented L.1 + Y.1 (shape branch vs object branch) + TS-13/TS-54.
- Also: that **groups/symbols/text must be enclosed** even when contact-sensitivity is ON? No — with ON they select on touch; with OFF they need enclosure. Both covered (E9/G).
- Also: **stacking order exception** — raw shapes render BELOW groups/symbols regardless of creation order (E10), which changes "top-most wins" expectations. → Documented in F/H + Y.1 pass order.

### Q2: "What happens when this feature interacts with another major system?"
- **Playback** — hit set changes per frame; selection may drop (L.6, TS-38).
- **Edit-in-place** — hit scope narrows to the edit context (E-states, TS-27/28).
- **Merge model** — partial marquee + move = split (E13, TS-54).
- **Masks** — mask shape hit-testable; clip doesn't change hit geometry (J).
- **IK** — bones are separate hit targets (F, Part 14).

### Q3: "What happens when the user does something abnormal?"
- Clicks transparent pixels of a PNG (L.7/TS-36), clicks off-stage pasteboard (M.9), zero-size/NaN objects (M.8/M.10, TS-16/17), palm contact on tablet (TS-45), marquee-while-playing (M.22), 50-level nesting (TS-51). All documented.

### Q4: "What changed between versions?"
- **Arrow tool → Selection tool** rename (Flash→Animate) [OFFICIAL].
- No documented change to click/marquee hit semantics (E17 [UNCERTAIN]); Flash CS6-era contact-sensitivity preference persists in current Animate (E9).
- If a source later documents a change, revise E17.

---

## FEATURE COMPLETE

- Research pass 1 ✔ (official + secondary: selection, preferences, stacking)
- Research pass 2 ✔ (community: sub-object split, stroke/fill independence, select-behind confusion, version threads)
- Contradiction audit ✔ (C1–C4 resolved)
- Completeness matrix ✔ (no unresolved gaps)
- Limitations ✔ (L.1–L.8)
- Edge cases ✔ (M.1–M.25)
- Implementation spec ✔ (07_workflows_implementation.md Y)
- Test matrix ✔ (TS-01…TS-54)
- Evidence statuses ✔ (E1–E19)
- Self-challenge audit ✔

```
FEATURE COMPLETE:
F-03-01 — Selection Tool: Hit Testing

READY FOR NEXT FEATURE.
```
