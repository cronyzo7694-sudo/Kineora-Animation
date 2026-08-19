# F-03-05 — MARQUEE SELECTION

```
SOURCE BLUEPRINT:  Part 03 — Selection System  (animate-blueprint/03_selection_system.md §3.3.3, §3.4.1)
DEEP FEATURE:      Marquee selection (rectangular drag selection: contact-sensitivity, raw-shape region, timeline frame marquee)
QUEUE ID:          F-03-05
STATUS:            FULLY RESEARCHED → AUDITED (see 01_limits_impl_tests_audit.md)
DEPENDS ON:        F-03-01 Hit testing · F-03-02 Data structure · F-03-03 Click · F-03-04 Shift/multi
FEEDS:             F-03-06 Lasso · F-03-10 Sub-object · F-02-01 (move-vs-marquee disambiguation)
```

---

## A. IDENTITY

| Field | Value |
|---|---|
| 1. Official name | "Select objects within a rectangular area" / "drag a marquee" (Adobe doc phrasing). |
| 2. Alternate names | Marquee select, rubber-band selection, box select, drag-select. |
| 3. Historical names | Same in Flash era. |
| 4. Purpose | Select **everything inside (or touched by)** a dragged rectangle in one gesture — the bulk-selection mechanism. |
| 5. Feature category | Selection subsystem / input mapping. |
| 6. Related features | F-03-01 (hit rules), F-03-03 (click vs drag threshold), F-03-04 (Shift additive), F-03-06 (lasso = freeform marquee), F-03-16 (overlay preview). |
| 7. Dependencies | Contact-sensitivity preference, drag-threshold detection, spatial index (perf). |
| 8. Current/legacy status | **Current.** Contact-sensitivity preference present across Flash→Animate. |

---

## EVIDENCE REGISTER

| # | Claim | Status |
|---|---|---|
| E1 | Select objects within a rectangular area: **drag a marquee** around them. | [OFFICIAL] `selecting-objects.html` |
| E2 | To select **instances, groups, and type blocks** with a marquee you must **enclose** them. | [OFFICIAL] same |
| E3 | Contact-Sensitive ON = partially-enclosed objects selected; OFF = only fully-enclosed selected. Subselection/Lasso share the setting. | [OFFICIAL] same + `drawing-preferences.html` |
| E4 | **"By default, objects are only selected when the tool's marquee rectangle completely surrounds the object."** | [OFFICIAL] `drawing-preferences.html` (sa_en) — see CONTRADICTION C1 |
| E5 | Raw shapes: a **partial marquee selects the intersected region** (and moving it splits/cuts the shape). | [COMMUNITY REPORT] 2017 "Selection Tool cuts my Objects" |
| E6 | **Lasso** = freeform marquee; loop auto-closes; Polygon mode = straight edges, double-click closes. | [OFFICIAL] `selecting-objects.html` |
| E7 | Timeline: **drag the cursor over frames** selects multiple contiguous frames; Shift+click = contiguous; Ctrl/Cmd+click = non-contiguous. | [OFFICIAL] `frames-keyframes.html` |
| E8 | Subselection marquee selects **points** that lie within the selection area (anchor selection). | [OFFICIAL] `selecting-objects.html` |
| E9 | Dragging **starting on an object moves it** (marquee requires starting on empty space). | [OFFICIAL] `moving-copying-objects.html` + [COMMUNITY] 2023 |
| E10 | Shift+marquee = **additive** (union-add, not subtract). | [INFERENCE from F-03-04 E1] |
| E11 | `Alt+,` / `Alt+.` jumps to prev/next **keyframe** without selecting content (navigation aid). | [COMMUNITY REPORT] 2018 (Adobe employee) |

---

## B. EXACT UI LOCATION

```
Tools panel → Selection tool (V) / Subselection (A) / Lasso (L)   ← marquee-capable tools
Stage → drag on empty                                              ← input surface
Preferences > General → Contact-Sensitive Selection and Lasso      ← governs enclosure (E3/E4)
Timeline → drag over frame cells                                   ← frame marquee (E7)
```

- 14. Shortcuts: none dedicated (drag gesture); Shift = additive (E10); Ctrl/Cmd (frames) non-contiguous (E7).
- 17. Disabled: marquee over locked/hidden layers skips them (F-03-01 E7).
- 18. Context-sensitive: result depends on target type (raw-shape region vs object enclosure) + contact pref.

---

## C. EVERY CONTROL

### C.1 Contact-Sensitive Selection and Lasso tools (checkbox)

