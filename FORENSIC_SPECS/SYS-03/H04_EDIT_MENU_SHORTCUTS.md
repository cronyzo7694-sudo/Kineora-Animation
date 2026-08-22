# SYS-03 H04 — EDIT MENU + SHORTCUTS + CONTEXT MENUS + CROSS-SYSTEM HANDOFFS

## 0. Document Status

SPECIFICATION STATUS: **READY FOR IMPLEMENTATION** (scope-limited; the one cross-file AMB-S03-003 format LIST is owned by H02)

IMPLEMENTATION STATUS: **NOT IMPLEMENTED**

Revision: **SYS-03-H04** · Parent: **SYS-03 Edit** · Constitution: **SYS-03 H00**

---

## 1. Scope

H04 owns the **Edit-menu mapping**, the **keyboard-shortcut registry**, the **Edit context-menu entries**, and the **cross-system handoffs** (frame clipboard → SYS-15, break-apart/group → SYS-19/SYS-20, arrange → SYS-06, preferences/shortcut editors → SYS-08/SYS-01). It is the canonical registry for "one semantic action = one commandId = one menu/shortcut/context path".

H04 does NOT own: the commands' semantics (→ H01/H02/H03) · menu CHROME (→ SYS-01) · shortcut-editor infrastructure (→ SYS-08).

---

## 2. Authority / Evidence Map

| Source | Establishes |
|---|---|
| Blueprint Part 01 §1.2.2 | Edit menu item list |
| Blueprint Part 29 | shortcut table (Undo/Redo/Cut/Copy/Paste/Duplicate/Select/Deselect/Find) |
| Blueprint Part 30 | context menus (stage: Paste/Paste-in-Place/Select All/Deselect/Cut/Copy/Paste/Duplicate/Break Apart/Arrange) |
| SYS-01 §9/§30 | shortcut precedence; single-commandId mapping |
| H01/H02/H03 | commandIds (canonical) |

---

## 3. Edit Menu Mapping (canonical)

| Menu | Submenu | Item | Shortcut | commandId | Enabled | Classification |
|---|---|---|---|---|---|---|
| Edit | — | Undo | Ctrl+Z | `edit.undo()` | canUndo | REQUIRED |
| Edit | — | Redo | Ctrl+Shift+Z (Ctrl+Y) | `edit.redo()` | canRedo | REQUIRED |
| Edit | — | Cut | Ctrl+X | `edit.cut()` | non-empty selection | REQUIRED |
| Edit | — | Copy | Ctrl+C | `edit.copy()` | non-empty selection | REQUIRED |
| Edit | — | Paste in Center | Ctrl+V | `edit.paste('center')` | clipboard HAS_OBJECTS | REQUIRED |
| Edit | — | Paste in Place | Ctrl+Shift+V | `edit.paste('place')` | clipboard HAS_OBJECTS | REQUIRED |
| Edit | — | Paste Special | Ctrl+Shift+Alt+V | `edit.paste('special')` | clipboard HAS_OBJECTS | REQUIRED (`[AMB-S03-003 format list]`) |
| Edit | — | Duplicate | Ctrl+D | `edit.duplicate()` | non-empty selection | REQUIRED |
| Edit | — | Delete | Delete (Backspace) | `edit.delete()` | non-empty selection | REQUIRED (RESOLVED) |
| Edit | — | Select All | Ctrl+A | `edit.selectAll()` | doc open | REQUIRED |
| Edit | — | Deselect All | Ctrl+Shift+A | `edit.deselectAll()` | non-empty selection | REQUIRED |
| Edit | — | Find and Replace | Ctrl+F | `edit.findReplace()` | doc open | REQUIRED (RESOLVED) |
| Edit | Timeline | Cut/Copy/Paste/Clear/Remove Frames; Select All Frames; Copy/Paste Motion; Reverse Frames | various | (SYS-15 frame commands) | frame selected | **HANDOFF (SYS-15)** |
| Edit | — | Preferences | Ctrl+U | (SYS-08) | always | **HANDOFF (SYS-08/SYS-01)** |
| Edit | — | Keyboard Shortcuts | Ctrl+Shift+Alt+K | (SYS-08) | always | **HANDOFF (SYS-08)** |

**SYS-03-owned entries: 12** (Undo…Find & Replace) · **Handoff entries: 2** (Timeline submenu, Preferences/Shortcuts). Break Apart / Group / Arrange are context-menu entries (below), not Edit-menu rows in the Blueprint §1.2.2 (they live under Modify in Animate; Blueprint lists them in Part 29/30 as commands — registered as handoffs).

---

## 4. Keyboard Shortcut Registry (canonical — Part 29 verbatim)

| Shortcut | commandId | Precondition | Source |
|---|---|---|---|
| Ctrl+Z | `edit.undo()` | canUndo | Part 29 |
| Ctrl+Shift+Z / Ctrl+Y | `edit.redo()` | canRedo | Part 29 (both bound) |
| Ctrl+X | `edit.cut()` | selection | Part 29 |
| Ctrl+C | `edit.copy()` | selection | Part 29 |
| Ctrl+V | `edit.paste('center')` | clipboard | Part 29 |
| Ctrl+Shift+V | `edit.paste('place')` | clipboard | Part 29 |
| Ctrl+Shift+Alt+V | `edit.paste('special')` | clipboard | Part 01 §1.2.2 |
| Ctrl+D | `edit.duplicate()` | selection | Part 29 |
| Ctrl+A | `edit.selectAll()` | doc open | Part 29 |
| Ctrl+Shift+A | `edit.deselectAll()` | selection | Part 29 |
| Ctrl+F | `edit.findReplace()` | doc open | Part 29 |

