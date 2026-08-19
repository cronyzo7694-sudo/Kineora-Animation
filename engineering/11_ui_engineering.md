# 11_UI_ENGINEERING — MOD-SHELL · MOD-PANEL · MOD-OVERLAY · MOD-MODAL · MOD-KBD · MOD-WORKSPACE

Converts C-01..C-38 contracts into engineering rules. Every control: unique ID + action binding + state binding + visibility rule + enabled rule + a11y label + test ID (REQ-UI-001).

## Control registry (MOD-SHELL)
```ts
interface Control { id: string; state: FUNCTIONAL|DISABLED-BY-CONTEXT|COMING-SOON;
  commandId?: string; predicateId?: string; visibility: ALWAYS|CONTEXTUAL|COLLAPSIBLE|HIDDEN-WHEN-UNAVAILABLE|DISABLED-WHEN-UNAVAILABLE;
  a11yName: string; testId: string; tooltip: string }
```
Build-time lint: `FUNCTIONAL` without `commandId` → fail (zero-dead-button, C-§2). Runtime: predicate false → greyed + tooltip reason.

## Panel manager (MOD-PANEL; C-06)
- Panel spec: id/title/icon/defaultDock/min/max sizes/resizable edges/collapse/reopen.
- Docking: drop zones (center=tab, edges=split) + ghost preview (valid green/invalid red); resize handles 6px; min-clamp (never 0); Reset Workspace.
- Layout persisted to app prefs (workspace), not to document.

## Overlay manager (MOD-OVERLAY; C-07; ENG-018/019)
- One positioning engine for tooltip/dropdown/menu/context/popover/picker/dialog/modal.
- `position(anchor, size, viewport)` → flip X→Y, shift within 8px margin; never off-screen.
- `z(kind)` from L0–L7 policy (no raw numbers).
- Focus: popover takes focus; tooltip never; dismissibles close on Esc + outside-click; mobile dropdown→bottom sheet.

## Modal manager (MOD-MODAL; STM-MODAL)
- One modal at a time; incompatible → queue. Focus trap (Tab cycles inside); Esc=cancel; outside-click per config; body scrolls, header/footer fixed; ≤90% viewport; mobile full sheet.

## Shortcut manager (MOD-KBD; C-32)
- `Shortcut{id,key,modifiers,context,priority,conflictBehavior,mobileEquivalent}`.
- Resolution: context-scoped priority (tool > panel > global); bind-time conflict = warning modal (never silent hijack).
- Defaults = Phase-2 F-29 table (Flash muscle-memory, W8).

## Command palette (C-04)
- Cmd+K fuzzy search over tools/commands/panels/features/actions/shortcuts; Enter runs; shows shortcut; the discoverability backstop.

## Status bar & state chips (C-05)
- Always-visible cells: tool, selection count/type, layer, frame/fps, scene, symbol breadcrumb, recording, playback, saving, export %, mode, snap.
- Fed by event bus; aria-live for changes.

## Responsive (C-36; breakpoints)
| BP | Layout invariants |
|---|---|
| ≥1280 | full dock; stage central |
| 1024–1279 | panels → tabs; timeline pinned |
| 768–1023 | Properties=right sheet; Timeline=bottom sheet |
| <768 | bottom sheets + tool ring + persistent toolbar + palette |
Invariants across all: P0 controls reachable (Play/Pause/Undo/Redo/Timeline/Layers/Properties/Tools/Save/Export/Close/Back); timeline min 96px; touch targets 44px.

## Acceptance
- **REQ-UI-001-A**: Given any rendered screen; Then no FUNCTIONAL control lacks commandId (lint) and no control overlaps at any tested viewport (C-36 suite).
- **REQ-UI-002-A**: Given popover anchored near right edge; Then it repositions inside viewport (8px margin); Esc closes; focus trapped in modal.
