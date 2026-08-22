# 08 — SHORTCUTS — Stage / Workspace

> Har shortcut ka exact mapping — Adobe + Kineora — conflict resolution.

## 8.1 Global Shortcuts

| Shortcut | Win | Mac | Context | Command | Owner | When Disabled | TestId |
|----------|-----|-----|---------|---------|-------|---------------|--------|
| New | Ctrl+N | Cmd+N | global | file.new | SYS-02 | always enabled | T-file-new |
| Open | Ctrl+O | Cmd+O | global | file.open | SYS-02 | always | T-file-open |
| Save | Ctrl+S | Cmd+S | global | file.save | SYS-02 | no doc? disabled | T-file-save |
| Save As | Ctrl+Shift+S | Cmd+Shift+S | global | file.saveAs | SYS-02 | no doc | T-file-saveAs |
| Close | Ctrl+W | Cmd+W | global | tab.close | SYS-01 | no doc | T-tab-close |
| Undo | Ctrl+Z | Cmd+Z | global | edit.undo | SYS-03 | history empty | T-edit-undo |
| Redo | Ctrl+Shift+Z | Cmd+Shift+Z | global | edit.redo | SYS-03 | redo empty | T-edit-redo |
| Redo alt | Ctrl+Y | — | global | edit.redo | SYS-03 | same | T-edit-redo |
| Cut | Ctrl+X | Cmd+X | stage selection | edit.cut | SYS-03 | no selection | T-edit-cut |
| Copy | Ctrl+C | Cmd+C | stage selection | edit.copy | SYS-03 | no selection | T-edit-copy |
| Paste Center | Ctrl+V | Cmd+V | global | edit.pasteCenter | SYS-03 | clipboard empty | T-edit-paste |
| Paste In Place | Ctrl+Shift+V | Cmd+Shift+V | global | edit.pasteInPlace | SYS-03 | clipboard empty | T-edit-pasteInPlace |
| Duplicate | Ctrl+D | Cmd+D | stage selection | edit.duplicate | SYS-03 | no selection | T-edit-dup |
| Select All | Ctrl+A | Cmd+A | stage | edit.selectAll | SYS-03 | always | T-edit-selectAll |
| Deselect All | Ctrl+Shift+A | Cmd+Shift+A | stage | edit.deselectAll | SYS-03 | no selection | T-edit-deselect |
| Delete | Del | Del | stage selection | edit.delete | SYS-03 | no selection | T-edit-delete |
| Backspace delete | Backspace | Backspace | stage selection | edit.delete | SYS-03 | no selection | T-edit-delete |

## 8.2 View / Stage Shortcuts

| Shortcut | Command | Owner | Notes |
|----------|---------|-------|-------|
| Ctrl+= / Ctrl++ | view.zoomIn | SYS-04 | factor *2, center view |
| Ctrl+- | view.zoomOut | SYS-04 | /2 |
| Ctrl+1 | view.zoom100 | SYS-04 | 100%, centered |
| Ctrl+0 | view.zoomFit | SYS-04 | Fit in Window |
| Ctrl+Shift+W | view.toggleWorkArea | SYS-04 | Pasteboard toggle |
| Ctrl+R | view.toggleRulers | SYS-04 | Rulers |
| Ctrl+' (apostrophe) | view.toggleGrid | SYS-04 | Grid |
| Ctrl+; | view.toggleGuides | SYS-04 | Show guides |
| Ctrl+Alt+; | view.lockGuides | SYS-04 | Lock guides |
| Ctrl+Shift+E | view.hideEdges | SYS-04 | Hide selection edges |
| H | tool.hand | SYS-13 | Hand tool |
| Z | tool.zoom | SYS-13 | Zoom tool |
| V | tool.select | SYS-13 | Selection |
| R | tool.rect | SYS-13 | Rectangle |
| O | tool.oval | SYS-13 | Oval (future) |
| Space hold | view.tempHand | SYS-04 | Temporary hand |
| Wheel up/down | view.zoomAt | SYS-04 | 1.1 factor at pointer |
| Middle mouse drag | view.pan | SYS-04 | Pan |

## 8.3 Timeline Shortcuts (for merged panel, but listed here)

| Shortcut | Command | Notes |
|----------|---------|-------|
| F5 | timeline.insertFrame | Insert Frame |
| F6 | timeline.insertKeyframe | Insert Keyframe |
| F7 | timeline.insertBlankKeyframe | Blank Keyframe |
| Shift+F5 | timeline.deleteFrame | Delete Frame |
| Shift+F6 | timeline.clearKeyframe | Clear Keyframe |
| Home | timeline.goFirst | First frame |
| End | timeline.goLast | Last frame |
| Enter | control.play | Play |
| . (period) | control.stepForward | Next frame |
| , (comma) | control.stepBackward | Prev frame |

## 8.4 Workspace / Panel Shortcuts

| Shortcut | Command | Notes |
|----------|---------|-------|
| Ctrl+K | palette.open | Command palette — D-3 resolved palette wins over Align |
| Ctrl+L | panel.show('library') | Library |
| F4 | panel.show('properties') | Properties |
| Ctrl+Alt+T | panel.show('timeline') | TimelinePanel |
| Ctrl+J | doc.settings | Document settings dialog |
| Esc | layered | Precedence tree — modal→palette→dropdown→drag→tool→edit depth |
| Ctrl+Enter | context | editDepth>0 → exitRoot, else Test Movie (D-6) |

## 8.5 Conflict Resolution

- **Ctrl+K:** Blueprint says palette=Ctrl+K and Align=Ctrl+K — D-3 final: palette wins, Align loses dedicated key, reachable via Window menu + palette
- **Ctrl+Enter:** D-6 context: editDepth>0 → exitRoot, normal → Test Movie
- **Precedence:** tool > panel > global — e.g., when text input focused, shortcuts skip (input handles keys)
- **Bind-time conflict:** warning modal if same shortcut bound twice

## 8.6 Tool Modifiers

| Modifier | Tool | Effect |
|----------|------|--------|
| Shift | select move | constrain axis? Or proportional scale — for move, Shift = constrain to 45deg? For scale, Shift = constrain proportions |
| Alt | select transform | anchor = center (instead of opposite handle) |
| Shift | rect/oval | constrain to square/circle |
| Alt | rect/oval | draw from center (instead of corner) |
| Ctrl | panel drag | prevent docking (force float) — Adobe |
| Esc | drag | cancel |

## 8.7 Shortcuts Implementation

- File: `animator/ui/src/shortcuts.ts` — already exists — `useShortcutScope` — keep
- File: `animator/ui/src/commands.ts` — command registry — add view/tool commands
- File: `animator/ui/src/menus.ts` — menu items with shortcut labels

## 8.8 Tests

- T-shortcut-zoomIn — Ctrl+= triggers zoomIn
- T-shortcut-pasteboard — Ctrl+Shift+W toggles
- T-shortcut-hand — H switches tool
- T-shortcut-space-tempHand — Space hold switches to hand, release restores
- T-shortcut-esc-precedence — Esc closes modal first, then palette etc

Next: 09_STATE_EVENTS.md
