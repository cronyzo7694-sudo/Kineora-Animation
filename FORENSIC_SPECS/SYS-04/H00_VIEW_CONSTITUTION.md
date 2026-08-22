# SYS-04 H00 — VIEW SYSTEM CONSTITUTION

## 0. Document Status

SPECIFICATION STATUS: **COMPLETE** (constitutional rules complete)  
IMPLEMENTATION STATUS: **PARTIAL** (evidence only — see H08; not authority)  
Revision: **SYS-04-H00** · Parent: **SYS-04 View**

> Authority: Blueprint > Phase 2 > Phase 2.5 > Phase 3 > approved decisions >
> SYS-01 > this constitution > later H-files > Adobe (comparison) > code (evidence).

---

## 1. Scope

H00 governs the constitution of SYS-04: terminology, ownership firewall,
persistence boundary, event contract, undo/dirty class, global invariants,
and the rules every later H-file MUST obey.

H00 does NOT detail individual commands (→ H01–H04), the menu map (→ H05),
the connection matrix (→ H06), QA (→ H07), or impl-evidence (→ H08).

---

## 2. Authority / Evidence Map

| Source | Establishes |
|---|---|
| Part 01 §1.2.3 / §1.4.1 / §1.4.3 / §1.4.4 / §1.17 | View inventory + viewport + preview + overlays + SnapEngine + wheel |
| Part 29 §29.9 + §29.2 | Dedicated shortcuts; Import owns Ctrl+R |
| Part 30 §30.1 | Stage context Grid/Guides/Rulers |
| Part 32 §32.1 | Renderer consumes view state |
| Part 33 | No view-transform / guides / grid fields in DOCUMENT |
| F-01-06 / F-01-17 / C-03 / C-05 | Feature inventory; `st.snap` |
| SYS-01 §17 / §18 / §27.1 / §31 | 4-class undo; 4-boundary persist; `snap:changed{mode}`; SYS-04 row |
| SYS-02 H00 INV-UNDO-3 / INV-DIRTY | View ops create **no** undo and **never** clear DIRTY |
| D-3 | Ctrl+K = palette |
| Code | `viewPrefs.ts`, `commands.ts` view.* — **evidence only** (FL-0017) |

---

## 3. Terminology

| Term | Definition | Source |
|---|---|---|
| View transform | Zoom / pan / rotate applied on top of document space; **never stored in the document** | §1.4.1 |
| Camera | Separate, **animatable**, document-stored screen transform | §1.4.1, Part 16, SYS-25 |
| Pasteboard / Work Area | Gray surround of the stage; authored but **not exported** | §1.4.1 |
| Preview mode | Authoring raster quality: Full / Fast / Anti-alias / Outline | §1.4.3 |
| Ruler | Edge scale in `settings.units`; drag creates a guide | §1.4.4 |
| Grid | Configurable cell overlay | §1.4.4 |
| Ruler-guide | Non-printing cyan/magenta line created from a ruler | §1.4.4 |
| Layer-guide | Layer **type** `guide` / `motionGuide` | Part 33 §33.3 — **SYS-16**, not this |
| SnapEngine | Pure function: candidate point → nearest snap point + hint line | §1.4.4 |
| Hide Edges | Suppress selection highlight while editing | §1.2.3, Part 29.3, W6 |
| Shape Hints visibility | Show/hide shape-tween hint markers | §1.2.3 |

---

## 4. Ownership Firewall (canonical)

Copied from `00_SCOPE` §2 — binding. One owner per concern. Go To is a
View-menu **entry** whose commandIds belong to SYS-09/SYS-15.

---

## 5. Persistence Constitution (binding)

SYS-01 §18 four boundaries, applied to View:

| State | Boundary | Persist? | Source |
|---|---|---|---|
| View transform (zoom/pan/rotate-view) | SESSION (or TEMPORARY “ruler zoom”) | **No** (never DOCUMENT — §1.4.1) | §1.4.1, SYS-01 §18 TEMPORARY |
| Preview mode, Hide Edges, Work Area on/off, rulers/grid **visibility**, snap **flags** | PREFERENCES (app prefs) | Yes, **not** project JSON (INV-PERS-3) | §1.1.4 workspace/prefs pattern; view = UI state |
| Ruler-guide **objects** (positions) | **AMB-S04-003** | DOCUMENT is **forbidden** (Part 33 has no field) | Part 33 negative + §1.4.4 “view overlays” |
| Ruler units | DOCUMENT (`settings.units`) | Yes — owned by SYS-02/06 | §1.7 |
| Camera | DOCUMENT | Yes — SYS-25 | §1.4.1 |

