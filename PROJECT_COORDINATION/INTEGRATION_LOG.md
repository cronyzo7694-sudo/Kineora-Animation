# KINEORA — INTEGRATION LOG (cross-system changes)

> Every cross-system change is recorded here: what changed, why, affected systems, evidence, review, status. No silent cross-system drift (FL-0016/FL-0009).

| INT | Date | Changed | Affected | Reason | Evidence | Review | Status |
|---|---|---|---|---|---|---|---|
| INT-0001 | 2026-08-22 | `openSet:changed{change,docId?}` locked event added | SYS-01 (registry), SYS-02 H02/H12/H14 | open-set mutation had no propagation path (reorder/close-inactive) | D-AMB-004 (approved) | Leader | VERIFIED |
| INT-0002 | 2026-08-22 | `saving:changed` payload unified to `{state,time?}` | SYS-01 §27.1, SYS-02 H04/H05/H12 | payload drift `{time}` vs `{state,time}` | SYS-01 §27.1 canonical | Leader | VERIFIED |
| INT-0003 | 2026-08-22 | Open = add+activate (NO dirty guard) — single-doc relic removed | SYS-02 H00/H04/H06, SYS-03 (none) | "Replaces active doc (with save prompt)" misread; multi-doc has no data loss | Blueprint §1.1.3 + D-AMB-001 | Leader | VERIFIED |
| INT-0004 | 2026-08-22 | `file.close()` vs `tab.close(docId)` separated (two commands) | SYS-02 H07/H09, SYS-01 §30 (stale note), SYS-02_file.md §8 (stale note) | inactive-tab close must not close active doc | Blueprint §1.2.1 + D-7 | Leader | VERIFIED (SYS-01/SYS-02_file.md stale notes remain, flagged for revision) |
| INT-0005 | 2026-08-22 | Delete = `edit.delete()` (not "Clear"); "Clear Frames" = SYS-15 handoff | SYS-03 H02/H04 | "Delete" vs "Clear" conflation | Part 03 §3.4.1 | Leader | VERIFIED |
| INT-0006 | 2026-08-22 | clipboard = application-level (shared across docs), SESSION | SYS-03 H02 | cross-doc paste scope | Part 30 ContextMenuBuilder (clipboard ≠ doc-state) | Leader | VERIFIED |
| INT-0007 | 2026-08-22 | Find & Replace = 5 targets, Replace-All = one journal command | SYS-03 H03 | depth + atomicity | Part 01 §1.2.2 + Part 23 + eng 05 | Leader | VERIFIED |
| INT-0008 | 2026-08-22 | Foundation contract published (BUS/STATE/COMMAND/VECTOR/COLOR/EASING/DOC) — resolves FND-001 | all 28 SYS (cross-cutting) | no single owner-contract existed | engineering 02/03/04/05/06 + Blueprint 05/06/09.4/23/33 | Leader | VERIFIED |

---

## Open integration items (awaiting resolution)

| Item | Affected | Status |
|---|---|---|
| SYS-01 §30 "File▸Close → tab.close(id)" stale (should be `file.close()`) | SYS-01 (LOCKED) | OPEN — future controlled SYS-01 revision |
| SYS-02_file.md §8 "tab ctx Close = file.close()" stale (should be `tab.close(docId)`) | SYS-02_file.md (consolidated) | OPEN — future revision |
| Foundation modules (BUS/STATE/COMMAND/VECTOR/COLOR/EASING/DOC) need a published owner-contract | all 4 groups | **RESOLVED** — FOUNDATION_CONTRACT.md |

---

*Every cross-system change = new INT row. Leader verifies before any other AI's files are modified.*
