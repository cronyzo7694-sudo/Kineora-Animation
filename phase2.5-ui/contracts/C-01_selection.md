# UI CONTRACT: C-01 — SELECTION SYSTEM UI

```
SOURCE:  Phase-2 F-03-01..19, F-02-01/02/07
STATUS:  UI COMPLETE (exemplar — format reference for C-02..C-38)
PARENT:  00_UI_RELIABILITY_MASTER.md
```

---

## A. ENTRY POINT
- **Tools panel → Selection (V) / Subselection (A) / Lasso (L)** — click activates.
- **Cmd+K → "Selection" / "Subselection" / "Lasso"** — palette entry (discoverability backstop).
- **Temp entry:** hold `V` or `Ctrl/Cmd` from another tool (Phase-2 F-02-01).

## B. VISIBLE CONTROLS
| ID | Label | Type | State | Visibility |
|---|---|---|---|---|
| btn.sel.tool | Selection tool | IconButton | FUNCTIONAL | ALWAYS-VISIBLE (Tools panel) |
| btn.sel.sub | Subselection tool | IconButton | FUNCTIONAL | ALWAYS-VISIBLE |
| btn.sel.lasso | Lasso (+Polygon/MagicWand flyout) | IconButton | FUNCTIONAL | ALWAYS-VISIBLE |
| opt.sel.snap | Magnet (snap to objects) | Toggle | FUNCTIONAL | CONTEXTUAL (Selection active) |
| opt.sel.smooth | Smooth | Button | FUNCTIONAL | CONTEXTUAL (raw shape selected) |
| opt.sel.straighten | Straighten | Button | FUNCTIONAL | CONTEXTUAL |
| opt.sel.contact | Contact-Sensitive Selection | Checkbox | FUNCTIONAL | Preferences ▸ General |
| opt.sel.shiftselect | Shift Select (enable Shift+click) | Checkbox | FUNCTIONAL | Preferences ▸ General |
| opt.sel.hideedges | Hide Edges | Toggle | FUNCTIONAL | View menu + Ctrl+Shift+E |
| opt.sel.regionlock | Region-select lock (ours) | Toggle | FUNCTIONAL | Options area + status |
| opt.wand.threshold | Magic Wand Threshold | Slider (0–200) | FUNCTIONAL | CONTEXTUAL (MagicWand active) |
| opt.wand.smoothing | Wand Smoothing (Pixels/Rough/Normal/Smooth) | Dropdown | FUNCTIONAL | CONTEXTUAL |
| opt.sel.mode | Select mode (touch Shift-replacement) | Toggle | FUNCTIONAL | MOBILE toolbar |
| stb.sel.status | Selection status (count/type) | StatusText | — | ALWAYS-VISIBLE (StatusBar) |

## C. STATE MAP
| State | Controls | Behavior |
|---|---|---|
| Normal (idle) | tool buttons active | click/marquee produce selection |
| Object selected | snap/smooth/straighten + status active | highlight + bounding box |
| Multiple selected | status shows count; Properties = common fields | union box |
| Sub-object (fill/stroke) | smooth/straighten on shape | speckled fill / colored stroke |
| Anchors (Subselection) | anchor dots + handles | path editing |
| Marquee in progress | temp `marquee` state | live preview (throttled) |
| Locked/hidden hit | no-entry cursor + toast | skipped (F-03-15) |
| Edit-in-place (group/symbol) | dimmed scope | only in-scope hits |
| During playback | live-frame hits | selection may drop (F-03-18) |
| Error (broken ref) | toast + select placeholder | warn |

## D. EXIT / CLOSE / CANCEL / ESCAPE / UNDO
- **Exit selection tool:** switch tool / Esc (deselects active sub-mode). No trap — tool switch is always visible.
- **Clear selection:** click empty / Ctrl+Shift+A / Esc (configurable).
- **Exit edit-in-place:** Back / breadcrumb / double-click-outside / Esc (ours, one level).
- **Undo:** selection = view state (no undo); the follow-up command is one undo entry (F-03 Q).

