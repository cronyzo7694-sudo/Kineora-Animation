# 09 — EDIT MULTIPLE FRAMES (EMF)

```
PHASE:     RESEARCH ONLY
AUTHORITY: Blueprint 15.2.1 “Edit Multiple Frames” · F-15-02 E3 · F-15-03 L.3
CODE:      absent
```

---

## 1. What Adobe / Blueprint say

| Source | Words |
|---|---|
| Adobe 2026 page | “View and edit contents in multiple frames within the selected range.” Hold button → Edit selected range / Edit all frames. Click toggles. |
| Blueprint 15.2.1 | “Show (and allow **editing**) multiple frames at once — not just ghosts.” |
| F-15-02 E3 | Edit Multiple Frames button |
| F-15-03 L.3 | “edit-multiple-frames risky on heavy scenes → **ours: layer-scoped** EMF” |
| C-19 | Esc exits EMF; `fbf.multi` |

That is **all**. They do **not** specify:

- what a Stage drag does to N keyframes,
- whether selection is union of all frames in range,
- whether new draws land on every key or only the playhead,
- whether EMF is object-level or frame-level.

---

## 2. Why this is NOT P0

2D animation’s first loop is: see ghosts (onion) + edit **the current frame**.  
EMF is a **power tool** (move a whole walk cycle at once). Shipping it without a write-rule would invent a mutation model (FL-0023).

**Status: SPEC-NAMED, SEMANTICS OPEN → AMB-TL-020.**

Do **not** implement EMF in the first onion increment.

---

## 3. What must be decided before code (AMB-TL-020)

Split into sub-questions so a Leader/human can answer without a novel:

| ID | Question | Options (do not pick in code) |
|---|---|---|
| **AMB-TL-020a** | Scope | (i) active layer only (F-15-03 L.3 “ours”) · (ii) all visible layers |
| **AMB-TL-020b** | Range | (i) onion marker range · (ii) current frame **selection** · (iii) whole duration (“edit all”) |
| **AMB-TL-020c** | Stage select | (i) union of objects that exist in any range frame · (ii) only playhead content, but transforms copy to other keys |
| **AMB-TL-020d** | Move/transform | (i) one `TransformSelection` **per keyframe** in range (N undo — bad) · (ii) **one** compound command applying the same delta to every key in range · (iii) only keys that already contain that node id |
| **AMB-TL-020e** | Draw / new rect | (i) playhead only (honest) · (ii) stamp into every key in range (dangerous) |
| **AMB-TL-020f** | Delete | same as (d) — which keys lose the node |

Until 020a–f are answered, a coding agent that “makes ghosts clickable” is **wrong**.

---

## 4. Safe observations (not decisions)

- EMF **shows** content of several frames at once → that part is just onion with `alpha=1` and no tint. That display-only mode is **not** EMF (Blueprint: EMF = edit).
- F-15-03 L.3 already leans **layer-scoped** — still an “ours” note, not a locked Leader decision.
- Esc exits EMF (C-19) — if EMF ships, Esc-to-exit must not fight `edit.exitOneLevel` (same class as rect-cancel: capture while EMF on).
- Shortcut Alt+O is reserved in F-15-04 E3 for EMF — do not bind Alt+O to something else.
- Undo: whatever lands must be **one user gesture = one History entry** (INV-EDIT / eng 05). N silent commands = fail.

---

## 5. Adobe “Edit selected range / Edit all frames”

Maps to 020b. “All frames” = 1..duration. We do not have to ship both.

---

## 6. Coding packet (blocked)

**Blocked on AMB-TL-020.**  
When unblocked, likely files: `Stage.tsx` hit-test union, a new `EditMultipleFrames` command in `command.rs` that patches the same node ids across a frame list, Timeline header button.

Do not start.

---

## 7. Honest status

NAMED in Blueprint. **NOT READY FOR IMPLEMENTATION.**  
Onion P1 can ship with EMF button **absent** or **DEFERRED + reason** (“AMB-TL-020”).  
C-19 `fbf.multi FUNCTIONAL` is paper.
