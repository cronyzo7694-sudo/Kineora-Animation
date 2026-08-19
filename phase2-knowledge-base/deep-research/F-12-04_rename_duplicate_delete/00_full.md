# F-12-04 — RENAME / DUPLICATE / DELETE · F-12-05 — FOLDERS & ORGANIZE
```
SOURCE BLUEPRINT: Part 12 §12.2.3–12.2.6 · DEEP FEATURES: F-12-04, F-12-05 · STATUS: AUDITED
DEPENDS ON: F-12-01
```
## F-12-04 RENAME / DUPLICATE / DELETE
1. Official names: Rename / Duplicate / Delete (Library). 4. Purpose: manage asset definitions. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `symbols.html`: duplicate a symbol (Library menu → Duplicate); swap symbol / duplicate symbol for instances. E2 [OFFICIAL] Part 12 blueprint: delete prompts if used; "Select Unused Items" (menu) for hygiene. E3 [OUR DESIGN DECISION] ID-based refs = rename-safe (Part 33 convention).
SEMANTICS
| Op | Effect |
|---|---|
| Rename | display name changes; instances keep referencing by ID (E3) |
| Duplicate | deep-copy definition (new ID/name); instances keep pointing at original |
| Delete | removes definition; if used → prompt (cancel / delete + break instances / delete + instances) |
| Select Unused Items | highlights unused (E2) |
LIMITATIONS: L.1 Animate rename may break linkage (legacy AS3 linkage IDs) → ours: ID refs, never breaks.
EDGE: M.1 delete a symbol in use (prompt) · M.2 duplicate then swap (F-11-10) · M.3 rename mid-edit.
TESTS: TS-01 rename → instances intact (E3) · TS-02 duplicate = new ID · TS-03 delete unused · TS-04 delete used → prompt · TS-05 select-unused · TS-06 undo delete.

## F-12-05 FOLDERS & ORGANIZE
1. Official name: (Library folders). 4. Purpose: group assets; nest folders. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `symbols.html`: New Folder; drag assets between folders. E2 [OUR DESIGN DECISION] auto-arrange by kind (P2).
SEMANTICS: folders = organizational only (no coordinate space, unlike layer folders); drag to move; collapse/expand.
EDGE: M.1 delete folder with assets (move up, ours) · M.2 drag a symbol into its own instance's folder (no-op).
TESTS: TS-01 create folder · TS-02 drag asset in/out · TS-03 nest folders · TS-04 delete folder keeps assets (ours) · TS-05 sort by kind.
## AUDITS (both)
No contradiction. Self-challenge: overlooked = rename-safety (ID refs) + delete-in-use prompt + folder-is-organizational-only — covered.
```
FEATURE COMPLETE: F-12-04/05 — Rename/Duplicate/Delete & folders — AUDITED
```
