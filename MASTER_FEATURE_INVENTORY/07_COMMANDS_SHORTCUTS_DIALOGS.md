# §10–§12: COMMAND INVENTORY · SHORTCUT INVENTORY · DIALOG INVENTORY

---

## 10. COMMAND INVENTORY  [Part 36 · 05_command_system.md · animator/core/src/command.rs]

> Legend: **✅ implemented** (Rust, `command.rs`) · **📋 specified** (engineering registry) · **📐 blueprint** (Part 02 UNDO GRANULARITY). All document mutations are Commands; selection/view/edit-mode are NOT commands (restored via `prevSelection`).

### 10.1 Draw / shape
| Command | Label | Undoable | Source |
|---|---|---|---|
| `DrawRect` ✅ | "Draw rectangle" | yes | DrawRect |
| `CMD-DRAW` / `DrawPathCommand` 📐 | "Draw path" | yes (whole path) | T2B.1 |
| `DrawFillCommand` 📐 | "Draw fill" | yes (per stroke) | T2C.2 |
| `CMD-ERASE` / `EraseCommand` 📐 | "Erase" | yes (per stroke) | T2C.5 |
| `ReshapeCommand` 📐 | "Reshape" | yes (per edge-drag) | T2A.1 |
| `PathEditCommand` 📐 | "Edit path" | yes (per handle-drag) | T2A.2 |
| `CMD-COLOR` 📋 | "Change color/style" | yes (coalesces) | 05 |
| `Smooth`/`Straighten` 📐 | — | one command each | T2A.1 |
| `CMD-BREAK-APART` 📋 | "Break apart" | yes (one level) | 05 |

### 10.2 Selection / transform
| Command | Label | Undoable | Source |
|---|---|---|---|
| `MoveSelection` ✅ | "Move selection" | yes (per gesture) | MoveSelection |
| `CMD-MOVE` 📋 (with raw-shape split at command time) | "Move selection" | yes | 05 / REQ-SEL-006 |
| `TransformSelection` ✅ | "Transform selection" | yes (all fields) | TransformSelection |
| `CMD-TRANSFORM` 📋 | "Transform selection" | no coalesce | 05 |
| `FillTransformCommand` 📐 | "Transform fill" | yes (per handle) | T2A.4 |
| `CMD-ALIGN` 📋 | "Align/distribute" | yes | 05 |

### 10.3 Keyframes & frames
| Command | Label | Undoable | Source |
|---|---|---|---|
| `InsertKeyframe` ✅ (F6) | "Insert keyframe" | yes | InsertKeyframe |
| `InsertBlankKeyframe` ✅ (F7) | "Insert blank keyframe" | yes | InsertBlankKeyframe |
| `ClearKeyframe` ✅ (Shift+F6) | "Clear keyframe" | yes | ClearKeyframe |
| `InsertFrames` ✅ (F5) | "Insert frame" | yes (coalesces) | InsertFrames |
| `DeleteFrames` ✅ (Shift+F5) | "Delete frame" | yes | DeleteFrames |
| `RemoveFrames` ✅ | "Remove frames" (gap) | yes | RemoveFrames |
| `PasteFrames` ✅ | "Paste frames" | yes | PasteFrames |
| `ReverseFrames` ✅ | "Reverse frames" | yes | ReverseFrames |
| `MoveKeyframe` ✅ | "Move keyframe" | yes | MoveKeyframe |
| `DuplicateKeyframe` ✅ | "Duplicate keyframe" | yes | DuplicateKeyframe |
| `MoveKeyframeSequence` ✅ | "Move frame span" | yes | MoveKeyframeSequence |
| `ResizeSpan` ✅ | "Resize frame span" | yes | ResizeSpan |
| `DuplicateFrames` ✅ | "Duplicate frames" | yes | DuplicateFrames |
| `ConvertToKeyframes` ✅ | "Convert to keyframes" | yes | ConvertToKeyframes |
| `ConvertToBlankKeyframes` ✅ | "Convert to blank keyframes" | yes | ConvertToBlankKeyframes |
| `SetFrameLabel` ✅ | "Set frame label" | yes | SetFrameLabel |
| `CMD-SET-PROPERTY` 📋 | "Set property key" | yes (coalesces) | 05 |

### 10.4 Tweens
| Command | Label | Undoable | Source |
|---|---|---|---|
| `SetClassicTween` ✅ | "Create classic tween" | yes | SetClassicTween |
| `RemoveClassicTween` ✅ | "Remove tween" | yes | RemoveClassicTween |
| `CMD-CONVERT-TWEEN` 📋 (motion/classic/shape span) | — | yes | 05 |
| `CMD-SPLIT-MOTION` 📋 | "Split motion" | yes | 05 / D2 |

