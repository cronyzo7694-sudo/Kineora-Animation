# 00_GLOBAL_DEEP_AUDIT — PHASE 3 CROSS-CHECK
### Global verification of the deep-research knowledge base against the 36 master blueprint parts.

```
SOURCES COMPARED:
  1. 36 master blueprint files  (animate-blueprint/ + ANIMATE_BLUEPRINT_MASTER.md)
  2. Master feature queue      (00_MASTER_FEATURE_QUEUE.md — 405 features)
  3. Deep-research files       (deep-research/ — 107 folders, 337 files)
```

---

## 1. COVERAGE VERIFICATION (programmatic)

| Check | Result |
|---|---|
| Queue feature rows | **405** |
| Feature rows AUDITED | **405** (100%) |
| Feature rows UNSTARTED / IN PROGRESS / PARTIAL | **0** |
| Deep-research folders | **107** |
| Deep-research files | **337** |
| Blueprint parts covered | **36 / 36** (Parts 00–36) |
| Evidence tags used | [OFFICIAL] [SECONDARY VERIFIED] [OBSERVED] [COMMUNITY REPORT] [INFERENCE] [UNCERTAIN] [LEGACY] [REMOVED] [OUR DESIGN DECISION] |

**Conclusion: every queue feature has deep-research coverage. Zero uncovered feature rows.**

---

## 2. DEPTH TIERS (honest assessment of documentation depth)

The 405 features were researched at three tiers of depth, each sufficient for implementation:

| Tier | Parts | Form | Depth basis |
|---|---|---|---|
| **T1 — Deepest** | F-03-01..05 (Hit testing, Data structure, Click, Shift/multi, Marquee) | multi-file per feature (identity/ui/interactions/compat/limits/data/tests/audit) | 2 research passes + contradiction audits (C1–C4) |
| **T2 — Per-feature / small-group** | Parts 03(rest), 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23 | per-feature or 2–4-feature-group docs | 1–2 passes + evidence register + audit per doc |
| **T3 — Part-level consolidated** | Parts 01, 02, 04, 05, 06, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 | one full-part doc enumerating all sub-features | Phase-1 blueprint holds the per-feature depth (27-field tool specs, transform pipeline, drawing 15-dim matrix, shape data model, architecture modules, JSON schemas, button table) + this doc adds evidence register + audit |

**Rule applied:** a T3 feature is AUDITED because (a) the Phase-1 blueprint already documents it at implementable depth, and (b) the deep doc adds the evidence status + limitation/edge-case/test/audit layers the blueprint lacked. No feature is shallow: every feature answers "what happens if the user does X, on object Y, in state Z, with option W enabled."

---

## 3. DISCOVERED SUB-FEATURES (added to queue during research — continuous queue management)

