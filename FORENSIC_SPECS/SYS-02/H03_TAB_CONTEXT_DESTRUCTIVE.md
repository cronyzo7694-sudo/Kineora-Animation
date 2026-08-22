# H03 — TAB INTERACTION + CONTEXT MENU + DESTRUCTIVE SAFETY

## 1. Document Status

STATUS: **READY FOR IMPLEMENTATION**

Revision: **H03-RELEASE**

Parent: **SYS-02 File System** · Constitution: **H00**

> Authority order: Blueprint > Phase 2 > Phase 2.5 > Phase 3 > approved decisions > Adobe > code (evidence only).
> One cross-document contradiction resolved in §23 (F-01); it is a SYS-01 correction note, not an H03 blocker.

---

## 2. Scope

H03 owns ONLY:
- tab right-click / context-menu behavior,
- tab context-menu items (the authoritative set),
- left-click vs right-click separation,
- context-menu lifecycle (open → action / cancel / dismiss),
- tab-target identification (stable Document ID),
- destructive-action safety (no accidental close/discard/mutate),
- explicit destructive confirmation ONLY where sources require,
- context-menu accessibility + keyboard,
- interaction handoff to H02/H04/H05/H07/H09,
- tab-level safety invariants.

H03 does NOT own:
- active-document model / open-set → **H02**,
- tab visual chrome → **SYS-01**,
- dirty calculation/guard mechanics → **H04**,
- Save/Save As → **H05**,
- Open/Open Recent → **H06**,
- final Close/Close-All/Exit lifecycle mechanics → **H07**,
- final menu/shortcut registry → **H09**,
- persistence internals → **SYS-28**.

H03 owns INTERACTION + SAFETY semantics, not the lifecycle engine.

---

## 3. Authority / Evidence Map

| Source | Section | Establishes |
|---|---|---|
| Blueprint Part 01 §1.2.1 | Close / Close All | "Close active/all docs (prompt save)" — the Close COMMAND (menu) |
| H00 §10 INV-DSTR-1 | destructive | right-click ≠ destructive; only explicit item selection triggers |
| H00 §10 INV-DSTR-2 | interaction | left-click = activate; right-click = context menu; distinct handlers |
| H00 §10 destructive table | confirmations | Close = dirty-guard only (no extra confirm); Discard = non-undoable; Save = overwrite (no confirm) |
| phase2.5 C-07 (overlay/modal/z-index) | context menu | context menu = L4 overlay; Esc/outside-click dismiss; focus rules |
| SYS-01 §8 | tab context menu | lists "Close" + "Close Others" (see §23 finding — Close Others misattributed) |
| SYS-01 §6.3 | tab chrome | `app.tab.close` (× affordance) → H07 guard |
| SYS-02 §23 (consolidated) | comparison | per-tab "Close Others" = `[ADOBE FEATURE — NOT IN BLUEPRINT]` excluded |
| SYS-02 D-7 | decision | per-tab **× close** included (NOT "Close Others") |
| H02-RELEASE | tab model | tab ID = Document ID; left-click activate; right-click → H03 |
| AI01_FORENSIC_LESSONS.md | FL-0001..0024 | pre-flight prevention |
| Current code | (no tab/context-menu UI) | multi-doc + tab context menu NOT implemented |

---

## 4. Dependency Map

```
H03 depends on: H00 (INV-DSTR-*, destructive table), H02 (tab ID, active model),
                SYS-01 (overlay/context-menu chrome, C-07 lifecycle).
H03 provides to: H07 (Close guard handoff), H04 (dirty guard), H09 (command registry), H12.
Forward handoffs (H03 reacts, does not own): H04 dirty guard · H07 close mechanics.
```

---

## 5. Terminology

