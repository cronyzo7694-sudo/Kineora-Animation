# BLOCKERS — Kineora Animation (Canonical Coordination Register)

> **Provenance (merged 2026-08-22):** this register was CREATED by worker AI-D (`e3690f7`), extended
> by AI-B (`d5085d8`), and now MERGED by AI-01 (Leader) with the Leader's own blocker set.
> **Merge rule:** NO entry deleted. Every worker entry preserved verbatim with status updated where
> the Leader's reconciliation resolved it. Leader entries appended in their own section.
>
> **Status legend:** `OPEN` · `RESOLVED` · `PARTIAL` · `SUPERSEDED` · `DEFERRED`

---

## PART 1 — WORKER RAISED BLOCKERS (preserved verbatim, status reconciled)

### BLK-D-001 — Mandatory reading file `AI01_FORENSIC_LESSONS.md` does not exist
- **Status:** **RESOLVED** (2026-08-22, AI-01 reconciliation) — the file is committed at
  `FORENSIC_SPECS/AI01_FORENSIC_LESSONS.md` (FL-0001..0034). Workers must re-read it before coding.
- **Raised by:** AI-D, 2026-08-22
- **Original evidence:** `find` + `git log --all` showed no `*FORENSIC*` file ever committed.
- **Resolution note:** the file existed only in the Leader's local workspace (untracked); it is now
  in git history. NOT fabricated — pre-existing, append-only, FL-0001..0034 continuous.

### BLK-D-002 — Entire `PROJECT_COORDINATION/` mandatory reading set missing
- **Status:** **RESOLVED** (2026-08-22, AI-01) — the full pack is now committed:
  `MASTER_EXECUTION_PLAN.md`, `FOUNDATION_CONTRACT.md`, `FOUNDATION_FINAL_FORENSIC_REPORT.md`,
  `CROSS_SYSTEM_CONTRACT.md`, `AI_ASSIGNMENTS.md`, `PROJECT_BOARD.md`, `DECISIONS.md`,
  `INTEGRATION_LOG.md`, `CHANGELOG.md`, `BLOCKERS.md` (this file), `FINAL_GATE_REPORT.md`,
  `HANDOFFS/`.
- **Raised by:** AI-D, 2026-08-22

### BLK-D-003 — SYS-22..SYS-28 formal specifications missing
- **Status:** **PARTIAL** (2026-08-22, AI-01) — still no `SYS-22..SYS-28` spec docs (they are
  QUEUED). Committed now: `FOUNDATION_CONTRACT.md` (P0/P1 modules), SYS-02 H00–H14, SYS-03 H00–H07.
  Workers may proceed on **Blueprint + Phase 2/2.5/3 + engineering authority** (which outrank
  specs) WITH Leader authorization — see DECISIONS.md.
- **Raised by:** AI-D, 2026-08-22

### BLK-D-004 — No AI-A / AI-B / AI-C work exists; single-branch repo
- **Status:** **OPEN (informational)** — AI-B and AI-D have now checked in (reports + attendance).
  AI-A and AI-C still absent. Workers re-fetch before every push.
- **Raised by:** AI-D, 2026-08-22

### BLK-B-001 — `AI01_FORENSIC_LESSONS.md` does not exist (AI-B)
- **Status:** **RESOLVED** (2026-08-22, AI-01) — same as BLK-D-001.
- **Raised by:** AI-B, 2026-08-22

### BLK-B-002 — Coordination pack incomplete at AI-B session start
- **Status:** **RESOLVED** (2026-08-22, AI-01) — same as BLK-D-002.
- **Raised by:** AI-B, 2026-08-22

### BLK-B-003 — SYS-08..SYS-14 formal specifications missing
- **Status:** **PARTIAL** (2026-08-22, AI-01) — still no `SYS-08..SYS-14` spec docs (QUEUED).
  **Aggravating factor preserved (from AI-B):** the registry "not started" label is misleading —
  command registry, all menus, playback, panels, 3 tools, stage/renderer are already FUNCTIONAL
  and tested in `animator/`. Implementing without a spec risks duplicating existing work.
  Proceed on Blueprint+engineering authority WITH Leader authorization.
- **Raised by:** AI-B, 2026-08-22

### BLK-B-004 — No AI-A / AI-C work exists (AI-B, informational)
- **Status:** **OPEN (informational)**
- **Raised by:** AI-B, 2026-08-22

### BLK-B-005 — GitHub PAT exposed in chat (security advisory)
- **Status:** **OPEN (security — does not block code)**
- **Raised by:** AI-B, 2026-08-22
- **Evidence:** the implementation-worker prompt transmitted a GitHub PAT in plaintext chat.
- **Needed to resolve:** **HUMAN coordinator must rotate/revoke the PAT in GitHub settings** and
  update the remote URL / secret store. No repo content change required. (AI-01 never wrote the
  token into any committed file.)

---

## PART 2 — LEADER BLOCKERS (AI-01, added 2026-08-22)

| ID | System | Question | Status |
|---|---|---|---|
| BLK-001 (AMB-H01-002) | SYS-02 H01 | duplicate template name (overwrite/rename/block) | OPEN — product decision |
| BLK-002 (AMB-H01-003) | SYS-02 H01 | New-from-Template seeded-doc identity | OPEN — product decision |
| BLK-003 (AMB-H07-001) | SYS-02 H07 | next-active after closing active doc | OPEN — product decision |
| BLK-004 (AMB-S03-003) | SYS-03 H02 | Paste Special format option list | OPEN — product decision |
| BLK-005 (AMB-002) | SYS-02 H10 | duplicate-ID collision recovery | DEFERRED (H10) |
| BLK-006 (AMB-003) | SYS-02 H10 | recent-list store + API | DEFERRED (H10) |
| BLK-007 (AMB-004) | SYS-02 H10/H11 | Tauri accelerator wiring | DEFERRED (H10/H11) |
| BLK-008 | global | native runtime UNVERIFIED (no build/test run this session) | OPEN — needs toolchain run OR governance approval |
| BLK-009 | global | canonical corpus was unversioned | **RESOLVED** (2026-08-22 — committed) |
| BLK-010 (AMB-H05-002) | SYS-02 H02/H05 | duplicate-title disambiguation (path hidden) | OPEN — product decision |

### Foundation (resolved)
| ID | Status |
|---|---|
| FND-001 (foundation modules had no owner-contract) | **RESOLVED** — `FOUNDATION_CONTRACT.md` committed |

---

## PART 3 — Implementation-evidence gaps (spec wins, code = gap — FL-0017)

| Gap | SPEC requires | Current code | Change |
|---|---|---|---|
| multi-document | open-set + activeDocumentId (H02) | doc_manager.rs exists on remote — VERIFY | — |
| native save path | native save dialog (H05) | remote has Tauri commands.rs — VERIFY | — |
| `formatVersion` | Part 33 §33.1 | P-9 gap | add field |
| ID type | UUID (Part 33) | u64 (P-10) | review |

> NOTE: the remote lineage (commits dee5c27..e3690f7) implemented SYS-01/SYS-02 code + tests that
> this Leader session had NOT yet audited. PART 3 items marked "VERIFY" must be re-checked against
> the now-merged code before the board status is finalized.

---

*Any worker discovering a NEW blocker: STOP that portion, file it here, return to Leader. Never guess.*