### 10.5 Symbols & library
| Command | Label | Undoable | Source |
|---|---|---|---|
| `ConvertToSymbol` ✅ (F8) | "Convert to symbol" | yes | ConvertToSymbol |
| `CreateSymbol` ✅ (Ctrl+F8) | "New symbol" | yes | CreateSymbol |
| `PlaceSymbol` ✅ | "Place symbol instance" | yes | PlaceSymbol |
| `RenameSymbol` ✅ | "Rename symbol" | yes | RenameSymbol |
| `DeleteSymbol` ✅ | "Delete symbol" | yes (full-doc snapshot) | DeleteSymbol |
| `SwapInstance` ✅ | "Swap symbol" | yes | SwapInstance |
| `SetInstanceLoop` ✅ | "Set instance loop" | yes | SetInstanceLoop |
| `CMD-CHANGE-MOUTH` 📋 | "Change mouth/viseme" | yes (coalesces) | 05 |

### 10.6 Layers
| Command | Label | Undoable | Source |
|---|---|---|---|
| `CreateLayer` ✅ | "Add layer" | yes | CreateLayer |
| `DeleteLayer` ✅ | "Delete layer" | yes | DeleteLayer |
| `RenameLayer` ✅ | "Rename layer" | yes | RenameLayer |
| `SetLayerVisible` ✅ | "Show/hide layer" | yes | SetLayerVisible |
| `SetLayerLocked` ✅ | "Lock/unlock layer" | yes | SetLayerLocked |
| `ReorderLayer` ✅ | "Reorder layer" | yes | ReorderLayer |
| `CMD-LAYER-OP` 📋 (general) | — | yes | 05 |

### 10.7 Object / document properties
| Command | Label | Undoable | Source |
|---|---|---|---|
| `SetNodeProps` ✅ | "Edit object properties" | yes | SetNodeProps |
| `SetDocumentSettings` ✅ | "Edit document settings" | yes | SetDocumentSettings |

### 10.8 Specified but NOT yet implemented (📋 blueprint/engineering)
| Command | Purpose |
|---|---|
| `CMD-ADD-BONE` / `CMD-MOVE-BONE` / `CMD-INSERT-POSE` | rig/pose |
| `CMD-LIP-SYNC` | auto lip-sync pass (journal, one undo) |
| `CMD-IMPORT` | import assets (one atomic) |
| `CMD-SCENE-OP` | scene CRUD/reorder |
| `CMD-EXPRESSION` | apply expression |
| `CMD-CAMERA` | camera keys/preset |
| `TextCommand` 📐 | text edit (coalesced) |
| `PoseCommand` 📐 | pose drag |

### 10.9 Command invariants  [05_command_system.md]
1. `do()` validates preconditions (locked layer, tween span) → typed error → MOD-NOTIFY.
2. `prevSelection` captured before `do()`; restored on undo/redo (REQ-SEL-005).
3. Dirty marking from `affected` (STM-DIRTY).
4. Events AFTER mutation: `document:changed{type, targets}`.
5. Selection-only actions produce NO command.
6. Coalescing: typing (word/session), slider drags (gesture), numeric (commit).
7. Redo invalidation on new command; async commands use journals.
8. Undo depth default 100 (configurable, RSK-011).

---

## 11. SHORTCUT INVENTORY  [Part 29 · C-32 · 12_input_engine.md]

### 11.1 Tools
| Tool | Key |
|---|---|
| Selection | V (hold for temp; Ctrl/Cmd temp) |
| Subselection | A |
| Free Transform | Q |
| Gradient Transform | F |
| Lasso | L |
| Pen | P |
| Text | T |
| Line | N |
| Rectangle (+Oval/PolyStar/Primitives) | R |
| Oval | O |
| Pencil | Shift+Y (Y legacy) |
| Paint Brush | Y |
| Brush | B |
| Eraser | E |
| Width | U |
| Eyedropper | I |
| Paint Bucket | K |
| Ink Bottle | S |
| Bone | M |
| Camera | C |
| Hand | H |
| Zoom | Z |
| Stage Rotate | Shift+H |
| Time Scrubber | Shift+Alt+H |
| Temp Hand | hold Space |
| 3D Rotation (legacy) | W |
| 3D Translation (legacy) | G |

### 11.2 File / Edit
Ctrl+N/O/W/S · Ctrl+Shift+S · Ctrl+R (import stage) · Ctrl+I (import library) · Ctrl+Shift+R (export) · Shift+Alt+F12 (publish) · Ctrl+Shift+F12 (publish settings) · Ctrl+P · Ctrl+Q · Ctrl+Z · Ctrl+Shift+Z / Ctrl+Y (redo) · Ctrl+X/C/V · Ctrl+Shift+V (paste-in-place) · Ctrl+D (duplicate) · Ctrl+A / Ctrl+Shift+A · Ctrl+F (find) · Ctrl+U (prefs) · Ctrl+Shift+Alt+K (shortcuts).

