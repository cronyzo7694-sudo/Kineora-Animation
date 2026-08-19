# 00_UI_RELIABILITY_MASTER — PHASE 2.5
### UI Reliability, Interaction & Product Engineering. UI is an ENGINEERING SYSTEM, not decoration. This file is the foundation: shared systems + policies + templates that every feature UI contract (contracts/) references.

```
PARENT PHASE:   Phase 2 knowledge base (405 features AUDITED)
NEXT:           Phase 3 — Engineering Master Specification (only after all UI contracts pass)
RULE:           No feature enters Phase 3 without a passing UI contract (§3).
```

---

## 1. GLOBAL UI PRINCIPLES (the 12 invariants)

Every screen, panel, mode, and control must satisfy all 12:

| # | Principle | Enforcement |
|---|---|---|
| 1 | **Discoverability** | every feature reachable via visible control OR command search (Cmd+K) OR overflow menu — never hidden-only |
| 2 | **Accessibility** | name/role/focus/keyboard on every control (§26) |
| 3 | **Predictability** | same control = same result everywhere; context changes are announced |
| 4 | **Reversibility** | every mutating action undoable (Phase-2 Command rule) OR confirm-gated |
| 5 | **Visibility of current state** | §19 state bar always shows: tool / layer / frame / scene / symbol / edit-depth / mode |
| 6 | **Clear escape/close path** | every temporary UI has Esc + close + outside-click (where applicable) (§6) |
| 7 | **Consistent interaction** | components from §33 library only; no bespoke widgets |
| 8 | **No dead controls** | §2 zero-dead-button rule |
| 9 | **No unreachable controls** | §28 no-overlap + §12 resizing + §13 responsive tests |
| 10 | **No accidental permanent modes** | §18 tool-mode safety: every mode has an active indicator + exit + Esc |
| 11 | **No unprotected destructive action** | delete/overwrite/clear-frame/break-apart → confirm; undo always available (§21) |
| 12 | **No hidden essential functionality** | P0 controls never collapse behind P2/P3 (§27) |

---

## 2. ZERO DEAD BUTTON RULE

Every visible control carries an **implementation state** in a single registry:

| State | Meaning | Render |
|---|---|---|
| `FUNCTIONAL` | wired to a command/action | normal |
| `DISABLED-BY-CONTEXT` | valid but context missing | greyed + tooltip "why" |
| `COMING-SOON` | not yet implemented | badge "COMING SOON" + tooltip reason; NOT a fake button |

**Rules:**
- A control NEVER appears functional but does nothing, opens nothing, silently fails, or overlaps.
- `COMING-SOON` = intentionally visible + clearly marked (per §2) — else hidden.
- Registry: `buttons.json` (ID → {state, reason, commandId, predicateId}). UI test fails if a `FUNCTIONAL` button has no bound `commandId`.

**The three mandatory per-button questions (§4):**
1. **Clicked twice?** → action must be idempotent OR the second click is a no-op with no state corruption (per-button spec in contracts).
2. **Clicked while another operation runs?** → button enters `loading`/`disabled` via the OperationQueue (one long-op at a time) — no double-run.
3. **Required context missing?** → `DISABLED-BY-CONTEXT` + tooltip, never a silent no-op.

---

## 3. FEATURE UI CONTRACT TEMPLATE (§3)

Every major feature (queue `01_UI_CONTRACT_QUEUE.md`) gets a contract file `contracts/C-XX_name.md`:

```markdown
# UI CONTRACT: <feature>
SOURCE: Phase-2 features <IDs>          STATUS: UNSTARTED|IN PROGRESS|UI COMPLETE|UI GAPS REMAIN

## A. ENTRY POINT
## B. VISIBLE CONTROLS (table: ID/label/type/state/visibility)
## C. STATE MAP  (active|inactive|disabled|error|success|temporary) — per §29 matrix
## D. EXIT / CLOSE / CANCEL / ESCAPE / UNDO
## E. KEYBOARD SHORTCUTS (+ mobile equivalents)
## F. POINTER + TOUCH INTERACTION
## G. BUTTON ENGINEERING (per §4 — one block per button)
## H. OVERLAYS USED (modal/popover/tooltip/dropdown — per §7/§8)
## I. ERROR & RECOVERY (per §21)
## J. UI RELIABILITY AUDIT (§36 gate)
```

