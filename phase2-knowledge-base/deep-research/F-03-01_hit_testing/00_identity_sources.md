# F-03-01 — SELECTION TOOL: HIT TESTING

```
SOURCE BLUEPRINT:  Part 03 — Selection System  (animate-blueprint/03_selection_system.md §3.2)
DEEP FEATURE:      Selection Tool — Hit Testing
QUEUE ID:          F-03-01
STATUS:            FULLY RESEARCHED → AUDITED (see 09_audit.md)
PARENT FEATURES:   F-03-03 Click selection · F-03-05 Marquee · F-03-10 Sub-object selection · F-03-16 Overlay
CHILD/RELATED:     F-02-01 Selection Tool (full tool spec) · F-03-02 Selection data structure
```

---

## A. IDENTITY

| Field | Value |
|---|---|
| 1. Official name | Selection tool (Adobe Animate); also called **Pointer** in Adobe documentation prose. |
| 2. Alternate names | Pointer tool, "the black arrow", V-tool. |
| 3. Historical names | **Arrow tool** (Macromedia Flash / Flash Professional era). Renamed "Selection tool" in the Flash→Animate transition. |
| 4. Purpose | Determine **which object is under the pointer** and produce a selection from a click or marquee. Hit testing is the *subsystem* that answers "what is at (x,y)?". |
| 5. Feature category | Selection subsystem / input-resolution. |
| 6. Related features | Subselection (anchor-level hit testing), Lasso/Marquee (area hit testing), Contact-Sensitive preference, Locked/Hidden exclusion, selection overlay. |
| 7. Dependencies | Scene display list (stacking order), layer visibility/lock state, contact-sensitivity preference, spatial index (our app). |
| 8. Current/legacy status | **Current** in Adobe Animate (2023–2026 docs). Legacy name "Arrow tool" in Flash. No removal. |

---

## EVIDENCE REGISTER (all claims in this feature's docs)

| # | Claim | Status |
|---|---|---|
| E1 | Selection tool selects entire object by **click** or by **drag marquee**. | [OFFICIAL] helpx `selecting-objects.html` (2022/2023) |
| E2 | To select **instances, groups, and type blocks** you must **enclose** them with the marquee. | [OFFICIAL] same |
| E3 | To select a **stroke, fill, group, instance, or text block**, **click** the object. | [OFFICIAL] same |
| E4 | **Double-click a connected line** → selects all connected line segments. | [OFFICIAL] same |
| E5 | **Double-click a fill** → selects the filled shape **and its stroked outline**. | [OFFICIAL] same |
| E6 | **Shift**+click / Shift+drag **adds to** the selection. | [OFFICIAL] same |
| E7 | **Select All** (Ctrl/Cmd+A) selects everything on every layer of a scene **except locked, hidden, and non-current-timeline layers**. | [OFFICIAL] same |
| E8 | **Click a frame in the Timeline** selects everything on that layer **between keyframes**. | [OFFICIAL] same |
| E9 | **Contact-Sensitive Selection** preference (Edit > Preferences > General): ON = partially-enclosed objects selected; OFF = only fully-enclosed objects selected. **Subselection uses the same setting.** Documented for **Object Drawing mode** objects. | [OFFICIAL] `selecting-objects.html` + `drawing-preferences.html` |
| E10 | Stacking: most recently created object on top; **drawn lines/shapes always appear BELOW groups and symbols** in the stack. | [OFFICIAL] `arranging-objects.html` |
| E11 | Double-click a **group** (Selection tool) enters group edit; **double-click a blank spot** exits (Edit All). | [OFFICIAL] `arranging-objects.html` |
| E12 | Clicking a **fill** selects the fill only; clicking a **stroke** selects the stroke only; they move/adjust separately. | [COMMUNITY REPORT] "Stroke, shape Break Apart mode problem" (2020) |
| E13 | Dragging a marquee that **partially covers a raw shape selects the region** (and moving it splits/cuts the shape) — the merge-model behavior. | [COMMUNITY REPORT] "Selection Tool cuts my Objects" (2017) + [OFFICIAL] merge-model docs (Part 06) |
| E14 | Double-click a **stroke** selects **all connected stroke segments** (e.g., all four sides of a rectangle) — *not* the fill. | [COMMUNITY REPORT] "Unable to undo and to select stroke and fill…" (2019) |
| E15 | Animate has **no "select object behind" cycling** (Ctrl+click-to-select-behind is an Illustrator feature; the community thread describing it is about Illustrator). | [INFERENCE] from community thread `selecting an object that is behind another object` (thread is Illustrator-scoped) |
| E16 | "You can choose to select only an object's strokes or only its fills." — the exact UI location of a dedicated toggle is **not** found in current docs; the practical mechanism is E12 (click what you want). | [UNCERTAIN] exact control location; behavior itself [OFFICIAL] via E12 |
| E17 | Flash CS6 vs Animate: no **documented** change to click/marquee hit-testing semantics; version changes affect other areas (bones, TLF, publish targets). | [UNCERTAIN] (no source found for a hit-testing change) |
| E18 | Selecting an object shows a **rectangular bounding box** around it. | [OFFICIAL] `selecting-objects.html` ("When an object is selected, a rectangular box appears") |
| E19 | Selection highlight can be **hidden** (Hide Edges) to edit without highlighting. | [OFFICIAL] `selecting-objects.html` |

**Sources:** helpx.adobe.com `selecting-objects.html` (Feb 2022 / May 2023), `drawing-preferences.html` (Dec 2022), `arranging-objects.html` (Sep 2023); Adobe community threads (2017, 2019, 2020); Quora/Reddit Flash-CS6-vs-Animate threads (2020/2023) — all cited inline in later files.
