# H05–H08 FINAL ADVERSARIAL RE-AUDIT + CORRECTION REPORT

> AI-01 adversarial review pass. Objective: break the spec before AI-02 does.
> Reading order followed: AI01_FORENSIC_LESSONS.md → H00 → H01–H04 → H05–H08 → SYS-01/SYS-02 → Blueprint/Phase 2/2.5/3.
> Authority: Blueprint > Phase 2 > Phase 2.5 > Phase 3 > approved decisions > Adobe (comparison only) > code (evidence only).

---

## 1. Files Audited

H05 (Save/Save As/Identity), H06 (Open/Open Recent), H07 (Close/Close All/Exit), H08 (Import/Export/Publish handoffs) — cross-checked against H00–H04, SYS-01, SYS-02, Blueprint §1.1.3/§1.2.1, Phase 3 eng 03/04/13/14.

## 2. Sources Consulted

Blueprint `01_application_map.md` §1.1.3 (multi-doc) + §1.2.1 (File menu: Open "Replaces active doc (with save prompt)", Close "close active doc", D-7 per-tab ×) · SYS-01 §15/§27.1/§30 · SYS-02 §8/§15 · eng 04 STM-DIRTY · H00–H04.

## 3. External Research

None required — all resolutions came from Kineora's own sources (Blueprint §1.1.3 vs §1.2.1 consistency). No Adobe-only behavior imported.

---

## 4. Findings by Severity + Exact Corrections

| ID | Severity | Root cause | Evidence | Correction | Files | New lesson? |
|---|---|---|---|---|---|---|
| A-1 | P1 (ambiguity) | Blueprint §1.2.1 "Replaces active doc" left uninterpreted → could be misread as "Open removes the previous doc" (contradicts multi-doc §1.1.3 / H02 ADD model) | Blueprint §1.1.3 + §1.2.1 | Added binding resolution: "replaces active" = opened doc BECOMES active (pointer replaced); previous doc stays open (inactive); "with save prompt" = dirty guard. Renamed H00 §10 row "Replace-active-document" → "Open-activates-new-document" | H06 §3/§6; H00 §10 | **FL-0031** |
| A-2 | P2 (completeness) | H06 §6 step 2 listed only "Cancel ⇒ abort"; Save/Discard outcomes implicit | H04 §8 guard decision contract | Added Save ⇒ H05 write → CLEAN → proceed; Discard ⇒ proceed | H06 §6 | no |
| A-3 | P1 (command drift) | `file.close()` (active) vs `tab.close(docId)` (targeted) separation unproven; risk that tab-× on inactive doc closes the active doc | Blueprint §1.2.1 "Close = close active doc" + D-7 per-tab × | Added binding command-separation table + "MUST NOT merge" rule + cross-file revision notes (SYS-02_file.md §8 `file.close()` for tab ctx = stale; SYS-01 §30 "File▸Close→tab.close(id)" = stale) | H07 §9 | no (FL-0009 already covers ownership; this is its instance) |
| A-4 | P2 (state contradiction) | H08 §8 "Enabled: always" contradicted its own "Precondition: doc open" and §13 edge case 1 "disabled-by-context when no doc" | H08 §8 vs §13 | All 6 control rows: "always" → "doc open"; "Disabled reason" → "no document (disabled-by-context)" | H08 §8 | no (FL-0003 class) |
| A-5 | P1 (open ambiguity) | AMB-H07-001 (next active after close) — searched all Kineora sources; NO "next tab" rule exists | Blueprint/Phase 2/2.5/3/SYS-01/SYS-02/H00/H02 — all silent | NOT resolved (no authority). Kept REVISION REQUIRED; recommendation re-confirmed "NOT AUTHORITATIVE… MUST NOT be implemented as a binding rule" | H07 §7/§20 | no (already registered) |

---

## 5. Cross-H Corrections Made

