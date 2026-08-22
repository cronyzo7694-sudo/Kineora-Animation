# BLOCKERS — Kineora Animation (Coordination Register)

> Created by AI-D (SYS-22..SYS-28 implementation worker) on 2026-08-22, at HEAD `e3690f7`.
> This file did not previously exist in the repository or in any git history; AI-D created it
> per the forensic rule: "If the source does not define the behavior: STOP THAT PORTION.
> Create/update the blocker/decision register."

## Status legend
`OPEN` · `RESOLVED` · `SUPERSEDED`

---

## BLK-D-001 — Mandatory reading file `AI01_FORENSIC_LESSONS.md` does not exist
- **Status:** OPEN
- **Raised by:** AI-D, 2026-08-22
- **Evidence:** `find` across working tree + `git log --all --name-only` across full history: no file
  matching `*FORENSIC*` has ever existed in this repository.
- **Impact:** AI-D's mandate says known lessons are mandatory and reading must be completed before
  coding. The lessons cannot be read because they were never committed.
- **Needed to resolve:** AI01 (or the human coordinator) commits `AI01_FORENSIC_LESSONS.md`.

## BLK-D-002 — Entire `PROJECT_COORDINATION/` mandatory reading set missing
- **Status:** OPEN (partially self-healed: this register + AI-D_REPORT.md now exist)
- **Raised by:** AI-D, 2026-08-22
- **Missing files (never existed in any commit):**
  - `PROJECT_COORDINATION/MASTER_EXECUTION_PLAN.md`
  - `FOUNDATION_CONTRACT.md`
  - `CROSS_SYSTEM_CONTRACT.md`
  - `AI_ASSIGNMENTS.md`
  - `PROJECT_BOARD.md`
  - `DECISIONS.md`
  - `BLOCKERS.md` (created now by AI-D — this file)
  - `INTEGRATION_LOG.md`
  - `CHANGELOG.md`
- **Impact:** Cross-worker contracts, ownership boundaries beyond AI-D's own prompt, approved
  human decisions, and the integration plan are unverifiable. Parallel-work safety rules
  (AI-A/B/C boundaries) cannot be cross-checked against an approved assignment sheet.
- **Needed to resolve:** AI01/human coordinator commits the coordination pack, or explicitly
  authorizes AI-D to proceed on Blueprint + engineering authority alone.

## BLK-D-003 — SYS-22..SYS-28 formal specifications missing
- **Status:** OPEN
- **Raised by:** AI-D, 2026-08-22
- **Evidence:** The approved registry names exist only in `KINEORA_AI1_CONTINUITY_HANDOFF.md` §10
  (SYS-22 Transform · SYS-23 Tweening · SYS-24 Onion/FBF · SYS-25 Camera · SYS-26 Audio ·
  SYS-27 Import/Export/Publish · SYS-28 Persistence — all "not started"). No `SYS-22`..`SYS-28`
  spec documents exist in the tree or history (the SYS-02 pattern referenced `uploads/SYS-02_file.md`,
  which is also absent).
- **Available substitute sources (Blueprint > Engineering authority):**
  - SYS-22: `animate-blueprint/04_transform_system.md`, `02a_tools_selection_transform.md`, contract `C-15`
  - SYS-23: `09_tweening.md`, `10_motion_path.md`, `engineering/08_tween_easing_engine.md`, contracts `C-18`/`C-20`
  - SYS-24: `15_frame_by_frame.md`, contract `C-19`
  - SYS-25: `16_camera.md`, contract `C-27`
  - SYS-26: `17_audio.md`, `engineering/10_audio_lipsync_engine.md`, contract `C-28`
  - SYS-27: `27_import.md`, `28_export_publish.md`, `engineering/14_import_export.md`, contracts `C-30`/`C-31`
  - SYS-28: `engineering/13_persistence.md`, `33_data_model.md`, SYS-02 boundary seams in
    `animator/ui/src/file.ts` + inherited gaps P-9 (formatVersion), AMB-002 (doc-ID collision
    recovery), AMB-003 (recent-file store), H00 T12–T14 (autosave/recovery).
- **Impact:** Spec-driven acceptance criteria for SYS-22..28 are undefined. Blueprint/engineering
  sources exist and outrank specs in the authority chain, so implementation *can* proceed on them —
  but only with explicit authorization (NO SILENT DECISIONS).
- **Needed to resolve:** Either (a) SYS-22..28 specs are committed, or (b) human/AI01 approves
  proceeding directly from Blueprint + Phase 2/2.5/3 + engineering docs.

## BLK-D-004 — No AI-A / AI-B / AI-C work exists; single-branch repo
- **Status:** OPEN (informational)
- **Raised by:** AI-D, 2026-08-22
- **Evidence:** `git ls-remote origin` shows only `refs/heads/main`. All 15 commits are the prior
  AI-1 SYS-01/SYS-02 line ending at `e3690f7`.