| Term | Definition | Source |
|---|---|---|
| Tab context menu | the right-click menu on a document tab; L4 overlay; non-destructive on open | H00 INV-DSTR-1 |
| Target tab | the tab that was right-clicked; identified by stable Document ID, NOT by active pointer or DOM index | H02 §9, §7 below |
| Destructive action | an action that closes/discards/overwrites a document (Close, Discard) | H00 §10 |
| Dirty guard | the Discard/Save/Cancel dialog shown before closing a DIRTY doc | H00 §10, H04 |
| Context-menu lifecycle | OPEN → (ACTION \| CANCEL \| DISMISS) | SYS-01 C-07 |

---

## 6. Context-Menu Model

### 6.1 The menu exists (binding)

Right-clicking a document tab opens a context menu. The menu itself is **non-destructive**: opening it NEVER closes/discards/overwrites/mutates/activates anything. Only an explicit item selection triggers an action (INV-DSTR-1).

### 6.2 The authoritative item set

**The tab context menu contains EXACTLY ONE item: `Close`.**

| menuItemId | Label | Justification | Classification |
|---|---|---|---|
| ctx-tab.close | Close | reuses the Blueprint Close command (Part 01 §1.2.1 "Close (prompt save)") + D-7 per-tab × affordance | `[BLUEPRINT-derived]` — the Close command is Blueprint; its context-menu entry is the same command |

**Explicitly EXCLUDED (not invented):**
- **Close Others** — `[ADOBE FEATURE — NOT IN BLUEPRINT]`, excluded (SYS-02 §23). (SYS-01 §8 has a stale "included D-7" note — see §23 F-01; D-7 is about per-tab ×, NOT Close Others.)
- Close tabs to left/right, Close All (context item), Duplicate, Rename, etc. — `[NOT SPECIFIED]`; none are in Blueprint; none are added.

**Rule:** H03 does NOT enumerate a rich tab menu. The Blueprint gives exactly one Close command; the context menu exposes that one command. Any future item requires a product decision.

### 6.3 Menu item contract (full field set)

**ctx-tab.close:**
- menuItemId `ctx-tab.close` · label "Close" · target = the right-clicked tab's Document ID · trigger = menu-item click / Enter on focused item · precondition = a tab exists (doc open) · enabled = always (for an existing tab) · disabled reason = n/a · action = `tab.close(targetDocId)` → H07 guard → H02 re-activation · commandId `tab.close(docId)` (SAME commandId as the tab × affordance, H02 §12 — no drift, FL-0010; File ▸ Close is `file.close()`, a SEPARATE H07 command — see reconciliation note §8) · resulting state = doc removed (or guard shown if DIRTY) · event = per §14 (close-active vs close-inactive) · UI = tab removed; strip updates; content panels rebind only if active changed · dirty impact = none (dirty is per-doc; the closed doc's dirty dies with it) · undo = no (lifecycle) · persistence = SESSION (open-set) · error = dirty → guard (H04/H07); cancel → unchanged · accessibility = role=menuitem, label "Close <title>" · testId `T-ctx-tab-close`.

**No other menu items exist.** No dead items. No decorative items.

---

## 7. Context Targeting

- Every context-menu invocation captures an explicit **target Document ID** at right-click time.
- The target is **NOT** derived from: the current active pointer alone, a stale closure, the DOM index, or tab position.
- Target identity = the right-clicked tab's Document ID, stable through the menu lifecycle.

**Why (binding):** tab order can change, tabs can be reordered (H02 `openSet:changed{reordered}`), and the active document can differ from the right-clicked tab. The target must remain the clicked document regardless.

**Right-click does NOT activate the target** (INV-DSTR-2: left-click = activate, right-click = menu). The menu opens targeting the clicked tab; the active document does not change on open.

**Reentrant case:** if the tab list changes (reorder/close) while the menu is open, the target Document ID remains the same doc. If the target doc is removed (closed elsewhere) while the menu is open, the menu DISMISSES (safe invalidation — see §17 lifecycle).

---

## 8. Tab Interaction Rules (left vs right)