## E. KEYBOARD SHORTCUTS
| Action | Key | Mobile |
|---|---|---|
| Selection tool | V | toolbar button |
| Subselection | A | toolbar button |
| Lasso | L | toolbar button |
| Add/toggle | Shift+click | Select-mode toggle |
| Select all / Deselect | Ctrl+A / Ctrl+Shift+A | toolbar buttons |
| Hide edges | Ctrl+Shift+E | toolbar toggle |
| Exit one edit level | Esc | back button |

## F. POINTER + TOUCH INTERACTION
| Action | Desktop | Touch |
|---|---|---|
| Select | click (1px tol) | tap (24px tol) |
| Toggle | Shift+click | Select-mode tap |
| Marquee | drag on empty | 1-finger drag on empty (2-finger = pan) |
| Lasso | drag freeform | 1-finger trace |
| Sub-select | click anchors | tap → anchors → loupe drag |
| Context | right-click | long-press (500ms) |
| Drill | double-click | double-tap |
| Alt+click (ours) | cycle z-stack | n/a (toolbar "select behind") |

## G. BUTTON ENGINEERING (exemplar blocks)
### btn.sel.tool (Selection)
| Field | Value |
|---|---|
| ID | btn.sel.tool · Label "Select" · Tooltip "Select and move objects (V)" |
| Location | Tools panel, first |
| Min hit area | 32px desktop / 44px touch |
| Keyboard | V · Touch | toolbar tap |
| States | hover/pressed/selected(persist)/disabled(n/a) |
| Action | command `tool.activate('selection')` (no undo — view state) |
| Twice-click | idempotent (re-activates) |
| During op | allowed (tool switch cancels active gesture safely) |
| No context | never disabled (always usable) |
| A11y label | "Selection tool" |

### opt.sel.contact (Contact-Sensitive)
| Field | Value |
|---|---|
| ID | opt.sel.contact · Tooltip "Select objects the marquee merely touches" |
| Location | Preferences ▸ General |
| Default | ON (ours; documented [UNCERTAIN] per C1) |
| Action | `pref.set('contactSensitive')` (persisted app pref) |
| Twice-click | toggles back (idempotent) |
| No context | always available (pref) |

### opt.wand.threshold (Magic Wand Threshold)
| Field | Value |
|---|---|
| ID | opt.wand.threshold · Range 0–200 · Step 1 · Default (user-set, ~20) |
| Location | Options area when MagicWand active |
| Action | `pref.set('wand.threshold')` |
| No context | HIDDEN-WHEN-UNAVAILABLE (Wand inactive) — returns when Wand active |

## H. OVERLAYS USED
- **Selection outline / bounding box / handles / anchors** — L1 stage overlay (never exported).
- **No-entry cursor + toast** on locked/hidden hit — toast L4.
- **Context menu** — L4 dropdown (right-click/long-press).

## I. ERROR & RECOVERY
| Error | Message | Recovery |
|---|---|---|
| Click locked/hidden | toast "Layer locked/hidden" | unlock/show |
| Broken reference | toast "Symbol missing" + select placeholder | swap/restore |
| Sub-object move splits shape (merge) | toast "Split shape — undo if unintended" | Undo (one command) |
| Selection lost on scrub | status "selection dropped" | restore-on-reappear (ours) |

## J. UI RELIABILITY AUDIT
- [x] visible (all controls listed) · [x] clickable (command-wired) · [x] stateful (C matrix) · [x] positioned (Tools panel + overlay L1) · [x] accessible (a11y labels, keyboard) · [x] closable (Esc/clear) · [x] responsive (C-36 matrix) · [x] tested (F-03 tests + no-overlap) · [x] command-wired · [x] undo-integrated (follow-up commands).

```
UI COMPLETE  (C-01 — Selection system UI)
```