**Completion gate (§34/§36):** a contract passes only when — visible, clickable, stateful, correctly positioned, accessible, closable, responsive, tested, command-wired, undo-integrated. Else `UI GAPS REMAIN` with a gap list.

---

## 4. BUTTON ENGINEERING SPEC (per-button block)

| Field | Definition |
|---|---|
| ID | stable `btn.<feature>.<name>` |
| Label / Icon / Tooltip / Accessibility label | from design tokens; icon from original icon set |
| Location / Parent panel / Position rule / Size rule | from panel layout spec (§10) |
| Minimum hit area | 32×32 px desktop; **44×44 px touch** (§14) |
| Keyboard access | shortcut (§24) + Tab-order + Enter/Space |
| Touch hit area | 44×44 px min; long-press = alt action where set |
| Focus / Hover / Pressed / Disabled / Loading / Error / Success | from component library states (§33) |
| Shortcut | registered in ShortcutManager (§24) |
| Context conditions / Dependencies | predicate IDs |
| Action | commandId (undoable) |
| Undo behavior | the command's undo entry (Phase-2 Q rules) |
| Twice-click / during-op / no-context | the 3 questions (§2) |

---

## 5. CONTROL VISIBILITY RULES (§5)

Every control is tagged exactly one:

| Tag | Behavior |
|---|---|
| `ALWAYS-VISIBLE` | P0 controls; never collapse |
| `CONTEXTUAL` | shown when context active + a **context chip** labels the active context |
| `COLLAPSIBLE` | collapses into a titled group ("Advanced ▸") — never into nothing |
| `HIDDEN-WHEN-UNAVAILABLE` | removed ONLY when provably irrelevant; returns deterministically |
| `DISABLED-WHEN-UNAVAILABLE` | stays visible, greyed + reason tooltip |

**No arbitrary disappearance.** When a control leaves the screen, either it moved to a titled group/overflow menu, or its absence is explained by the context chip.

---

## 6. CLOSE / EXIT SAFETY (§6)

Every temporary UI object defines: **Close button · Esc · outside-click (where applicable) · Cancel · Confirm · unsaved-change behavior.**

| Object | Esc | Outside-click | Unsaved-change |
|---|---|---|---|
| Modal | closes (cancel) | configurable (default: no) | "Discard / Save / Cancel" |
| Dialog | closes (cancel) | configurable | same |
| Popover | closes | closes | n/a (live) |
| Dropdown | closes | closes | n/a |
| Context menu | closes | closes | n/a |
| Floating panel | n/a | n/a | n/a (live) |
| Tool mode | exits mode | n/a | n/a |
| Transform/Rig/Camera/Edit/Text/Symbol/Drawing mode | exits mode | click-empty exits where defined | n/a |
| Full-screen | exits | n/a | n/a |

**No trapped states.** A test (§28) asserts every modal has a working close + Esc.

---

## 7. MODAL SYSTEM (centralized `ModalManager`)

One modal at a time (incompatible modals queue, never stack). Each modal:

| Spec field | Requirement |
|---|---|
| ID / Title / Purpose / Body | declarative |
| Primary / Secondary / Cancel / Close | all defined |
| Keyboard / Escape / Outside-click / Focus-trapping | Esc=cancel; focus trapped (Tab cycles inside); outside-click per config |
| Loading / Error / Success states | defined |
| Max/min size + responsive + mobile | ≤90% viewport; mobile = full sheet |
| Scroll behavior | body scrolls; header/footer fixed |
| Z-index | from §9 (dialog layer) |

**Focus trap + Esc + close button = non-negotiable.**

---

## 8. OVERLAY / POPOVER SYSTEM (centralized `OverlayManager`)

One positioning+stacking engine for: tooltips, dropdowns, menus, context menus, popovers, color pickers, transform controls, property editors, dialogs.