- **H00 §10** (connected file, terminology only): "Replace-active-document (Open)" → "Open-activates-new-document (Open/Open-Recent)".
- **Cross-file revision tasks (recorded, NOT silently edited):** SYS-02_file.md §8 (tab ctx "Close" = `file.close()` → should be `tab.close(docId)`); SYS-01 §30 ("File▸Close → tab.close(id)" → should be `file.close()`). Both files are LOCKED/superseded-authority; recorded in H07 §9 for a future revision.

## 6. New Lessons Added

- **FL-0031** — Ambiguous source term left uninterpreted ("replaces active doc"). Category: Terminology/Authority. P1. Permanent rule: resolve a two-reading source term against the same source's other statements; never leave it to be misread downstream.

## 7. Lessons Reused (pre-flight + post-flight)

FL-0007/0008 (event semantics), FL-0009 (ownership), FL-0011 (identity), FL-0012 (a11y), FL-0014/0015 (dirty/undo leak), FL-0016 (scope), FL-0017 (code authority), FL-0018/0019 (status/testing), FL-0020 (counting), FL-0021/0024/0025/0027 (state), FL-0022/0023/0028 (decisions), FL-0026 (citation), FL-0029 (path collision), FL-0030 (payload).

## 8. Remaining Ambiguities / Recommendations

| AMB | Critical? | Status |
|---|---|---|
| AMB-H07-001 (next active after close) | **YES** | OPEN — H07 REVISION REQUIRED; recommendation NON-authoritative |
| AMB-H05-001 (title from filename) | NO | recommendation only |
| AMB-002 (collision recovery) | YES (H10) | deferred to H10 |

## 9. Command Registry Verification

`file.save()` / `file.saveAs()` (H05) · `file.open()` (H06, `file.openRecent` reuses) · `file.close()` + `tab.close(docId)` + `file.closeAll()` + `file.exit()` (H07) · `file.import(target)` / `file.export(format)` / `file.publishSettings()` / `file.publish()` / `file.publishProfiles()` (H08). No duplicates, no invented commands, no drift. `file.close()` vs `tab.close(docId)` = intentional (different target), proven A-3.

## 10. Event Registry Verification

`activeDoc:changed` / `openSet:changed` / `document:changed` / `saving:changed{state,time?}` / `library:changed` (SYS-18) / `export:done` (SYS-27). No refresh hacks, no fake events, no payload drift (FL-0030 fixed prior pass), no event before its state exists.

## 11. Dead-Control Audit

H05: file.save / file.saveAs / native dialog — real. H06: file.open / file.openRecent — real. H07: file.close / file.closeAll / file.exit — real. H08: 6 handoffs — real (now with correct disabled-by-context state, A-4). Zero dead controls.

## 12. State-Machine Audit

H05 (STM-DIRTY save path T1–T4) ✓ · H06 (OPENING→ACTIVE/OPEN_FAILED) ✓ with CASE A/B failure semantics · H07 (T1–T7; Close All atomic + single activeDoc{null}) ✓ · H08 (no SYS-02 state; SYS-27 owns STM-EXPORT/STM-JOB) ✓. No invariant/transition contradiction (FL-0025).

## 13. Identity / Data-Safety Audit

Save A → only A changes ✓ · Save As A → ID unchanged ✓ · Open B → A untouched ✓ · Close B → A untouched ✓ · Close A → clean removal ✓ · Save As A→B's open path → BLOCKED (INV-IDENT-4) ✓ · Open already-open B → no duplicate (D-AMB-001) ✓ · load failure → previous doc untouched (CASE A/B) ✓.

## 14. Accessibility Audit

Guard dialog: focus trap + Esc = Cancel sourced (C-07/STM-MODAL); initial focus = `[NOT SPECIFIED]` (recommendation only). H08 progress announced aria-live. No invented focus targets; no contract gap (FL-0012).

## 15. Final Status

| File | Status |
|---|---|
| H05 | **READY FOR IMPLEMENTATION** |
| H06 | **READY FOR IMPLEMENTATION** |
| H07 | **REVISION REQUIRED** (AMB-H07-001 — no authoritative source) |
| H08 | **READY FOR IMPLEMENTATION** |

---

*Adversarial re-audit complete. STOP — H09 not started; no code written; `animator/` untouched.*