| Interaction | Behavior | Owner |
|---|---|---|
| Left-click | activate (H02 `activateDocument`) | H02 / SYS-01 input |
| Right-click | open context menu (non-destructive) | H03 |
| Enter/Space (focused tab) | activate | H02/SYS-01 |
| Close × | `tab.close` → H07 guard | H07 guard / H02 re-activate |
| Drag reorder | reorder open-set; active unchanged | SYS-01 / H02 |

**Non-overlap (binding):** left-click handler and right-click handler are distinct; a right-click NEVER routes into the activation or close path except via an explicit menu-item selection.

---

## 9. Menu Item / Control Matrix

| Control | commandId | Trigger | Precondition | Enabled | Action | State transition | Event | UI | Dirty | Undo | Persist | Error | A11y | testId |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ctx-tab.close | `tab.close(docId)` | item click / Enter | target tab exists | always | close target (H07) | doc removed; if active → next active | §14 | strip update + §H02 rebind (if active) | none | no | SESSION | dirty→guard; cancel→unchanged | menuitem | T-ctx-tab-close |

(Single row — the only menu item. No additional controls.)

---

## 10. Enabled / Disabled Rules

| Condition | ctx-tab.close |
|---|---|
| No document | menu cannot open (no tab to right-click) |
| Tab exists | enabled |
| Single tab vs many | enabled (closing the last → NO_DOCUMENT, valid) |
| DIRTY target | enabled (guard shown on select, H04/H07) |
| Lifecycle transition in progress | menu dismisses (§17) |

No visible-but-dead item. The one item is always enabled when a tab exists; its dirty consequences are handled by the guard, not by disabling the item.

---

## 11. State Model

Context menu states (L4 overlay):

| State | Entry | Exit | UI | Non-destructive? |
|---|---|---|---|---|
| CLOSED | (idle) | OPEN (right-click) | — | — |
| OPEN | right-click tab | ACTION / CANCEL / DISMISS | menu visible, target captured | YES — no mutation |
| ACTION | item selected | back to CLOSED | action executes | only the action mutates |
| CANCEL | Esc / outside-click | CLOSED | menu gone | YES — no mutation |
| DISMISS | target doc removed / lifecycle transition | CLOSED | menu gone | YES — no mutation |

**Invariant:** OPEN, CANCEL, and DISMISS never mutate the document, never dirty, never create undo (FL-0014/0015). Only ACTION (a real command) mutates.

---

## 12. Destructive Safety Matrix

| Operation | Trigger | Confirmation | Dirty guard | Cancel | Undo | Accidental protection | Classification |
|---|---|---|---|---|---|---|---|
| Close (ctx item) | menu select | none (direct) | **yes if DIRTY** (H04/H07) | Cancel = unchanged | no | menu-open ≠ close (INV-DSTR-1) | DIRTY GUARD |
| Discard (in guard) | guard button | n/a | n/a | — | no (permanent) | guard-modal button | EXPLICIT (non-undoable) |
| Save (in guard) | guard button | none | n/a | — | no | guard-modal button | DIRTY GUARD path |

**Principle (H00 §10, binding):** confirmation exists ONLY where sources require it. Close = dirty-guard only (no extra confirm for a CLEAN doc). No invented confirmations. No removed required guards.

**Close Others** = NOT a menu item (excluded). No "close tabs to left/right". No destructive action is bound to right-click or hover.

---

## 13. Dirty / Save / Close Handoffs

When `ctx-tab.close` targets a DIRTY document:

1. **Guard owner:** H04 (dirty flag) + H07 (guard dialog). H03 does NOT implement the guard.
2. **Trigger:** `tab.close(targetDocId)` reaches H07's close flow.
3. **Dialog:** Discard / Save / Cancel (H00 §10).
4. **Save path:** H05 write → CLEAN → close proceeds.
5. **Discard path:** lose changes → close proceeds.
6. **Cancel path:** no close; target doc unchanged.
7. **Resulting lifecycle:** doc removed (or not, on cancel); H02 re-activates next / NO_DOCUMENT.
8. **Event:** per §14.
9. **Undo:** no (lifecycle).
10. **Error:** save-fail keeps DIRTY, close does NOT proceed (STM-DIRTY).

