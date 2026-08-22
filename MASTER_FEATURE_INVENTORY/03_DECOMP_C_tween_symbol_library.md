# §3. FULL FEATURE DECOMPOSITION — PART C: TWEEN · MOTION PATH · SYMBOL · LIBRARY

---

## 3.11 TWEENING  [F-09-01..08 · Part 09 · C-18 · REQ-TWN]

### 3.11.1 Motion Tween  [F-09-01 · REQ-TWN-001]
- **Starting state:** tween span on a tween layer + target (symbol/text) at first frame (property keyframe).
- **Ending state:** change a property at a playhead → **per-property keyframe** at that frame. No single "end keyframe".
- **Interpolation:** per-property numeric (position/scale/rotation/skew/alpha/color/filters).
- **Supported properties:** x,y (independent) · scaleX,scaleY · rotation (+orientation) · skewX,skewY · alpha · tint/brightness · filters (per-filter per-param) · 3D (legacy).
- **Unsupported:** raw-shape geometry (→shape tween) · symbol swap (discrete) · pivot (static per span) · labels/actions · bones (→pose layers).
- **Auto-wrap:** non-symbol target → prompt "Tweening requires a symbol — convert?" (never silent).
- **Tween layer blocks drawing** (no drawing in tween layer). Target-removed = hollow dot (keys kept). **Split Motion** (D2) splits span at a frame.
- **Keyframe behavior:** per-property independent; View Keyframes submenu filters which property's keys show.

### 3.11.2 Motion tween property matrix  [F-09-02] — supported/unsupported table (§3.11.1).

### 3.11.3 Classic Tween  [F-09-02 in queue → F-09-03 · REQ-TWN-002]
- Two whole-frame keyframes + same object + span flag. Whole-state interpolation (position/scale/rotation/skew/alpha/color/filters in ONE pair — no per-property keys).
- **Rotate:** None / Auto / CW / CCW + loops. **Orient to path / Snap / Sync (graphic) / Scale** options.
- **Broken tween** = dashed (missing/different endpoint) → holds start.
- **Auto-wrap:** non-symbol → "tween1" symbol (with warning).
- **Motion guide** (legacy path, §3.12.5).
- **Copy Motion / Paste Motion** (JSON, ours = XML equivalent).
- Easing: single slider −100..+100 + custom ease graph.

### 3.11.4 Shape Tween  [F-09-04 · REQ-TWN-003]
- Two raw-shape keyframes + span flag. **Morphing:** anchor correspondence (by index; subdivide fewer) → per-anchor lerp → fill color lerp → shape hints override → width-profile morph.
- **Blend:** distributive / angular. **Shape hints** (Modify ▸ Shape ▸ Add Shape Hint, Ctrl+Shift+H).
- Unsupported: symbols/groups/text/bitmaps → prompt Break Apart. Broken = dashed.

### 3.11.5 Easing engine  [F-09-05 · REQ-TWN-004 · MOD-EASING]
- **Built-ins (Penner):** linear · quadratic/cubic/quartic/quintic/sine/exponential/circular (in/out/inOut) · back · elastic · bounce · steps(n).
- **Slider** −100..+100 (classic/shape) = quadratic in/out strength.
- **Custom Bézier** graph (x=frames 0–100%, y=%change; Ctrl/Cmd+click adds points).

### 3.11.6 Easing & motion presets  [F-09-06]
- Per-property presets + saved custom (cross-doc JSON, ours) + **motion presets** (reusable whole tween, drag-onto-object).

### 3.11.7 Tween data model  [F-09-07 · §33.8/33.10]
- Motion span: `{type:'tween', kind:'motion', targetId, start, duration, properties:{per-prop key arrays}, path (derived)}`.
- Classic/shape: `{type:'classicTween'|'shapeTween', start, end, ease, customEase[], shapeHints[], rotate{mode,count}}`.
- Motion preset: `{id, name, kind, properties}`.

### 3.11.8 Graph editor (AE-style)  [F-09-08 · REQ-TWN-006 · W4]
- Rows = properties; graph = time×value; keys = dots (**roving = round**); **dashed curve = ease-applied actual values**; multi-select + bulk edit; Ctrl+drag key = time-only.
- **Roving keys** (D4) = spatial X/Y/Z constant-speed (arc-length reparameterization).

---

## 3.12 MOTION PATH  [F-10-01..06 · Part 10 · C-20 · REQ-TWN-005]

### 3.12.1 Path anatomy & data  [F-10-01]
- Path derived from x/y keys (two views, one truth). `path = {anchors[{x,y,h1x,h1y,h2x,h2y}], closed, vertexFrames[]}`.
- Terms: vertex (per position key), Bézier handle/tangent, segment, arc position.

### 3.12.2 Position interpolation  [F-10-02]
- **Parameter** (default, eased — matches Animate) vs **constant-speed** (arc-length table, ours P1).

### 3.12.3 Orientation & rotation-along-path  [F-10-03]
- No-orientation · **Orient to Path** (face tangent) · rotation-along-path (adds to own rotation). Forward axis = +X (or user-set).

### 3.12.4 Path editing  [F-10-04]
- Move vertex (Selection click) · drag segment (no click-to-select first) · pull handles (Subselection) · add vertex (click / right-click Add Keyframe) · delete vertex · convert point (corner↔smooth).
- **Time-aware:** vertex drag changes position-at-keyframe-time, not timing (move the keyframe to re-time).

### 3.12.5 Path duplication & reversal  [F-10-05]
- Copy/Paste Motion · Reverse Frames (reverses time) · Reverse Path Direction (ours, P2).

### 3.12.6 Motion guide layers (legacy)  [F-10-06]
- Guide layer path + linked tweened layer; pivot snaps to start/end; Orient to Path + Snap. Compatibility feature (modern motion path is primary).

