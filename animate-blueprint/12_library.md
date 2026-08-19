# PART 12 — LIBRARY
### The asset database: import, create, rename, duplicate, delete, organize, folders, search, preview, linkage, export, reuse, replace, update instances — every capability, control-by-control.

---

## 12.0 What the Library is

The Library is the document's **asset database** — the single store of every **symbol**, imported **bitmap**, imported **sound/video**, **brush**, and **component**. It is the project's asset graph root: symbols reference other symbols; instances reference symbols; the Library holds the definitions.

- **One Library per document** (each open doc has its own).
- **Not a file browser** — it stores assets *inside* the project (references + imported data).

### Data model

```jsonc
"library": [
  { "id":"arm", "name":"arm", "kind":"symbol|bitmap|sound|video|brush|component",
    "folderId": null, "order": 3,
    // per kind:
    "symbolType":"graphic", "timeline":{...},              // symbol
    "assetId":"bmp_01", "width":512, "height":512, "dataRef":"assets/bmp_01.png",  // bitmap
    "durationMs": 4200, "sampleRate":44100, "dataRef":"assets/voice.mp3"            // sound
  }
]
```

---

## 12.1 Panel anatomy (control-by-control)

| Control | Icon concept | Action | Data change |
|---|---|---|---|
| **Asset list** | rows (icon + name + kind + use-count) | select / double-click to edit (symbol) | selection state |
| **Preview window** | thumbnail / waveform / video | shows the selected asset (symbol preview = its frame 1; sound = waveform; button = clickable preview) | view only |
| **Search box** | magnifier | filters the list by name substring | filter state |
| **New Symbol** button | + with symbol glyph | Create empty symbol → edit mode (Part 11.3) | adds symbol |
| **New Folder** button | folder | create folder (assets can nest) | adds folder |
| **Properties** (i) | info | rename/type/linkage/export options | asset metadata |
| **Delete** (trash) | trash | delete asset (prompt if used by instances → "unused only" default) | removes asset (+ optionally its instances) |
| **Sort / view menu** | gear | sort by name/kind/date; icon vs list view; expand/collapse folders | view state |
| **Use-count column** | number | how many instances reference this asset | derived |
| **Linkage column** (legacy AS3) | id text | runtime export identifier | asset metadata |

---

## 12.2 Every Library capability (spec)

### 12.2.1 Import asset
- Drag a file (PNG/JPEG/SVG/AI/MP3/WAV/…) into the panel, or File > Import > Import to Library (Part 27). The asset lands in the Library (and, if "to Stage", an instance is also placed at the current frame).
- Imported **bitmaps** become `bitmap` assets (reusable fills + placed instances).
- Imported **audio** becomes `sound` assets (placed on audio layers — Part 17).

### 12.2.2 Create symbol
- **New Symbol** (Ctrl+F8) = empty symbol → edit mode.
- **Convert to Symbol** (F8) = wrap stage selection → symbol + instance (Part 11.2).
- **Drag selection into the Library** = same as Convert to Symbol (default type prompt).

### 12.2.3 Rename
- Double-click the name (or Properties). Renaming a symbol **does not break instances** (they reference by ID, not name — our design rule).

### 12.2.4 Duplicate
- Right-click → Duplicate: clones the **definition** (deep-copies its timeline + nested refs) with a new name. Instances keep pointing at the original. Use: vary a symbol without affecting the master (then Swap to the clone — Part 11.6).

### 12.2.5 Delete
- Right-click → Delete. If **in use**, prompt: "N symbols use this asset" → options: cancel / delete asset and **leave instances as raw content** (break-apart them) / (our app) delete asset + its instances.
- **Select Unused Items** (menu) → delete all unused assets in one go (file-size hygiene before publish).

### 12.2.6 Organize (folders)
- Folders group assets (nestable). Assets can be dragged between folders. Folder operations: new, rename, collapse/expand, delete (non-recursive by default).
- **Auto-arrange**: sort assets into folders by kind (symbols/, bitmaps/, sounds/) — our app P2 nicety.

### 12.2.7 Search
- Live substring filter across name (and kind). Search respects folder scope option (search all vs current folder).

### 12.2.8 Preview
- **Symbol**: animated preview (plays its timeline, looped) — Animate shows frame 1 + a play button; our app: full live preview with scrub.
- **Sound**: waveform + play button (with stop).
- **Bitmap**: thumbnail + dimensions.
- **Button**: clickable preview (roll over/press).

### 12.2.9 Linkage (legacy AS3)
- "Export for ActionScript" + identifier — exposes the asset to runtime code. **Historical.** Our app: assets are referenced by ID in the behavior/script layer (no special linkage step).

### 12.2.10 Export asset
- Right-click → Export: save a symbol as its own file (SWF legacy; our app: export symbol as **image/sequence/sprite-sheet**), or export a bitmap/sound to disk.

### 12.2.11 Reuse
- **Drag an asset onto the stage** = place an instance (symbol) / place a bitmap / (sound → only onto an audio layer/frame).
- Instances reference the definition by ID; the use-count increments.

### 12.2.12 Replace (Swap)
- **Swap Symbol** (Part 11.6) from the Properties panel or by dragging a Library symbol **onto a selected instance** (replace in place). This is the Library's "replace" capability.

### 12.2.13 Update instances
- Editing a symbol (Part 11.3) **updates all instances automatically** — the Library is the single source of truth. There's no manual "update" step; the use-count + live preview make the propagation visible.
- **Update from file** (our app P2): re-import an external PNG that replaced a bitmap asset → all its instances refresh.

### 12.2.14 Open external library
- **File > Import > Open External Library** — open another project's Library **read-only** and drag assets from it into the current doc (cross-project reuse without merging projects).

---

## 12.3 Library ↔ rest-of-app interactions

- **Stage**: drag-out = instantiate; drag-onto-instance = swap; F8 = convert.
- **Timeline**: audio assets dragged onto audio layers (Part 17); symbol instances placed on frames.
- **Properties**: selecting an instance shows its symbol's name + Swap button (opens Library).
- **Publish/Export** (Part 28): the Library determines what's bundled (unused assets can be excluded — file-size option).
- **Undo**: Library ops (create/rename/delete/duplicate) are Commands (Part 36).

---

## 12.4 BUILD CHECKPOINT M3 (library slice)

- [ ] Asset list + preview (symbol anim preview, sound waveform, bitmap thumb) + search + folders + sort.
- [ ] Import (bitmap/vector/audio) into Library; drag-to-stage instantiate.
- [ ] Create/rename/duplicate/delete with use-count + "unused only" deletion; delete-in-use prompt.
- [ ] Swap-from-library (drag onto instance).
- [ ] Edit symbol → all instances update (live preview).
- [ ] Open external library (read-only cross-doc reuse).
- [ ] Library ops are undoable; assets referenced by ID (rename-safe).

*Next: `13_character_animation.md` — the complete character pipeline: artwork → parts → symbols → hierarchy → pivots → bones → IK → poses → animation → reusable clips.*