**Shortcut definitions: 11.** Delete/Backspace = `edit.delete()` (not in Part 29 shortcut table; the Delete KEY is the universal trigger — the Blueprint omits an explicit Delete row; the operation is authoritative-by-implication from Part 03 §3.4.1). No conflict with SYS-01 (§9) or SYS-02 (H09): Ctrl+Z/Y/X/C/V/D/A/F are Edit-exclusive. All source-specified, none invented.

---

## 5. Edit Context-Menu Entries (Part 30 — canonical)

| Target | Items (SYS-03-owned) | Handoffs |
|---|---|---|
| Stage empty / pasteboard | Paste, Paste in Place, Select All, Deselect All | — |
| Selected object(s) | Cut, Copy, Paste, Duplicate, Delete | Break Apart (SYS-19/20), Arrange (SYS-06) |

Context-menu open = non-destructive (INV-DSTR-1, SYS-02 H00 §10). Only explicit item selection mutates.

---

## 6. Cross-System Handoffs (canonical — SYS-03 does NOT own these engines)

| Edit-menu entry | commandId (owner) | Handoff target | SYS-03 role |
|---|---|---|---|
| Timeline → frame clipboard ops | (SYS-15 commands) | SYS-15 Timeline | menu entry only |
| Timeline → Copy/Paste Motion | (SYS-15) | SYS-15 | menu entry only |
| Timeline → Reverse Frames | (SYS-15) | SYS-15 | menu entry only |
| Break Apart (Ctrl+B) | (SYS-19/SYS-20) | SYS-19 Symbols / SYS-20 Drawing | context-menu entry only |
| Group / Ungroup (Ctrl+G / Ctrl+Shift+G) | (SYS-20) | SYS-20 Drawing | context-menu entry only |
| Arrange (front/back/lock) | (SYS-06) | SYS-06 Modify | context-menu entry only |
| Preferences (Ctrl+U) | (SYS-08/SYS-01) | SYS-08/SYS-01 | menu entry only |
| Keyboard Shortcuts (Ctrl+Shift+Alt+K) | (SYS-08) | SYS-08 | menu entry only |

No engine absorbed (FL-0016). Each handoff = entry → owner's command → owner's engine.

---

## 7. Invocation Equivalence (single commandId — INV-CMD-3, SYS-01 §30)

Every SYS-03 command is reachable via menu + shortcut (+ context menu where listed), all resolving to the SAME commandId (§3/§4/§5). The command is implemented once (H01/H02/H03).

---

## 8. Enable / Disable Conditions (canonical)

| Condition | Affected | State |
|---|---|---|
| empty selection | Cut/Copy/Duplicate/Delete/Deselect | DISABLED-BY-CONTEXT |
| empty clipboard | Paste (center/place/special) | DISABLED-BY-CONTEXT |
| empty undo stack | Undo | DISABLED-BY-CONTEXT |
| empty redo stack | Redo | DISABLED-BY-CONTEXT |
| no doc | Select All / Find & Replace | DISABLED-BY-CONTEXT |

`disabled ≠ hidden` (SYS-01 §28.3). No silent no-op.

---

## 9. Forensic Pre-Flight

**Lessons consulted:** FL-0001..0032.
**Checks:** scope ✓ (registry + handoffs only) · single-commandId ✓ · no invented shortcut ✓ (all Part 29/§1.2.2) · handoffs not absorbed (FL-0016) ✓ · counting ✓ (12 owned + 2 handoff menu entries; 11 shortcuts).

---

## 10. Adversarial Audit Findings

| # | Finding | Type | Resolution |
|---|---|---|---|
| F1 | (risk) frame clipboard absorbed by SYS-03 | scope (FL-0016) | RESOLVED — handoff to SYS-15 |
| F2 | (risk) Break Apart/Arrange re-specified in SYS-03 | scope | RESOLVED — context-menu handoff only |
| F3 | (risk) Delete key as invented shortcut | shortcut | RESOLVED — Delete is required by Part 03 §3.4.1; Delete/Backspace = universal trigger (documented inference) |

No manufactured findings.

---

## 11. Ambiguity Register (referenced, owned by H02/H03)

| AMB | Owner |
|---|---|
| AMB-S03-001 (clipboard scope) | H02 |
| AMB-S03-002 (duplicate offset) | H02 |
| AMB-S03-003 (paste special FORMAT LIST) | H02 |

H04 references these (as `[AMB-S03-XXX]` placeholders in §3) — it does NOT resolve them.

---

## 12. Final Report

STATUS: **READY FOR IMPLEMENTATION** (registry complete; the single open AMB-S03-003 format LIST is owned by H02 and referenced as a placeholder) · Menu entries: 12 owned + 2 handoff · Shortcuts: 11 · Context-menu targets: 2 · Handoffs: 8 · Ambiguities: 0 owned (1 referenced) · Findings: 3 (resolved).

---

*H04 done. Next: H05 (UI → Engine Matrix).*