---

## 3.13 SYMBOL SYSTEM  [F-11-01..14 · Part 11 · C-21 · REQ-SYM]

### 3.13.1 Symbol concept & types  [F-11-01 · REQ-SYM-001]
- **Symbol (definition)** = reusable self-contained timeline in Library. **Instance** = placed reference (own transform/color/name; shares definition content).
- Editing definition → all instances update; editing instance → only that instance.

### 3.13.2 Graphic symbol  [F-11-02] — parent-driven playback; loop/play-once/single-frame + first-frame; no interactivity/sound; smaller file.

### 3.13.3 Movie Clip  [F-11-03] — independent clock (loops forever); interactivity + sound + nested clips; instance name.

### 3.13.4 Button symbol  [F-11-04] — 4 states: **Up / Over / Down / Hit** (invisible hit area).

### 3.13.5 Font symbol (niche)  [F-11-05] — ours = font embedding as document/asset setting (P3), not a symbol type.

### 3.13.6 Convert to Symbol (F8)  [F-11-06 · REQ-SYM-002]
- Dialog: **Name** · **Type** (Graphic/Movie Clip/Button) · **Registration point** (9-point grid TL/TC/TR/ML/C/MR/BL/BC/BR).
- Result: selection wrapped → symbol in Library + instance on stage; instance x/y = registration point landing.

### 3.13.7 Symbol editing modes  [F-11-07 · REQ-SYM-002 · ENG-024]
- **Symbol edit mode** (dbl-click Library / Ctrl+E) · **Edit in Place** (dbl-click instance; dims others) · **Edit in New Window** (D3) · **Edit Selected / Edit All**.
- **Breadcrumb** (`Scene ▸ character ▸ head`) + Back button. **Esc = one level; Ctrl+Enter = root; double-click-outside = exit.** Live instance updates.

### 3.13.8 Graphic loop modes & Frame Picker  [F-11-08]
- **Loop** `(t−firstFrame)%dur+1` · **Play Once** `min(t,dur)` · **Single Frame** `firstFrame`.
- **First frame** field + **Frame Picker** panel (visual frame browser — core to lip-sync). Movie clips ignore these.

### 3.13.9 Instance properties  [F-11-09 · REQ-SYM-003]
- **Color effect:** mode none/brightness/tint/alpha/advanced + value. (Alpha = top-level slider [W6].)
- **Filters:** dropShadow/blur/glow/bevel/gradientGlow/gradientBevel/adjustColor + per-filter params + enable.
- **Loop** + firstFrame · **instanceName**.

### 3.13.10 Swap / Duplicate Symbol  [F-11-10 · REQ-SYM-003]
- **Swap Symbol** — replace symbol, keep transform/color/name.
- **Duplicate Symbol** — clone definition, point this instance at clone.

### 3.13.11 Break Apart hierarchy  [F-11-11] — instance → raw content (symbol kept) → shapes; one level per Ctrl+B; never deletes Library symbol.

### 3.13.12 Nested animation playback  [F-11-12 · REQ-SYM-004]
- Tree of timelines: sample(node, time) → graphic syncs (driven), movie clip runs free, button state-driven.
- **Live "play nested clips" preview toggle** (default ON) — movie-clip anim visible while authoring.

### 3.13.13 Registration point editing  [F-11-13] — edit symbol → move art relative to crosshair.

### 3.13.14 Symbol data model  [F-11-14 · §33.7] — symbol `{id,name,symbolType,registrationPoint,timeline}` · instance `{symbolId,transform,colorEffect,filters,loop,instanceName}`.

---

## 3.14 LIBRARY  [F-12-01..13 · Part 12 · C-10 · REQ-LIB]

### 3.14.1 Panel anatomy  [F-12-01]
- **Asset list** (icon+name+kind+use-count) · **Preview window** (symbol anim / waveform / bitmap thumb / button clickable) · **Search box** · **New Symbol** · **New Folder** · **Properties (i)** · **Delete (trash)** · **Sort/view menu** · **Use-count column** · **Linkage column** (legacy).

### 3.14.2 Import asset  [F-12-02] — drag file / Import to Library (Part 27).

### 3.14.3 Create symbol  [F-12-03] — New Symbol (Ctrl+F8) · Convert (F8) · drag selection into Library.

### 3.14.4 Rename / Duplicate / Delete  [F-12-04 · REQ-LIB-001]
- Rename (ID-based, rename-safe) · Duplicate (deep-copy definition; instances keep pointing to original) · Delete (prompt if in use: cancel / break instances / delete+instances) · **Select Unused Items**.

### 3.14.5 Folders & organize  [F-12-05] — nestable folders; new/rename/collapse/delete; auto-arrange by kind (P2).

### 3.14.6 Search  [F-12-06] — live substring filter (name+kind); scope (all/folder).

### 3.14.7 Preview  [F-12-07] — symbol animated preview + scrub (ours); sound waveform + play; bitmap thumb + dims; button clickable.

### 3.14.8 Linkage (legacy AS3)  [F-12-08] — historical; ours = ID references in behavior layer.

### 3.14.9 Export asset  [F-12-09] — symbol → image/sequence/sprite-sheet; bitmap/sound → disk.

### 3.14.10 Reuse (drag to stage)  [F-12-10 · REQ-LIB-002] — instantiate; use-count increments.

### 3.14.11 Replace (swap)  [F-12-11] — drag Library symbol onto selected instance.

### 3.14.12 Update instances  [F-12-12] — definition edit propagates automatically; Update-from-file (re-import PNG) P2.

### 3.14.13 Open external library  [F-12-13] — read-only cross-doc drag-in (copy or link mode P2).