- **Impact:** No cross-worker conflicts today, but "preserve other workers' changes" cannot be
  exercised or verified. AI-D will re-fetch before every push per parallel-git rules.
- **Needed to resolve:** Nothing from AI-D; noted for AI01's integration audit.

---

## BLK-B-001 — Mandatory reading file `AI01_FORENSIC_LESSONS.md` does not exist (AI-B)
- **Status:** OPEN (duplicate-condition with BLK-D-001, registered from AI-B ownership for traceability)
- **Raised by:** AI-B, 2026-08-22
- **Evidence:** `find` across working tree + `git log --all --name-only`: no file matching
  `*FORENSIC*` has ever existed. Same gap independently confirmed by AI-D.
- **Impact:** AI-B's mandate says known lessons are mandatory pre-coding reading. Cannot be
  completed because the file was never committed.
- **Needed to resolve:** AI01/human coordinator commits `AI01_FORENSIC_LESSONS.md`.

## BLK-B-002 — Coordination pack still incomplete at AI-B session start (AI-B)
- **Status:** OPEN (partial self-heal: ATTENDANCE/BLOCKERS/AI-D_REPORT now exist via AI-D)
- **Raised by:** AI-B, 2026-08-22
- **Still missing (never committed):** `MASTER_EXECUTION_PLAN.md`, `FOUNDATION_CONTRACT.md`,
  `CROSS_SYSTEM_CONTRACT.md`, `AI_ASSIGNMENTS.md`, `PROJECT_BOARD.md`, `DECISIONS.md`,
  `INTEGRATION_LOG.md`, `CHANGELOG.md`.
- **Impact:** Cross-worker ownership boundaries (esp. SYS-13 Tools touching SYS-19/20/22/25),
  approved decisions, and the integration plan are unverifiable. The CROSS_SYSTEM_CONTRACT is
  the highest-severity gap for AI-B because Tools/Stage are a shared surface.
- **Needed to resolve:** AI01 commits the pack, or explicitly authorizes Blueprint+engineering
  authority.

## BLK-B-003 — SYS-08..SYS-14 formal specifications missing (AI-B)
- **Status:** OPEN
- **Raised by:** AI-B, 2026-08-22
- **Evidence:** SYS-08..14 names exist only in `KINEORA_AI1_CONTINUITY_HANDFOFF.md` §10 (all
  "not started"). No `SYS-08`..`SYS-14` spec documents exist in tree or history.
- **Aggravating factor (code evidence):** the "not started" label is misleading — the command
  registry, all 11 menus, playback transport, Dev panel, workspace/window toggles, Shortcuts/
  About dialogs, three tools, and the stage/viewport/renderer are already FUNCTIONAL and
  tested. Implementing without a spec risks duplicating existing work and silently absorbing
  scope owned by SYS-03..07 / SYS-15..28. See AI-B_REPORT.md §5 for the per-SYS baseline table.
- **Available substitute sources (Blueprint > engineering authority):**
  - SYS-08: blueprint 01 §1.2.7, engineering/05_command_system.md
  - SYS-09: blueprint 01 §1.2.8, contracts C-03/C-08
  - SYS-10: blueprint 01 §1.2.9 (debug = historical/P2 only)
  - SYS-11: blueprint 01 §1.2.10 + §1.1.2, contracts C-02/C-06
  - SYS-12: blueprint 01 §1.2.11
  - SYS-13: blueprint 01 §1.3 + 02a..02d, contracts C-13..C-16
  - SYS-14: blueprint 01 §1.1, engineering/06_rendering.md, contracts C-12 (transform info)
- **Needed to resolve:** (a) SYS-08..14 specs committed, or (b) AI01/human approves proceeding
  directly from Blueprint + Phase 2/2.5 + engineering docs, with an explicit cross-SYS ownership
  map for the Tools/Stage surface.

## BLK-B-004 — No AI-A / AI-C work exists; single-branch repo (AI-B, informational)
- **Status:** OPEN (informational; supersedes in spirit if/when other workers appear)
- **Raised by:** AI-B, 2026-08-22
- **Evidence:** `git ls-remote origin` shows only `refs/heads/main` at `f4feb42`. Only AI-D has
  joined so far.
- **Impact:** No cross-worker conflicts today; AI-B re-fetches before every push.
- **Needed to resolve:** Nothing from AI-B; noted for AI01 integration audit.

## BLK-B-005 — GitHub PAT exposed in chat (security advisory, AI-B)
- **Status:** OPEN (security — does not block code)
- **Raised by:** AI-B, 2026-08-22
- **Evidence:** The implementation-worker prompt transmitted a GitHub Personal Access Token in
  plaintext over the chat channel.
- **Impact:** The token must be considered compromised; it must be rotated/revoked in GitHub
  settings after this work session. AI-B never wrote the token into any committed file.
- **Needed to resolve:** Human coordinator rotates the PAT and updates the remote URL / secret
  store. No repo content change required.
