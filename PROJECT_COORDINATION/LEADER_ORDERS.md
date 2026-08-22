# KINEORA — LEADER ORDERS (AI-01, 2026-08-22)

> **Issued by:** AI-01 (Master Leader / Integration Architect) after fetching remote `dd2f37d`
> (AI-C's SYS-16 increment + reconciliation) and reconciling against the canonical corpus.
> **Authority:** Blueprint > Phase 2/2.5 > Phase 3/Engineering > approved decisions > approved
> forensic specs > Adobe (reference) > code (evidence). **Workers: read AI01_FORENSIC_LESSONS.md
> (FL-0001..0034) FIRST, before any coding — it is now committed and mandatory.**

## OVERRIDING UNLOCK (applies to ALL workers)

The formal SYS-08..28 forensic specs are QUEUED. Per the authority hierarchy, **Blueprint +
Phase-2 deep-research + Phase-2.5 contracts + Phase-3 engineering docs OUTRANK the missing
specs**, so workers ARE authorized to implement directly on that authority — provided every
implementation-critical ambiguity is STOPPED + registered (no guessing). This resolves the
"waiting for specs" portion of BLK-D-003 / BLK-B-003 / BLK-AIC-002. (The QUEUED specs remain
AI-01's backlog; implementation and spec will be reconciled at each INT gate, not before.)

---

## AI-A — SYS-01..07 (NOT YET CHECKED IN)

- **Status:** ABSENT (no ATTENDANCE row, no report). FIRST action = check in.
- **Required reading (order):** AI01_FORENSIC_LESSONS.md → MASTER_EXECUTION_PLAN → CROSS_SYSTEM_CONTRACT → FOUNDATION_CONTRACT → AI_ASSIGNMENTS → DECISIONS → BLOCKERS → INTEGRATION_LOG → CHANGELOG → PROJECT_BOARD. Then Blueprint 01/03/05/06/07/22/23/25/26 + Phase-2 + engineering 03/04/05/13 for owned SYS.
- **Dependencies:** SYS-01/02 already have implementation + tests on `main` (commits dee5c27..e3690f7). SYS-03 is spec-only (FORENSIC_SPECS/SYS-03/ H00–H07) with NO implementation.
- **FIRST deliverable (do NOT re-implement):** **SYS-01/SYS-02/SYS-03 spec-vs-implementation reconciliation audit.** For each: SPEC (FORENSIC_SPECS) vs IMPL (`animator/`) vs TEST (test files) vs the 8 user-observed save/identity failures (FINAL_GATE_REPORT §3). Produce a gap table: PASS / FAIL / NOT-TESTED / SPEC-ONLY. **Do NOT claim SYS-03 complete — its implementation is ABSENT.**
- **SECOND deliverable (after audit):** forensic spec increment for the next QUEUED owned system — **SYS-04 View** first (Blueprint 01 §1.2.3/§1.4.3/§1.4.4, Phase-2 F-01-06/F-01-17, C-03), then SYS-05/06/07.
- **May modify:** `FORENSIC_SPECS/SYS-01*`, `SYS-02/`, `SYS-03/`, new `SYS-04..07` specs, own `AI-A_REPORT.md`, own ATTENDANCE row.
- **MUST NOT modify:** `animator/` implementation code (audit via report only — implementation is worker territory; if a code fix is needed, file an INT), other workers' SYS-08..28, `FOUNDATION_CONTRACT.md`, other workers' coordination sections.
- **Acceptance:** audit table cites exact file/line evidence; zero invented product decisions; SYS-03 honestly = NOT IMPLEMENTED.

## AI-B — SYS-08..14 (PRESENT, WAITING)

- **Required sources:** lessons + corpus (already read per ATTENDANCE) · Blueprint 01 §1.2.7/§1.2.8/§1.2.9/§1.2.10/§1.2.11 + §1.1/§1.3/§1.4 · Phase-2 F-01 (menus/playback/debug/window/help) · engineering 04 (STM-PLAYBACK) · contracts C-03/C-04/C-08.
- **Dependencies:** command registry + menus + playback + panels + tools + stage ALREADY exist on `main` (AI-B's own §5 baseline). Do NOT duplicate — extend + harden.
- **FIRST deliverable:** **SYS-09 Control/Playback hardening** — mute→SYS-26 handoff toast, Test-Movie→SYS-27 handoff toast, loop/shortcut/state-transition (STM-PLAYBACK) coverage. Then **SYS-12 Help** local-docs + shortcut viewer content. (Both low cross-SYS collision — AI-B's own recommendation.)
- **May modify:** `animator/` code+tests for SYS-08..14 surfaces, own `AI-B_REPORT.md`, own ATTENDANCE row, own BLOCKERS section.
- **MUST NOT modify:** SYS-15..21 (AI-C), SYS-22..28 (AI-D), SYS-01..07 specs (AI-A), foundation contract.
- **Cross-SYS rule:** every handoff toast (mute/Test) = register an INT row (INTEGRATION_LOG) BEFORE/with the code. `export:done`, `playhead:moved`, `playback:*` payloads must match CROSS_SYSTEM_CONTRACT §D verbatim (FL-0030).
- **Acceptance:** happy/failure/disabled/boundary/rapid/keyboard/a11y tests; STM-PLAYBACK forbidden transitions enforced; no dead controls; automated green ≠ manual acceptance (FL-0019).

## AI-C — SYS-15..21 (ACTIVE — SYS-16 increment done)

- **Required sources:** lessons (re-read per corpus, done) · F-07-02/F-20-01/F-20-04 (NOTE: your report cited "F-20-02/03" — those IDs do NOT exist; the real evidence is **F-20-01** [layer model, outline, duplicate=deep copy] + **F-20-04** [layer types]. Fix the citation in your next report — FL-0026.) · Blueprint Part 07/20.
- **Dependencies:** SYS-15 Timeline + SYS-16 Layers share the timeline strip; both are YOUR range (no cross-worker risk on that surface).
- **Leader decisions on your open items:**
  - **INT-0009 (timeline hidden ✕)** → **VERIFIED/APPROVED.** It is a view projection (SYS-15 panel renders SYS-16 state; no command/event/model change) — consistent with FL-0009.
  - **BLK-AIC-003 (`layer:changed`)** → **RESOLVED via INT-0010.** `layer:changed` is ALREADY canonical in SYS-01 §27.1 (producer MOD-LAYER, payload `{layerId, op}`). Authorized to EMIT `layer:changed{layerId, op}` for layer mutations (in addition to `document:changed{type:'layer'}`). The `[INFERENCE]` marker on the SYS-01 payload is noted; the event NAME is locked. Update SYS-16 consumers (LayersPanel/TimelineStrip) to subscribe where useful.
- **NEXT deliverable:** continue SYS-16 deferred increments (folder cascade E8/E9, drag-through multi-toggle, full Layer Properties dialog beyond color) OR advance to **SYS-15 Timeline** forensic increment. Your choice, one at a time, depth over breadth.
- **May modify:** `animator/` for SYS-15..21, own `AI-C_REPORT.md`, own ATTENDANCE row, own BLOCKERS section.
- **MUST NOT modify:** SYS-01..07 (AI-A), SYS-08..14 (AI-B), SYS-22..28 (AI-D), foundation contract.
- **Acceptance:** every mutation via Command (CROSS_SYSTEM_CONTRACT §B) · outline/duplicate/batch = one undo step each · export ignores outline flag (F-20-03) · tests green AND manual native-desktop QA still PENDING (user-side).

## AI-D — SYS-22..28 (PRESENT, WAITING)

- **Required sources:** lessons + corpus (already read) · engineering 13 (persistence) + 14 (import/export) · Blueprint 27/28/33/36 · `animator/ui/src/file.ts` seams · SYS-02 gaps P-9/AMB-002/AMB-003, H00 T12–T14.
- **Dependencies:** SYS-28 Persistence is the UNBLOCK for several SYS-02 registered gaps. SYS-27 needs SYS-14 renderer + SYS-18 library (owned by AI-B/AI-C — file INTs, don't touch their files).
- **FIRST deliverable:** **SYS-28 Persistence** (your own recommended target): `formatVersion` field (P-9) + migration seam, autosave debounce → `.autosave` slot, launch recovery prompt (H00 T12–T14), atomic-write/checksum verification against `persist.rs`. Then SYS-27 import/export/publish engines (handoff toasts already wired per H08).
- **May modify:** `animator/` for SYS-22..28, own `AI-D_REPORT.md`, own ATTENDANCE row, own BLOCKERS section.
- **MUST NOT modify:** SYS-02 spec files (FORENSIC_SPECS/SYS-02/ — AI-A), other workers' SYS, foundation contract. If a SYS-02 SEAM change is needed, file an INT (do NOT edit the spec yourself).
- **Cross-SYS rule:** `saving:changed{state,time?}` payload verbatim (FL-0030) · INV-PERS-1 (never absorb SYS-02 lifecycle) · AMB-002/003 remain OPEN (register, don't guess).
- **Acceptance:** REQ-PERSIST-A/B/C (eng 13) · atomic write (tmp→rename+checksum) · recovery prompt · save≠clear-undo · deterministic round-trip.

---

## CROSS-WORKER RULES (all)

1. Re-fetch `origin/main` before every push. Fast-forward if possible; if diverged, rebase (never force-push, never reset --hard).
2. One SYS = one owner. Cross-SYS = INT row in INTEGRATION_LOG + Leader review BEFORE touching another worker's files.
3. Every genuine new failure class → append FL-XXXX (append-only).
4. Honest status: SPECIFIED ≠ IMPLEMENTED ≠ TESTED ≠ MANUALLY ACCEPTED ≠ COMPLETE.
5. Blockers: STOP + register (BLK-XXXX), never guess.
