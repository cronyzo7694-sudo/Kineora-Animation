# H05 — SAVE + SAVE AS + FILE IDENTITY

## 1. Document Status

STATUS: **READY FOR IMPLEMENTATION**

Revision: **H05-RELEASE** · Parent: **SYS-02 File System** · Constitution: **H00**

---

## 2. Scope

H05 owns ONLY: Save, Save As, file identity/path handoff, title/path relationship (authoritative only), save command contracts, success/failure, overwrite semantics, Save-As identity behavior, `modifiedAt` ownership, clean-after-success, handoff to SYS-28 atomic write.

H05 does NOT own: dirty calculation → **H04**; persistence internals → **SYS-28**; open → **H06**; close → **H07**.

---

## 3. Authority / Evidence Map

| Source | Establishes |
|---|---|
| Blueprint Part 01 §1.2.1 | Save / Save As / Save as Template; Ctrl+S / Ctrl+Shift+S |
| Phase 3 eng 13 | atomic tmp→rename + checksum (SYS-28); "Saved hh:mm" |
| Phase 3 eng 03 | `meta{modifiedAt}`; lifecycle `edited → saved` |
| STM-DIRTY | write success → CLEAN; failure → ERROR (stay DIRTY) |
| H00 §5 (identity) | Document ID ≠ path; ID survives Save As; title display-only |
| H00 §7 (dirty) | save success → CLEAN; save failure preserves DIRTY |
| H00 §13 (undo) | Save does NOT clear undo history |
| SYS-02 §24 P-1 | Save = overwrite, NO confirmation |
| SYS-02 §24 P-6 | clean Save = idempotent, "Saved hh:mm" |
| SYS-02 §24 P-9 | formatVersion = SPEC gap (SYS-28) |
| SYS-01 §27.1 | `saving:changed` event (payload `{state, time?}`) |
| H00 §5 INV-IDENT-4 (D-AMB-001) | no duplicate Document ID / saved path in the open-set → Save As to an already-open path is BLOCKED |
| AI01_FORENSIC_LESSONS.md | FL-0004 (meta ownership), FL-0017 (code authority), FL-0011 (identity) |

---

## 4. Dependency Map

H05 depends on: H04 (dirty→CLEAN), H00 §5 (identity, INV-IDENT-4), SYS-28 (atomic write), SYS-01 §27.1 (saving:changed).
H05 provides to: H07 (guard "Save" path), H02 (title/dirty reflect), H04 (→CLEAN).
H05 does NOT own: SYS-28 write internals.

---

## 5. Terminology

| Term | Definition |
|---|---|
| Save | serialize + write the document to its current path (or prompt if untitled) |
| Save As | write to a NEW path; changes path (→ TITLED); identity unchanged |
| File identity | = Document ID (never path, never title) |
| modifiedAt | `meta.modifiedAt`, set by H05 on successful save |

---

## 6. Identity Constitution (binding)

- Document ID survives Save As (identity unchanged; path changes).
- Title is NOT identity. Title derivation from filename on first save = UNRESOLVED (AMB-H05-001). RECOMMENDATION — NOT AUTHORITATIVE: derive title from filename on first save.
- Save As to an existing path **on disk** (not already open) = overwrite (P-1, no confirm).
- **Save As to a path already owned by ANOTHER open document = BLOCKED**: explicit error, source document unchanged (dirty/History/session preserved), user must choose a different path. Derived from INV-IDENT-4 / D-AMB-001 (one saved path = at most one open document). The Blueprint is silent on this exact case; blocking is the only behavior consistent with the locked invariant.
- Two documents may share a title (display-only).

---

## 7. State Model + Transitions

Save path (STM-DIRTY):

| # | Current | Trigger | Next | Event | UI |
|---|---|---|---|---|---|
| T1 | (any) | Save/Save As start | SAVING | `saving:changed{saving}` | "Saving…" |
| T2 | SAVING | write ok | CLEAN | `saving:changed{saved}` | "Saved hh:mm"; ● cleared |
| T3 | SAVING | write fail | SAVE_ERROR (DIRTY) | `saving:changed{error}` | "Save error" |
| T4 | SAVE_ERROR | retry | SAVING | `saving:changed{saving}` | "Saving…" |

Save on a CLEAN doc = idempotent write (P-6): still writes + "Saved hh:mm" (no special no-op path). Save on UNTITLED = Save-As path prompt first.

### 7.1 Canonical successful-save sequence (binding order — do NOT reorder)

