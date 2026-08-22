# AI-D_REPORT — Kineora Animation (SYS-22..SYS-28 implementation worker)

**Ownership:** SYS-22 Transform · SYS-23 Tweening · SYS-24 Onion/FBF · SYS-25 Camera ·
SYS-26 Audio · SYS-27 Import/Export/Publish · SYS-28 Persistence

---

## SESSION 3 — 2026-08-22 · SYS-28 Persistence increment 1 (LEADER_ORDERS first deliverable)

**HEAD at session start:** `bc12025` (fetched + fast-forwarded before work; re-fetched before push).

### 1. SYSs implemented
**SYS-28 Persistence — increment 1** (exactly the LEADER_ORDERS AI-D "FIRST deliverable"):
- **formatVersion (P-9 closed at the boundary)** — `CURRENT_FORMAT_VERSION = 1`, stamped ON WRITE
  by MOD-PERSIST (H10 §6: writer = SYS-28, when = on write). Legacy files = v0.
- **Migration seam** — pure `migrate(from, to)` (eng 13), v0→v1 step registered; loader order
  validate → migrate → engine parse; `formatVersion > CURRENT` → **REFUSE** (unmigratable, H06
  error outcome — never a lifecycle state).
- **Autosave (MOD-AUTOSAVE)** — `document:changed`-driven, debounced **2s after last change +
  30s cap** (eng 13 `[ENGINEERING DECISION]` values), writes a checksummed envelope to the
  `.autosave` slot (native: `<projectPath>.autosave` via the desktop shell's atomic seam;
  browser: dev-harness localStorage slot per H10 §11). Never emits `saving:changed`, never
  touches DIRTY (H10 §5.3, FL-0014, FL-0030), never overwrites the manual save file.
- **Launch recovery prompt (H00 §6.3 T12–T14)** — launch scan → transient RECOVERED prompt
  (`RecoveryDialog`, alertdialog, danger-token Discard, Esc inert — T12's only exits are
  T13/T14). Accept → ACTIVE(TITLED, CLEAN) with `openSet:changed{added}` FIRST then
  `activeDoc:changed` (H02 §14/D-AMB-004); Discard → slot cleared, NO_DOCUMENT, no events.
- **Checksum** — FNV-1a-64 envelope integrity; corrupt slot → **skip + toast** (H10 §10), kept as
  evidence.
- **INV-AS-1 (slot invariant)** — a non-blank slot exists ⟺ autosaved changes newer than the last
  manual save (manual-save success clears the slot). This realizes eng 13's "`.autosave` newer
  than project" without a filesystem-mtime seam.

### 2. Files changed
| File | Change |
|---|---|
| `animator/ui/src/persist.ts` | NEW — MOD-PERSIST TS boundary (formatVersion/migrate/prepareForLoad/checksum) |
| `animator/ui/src/autosave.ts` | NEW — MOD-AUTOSAVE + recovery scan/accept/discard |
| `animator/ui/src/components/RecoveryDialog.tsx` | NEW — T12–T14 prompt UI |
| `animator/ui/src/persist.test.ts` | NEW — 13 tests |
| `animator/ui/src/autosave.test.ts` | NEW — 18 tests |
| `animator/ui/src/components/RecoveryDialog.test.tsx` | NEW — 5 tests |
| `animator/ui/src/file.ts` | WIRING ONLY at the H10 §5.1/§5.2 seams SYS-02 pre-marked ("wired when SYS-28 ships"): stamp-before-write (all 4 write paths + recent snapshot), validate→migrate before `openDocJson` (Open + Open-Recent), `onManualSaveSuccess` after markClean, `adoptDocPathForRecovery` export (recovery uses the SAME identity map — INV-IDENT rules apply unchanged) |
| `animator/ui/src/App.tsx` | initAutosave (deps-injected seams — no lifecycle absorption) + launch recovery scan + RecoveryDialog render + corrupt-slot toast |
| `animator/ui/src/file.test.ts` | ONE assertion updated: `openDocJson` now receives MIGRATED content — the spec-anticipated read-boundary behavior (recorded in INT-AID-001, not silent) |

**NOT touched:** FORENSIC_SPECS/SYS-02/ (AI-A) · SYS-08..21 surfaces (AI-B/AI-C) ·
foundation modules (MOD-DOC/model.rs unchanged — formatVersion lives at the SYS-28 envelope;
serde ignores unknown fields, verified no `deny_unknown_fields` in core) · `persist.rs`/desktop
Rust (read-verified only — BLK-D-005).

