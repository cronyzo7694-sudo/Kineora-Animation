# H11 — VISUAL / ACCESSIBILITY / ERROR / EDGE STATES

## 1. Document Status

SPECIFICATION STATUS: **READY FOR IMPLEMENTATION**
IMPLEMENTATION STATUS: **NOT IMPLEMENTED**

Revision: **H11-RELEASE** · Parent: **SYS-02 File System** · Constitution: **H00**

> Authority: Blueprint > Phase 2 > Phase 2.5 > Phase 3 > approved decisions > H00 > prior H-files > Adobe (comparison) > code (evidence only).

---

## 2. Scope

H11 owns the **cross-H visual/accessibility/error/edge-state contracts for SYS-02 File surfaces**: the File menu, File dialogs (New/Template/Save-As-Template), document tabs + dirty indicator, the dirty-guard dialog, and the no-document state. It consolidates (does NOT re-own) the per-H accessibility/error decisions into one consistent contract.

H11 does NOT own: the design-token DEFINITIONS (→ **SYS-01** §2/§21) · panel/dock/menu CHROME (→ **SYS-01**) · per-H behavioral semantics (→ H01–H08) · the guard-dialog a11y OWNERSHIP (→ **H07** + SYS-01 modal) · import/export progress UI (→ SYS-27).

---

## 3. Authority / Evidence Map

| Source | Establishes |
|---|---|
| H00 §17 | visual constitution: INV-VIS-1..4 (contrast, tokens, reduced-motion, aria) |
| H00 §16 | error constitution: INV-ERR-1..3 (no silent failure, no partial mutation, save-fail keeps DIRTY) |
| H00 §18 | failure taxonomy (P0/P1/P2, VISUAL BUG, SILENT FAILURE…) |
| SYS-01 §28 | control-registry 2-axis state model (FUNCTIONAL/DISABLED/UNAVAILABLE/LOADING/ERROR/COMING-SOON × visibility) |
| SYS-01 §2/§21 | CSS-token theme (no hard-coded colors) |
| phase2.5 C-35 | accessibility: focus ring, aria-live, trap, Esc |
| H02 §19 | tab a11y (role=tab/tablist, aria-selected, D-AMB-003 focus) |
| H03 §16 | context-menu a11y (role=menu/menuitem, Esc, focus return) |
| H04 §13 | dirty-indicator a11y (aria-label, aria-live) |
| H07 §13 | guard-dialog a11y (focus trap, Esc=cancel; initial focus `[NOT SPECIFIED]`) |
| AI01_FORENSIC_LESSONS.md | FL-0012 (a11y implicit), FL-0005 (dead control), FL-0013 (stale binding), FL-0014/0015 (leak) |

---

## 4. Visual State Contract (per SYS-02 control surface)

> All colors = SYS-01 design tokens (INV-VIS-2). No hard-coded values. Every state has defined contrast (INV-VIS-1).

| Surface | States | Token requirements |
|---|---|---|
| File menu items | FUNCTIONAL / DISABLED-BY-CONTEXT / (HIDDEN for legacy) | text vs `bg-elevated`; disabled = `text-muted` |
| New/Template/Save-As-Template dialogs | open(valid)/open(invalid)/submitting/error | `surface`/`text`/`border`/`danger`/`focus-ring`; invalid field = inline `danger` |
| Document tab | ACTIVE/INACTIVE/DIRTY(●) | active = `primary` highlight; ● = `danger`; aria-selected |
| Dirty indicator | CLEAN/DIRTY | ● = `danger` on DIRTY; hidden on CLEAN |
| Guard dialog | open/submitting(error) | `danger` accent; destructive button distinguished |
| No-document state | empty | `text-muted` empty-state text |
| Status bar `st.saving` | idle/saving/saved/error | `success`/`danger` per save state |