1. SYS-28 `persist::save` completes (atomic tmp→rename + checksum) — write SUCCEEDS.
2. Persisted content on disk is now authoritative.
3. `modifiedAt` ← now (H05).
4. Saved snapshot advances to the persisted state.
5. dirty → CLEAN (STM-DIRTY T2).
6. `saving:changed{saved}` emitted (payload `{state:'saved', time}`).
7. Dependent UI updates: status "Saved hh:mm"; dirty ● clears; H02 tab re-reads path/title/dirty.

### 7.2 Failure sequence (binding)

On write failure (disk/permission/read-only): the previous good file stays intact (atomic tmp→rename never published), dirty stays DIRTY (SAVE_ERROR), History preserved, `modifiedAt` NOT updated, snapshot NOT advanced. Emit `saving:changed{error}`. Recoverable via retry.

---

## 8. Commands / Controls

| Control | commandId | Trigger | Precondition | Action | State | Event | Dirty | Undo | Persist | Error | testId |
|---|---|---|---|---|---|---|---|---|---|---|---|
| file.save | `file.save()` | Ctrl+S / menu | doc open | untitled→prompt path; else write current path (SYS-28) | →SAVING→CLEAN | saving:changed | →CLEAN | no (history preserved) | DOCUMENT | write fail → "Save error" | T-save |
| file.saveAs | `file.saveAs()` | Ctrl+Shift+S / menu | doc open | prompt NEW path → write (SYS-28) | →SAVING→CLEAN; path changes (TITLED) | saving:changed | →CLEAN | no | DOCUMENT | fail → toast | T-save-as |
| (native save dialog) | (OS picker) | — | untitled/As | select path | — | — | — | — | — | cancel → no change | T-save-dialog |

**Handoff (binding):** H05 → SYS-28 `persist::save(doc, path)` (atomic tmp→rename + checksum). H05 never implements the write. Result event → H05 UI update.

---

## 9. Event Propagation

| Change | Event | Payload | Consumers |
|---|---|---|---|
| save start | `saving:changed{saving}` | `{state:'saving'}` | st.saving |
| save ok | `saving:changed{saved}` | `{state:'saved', time}` | st.saving, dirty indicator, H02 tab |
| save fail | `saving:changed{error}` | `{state:'error'}` | st.saving ("Save error") |

**Canonical payload (single source, SYS-01 §27.1):** `saving:changed{ state: 'saving' | 'saved' | 'error', time? }` — `time` = "Saved hh:mm" timestamp, meaningful only for `{saved}`. No other schema anywhere (H04/H05/SYS-01 aligned).

**Metadata propagation after Save/Save As (exact):** on `saving:changed{saved}`, the H02 tab re-reads the saved document's `meta.title` and dirty flag (path is internal, not displayed). `document:changed` is NOT re-emitted for save (save is not a document mutation). No `activeDoc:changed` (the active pointer did not change — FL-0007).

---

## 10. Undo / Persistence

- Save/Save As: no document undo; **does NOT clear undo history** (Part 12).
- Save As = FILE-SYSTEM (no undo).
- `modifiedAt` = written by H05 on success (FL-0004 meta ownership).
- Content = DOCUMENT (SYS-28); dirty = TEMPORARY (H04).

---

## 11. Error / Failure

| Failure | Feedback | State | Recover |
|---|---|---|---|
| write fail (disk/permission/read-only) | "Save error" + toast | DIRTY preserved (SAVE_ERROR); last-good intact (atomic) | retry |
| invalid path (Save As) | toast | unchanged | re-select |
| cancel (Save As dialog) | (silent) | unchanged | reopen |

No silent failure; no fake success.

---

## 12. Accessibility

Save dialog (native OS) — OS-managed a11y. "Saved hh:mm" announced (aria-live). Save/Save As menu items: role=menuitem, shortcut announced.

---

## 13. Edge-Case Matrix

