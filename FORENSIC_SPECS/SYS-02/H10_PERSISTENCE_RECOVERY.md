# H10 — PERSISTENCE + RECOVERY + CROSS-SYSTEM

## 1. Document Status

SPECIFICATION STATUS: **READY FOR IMPLEMENTATION** (scope-limited; see §15)
IMPLEMENTATION STATUS: **NOT IMPLEMENTED**

Revision: **H10-RELEASE** · Parent: **SYS-02 File System** · Constitution: **H00**

> Authority: Blueprint > Phase 2 > Phase 2.5 > Phase 3 > approved decisions > H00 > prior H-files > Adobe (comparison) > code (evidence only).

---

## 2. Scope

H10 owns the **SYS-02 ↔ SYS-28 persistence handoff contract**: the persistence boundaries, autosave trigger semantics, crash-recovery prompt semantics, document-identity persistence, versioning/migration handoff, and cross-system handoff ownership. H10 is the SYS-02 side of the persistence boundary.

H10 does NOT own: the serializer/atomic-write/autosave/checksum IMPLEMENTATION (→ **SYS-28** MOD-PERSIST/MOD-AUTOSAVE) · Save semantics (→ **H05**) · Open semantics (→ **H06**) · Close/Exit lifecycle (→ **H07**) · import/export/publish engines (→ **SYS-27**).

---

## 3. Authority / Evidence Map

| Source | Establishes |
|---|---|
| Phase 3 eng 13 (MOD-PERSIST) | atomic write; `.autosave` slot; recovery prompt; formatVersion + migrate; corruption → refuse + offer `.autosave` |
| Phase 3 eng 13 (MOD-AUTOSAVE) | autosave debounced (2s + 30s interval `[ENGINEERING DECISION]`); never overwrites manual save |
| Blueprint Part 33 §33.1 | project schema `{id, formatVersion, meta, settings, scenes, library, brushes, masterAudioTrack, preferences}` |
| Blueprint Part 36 §36.0.10 / W11 | crash-safety; offline/local-first |
| Blueprint Part 28 §28.8 | project = JSON + `assets/` folder (lossless master) |
| H00 §14 | 6 persistence boundaries; INV-PERS-1/2/3 |
| H00 §15 | native desktop authoritative; browser = dev mode; INV-NATIVE-1/2 |
| SYS-02 §16/§18 | save/open handoff wiring; persistence firewall |
| SYS-02 §24 P-7/P-9 | template store = deployment detail; formatVersion = SPEC-vs-IMPL gap |
| H05/H06 | save/open handoff triggers + result events |
| AI01_FORENSIC_LESSONS.md | FL-0004 (meta ownership), FL-0011 (identity), FL-0016 (scope), FL-0017 (code authority) |

---

## 4. Persistence Boundaries (authoritative — H00 §14, SYS-01 §18)

| Boundary | Contents | Owner | SYS-02 role |
|---|---|---|---|
| DOCUMENT | scenes/layers/frames/symbols/settings/audio/formatVersion + `assets/` | **SYS-28** | trigger Save/Open; handoff; UI feedback |
| PREFERENCES | workspace layout, shortcuts, theme, recent-files list, template-store location (P-7) | SYS-01 + SYS-02 (recent) | owns recent-files list |
| SESSION | activeDocumentId, open-set, per-doc selection/playhead/History, tab order | SYS-02/SYS-01 | in-memory only |
| TEMPORARY | dirty flag, save state (STM-DIRTY), panel temp resize | SYS-02/SYS-01 | in-memory only |
| RECOVERY | `.autosave` slot | **SYS-28** | reference (trigger + prompt UI) |

**INV-PERS-1/2/3 (binding):** SYS-02 never implements atomic-write/autosave/recovery/migration/corruption internals; it defines the exact handoff (trigger → SYS-28 API → result event → UI). Workspace/preferences are NEVER written into the project file.

---

## 5. Handoff Contracts (canonical)

### 5.1 Save handoff (H05 → SYS-28)

```
file.save() / file.saveAs()  [SYS-02/H05]
  → SYS-28 persist::save(doc, path)   [atomic tmp→rename + checksum]
  → result: ok | fail
  → event: saving:changed{saved, time} | saving:changed{error}
  → SYS-02 UI: "Saved hh:mm" | "Save error" (H05 §7.1 sequence)
```

### 5.2 Open handoff (H06 → SYS-28)

```
file.open(path)  [SYS-02/H06]
  → SYS-28 persist::load(path)   [validate → migrate → re-link → integrity]
  → result: ok (Document) | fail (invalid/missing/corrupt/version)
  → ok: Session::load (History::new, selection empty, playhead 1) → openSet:changed{added} → activeDoc:changed
  → fail: CASE A (prior active intact) / CASE B (stays NO_DOCUMENT) — toast
```