**INV-VIEW-PERS-1:** No SYS-04 field is written into the project JSON.  
**INV-VIEW-PERS-2:** Corrupt / missing prefs → defaults + continue (SYS-01 §18).  
**INV-VIEW-PERS-3:** Reloading a project must not restore zoom/pan/rotate-view.

---

## 6. Undo / Dirty Constitution (binding)

All SYS-04 operations are **WORKSPACE VIEW STATE** or **PREFERENCE STATE**
(SYS-01 §17). They:

- create **no** History entry (INV-UNDO-3)
- **never** set or clear DIRTY (INV-DIRTY — only DOCUMENT MUTATION dirties)
- emit **no** `document:changed`

Creating / moving a ruler-guide is still a view-overlay mutation under
AMB-S04-003 (not a document command) unless a future Leader decision moves
guides into DOCUMENT — which Part 33 currently forbids.

---

## 7. Event Constitution (binding — FL-0007 / FL-0030)

| Event | Producer | Payload | When | MUST NOT |
|---|---|---|---|---|
| `snap:changed` | SYS-04 | `{mode}` (SYS-01 §27.1, locked) | any snap-flag change | fire on zoom/grid-visibility-only |
| `document:changed` | — | — | **never** from SYS-04 | — |
| `activeDoc:changed` | SYS-02 | — | **never** as a view refresh hack | FL-0007 |

**No `view:changed` event is added.** It is not in SYS-01 §27.1. Inventing it
would be a cross-system change (INTEGRATION_LOG + Leader). Propagation path
for view prefs / viewport = **documented re-read** (subscribers / stage
controller) — FL-0006 allows a documented re-read trigger.

`st.snap` (SYS-01) **re-reads** snap flags after `snap:changed`.

---

## 8. Command Constitution (binding)

- commandIds: `system.action` (CROSS_SYSTEM_CONTRACT §L).
- One semantic action = one commandId (INV-CMD-4). Parameterize with a target
  (SYS-03 `edit.paste(center|place|special)` precedent) rather than exploding IDs.
- Every FUNCTIONAL View control has a commandId (INV-CMD-1).
- DEFERRED / UNAVAILABLE controls stay visible with an honest reason (SYS-01 §28).
  An empty show-toggle with no engine is a dead control — it must be DEFERRED
  until the overlay/engine exists (FL-0005).

Canonical commandIds owned by SYS-04 (locked here; detailed in H01–H04):

| commandId | Targets / notes |
|---|---|
| `view.zoomIn` | — |
| `view.zoomOut` | — |
| `view.zoom100` | — |
| `view.zoomFit` | — |
| `view.preview` | `full` \| `fast` \| `antialias` \| `outline` |
| `view.workArea` | toggle |
| `view.pasteboardColor` | **AMB-S04-005** (UI) |
| `view.rulers` | toggle |
| `view.grid` | toggle |
| `view.guides` | toggle visibility |
| `view.guides.lock` | lock/unlock existing guides |
| `view.hideEdges` | toggle |
| `view.shapeHints` | toggle visibility |
| `view.snap` | `objects` \| `grid` \| `guides` \| `pixels` \| `align` |

Go To is **not** in this table (`control.*` / SYS-09).

---

## 9. State Models

### 9.1 Viewport (SESSION)

`{ zoom, panX, panY, rotateView }` — applied on top of document space.
Independent per open document (switching docs must not leak another doc’s
viewport — FL-0013 sibling: document-bound view). SOURCE DOES NOT ESTABLISH
whether viewport is per-doc or global; **recommendation, NOT authoritative:**
per-document SESSION so tab switch restores that tab’s last viewport. If
unimplemented, reset-to-100% on switch is also legal (neither is specified).
Registered as a **non-blocking** note, not an AMB that blocks zoom itself.

### 9.2 View prefs (PREFERENCES)

Visibility + preview + snap flags. Schema lives in H02–H04. Defaults =
AMB-S04-001 / 006.

### 9.3 Snap (PREFERENCES flags + SESSION hint overlay)

Flags persist. Live hint lines are TEMPORARY (gesture-scoped).

---

## 10. Global Invariants

| ID | Rule | Source |
|---|---|---|
| INV-VIEW-1 | View transform is never written to DOCUMENT | §1.4.1 |
| INV-VIEW-2 | Camera ≠ view transform | §1.4.1 |
| INV-VIEW-3 | Pasteboard content is not exported | §1.4.1 |
| INV-VIEW-4 | Preview / Hide Edges / outlines do not change export | §1.4.2 overlays “never part of export”; §1.4.3 is authoring |
| INV-VIEW-5 | View ops are not Commands (no undo, no dirty) | INV-UNDO-3 |
| INV-VIEW-6 | Layer-outline (SYS-16) ≠ Preview Outline (SYS-04) | Part 20 vs §1.4.3 |
| INV-VIEW-7 | Ruler-guides ≠ layer type `guide` | Part 33 §33.3 vs §1.4.4 |
| INV-VIEW-8 | SnapEngine is the single snap path for move/transform/draw | §1.4.4 |
| INV-VIEW-9 | One commandId per semantic action; preview/snap are parameterized | INV-CMD-4 |
| INV-VIEW-10 | Ctrl+K is palette (D-3), never a View/Align shortcut | D-3 |

