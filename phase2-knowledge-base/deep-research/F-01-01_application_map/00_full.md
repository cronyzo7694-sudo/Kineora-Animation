# F-01-01..29 — APPLICATION MAP (full part)
```
SOURCE BLUEPRINT: Part 01 — Complete Application Map
DEEP FEATURES: F-01-01..29 · STATUS: AUDITED
DEPENDS ON: (foundation) · FEEDS: (all parts)
```
## A. IDENTITY
1. Official name: (application architecture). 4. Purpose: the architectural inventory — shell, menus, panels, stage, timeline, document settings, workflows, state/event flow. 8. Status: current.

## EVIDENCE REGISTER
| # | Claim | Status |
|---|---|---|
| E1 | Four data pillars: frame / layer / symbol / tween; document = scenes + shared library; tree-of-timelines model. | [OFFICIAL] `time.html`, `symbols.html`, `timeline-layers.html` |
| E2 | Tools panel = 4 sections (tools/view/colors/options); options = contextual modifiers. | [OFFICIAL] `using-stage-tools-panel.html` |
| E3 | Workspaces = saved panel arrangements; dockable/floatable/grouped panels. | [OFFICIAL] `set-preferences.html` (sync workspaces) |
| E4 | Document settings (width/height/units/fps/bg/platform); fps defines frame grid (frame/fps = time). | [OFFICIAL] Part 01 §1.7 + `time.html` |
| E5 | Stage coordinate system: origin top-left, +Y down; pasteboard = non-exported staging area. | [OFFICIAL] Part 01 §1.4 + `moving-copying-objects.html` |
| E6 | State/event flow: single source of truth + commands + dirty-region + evaluate(time) (WYSIWYG). | [OUR DESIGN DECISION] (Part 01 §1.16) |

## F-01-01 APPLICATION SHELL
Menu bar / stage (+pasteboard) / timeline panel / tools panel / properties panel / library / dockable panels / edit-bar breadcrumb / status bar.

## F-01-02 WORKSPACES
Saved panel layouts; dock/float/group/stack; New/Reset Workspace; persisted as app prefs (E3).

## F-01-03 MULTI-DOCUMENT
Tabs; active doc; per-doc Library/timeline; panels bind to active (F-12).

## F-01-04 FILE MENU
New/New-from-Template/Open/Open-Recent/Open-from-Libraries/Close/Save/Save-As/Save-as-Template/Import/Export/Publish-Settings/Print/Exit.

## F-01-05 EDIT MENU
Undo/Redo/History · Cut/Copy/Paste/Paste-in-Place/Paste-Special/Duplicate · Select-All/Deselect · Find&Replace · Timeline submenu · Edit-Symbols/In-Place/All · Preferences/Shortcuts/Toolbars.

## F-01-06 VIEW MENU
Go-To · Zoom/Magnification/Fit · Preview-Modes (Full/Fast/AA/Outline) · Work-Area · Rulers/Grid/Guides · Snapping · Hide-Edges · Shape-Hints.

## F-01-07 INSERT MENU
New-Symbol · Timeline (Frame/Keyframe/Blank) · Motion/Classic/Shape Tween · Scene.

## F-01-08 MODIFY MENU
Document · Convert-to-Symbol · Break-Apart · Bitmap (Swap/Trace) · Symbol (Swap/Duplicate) · Shape (Convert-Lines/Expand/Soften/Smooth/Straighten/Optimize/Hints) · Combine-Objects · Timeline (Layer-Properties/Reverse/Convert/Distribute) · Transform · Arrange · Align · Group/Ungroup.

## F-01-09 TEXT MENU
Font/Size/Style · Align · Letter/Line-Spacing · Embed · TLF (legacy).

## F-01-10 COMMANDS MENU
Saved-Commands · Copy-Motion-XML · Convert-AS3→HTML5 · JSFL (scripting).

## F-01-11 CONTROL MENU
Play/Rewind/Step/Test-Movie/Test-Scene/Mute/Loop/Live-Preview/Enable-Simple-Buttons.

## F-01-12 DEBUG MENU (LEGACY)
Breakpoints/step/watch — historical (AS3).

## F-01-13 WINDOW MENU / PANELS
Panel visibility + workspaces submenu.

## F-01-14 HELP MENU
Docs/shortcut-viewer/about.

## F-01-15 TOOLS PANEL STRUCTURE
4 sections (E2); tool = stateful interaction mode (cursor + pointer-events + options + properties) — Part 01 §1.3.2.

## F-01-16 STAGE
Coordinates (E5); compositing order (bg → grid/guides → layers bottom→top → masks → onion → camera → selection overlay); preview modes.

## F-01-17 GRID/GUIDES/RULERS/SNAPPING
Rulers (drag = guide); grid; snap-to-objects/grid/guides/pixels; Snap-Align hints.

## F-01-18 TIMELINE OVERVIEW
Layer list + frame grid + playhead + onion controls (F-07).

## F-01-19 PROPERTIES CONTEXT BINDING
Precedence tool→selection→frame→document (F-26).

## F-01-20 DOCUMENT SETTINGS
Width/height/units/fps/bg/platform/advanced; fps load-bearing (E4).

## F-01-21 LIBRARY OVERVIEW (F-12).

## F-01-22 SCENE PANEL OVERVIEW (F-25).

## F-01-23 COLOR/SWATCHES OVERVIEW (F-23).

## F-01-24 ALIGN/TRANSFORM/INFO OVERVIEW (F-24/F-04).

## F-01-25 COMPONENTS/ACTIONS/OUTPUT
Widget library; code editor; build log (ours: behavior graph P1).

## F-01-26 ASSET & UTILITY PANELS
Motion-Editor (F-09-08) · Frame-Picker (F-11-08) · Layer-Depth (F-16-06) · Brush-Library (F-02-18) · Movie-Explorer · History · CC-Libraries (not needed).

## F-01-27 IMPORT/EXPORT OVERVIEW (F-27/F-28).

## F-01-28 CHARACTER WORKFLOW (F-13).

## F-01-29 STATE & EVENT FLOW (E6)
User action → tool gesture → Command → model → bus emit → panels re-render; evaluate(time) → renderTree (authoring = playback = export).

## L. LIMITATIONS
L.1 Animate is single-window (no native multi-doc tabs like browsers) → ours: tabs. L.2 Debug menu AS3-legacy → ours: own inspector.

## M. EDGE CASES
M.1 panel layout reset · M.2 workspace switch mid-edit (no doc change) · M.3 fps change mid-project (frames stay, seconds change — documented rule).

## O/P/Q/R/S/Y
Data: document model (Part 33). Events: bus (F-03-17 + Part 32). Undo: commands. Serialization: document + app prefs (separate). Mobile: bottom-sheet panels + toolbar (F-31). Implementation: panel/dock manager + event bus + command stack (Part 32).

## TESTS
TS-01 shell loads · TS-02 workspace save/reset (E3) · TS-03 multi-doc tabs · TS-04 menu commands wired · TS-05 tools panel 4 sections (E2) · TS-06 stage compositing order · TS-07 fps frame-grid math (E4) · TS-08 context-binding precedence (F-26) · TS-09 state/event flow (action→command→render) · TS-10 evaluate determinism.

## AUDITS
No contradiction. Self-challenge: overlooked = fps-load-bearing (E4) + tool-as-state-machine (E2) + evaluate-WYSIWYG (E6) — covered.

```
FEATURE COMPLETE: F-01-01..29 — Application map — AUDITED
```
