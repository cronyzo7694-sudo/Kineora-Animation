# §19–§23: CONFLICTS · DEPENDENCY GAPS · AMBIGUOUS ITEMS · DUPLICATES MERGED · COVERAGE CHECK

---

## 19. CONFLICTS FOUND  [00_GLOBAL_DEEP_AUDIT.md §4]

Only conflicts explicitly resolved (or tagged) by the blueprint's own audits are listed — none are silently resolved here.

| # | Feature | Source A | Source B | Exact difference | Impact | Decision required |
|---|---|---|---|---|---|---|
| C1 | Contact-sensitive marquee **default** | Two official Adobe docs disagree (one says default ON, one implies OFF) | — | Whether "touched = selected" is the shipped default | Low (semantics both documented; only the default differs) | RESOLVED: default ON + visible toggle + status hint [ENG-022 · ASSUM-001] |
| C2 | Double-click = fill+stroke? | Official doc (dbl-click fill → fill+stroke) | Community regression report | Whether double-click selects whole shape or only the sub-object | Medium (selection semantics) | RESOLVED: target-dependent — dbl-click FILL = fill+stroke; dbl-click STROKE = strokes only |
| C3 | Frame-selection default (span-based vs frame-based) | Queue originally listed span-based | F-03-04 E9 correction | Whether one click selects a span or a single frame | Medium (timeline UX) | RESOLVED: frame-based default; span-based opt-in via hamburger |
| C4 | "Select behind" | Community attributes it to Animate | Illustrator actually has it | Whether select-behind exists in Animate | Medium-High | RESOLVED: not in Animate → ours = Alt+click cycle z-stack |
| C5 | Shift+marquee additive-only? | Official (Shift+click toggle) | Ambiguity over Shift+marquee | Whether Shift+marquee adds or toggles | Medium-High | RESOLVED: click toggles; marquee adds; subtract = ours Alt+marquee |

> Note: the blueprint labels these "contradictions resolved" — they are **not** open conflicts. They are listed here per the task's requirement to surface any divergence, with their resolution.

**Cross-document note (not a conflict, a version fact):** Part 29 lists `Ctrl+Shift+Z` as both Redo and (legacy) Remove Transform — the blueprint explicitly reassigns Remove Transform ("ours: use menu"). This is a resolved collision, not an open conflict.

---

## 20. DEPENDENCY GAPS  [18_global_audit.md §Residual]

Features specified but whose prerequisite is not fully specified — **genuine** gaps only, not invented:

| # | Item | Gap | Class |
|---|---|---|---|
| GAP-001 | Async export/lip-sync **resume after reload** | In-flight worker jobs do not survive reload (STM-JOB → FAILED, no resume) | MEDIUM (out of scope P2) |
| GAP-002 | Plugin/extensibility **API surface** (W13) | Script API is named but no API contract specified | LOW (P2/P3) |
| GAP-003 | Multi-language lip-sync **model bundle** | Pluggable recognizer specified; non-English models named but not detailed | LOW (P3) |
| GAP-004 | Cloud sync / collaboration | Named as optional; no protocol specified | LOW (P3) |

No BLOCKER, no HIGH gap (per Phase-3 audit). All critical paths have owners, state, tests, gates.

---

## 21. AMBIGUOUS ITEMS  [00_GLOBAL_DEEP_AUDIT.md §7 · 00_PHASE_2_COMPLETE.md]

| # | Item | What's unspecified | Fallback (defined) |
|---|---|---|---|
| A1 | Contact-sensitive default | default value | ON + toggle [C1] |
| A2 | Magic Wand threshold default | default number | range 0–200 documented; default user-set (~20) |
| A3 | "Shift Select" checkbox exact label | UI wording | behavior documented; label [UNCERTAIN] |
| A4 | Shift+double-click semantics | exact behavior | defined fallback (shift of double-click result) |
| A5 | Drag threshold exact value (Adobe) | Adobe's px threshold not public | ours: 3px desktop / 12px touch [OUR DESIGN DECISION] |
| A6 | Animate internal event names | not public | ours: event-bus model [OUR DESIGN DECISION] |
| A7 | Broken-reference placeholder exact look | Adobe shows placeholder; exact rendering unknown | ours: select + toast [M.15] |
| A8 | NaN/huge coordinate behavior | Adobe behavior unknown | ours: clamp/ignore NaN in hit math [M.8] |

> These are the ONLY items the blueprint itself tags as uncertain. Everything else is either fully specified or explicitly `[OUR DESIGN DECISION]`.

---

## 22. DUPLICATES MERGED

The blueprint describes many features in multiple places; merged into single inventory items with all references:

| Feature | Appears in | Merged to |
|---|---|---|
| Timeline resize/min-height | C-06 · C-08 · engineering 11 · §16 | §5 Timeline panel (min 96px, max 60%) |
| Layer lock/hide/outline | Part 01 §1.5 · Part 07 §7.1 · Part 20 §20.2 · C-22 | §3.21.3 (with Alt=others, drag-through, cascade) |
| Eye/lock/outline Alt+drag modifiers | F-07-02 · REQ-LAY-002 · C-22 | §3.21.3 |
| Registration vs pivot vs center | Part 03 §3.8 · Part 04 §4.7 · Part 11 §11.2 | §3.4.9 |
| Merge model | Part 05 §5.3.2 · Part 06 §6.1 | §3.7.3 |
| Break-apart hierarchy | Part 05 §5.1.14 · Part 06 §6.8 · Part 11 §11.7 · REQ-SHP-003 | §3.8.11 |
| Frame visual language | Part 07 §7.2 · REQ-TIM-002 · C-08 | §3.9.5 |
| Hold rule / sparse storage | Part 07 §7.3 · ENG-011 · REQ-TIM-001 | §3.9.1 |
| Easing (Penner) | Part 09 §9.4 · F-09-05 · MOD-EASING | §3.11.5 |
| Graphic loop modes | Part 11 §11.4 · Part 18 §18.2 · REQ-SYM-001 | §3.13.8 |
| Frame Picker | Part 01 §1.13 · Part 11 §11.4 · Part 18 §18.5 · C-29 | §3.13.8 |
| Sync modes (Event/Start/Stop/Stream) | Part 17 §17.3 · REQ-AUD-001 · C-28 | §3.18.4 |
| 12 visemes | Part 18 §18.1 · F-18-01 · MOD-VISEME | §3.19.1 |
| Camera 3 zooms | Part 02d T2D.5 · Part 16 §16.0 | §3.17.1 |
| Contact-sensitive | Part 02a T2A.1 · Part 03 §3.3.3 · REQ-SEL-004 · C1 | §3.3.5 |
| Overlay/export separation | Part 01 §1.4.2 · REQ-EXP-002 · 06_rendering | §3.33.3 |
| Command pattern | Part 36.0.2 · 05_command_system · animator | §10.9 |
| 10 cross-cutting rules | Part 36 · REQ-SYS | §3.37.1 |

---

## 23. BLUEPRINT COVERAGE CHECK

**"Have I inspected every major section of the supplied blueprint?"** — **YES.**

### 23.1 Covered sections (read in full)
| Source | Files | Read |
|---|---|---|
| `ANIMATE_BLUEPRINT_MASTER.md` | 1 (all 36 parts) | ✅ full |
| `animate-blueprint/` | 36 parts | ✅ full (individual files for 02d, 03–19; master for 00–02c, 20–36) |
| `phase2-knowledge-base/00_MASTER_FEATURE_QUEUE.md` | 405-feature index | ✅ full |
| `phase2-knowledge-base/00_GLOBAL_DEEP_AUDIT.md` | discoveries/contradictions/uncertainties | ✅ full |
| `phase2-knowledge-base/00_PHASE_2_COMPLETE.md` | completion report | ✅ full |
| `phase2-knowledge-base/deep-research/` | 107 folders / 337 files | ✅ via queue+audit summaries + targeted grep of `[OUR DESIGN DECISION]` (24 files) — per-feature elaboration files not individually line-read |
| `phase2.5-ui/00_UI_RELIABILITY_MASTER.md` | 12 invariants, button/overlay/z-index/panel specs | ✅ full |
| `phase2.5-ui/01_UI_CONTRACT_QUEUE.md` | 38-contract index | ✅ full |
| `phase2.5-ui/contracts/C-01…C-38` | all 38 UI contracts | ✅ full |
| `engineering/00…18` | all 20 engineering files | ✅ full |
| `animator/` (code) | README, STATUS, core/src/*.rs, ui/src/* | ✅ full (Rust: model/session/command/eval/wasm/export/persist/easing; TS: client/App/panels/engine/render) |

### 23.2 Sections containing NO feature requirements (documentation-only)
- `docs/BUGS.md` — template only (no logged bugs).
- `docs/TEST_REPORT.md` — template + empty log.
- `.vscode/` — editor config.
- `.gitignore` · `scripts/` — build/dev helpers (not product features).
- `ANIMATE_BLUEPRINT_MASTER.md` header/intro — preamble only.

### 23.3 Sections needing manual review (flagged, not blocking)
- **Deep-research per-feature files (337):** content is summarized by the master queue (which lists every sub-feature + dependency) and the global audit (which lists every discovery/contradiction/uncertainty/design-decision). For the construction map these summaries are complete; a byte-exact re-read of all 337 files is advisable **only** when implementing an individual feature (each file carries the feature's limitation/edge-case/test matrix — referenced by `F-XX-YY` throughout this inventory).
- **`phase2.5-ui/00_UI_RELIABILITY_COMPLETE.md`** — completion log (no new features).
- **`engineering/00_PHASE_3_COMPLETE.md`** — completion report (no new features).

### 23.4 Totals (verified)
- **405 features** (F-01-01 … F-36-04), 100% audited.
- **38 UI contracts**, 38/38 UI COMPLETE.
- **68 REQs** (24 groups) · **54 modules** · **20+ entities** · **25+ commands** · **8 state machines** · **24 decisions** · **15 risks**.
- **10 discoveries** (D1–D10) · **5 contradictions** (C1–C5) · **13 wishes** (W1–W13) · **4 uncertainties** · **4 dependency gaps** (GAP-001..004).
- **Implementation:** 214 Rust + 277 UI tests green (verified by running).

---

**— END OF THE 23-SECTION MASTER FEATURE INVENTORY —**
