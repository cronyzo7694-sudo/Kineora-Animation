# PART 30 — CONTEXT MENUS
### Right-click (long-press) menus for stage, object, shape, symbol, timeline, layer, frame, library asset, audio, scene — every command explained.

> Every context menu is **context-scoped**: it shows only commands valid for the target. Implementation: a `ContextMenuBuilder` maps `(hitTarget, selection, tool, clipboard, doc-state)` → an ordered command list; each command is enabled/disabled by predicates. On mobile, long-press opens the same menu (Part 31).

---

## 30.1 Stage (empty area / pasteboard)

| Command | Does |
|---|---|
| Paste | Insert clipboard content at the click point. |
| Paste in Place | Insert at the same coordinates as the source. |
| Select All / Deselect All | Selection (Part 03.3.5). |
| New Symbol / Convert to Symbol | (if relevant) create a symbol. |
| Document Properties | Open document settings (Part 01 §1.7). |
| Grid / Guides / Rulers | Toggle view aids (Part 01 §1.4.4). |
| Arrange (front/back) | (if objects exist) z-order. |
| Timeline actions | Insert frame/keyframe (when a timeline context exists). |

---

## 30.2 Object (generic — groups, drawing objects, bitmaps)

| Command | Does |
|---|---|
| Cut / Copy / Paste | Clipboard ops (Part 36). |
| Duplicate | Copy + offset. |
| Convert to Symbol (F8) | Wrap into a symbol (Part 11.2). |
| Break Apart (Ctrl+B) | Flatten one level (Part 06.8). |
| Edit / Edit in Place | Drill into group/object (Part 03.4). |
| Arrange | Bring to Front / Forward / Backward / Send to Back / Lock / Unlock. |
| Transform | Flip H/V, Rotate 90°, Scale & Rotate, Remove Transform (Part 04). |
| Export PNG… | Export the object as an image (Part 28). |

---

## 30.3 Shape (raw shape / drawing object)

Everything in 30.2 **plus** shape-specific:

| Command | Does |
|---|---|
| Convert Lines to Fills | Stroke → fill outline (Part 05.1.13). |
| Expand Fill / Soften Fill Edges | Morphological ops (Part 06.8). |
| Smooth / Straighten / Optimize | Path cleanup (Part 06.4.3). |
| Add Shape Hint | Add a morph hint (Part 09.3.2) — only in a shape tween. |
| Combine Objects | Union / Intersect / Punch / Crop (Part 06.5). |
| Trace Bitmap | (if bitmap) vectorize (Part 27.1). |

---

## 30.4 Symbol instance

| Command | Does |
|---|---|
| Edit / Edit in Place / Edit Symbol | Enter edit modes (Part 11.3). |
| Swap Symbol | Replace with another symbol, keep transform (Part 11.6). |
| Duplicate Symbol | Clone the definition for this instance (Part 11.6). |
| Break Apart | Detach from symbol → raw content (Part 11.7). |
| Convert to Symbol | Wrap again (nested symbol). |
| Set Instance Name | (scripting handle). |
| Arrange / Transform / Export PNG | as 30.2. |

---

## 30.5 Timeline (header / empty grid)

| Command | Does |
|---|---|
| Insert Frame / Keyframe / Blank Keyframe | F5/F6/F7 (Part 07.4). |
| Insert Scene | Add a scene (Part 25). |
| Timeline preferences | Row height, cell colors, onion defaults. |

---

## 30.6 Layer (right-click a layer row)

| Command | Does |
|---|---|
| Insert Layer / Folder | Add above. |
| Delete Layer | Remove (prompt if dependents). |
| Duplicate Layer | Deep copy. |
| Rename | Inline rename. |
| Layer Properties | Type, outline color, height (Part 20.3). |
| Mask / Unmask | Convert mask type (Part 21.1). |
| Show All / Lock Others / Hide Others | Batch state (Part 20.2). |
| Distribute to Layers | (selection) split objects to own layers (Part 07.4.13). |
| Copy / Paste Layer | Cross-timeline layer copy. |

---

## 30.7 Frame (right-click a frame cell)

| Command | Does |
|---|---|
| Insert Frame / Keyframe / Blank Keyframe | Part 07.4. |
| Delete Frame / Clear Keyframe | Part 07.4. |
| Remove Frames | Delete + leave gap (Part 07.4.6). |
| Copy / Cut / Paste Frames | Frame clipboard (Part 07.4.7). |
| Reverse Frames | Reorder keyframes (Part 07.4.10). |
| Convert to Keyframes / Blank Keyframes | Bake (Part 07.4.12). |
| Create Motion / Classic / Shape Tween | Tween spans (Part 09). |
| Insert Pose | (pose layer) Part 14.6. |
| Sync (graphic) | sync nested graphic loops (Part 07.4.14). |
| Actions | (frame) open behavior editor (Part 01 §1.12). |

---

## 30.8 Library asset (right-click in Library)

| Command | Does |
|---|---|
| Edit | (symbol) open edit mode. |
| Duplicate | Clone the asset. |
| Rename | Inline rename. |
| Delete | Remove (prompt if in use — Part 12.2.5). |
| Select Unused Items | Find deletable assets. |
| Properties | Metadata (type, linkage legacy, export options). |
| Export | Save the asset to disk. |
| Update from file | (bitmap) re-import a newer file (Part 12.2.13). |
| Move to folder / New Folder | Organize (Part 12.2.6). |

---

## 30.9 Audio (audio keyframe / waveform)

| Command | Does |
|---|---|
| Sound Properties | Sync / loop / trim / effect (Part 17.3). |
| Edit Envelope | Volume curve (Part 17.4). |
| Stop Sound | Insert a Sync=Stop keyframe (Part 17.3). |
| Remove Sound | Detach from the keyframe. |
| Export Audio | Save the sound asset to disk. |

---

## 30.10 Scene (Scene panel)

| Command | Does |
|---|---|
| Add Scene | Append. |
| Duplicate Scene | Deep copy timeline. |
| Rename | Inline. |
| Delete | Remove (prompt). |
| Reorder | (drag in panel). |

---

## 30.11 BUILD CHECKPOINT M5 (context-menu slice)

- [ ] ContextMenuBuilder with enable/disable predicates; every menu above implemented.
- [ ] Long-press opens the same menu on touch (Part 31).
- [ ] Menu commands reuse the same Commands as toolbar/menu (single source of behavior).

*Next: `31_mobile_translation.md` — desktop interaction → mobile equivalent for every feature (drag, right-click, shortcuts, timeline scrub, multi-select, transform handles, …).*
