# SYS-02 H01 — NEW DOCUMENT + DIALOG + TEMPLATES

> **Parent:** SYS-02 File System · **Constitution:** H00 (all INV-* rules binding).
> **Authority order:** Blueprint > Phase 2 > Phase 2.5 > Phase 3 > approved decisions > Adobe > code.
> **Status:** FORENSIC FOUNDATION — NOT IMPLEMENTED.
> **Revision note:** v2 — removed `dlg-new.title` (scope expansion; title/description/author are Document-Properties fields, SYS-06/SYS-17, NOT New-dialog fields); split `dlg-template.*` into two namespaces (`tpl-new.*` gallery vs `dlg-save-template.*` dialog); reconciled fps empty/clamp behavior; fully specified gallery buttons; added createdAt/modifiedAt ownership.

---

## 1. Scope

H01 specifies **New Document** (the New dialog: fields, defaults, validation, Create/Cancel), **New from Template** (template gallery → seed), and **Save as Template** (template creation) — the full template mechanism.

**H01 owns:**
- The New Document dialog — every field, default, validation rule, commit/cancel behavior, state, error, accessibility, contrast.
- `file.new()` / `document.create(settings)` command contract.
- New-from-Template gallery + `file.newFromTemplate(templateId)`.
- Save-as-Template dialog + `file.saveAsTemplate(name)` (template mechanism; storage location = P-7 deployment detail).

**H01 does NOT own:**
- The engine that creates a `Document`/`Session` internally (MOD-DOC mechanics — handoff only).
- Multi-document tabs / active-doc switching (H02).
- Dirty tracking (H04) — except H01's rule that a NEW document starts CLEAN.
- Save/Save-As file writing (H05).
- Import/Export/Publish engines (H08, SYS-27).
- **Title/description/author** (Document Properties — SYS-06/SYS-17, set AFTER creation, not at New time).
- Exact pixel/color values (H11 — references SYS-01 tokens only).

**Constitutional rules H01 MUST obey (H00):** INV-VIS-1 (contrast, no white-on-white), INV-ERR-1 (no silent failure), INV-CMD-1/4 (real commandId, no drift), Lifecycle T1 (New → ACTIVE(UNTITLED, CLEAN)), §7 (New does NOT create DIRTY).

---

## 2. Blueprint Evidence

