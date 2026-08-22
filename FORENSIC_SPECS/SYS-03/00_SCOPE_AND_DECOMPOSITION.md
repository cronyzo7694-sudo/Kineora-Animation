# SYS-03 — EDIT SYSTEM — SCOPE + H-FILE DECOMPOSITION

> AI-01 forensic scope determination. This file establishes WHAT SYS-03 is, its ownership firewall, and the complete H-file decomposition BEFORE any H-file is drafted.

---

## 1. What SYS-03 IS (authoritative)

SYS-03 = **Edit system**. It owns the **Edit menu commands**, the **Undo/Redo command engine + History panel**, the **clipboard (Cut/Copy/Paste/Duplicate)**, and the **selection commands (Select All / Deselect All / Find & Replace)**.

**Authoritative sources:**
- SYS-01 §31: `SYS-03 Edit | palette, undo/redo toolbar | selection, clipboard | selection:changed, document:changed | its edit cmds | Edit menu | DOCUMENT | toolbar`
- H00 §20: `SYS-03 Edit | undo/redo interplay | (none directly) | clipboard, selection commands | undo contract §13`
- Blueprint Part 01 §1.2.2 (Edit menu table).

## 2. Ownership Firewall (binding — FL-0009/FL-0016)

| Concern | OWNER | SYS-03 role |
|---|---|---|
| Undo/Redo command engine (MOD-COMMAND: History, coalescing, redo invalidation, prevSelection restore) | **SYS-03** | owns |
| History panel (undo-step list, jump-to-step) | **SYS-03** | owns |
| Clipboard (object/frame JSON Cut/Copy/Paste/Duplicate) | **SYS-03** | owns |
| Selection COMMANDS (Select All / Deselect All / Find & Replace) | **SYS-03** | owns |
| Selection ENGINE (hit-test, click/marquee/lasso, per-type behavior, locked/hidden rules — Part 03) | **SYS-14 Stage** (+ SYS-13 Tools) | consumes `selection` |
| Selection STATE + `selection:changed` (MOD-SELECTION) | shared foundation | emits (Select All/Deselect) + consumes (Cut/Copy/Delete) |
| Frame clipboard ops (Cut/Copy/Paste/Clear/Remove Frames, Select All Frames, Copy/Paste Motion, Reverse) | **SYS-15 Timeline** | Edit-menu ENTRY only (handoff) |
| Break Apart / Group / Ungroup | **SYS-19 Symbols** / **SYS-20 Drawing** | Edit-menu ENTRY only (handoff) |
| Arrange (front/back/lock) | **SYS-06 Modify** | context-menu ENTRY only (handoff) |
| Preferences / Keyboard Shortcuts / Toolbars editors | **SYS-08 Commands** / SYS-01 | Edit-menu ENTRY only (handoff) |

**Rule:** SYS-03 never implements hit-testing, frame storage, symbol flattening, or z-ordering. Cross-system behavior = handoff, not ownership (FL-0016).

## 3. What SYS-03 does NOT own

- The selection engine (Part 03 hit-test/marquee/lasso/per-type) → SYS-14/SYS-13.
- Frame clipboard internals → SYS-15.
- Break-apart/group → SYS-19/SYS-20.
- Arrange → SYS-06.
- Shortcut/preference editors → SYS-08.
- Document persistence of clipboard → none (clipboard = SESSION, per code evidence + Part 03 "transient").

## 4. H-File Decomposition (8 files)

| File | Responsibility |
|---|---|
| **H00** | Edit System Constitution: terminology, ownership firewall, authority, undo/redo constitution, clipboard constitution, selection-command boundary, locked events, invariants, state machines |
| **H01** | Undo/Redo engine + History panel |
| **H02** | Clipboard: Cut/Copy/Paste/Duplicate |
| **H03** | Selection commands: Select All / Deselect All / Find & Replace |
| **H04** | Edit Menu + Shortcuts + Context Menus + Cross-System Handoffs |
| **H05** | UI → Engine connection matrix |
| **H06** | QA + Manual Acceptance |
| **H07** | Final Reconciliation + Coverage Proof |

## 5. H-File Dependency Graph

```
H00 (constitution)
 ├─▶ H01 (undo/redo)  ─┐
 ├─▶ H02 (clipboard)   ├─▶ H04 (menu/shortcuts/handoffs) ─▶ H05 (matrix) ─▶ H06 (QA) ─▶ H07 (reconciliation)
 └─▶ H03 (selection cmds) ─┘
```

H01/H02/H03 are mutually independent (each reads H00); H04 depends on H01–H03; H05 on H04; H06 on H05; H07 on all.

## 6. Source Map (verified this pass)

- **Blueprint Part 01 §1.2.2** — Edit menu: Undo/Redo, Cut/Copy, Paste (Center/Place/Special), Duplicate, Select All/Deselect, Find & Replace, Timeline submenu (handoff), Preferences/Shortcuts (handoff).
- **Blueprint Part 03** — selection system (engine = SYS-14; selection state transient; `selection:changed{prevTargets,targets,kind,commonType,bounds}`).
- **Blueprint Part 29** — shortcuts: Ctrl+Z, Ctrl+Shift+Z (or Ctrl+Y), Ctrl+X/C/V, Ctrl+Shift+V, Ctrl+D, Ctrl+A, Ctrl+Shift+A, Ctrl+F, Ctrl+Shift+Alt+K.
- **Blueprint Part 30** — context menus: stage (Paste, Paste in Place, Select All/Deselect, Cut/Copy/Paste, Duplicate, Break Apart, Arrange); layer/library/scene (Duplicate…).
- **Blueprint Part 36** — cross-cutting rules: all mutations are Commands; undo-consistent selection (prevSelection).
- **Blueprint Part 32 §32.18** — Undo/Redo engine (command stack, coalescing, history panel).
- **Phase 2 F-03** — selection features (engine side, SYS-14).
- **Phase 2.5 C-01** — selection UI (tools + options; engine side).
- **Phase 3 eng 05** — MOD-COMMAND: Command interface, History (bounded 100, RSK-011), coalescing, redo invalidation, prevSelection, journal for async.
- **Phase 3 eng 01** — REQ-SEL-005 (selection = view state, no undo; prevSelection restore), REQ-SYS-002 (commands-only writes).
- **SYS-01 §27.1/§30/§31** — locked events (`selection:changed`, `document:changed`); command→control mapping; SYS-03 row.
- **SYS-02 H00 §13** — undo constitution (INV-UNDO-1..4); H00 §22 INV-014/015 (commandId).
- **Code evidence only:** `command.rs` (Command{label,apply,revert}, History{undo,redo}, execute clears redo), `session.rs` (frame_clipboard = session-only, not persisted, not undoable), `controlRegistry.ts` (`edit.undo`/`edit.redo`).

## 7. Anticipated Ambiguity Candidates (to confirm during drafting — NOT pre-resolved)

- AMB-S03-001: clipboard cross-document scope (per-doc vs shared) — Blueprint silent.
- AMB-S03-002: Duplicate offset amount — Blueprint "copy+offset" without value.
- AMB-S03-003: Paste Special formats — Blueprint "options (format)" undefined.
- AMB-S03-004: Delete/Clear (remove selection) — not explicitly listed in Edit menu §1.2.2; required by Part 03 "move/cut/delete".
- AMB-S03-005: Find & Replace depth (text/font/color/symbol/sound) — large scope.

---

*Scope + decomposition complete. Drafting H00 next.*