Requirements (all enforced, all tested §28):
- **viewport collision detection** — never render outside usable viewport
- **automatic repositioning** (flip on X then Y, shift within viewport)
- **boundary detection** with 8px margin
- **z-index** from §9 (never a raw number)
- **focus handling** — popover takes focus; tooltip never does
- **pointer-event handling** — pass-through rules per type
- **click-outside** closes (for dismissible overlays)
- **Escape** closes
- **mobile adaptation** — dropdowns → bottom sheets; tooltips → long-press hints

---

## 9. Z-INDEX / STACKING SYSTEM (centralized policy — no arbitrary numbers)

| Layer | z-range | Examples |
|---|---|---|
| L0 base | 0 | stage, panels |
| L1 stage overlays | 100–199 | selection outline, handles, anchors, bones, onion ghosts, camera border |
| L2 floating panels | 200–299 | undocked panels |
| L3 popovers/tooltips | 300–399 | tooltip, popover, color picker, transform editor |
| L4 dropdowns/menus | 400–499 | dropdown, context menu, command palette |
| L5 dialogs | 500–599 | dialogs |
| L6 modals | 600–699 | modal (blocks) |
| L7 critical alerts | 700–799 | confirm-over-modal, fatal errors |

`OverlayManager.getZ(kind)` returns the layer; components never hard-code z.

---

## 10. PANEL SYSTEM

Every panel declares: **ID, title, icon, default location, min/max width & height, resizable edges, dock zones, floating, collapse, close, reopen (Window menu + Cmd+K), remembered size/position (app prefs), mobile behavior, scrollable regions, header/footer controls.**

| Panel | min size | collapse | reopen |
|---|---|---|---|
| Tools | 44×N fixed | hideable | Window ▸ Tools |
| Timeline | min-h 96px (§16) | collapsible to 96px | Window ▸ Timeline |
| Properties | 240×320 min | hideable | Window ▸ Properties |
| Library | 240×320 | hideable | Cmd+L |
| Color/Swatches/Align/Transform/Info | per spec | hideable | Window ▸ … |

**Every panel: an obvious close/hide + a reliable reopen.** No panel can shrink to 0 or cover critical UI (§11/§12).

---

## 11. DOCKING SYSTEM

- Dock targets + **live dock preview** (ghost outline) + valid/invalid zone highlighting.
- Valid zones: center (tab stack), left/right/top/bottom (split). Invalid: any drop that would zero a panel.
- Tab stacking, split panels, floating, resize handles (6px), collapse, restore.
- **Reset Workspace** (Window ▸ Workspace ▸ Reset) always restores default layout.
- Forbidden: zero-width/height panels, inaccessible tabs, permanent accidental dock. Undoable dock actions (P2).

---

## 12. RESIZING RULES

Every resizable element: **min / max / preferred size.** On over-shrink, in order: (1) prevent further collapse, (2) reorganize controls, (3) enable scrolling, (4) switch layout (e.g., stacked→tabbed), (5) collapse low-priority controls into "▸" groups. **Controls never vanish silently.**

---

## 13. RESPONSIVE SYSTEM (breakpoints)

| BP | Width | Layout |
|---|---|---|
| Desktop | ≥1280 | full docked panels |
| Laptop | 1024–1279 | panels collapsed to tabs; timeline pinned |
| Tablet | 768–1023 | Properties = right sheet; Timeline = bottom sheet |
| Mobile | <768 | bottom-sheet Properties/Library/Timeline; floating tool ring; command palette primary |

Not "shrink the desktop UI" — element classes: `remain / collapse / move / become-bottom-sheet / become-tab / become-floating / become-command-menu`.

---

## 14. MOBILE UI RELIABILITY

- No hover-only, no right-click-only, no tiny controls.
- **Global min touch target = 44×44 px.**
- Gestures: touch feedback (ripple), long-press (context), swipe (where set), pinch, two-finger pan, precision mode (loupe).
- Bottom sheets + expandable panels.
- **Always reachable:** Play, Pause, Undo, Redo, Timeline, Layers, Properties, Tools, Save, Export, Close, Back — via persistent toolbar + command palette (Phase-2 F-31).