---

## 11. Error Constitution

| Failure | Feedback | State |
|---|---|---|
| Zoom at min/max | clamp; command stays FUNCTIONAL (idempotent at bound) | clamped |
| Fit with no stage host | UNAVAILABLE / toast “stage not attached” | unchanged |
| Snap with no SnapEngine yet | `view.snap` DEFERRED (honest), not a silent no-op | unchanged |
| Guide show-toggle with no guide objects + no create path | DEFERRED until H03 create exists (dead-toggle ban) | unchanged |
| Corrupt view prefs | defaults + continue | defaults |

No silent failure (INV-ERR-1).

---

## 12. Ambiguity Register (H00-level)

Exhaustive cross-file search performed (FL-0033): Part 01/29/30/32/33,
F-01-06/17, C-03, eng 11, SYS-01 §18/§27. Adobe help is comparison only.

| AMB | Question | Sources searched | Critical? | Status |
|---|---|---|---|---|
| AMB-S04-001 | Default grid cell size | §1.4.4 “configurable”; no number anywhere | default only | **OPEN** |
| AMB-S04-002 | Zoom In / Out / wheel factor | §1.2.3 / §1.17 / Part 29 name the commands, not the step | **YES** for zoom-in/out | **OPEN** |
| AMB-S04-003 | Where ruler-guide positions persist | Part 33 = no field; §1.4.4 = “view overlays”; Adobe FLA persist = not authority | survive-reload | **OPEN** — DOCUMENT **forbidden** until Part 33 gains a field |
| AMB-S04-004 | Snap distance / tolerance | SnapEngine described; no px | SnapEngine numeric | **OPEN** |
| AMB-S04-005 | Pasteboard color UI + default hex | §1.2.3 “Pasteboard color”; §1.4.1 “gray surround”; no hex, no picker spec | color control | **OPEN** |
| AMB-S04-006 | Default ON/OFF: rulers, grid, guides, work area | Show/hide specified; initial value not | initial prefs | **OPEN** (non-blocking for the toggle itself) |

**Rulers shortcut contradiction — RESOLVED (not an AMB):**

- §1.2.3 summary lists Rulers as Ctrl+R.
- Part 29.2 locks **Import to Stage = Ctrl+R**.
- Part 29.9 locks **Show/Hide Rulers = Ctrl+Shift+Alt+R**.

Dedicated shortcut part + File-menu ownership of Ctrl+R win (FL-0033).
**Binding:** rulers = `Ctrl+Shift+Alt+R`. §1.2.3 cell is a summary error.

**Magnification list — RESOLVED (not an AMB):**

§1.2.3 groups “Magnification” with Zoom In/Out / Fit / 100%. Part 29.9 lists
exactly those four. No preset list (25/50/200…) exists in the corpus.
`[ADOBE FEATURE — NOT IN BLUEPRINT]` if a percentage menu is later proposed.
**Binding:** Magnification = `view.zoomIn` / `view.zoomOut` / `view.zoom100` /
`view.zoomFit` only.

Recommendations below are **NOT AUTHORITATIVE** (FL-0028):

| AMB | Recommendation (NOT authoritative) |
|---|---|
| 001 | 20 document units (conventional; matches current code *evidence*, not a decision) |
| 002 | ×2 / ÷2 per command (common viewport; still a guess) |
| 003 | SESSION (lost on app restart); never DOCUMENT |
| 004 | 6 px document-space (unspecified) |
| 005 | default `#3a3a3a` gray; color input in View menu — unspecified |
| 006 | rulers/grid/guides OFF; workArea ON (hide is the exceptional action) |

---

## 13. H00 Completion Checklist

- [x] Terminology
- [x] Ownership firewall
- [x] Persistence 4-boundary applied
- [x] Undo/dirty class
- [x] Events (no invented `view:changed`)
- [x] CommandId list
- [x] Invariants INV-VIEW-1..10
- [x] Errors
- [x] AMBs registered, not silently resolved (FL-0023)

**SPECIFICATION STATUS: COMPLETE · READY FOR H01–H08 drafting**  
**Implementation-critical AMBs remaining: 002, 003, 004, 005** (001/006 affect defaults only).

---

*SYS-04 H00 done. Next: H01 (viewport).*