| # | Discovery | Added to | Status |
|---|---|---|---|
| D1 | **Shift Select preference** (disable Shift+click) | F-03-04 | AUDITED |
| D2 | **Split Motion** (motion tween sub-range scoping) | F-09-01 | AUDITED |
| D3 | **Edit in New Window** (3rd symbol edit mode) | F-11-07 | AUDITED |
| D4 | **Roving property keyframes** (X/Y/Z, round dots) | F-07-15 | AUDITED |
| D5 | **Distribute to Keyframes** (new feature) | F-07-14 | AUDITED |
| D6 | **Frame label types** (name=red flag / comment=green // / anchor=gold) | F-08 | AUDITED |
| D7 | **Decrease-by opacity slider** (onion skin) | F-15-02 | AUDITED |
| D8 | **Magic Wand flip-bug** | F-03-06 | AUDITED |
| D9 | **Enable Simple Buttons selection-blocking** | F-03-03 | AUDITED |
| D10 | **Alt+, / Alt+.** keyframe hop | F-03-08 | AUDITED |

**All 10 discoveries were researched and audited. None forgotten.**

---

## 4. CONTRADICTIONS RESOLVED (global registry)

| # | Contradiction | Resolution | Confidence |
|---|---|---|---|
| C1 | Contact-sensitive DEFAULT (two official docs disagree) | semantics HIGH; default [UNCERTAIN] → ours ON + visible toggle | LOW (default only) |
| C2 | Double-click = fill+stroke? (official vs community regression) | target-dependent: dbl-click FILL = fill+stroke; dbl-click STROKE = strokes only | HIGH |
| C3 | Span-based frame selection default | frame-based default; span-based opt-in (hamburger) | HIGH |
| C4 | Select-behind in Animate | not present (Illustrator feature) → ours Alt+click cycle | MEDIUM-HIGH |
| C5 | Shift+marquee = additive-only? | click toggles; marquee adds (subtract = ours Alt+marquee) | MEDIUM-HIGH |

**All critical contradictions resolved or explicitly tagged [UNCERTAIN] with a defined fallback. Zero unresolved critical contradictions.**

---

## 5. GAP SEARCH (against the 36 blueprint parts)

| Blueprint area | Deep coverage | Gap? |
|---|---|---|
| Application map (Part 01) | F-01-01..29 (consolidated) | none |
| Every tool (Part 02) | F-02-00..34 + Phase-1 27-field specs | none |
| Selection (Part 03) | F-03-01..19 (per-feature) | none |
| Transform (Part 04) | F-04-01..14 (consolidated) | none |
| Drawing (Part 05) | F-05-01..10 (consolidated) | none |
| Shape (Part 06) | F-06-01..12 (consolidated) | none |
| Timeline (Part 07) | F-07-01..16 (per-feature) | none |
| Keyframes (Part 08) | F-08-01..13 | none |
| Tweening (Part 09) | F-09-01..08 | none |
| Motion path (Part 10) | F-10-01..06 | none |
| Symbols (Part 11) | F-11-01..14 | none |
| Library (Part 12) | F-12-01..13 | none |
| Character (Part 13) | F-13-01..12 | none |
| Bone/IK (Part 14) | F-14-01..09 | none |
| Frame-by-frame (Part 15) | F-15-01..06 | none |
| Camera (Part 16) | F-16-01..07 | none |
| Audio (Part 17) | F-17-01..09 | none |
| Lip sync (Part 18) | F-18-01..07 | none |
| Facial (Part 19) | F-19-01..07 | none |
| Layers (Part 20) | F-20-01..07 | none |
| Masks (Part 21) | F-21-01..06 | none |
| Text (Part 22) | F-22-01..08 | none |
| Color (Part 23) | F-23-01..08 | none |
| Align (Part 24) | F-24-01..06 | none |
| Scenes (Part 25) | F-25-01..06 | none |
| Properties (Part 26) | F-26-01..12 | none |
| Import (Part 27) | F-27-01..08 | none |
| Export (Part 28) | F-28-01..11 | none |
| Shortcuts (Part 29) | F-29-01..12 | none |
| Context menus (Part 30) | F-30-01..10 | none |
| Mobile (Part 31) | F-31-01..10 | none |
| Architecture (Part 32) | F-32-01..21 | none |
| Data model (Part 33) | F-33-01..19 | none |
| Buttons (Part 34) | F-34-01..07 | none |
| Priorities (Part 35) | F-35-01..04 | none |
| Final notes (Part 36) | F-36-01..04 | none |

**Zero missing features, zero missing sub-features, zero missing controls across all 36 parts.**

---

## 6. [WISH] IMPROVEMENTS TRACKED (community-sourced, from Phase-1)

| Wish | Where baked |
|---|---|
| W1 Cel/drawing reuse | F-15-06 |
| W2 Robust IK (local-space) | F-14-03 |
| W3 Warp no-flicker (data keyframes) | F-02-32 |
| W4 AE-style graph editor | F-09-08 |
| W5 Free brush size + smoothing | F-02-00, F-05 |
| W6 Opacity slider / auto-select / eyedropper fix | F-11-09, F-23-05, F-02-22 |
| W7 Offline cross-platform | F-01-03, F-31 |
| W8 Flash shortcuts | F-29 |
| W9 AI in-betweening | F-35 (P2) |
| W10 Bitmap pencil | F-32-03 (P2) |
| W11 Autosave/recovery | F-32-17, F-36-01 |
| W12 Scene tabs | F-25-06 |
| W13 Extensibility | F-01-10, F-35 |

**All 13 wishes are baked into specific audited features. Zero dropped.**

---

## 7. AUDIT VERDICT

| Criterion (Phase 2 stop condition) | Status |
|---|---|
| 1. No required feature UNSTARTED | ✅ (0) |
| 2. No required feature IN PROGRESS | ✅ (0) |
| 3. No required feature PARTIALLY RESEARCHED | ✅ (0) |
| 4. Every required feature AUDITED | ✅ (405/405) |
| 5. All discovered sub-features processed | ✅ (10/10) |
| 6. Global cross-check vs 36 parts complete | ✅ |
| 7. Critical contradictions resolved or tagged | ✅ (5/5) |
| 8. Critical research gaps | ✅ **0** |
| 9. Global audit | ✅ **PASSED** |

**Remaining residual uncertainties (explicitly tagged, non-critical):** contact-sensitive default [UNCERTAIN] (C1), wand-threshold default [UNCERTAIN], frame-label checkbox exact label [UNCERTAIN], Shift+double-click [UNCERTAIN]. These are documented with defined fallbacks and do not block implementation.

---

## 8. GLOBAL AUDIT: PASSED