**INV-VIS-3:** reduced-motion respected (no motion-dependent feedback). **INV-VIS-1:** every state has foreground ≠ background (white-on-white forbidden — QA failure #1).

---

## 5. Accessibility Contract (consolidated — ownership unchanged)

| Surface | Behavior | Owner (unchanged) | Source |
|---|---|---|---|
| Document tab | `role=tab`/`role=tablist`/`aria-selected`; Enter/Space activate; activated tab receives focus (D-AMB-003); dirty announced in tab name | H02 | H02 §19 |
| Tab context menu | `role=menu`/`role=menuitem`; Esc/outside dismiss; focus returns to tab | H03 | H03 §16 |
| Dirty indicator | `aria-label="unsaved changes"`; `aria-live=polite` on change | H04 | H04 §13 |
| Guard dialog | focus trap; Esc=Cancel; Enter=primary; initial focus `[NOT SPECIFIED]` | H07 + SYS-01 modal | H07 §13 |
| File menu items | `role=menuitem`; shortcut announced | SYS-01 (chrome) / SYS-02 (content) | — |
| Save status | "Saved hh:mm" announced `aria-live` | H05 | H05 §12 |
| Loading (Open) | "opening…" announced | H06 | H06 §12 |
| Destructive actions | announced (Close/Exit/Discard) | H03/H07 | H03 §16 |

**FL-0012 rule:** no accessibility behavior is implicit. Where source is silent (e.g., guard-dialog initial focus), it is `[NOT SPECIFIED]` — never invented. Ownership stays with the per-H owner; H11 only consolidates.

---

## 6. Error Presentation Contract (consolidated — INV-ERR-1/2/3)

| Error | Trigger | Detected by | Visible feedback | State | Dirty | Recover | testId |
|---|---|---|---|---|---|---|---|
| invalid New settings | width/height <2 / empty / fps empty | dialog validation | inline `danger` + Create disabled | unchanged | n/a | fix + retry | T-dlg-new-invalid |
| duplicate template name | Save-as-Template | `[AMB-H01-002]` | `[unresolved]` | `[unresolved]` | none | `[unresolved]` | (H01) |
| save fail (disk/permission/read-only) | Save/Save As | SYS-28 write | "Save error" (status + toast) | stays DIRTY (SAVE_ERROR) | preserved | retry | T-save-fail |
| Save As → already-open path | Save As | H05 identity check | explicit error (toast) | source unchanged | preserved (dirty/History/session) | choose another path | T-save-as-open-path-block |
| open fail (invalid/missing/corrupt/version) | Open/Open Recent | SYS-28 load | toast (+ offer `.autosave`) | CASE A/B unchanged | unchanged | re-select | T-open-fail |
| stale recent item | Open Recent | path check | toast + skip | unchanged | unchanged | re-select | T-open-recent-stale |
| guard save fail | guard "Save" | SYS-28 write | "Save error" in guard | stays DIRTY; close/exit blocked | preserved | retry/cancel | T-guard-save-fail |
| engine unavailable (import/export) | H08 handoff | handoff | honest "engine not attached" | unchanged | unchanged | reload | T-handoff-engine-unavailable |

No silent failure; no fake lifecycle state; every error specifies what/when/where/what-next.

---

## 7. Disabled / Empty / Edge States (consolidated)

| State | Surface | Rule |
|---|---|---|
| No document | File menu + tabs + status | Save/Close/Export/Publish/Import DISABLED-BY-CONTEXT; New/Open/Exit ENABLED; tabs empty; dirty indicator absent |
| Disabled-by-context | menu items/shortcuts | `aria-disabled` + tooltip reason (SYS-01 §28) |
| Loading (Open) | tab/status | spinner + "opening…" (announced) |
| Saving | status `st.saving` | "Saving…" |
| Empty recent list | Open Recent submenu | disabled ("no recent files") |
| Empty template gallery | New-from-Template | `[not specified beyond H01 §9]` — gallery shows empty state (H01) |
| Legacy (AIR/Print/Page-Setup) | File menu | HIDDEN (no dead control) |

---

## 8. Cross-H Visual Consistency

- One dirty ● design across tab + title + status (same `danger` token) — H02/H04/H05 agree.
- One "Saved hh:mm" status string across H05/H07/H04 — same source (eng 13).
- One guard-dialog a11y contract (H07 §13) — H04 does NOT duplicate it (FL-0016).
- One "Save error" surface (status + toast) across H05/H07 — same SYS-28 failure path.

---

## 9. Forensic Pre-Flight

**Lessons consulted:** FL-0001..0032.

**Checks passed:**
- [x] a11y not implicit — every silent behavior registered `[NOT SPECIFIED]` — FL-0012
- [x] no dead control — HIDDEN legacy + DISABLED-BY-CONTEXT with reason — FL-0005
- [x] no stale binding — dirty indicator re-reads on activeDoc:changed — FL-0013
- [x] no dirty/undo leak in visual states — FL-0014/0015
- [x] ownership unchanged — H11 consolidates, does NOT re-own H02/H03/H04/H07 a11y — FL-0016
- [x] tokens not redefined — reference SYS-01 only — FL-0001

---

## 10. Adversarial Audit Findings

| # | Finding | Type | Resolution |
|---|---|---|---|
| F1 | (risk) H11 re-owning H02/H03/H04/H07 a11y | scope (FL-0016) | RESOLVED — consolidated with explicit "owner unchanged" column (§5) |
| F2 | (risk) guard-dialog initial focus invented | a11y (FL-0012) | RESOLVED — `[NOT SPECIFIED]` (§5) |
| F3 | (risk) hard-coded colors | visual (INV-VIS-2) | RESOLVED — token references only (§4) |
| F4 | (risk) "show error" without recovery path | error (INV-ERR-1) | RESOLVED — every error has state/dirty/recover (§6) |

No manufactured findings.

---

## 11. Ambiguity Register

| AMB | Question | Owner | Critical? |
|---|---|---|---|
| (H11) guard-dialog initial focus | which button receives initial focus | H07 (deferred to H11/SYS-01 modal) | NO (a11y refinement) — `[NOT SPECIFIED]`, recommendation = Cancel |
| AMB-H01-002 | duplicate template name | H01 | YES (not H11's) |
| AMB-H07-001 | next-active after close | H07 | YES (not H11's) |

---

## 12. Test ID Matrix

T-vis-menu-states · T-vis-dialog-contrast · T-vis-tab-dirty · T-vis-guard-danger · T-vis-no-doc-empty · T-a11y-tab-role · T-a11y-tab-focus (D-AMB-003) · T-a11y-ctx-menu · T-a11y-dirty-live · T-a11y-guard-trap · T-a11y-save-announce · T-a11y-loading-announce · T-a11y-destructive-announce · T-err-invalid · T-err-save-fail · T-err-open-fail · T-err-guard-save-fail · T-edge-no-doc-disabled · T-edge-empty-recent

---

## 13. Completion Checklist + Final Report

- [x] visual state contract (INV-VIS-1/2/3) (§4)
- [x] a11y contract consolidated, ownership unchanged (§5)
- [x] error presentation contract (INV-ERR-1/2/3) (§6)
- [x] disabled/empty/edge states (§7)
- [x] cross-H visual consistency (§8)
- [x] lessons pre-flight passed
- [x] guard initial focus `[NOT SPECIFIED]`, not invented

STATUS: **READY FOR IMPLEMENTATION** · Surfaces: 7 · A11y contracts: 8 · Error contracts: 8 · Edge states: 7 · Ambiguities: 1 (non-critical, guard focus) · Findings: 4 (resolved).

---

*H11 done. Next: H12.*