### 11.3 Selection / Transform
Shift+click (toggle) · Ctrl+Shift+E (hide edges) · Shift (constrain) · Alt (center/opposite/dup-drag) · Ctrl+Shift+9/7 (rotate 90°) · Ctrl+Alt+S (scale&rotate) · arrows (nudge 1px) · Shift+arrows (10px) · Ctrl+↑/↓ (arrange) · Ctrl+Shift+↑/↓ (front/back) · Ctrl+G / Ctrl+Shift+G (group/ungroup).

### 11.4 Timeline / frames / playback
F5/F6/F7 · Shift+F5 (delete) · Shift+F6 (clear) · F8 (convert) · Ctrl+F8 (new symbol) · Enter (play) · Ctrl+Alt+R (rewind) · Home/End · `.`/`,` (step) · Ctrl+. / Ctrl+, (keyframe hop) · Ctrl+Enter (test) · Alt+, / Alt+. (keyframe hop, D10).

### 11.5 View / layers / symbols / text
Ctrl+=/−/1/0 · Ctrl+Shift+Alt+R (rulers) · Ctrl+' (grid) · Ctrl+; (guides) · Ctrl+Shift+/ (snap objects) · Ctrl+Shift+W (work area) · Ctrl+Alt+T (timeline toggle, ours) · Ctrl+L (library) · Ctrl+K (align) · Ctrl+J (document) · Ctrl+E (edit symbols) · Ctrl+B (break apart) · Ctrl+T (font) · Ctrl+Shift+T (paragraph) · Ctrl+←/→ (kerning) · Ctrl+Shift+Alt+C (optimize) · Ctrl+Shift+H (shape hint).

### 11.6 Our additions (Part 29.11)
O (onion) · Shift+O (onion outlines) · Alt+O (edit multiple) · D (expose same drawing) [W1] · Ctrl+Shift+P (play nested clips) · Ctrl+Shift+G (graph editor) · Cmd+K (palette).

### 11.7 Duplicate-shortcut detection (documented)
- `Ctrl+Shift+Z` = Redo **and** (legacy) Remove Transform → **reassigned (ours)**.
- `U` = Width (was Deco legacy) · `Y` = Paint Brush (was Pencil legacy).

---

## 12. DIALOG INVENTORY  [Parts 01/11/12/16/18/22/26/27/28/29 · C-07 · STM-MODAL]

Every dialog/modal: primary/secondary/cancel/close · Esc=cancel · focus trap · outside-click (configurable) · ≤90% viewport · mobile full-sheet · unsaved-change behavior.

| Dialog | Fields / buttons | Source |
|---|---|---|
| **New Document** | platform/type · size (W/H) · fps · background · units | Part 01 §1.7 |
| **New from Template** | template gallery | Part 01 §1.2.1 |
| **Document Properties** (Ctrl+J) | W/H · units · fps · bg · auto-save · advanced | Part 26.1 |
| **Convert to Symbol** (F8) | Name · Type · Registration 9-grid | Part 11.2 |
| **New Symbol** (Ctrl+F8) | Name · Type · Registration | Part 12.2.2 |
| **Scale and Rotate** (Ctrl+Alt+S) | scale % · rotation ° | Part 04.8 |
| **Rectangle/Oval Settings** (legacy) | corner radius / angles+hole → ours: always-visible Options | T2B.4/5 |
| **Layer Properties** | name · type · outline color · height · visibility | Part 07.5 |
| **Frame Label** | label name + type (name/comment/anchor) | Part 08/26.6 |
| **Frame Sound** | asset dropdown · sync · loop · trim · effect | Part 26.6/26.8 |
| **Create Lip Syncing** | 12 visemes → frame map · audio layer · Sync | Part 18.3 · C-29 |
| **Font Embed** | glyph subset ranges · chars-used | Part 22.2/26.5 |
| **Import (format-specific)** | PSD per-layer/flatten/movie-clip + registration + compression | Part 27 · C-30 |
| **Export Image/GIF/Video/Sequence** | format · scale · fps · quality · loop · range · palette · dither · audio | Part 28 · C-31 |
| **Publish Settings** | target · output · preloader · spritesheets · transparency · loop · audio | Part 28.5 |
| **Find & Replace** | scope (text/font/color/symbol/sound) · find · replace · preview | Part 01 §1.2.2 |
| **Preferences** (Ctrl+U) | general · contact-sensitive · shift-select · auto-key · onion · wand | Part 01 §1.2.2 |
| **Keyboard Shortcuts** (Ctrl+Shift+Alt+K) | list · rebind · conflict warning · reset · import/export | Part 29.12 · C-32 |
| **Hold N frames** (ours) | frame count | C-19 |
| **Go-to-frame** (ours) | frame number | C-05 |
| **Delete layer/symbol/scene** | confirm modal (dependents / in-use / last-guard) | Parts 20/12/25 |
| **Unsaved-change / Discard** | Discard / Save / Cancel | §6 |

### Dialog state machine (STM-MODAL)
CLOSED → OPENING → OPEN → SUBMITTING → ERROR | CLOSING → CLOSED. Focus trapped; Esc=cancel; one modal at a time (incompatible → queue).
