# KINEORA — AI ASSIGNMENTS (4 implementation/specification groups)

> **Initial allocation — VERIFIED against dependencies.** One group may READ any file; it may WRITE only its own SYS. Cross-SYS changes follow the change procedure below.

---

## Group ownership

| AI | Systems | Thematic span |
|---|---|---|
| **AI-A** | SYS-01 Application/Workspace · SYS-02 File · SYS-03 Edit · SYS-04 View · SYS-05 Insert · SYS-06 Modify · SYS-07 Text | shell + core editing |
| **AI-B** | SYS-08 Commands · SYS-09 Control/Playback · SYS-10 Debug · SYS-11 Window · SYS-12 Help · SYS-13 Tools · SYS-14 Stage | tools + stage + transport |
| **AI-C** | SYS-15 Timeline · SYS-16 Layers · SYS-17 Properties · SYS-18 Library · SYS-19 Symbols/Instances · SYS-20 Drawing/Shapes · SYS-21 Color | timeline + assets + drawing |
| **AI-D** | SYS-22 Transform · SYS-23 Tweening · SYS-24 Onion/FBF · SYS-25 Camera · SYS-26 Audio · SYS-27 Import/Export/Publish · SYS-28 Persistence | animation + media + I/O |

## Verification notes (dependencies ≠ clean group boundaries)

- SYS-03 (AI-A) hands off to SYS-14 (AI-B, selection) and SYS-15 (AI-C, frame clipboard) — **cross-group handoffs, resolved via contract**.
- SYS-02 (AI-A) hands off to SYS-28 (AI-D, persistence), SYS-27 (AI-D, I/O), SYS-18 (AI-C, library) — **heaviest cross-group SYS**.
- The **foundation modules** (BUS/STATE/COMMAND/VECTOR/COLOR/EASING/DOC) are **NOT assigned to any group** — they are the shared P0/P1 foundation (Leader-owned contract, see `CROSS_SYSTEM_CONTRACT.md` §C and `BLOCKERS.md` FND-001).

---

## Allowed / Forbidden files

| AI | Allowed (write) | Forbidden (write — read OK) |
|---|---|---|
| AI-A | `FORENSIC_SPECS/SYS-01*`, `SYS-02/`, `SYS-03/`, `SYS-04*`, `SYS-05*`, `SYS-06*`, `SYS-07*` | `SYS-08..28`; `animator/` (code — implementation AI only) |
| AI-B | `SYS-08* .. SYS-14*` | `SYS-01..07`, `SYS-15..28`; `animator/` |
| AI-C | `SYS-15* .. SYS-21*` | others; `animator/` |
| AI-D | `SYS-22* .. SYS-28*` | others; `animator/` |

`PROJECT_COORDINATION/` + `AI01_FORENSIC_LESSONS.md` = **Leader-owned** (AI-01). Append-only lessons; coordination updates via the change procedure.

---

## Cross-system change procedure (MANDATORY — no silent drift)

1. Record the request in `INTEGRATION_LOG.md` (INT-XXXX): what changed, why, affected systems, evidence.
2. State the reason (contradiction / new contract / resolution).
3. List every affected SYS + the specific field (commandId/event/state/payload).
4. File a review request to the OWNING AI (and the Leader).
5. **Do NOT modify the other AI's files until the Leader verifies the contract.**
6. After approval: apply the change, update the log status → VERIFIED, mirror in `PROJECT_BOARD.md` + `CHANGELOG.md`.

---

## Required reading (before ANY work)

1. `AI01_FORENSIC_LESSONS.md` (COMPLETE — FL-0001..0034) — **FIRST, always.**
2. `MASTER_EXECUTION_PLAN.md`
3. `CROSS_SYSTEM_CONTRACT.md`
4. `DECISIONS.md` + `BLOCKERS.md`
5. The Blueprint parts + Phase 2/2.5/3 + engineering files for the owned SYS.
6. The owned SYS's existing spec (if any) — treat as "EXISTS + REQUIRES AUDIT", never "correct".

## Required tests (every SYS)

- Happy + failure + empty + disabled + boundary + rapid + multi-doc + keyboard + a11y + persistence + reload + recovery + destructive + error-recovery.
- Automated AND manual (never "green = accepted", FL-0019).

## Required reporting (every SYS)

- Final reconciliation (H-series last file): coverage matrices, command/event/state/control/persistence/a11y/error/edge/test/ambiguity/ownership counts (FL-0020 — distinct units), dead-control audit, drift audits, ambiguity register, honest status.

## Branch requirements

- `main` = controlled (Leader/owner merges only).
- Suggested: `ai-a/sys-01-07`, `ai-b/sys-08-14`, `ai-c/sys-15-21`, `ai-d/sys-22-28`.
- Every commit: reason + affected systems + tests + status.

## Handoff requirements (to an implementation AI)

The implementation AI receives: (1) SYS package · (2) MASTER_EXECUTION_PLAN · (3) CROSS_SYSTEM_CONTRACT · (4) AI_ASSIGNMENTS · (5) DECISIONS · (6) BLOCKERS · (7) AI01_FORENSIC_LESSONS. It MUST acknowledge all seven before coding, and MUST NOT guess ("spec does not define X" → report IMPLEMENTATION BLOCKER → return to Leader).

---

*This allocation is initial and verified against the dependency graph. The Leader may rebalance after the foundation (P0/P1) is published and the real dependency cost is known.*