| # | Field | Value |
|---|---|---|
| 19. Name | Contact-Sensitive Selection and Lasso tools |
| 20. Purpose | Marquee: touched vs enclosed semantics (E3). |
| 24. Default value | **CONTRADICTED** — see C1; ours: ON (touched). |
| 25. Allowed | boolean |
| 29–35. States | standard checkbox states |
| 36. Visibility | Preferences → General |

**Behavior matrix (E3):**
| State | Object-drawing objects / groups / instances | Raw shapes | Subselection anchors |
|---|---|---|---|
| ON (touched) | selected if marquee **touches** them | region selected if intersected (always) | anchors **inside** area selected (always) |
| OFF (enclosed) | selected only if **fully enclosed** | region selected if intersected (always) | anchors inside (always) |

> **Key invariant:** raw shapes and anchors **ignore** the preference — they always select by **intersection/containment** of geometry (E5/E8). The preference only governs *atomic* objects (drawing objects, groups, instances, text, bitmaps).

---

## D. INTERACTIONS (marquee gesture)

| Phase | User action | UI response | State change | Doc change | Event | Undo |
|---|---|---|---|---|---|---|
| Drag start (on empty) | press | marquee anchor set | temp `marquee.active` | none | (preview) | none |
| Continuation | move | live rectangle + candidate preview | temp `previewTargets` | none | `selection:preview` (throttled) | none |
| Release | release | highlight final set | `selection` written | none | `selection:changed` | **none** |
| Shift held | (same) | additive rectangle | union-add (E10) | none | `selection:changed` | none |
| Alt held (ours) | (same) | subtractive rectangle | remove hits | none | `selection:changed` | none |

**Drag threshold (disambiguation from click):** pointer must move ≥ **3 px** (desktop) / **12 px** (touch) before a press becomes a marquee; below threshold + release = click (F-03-03). [OUR DESIGN DECISION — Adobe's exact threshold not public]

**Starting ON an object** = move (E9), NOT marquee — the press-point hit test decides (F-03-01).

---

## E. FEATURE STATES

| State | Marquee behavior |
|---|---|
| Nothing selected | AVAILABLE — selects the marquee hits |
| Selection exists | AVAILABLE — replaces it (or adds with Shift) |
| Contact-sensitive OFF | DIFFERENT — atomic objects need full enclosure |
| Locked/hidden layer | DISABLED for those layers (skipped) |
| Raw shape present | DIFFERENT — region intersection (always) |
| Subselection tool | DIFFERENT — selects anchors/points (E8) |
| Edit-in-place | PARTIAL — only in-scope content marquee-able |
| During playback | DIFFERENT — resolves at live frame |

---

## F. OBJECT COMPATIBILITY (marquee result per type)

| Type | Marquee (contact ON) | Marquee (contact OFF) |
|---|---|---|
| Raw shape fill/stroke | **region** selected if intersected | **region** (same — pref ignored) |
| Drawing object | selected if touched | selected only if enclosed |
| Group | selected if touched | only if enclosed (E2) |
| Symbol instance | selected if touched | only if enclosed (E2) |
| Text block | selected if touched | only if enclosed (E2) |
| Bitmap | selected if touched | only if enclosed |
| Anchor (Subselection) | inside area (E8) | inside area (same) |
| Bone / warp pin | [INFERENCE] selected if enclosed/touched per pref | same |
| Camera / audio / scene | n/a | n/a |

---

## H. TIMELINE INTERACTION (frame marquee)

- **Drag over frame cells** = contiguous range selection (E7) — independent of stage marquee.
- Shift+click = contiguous add; Ctrl/Cmd+click = non-contiguous (E7).
- **Span-based mode** (hamburger → Span Based Selection): one click selects the whole keyframe span; Shift+click adds spans (F-03-04 E9).
- `Alt+,` / `Alt+.` = jump prev/next keyframe **without** selecting content (E11) — a navigation aid that avoids the stage↔timeline coupling (F-03-02 L.2).
- A stage marquee does **not** select frames; a frame marquee does **not** select stage objects (they are separate domains — F-03-02 O) — the only coupling is the highlight quirk (F-03-02 E10).

---

## I/J/K — SYMBOL · LAYER · CROSS-FEATURE

- **Symbol:** marquee selects the **instance** (enclosure rules E2); never inner frames at top level.
- **Layer:** locked/hidden skipped; outline-mode layers still marquee-able.
- **Cross-feature:** marquee → `selection:changed` → panels; raw-shape region marquee + move = **split** (merge model — Part 06); marquee during playback resolves live.
