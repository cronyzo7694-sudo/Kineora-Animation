# KINEORA FORENSIC PRODUCT SPECIFICATION — SYSTEM QUEUE & PROCESS

> **Correction applied:** scope = the ENTIRE Kineora Animation application (NOT Timeline-only). Timeline is one system among ~28.
> **Goal:** a forensic spec detailed enough that an implementation AI builds each system WITHOUT GUESSING.
> **Two-source coverage:** (A) Kineora Blueprint (authoritative) + (B) official Adobe Animate (where a professional equivalent needs it).

---

## 0. TWO-SOURCE POLICY

| Case | Rule |
|---|---|
| Feature in Blueprint | `[BLUEPRINT]` — document from Phase 1–4 sources |
| Feature in Adobe, NOT in Blueprint | `[ADOBE FEATURE — NOT IN BLUEPRINT]` — documented for awareness, **NOT silently added to Kineora**; inclusion = separate product decision |
| Blueprint and Adobe differ | `[BLUEPRINT OVERRIDE]` — Blueprint behavior wins for Kineora |
| Adobe source | **official Adobe docs** (helpx.adobe.com / learn.adobe.com) whenever possible; random blogs NOT primary authority |
| Kineora's own choices | `[OUR DESIGN DECISION]` (already tagged in Phase 2) |

**Evidence keys (from Phase 2):** `[OFFICIAL]` `[SECONDARY VERIFIED]` `[OBSERVED]` `[COMMUNITY REPORT]` `[INFERENCE]` `[UNCERTAIN]` `[LEGACY]` `[REMOVED]` `[OUR DESIGN DECISION]`.

---

## 1. SYSTEM REGISTRY (processing order — derived from Master Feature Inventory)

> Menus are documented once (all items, §11 style). The deep underlying systems are documented separately at full forensic depth. Where a menu item belongs to a deep system (e.g., Text menu → Text system), the menu spec points to it.

| # | System | Blueprint source | Contract / REQ |
|---|---|---|---|
| 1 | **Application / Workspace** (shell, panels, docking, tabs, resize, status, toolbars) | Part 01 §1.1–1.3, 32.1 | C-02, C-05, C-06 |
| 2 | **File** (menu + document lifecycle) | Part 01 §1.2.1, 27, 28 | C-03, C-30, C-31, REQ-DOC |
| 3 | **Edit** (menu + clipboard + selection) | Part 01 §1.2.2, 03, 36 | C-03, REQ-SEL |
| 4 | **View** (menu + zoom/rulers/guides/grid/snapping/preview) | Part 01 §1.2.3, 1.4.4 | C-03 |
| 5 | **Insert** (menu) | Part 01 §1.2.4 | C-03 |
| 6 | **Modify** (menu) | Part 01 §1.2.5 | C-03, C-14 |
| 7 | **Text** (menu + COMPLETE text system) | Part 01 §1.2.6, 22, T2B.2 | C-16, REQ-TXT |
| 8 | **Commands** (menu + command palette) | Part 01 §1.2.7, 32 | C-04 |
| 9 | **Control / Playback** (menu + transport) | Part 01 §1.2.8, 07.6 | STM-PLAYBACK, REQ-TIM-004 |
| 10 | **Debug** (menu + panel) | Part 01 §1.2.9, 32 | — |
| 11 | **Window** (menu + panel management) | Part 01 §1.2.10 | C-06 |
| 12 | **Help** (menu) | Part 01 §1.2.11 | — |
| 13 | **Tools** (EVERY tool, 27-field) | Part 02a–02d | C-13, C-15, C-23/24/27 |
| 14 | **Stage** (canvas) | Part 01 §1.4, 03, 32.1 | C-01 |
| 15 | **Timeline** | Part 07 | C-08, REQ-TIM |
| 16 | **Layers** | Part 20 | C-22, REQ-LAY |
| 17 | **Properties** | Part 26 | C-09, REQ-PRP |
| 18 | **Library** | Part 12 | C-10, REQ-LIB |
| 19 | **Symbols / Instances** | Part 11 | C-21, REQ-SYM |
| 20 | **Drawing / Shapes** | Part 05, 06 | C-13/14, REQ-DRW/SHP |
| 21 | **Color** | Part 23 | C-12, REQ-CLR |
| 22 | **Transform** | Part 04 | C-15, REQ-XFR |
| 23 | **Tweening** (motion/classic/shape + easing + path + graph editor) | Part 09, 10 | C-18, C-20, REQ-TWN |
| 24 | **Onion Skin / Frame-by-Frame** | Part 15 | C-19, REQ-FBF |
| 25 | **Camera** | Part 16 | C-27, REQ-CAM |
| 26 | **Audio** | Part 17 | C-28, REQ-AUD |
| 27 | **Import / Export / Publish** | Part 27, 28 | C-30, C-31, REQ-IMP/EXP |
| 28 | **Persistence** (save/autosave/recovery/migration) | Part 33, 36 | 13_persistence, REQ-DOC |

*(Additional deep systems folded in: Lip-Sync & Facial → documented under their owning tools/panels and referenced in Systems 19/26; Character/Bone-IK/Asset-Warp → System 13 + 19; Mobile/Touch → cross-cutting notes in every system + a dedicated section in System 1; Masks/Scenes/Align → System 16/6/22 respectively. Any system can be split further on request.)*

---

## 2. THE 25-SECTION FORENSIC TEMPLATE (applied verbatim to EVERY system)

```
# SYSTEM: <name>

## 1. Scope
## 2. Blueprint Evidence
## 3. Official Adobe Evidence
## 4. Additional Research
## 5. Complete Feature Tree
## 6. Every Button
## 7. Every Menu Item
## 8. Every Context Menu
## 9. Every Shortcut
## 10. Every Mouse Interaction
## 11. Every Keyboard Interaction
## 12. Modifier Keys
## 13. Every State
## 14. Selection Behavior
## 15. Commands
## 16. UI → Engine Connection
## 17. Undo / Redo
## 18. Persistence
## 19. Export / Import
## 20. Edge Cases
## 21. Dependencies
## 22. What It Unlocks
## 23. Blueprint vs Adobe Comparison
## 24. Missing / Ambiguous Behavior
## 25. Implementation Checklist
```

**Depth rule (from the correction):** every leaf must resolve to concrete behavior — not "Library → Rename" but:
`Library → asset row → double-click → editable name field → validation → Enter commits → Esc cancels → duplicate-name behavior → ID unchanged → instances update → undo restores → persistence → source`.

---

## 3. PROCESS (strict)

1. Receive the system name (user names it).
2. Read the relevant Blueprint sections (Phase 1 part + Phase 2 features + Phase 2.5 contract + Phase 3 REQ/MOD/CMD/STM + current `animator/` code if implemented).
3. Search official Adobe documentation for the corresponding feature set.
4. Compare Blueprint vs Adobe → tag `[BLUEPRINT]` / `[ADOBE FEATURE — NOT IN BLUEPRINT]` / `[BLUEPRINT OVERRIDE]`.
5. Produce the forensic spec (25 sections) → `FORENSIC_SPECS/SYS-<NN>_<name>.md`.
6. **STOP.** Wait for the next system name. Do NOT auto-continue.

## 4. OUTPUT CONVENTION

`FORENSIC_SPECS/SYS-01_application_workspace.md`, `SYS-02_file.md`, … (one file per system, matching the registry numbering).

## 5. STATUS

| # | System | Status |
|---|---|---|
| 1–28 | (all) | **QUEUED — awaiting system name** |