H03 defines only the context-menu interaction and the handoff; it never implements H04/H05/H07 internals (FL-0016).

---

## 14. Event / State Propagation Matrix

| Action | Owner | State change | Event(s) | Payload | Consumers | UI | Dirty | Undo | Persist |
|---|---|---|---|---|---|---|---|---|---|
| Right-click open | H03 | (none — view) | **none** | — | — | menu shown | no | no | none |
| Menu cancel/dismiss | H03 | (none) | **none** | — | — | menu gone | no | no | none |
| Select Close (active target, survivor) | H07/H02 | open-set + active | `openSet:changed{removed}` → `activeDoc:changed{next}` | `{removed,A}` → `{next}` | strip + §H02 rebind | next active | no | no | SESSION |
| Select Close (inactive target) | H07/H02 | open-set only | `openSet:changed{removed}` | `{removed,B}` | strip only | tab removed | no | no | SESSION |
| Select Close (last) | H07/H02 | open-set + active→null | `openSet:changed{removed}` → `activeDoc:changed{null}` | `{removed,A}` → `{null}` | strip + §H02 | NO_DOCUMENT | no | no | SESSION |

**Binding:** context-menu open/cancel/dismiss emit NO events (no mutation). Only the resulting close emits the H02/H07 lifecycle events. `activeDoc:changed` is NEVER a refresh hack (FL-0007).

---

## 15. Undo / Dirty / Persistence

- Context-menu open/cancel/dismiss: NO dirty, NO undo, NO persistence.
- Selecting Close: lifecycle → no document undo; the closed doc's dirty dies with it; open-set = SESSION.
- Discard: non-undoable (permanent loss of unsaved changes — by definition).
- No context-menu operation accidentally mutates the document.

---

## 16. Accessibility

- Context menu: `role="menu"`; item: `role="menuitem"` (SYS-01 overlay chrome).
- Keyboard: right-click equivalent = Context-menu key / Shift+F10 on focused tab `[NOT SPECIFIED — see §24 AMB-H03-002]`; arrow-key navigation within menu; Enter = select; Esc = cancel.
- Focus: menu takes focus on open (SYS-01 C-07: popover takes focus); focus returns to the target tab on dismiss.
- Disabled/destructive announcement: "Close" is destructive → announced; the guard dialog is announced.
- Screen-reader label: "Close <title>".
- Contrast: SYS-01 tokens (no hard-coded colors in H03).
- Dirty-state announcement: guard dialog announces "unsaved changes".

---

## 17. Context Menu Lifecycle

```
CLOSED ──right-click(target)──▶ OPEN (capture targetDocId)
OPEN ──select item──▶ ACTION (run tab.close(target)) ──▶ CLOSED
OPEN ──Esc──▶ CANCEL ──▶ CLOSED
OPEN ──outside-click──▶ CANCEL ──▶ CLOSED
OPEN ──focus loss──▶ CANCEL ──▶ CLOSED
OPEN ──pointer-cancel──▶ CANCEL ──▶ CLOSED
OPEN ──target doc removed / lifecycle transition──▶ DISMISS ──▶ CLOSED
```