| # | Case | Expected | Owner | testId |
|---|---|---|---|---|
| 1 | first Save (untitled) | prompt path → write → TITLED+CLEAN | H05 | T-save-untitled |
| 2 | Save existing titled doc | overwrite, no confirm (P-1) | H05 | T-save-titled |
| 3 | Save As | prompt → write new path → identity unchanged | H05 | T-save-as |
| 4 | overwrite existing path (Save As) | overwrite, no confirm | H05 | T-save-as-overwrite |
| 5 | Save failure | DIRTY preserved, "Save error", last-good intact | H05/H04 | T-save-fail |
| 6 | read-only path | OS failure → save-fail path | H05/SYS-28 | T-save-readonly |
| 7 | permission failure | save-fail path | H05 | T-save-perm |
| 8 | same target path | overwrite (identity same, path same) | H05 | T-save-same |
| 9 | Save on clean doc | idempotent write, "Saved hh:mm" (P-6) | H05 | T-save-clean |
| 10 | Save on dirty doc | →CLEAN | H05/H04 | T-save-dirty |
| 11 | title/path interaction | title may = filename `[AMB-H05-001]` | H05 | T-save-title |
| 12 | modifiedAt | updated on success only | H05 | T-save-modifiedAt |
| 13 | save does NOT clear undo | history intact after save | H05/H03 | T-save-undo-preserved |
| 14 | event ordering | saving→saved (no fake activeDoc) | H05 | T-save-event |
| 15 | Save As to a path already open as another doc | BLOCKED (explicit error; source unchanged, dirty/History/session preserved) | H05/H02 | T-save-as-open-path-block |

---

## 14. Cross-Handoffs

| Producer → H05 | H05 response |
|---|---|
| H04 dirty flag | write → CLEAN |
| H07 guard "Save" | save then signal close proceeds |
| SYS-28 persist | write success/fail → event |
| H02 tab | reflect title/path/dirty after save |

H05 never implements dirty calc (H04) or close (H07).

---

## 15. Dead-Control Audit

file.save / file.saveAs / native dialog — all real paths. No dead control. No invented "Save All" (Adobe-only, excluded per SYS-02 §23).

---

## 16. Ownership Audit

| Concern | Owner |
|---|---|
| save command/wiring | H05 |
| atomic write | SYS-28 |
| dirty → CLEAN | H04 (flag) |
| modifiedAt | H05 |
| formatVersion | SYS-28 (P-9 gap) |

---

## 17. Forensic Pre-Flight

Lessons: FL-0001..0030. Checks: scope ✓ · ownership ✓ (no SYS-28 absorb) · events ✓ (saving:changed canonical payload, no fake activeDoc) · identity ✓ (ID survives Save As; Save-As→open-path blocked, INV-IDENT-4) · dirty/undo ✓ (save≠clear, FL-0015) · persistence ✓ · a11y ✓ · edge ✓ · code-authority ✓ (downloadBlob = gap, not spec).

---

## 18. Adversarial Audit Findings

| # | Finding | Type | Resolution |
|---|---|---|---|
| F1 | (risk) overwrite confirmation invented | confirmation | RESOLVED — P-1: no confirm (Blueprint+Adobe) |
| F2 | (risk) Save clearing undo history | undo/data-loss | RESOLVED — Part 12: save preserves history |
| F3 | (current-code) downloadBlob vs native save | authority | RESOLVED — native = spec; downloadBlob = dev-only gap |

---

## 19. Ambiguity Register

| AMB-ID | Question | Sources | Critical? | Recommendation (NOT authoritative) |
|---|---|---|---|---|
| AMB-H05-001 | Does Save As derive the document title from the filename? | Blueprint silent (title = meta.title; New dialog has no title) | NO | title = filename on first save (common convention) — needs product decision only if title display matters |

Zero implementation-critical ambiguity (title is display-only, non-blocking).

---

## 20. Test ID Matrix

T-save-untitled · T-save-titled · T-save-as · T-save-as-overwrite · T-save-fail · T-save-readonly · T-save-perm · T-save-same · T-save-clean · T-save-dirty · T-save-title · T-save-modifiedAt · T-save-undo-preserved · T-save-event · T-save-dialog

---

## 21. Completion Checklist

- [x] H00 identity rules (ID ≠ path; ID survives Save As)
- [x] P-1 (overwrite, no confirm) + P-6 (idempotent clean save)
- [x] STM-DIRTY (success→CLEAN, fail→stays DIRTY)
- [x] save ≠ clear undo (Part 12)
- [x] modifiedAt ownership (H05)
- [x] SYS-28 handoff (atomic write), no internals absorbed
- [x] no dead controls; no invented Save All
- [x] Save As to an already-open path = BLOCKED (INV-IDENT-4)
- [x] 15 edge cases
- [x] lessons pre-flight passed

---

## 22. Final H05 Report

STATUS: **READY FOR IMPLEMENTATION** · Controls: 3 · Commands: 2 (`file.save`, `file.saveAs`) · States: 4 (via STM-DIRTY) · Transitions: 4 · Edge cases: 15 · Ambiguities: 1 (non-blocking, AMB-H05-001) · Findings: 3 (resolved).

---

*H05 done. Next: H06.*
