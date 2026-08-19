# F-03-01 — D. INTERACTIONS · E. STATES · N. ERROR BEHAVIOR

---

## D. INTERACTION (per input, with the full action→response chain)

Format per the template: `USER ACTION → UI RESPONSE → STATE CHANGE → DOCUMENT CHANGE → RENDER CHANGE → EVENT → UNDO ENTRY.`

### D.37 Click (single, on Stage)

| Target at point | Result |
|---|---|
| Fill of a raw shape | fill selected (speckled highlight) → selection state = {fill} → **no doc change** → overlay redraw → `selection:changed` → **no undo entry** (selection is view state) |
| Stroke of a raw shape | that stroke selected → same chain |
| Drawing object / group / symbol instance / text / bitmap | whole object selected → bounding box (E18) → same chain |
| Empty stage | selection cleared → same chain (no doc change) |
| Locked/hidden layer content | nothing selected (hit skipped) → no state change |

**Selection itself is NOT undoable** (view state) — this is a documented behavioral rule (Part 03 §3.9 of the blueprint; Adobe internals not public → the "no undo for selection" rule is [OUR DESIGN DECISION] as a model, consistent with [OBSERVED] behavior that clicking/deselecting does not pollute Undo).

### D.38 Double click

| Target | Result |
|---|---|
| Fill | fill **+ stroke** selected together (E5) |
| Stroke (connected line) | all connected stroke segments selected (E4/E14) |
| Group | enter **group edit-in-place**; outside content dims (E11) → doc unchanged, but edit-scope state changes → breadcrumb updates |
| Symbol instance | enter symbol edit-in-place (Part 11) |
| Text | enter text edit (caret) |
| Blank spot (while in a group) | **Edit All** — exit group edit (E11) |

### D.39–42 Drag (marquee): start → continuation → release

1. **Drag start** on empty area: begin marquee rectangle (anchor = press point).
2. **Continuation:** live rectangle preview; objects/regions that would be selected are **preview-highlighted** (region preview for raw shapes).
3. **Release:** finalize selection per contact-sensitivity (G matrix):
   - Drawing objects/groups/instances: enclosed (or touched) per pref (E9).
   - **Raw shapes: the intersected region is selected** (E13) — the marquee acts as a *geometric intersection*, not an object test.
   - `→ selection:changed` event; **no doc change** until the selection is acted upon (move/cut/delete). **No undo entry** for the selection itself.

**Drag starting ON an object (not empty):** moves the object (that is F-02-01 territory, not hit testing) — but the *press-point resolution* is a hit test.

### D.43 Right click

- Opens the context menu **for the object under the pointer** (hit test runs first to decide which menu — stage menu vs object menu vs shape menu). See Part 30 of the blueprint; menu target = hit-test result.

### D.44 Long press (mobile)

- Same as right click: resolves the target, opens its context menu (06_mobile file).

### D.45 Keyboard modifier

| Modifier | During hit-test interaction | Effect |
|---|---|---|
| Shift | click / marquee | add to selection (E6); click-on-selected → remove |
| Ctrl/Cmd (Win/Mac) | held while another tool active | temporarily activate Selection tool (hit test with V) |
| V (held) | any tool | same temporary activation |
| Alt/Option | drag starting on object | duplicate-drag (moves a copy — post-hit behavior) |

### D.46 Mouse wheel

- No hit-test role. Wheel = view zoom (Part 01). A **pointer-position hit test does not change** on wheel; the object under the cursor may change *screen* position but the selection is unaffected.

### D.47 Keyboard navigation

- Arrow keys nudge the **current selection** (post-hit). Tab-focus of stage objects is **not** a selection mechanism in Animate. `Ctrl/Cmd+A` = Select All (E7). No documented "walk the z-stack with keys" — [INFERENCE: none exists; selecting behind requires rearrange/lock/outline workarounds, L.2].

### D.48 Touch gesture (mobile)

- **Tap** = click hit test (with finger tolerance, ~20–24 px). **Long-press** = context menu at target. **Drag on empty** = marquee. **Drag on object** = move. Two-finger = pan (never a selection). Details: 06_mobile file.

### D.49 Stylus input

- Stylus tap/drag behave as mouse click/drag (pressure/tilt do **not** affect hit testing — only stroke width when drawing). Barrel-button = right-click → context menu at target. Hover (pen in range) shows cursor but performs **no** selection. Palm-rejection must be handled by the OS/app so palm touches don't marquee-select (06_mobile).

---

## E. FEATURE STATES (when does hit testing AVAILABLE / PARTIAL / DISABLED / DIFFERENT?)

| State | Hit-test behavior |
|---|---|
| **Nothing selected** | AVAILABLE — next click/marquee produces a fresh selection. |
| **Object(s) selected** | AVAILABLE — click replaces selection (unless Shift); marquee replaces. |
| **Multiple selected** | AVAILABLE — Shift click adds/removes members; plain click collapses to the single hit. |
| **Layer locked** | DISABLED for that layer's content (hit skipped); other layers still hit-test. |
| **Layer hidden** | DISABLED (content not rendered, not hit-testable). |
| **Object locked (Arrange > Lock)** | DISABLED for that object (skipped); others fine. |
| **Nested (inside group/symbol)** | BEHAVES DIFFERENTLY — at top level the container is the hit; inside edit-in-place, children are hits; outside dimmed content is NOT hit-testable. |
| **Playing (timeline running)** | BEHAVES DIFFERENTLY — content changes per frame; a hit resolves against the **current frame's** content; selection of an object that disappears at the new frame is dropped (blueprint Part 03 §3.10). |
| **Paused / scrubbed** | AVAILABLE normally. |
| **Editing (group/symbol edit-in-place)** | PARTIAL — only the edit scope is hit-testable; dimmed context excluded. |
| **Subselection tool active** | DIFFERENT — anchor-level hits instead of object hits (F-03-02 family). |
| **Contact-sensitivity OFF** | DIFFERENT — marquee requires full enclosure (G matrix). |
| **Invalid/error state** | n/a — hit testing has no failure mode beyond "no hit" (N below). |

---

## N. ERROR / FAILURE BEHAVIOR

| Failure | Result | Classification |
|---|---|---|
| Click misses everything (empty stage/pasteboard) | selection cleared; no error | **Fallback (designed) behavior** |
| Click on locked/hidden content | nothing selected; no error shown | **Silent skip** [OBSERVED — Animate gives no warning; blueprint Part 03 §3.7 keeps this] |
| Marquee over nothing | selection cleared | **Fallback** |
| Marquee with contact-sensitivity OFF partially covering objects | objects **not** selected (only enclosed) — often perceived as a bug | **Silent (preference-driven) behavior** [COMMUNITY-adjacent; documented in E9] |
| Raw-shape partial marquee then move | shape **splits** (region cut away) — often perceived as destructive bug | **Partial execution of merge model** [COMMUNITY REPORT E13] |
| Click on a group when intending its child | group selected (must double-click to reach child) | **Designed nesting behavior** |
| Broken reference (instance whose symbol was deleted) | [INFERENCE] Animate shows a placeholder/missing symbol; hit test selects the placeholder instance; our app: select + warn toast | **Automatic correction** (our app decision) |

**Rule carried into our app:** silent skips (locked/hidden) are kept for speed but surfaced as a **subtle cursor affordance** (e.g., a "no-entry" cursor) — a small improvement over Animate's total silence. [OUR DESIGN DECISION]
