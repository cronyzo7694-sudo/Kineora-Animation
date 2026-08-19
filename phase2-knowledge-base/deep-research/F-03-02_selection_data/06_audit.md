# F-03-02 — CONTRADICTION · COMPLETENESS · SELF-CHALLENGE AUDITS

---

## CONTRADICTION AUDIT
Resolved C1 (stage↔timeline coupling mechanism) and C2 (span-based default) — full reasoning in `00_identity_model_events.md` §CONTRADICTION AUDIT. Summary:

| # | Issue | Conclusion | Confidence |
|---|---|---|---|
| C1 | Stage selection lighting all frames vs frame-click selecting content | both real; span-highlight + span-based selection drives the coupling | MEDIUM |
| C2 | Span-based selection default | feature confirmed; default [UNCERTAIN] → ours ON + toggle | LOW |

No unresolved critical contradictions. Adobe's internal selection representation is not public — that absence is documented (A.1/A.8), not hidden.

---

## COMPLETENESS MATRIX

| Category | Status | Notes |
|---|---|---|
| UI | COMPLETE | B (4 readout surfaces) |
| Controls | COMPLETE | reg/transform toggle, span-based, hide-edges, highlight colors |
| Options | COMPLETE | G (6 rows) |
| States | COMPLETE | E (12 states incl. mixed, sub-object, anchors, frames) |
| Object compatibility | COMPLETE | F (17 types → target forms) |
| Timeline | COMPLETE | frame domain + span-based + active layer |
| Keyframes | COMPLETE | frame spans map to keyframe spans |
| Symbols | COMPLETE | instance targets + selection:lost on broken ref |
| Layers | COMPLETE | selectedLayers + activeLayer + lock/hide exclusion |
| Tweens | COMPLETE | frame selection over tween spans (M.20) |
| Rigging | COMPLETE | bone/warp-pin target forms |
| Masks/Camera/Audio | COMPLETE | n/a mapping (F) |
| Import/Export | COMPLETE | no selection effect (M.17) |
| Undo | COMPLETE | Q |
| Redo | COMPLETE | Q |
| Serialization | COMPLETE | R (targets not persisted; prefs persisted) |
| Mobile | COMPLETE | TS-21/22 + Y.8 |
| Touch | COMPLETE | TS-22 |
| Stylus | COMPLETE | TS-23 + Y.8 |
| Accessibility | PARTIAL→COMPLETE | readout announced; color configurable [E6]; (no dedicated a11y section — carried from F-03-01 U; not a gap for a data structure) |
| Performance | COMPLETE | cached bounds/commonType; TS-24 |
| Limitations | COMPLETE | L.1–L.7 |
| Edge cases | COMPLETE | M.1–M.25 |
| Workflows | COMPLETE | W.1–W.4 |
| Testing | COMPLETE | TS-01…TS-30 |
| Version differences | COMPLETE (as known) | no documented change; Flash→Animate rename only |
| Source verification | COMPLETE | E1–E12 register |

**No unresolved major gaps.**

---

## SELF-CHALLENGE AUDIT

### Q1: "What would a developer most likely overlook?"
- **Answer:** that selection has **two domains** (stage objects + timeline frames/layers) with an *accidental* coupling in Animate (E10). A naive implementation would store only `objectIds` and later bolt on frame-selection. → Design prevents this: dual-domain structure + explicit sync toggle (Y).
- Also: **mixed-selection degradation** (common props only) is a *feature*, not a bug — Properties must derive `commonType` and fall back to x/y/w/h [E2].

### Q2: "What happens when this interacts with another system?"
- **Playback:** targets re-resolve per frame; vanished objects fire `selection:lost` (M.18).
- **Undo:** commands capture/restore both domains (Q).
- **Panels:** Properties/Info/Transform/overlay all derive from `commonType`/`bounds` — one source, many views.
- **Delete:** deleting a selected node must remove its target (M.10/M.11).

### Q3: "What happens when the user does something abnormal?"
- Selects a symbol then clicks a frame (L.2), Shift-clicks down to zero (M.23), selects a zero-size/NaN object (M.7), deletes the active layer (M.22), frames spanning tweens (M.20), save/reload (M.16). All documented + tested.

### Q4: "What changed between versions?"
- No documented change to selection state semantics; "Highlight Color" and "Contact-Sensitive" prefs persist from Flash-era [OFFICIAL]. Span-based selection's version history [UNCERTAIN] (E9). If a source documents otherwise, revise.

---

## FEATURE COMPLETE

- Research pass 1 ✔ (official: mixed selection, readouts, deselect, highlight colors, reg/transform toggle)
- Research pass 2 ✔ (community: span-based selection, stage↔timeline coupling, deselect-individual)
- Source verification ✔ (E1–E12)
- Contradiction audit ✔ (C1, C2)
- Completeness audit ✔ (no unresolved gaps)
- Self-challenge audit ✔
- Limitations ✔ (L.1–L.7)
- Edge cases ✔ (M.1–M.25)
- Dependencies ✔ (F-03-01)
- Implementation ✔ (Y)
- Mobile ✔ (Y.8 + TS-21/22)
- Testing ✔ (TS-01…TS-30)

```
FEATURE COMPLETE:
F-03-02 — Selection data structure

STATUS:
AUDITED
```
