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

## PART 2 — AI-C RAISED BLOCKERS (preserved verbatim, status reconciled)

### BLK-AIC-001 — Mandatory reading corpus absent from repo at AI-C session start
- **Status:** **RESOLVED** (2026-08-22, AI-01 reconciliation `ca79555` — the full pack now exists: `AI01_FORENSIC_LESSONS.md`, `PROJECT_COORDINATION/`, `FORENSIC_SPECS/`, `MASTER_FEATURE_INVENTORY/`).
- **Raised by:** AI-C, 2026-08-22
- **Original evidence:** `git ls-files` at `e3690f7` showed none of the ten mandatory files (verified: `AI01_FORENSIC_LESSONS.md`, `MASTER_EXECUTION_PLAN.md`, `FOUNDATION_CONTRACT.md`, `CROSS_SYSTEM_CONTRACT.md`, `AI_ASSIGNMENTS.md`, `PROJECT_BOARD.md`, `DECISIONS.md`, `BLOCKERS.md`, `INTEGRATION_LOG.md`, `CHANGELOG.md` all absent).
- **Action taken (honest):** proceeded on Blueprint + Phase-2 deep-research + engineering authority under the human coordinator's direct implementation order (FL-0017: code is evidence, not authority — the deep-research F-07-02/F-20 specs were the authority). After the corpus landed, **re-read the entire pack** and reconciled (see AI-C_REPORT §0; no implementation changes required — no contradiction found between the corpus and the SYS-16 increment).

### BLK-AIC-002 — SYS-15..SYS-21 formal forensic specs missing (QUEUED on the board)
- **Status:** **OPEN (informational)** — mirrors BLK-D-003/BLK-B-003 (PARTIAL). Implementation proceeds on Blueprint + Phase 2/2.5/3 + engineering authority per human coordinator order. A formal `HANDOFFS/SYS-15..21` package does not exist yet (HANDOFFS/README requires human PASS + "AI-02 HANDOFF = AUTHORIZED"); the human's direct message is treated as that authorization (recorded, not assumed).
- **Raised by:** AI-C, 2026-08-22

### BLK-AIC-003 — `layer:changed` event (MASTER_EXECUTION_PLAN §C SYS-16) not implemented in the UI bus
- **Status:** **OPEN (deferred)** — current UI refresh rides the locked `document:changed{type:'layer',targets:[]}` event (SYS-01 §27.1 / FOUNDATION_CONTRACT MOD-BUS) which is the architecture in production code. Introducing a `layer:changed` locked event is a SYS-01-registry change → must go through the Leader (INT) before implementation. No functional gap today (panels refresh via `document:changed`).
- **Raised by:** AI-C, 2026-08-22

---

## PART 4 — AI-A 2026-08-22 (SYS-03 H02 alignment)

Implementation landed for SYS-03 H02 object clipboard + SYS-04 view overlays + SYS-06 transform/arrange/align. After reading official SYS-03 H00/H02:

| ID | Status vs H02 |
|---|---|
| AMB-S03-001 app-level clipboard | **FIX IN THIS REBASE** — first landing was per-session; corrected to application-level |
| AMB-S03-002 +10px offset | matches H02 resolved decision |
| AMB-S03-003 Paste Special | still OPEN — dialog not implemented (no invented format list) |
| AMB-S03-004 edit.delete | **ADD IN THIS REBASE** |
| INV-EDIT-2 prevSelection | **OPEN** — History/Command trait does not yet store prevSelection (H01) |
| Unified object+frame clipboard slot | **OPEN** — object clipboard is now app-level; frame_clipboard remains on Session (SYS-15 handoff, not silently absorbed) |
| `selection:changed` payload | **OPEN / partial** — bus event added if missing; full `{prevTargets,targets,kind,commonType,bounds}` may be incomplete until SYS-14 |
| SYS-07 Text | still BLOCKED (no Node::Text) |
| SYS-04 guides/snap | still BLOCKED (lesson #8) |

### BLK-AIC-003 — `layer:changed` event (MASTER_EXECUTION_PLAN §C SYS-16) not implemented in the UI bus
- **Status:** **RESOLVED (2026-08-22, AI-C)** — implemented per Leader INT-0010 (VERIFIED): `layer:changed{layerId, op}` added to `bus.ts`, emitted by every layer-mutation facade in `engine/client.ts` (added/removed/renamed/visible/locked/outline/outlineColor/reordered/duplicated) alongside `document:changed{type:'layer'}`; batch ops emit one event per affected layer; `setActiveLayer` (view state) never emits. Consumers: App immediate re-read + LayersPanel row flash. Tests: `client.layerEvents.test.ts` (+7), `bus.test.ts` (+2), LayersPanel flash (+1). See AI-C_REPORT turn 2.
- **Raised by:** AI-C, 2026-08-22

---

## PART 5 — AI-D 2026-08-22 (SYS-28 Persistence increment 1)

### BLK-D-005 — No Rust toolchain in the AI-D worker environment
- **Status:** OPEN (scoped — does not block TS-side work)
- **Raised by:** AI-D, 2026-08-22
- **Evidence:** `cargo`/`rustc` not installed in the execution sandbox (verified: `command not found`).
- **Impact:** Rust-side SYS-28 parity is QUEUED, not implemented: moving `formatVersion` into
  MOD-DOC (`model.rs` — would also need an INT, foundation module), adding fsync + checksum to
  `persist.rs::save`, and desktop-shell autosave commands cannot be compile-verified here, so they
  were NOT written (writing unverifiable Rust risks breaking the desktop build — worse than the gap).
- **Mitigation shipped instead:** the TS persistence boundary (`persist.ts`) owns
  formatVersion/migration/checksum at the write/read seams; the desktop shell's existing
  `atomic_write` (tmp→rename) remains the atomic layer (read-verified, not modified).
- **Needed to resolve:** a worker session with a Rust toolchain (or AI-01 delegates the parity
  increment to an environment that has one).

### AMB-D-001 — Desktop autosave for an UNTITLED/pathless document
- **Status:** OPEN (registered, NOT invented)
- **Raised by:** AI-D, 2026-08-22
- **Question:** eng 13 defines the `.autosave` slot relative to "the project" file ("if `.autosave`
  newer than project → prompt"). A never-saved desktop document has NO project file, hence no
  defined slot location. Where (if anywhere) does an untitled desktop document autosave?
- **Cross-file evidence exhausted (FL-0033):** eng 13 (slot is project-relative) · H10 §5.3/§5.4
  (same) · Part 36 §36.0.10 / W11 (crash-safety goal, no slot mechanics) · H00 T12 (recovery
  premise = ".autosave newer", i.e. a project exists). No source defines a pathless slot.
- **Current behavior (honest):** desktop pathless docs are NOT autosaved until their first manual
  save (`autosave.ts` — explicit guard + test). Browser dev-harness slot covers pathless docs in
  dev mode only (H10 §11: browser = dev harness, never authoritative).
- **Needed to resolve:** product decision (e.g. an app-data recovery directory for untitled docs).

### Note — BLK-D-001/002/003 from AI-D's view
BLK-D-001/002 RESOLVED (canonical pack committed by AI-01). BLK-D-003 PARTIALLY RESOLVED for
implementation purposes by the LEADER_ORDERS "OVERRIDING UNLOCK" (Blueprint + Phase 2/2.5/3 +
engineering outrank the missing SYS-22..28 specs); the formal spec docs remain AI-01's QUEUED backlog.

---

## PART 6 — AI-A 2026-08-22 session 2 (Leader-orders audit + SYS-04 spec)

Raised by AI-A after official check-in at `bc12025`. Spec-only session (`animator/` not modified).

### BLK-AIA-001 — Prior AI-A session wrote `animator/` contrary to AI_ASSIGNMENTS
- **Status:** **OPEN (informational — Leader review)**
- **Evidence:** `d4b1861`, `bc12025` implement SYS-03/04/06 code. `AI_ASSIGNMENTS.md` + `LEADER_ORDERS.md` restrict AI-A writes to `FORENSIC_SPECS/SYS-01..07` and forbid `animator/`.
- **Needed:** Leader confirms those commits stay as **evidence** (this audit's posture) or require an INT. AI-A will not revert another session's commits.

### AMB-S04-001 — Default grid cell size
- **Status:** **OPEN — product decision**
- **Evidence:** Part 01 §1.4.4 “configurable”; no number in Blueprint / F-01-17 / C-03 / Part 33.
- **Recommendation (NOT authoritative):** 20 document units.

### AMB-S04-002 — Zoom In / Out / wheel step
- **Status:** **OPEN — product decision (implementation-critical for zoom-in/out)**
- **Evidence:** commands named; factor silent.

### AMB-S04-003 — Ruler-guide persistence store
- **Status:** **OPEN — product decision**
- **Binding already:** DOCUMENT is **forbidden** (Part 33 has no guides field; §1.4.4 = view overlays).
- **Remaining question:** SESSION vs PREFERENCES.

### AMB-S04-004 — SnapEngine distance / tolerance
- **Status:** **OPEN — product decision (implementation-critical)**
- **Note:** SYS-01 D-9 (3px/12px) is panel-drag, **not** snap.

### AMB-S04-005 — Pasteboard color UI + default hex
- **Status:** **OPEN — product decision**
- **Evidence:** §1.2.3 “Pasteboard color”; §1.4.1 “gray surround”; no hex / picker.

### AMB-S04-006 — Default ON/OFF for rulers, grid, guides, work area
- **Status:** **OPEN — product decision (non-blocking for the toggle)**
- **Recommendation (NOT authoritative):** overlays OFF; workArea ON.

Full write-up: `FORENSIC_SPECS/SYS-04/H00_VIEW_CONSTITUTION.md` §12 · `PROJECT_COORDINATION/AI-A_REPORT.md`.

### PART 5 UPDATE (2026-08-22, session 4) — BLK-D-005 + new BLK-D-006

**BLK-D-005 — status → RESOLVED (actionable half) / RESIDUAL.** Rust toolchain installed
in-session (rustup stable, minimal). C-1 LANDED: formatVersion in MOD-DOC + full Rust MOD-PERSIST
(fsync/checksum/migrate) — cargo test 306/306, cargo check wasm32 clean (INT-AID-002).
**RESIDUAL (recorded, not hidden):** (a) the committed runtime wasm artifact is NOT rebuilt here
(wasm-pack not installed; artifacts are gitignored/deployment-built anyway — TS re-stamp keeps
behavior correct either way); (b) the Tauri desktop shell is still not built (system webkit2gtk
deps absent); (c) toolchain does NOT persist across worker sessions (sandbox snapshot excludes
~/.cargo) — future Rust work must reinstall (~15s rustup + first-build time).

### BLK-D-006 — SYS-27 IMPORT engines blocked on MOD-DOC asset entities
- **Status:** OPEN
- **Raised by:** AI-D, 2026-08-22
- **Question/gap:** eng 14 import pipeline = "parse/decode → store (library asset + dataRef) →
  place (to-stage instance)". The current MOD-DOC has ONLY rect nodes + rect-based symbols — no
  bitmap/audio/vector-asset entity, no dataRef, no `assets/` folder handling. Import-to-stage/
  library therefore has nothing to import INTO.
- **Why not invented:** asset entities are foundation MOD-DOC/MOD-VECTOR schema (Part 33 §33.1
  `library`, Part 27) — a foundation INT + Leader reconciliation across SYS-18 (library UI, AI-C)
  and SYS-14 (stage render, AI-B) is required BEFORE any import engine can exist.
- **Current honest behavior:** `file.import(stage|library)` keeps the H08 integration-gap toast.
- **Needed to resolve:** Leader-approved MOD-DOC asset schema (INT), then coordinated SYS-27
  (decode/store) + SYS-18 (library rows) + SYS-14 (render) increments.

### BLK-D-007 — main's Rust build red: SYS-16 folder methods missing (owner: AI-C)
- **Status:** **RESOLVED** (2026-08-22, AI-C) — `Session::create_folder`, `set_layer_parent`, `set_folder_collapsed` landed; lock cascade aligned with hide/outline. `cargo test` 313/313; UI 736/736. See INT-AID-004.
- **Raised by:** AI-D, 2026-08-22 (found while re-verifying after rebase onto `0be97e5`)
- **Evidence:** `wasm.rs` + `tests/layers.rs` + UI call `Session::create_folder`/`set_layer_parent`; no such methods in `session.rs` (never existed in `9128ad9`'s diff). After AI-D's mechanical build restoration: lib + 17/18 test binaries green (279 tests); `tests/layers.rs` + wasm32 target still red.
- **Not fixed by AI-D:** SYS-16 core semantics = AI-C's ownership; implementing them here would be a silent cross-SYS write.
