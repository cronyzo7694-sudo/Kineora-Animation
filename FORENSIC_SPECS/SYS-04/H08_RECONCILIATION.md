# SYS-04 H08 — FINAL RECONCILIATION + COVERAGE PROOF

## 0. Document Status

SPECIFICATION STATUS: **REVISION REQUIRED** (AMB-S04-002/003/004/005 implementation-critical)  
IMPLEMENTATION STATUS: **PARTIAL** (evidence below — **not** authority, FL-0017)  
MANUAL ACCEPTANCE: **PENDING**

---

## 1. Coverage counts (FL-0020 — from H05 §6 + H00)

| Unit | Count | Source |
|---|---|---|
| commandIds (SYS-04) | 14 | H05 §6 |
| menu/context controls | 23 | H05 §6 |
| Go To handoff rows | 4 | H05 §2 |
| locked events produced | 1 (`snap:changed`) | H00 §7 |
| invented events | 0 | H00 §7 |
| invariants | INV-VIEW-1..10 | H00 §10 |
| AMBs open | 6 (001–006) | H00 §12 |
| AMBs implementation-critical | 4 (002, 003, 004, 005) | H00 §13 |
| resolved contradictions | 2 (rulers shortcut; magnification list) | H00 §12 |

---

## 2. Blueprint vs this spec vs Adobe

| Topic | Blueprint | This spec | Adobe (comparison only) |
|---|---|---|---|
| Four preview modes | §1.4.3 | same | similar |
| View transform not in file | §1.4.1 | INV-VIEW-1 | similar |
| Camera separate | §1.4.1 | INV-VIEW-2 | similar |
| Rulers shortcut | §1.2.3 Ctrl+R vs Part 29 Ctrl+Shift+Alt+R | Part 29 wins | Adobe often Ctrl+Alt+Shift+R |
| Magnification presets | not listed | not added | Adobe has a % list — **NOT IN BLUEPRINT** |
| Guide persist | silent + “view overlays”; Part 33 empty | AMB-S04-003; DOCUMENT forbidden | Adobe stores in FLA — **not authority** |
| Clear Guides | silent | not added | Adobe has it — **NOT IN BLUEPRINT** |
| Ctrl+K | Align in Part 29.9 | **D-3** palette | Align |

---

## 3. CURRENT IMPLEMENTATION STATUS (evidence only — FL-0017)

Tree at `bc12025`. **Does not change this spec.**

| Spec item | Code evidence | Gap |
|---|---|---|
| `view.zoomIn/Out/100/Fit` | `commands.ts:802–835` → `stageViewController` | zoom step not specified here; impl exists as evidence |
| Wheel zoom | not audited line-by-line this pass | verify against T-zoom-wheel-same-id |
| `view.preview` one ID × 4 modes | **two** IDs: `view.previewFull`, `view.previewOutline` (`commands.ts:909–930`); Fast/AA **absent** | FAIL vs INV-VIEW-9 / H02 (ID explosion + missing modes) |
| Work Area / Hide Edges / Rulers / Grid | `viewPrefs.ts` + FUNCTIONAL commands | gridSize=20 labelled provisional in code (AMB-S04-001) |
| Guides | `view.guides` **DEFERRED** (`commands.ts:864–871`) | matches dead-toggle ban |
| SnapEngine | `view.snapping` single DEFERRED (`commands.ts:874–880`) | FAIL vs five `view.snap(target)` IDs; engine absent |
| `st.snap` | hardcoded `"snap off"` (`StatusBar.tsx:98–100`) | FAIL vs H04 §5 |
| Prefs key `kineora.view` | `viewPrefs.ts` | legal PREFERENCES evidence; not a spec requirement on the key name |
| Go To in View menu | `menus.ts:123–131` → `control.*` | matches handoff |
| Rulers shortcut | `Ctrl+Shift+Alt+R` (`commands.ts:841`) | matches H00 resolution |
| Shape Hints | **no** `view.shapeHints` | SPEC-ONLY |
| Pasteboard color | **no** `view.pasteboardColor` | SPEC-ONLY (AMB) |
| Guides in DOCUMENT | no Part 33 field; none added | correct |

Prior implementation of a subset of View overlays does **not** make SYS-04
COMPLETE and does **not** close AMBs.

---

## 4. Ownership / drift audit

| Check | Result |
|---|---|
| One owner per concern | PASS (00 §2) |
| No `view:changed` invented | PASS |
| `snap:changed` payload single-sourced | PASS (`{mode}`) |
| Go To not absorbed | PASS |
| Camera not absorbed | PASS |
| Layer outline not absorbed | PASS |
| Frame clipboard not touched | PASS (SYS-15) |
| Ctrl+K not claimed | PASS (D-3) |
| CommandId vs current code | DRIFT recorded in §3 (preview IDs, snap master toggle) |

---

## 5. Dead-control audit

| Risk | Rule |
|---|---|
| Show Guides with no create path | DEFERRED until H03 create exists |
| Snap items with no SnapEngine | DEFERRED until H04 engine exists |
| Pasteboard color with no UI decision | stay off the FUNCTIONAL matrix (AMB-S04-005) |
| Fast / AA missing in current menu | spec requires them; current menu is evidence-gap |

---

## 6. Completeness model (FL-0018)

| State | SYS-04 |
|---|---|
| A SPECIFICATION COMPLETE | **NO** — 4 implementation-critical AMBs |
| B IMPLEMENTATION COMPLETE | **NO** |
| C INTEGRATION COMPLETE | **NO** (`st.snap`, SnapEngine, SYS-14 consume) |
| D ACCEPTANCE COMPLETE | **NO** |

**SYS-04 READY FOR IMPLEMENTATION = NO** until AMB-S04-002/003/004/005 are
decided **or** an implementer is authorized to ship the non-blocked subset
(zoom 100/Fit, preview Full/Outline/Fast/AA, work area toggle, rulers/grid
toggles, hide edges, shape-hints flag) while leaving snap/guides-persist/
pasteboard-color/zoom-step DEFERRED.

Leader overriding unlock (Blueprint outranks missing decisions) allows
implementation of the **non-blocked** subset with STOP+register on the AMBs.
That is **not** a license to fill AMB numbers from `viewPrefs.ts`.

---

## 7. What this increment does / does not do

**Does:** name SYS-04; lock ownership, commandIds, events, persistence
firewall, menu/shortcut map; register six AMBs; record impl drift.

**Does not:** implement code; start SYS-05/06/07 specs; modify SYS-01 LOCKED
text; close AMB-S03-003 or SYS-02 product decisions; declare COMPLETE.

---

*SYS-04 H00–H08 increment complete. STOP per `00_SYSTEM_QUEUE.md` §3.6 — next system only when Leader names it (orders already said SYS-05/06/07 after SYS-04; those are not started this pass).*