| Source | Section | Establishes |
|---|---|---|
| Part 01 §1.2.1 | New… row | "Create document (choose **platform/type, size, fps, color** — see 1.7)"; Ctrl+N; `Document.create(settings)`; New-from-Template = "preset JSON"; Save-as-Template |
| Part 01 §1.7 | Document settings | Width/Height (px) · Ruler units (px/in/cm/mm) · fps (24/25/30/60; **defines frame grid**) · Background (#FFFFFF) · Platform (HTML5 Canvas / WebGL glTF / AS3 legacy / AIR legacy) · Advanced (auto-save, stroke/fill defaults) |
| Part 26 §26.1 | Document properties | Title/description/author = **Info section of the Properties panel (nothing selected)** — set AFTER creation, NOT a New-dialog field |
| Part 33 §33.1 | Project schema | `meta{title, author, createdAt, modifiedAt}` · `settings{width,height,units,fps,backgroundColor,backgroundAlpha}` |
| engineering 03 | ENT-project | settings default `1920×1080, px, 24, #fff, 1`; constraint `w/h ≥ 2`; `fps 1–120`; lifecycle `created → edited → saved → archived` |
| REQ-DOC-001 | — | Document = scenes + shared library + settings |
| REQ-SYS-004 | — | stable IDs; names display-only |
| SYS-02 §24 | P-2/P-7/P-8 | P-2: min w/h≥2, **no upper bound** · P-7: template store = deployment detail · P-8: platform default = HTML5 Canvas |

**Explicit scope note:** the New dialog fields are **platform, width, height, fps, background (+alpha)** — matching "platform/type, size, fps, color" (§1.2.1). **Ruler units** is added from §1.7 (a document setting the New dialog initializes). **Title/description/author are NOT New-dialog fields** — they are Document-Properties (Properties panel) fields owned by SYS-06/SYS-17, editable after creation.

---

## 3. Official Adobe Evidence

Source: **helpx.adobe.com/animate/using/documents.html** `[OFFICIAL]`.

| Adobe behavior | In Blueprint? | Classification |
|---|---|---|
| New Document dialog with **intent tabs** (Character Animation, Social, Game, Education, Ads, Web, Advanced) → preset gallery → Create | No | `[BLUEPRINT OVERRIDE]` — Blueprint's simpler dialog wins; presets map to Kineora templates |
| Document Settings: stage **1×1–2880×2880 px**, fps, background, Auto-Save (CS5.5) | W/H/fps/bg yes; bounds no | bounds = `[ADOBE FEATURE — NOT IN BLUEPRINT]` (P-2: no upper bound) |
| Save As Template: Name + Category + Description (≤255) | "Save as Template" yes; category/desc = Adobe detail | `[BLUEPRINT]` (name required; category/description = `[OFFICIAL]` optional detail, NOT a hard Kineora field) |
| New from Template: Category list → items → OK | "preset JSON" | `[BLUEPRINT]` |

---

## 4. Feature Tree

```
NEW DOCUMENT + TEMPLATES
├── New Document (Ctrl+N)
│   ├── New Document dialog (custom modal, SYS-02)
│   │   ├── dlg-new.platform         (dropdown: HTML5 Canvas / WebGL / Video-only / Kineora types)
│   │   ├── dlg-new.width            (numeric px, default 1920)
│   │   ├── dlg-new.height           (numeric px, default 1080)
│   │   ├── dlg-new.units            (dropdown: px / in / cm / mm, default px)  [from §1.7]
│   │   ├── dlg-new.fps              (numeric, default 24, clamp 1–120)
│   │   ├── dlg-new.background       (color chip + alpha, default #ffffff α=1)
│   │   ├── dlg-new.create           (primary → document.create(settings))
│   │   └── dlg-new.cancel           (secondary → close, no change)
│   └── Result: ACTIVE(UNTITLED, CLEAN) + `openSet:changed{added}` → `activeDoc:changed`; title/author set LATER via SYS-06/SYS-17
├── New from Template
│   ├── Template gallery (preset JSON list)
│   │   ├── tpl-new.list             (template rows: title/type/W/H/fps preview)
│   │   ├── tpl-new.open             (primary → file.newFromTemplate(templateId))
│   │   └── tpl-new.cancel           (secondary → close, no change)
│   └── Result: ACTIVE([AMB-H01-003 identity], CLEAN) seeded from preset + `openSet:changed{added}` → `activeDoc:changed`
└── Save as Template
    ├── Save-as-Template dialog (custom)
    │   ├── dlg-save-template.name        (required text)
    │   ├── dlg-save-template.confirm     (serialize preset JSON → persist [P-7])
    │   └── dlg-save-template.cancel
    └── Result: template record (non-document, no dirty, no undo)
```

---

## 5. Every Control (full connection contract)

> Field set per H00 §11. Contrast/accessibility per INV-VIS-1/INV-VIS-4 (§9).

### 5.1 file.new (menu control)

- **ID** `file.new` · label "New…" · location File ▸ New · owner SYS-02 (MOD-DOC).
- states FUNCTIONAL · visibility ALWAYS · enabled: always (no doc needed).
- tooltip "Create a new document (Ctrl+N)" · shortcut Ctrl/Cmd+N.
- mouse click → open New-Document dialog · touch tap.
- commandId `file.new()` → on dialog Create: `document.create(settings)`.
- mutation: new ENT-project + Session · **dirty impact: none (starts CLEAN)**.
- event `openSet:changed{added}` → `activeDoc:changed{docId}` (deterministic order per D-AMB-004) · consumers: tabs (SYS-01), all document-bound UI (H00 §9) incl. Library (rebind to new empty library).
- UI: new doc active, empty stage, title shows "Untitled" (title is set later via SYS-06/SYS-17).
- undo: LIFECYCLE (no) · persist: none until saved · error: invalid settings → inline, no doc created.
- reload: n/a · testId `T-file-new`, `T-dlg-new-*`.

### 5.2 New-Document dialog fields (custom dialog, SYS-02)

| ID | Label | Type | Default | Validation | Empty | Invalid/out-of-range |
|---|---|---|---|---|---|---|
| dlg-new.platform | Platform | dropdown | HTML5 Canvas (P-8) | listed type | (n/a — default) | (n/a — constrained) |
| dlg-new.width | Width | numeric (px) | 1920 | ≥ 2 (no upper bound, P-2) | → invalid | inline error + revert; Create disabled |
| dlg-new.height | Height | numeric (px) | 1080 | ≥ 2 (no upper bound) | → invalid | inline error + revert; Create disabled |
| dlg-new.units | Ruler units | dropdown | px | px/in/cm/mm | (n/a — default) | (n/a) |
| dlg-new.fps | Frame rate | numeric | 24 | 1–120 | → invalid (Create disabled) | out-of-range **clamps** (e.g. 999→120, 0→1) |
| dlg-new.background | Background | color chip + alpha | #ffffff α=1 | hex + alpha 0–1 | (n/a — default) | inline error |

**fps rule (reconciled):** empty = invalid (Create disabled); a typed out-of-range value **clamps** to 1–120 on commit (matching eng 03 "fps 1–120"). Empty ≠ out-of-range — two distinct outcomes, no contradiction.

**Dialog behavior contract:**
- **Initial focus** = dlg-new.platform (first field).
- **Enter** = Create (primary, when valid).
- **Esc** = Cancel (close, no change).
- **Tab / Shift+Tab** = field navigation (focus ring).
- **Create disabled** when any numeric field is empty or invalid (width/height/fps).
- **State mutation only on Create** with valid settings (no partial mutation).
- **Cancel / Esc / outside-click** → no state change (H00 INV-ERR-2).

### 5.3 New-from-Template (file.newTemplate)

- **ID** `file.newTemplate` · File ▸ New from Template · FUNCTIONAL · ALWAYS.
- commandId `file.newFromTemplate(templateId)`.
- Gallery controls:
  - **tpl-new.list** — template rows (title, type, W/H, fps preview). Selection = highlight (no mutation).
  - **tpl-new.open** — primary button; **enabled: a template is selected**; disabled otherwise (tooltip "select a template"); click → `file.newFromTemplate(selectedId)` → seed → `openSet:changed{added}` → `activeDoc:changed`.
  - **tpl-new.cancel** — secondary; click/Esc → close, no change.
- Missing/invalid template → toast (INV-ERR-1); no doc created.
- Seeded doc = ACTIVE([AMB-H01-003 identity], CLEAN) with preset settings/content. **Identity: UNRESOLVED (UNTITLED vs auto-titled) — AMB-H01-003. RECOMMENDATION — NOT AUTHORITATIVE: UNTITLED (no path).**
- undo: LIFECYCLE (no). persist: none. testId `T-file-new-template`, `T-tpl-new-*`.

### 5.4 Save-as-Template (file.saveAsTemplate)

- **ID** `file.saveAsTemplate` · File ▸ Save as Template · FUNCTIONAL · CONTEXTUAL (doc open).
- commandId `file.saveAsTemplate(name)`.
- Dialog controls:
  - **dlg-save-template.name** — required text; empty → inline error + Confirm disabled.
  - **dlg-save-template.confirm** — serialize current document as preset JSON → persist (location = P-7). Enabled only when name non-empty.
  - **dlg-save-template.cancel** — close, no change.
- Duplicate name → `[UNRESOLVED]` AMB-H01-002.
- **Non-document write** (no dirty, no undo entry — H00 §13).
- testId `T-file-save-template`, `T-dlg-save-template-*`.

---

## 6. Every State (dialog + lifecycle)

| State | Entry | Exit | UI | Error |
|---|---|---|---|---|
| Dialog closed | idle | open | — | — |
| New dialog open (valid) | open New | Create / Cancel / Esc | fields + enabled Create | — |
| New dialog open (invalid) | numeric empty/invalid | fix / Cancel | inline error + disabled Create | inline |
| Creating | Create valid | success → ACTIVE / fail | spinner | invalid → revert |
| New-doc ACTIVE(UNTITLED, CLEAN) | create success | edit (→DIRTY) | empty stage, "Untitled" title | — |
| Template gallery open | New-from-Template | open (with selection) / cancel | list + preview + open(disabled until select) | missing → toast |
| Template saved | Save-as-Template confirm | — | toast "template saved" | storage fail → toast |

**Lifecycle reference (H00 §6 T1):** `NO_DOCUMENT + New(settings) → ACTIVE(UNTITLED, CLEAN)`, side effects = new ENT-project + Session (with `createdAt` set), events `openSet:changed{added}` → `activeDoc:changed{docId}` (order per D-AMB-004).

---

## 7. Commands (canonical)

| UI action | commandId | Module | Input | Preconditions | Mutation | Dirty | Undo | Persist | Error | Ownership |
|---|---|---|---|---|---|---|---|---|---|---|
| New | file.new() → document.create(settings) | MOD-DOC | settings{platform,width,height,units,fps,background,backgroundAlpha} | none | new ENT-project + Session; **createdAt set** | none (CLEAN) | LIFECYCLE (no) | none till save | invalid→inline | SYS-02 |
| New from Template | file.newFromTemplate(templateId) | MOD-DOC | templateId | template exists | new doc seeded from preset | none (CLEAN) | no | none | missing→toast | SYS-02 |
| Save as Template | file.saveAsTemplate(name) | MOD-DOC | name | doc open | template record (preset JSON) | none | no (non-document) | [P-7] | empty→inline; storage→toast | SYS-02 |

**meta ownership:** `createdAt` = set by New/New-from-Template (H01). `modifiedAt` = updated by Save (H05). `title`/`author` = set by SYS-06/SYS-17 (Document Properties) after creation — NOT H01.

**Command-ID consistency (INV-CMD-4):** `file.new`, `file.newFromTemplate`, `file.saveAsTemplate` — identical in menu (§5), command table (§7), shortcut (Ctrl+N → H09), palette, test IDs. No drift.

---

## 8. Validation + Defaults (authoritative)

| Field | Default | Min | Max | Source |
|---|---|---|---|---|
| platform | HTML5 Canvas | — | — | P-8, Part 26 §26.1 |
| width | 1920 | 2 | none (P-2) | eng 03 |
| height | 1080 | 2 | none (P-2) | eng 03 |
| units | px | — | — | eng 03, Part 01 §1.7 |
| fps | 24 | 1 | 120 | eng 03 |
| background | #ffffff | — | — | eng 03 |
| backgroundAlpha | 1 | 0 | 1 | Part 33 §33.1 |

*(No `title` field — see §2 scope note.)*

---

## 9. Edge Cases + Error + Accessibility

**Edge cases:**
| Case | Behavior | testId |
|---|---|---|
| Cancel / Esc / outside-click | no document created, no state change | T-dlg-new-cancel |
| Invalid width (e.g. 1, -5, empty) | inline error + revert, Create disabled | T-dlg-new-invalid |
| fps out of range (999 → clamp 120) | clamps on commit | T-dlg-new-fps-clamp |
| fps empty | invalid, Create disabled | T-dlg-new-fps-empty |
| Missing template (New-from-Template) | toast | T-tpl-new-missing |
| No template selected + Open | Open disabled (tooltip reason) | T-tpl-new-open-disabled |
| Duplicate template name | `[UNRESOLVED]` AMB-H01-002 | — |
| Template storage failure | toast, no state change | T-dlg-save-template-fail |
| New while another doc open | new doc becomes active (H02); prior doc remains | T-file-new-while-open |
| New-from-Template seeded doc identity | `[UNRESOLVED]` AMB-H01-003 | — |

**Error handling (H00 §16):** every failure → feedback + no unintended mutation + no corrupt undo + recoverable. Invalid numeric → inline + revert (not a modal). Create/Open on invalid → disabled (not a silent no-op).

**Accessibility (H00 §17):**
- Every field: aria-label, role, focus ring, Enter/Space activation.
- Contrast in EVERY state (INV-VIS-1): normal, focus, disabled, error — via SYS-01 tokens (surface/text/border/danger/focus-ring). **Never white-on-white.**
- Numeric fields announce range (min 2 / 1–120).
- Dialog: focus trap, Esc=cancel, initial focus = platform.

---

## 10. Undo / Persistence / Dirty

| Action | Undo | Persistence | Dirty |
|---|---|---|---|
| New | no (lifecycle) | none until save | starts CLEAN |
| New from Template | no | none until save | starts CLEAN |
| Save as Template | no (non-document write) | [P-7] | none |

Per H00 §7: creating a new document does **NOT** create DIRTY. Per H00 §13: template write is NON-DOCUMENT.

---

## 11. Dependency Map

- **Relies on H00:** identity (§5), lifecycle T1 (§6), visual constitution (§17), error constitution (§16), command constitution (§11).
- **Consumes:** SYS-01 modal manager (dialog chrome, focus trap, Esc), SYS-01 design tokens.
- **Provides to later parts:** H02 (multi-doc — New creates a doc in tab/active model), H04 (dirty — New starts CLEAN), H05 (Save — createdAt already set, modifiedAt on save), H09 (menu/shortcut Ctrl+N), H13 (test IDs).
- **Does NOT own:** MOD-DOC internals, template store location (P-7), title/author (SYS-06/SYS-17).

---

## 12. Ambiguity Register

| AMB-ID | Question | Sources | Why matters | Owner | Resolution required before impl? |
|---|---|---|---|---|---|
| AMB-H01-001 | fps empty-value behavior | eng 03 clamp 1–120, no empty rule | commit correctness | H01/H11 | **RESOLVED (v2):** empty = invalid (Create disabled); out-of-range = clamp. |
| AMB-H01-002 | duplicate template name (overwrite vs rename vs block) | Blueprint silent | template library integrity | H01/H10 | **YES — before Save-as-Template ships** |
| AMB-H01-003 | New-from-Template seeded doc identity (UNTITLED vs auto-titled) | Blueprint "New doc from a template" silent | identity/dirty of seeded doc | H01/H05 | **YES — before New-from-Template ships** |

*(Inherited AMB-001/002/003/004 from H00 §23 apply where relevant but are owned by H02/H05/H06/H10.)*

---

## 13. Completion Checklist

- [x] Blueprint §1.2.1/§1.7/§26.1/§33.1 + eng 03 reviewed
- [x] Adobe documents.html New-dialog/template evidence verified
- [x] Every control defined with full field set (file.new, 6 dialog fields, create/cancel, newTemplate + gallery, saveAsTemplate + dialog)
- [x] Every field: default + validation + invalid + empty (AMB-H01-001 resolved; AMB-H01-002/003 registered)
- [x] **No scope expansion** — title/description/author correctly excluded (owned by SYS-06/SYS-17)
- [x] Lifecycle T1 + dirty (starts CLEAN) + undo (lifecycle/non-document) defined
- [x] Command registry (3 commandIds, no drift)
- [x] Edge cases + error + accessibility + contrast (INV-VIS-1)
- [x] meta ownership (createdAt = H01; modifiedAt = H05; title/author = SYS-06/SYS-17)
- [x] Ambiguities registered (AMB-H01-002/003; AMB-H01-001 resolved)
- [x] Dependencies (H00, SYS-01 modal/tokens) defined
- [x] Test IDs (T-file-new, T-dlg-new-*, T-file-new-template, T-tpl-new-*, T-dlg-save-template-*)

---

## FINAL H01 REPORT (v2)

**SOURCE COVERAGE:** Blueprint §1.2.1/§1.7/§26.1/§33.1 · Phase 3 eng 03 · SYS-02 §24 P-2/P-7/P-8 · Adobe documents.html · H00 constitution.

**CHANGES MADE (audit pass):**
- [F1] Removed `dlg-new.title` — scope expansion (Part 26.1 Info = Properties-panel field, not New dialog; Blueprint §1.2.1 New = "platform/type, size, fps, color"; prior SYS-02_file.md also had no title). Title/description/author = SYS-06/SYS-17, set after creation.
- [F2] Split `dlg-template.*` → `tpl-new.*` (gallery) + `dlg-save-template.*` (Save-as-Template dialog) — removed ID namespace collision (dlg-template.cancel appeared in two dialogs).
- [F3] Reconciled fps: empty = invalid (Create disabled); out-of-range = clamp (two distinct outcomes; removed §5.2/§9 contradiction). AMB-H01-001 → RESOLVED.
- [F4] Fully specified gallery controls (tpl-new.list/open/cancel with states + disabled reason).
- [F5] Added meta ownership: createdAt = H01 (New), modifiedAt = H05 (Save), title/author = SYS-06/SYS-17.

**CONTROLS:** 17 (file.new + 6 dialog fields + create + cancel + file.newTemplate + tpl-new.list/open/cancel + file.saveAsTemplate + dlg-save-template.name/confirm/cancel).

**COMMANDS:** 3 (`file.new`, `file.newFromTemplate`, `file.saveAsTemplate`).

**AMBIGUITIES:** 2 remaining (AMB-H01-002 duplicate-template-name; AMB-H01-003 seeded-doc-identity). AMB-H01-001 resolved.

**DEAD-CONTROL CHECK:** every control has a commandId or explicit non-mutating behavior; gallery Open has a disabled-state + reason (not dead); no stub. H00 INV-CMD-1/4, INV-ERR-1, INV-VIS-1 all satisfied.

**CRITICAL RISKS:** 2 — duplicate-template-name and seeded-doc-identity both gate shipping (owned by H01, resolution required before implementation).

**STATUS:** H01 REVISION REQUIRED — 2 implementation-critical ambiguities remain (AMB-H01-002, AMB-H01-003); they are correctly registered, not guessed.

---

*STOP — H02 not started; SYS-03 not started; no code written. Awaiting review/decision on AMB-H01-002/003.*