---

## 15. TOOLBAR OVERFLOW

Order on space shortage: (1) prioritize P0, (2) collapse secondary tools, (3) overflow → clearly-labeled "⋮ More tools" menu, (4) preserve Cmd+K search access. **Never overlap icons, never off-viewport.**

---

## 16. TIMELINE SPACE MANAGEMENT

- Min usable height **96px**; max 60% of viewport; drag resize handle; collapsible to 96px (not 0).
- Horizontal scroll (frames) + vertical scroll (layers) + ruler zoom + onion markers + playhead always visible (pinned).
- Never permanently covers Stage/Playback/Properties/Tools.
- Mobile: dedicated timeline bottom sheet (Phase-2 F-31-06).

---

## 17. PROPERTIES PANEL RELIABILITY

- Context-aware + predictable; **context chip** shows active context (tool/selection/frame/document).
- Selection change → context transitions visibly; unavailable controls `DISABLED` + reason; **values never silently lost** (commit-on-Enter, cancel-on-Esc); editing state preserved where set.
- Every property editor declares: Input · Validation · Min/Max · Invalid input (inline error + revert) · Commit (Enter/blur) · Cancel (Esc) · Undo (one command) · Live preview (where applicable).

---

## 18. TOOL MODE SAFETY

Every modal editing mode (Pen, Bone, Rig, Transform, Edit, Symbol, Camera, Text, Drawing, Distort/Envelope) declares: **active indicator (mode chip + colored cursor + status bar) · entry method · exit method · cancel · Esc · reset.** A mode is NEVER left on accidentally — mode chip is always visible (§19) and Esc always exits.

---

## 19. STATE VISIBILITY (the always-on status bar + chips)

User must always see: active tool · selected object (count/type) · active layer · active frame · active scene · active symbol · edit depth (breadcrumb) · recording · playback · saving · export · active transform/rig mode · snapping mode.

Implementation: `StatusBar` + `ContextChip` components, fed by the Phase-2 event bus. Critical state is never internal-only.

---

## 20. FEEDBACK SYSTEM

| Operation | Feedback |
|---|---|
| save / autosave | status bar "Saved hh:mm" + toast on autosave |
| export / import / render | progress bar (determinate where possible) + cancel |
| analysis / lip-sync | spinner + progress + cancel + partial-apply |
| loading | skeleton/spinner (never frozen-looking UI) |
| error | inline (fields) / toast (transient) / modal (blocking, §21) |
| success | toast + status |
| warning | toast + status |

Rules: long ops run on worker (§Phase-2 F-32) with progress events; every long op is cancellable.

---

## 21. ERROR RECOVERY

Every error-prone op defines: **expected error · user-visible message · recovery option · retry · cancel · undo · rollback · safe state.** Never leave half-completed state. Auto-save + atomic writes (Phase-2 F-32-17/F-36) guarantee a safe state to return to.

---

## 22. POINTER CAPTURE

All drag interactions define: pointer-down / move / up / cancel / leave / **capture** / multi-touch conflict. `setPointerCapture` on down; release on up/cancel; on `lostpointercapture` treat as cancel (revert preview). Applies to: drawing, selection, transform, timeline scrubbing, keyframe drag, docking, resizing, rigging. **Pointer never "lost" mid-drag.**

---

## 23. SCROLL SYSTEM

Central scroll-container registry. Each container declares: H/V/both, touch, wheel, Shift-wheel (horizontal), scrollbar, auto-scroll (drag near edge). **Avoid nested scrollbars** — each panel has ONE scrollable body. Critical controls fixed (header/footer), body scrolls.

---

## 24. KEYBOARD / SHORTCUT CONFLICT SYSTEM (`ShortcutManager`)

Every shortcut: **ID · key · modifiers · context · priority · conflict behavior · mobile equivalent.** Conflicts resolved by context scope (tool > panel > global) + explicit conflict warning at bind time. Two unrelated actions never hijack one key (Phase-2 F-29 defaults preserved).

---

## 25. COMMAND / SEARCH SYSTEM (Cmd+K / Ctrl+K palette)