### 5.3 Autosave trigger (SYS-02 → SYS-28)

- SYS-28 owns the debounced autosave timer (`[ENGINEERING DECISION]`: 2s after last change + 30s interval).
- Autosave writes to the `.autosave` slot — **never overwrites the user's last manual save**.
- Autosave does NOT emit `saving:changed{saved}` (that event = manual save only) and does NOT clear DIRTY.
- SYS-02 observes autosave only indirectly (recovery prompt on next launch).

### 5.4 Recovery prompt (SYS-28 → SYS-02 UI)

- On launch, if `.autosave` is newer than the project file → SYS-28 signals SYS-02; SYS-02 shows the recovery prompt (H00 §6.3 T12–T14).
- **Accept** → recovered doc ACTIVE(TITLED, CLEAN); `activeDoc:changed`.
- **Discard** → `.autosave` kept or cleared per SYS-28; NO_DOCUMENT.

---

## 6. Document Identity Persistence

| Field | Writer | When | Source |
|---|---|---|---|
| `id` (Document ID) | MOD-DOC | on creation; preserved on save/load | Part 33 §33.1 |
| `formatVersion` | SYS-28 | on write | Part 33 §33.1 (P-9: SPEC-vs-IMPL gap — field ABSENT in current code) |
| `meta.title` / `meta.author` | SYS-06/SYS-17 | after creation | Part 26 §26.1 |
| `meta.createdAt` | H01 | on New/New-from-Template | H01 §7 |
| `meta.modifiedAt` | H05 | on successful save only | H05 §7.1 |
| file path | SYS-28 (via H05/H06) | Save As / Open | — |

**Identity invariants (binding):** Document ID ≠ path ≠ title (INV-IDENT-1); Save As preserves ID (INV-IDENT-2); no duplicate ID/path in open-set (INV-IDENT-4). `formatVersion` migration = SYS-28 `migrate(from,to)` (pure); unmigratable → refuse (H06 failure path).

---

## 7. Versioning / Migration / Corruption (SYS-28-owned; SYS-02 handoff only)

| Concern | Behavior | Owner |
|---|---|---|
| versioning | `formatVersion` monotonic; `migrate(from,to)` pure | SYS-28 |
| integrity | orphan node refs → placeholder + warn; broken dataRef → warn + skip | SYS-28 |
| corruption | checksum mismatch → refuse load, offer `.autosave`/backup | SYS-28 |
| partial write | `.tmp` discarded; last-good intact (atomic rename) | SYS-28 |

SYS-02 observes these ONLY as Open success/failure outcomes (H06 §11). No internals absorbed (INV-PERS-1).

---

## 8. Identity Safety (re-audit)

| Risk | Rule | Source |
|---|---|---|
| duplicate Document ID | forbidden (INV-IDENT-4 / D-AMB-001) | H00 §5 |
| accidental identity replacement | Save As preserves ID; Open adopts file's ID into a NEW session | H00 §5 |
| stale path | recent-list stale entry → toast + skip (H06) | H06 §11 |
| title/path confusion | title display-only; path = location | H00 §5 |
| session ID vs document ID | open-set key = Document ID; active pointer = Document ID (both same ID, distinct role) | H02 §6 |

---

## 9. Cross-System Handoff Ownership (canonical)

| Concern | ONE owner | SYS-02 role |
|---|---|---|
| serializer / atomic write / checksum | SYS-28 | trigger + feedback |
| autosave timer + `.autosave` slot | SYS-28 (MOD-AUTOSAVE) | observe recovery prompt |
| recovery prompt UI | SYS-02 (H00 T12–T14) | present Accept/Discard |
| migration `migrate(from,to)` | SYS-28 | Open handoff |
| corruption detection | SYS-28 | Open failure surface |
| recent-files list | SYS-02 | own the list (H06) |
| template store location | deployment detail (P-7) | mechanism only (H01) |
| import/export/publish | SYS-27 | menu handoff (H08) |

No concern has two owners.

---

## 10. Failure Behavior

| Failure | Feedback | State | Dirty | Recover | Owner |
|---|---|---|---|---|---|
| save fail (disk/permission/read-only) | "Save error" + toast | stays DIRTY (SAVE_ERROR); last-good intact | preserved | retry | H05/SYS-28 |
| open fail (invalid/missing/corrupt/version) | toast | CASE A/B unchanged | unchanged | re-select / `.autosave` | H06/SYS-28 |
| corrupt `.autosave` on recovery | skip + toast | NO_DOCUMENT | n/a | re-open | SYS-28 |
| partial write (crash mid-save) | `.tmp` discarded; last-good intact | unchanged | preserved | — | SYS-28 |
| checksum mismatch on load | refuse + offer `.autosave`/backup | unchanged | unchanged | `.autosave` | SYS-28 |

