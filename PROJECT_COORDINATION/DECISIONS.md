# KINEORA — DECISION REGISTER (centralized)

> Every unresolved product/architecture question gets an ID. PENDING HUMAN → APPROVED (with the human's exact decision) → then all downstream specs MUST use it.
> Never convert a recommendation into an approved decision silently (FL-0022/0028).

---

## Already-APPROVED decisions (do NOT reopen without instruction)

| ID | Decision | Source |
|---|---|---|
| D-1 | panel-drag blur = cancel (revert) | SYS-01 §0 |
| D-3 | Ctrl+K = palette (Align loses dedicated key) | SYS-01 §0 |
| D-5 | Essentials default px layout | SYS-01 §0 |
| D-6 | Ctrl+Enter context-scoped (exit-root vs Test) | SYS-01 §0 |
| D-7 | per-tab × close included | SYS-01 §0 |
| D-9 | panel drag threshold 3px/12px | SYS-01 §0 |
| D-10 | locked event names | SYS-01 §0 |
| D-AMB-001 | duplicate-open: activate existing, no reload, no dup ID | SYS-02 H02 §3.2 |
| D-AMB-003 | focus after activation → activated tab | SYS-02 H02 §3.2 |
| D-AMB-004 | `openSet:changed` event + ordering | SYS-02 H02 §3.2 |
| P-1 | Save = overwrite, no confirm | SYS-02 §24 |
| P-2 | stage w/h ≥ 2, no upper bound | SYS-02 §24 |
| P-4 | unbounded recent list | SYS-02 §24 |
| P-5 | Close-All = per-doc sequential guard | SYS-02 §24 |
| P-6 | clean save = idempotent "Saved hh:mm" | SYS-02 §24 |
| P-8 | platform default = HTML5 Canvas | SYS-02 §24 |

---

## PENDING HUMAN — product decisions (block READY)

### D-0001 — AMB-H01-002: duplicate template name

- **Question:** When Save-as-Template uses a name that already exists, what happens — overwrite, rename, or block?
- **Evidence:** Blueprint silent (no template-name-uniqueness rule).
- **Affected systems:** SYS-02 H01 (Save-as-Template).
- **Options:** (a) overwrite silently · (b) overwrite with confirm · (c) auto-rename · (d) block + error.
- **Recommendation (NOT authoritative):** (d) block + error (data-loss-safe, consistent with P-1's "no confirm" only for Save, not for template overwrite).
- **Status:** PENDING HUMAN.

### D-0002 — AMB-H01-003: New-from-Template seeded-doc identity

- **Question:** Is the seeded document UNTITLED or auto-titled?
- **Evidence:** Blueprint "New doc from a template" silent on identity.
- **Affected systems:** SYS-02 H01/H05.
- **Options:** (a) UNTITLED (no path, like New) · (b) auto-titled from template name.
- **Recommendation (NOT authoritative):** (a) UNTITLED — consistent with `file.new()`; title set later via SYS-06/17.
- **Status:** PENDING HUMAN.

### D-0003 — AMB-H07-001: next-active after closing the active doc

- **Question:** Which surviving document becomes active after closing the active one?
- **Evidence:** Blueprint gives no "next tab" rule (searched all sources).
- **Affected systems:** SYS-02 H07 (and H02 ST4 cross-ref).
- **Options:** (a) nearest tab in open-set order (right, else left) · (b) most-recently-active · (c) first tab.
- **Recommendation (NOT authoritative):** (a) nearest tab in open-set order.
- **Status:** PENDING HUMAN.

### D-0004 — AMB-S03-003: Paste Special format option list

- **Question:** What are the format options in the Paste Special dialog?
- **Evidence:** Blueprint "options (format)" — no list anywhere in the corpus; Kineora clipboard is JSON-only (no external format).
- **Affected systems:** SYS-03 H02.
- **Options:** (a) {Drawing object, Raw shape} (Part 06 vector representations) · (b) EXCLUDE Paste Special as an Adobe cross-app remnant.
- **Recommendation (NOT authoritative):** (b) EXCLUDE — its "format conversion" is vacuous in a JSON-only clipboard; keeping it would be an invented feature.
- **Status:** PENDING HUMAN.

### D-0005 — AMB-003: recent-file list persistence store + API

- **Question:** Where/how is the recent-files list stored and what is its API?
- **Evidence:** Blueprint "Open Recent" only; H00 §23 defers to H10.
- **Affected systems:** SYS-02 H06/H10 (Open Recent), SYS-01 (prefs boundary).
- **Options:** (a) app-prefs JSON (SYS-01 PREFERENCES boundary) · (b) separate store.
- **Recommendation (NOT authoritative):** (a) app-prefs JSON, owned by SYS-02, stored via SYS-01 prefs infrastructure.
- **Status:** PENDING (deferred to H10 integration — non-blocking for the H00–H14 spec).

### D-0006 — AMB-002: duplicate-Document-ID collision recovery

- **Question:** If a load would produce a Document ID already in the open-set, what is the recovery behavior?
- **Evidence:** No-duplicate-ID invariant settled (D-AMB-001); recovery behavior source-silent.
- **Affected systems:** SYS-02 H10, SYS-28.
- **Options:** (a) refuse + toast · (b) re-target (assign fresh ID) · (c) activate existing.
- **Recommendation (NOT authoritative):** (a) refuse + toast (safe; no identity forgery).
- **Status:** PENDING (deferred to H10).

### D-0008 — AMB-H05-002: duplicate-title disambiguation

- **Question:** Two documents with identical visible titles (e.g. `/folderA/project.json` and `/folderB/project.json`, both displaying "project") — how does the user distinguish them when the tab shows title only?
- **Evidence:** REQ-SYS-004 ("names display-only") + H00 §5 ("two documents may share a title") permit identical titles; neither addresses disambiguation.
- **Affected systems:** SYS-02 H02 (tab) / H05 (title).
- **Options:** (a) tab tooltip shows full path · (b) auto-append `(2)`/`(3)` · (c) show parent-folder on collision · (d) accept ambiguity.
- **Recommendation (NOT authoritative):** (a) tooltip shows full path.
- **Status:** PENDING HUMAN.

### D-0007 — AMB-004: native desktop (Tauri) accelerator wiring

- **Question:** Exact Tauri accelerator/menu wiring for desktop shortcuts.
- **Evidence:** ENG-001 hybrid runtime; Blueprint silent on exact Tauri wiring.
- **Affected systems:** SYS-02 H10/H11, SYS-08 (shortcuts).
- **Status:** PENDING (deferred to H10/H11 platform integration).

---

### D-0009 — Blueprint-internal 'O' conflict: Oval tool vs Onion-skin toggle

- **Question:** Blueprint Part 29 binds `O` twice — tools section "Oval | O"
  (also Part 34: the Oval button's key is O) and view section "Onion skin
  toggle | O" (also its timeline row). The command registry forbids duplicate
  keys (validator), so one binding must move. Which?
- **Evidence:** Blueprint §1.3.1 — a tool is "the heart of editing"; tool
  activation keys are per-tool contracts. Onion Skin is a view toggle that
  additionally has a View-menu row (Part 01 §1.2.3) and a Timeline button
  (Part 34); losing its bare key costs less than a tool losing its activation
  key. Onion's modifier chain stays intact: toggle moved, Outlines keeps
  Shift+O, Edit Multiple Frames keeps Alt+O.
- **Affected systems:** tools (T2B.5 Oval, AI-T) · timeline onion (AI-B,
  `view.onion` in commands.ts + TimelineStrip tooltip).
- **Options:** (a) Oval=O, onion toggle → Ctrl+Alt+O · (b) onion=O, Oval gets
  no activation key · (c) onion toggle → Shift+O with outlines → unbound
  (breaks the documented outlines chain).
- **Recommendation (NOT authoritative):** (a) — SHIPPED provisionally in the
  Oval batch so the registry validates; flip if ruled otherwise (2-line change).
- **Status:** PENDING HUMAN.

---

## Non-blocking recommendations (do NOT treat as decisions)

| ID | Topic | Recommendation |
|---|---|---|
| AMB-H05-001 | title derived from filename on first save | derive title = filename (display-only) |
| AMB-H03-001 | future tab-context-menu items | none beyond "Close" |
| AMB-H03-002 | keyboard gesture to open context menu | Context-menu key / Shift+F10 |
| AMB-S03-002 | Duplicate offset | +10px x/y (ALREADY resolved as design decision) |

---

*When the human decides any PENDING item: flip Status → APPROVED, record the exact decision verbatim, and update every downstream spec + the board in the SAME pass (FL-0034).*
