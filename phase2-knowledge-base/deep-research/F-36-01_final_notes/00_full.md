# F-36-01..04 — FINAL NOTES (cross-cutting rules, budget, glossary, checklist)
```
SOURCE BLUEPRINT: Part 36 · DEEP FEATURES: F-36-01..04 · STATUS: AUDITED
DEPENDS ON: (all) · FEEDS: 00_GLOBAL_DEEP_AUDIT (Phase 3)
```
## A. IDENTITY
1. Official name: (final notes). 4. Purpose: the 10 cross-cutting rules + performance budget + glossary + completeness checklist that bind all parts. 8. Status: current.
## EVIDENCE
E1 [BLUEPRINT Part 36] rules + budget + glossary + checklist.
## F-36-01 CROSS-CUTTING RULES (10)
1. Single source of truth (Part 33 model) · 2. All mutations = Commands (Part 36 undo) · 3. Pure deterministic evaluate · 4. Stable IDs (rename-safe) · 5. Local-space + stable IDs for rigs [WISH W2] · 6. Sparse frame storage · 7. Dirty-region + layer caches · 8. Nothing is a black box (reports/confidence) · 9. Undo-consistent selection · 10. Crash-safety (autosave/recovery [WISH W11]).
## F-36-02 PERFORMANCE BUDGET
Playback ≤16ms/frame; hit-test <1ms@10k; tessellation <5ms; boolean <50ms; undo instant; lip-sync <5s/60s audio; save non-blocking; export frame-parallel.
## F-36-03 GLOSSARY
(36 terms: armature…z-depth — blueprint Part 36.2.)
## F-36-04 COMPLETENESS CHECKLIST
Data/model/editor/animation/reuse/characters/structure/I-O/cross-platform/[WISH] gates.
## L. LIMITATIONS
L.1 rules are constraints, not suggestions → CI checks. L.2 budget targets on low-end → degrade gracefully.
## M. EDGE CASES
M.1 autosave during crash (atomic write-temp→rename) · M.2 undo of a save (n/a) · M.3 budget miss on 4K export (worker).
## O/P/Q/R/S/Y
Data: none (meta). Events: n/a. Undo: n/a. Serialization: n/a. Implementation: enforced by architecture (Part 32) + tests.
## TESTS
TS-01 rules checklist · TS-02 budget targets · TS-03 glossary terms defined · TS-04 completeness checklist runnable · TS-05 autosave atomicity.
## AUDITS
No contradiction. Self-challenge: overlooked = atomic-save + deterministic-evaluate + nothing-is-black-box — covered.
```
FEATURE COMPLETE: F-36-01..04 — Final notes — AUDITED
```