No silent failure (INV-ERR-1); failed save never clears DIRTY (INV-DIRTY-2/INV-008).

---

## 11. Browser vs Native (authoritative — H00 §15, INV-NATIVE-1/2)

| Concern | Native (authoritative) | Browser (dev) | Rule |
|---|---|---|---|
| file picker | native OS picker | (unwired) | spec = native; browser = IMPL gap |
| save dialog | native save dialog | `downloadBlob` | spec = native path identity; downloadBlob = dev-only |
| `.autosave` + recovery | real FS slot | n/a | spec = native; browser dev-harness |
| path identity | real paths | none | path identity only native |

Current-code divergences (u64 IDs, downloadBlob, no formatVersion, single Session) are IMPL gaps — never spec reductions (FL-0017).

---

## 12. Forensic Pre-Flight

**Lessons consulted:** FL-0001..0032.

**Checks passed:**
- [x] scope — handoff contract only; no SYS-28 internals absorbed — FL-0016/INV-PERS-1
- [x] ownership — one owner per persistence concern (§9) — FL-0009
- [x] identity — ID≠path≠title; Save As preserves ID; no dup — FL-0011
- [x] meta ownership — createdAt=H01, modifiedAt=H05, title/author=SYS-06/17 — FL-0004
- [x] dirty — autosave/recovery never clear DIRTY — FL-0014
- [x] code authority — u64/downloadBlob/formatVersion = gaps, not spec — FL-0017
- [x] no invented behavior — all from eng 13 / Part 33 / Part 36 / H00

---

## 13. Adversarial Audit Findings

| # | Finding | Type | Resolution |
|---|---|---|---|
| F1 | (risk) H10 absorbing SYS-28 atomic-write/autosave internals | scope (FL-0016) | RESOLVED — handoff only (§2/§5) |
| F2 | (risk) autosave clearing DIRTY | dirty (FL-0014) | RESOLVED — autosave never clears DIRTY (§5.3) |
| F3 | (risk) recovery "accept" starting DIRTY | dirty | RESOLVED — recovered doc starts CLEAN (H00 T13) |
| F4 | (risk) formatVersion presented as implemented | status (FL-0018) | RESOLVED — P-9 SPEC-vs-IMPL gap (§6) |
| F5 | (risk) recent-list store re-specified in H10 | scope | RESOLVED — recent list = H06 (H10 references AMB-003) |

No manufactured findings.

---

## 14. Ambiguity Register (H10-owned + inherited)

| AMB | Question | Owner | Critical? | H10 status |
|---|---|---|---|---|
| AMB-003 | recent-file list persistence store + API | **H10** | YES | **open** — store location/API is a deployment+SYS-28 detail; H06's Open-Recent wiring is non-blocking (handoff). Blocks "Open Recent ships" at H10/SYS-28 integration |
| AMB-002 | collision-recovery if load produces a duplicate Document ID | **H10** | YES | **open** — the no-duplicate invariant (INV-IDENT-4) is settled; the RECOVERY behavior (refuse-and-toast vs re-target) is source-silent. Not invented |
| AMB-004 | native desktop menu/accelerator (Tauri) wiring | **H10/H11** | YES | **open** — ENG-001 hybrid; exact Tauri accelerator wiring deferred to H11/platform integration |

---

## 15. Completion Checklist + Final Report

- [x] 6 persistence boundaries (H00 §14) preserved
- [x] save/open/autosave/recovery handoff contracts defined (§5)
- [x] identity persistence + meta ownership (§6)
- [x] versioning/migration/corruption = SYS-28 handoff (§7)
- [x] identity safety re-audit (§8)
- [x] cross-system ownership matrix (§9)
- [x] failure behavior (§10)
- [x] browser/native boundary (INV-NATIVE-1/2) (§11)
- [x] lessons pre-flight passed
- [x] AMB-002/003/004 registered (H10-owned), NOT invented

STATUS: **READY FOR IMPLEMENTATION** · Boundaries: 6 · Handoffs: 4 (save/open/autosave/recovery) · Ambiguities: 3 H10-owned (AMB-002/003/004 — all correctly registered, block the relevant integration, NOT the H10 handoff contracts) · Findings: 5 (resolved).

> Note: H10's handoff CONTRACTS are implementation-ready; AMB-002/003/004 are integration decisions owned by H10 that must be resolved before the corresponding integration ships — they are explicitly registered, not guessed.

---

*H10 done. Next: H11.*