- Esc / outside-click / focus-loss / pointer-cancel → CANCEL (no mutation) — per SYS-01 C-07.
- Target doc removed while menu open → DISMISS (the Close item's target no longer exists; no action possible). Safe invalidation, not a crash.
- Window/panel change while open → DISMISS (same rule).

---

## 18. Edge-Case Matrix

| # | Case | Expected | Owner | State | Event | UI | Error | testId |
|---|---|---|---|---|---|---|---|---|
| 1 | right-click active tab | menu opens targeting active doc; no mutation | H03 | OPEN | none | menu | — | T-ctx-open-active |
| 2 | right-click inactive tab | menu opens targeting INACTIVE doc (by ID), NOT active | H03 | OPEN | none | menu | — | T-ctx-open-inactive |
| 3 | right-click last tab | menu opens; Close → NO_DOCUMENT (valid) | H03/H07 | OPEN | none | menu | — | T-ctx-open-last |
| 4 | right-click one of many | menu targets the clicked one | H03 | OPEN | none | menu | — | T-ctx-open-many |
| 5 | open then Esc | menu cancels, no mutation | H03 | CLOSED | none | menu gone | — | T-ctx-esc |
| 6 | open then outside-click | menu cancels, no mutation | H03 | CLOSED | none | menu gone | — | T-ctx-outside |
| 7 | select Close (clean target) | close proceeds, no confirm | H07/H02 | closed | close events | tab removed | — | T-ctx-close-clean |
| 8 | select Close (dirty target) | guard shown | H04/H07 | guard | — | dialog | — | T-ctx-close-dirty |
| 9 | disabled item | n/a (no disabled item in the set) | — | — | — | — | — | — |
| 10 | target becomes inactive | menu still targets it by ID | H03 | OPEN | none | — | — | T-ctx-target-inactive |
| 11 | target becomes active | menu still targets it by ID | H03 | OPEN | none | — | — | T-ctx-target-active |
| 12 | target reordered while open | target ID unchanged; menu valid | H03 | OPEN | none | — | — | T-ctx-target-reorder |
| 13 | target closed while menu open | menu DISMISSES | H03 | DISMISS | none | menu gone | — | T-ctx-dismiss-removed |
| 14 | target becomes dirty while open | Close still works (guard on select) | H03/H04 | OPEN | none | — | — | T-ctx-target-dirty |
| 15 | target becomes clean while open | Close direct | H03/H04 | OPEN | none | — | — | T-ctx-target-clean |
| 16 | save fails during guarded close | stays DIRTY, close blocked | H05/H07 | guard | — | "Save error" | retry | T-ctx-save-fail |
| 17 | Discard selected | lose changes + close | H07 | closed | close events | tab removed | — | T-ctx-discard |
| 18 | Cancel selected | unchanged, menu closes | H07 | open set unchanged | none | menu gone | — | T-ctx-cancel |
| 19 | multiple closes in sequence | each targets its own doc by ID | H07/H02 | — | close events ×N | — | — | T-ctx-seq |
| 20 | rapid right-click | each open captures fresh target; no double-mutation | H03 | OPEN | none | — | — | T-ctx-rapid |
| 21 | keyboard-opened menu | `[NOT SPECIFIED]` AMB-H03-002 | — | — | — | — | — | — |
| 22 | stale target reference | target = captured Doc ID, never stale closure | H03 | OPEN | none | — | — | T-ctx-stale-target |
| 23 | duplicate target ID | impossible (D-AMB-001 forbids dup ID) | H02 | — | — | — | — | T-ctx-dup-id |
| 24 | no-document state | no tab to right-click; menu cannot open | H03 | — | none | — | — | T-ctx-no-doc |
| 25 | action while lifecycle in progress | menu DISMISSES | H03 | DISMISS | none | menu gone | — | T-ctx-dismiss-busy |

---

## 19. Cross-System Handoffs

| Producer → H03 | Trigger | Command/event | H03 behavior | Downstream owner |
|---|---|---|---|---|
| H02 (tab model) | right-click | (none — view) | capture targetDocId; open menu | — |
| H03 → H07 | select Close | `tab.close(targetDocId)` | hand off | H07 guard + close |
| H03 → H04 | dirty target | (via H07) | guard path | H04 dirty + H07 dialog |
| H03 → H05 | guard "Save" | (via H07) | — | H05 save |
| H03 → H02 | close result | `openSet:changed` / `activeDoc:changed` | — | H02 re-activation |
| H03 → H09 | command registry | `tab.close` (single commandId) | — | H09 |

No "handled elsewhere" without exact owner. H03 never implements H04/H05/H07 internals.

---

## 20. Dead-Control Audit

- **ctx-tab.close** — visible → `tab.close(docId)` → H07 guard → H02 re-activation. ✅ T-ctx-tab-close.
- **Close Others** — NOT a control (excluded). ✅ no dead control.
- No decorative items. No menu item without a real path.

---

## 21. Ownership Audit

| Concern | ONE owner | Source of truth |
|---|---|---|
| tab context-menu items | H03 | `{ctx-tab.close}` |
| context-menu chrome (render/overlay/z/focus) | SYS-01 | overlay C-07 |
| target identity | H02 | Document ID (tab = doc) |
| close command | H07 (guard) / H02 (re-activate) | `tab.close` |
| dirty guard | H04 | STM-DIRTY |
| save | H05 | — |

No collision. One owner per concern.

---

## 22. Forensic Pre-Flight / Lessons Traceability

**Lessons consulted:** FL-0001..0026 (all ACTIVE).

**Checks passed:**
- [x] scope — only interaction+safety (§2); FL-0016
- [x] ownership — H03 owns menu semantics; chrome = SYS-01; close = H07 (§21); FL-0009
- [x] events — no event on open/cancel; close events from H02/H07 only; no fake refresh (§14); FL-0007/0008
- [x] state — OPEN/ACTION/CANCEL/DISMISS; no mutation on open (§11); FL-0021
- [x] invariant ↔ transition cross-check — lifecycle (§17) consistent with state model (§11); no contradiction; FL-0025
- [x] controls — one item, single commandId `tab.close` (no drift, no collision) (§9); FL-0005/0010
- [x] identity — target = stable Doc ID, never DOM index/closure (§7); FL-0011/0013
- [x] dirty/undo — menu open/cancel never dirty/undo; discard non-undoable (§15); FL-0014/0015
- [x] persistence — SESSION (§15); FL-0004/0017
- [x] accessibility — menuitem role, Esc, focus return (§16); FL-0012
- [x] edge cases — 25 cases (§18); FL-0018/0019
- [x] status honest — READY because no critical ambiguity (§1); FL-0018/0023

**New recurring lessons discovered:** none new (FL-0007/0008/0009/0010/0011/0012 already cover the H03 concerns). The cross-doc "Close Others" contradiction (F-01) is a SYS-01 correction note, not a new lesson class — it is an instance of FL-0022 (a decision misattributed).

---

## 23. Adversarial Audit Findings

| # | Finding | Type | Evidence | Resolution |
|---|---|---|---|---|
| F-01 | SYS-01 §8 says "Close Others = included D-7", but D-7's text (per-tab × close) and SYS-02 §23 (Close Others = ADOBE-ONLY excluded) contradict it | cross-doc contradiction / FL-0022 instance | SYS-01 §8 vs SYS-01 §0 D-7 vs SYS-02 §23 | H03 follows SYS-02 §23 + D-7 actual text: **Close Others EXCLUDED**. SYS-01 §8's "included D-7" note is a stale misattribution to be corrected in a future SYS-01 revision. NOT an H03 blocker. |
| F-02 | Tab context-menu item set not enumerated in Blueprint | scope risk | Blueprint §1.2.1 (menu items only, no tab context menu) | H03 exposes ONLY "Close" (reuses Blueprint Close command); no invented items (§6.2). |
| F-03 | Keyboard context-menu opening key unspecified | a11y | Blueprint silent | AMB-H03-002 registered (non-blocking). |
| F-04 | Target-activation-on-right-click source-silent | interaction | H00 INV-DSTR-2 (right-click = menu, not activate) | RESOLVED: right-click does NOT activate (INV-DSTR-2). |
| F-05 | (risk) menu item using DOM index as target | identity | H02 tab = Doc ID | RESOLVED: target = captured Doc ID (§7). |

No manufactured findings.

---

## 24. Ambiguity Register

| AMB-ID | Question | Sources | Critical? | Owner | Resolution required? | Recommendation (NOT authoritative) |
|---|---|---|---|---|---|---|
| AMB-H03-001 | Should the tab context menu contain more than "Close" (e.g. future items)? | Blueprint silent on tab-context items | NO (current set = {Close} is complete for Blueprint) | product | only if expanding | no expansion until a product decision |
| AMB-H03-002 | Keyboard gesture to open the tab context menu (Context-menu key / Shift+F10)? | Blueprint silent; SYS-01 C-07 (context menu = L4, focus rules) | NO (mouse right-click is sufficient for H03; keyboard = refinement) | H09/H11 | only if keyboard-menu is wanted | adopt Context-menu key / Shift+F10 |

**Zero implementation-critical ambiguities.** AMB-H03-001/002 are non-blocking refinements.

---

## 25. Test ID Matrix

T-ctx-open-active · T-ctx-open-inactive · T-ctx-open-last · T-ctx-open-many · T-ctx-esc · T-ctx-outside · T-ctx-close-clean · T-ctx-close-dirty · T-ctx-target-inactive · T-ctx-target-active · T-ctx-target-reorder · T-ctx-dismiss-removed · T-ctx-target-dirty · T-ctx-target-clean · T-ctx-save-fail · T-ctx-discard · T-ctx-cancel · T-ctx-seq · T-ctx-rapid · T-ctx-stale-target · T-ctx-dup-id · T-ctx-no-doc · T-ctx-dismiss-busy · T-ctx-tab-close

---

## 26. Completion Checklist

- [x] H00 INV-DSTR-1/2 satisfied (right-click ≠ destructive; distinct handlers)
- [x] H02 tab model consistent (tab ID = Doc ID; left-click activate)
- [x] context-menu items = {Close} (authoritative only, no invention)
- [x] target identity stable (Doc ID, not index/closure)
- [x] no right-click activation (INV-DSTR-2)
- [x] destructive confirmations = dirty-guard only (H00 §10)
- [x] dirty/save/close handoffs (H04/H05/H07) defined, not owned
- [x] events correct (no event on open/cancel; close events from H02/H07)
- [x] no dead controls (one item, single commandId)
- [x] accessibility (role=menu/menuitem, Esc, focus return)
- [x] 25 edge cases with testId
- [x] lessons pre-flight passed (24)
- [x] adversarial audit (F-01..F-05 resolved)
- [x] zero implementation-critical ambiguities

---

## 27. Final H03 Report

**SOURCE COVERAGE:** Blueprint §1.2.1 · H00 §10 · phase2.5 C-07 · SYS-01 §8/§6.3 · SYS-02 §23 · D-7 · H02-RELEASE · AI01_FORENSIC_LESSONS.md.

**MENU ITEMS:** 1 (`ctx-tab.close`).

**COMMANDS:** 1 (`tab.close(docId)` — shared with tab ×, H02 §12; File ▸ Close = `file.close()`, H07).

**STATES:** 5 (CLOSED/OPEN/ACTION/CANCEL/DISMISS).

**EDGE CASES:** 25.

**AMBIGUITIES:** 2 (both non-blocking: AMB-H03-001 item-set expansion, AMB-H03-002 keyboard open).

**ADVERSARIAL FINDINGS:** 5 (F-01 cross-doc contradiction resolved; F-02 item-set scope; F-03 a11y registered; F-04/F-05 resolved).

**CRITICAL RISKS:** 0.

**STATUS:** **READY FOR IMPLEMENTATION**

---

*STOP — H04 not started; no code written. H03 is safe to hand to AI-02.*
