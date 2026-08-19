# 12_INPUT_ENGINE — MOD-INPUT · MOD-TOUCH · MOD-KBD

## Gesture bus (REQ-PLAT-001; F-31)
```
DesktopAdapter(mouse/kbd/stylus) ─┐
TouchAdapter(finger/pen)          ─┴▶ GestureBus → normalized Gesture{type,points,modifiers,pressure,tilt}
                                        Gesture → Tool.onPointerDown/Move/Up (single tool interface, Part 01 §1.3.2)
```
Gestures: tap, double-tap, long-press(500ms), drag, pinch, twist, two-finger-pan. One codebase; only adapters differ.

## Pointer capture (C-§22; REQ-PLAT)
- On pointerdown (drag-capable): `setPointerCapture`. Events handled: down/move/up/cancel/leave.
- `lostpointercapture` ⇒ treat as cancel (revert preview) — pointer never lost mid-drag.
- Multi-touch: single-pointer ownership for a drag; second finger = pan/pinch (no selection).

## Keyboard (MOD-KBD; C-§24)
- Shortcut resolution context-scoped; conflict modal; Tab/Enter/Space/Esc semantics from C-35.
- Modifier mapping: Shift (constrain/toggle), Alt (center/opposite/duplicate-drag/others), Ctrl/Cmd (temp-Selection, non-contiguous frames).

## Touch (MOD-TOUCH; C-33)
- 44px targets; loupe (finger-offset bubble) for anchors/handles/pivots/bones/pins.
- Select-mode = Shift replacement; region-lock protects raw shapes; two-finger = pan (never selection); palm rejection.
- Persistent toolbar: Undo/Redo/Select-mode/Constrain/Alt/Onion/Play/Keyframe/Delete + back.

## Stylus
- Pressure/tilt → width (draw); hover = cursor only (no selection); barrel = context menu; 1px tolerance.
- Degrade gracefully if pressure/tilt unsupported (constant width) — F-31 T.

## Shortcut defaults (subset, full = F-29)
V/A/Q/F/L/P/T/N/R/O/Shift+Y/Y/B/E/U/I/K/S/M/C/H/Z · F5/F6/F7 · Shift+F5/F6 · Ctrl+A/Shift+A · Ctrl+B/G/U · Ctrl+E · Ctrl+J · Ctrl+Enter · O/Shift+O/Alt+O (onion) · Esc (exit one level) · Ctrl+Enter (exit to root).

## Acceptance
- **REQ-PLAT-001-A**: Given touch device; Then tap=select, long-press=context, two-finger=pan, pinch=zoom — selection never triggered by two-finger.
- **C-§22-A**: Given drag in progress; Then pointer-cancel mid-drag reverts preview and emits no command.