Searchable: tools, commands, panels, features, actions, shortcuts. Fuzzy match; shows shortcut; Enter runs; opens hidden panels; the fallback when UI gets complex. **Every feature registers a palette entry** — this is the guaranteed discoverability backstop (§1.1).

---

## 26. ACCESSIBILITY

Every control: accessible name, role, focus state, keyboard operation, screen-reader label, visible focus indicator. Keyboard users: Esc closes overlays, Tab navigates critical controls, focus trapped in modals. WCAG AA contrast via tokens (§32).

---

## 27. VISUAL HIERARCHY (priority classes)

| Class | Examples | Placement |
|---|---|---|
| P0 essential | Undo/Redo, Play, Save, tool switch, timeline, properties, Esc | always visible, top/first |
| P1 common | align, transform, color, frames ops | one level down, collapsible |
| P2 advanced | filters, guides, onion settings | "Advanced ▸" groups |
| P3 rare | legacy, generators, presets | overflow menu / palette |

**P3 never hides P0.**

---

## 28. NO-OVERLAP TEST (automated UI test suite)

Detect: overlapping controls · clipped text · off-screen dialogs · inaccessible buttons · hidden close buttons · zero-size controls · collapsed critical panels · broken responsive layouts. Run at viewport sizes: 1920, 1440, 1280, 1024, 768, 390, 360 (×2 density). A contract fails if any P0 control is clipped/overlapped at any tested size.

---

## 29. UI STATE MATRIX (per major screen/panel)

States: Normal / Empty / Loading / Error / Success / Disabled / Selected / Editing / Playing / Paused / Exporting / Mobile / Tablet / Desktop. Every important control verified in every relevant state (in each contract).

---

## 30. INTERACTION TESTING

Single click · double click · drag · drop · long press · keyboard · touch · stylus · escape · outside click · cancel · undo · redo · **rapid repeated input** (double-click button, spam keys) — every contract lists its interaction tests.

---

## 31. PRODUCT-LEVEL NAVIGATION (every screen answers)

Where am I? · What am I editing? · How did I get here? · How do I go back? · How do I close? · How do I cancel? · How do I recover? **No dead-end screens** (breadcrumb + Back + Cmd+K always available).

---

## 32. DESIGN SYSTEM TOKENS (centralized)

| Token group | Keys |
|---|---|
| Spacing | `space-1..8` (4/8/12/16/20/24/32/40) |
| Typography | `text-xs..display`, line-heights |
| Colors | semantic: `bg/bg-elevated/surface/border/text/text-muted/primary/danger/warning/success/info` + focus ring |
| Radii / Borders | `radius-sm/md/lg`, `border-width` |
| Shadows | `shadow-1..4` (by z-layer §9) |
| Control sizes | `control-sm(28)/md(32)/lg(40)` desktop; `touch(44)` |
| Panel sizes | §10 min/max |
| Z-index | §9 layers |
| Motion | `duration-fast(120)/med(200)/slow(300)`; respects reduced-motion |

Components use tokens only; no arbitrary values (lint-enforced).

---

## 33. COMPONENT LIBRARY (each with defined states)

Button · IconButton · Toggle · Checkbox · Radio · Dropdown · Slider · Input · NumericInput · ColorPicker · Toolbar · Panel · PanelHeader · Tab · Modal · Popover · Tooltip · ContextMenu · Toast · Progress · Tabs · BottomSheet · TimelineCell · Keyframe · TreeItem · StatusBar · ContextChip · CommandPalette.

Every component: normal/hover/pressed/disabled/loading/error/success/focus states + a11y + tests.

---

## 34. NO FAKE COMPLETENESS — UI RELIABILITY AUDIT GATE (§36)

A feature's UI is COMPLETE only when: visible · clickable · stateful · correctly positioned · accessible · closable (where applicable) · responsive · tested · connected to the correct command · undo/redo integrated. The contract ends with:

```
UI COMPLETE   OR   UI GAPS REMAIN (list gaps)
```

PHASE 2.5 completes when ALL major-feature contracts reach `UI COMPLETE`.