### 3. Source evidence
eng 13 (save model/autosave/recovery/versioning/acceptance) · H10 §4–§11 (handoff contracts,
identity, failure table, browser-vs-native) · H00 §6.3 T12–T14 + §14 (lifecycle + boundaries) ·
Part 33 §33.1 (formatVersion in the project schema) · Part 36 §36.0.10/W11 (crash safety) ·
CROSS_SYSTEM_CONTRACT §D (locked payloads) §F (DOCUMENT boundary owner = SYS-28) ·
file.ts H10 §5.1/§5.2 seam markers · desktop `commands.rs::atomic_write` (tmp→rename, read-verified).

### 4. Decisions (SYS-28-internal engineering, documented in code headers)
AS-D1 INV-AS-1 slot invariant · AS-D2 slot = `<path>.autosave` via the shell atomic seam ·
AS-D3/D3a clear = blank write, only when a slot exists (no stray files) · AS-D4 Accept keeps the
slot (cleared by the next manual save), Discard clears it (T14 "kept or cleared per SYS-28") ·
AS-D5 browser slot = dev harness only · AS-D6 pending autosave cancelled on doc switch (engine
serializes the active doc only). Zero product decisions invented; recovered doc starts CLEAN per
H00 T13 (spec, not choice).

### 5. Blockers / ambiguities
- **NEW AMB-D-001** — pathless desktop autosave (source-silent; behavior = no autosave until first
  manual save; cross-file evidence exhausted per FL-0033). Registered in BLOCKERS PART 5.
- **NEW BLK-D-005** — no Rust toolchain in this environment → Rust parity queued (formatVersion in
  MOD-DOC via INT, fsync+checksum in `persist.rs`, shell autosave commands).
- **AMB-002 / AMB-003 untouched — still OPEN** (collision recovery, recent-store API): not guessed.

### 6. Tests
+36 new (persist 13 · autosave 18 · RecoveryDialog 5) covering: normal · rapid (collapse to one
write) · 30s-cap · empty state (no doc) · disabled paths (CLEAN doc, pathless desktop) · error
(corrupt slot skip, invalid recovery content → 0 + no events, newer-version refuse, corrupt bytes
refuse) · cancel-equivalent (doc-switch cancels pending) · keyboard (Esc inert in T12) · a11y
(alertdialog roles, busy no-double-submit) · state transitions (T12→T13/T14, event ORDER asserted)
· contracts (no `saving:changed` from autosave) · persistence round-trip determinism · recovery.
**Full suite: 661/661 green (49 files)** — zero regressions beyond the one RECORDED assertion update.

### 7. Build
`tsc -b` clean · vitest 661/661. Rust/desktop builds NOT run (BLK-D-005 — no toolchain; no Rust
files modified). WASM artifact untouched.

### 8. Runtime verification
jsdom-level verified (engine bridge + platform mocked at the same seams every existing SYS-02 test
uses). **Manual native-desktop QA = PENDING (user-side)** — automated green ≠ manual acceptance
(FL-0019). Honest status: SYS-28 increment 1 = IMPLEMENTED + TESTED, not MANUALLY ACCEPTED.

### 9. Cross-SYS dependencies
SYS-02 seams consumed as specified (no lifecycle absorbed — INV-PERS-1 both directions) ·
`saving:changed` payload untouched (FL-0030) · unblocks SYS-02 registered gaps: P-9 (closed at
boundary), H00 T12–T14 (recovery now wired) · AMB-002/003 remain with H10/Leader · SYS-27 next
(needs SYS-14 renderer / SYS-18 library — INTs will be filed, their files untouched).

### 10. Commit hashes
- Session 1: `c4fdee4` (blockers) · Session 2: `f4feb42` (attendance)
- **Session 3: recorded in CHANGELOG/git after push (single atomic commit: implementation + tests
  + coordination updates INT-AID-001, BLOCKERS PART 5, ATTENDANCE row, this report).**

### 11. Remaining risks
- formatVersion currently survives via SYS-28 re-stamp (engine drops unknown fields on
  serialize) — by design per H10 §6, but core parity (BLK-D-005) should land before SYS-28 is
  called COMPLETE.
- Multiple valid `.autosave` slots across recent projects: prompt is most-recent-first, one per
  launch (singular prompt in all sources); remaining slots surface on later launches.
- Browser dev-harness slot is single-slot (active doc) — dev-only by contract (H10 §11).

---

## SESSION 1 — 2026-08-22 (historical)
Stopped pre-coding: mandatory reading pack absent (BLK-D-001..004 registered, `c4fdee4`).

## SESSION 2 — 2026-08-22 (historical)
Attendance check-in; standing by for AI01 (`f4feb42`).
