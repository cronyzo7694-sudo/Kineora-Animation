# EXPORT FORENSIC RESEARCH — IMPLEMENTATION BLUEPRINT

> **STATUS:** RESEARCH CONTRACT (not implementation).  
> **DATE:** 2026-08-23 (Asia/Kolkata).  
> **WORKER:** AI-A (SYS-01→07). Export **engines** remain **SYS-27 / AI-D**.  
> **SCOPE OF THIS INCREMENT:** document the contract. **Do not implement Export. Do not modify `animator/` product code. Do not invent missing requirements.**  
> **NEXT FILE-MENU FEATURE AFTER SAVE (user order, still in force):** **Open** — this document does **not** start File ▸ Open.  
> **PIPELINE:** RESEARCH → DOCUMENTED CONTRACT → CODING AGENTS → TESTING → USER MANUAL QA.

Every important claim is source-labelled. Where Blueprint / locked specs are silent: **AMBIGUOUS / BLOCKED / NOT SPECIFIED** — never silently promoted to a product decision.

---

## 1. Executive Summary

**Export** is a **one-shot, non-mutating, derived render** of the document (image / sequence / GIF / video / audio). It is **not** Save and **not** Publish. `[BLUEPRINT Part 28.0]` `[H00 §7]` `[H08]`

**Publish** is a **configured pipeline** (HTML5/WebGL, profiles). Also non-mutating. `[BLUEPRINT Part 28.0 / 28.5 / 28.9]`

**Save** persists the lossless master (`JSON + assets/`). Dirty → CLEAN. History preserved. `[BLUEPRINT Part 28.8]` `[H05]`

**Ownership (binding):**

| Concern | Owner | This document's rule |
|---|---|---|
| File-menu entry, commandId, enable/disable, handoff | **SYS-02 H08** | Do not absorb engines |
| Export / publish **engines** | **SYS-27 (AI-D)** | Only SYS-27 implements MOD-EXPORT |
| Persistence of the project file | **SYS-28** | Export must not write DOCUMENT |
| Event `export:done{format, path}` | **SYS-27 producer** | SYS-02 never emits `[CROSS_SYSTEM_CONTRACT §D]` |
| `st.export` status cell | **SYS-01 chrome** | Must consume `export:done` `[H12]` |

**Current honest status (evidence, not authority):** SYS-27 is **PARTIAL+**. Working: still-image dialog (SVG/PNG/JPEG/WebP), SVG sequence + fps sidecar, HTML5 self-contained HTML player, `export:done` emitted by SYS-27. Missing / honest toasts: GIF, MP4/WebM, Movie, raster PNG/JPEG sequence, audio-only, Publish Settings, Publish Profiles, STM-EXPORT, native dest picker, `st.export` consumer. Import is **BLOCKED** on asset entities (`BLK-D-006`). `[CODE]` `[AI-D_REPORT Session 4]` `[INT-AID-003]`

**This document is the contract later coding agents must follow.** It does not close product AMBs. It does not mark SYS-27 COMPLETE.

---

## 2. Authority ranking and source labels

**Authority order (binding, same as SYS-02 / CROSS_SYSTEM_CONTRACT):**

1. **Blueprint** (`animate-blueprint/`, `ANIMATE_BLUEPRINT_MASTER.md`)
2. **Phase 2** deep-research (`F-28-01..11`)
3. **Phase 2.5** UI contracts (`C-31`) — **UI contract only**; never impl truth (FL-0017)
4. **Phase 3** engineering (`eng 14`, `eng 04` STM-EXPORT, `REQ-EXP-*`)
5. **Approved decisions** (`DECISIONS.md`)
6. **Approved forensic specs** (H08 / H09 / H12 / SYS-02_file.md / CROSS_SYSTEM_CONTRACT)
7. **Official Adobe** (comparison / evidence — Blueprint wins on conflict)
8. **Code and tests** = **EVIDENCE ONLY**. Never silently turn code into spec.

**Labels used in this file:**

| Label | Meaning |
|---|---|
| `[BLUEPRINT]` | animate-blueprint / master Part |
| `[SYS-02]` `[H08]` `[H09]` `[H12]` `[H00]` | SYS-02 forensic |
| `[SYS-01]` | SYS-01 locked bus / status |
| `[SYS-27]` | SYS-27 ownership (engines) |
| `[ENGINEERING]` | Phase 3 eng 04/06/14, REQ-* |
| `[FORENSIC]` | F-28-01..11 |
| `[C-31]` | Phase 2.5 UI contract |
| `[CODE]` | current `animator/` — evidence |
| `[ADOBE]` | official helpx.adobe.com |
| `[MDN]` `[W3C]` | web platform |
| `[FFMPEG]` | encoder reference (not in repo) |
| `[FORMAT-SPEC]` | PNG/JPEG/GIF/MP4/WebM specs |
| `[INFERENCE]` | derived, **not** a requirement |
| `[BLUEPRINT OVERRIDE]` | Blueprint wins over Adobe |
| `[NOT SPECIFIED]` `[AMB-EXP-*]` `[BLOCKED]` | do not invent |

**Hard rules for coding agents:**

- Never disguise `[INFERENCE]` or `[CODE]` as a requirement.
- Never invent AMBs as product decisions.
- One SYS owner. H08 is **handoff only**.
- Do not add `export:progress` to the locked bus without an INT + Leader verification. `[CROSS_SYSTEM_CONTRACT §D]` lists `export:done` only.

---

## 3. Reconstruct / research-time repo state

| Item | Value |
|---|---|
| Research date | 2026-08-23 Asia/Kolkata |
| HEAD at research start | `7ab803a0120e624fa82dc30f9be9136dd5e79711` |
| `origin/main` at research start | **equal** `7ab803a` (fetched, clean tree) |
| Remote | `https://github.com/cronyzo7694-sudo/Kineora-Animation.git` (no token in URL) |
| Git identity | `cronyzo7694-sudo` / `cronyzo7694@users.noreply.github.com` |
| Prior File ▸ Save (already on main) | `094f08ff429cc9e99ac67a7f68bf9a4c5494c12e` |
| Then on origin (already FF'd) | `290cc7d` Insert ▸ Scene · `401370c` cargo-fmt · `7ab803a` BUG-D-001 docs |
| This increment product-code delta | **none** |
| PAT | Previous Save-push PAT is **compromised (BLK-B-005)**. **Do not reuse.** This turn has **no rotated PAT**. |

**Not claimed this increment:** cargo / vitest / wasm-pack / Tauri results for new Export code (none written). Pre-existing tests are **listed as evidence**, not re-executed as PASS in this research turn.

**Do not absorb:** `BUG-D-001` (pre-existing failing `sys03-edit` test on main; owner AI-B/AI-A). `[7ab803a]`

---

## 4. What Export means (vs Save / Publish / Import)

### 4.1 Binding definitions

| Term | Definition | Mutates doc? | Undo? | Dirty? | Persistence |
|---|---|---|---|---|---|
| **Export** | One-shot derived output of current frame / scene / range (image, GIF, sequence, video, audio). `[BLUEPRINT 28.0]` | **No** | **No** | **No** | output file only |
| **Publish** | Configured pipeline from the document via Publish Settings / Profiles (HTML5/WebGL…). `[BLUEPRINT 28.0 / 28.5 / 28.9]` | **No** | **No** | **No** | output + SYS-27 profiles |
| **Save** | Persist lossless master (JSON + `assets/`). `[BLUEPRINT 28.8]` `[H05]` | No content mutation; snapshot advances | No (history **preserved**) | DIRTY → CLEAN | DOCUMENT |
| **Import** | Bring external assets into the document. `[H08 §6.1]` | **Yes** | **Yes** (one atomic command) | **Yes** | DOCUMENT |

Universal render rule: every exporter samples the timeline with the **same evaluator as playback** so authoring = output. `[BLUEPRINT 28.0]` `[REQ-SYS-003]` `[REQ-EXP-002]`

Camera (Part 16) **must apply identically in all exporters** when a camera exists. `[BLUEPRINT 28.0]` `[FORENSIC F-28 M.3]` Today the model has **no camera entity** → this requirement is **BLOCKED**, not skippable-by-invention. See §12 / §20.

Project file is the master; exports are derived. `[BLUEPRINT 28.8]`

### 4.2 What Export is **not**

| Item | Classification |
|---|---|
| Save / Save As / Save as Template / Save All | Save family. Save All = Adobe-only, excluded. `[SYS-02 §23]` |
| Publish Preview | `[ADOBE FEATURE — NOT IN BLUEPRINT]` excluded `[SYS-02 §23]` |
| SWF / OAM / AIR | Legacy / historical. Not implemented. AIR Settings = HIDDEN. `[BLUEPRINT 28.6]` `[SYS-02 §23]` |
| File Info / ActionScript Settings | Adobe-only, excluded `[SYS-02 §23]` |
| Test Movie (`control.test`) | SYS-09 menu → SYS-27 handoff toast today. Not File ▸ Export. `[CODE commands.ts]` |
| Workspace layout import/export | `[NOT SPECIFIED — DEFERRED]` (SYS-01 D-2) |

---

## 5. Ownership, commands, handoffs

### 5.1 One owner

```
File menu / shortcut / enable
        │
        ▼
SYS-02  file.export(format) / file.publish*()     ← H08 HANDOFF ONLY
        │
        ▼
SYS-27  MOD-EXPORT  (STM-EXPORT / encode / write)
        │
        ▼
export:done{format, path}   producer = SYS-27 ONLY
        │
        ├── SYS-01  st.export  (consumer — not yet wired) [INT-AID-003]
        └── Output log
```

H08 **never** implements SYS-27 internals (FL-0016). `[H08 §14 / §16]`

### 5.2 Canonical commands `[H09 §5]` `[H08 §8]`

| commandId | Input | Shortcut | Precondition | Enabled | Dirty | Undo | Result event |
|---|---|---|---|---|---|---|---|
| `file.export(format)` | `image` \| `video` \| `gif` \| `movie` \| `sequence` | Ctrl+Shift+R (binds `image`) `[H09]` | doc open | doc open | none | no | `export:done{format, path}` |
| `file.publishSettings()` | — | Ctrl+Shift+F12 | doc open | doc open | none | no | — (dialog) |
| `file.publish()` | — | Shift+Alt+F12 | doc open | doc open | none | no | `export:done` (publish) |
| `file.publishProfiles()` | — | menu only | doc open | doc open | none | no | — (dialog) |
| `file.import(target)` | `stage` \| `library` | Ctrl+R / Ctrl+I | doc open | doc open | YES | YES | `library:changed` + `document:changed` |

No-document → Export/Publish/Import = **DISABLED-BY-CONTEXT** (reason: `"no document"`). Not hidden, not silent no-op. `[H09 §9]` `[H00]`

### 5.3 H08 UI / error / cancel (handoff contract)

| Field | Export | Publish |
|---|---|---|
| UI | toast + open-folder `[H08 §6.2]` | Output log / dialog `[H08 §6.3]` |
| Error | log + retry (STM-EXPORT FAILED) | Output log |
| Cancel | SYS-27 (STM-JOB / STM-EXPORT) | SYS-27 |
| Engine unavailable | honest `"engine not attached"` | same |
| Persistence | output file (no DOCUMENT state) | profiles = SYS-27 boundary |

### 5.4 Who may emit what

| Event | Producer | SYS-02 may emit? |
|---|---|---|
| `export:done{format, path}` | **SYS-27** | **NO** `[CROSS_SYSTEM_CONTRACT §D]` `[H08 §9]` `[INT-AID-003]` |
| `document:changed` | Command post-do | **NO** on export |
| `saving:changed` | SYS-28 (save only) | **NO** on export |

---

## 6. Blueprint requirements (authoritative product scope)

### 6.1 Part 01 §1.2.1 File menu `[BLUEPRINT]`

| Menu | Action | Shortcut |
|---|---|---|
| File ▸ Export ▸ Export Image / Video / Animated GIF / Movie / PNG-Sequence | Render output (Part 28) | Ctrl+Shift+R |
| File ▸ Publish Settings / Publish / Publish Profiles | Configure & run pipeline | Ctrl+Shift+F12 / Shift+Alt+F12 |

### 6.2 Part 28 — format matrix (verbatim meaning)

**28.1 Image**

| Setting | Requirement |
|---|---|
| Format | PNG (lossless + alpha), JPEG (lossy, **no alpha**), SVG (vector), WebP (**our app**) |
| Resolution | Match Movie (stage size) **or custom W×H**; Scale **1× / 2× / 4×** (supersampling) |
| Transparency | PNG alpha preserved; stage background transparent if **"no color"** (Part 01 §1.7) |
| Quality | JPEG **0–100** |
| Which frame | **Current frame** (or a chosen frame). Adobe `#Static` is comparison only; Blueprint: current or chosen |

**28.2 PNG / JPEG sequence**

- Every frame **or a range** (`#First`–`#Last` in Animate; **our app: a frame-range field**).
- Names: `name_0001.png`, `name_0002.png`, …
- Settings: format, scale/resolution, PNG transparency, JPEG quality, **FPS in a sidecar** for later mux.

**28.3 Animated GIF**

| Setting | Requirement |
|---|---|
| Playback | Static (single frame) or Animated |
| Loop | Continuously / N times |
| Dimensions | Match Movie or custom; scale |
| FPS | GIF frame rate (often 12/24/30) |
| Colors | Palette ≤256; **optimize**; **dither** (ordered / diffusion / none); **interlace** |
| Transparency | Optional transparent background |
| Range | All frames or `#First`–`#Last` (our app: frame-range field) |
| Audio | **None — GIF is silent** (warn the user) `[FORENSIC L.1]` |

**28.4 Video**

| Setting | Requirement |
|---|---|
| Format | MP4 (H.264) + **our app WebM (VP9)** |
| Resolution | Stage or custom; scale |
| FPS | Default = **document fps** |
| Quality | CRF / bitrate |
| Audio | Include track; codec AAC; bitrate kbps; mux **sample-exact per frame** (Part 17.6) |
| Range | **Whole document / scene / frame range** |
| Motion blur | Our app, **P2** — not P0 |

**28.5 HTML5 Canvas publish**

Produces **HTML + JavaScript + asset folder**:

- Output name + folder; JS in HTML vs external; overwrite-HTML toggle
- Preloader (default or custom GIF)
- Assets subfolder; spritesheet PNG/JPEG/both; 8/24/32-bit; size constraints
- Texture export (rasterize vectors) — performance option
- Transparency: stage **"no color"** → transparent canvas
- Loop on/off
- Audio asset settings
- Libs: **our app = self-contained local bundle**

**28.6 Other targets**

| Target | Our app |
|---|---|
| WebGL / glTF | Optional, **P2** |
| SWF / OAM / AIR | Historical **not implemented** |

**28.7 Audio-only** — WAV/MP3 stems, **our app P1**.

**28.8 Project file** — lossless master. Not an Export format.

**28.9 Publish profiles** — named saved bundles of publish settings.

**28.10 Universal matrix** — resolution / scale / fps / compression / transparency / audio / loop / range per target (see Blueprint table). Coding agents must implement **that** matrix, not Adobe extras.

**28.11 M3 checkpoint** (acceptance list, not a license to fake encoders):

- [ ] Image PNG/JPEG/SVG/WebP + scale + transparency + quality
- [ ] PNG/JPEG sequence + range + sidecar fps
- [ ] Animated GIF + silent warning
- [ ] Video MP4/WebM + sample-exact audio
- [ ] HTML5 bundle (JS + assets + spritesheets + preloader + transparency + loop + audio)
- [ ] Audio-only; project save + autosave; publish profiles

### 6.3 Part 20.2 layer export rules `[BLUEPRINT]` — **overrides Adobe**

| Layer state | Stage | Export |
|---|---|---|
| Visible | shown | exported |
| Hidden | not shown | **NOT exported** (default "export hidden layers" = off) |
| Locked | shown | **exported** |
| Outline | outlines only (view) | **exported fully** (outline is authoring-only) |
| Guide | helper | **content invisible at export** |

Adobe Publish "Include Hidden Layers" defaults **ON** for SWF. **Kineora Blueprint wins:** hidden is never exported. `[BLUEPRINT OVERRIDE]` Do not add an include-hidden toggle unless a later Blueprint/decision says so. See AMB-EXP-007.

### 6.4 Part 33 / Part 16 / Part 17 (export-relevant model)

- `settings.backgroundAlpha` 0..=1. `[BLUEPRINT 33.1]`
- `camera` object + camera layer. `[BLUEPRINT 16 / 33]` — **not in MOD-DOC today**.
- `masterAudioTrack` / audio layers. `[BLUEPRINT 33]` — **not in MOD-DOC today**.
- Layer types include mask / guide / camera / audio. `[BLUEPRINT 33]` — code has **Normal + Folder only**. `[CODE model.rs]`

### 6.5 Part 35 priority (do not invert)

| Item | Priority |
|---|---|
| Export PNG/JPEG/SVG image | **P0** |
| PNG sequence + GIF + MP4 video | **P0** |
| HTML5 / Web bundle | **P1** |
| Sprite sheets + extra image sequences | **P1** |
| Audio-only | **P1** (28.7) |
| glTF / WebGL | **P3** |
| Video motion blur | **P2** (28.4) |

**Honesty constraint (this project, already practiced by SYS-27 slice 1):** P0 GIF/MP4 **must not be faked**. Until an encoder exists, the menu stays an **honest handoff toast**. `[CODE export27.ts header]` `[INT-AID-003]` That is not a Blueprint waiver; it is an implementation integrity rule (INV-ERR-1 / no-fake-features).

---

## 7. Phase 2 / 2.5 / Phase 3 / Forensic contracts

### 7.1 F-28-01..11 `[FORENSIC]`

Confirms Part 28 split (Export vs Publish), per-format settings, GIF silent warn, SWF legacy skip, transparent canvas → PNG alpha (M.1), range labels (M.2), camera identical (M.3).

Events listed in F-28: `export:progress` / `export:done`. **Only `export:done` is locked** on the SYS-01 bus. `[CROSS_SYSTEM_CONTRACT §D]` `export:progress` = **NOT SPECIFIED on the locked bus**. Do not emit it without INT. See AMB-EXP-005.

### 7.2 C-31 `[C-31]` — UI contract, **not** implementation truth

C-31 marks `exp.image / exp.seq / exp.gif / exp.video / exp.publish / exp.profiles` as FUNCTIONAL and the contract **UI COMPLETE**.

**FL-0017:** a UI-complete contract is not a license to claim the engine exists. Current code is PARTIAL. Coding agents must **not** flip C-31 into "already done".

C-31 also lists **Cmd+K** as an export entry. Blueprint / H09 export shortcut is **Ctrl+Shift+R**. Cmd/Ctrl+K is the **command palette** (C-04 / `palette.open`). **Blueprint + H09 win.** `[BLUEPRINT OVERRIDE vs C-31]`

C-31 states: Esc cancels dialog/export; export non-mutating; progress + cancel never frozen; GIF silent-audio warn; Done = toast + open-folder; camera applied identically.

### 7.3 Engineering 14 pipeline `[ENGINEERING]`

```
prepare(settings) → validate → frame list → render frames
  (evaluate{export:true}, worker pool) → encode → mux audio (video)
  → package (html) → write → cleanup
```

Rules: same evaluate as playback; camera in all exporters; overlays NEVER exported (`eng 06`); every exporter cancellable + progress + cleanup; publish profiles.

**`evaluate{export:true}`** is engineering language for "content pass only". Current Rust `evaluate()` already produces **no overlays** (overlays are view-only). `[CODE eval.rs]` `[ENGINEERING 06]` Coding agents must **not** invent a new public `evaluate(export:true)` flag unless an INT extends MOD-DOC / eval. The invariant is **behavior** (no overlays), not a new API name.

Acceptance:

- **REQ-EXP-002-A:** camera push-in → PNG@N and video frame N identical. **BLOCKED** (no camera).
- **REQ-EXP-002-B:** selection box never in output. **Required now** (already tested for SVG).
- **REQ-EXP-C:** cancel mid-render → partials cleaned, doc unchanged, FAILED/CANCELLED + retry.

### 7.4 STM-EXPORT `[ENGINEERING 04]` — owner SYS-27

```
IDLE → PREPARING → RENDERING → ENCODING → COMPLETE
                              ↘ CANCELLED
                 any error  → FAILED → retry() → PREPARING
```

- Cancel enabled in RENDERING / ENCODING.
- Buttons disabled during op.
- Navigation away: op continues in worker; return shows progress.
- Reload: op lost → FAILED (no resume) `[ASSUMPTION in eng 04 — P2]`.
- STM-JOB: **one long-op at a time** (ENG-020).

**Not implemented.** Slice 1 is synchronous and atomic. `[CODE export27.ts]`

### 7.5 Requirements `[ENGINEERING 01]`

| ID | Text |
|---|---|
| REQ-EXP-001 | Image/sequence/GIF/video/HTML5/audio/project; per-format matrix |
| REQ-EXP-002 | Same evaluate as playback; camera in all exporters; overlays never exported |
| REQ-SYS-003 | `evaluate(model, time)` pure + deterministic |
| REQ-SYS-009 | Nothing is a black box — export emits inspectable reports |

### 7.6 SYS-02 §14 / §16 (handoff + scene)

- Export targets **active scene** (SYS-27). Save serializes **whole document**. `[SYS-02 §14]`
- Spec phrase: `file.export → SYS-27 → evaluate{export:true} → renderer`. `[SYS-02 §16]`
- SYS-02 §16 "CURRENT IMPLEMENTATION STATUS" is **stale** (written before SYS-27 slice 1). Treat as historical evidence, not today's map. Today's map = §8.

---

## 8. Existing implementation map (EVIDENCE ONLY)

### 8.1 Menu / commands `[CODE]`

`animator/ui/src/menus.ts` File ▸ Export:

| Label | `file.export` input | Current run |
|---|---|---|
| Export Image… | `image` | `openExport()` → ExportDialog |
| Export Video… | `video` | `exportHandoff('Video')` toast |
| Export Animated GIF… | `gif` | `exportHandoff('Animated GIF')` toast |
| Export Movie… | `movie` | `exportHandoff('Movie')` toast |
| **Export PNG Sequence…** | `sequence` | **`openExport()`** (dialog default still SVG; user must pick "SVG sequence") |

`file.publish` → `publishHtml5()` (real).  
`file.publishSettings` / `file.publishProfiles` → `publishHandoff` toasts.

Ctrl+Shift+R → `file.export('image')`. `[CODE commands.ts shortcutAliases]`

No-doc: `enabled` requires `engine ok && doc_id !== 0`.

### 8.2 ExportDialog `[CODE ExportDialog.tsx]`

| Control | Behavior |
|---|---|
| Formats | `svg` \| `png` \| `jpeg` \| `webp` \| `svgseq` |
| Scale | 1 / 2 / 4 |
| Frame (stills) | **current playhead** |
| Sequence range | first / last; default 1..duration |
| JPEG quality | **hardcoded 0.92**, no slider |
| Still filename | always `kineora.{ext}` |
| Sequence filename | `{doc_title}_{NNNN}.svg` + `{base}_sequence.json` |
| Raster | `evaluate(frame)` + `rasterizeContent` (no `backgroundAlpha`) |
| SVG | `exportSvgScaled(frame, scale)` (Rust) |
| Events | stills emit `export:done` from the dialog; sequence via `deliverExport` |
| Cancel | closes, no write |
| Engine down | confirm disabled + honest message |

### 8.3 SYS-27 slice 1 `[CODE export27.ts]`

| Function | What it does |
|---|---|
| `buildSvgSequence` | Validates 1 ≤ first ≤ last ≤ duration; builds SVGs then sidecar; **all-or-nothing** (no partial list) |
| Sidecar JSON | `{ format:'svg-sequence', first, last, count, fps, scale }` |
| `buildHtml5Publish` | Frames **1..duration** inline SVG + rAF player; `loop` / `fps` / `scale`; title HTML-escaped |
| `publishHtml5` | `loop: true`, `scale: 1`, base = `doc_title` or `kineora` |
| `deliverExport` | downloads every file then emits **one** `export:done`; failure → notify, **no files, no event** |

Honest comments in-file: GIF/video/movie stay toasts; STM-EXPORT later; import blocked on assets; native dest later.

### 8.4 Rust SVG exporter `[CODE export.rs]`

- `evaluate(doc, scene, frame)` content pass only.
- Stage size = `settings.width × height`.
- `clipPath` clips to stage (pasteboard excluded).
- Scale multiplies **outer** width/height; **viewBox stays document coords**.
- `background_alpha < 1` → `fill-opacity`; else opaque fill (byte-stable).
- Rotation around rect **center**.
- `Session::export_svg` / `_scaled` use **`active_scene`**. `[CODE session.rs]`
- WASM: `kineora_export_svg` / `kineora_export_svg_scaled`.

### 8.5 Raster path `[CODE canvasRenderer.ts / actions.ts]`

- `rasterizeContent`: canvas `stageW × stageH × scale`; identity viewport; `renderContent` fills `s.background` **opaque**.
- `ContentState` has **no** `backgroundAlpha`.
- `downloadCanvasBlob`: `canvas.toBlob(cb, mime, quality)`; **`if (!blob) return` — silent**. INV-ERR-1 risk.
- `downloadBlob`: `<a download>` + object URL. Browser sink. No `showSaveFilePicker` for export (Save already has FSA).

### 8.6 Evaluate / layers `[CODE eval.rs]`

- `evaluate` → `collect_items(..., skip_locked=false)`.
- Hidden layers skipped (`!layer.visible`).
- Locked layers **included**.
- Outline color is a **view** field; export.rs / `renderContent` **ignore** it → full content.
- Nested symbols flattened; `MAX_DEPTH = 32`.
- Empty-instance 24px marker is **selection-only**; never in evaluate/export.

### 8.7 Status bar `[CODE StatusBar.tsx]`

`st-export` is a **static** `export —`. It does **not** subscribe to `export:done`. `[INT-AID-003]` "Consumers: none yet."

### 8.8 Bus `[CODE bus.ts]` `[CROSS_SYSTEM_CONTRACT §D]`

```
'export:done': { format: string; path?: string }
```

Locked payload is `{format, path}`. TS makes `path` optional (browser pathless). Browser honesty: `path` = download **file name**. `[CODE export27.ts]`

### 8.9 What is **not** in the repo `[CODE]`

- No ffmpeg, WebCodecs, GIF encoder, mp4 muxer (`package.json` = React + vitest only).
- No STM-EXPORT machine.
- No publish-settings / profiles store.
- No camera / audio / mask / guide / bitmap / text nodes that exporters could sample.

---

## 9. Adobe Animate comparison

Official pages consulted (redirects to `/animate/desktop/...` still Adobe Help):  
[4](https://helpx.adobe.com/animate/using/exporting-svg-format.html) · [5](https://helpx.adobe.com/animate/using/publish-settings.html) · [1](https://helpx.adobe.com/animate/using/timeline-layers.html) · plus F-28 E1/E2 already audited.

| Adobe | Kineora Blueprint | Classification |
|---|---|---|
| File ▸ Export ▸ Export Image / Export Animated GIF / Export Video | Image / GIF / Video + Movie + PNG-Sequence | `[BLUEPRINT]` subset + our extras |
| Image = current frame; Publish PNG/JPEG/GIF often **first frame** unless `#Static` | **Current frame or chosen frame** (not first-frame default) | `[BLUEPRINT OVERRIDE]` |
| `#First` / `#Last` / `#Static` labels | **Numeric frame-range field** | `[BLUEPRINT]` |
| SVG export option **Include Hidden Layers** `[ADOBE]` | Hidden **never** exported | `[BLUEPRINT OVERRIDE]` Part 20.2 |
| Publish SWF "Include Hidden Layers" **default ON** `[ADOBE]` | Hidden not exported | `[BLUEPRINT OVERRIDE]` |
| GIF Static/Animation, loop N, palette/dither/interlace | Same intent | `[BLUEPRINT]` |
| GIF silent | Warn user | `[BLUEPRINT]` |
| Video via Media Encoder; Ignore Stage Color = alpha | MP4 + WebM; transparency row is "—" for video in 28.10 | Video alpha = **NOT SPECIFIED** for Kineora (AMB-EXP-008) |
| PNG sequence from Library/Stage symbol; W/H/smooth/opaque vs alpha | Document timeline range; PNG/JPEG sequence | `[BLUEPRINT]` (symbol-only PNG seq is Adobe detail, not required) |
| HTML5: JS bundle, spritesheets 8/24/32, transparent if No Color, preloader, loop | Same | `[BLUEPRINT 28.5]` |
| Publish Preview / SWF / OAM / AIR / File Info | Excluded or HIDDEN | `[SYS-02 §23]` |
| Publish Profiles `.APR` | Named bundles, **no `.APR`** | `[BLUEPRINT]` + Adobe-only container excluded |

Adobe is **comparison**, never a license to add Adobe-only UI.

---

## 10. Format-by-format contract (what "done" means)

Coding agents implement **this** table. Cells marked AMB / BLOCKED / NOT SPECIFIED must stay unresolved or honest-toast — not guessed.

### 10.1 Still image (P0)

| Field | Required behavior | Source | Current `[CODE]` |
|---|---|---|---|
| Formats | PNG, JPEG, SVG, WebP | 28.1 | yes |
| Frame | Current playhead (chosen-frame UI optional later) | 28.1 | current playhead |
| Size | Stage W×H × scale 1/2/4 | 28.1 | yes |
| Custom W×H | Allowed by 28.1 | **no UI** — AMB-EXP-009 if someone adds free W×H |
| PNG alpha | Preserve; transparent stage if backgroundAlpha=0 / "no color" | 28.1 / F-28 M.1 | **SVG yes; raster NO** |
| JPEG | Lossy, no alpha; quality 0–100 | 28.1 | quality **0.92 hidden** |
| WebP | Our format; quality not separately specified | 28.1 | encoded; quality undefined |
| Overlays | Never | REQ-EXP-002 | yes (content pass) |
| Hidden layers | Excluded | 20.2 | yes (evaluate) |
| Locked layers | Included | 20.2 | yes |
| Outline mode | Full content | 20.2 | yes |
| Scene | **Active scene** | SYS-02 §14 | `active_scene` |
| Dirty / undo | none | H00 §7 | yes |
| Event | `export:done` once after successful handoff to sink | §D | dialog emits |
| Dest | toast + open-folder (H08) | H08 | `<a download>` only |
| Filename | **NOT SPECIFIED** (stills use `kineora.{ext}`) | — | AMB-EXP-003 |

### 10.2 Sequence (P0 = PNG/JPEG; SVG-seq = interim evidence)

| Field | Required (Blueprint 28.2) | Current |
|---|---|---|
| Formats | **PNG and JPEG** (plus sidecar fps) | **SVG sequence only** |
| Range | Numeric first–last, inclusive, 1-based | yes (svgseq) |
| Names | `name_0001.png` … | `name_0002.svg` (frame number, 4-digit) |
| Sidecar | fps (+ useful metadata) | `{format, first, last, count, fps, scale}` |
| Invalid range | refuse, no files, no event | yes |
| Menu label | File ▸ **Export PNG Sequence** | opens image dialog; SVG-seq is a format option — **label mismatch** |

SVG-seq is an **honest interim engine**, not a Blueprint replacement for PNG/JPEG sequence. Do not delete it without INT; do not claim 28.2 DONE. AMB-EXP-002.

### 10.3 GIF (P0, encoder-gated)

Remain **honest toast** until a real GIF encoder exists. When implemented:

- Static vs Animated
- Loop cont / N
- Palette ≤256, optimize, dither, interlace
- Optional transparency
- Range field
- **Silent-audio warning** (mandatory)
- Same evaluate / hidden / overlay rules
- STM-EXPORT (long op)

**Do not** write a fake 1-frame "GIF" via canvas. That is a fake feature.

### 10.4 Video MP4 / WebM (P0, encoder-gated)

Remain toast until encoder **and** (when audio exists) mux exist.

- Default fps = document fps
- Range = whole document / **scene** / frame range (28.4). Multi-scene "whole document" vs active scene = AMB-EXP-001.
- Audio sample-exact — **BLOCKED** until SYS-26 / audio entities.
- Motion blur = P2, skip.

### 10.5 Movie (menu item)

Part 01 lists **Movie** separately from **Video**. Part 28 defines Video (MP4/WebM) only. **AMB-EXP-004.** Until decided: keep honest toast. Do not alias Movie → MP4 silently.

### 10.6 HTML5 publish (P1; slice 1 exists)

Blueprint 28.5 = HTML + JS + **asset folder** + spritesheets + preloader + loop + transparency + audio.

Slice 1 = **one self-contained HTML**, frames as inline SVG, loop hardcoded true, scale 1, no spritesheet, no preloader, no audio, no settings UI.

Honest status: **PARTIAL preview player**, not 28.5 complete. Do not claim Publish DONE.

### 10.7 Publish Settings / Profiles (P1)

SYS-27 owns. No UI. Stay toast. Profiles persist on SYS-27 boundary, not in the project file unless Part 33 later says so (Part 28.9 + SYS-02 §18: profiles = SYS-27 / PREFERENCES-adjacent — **do not stuff into DOCUMENT** without INT).

### 10.8 Audio-only (P1)

**BLOCKED** (`BLK-D-006` / no audio entities). No toast-as-success. Import-style honest gap is acceptable; do not invent stems.

### 10.9 Legacy

SWF / OAM / AIR / Publish Preview / File Info = not built, not shown (AIR already HIDDEN).

---

## 11. Data-model mapping (what exporters can actually sample)

| Blueprint entity | In MOD-DOC today? | Export consequence |
|---|---|---|
| Document settings W/H/fps/background/backgroundAlpha | **Yes** | Image/SVG use them; raster **drops alpha** |
| Scenes[] + active scene | **Yes** (Insert ▸ Scene landed `290cc7d`) | Export = active scene only `[SYS-02 §14]` |
| Layers visible/locked/outline | **Yes** | Hidden out; locked in; outline ignored at export |
| LayerKind mask/guide/camera/audio | **No** (Normal/Folder only) `[CODE]` | Masks/guides/camera/audio layers **cannot** export |
| Nodes: Rect + SymbolInstance | **Yes** | Only these draw |
| Paths / text / bitmaps / filters | **No** | Cannot appear in export |
| Classic tweens | **Yes** | evaluate interpolates; export sees result |
| Motion / shape tween | **No** | N/A |
| Camera | **No** | REQ-EXP-002-A **BLOCKED** |
| Audio assets / masterAudioTrack | **No** | Video mux + audio-only **BLOCKED** |
| Library bitmaps | **No** | Import **BLOCKED** `BLK-D-006` |
| Frame labels `#Static/#First/#Last` | Labels exist on keyframes `[CODE Frame.label]` | Blueprint says **numeric range**, not Adobe labels. Do not invent label-driven export. |
| Publish profile records | **No** | Settings/Profiles toast |

Exporters must render **the model that exists**. They must not synthesize camera/audio/masks.

---

## 12. Scene / timeline / evaluate / camera / audio

### 12.1 Scene

- Save = whole document. Export = **active scene**. `[SYS-02 §14]` `[CODE active_scene]`
- Multi-scene docs now exist. `[CODE 290cc7d]`
- Video 28.4 "whole document / scene / frame range" vs image "current frame" vs HTML5 28.10 "whole doc": **AMB-EXP-001**. Do not concatenate all scenes.

### 12.2 Timeline / frames

- 1-based frames. Duration = derived timeline length. `[CODE]`
- Sequence / GIF / video range = inclusive first–last, last ≤ duration.
- Stills = playhead (ExportDialog).
- HTML5 slice 1 = `1..duration` of **active** scene (via `exportSvgScaled` → `active_scene`).

### 12.3 Evaluate invariants (must hold for every format)

1. Pure + deterministic. `[REQ-SYS-003]`
2. Same items as playback content pass. `[REQ-EXP-002]`
3. No selection / handles / marquee / grid / rulers / pasteboard / stage border / onion / guides. `[ENGINEERING 06]`
4. Hidden excluded; locked included; outline full. `[BLUEPRINT 20.2]`
5. Viewport zoom/pan never participates. `[CODE export.rs]`
6. Empty-instance marker never drawn. `[CODE eval.rs]`
7. Depth cap 32. `[ENGINEERING RSK-002]`

### 12.4 Camera

Must apply identically across exporters **when implemented**. `[BLUEPRINT 16.0 / 28.0]` Until SYS-25 + MOD-DOC camera exist: **do not fake a camera matrix**. REQ-EXP-002-A stays untestable.

### 12.5 Audio

GIF: warn silent. Video: sample-exact mux when audio exists. Audio-only: P1 blocked. `[BLUEPRINT 28.3 / 28.4 / 28.7]`

---

## 13. UI / menu / shortcuts / dialog / status

### 13.1 Required surface `[H09]` `[H08]` `[C-31]`

| Surface | Contract |
|---|---|
| File ▸ Export submenu | 5 items, one commandId `file.export(format)` |
| File ▸ Publish* | 3 items |
| Shortcut | Ctrl+Shift+R → image dialog (not a format picker) |
| No doc | disabled-by-context |
| Dialog | per-format settings; Esc cancel; primary disabled while running / engine down |
| Progress | status bar + cancel when STM-EXPORT exists |
| Done | toast + open-folder (desktop) |
| GIF | silent-audio warn |
| a11y | role=dialog / menuitem; progress aria-live `[H08 §12]` |

### 13.2 Honesty bugs in current UI (do not "fix" in a way that fakes engines)

1. Menu **"Export PNG Sequence"** opens a dialog whose sequence mode is **SVG**. `[CODE]`
2. `st.export` never updates. `[CODE]` `[H12]` vs `[INT-AID-003]`
3. JPEG quality not user-visible. `[BLUEPRINT 28.1]` vs `[CODE]`
4. Publish Settings/Profiles look FUNCTIONAL (enabled) but toast. That matches H08 "honest engine unavailable / gap" **if** the toast is honest (it is). Do not hide the items (H09 lists them REQUIRED handoff).
5. C-31 FUNCTIONAL checkboxes ≠ code.

### 13.3 Filename / dest (UI)

H08: "toast + open-folder". Browser has no folder. Save already uses FSA session tokens. Export dest picker = **later increment** (already recorded in `export27.ts`). AMB-EXP-006.

---

## 14. Cross-system events and STM

### 14.1 Locked event `[CROSS_SYSTEM_CONTRACT §D]` `[SYS-01 §27.1]`

| Event | Producer | Payload | MUST NOT fire |
|---|---|---|---|
| `export:done` | SYS-27 | `{format, path}` | failure; cancel; SYS-02 never emits |

`format` values observed in code: `svg` / `png` / `jpeg` / `webp` / `sequence` / `html5`. Not locked as an enum. **Do not invent** `export:failed` / `export:progress` on the bus without INT.

H12 lists `st.export` as consumer. INT-AID-003: **no subscriber yet**. Wiring `st.export` is a **SYS-01 chrome** change consuming a SYS-27 event → file an INT (do not silently edit StatusBar as if it were SYS-27).

### 14.2 STM-EXPORT vs current sync slice

Until STM-EXPORT exists:

- Sync exports must stay **atomic** (build all, then deliver). Already true for sequence/HTML5.
- Raster `toBlob` is **async** and the dialog currently emits `export:done` **before** the blob callback. `[CODE ExportDialog]` That can claim success when `toBlob` later yields null. See §19 bug 10.
- Cancel of a sync still-image is "close dialog before confirm" only.

### 14.3 STM-JOB

One long-op at a time. Export must not start if another long-op is RUNNING (import, etc.) once STM-JOB is real. Today import is toast-only, so no queue yet.

---

## 15. Errors, edges, cancellation

### 15.1 H08 / H00 matrix (must keep)

| Case | Expected | testId |
|---|---|---|
| No doc | disabled | T-import-no-doc / T-file-no-doc / T-cmd-disabled-no-doc |
| Success | file(s) written, **no dirty**, `export:done` once | T-export-ok |
| Fail | log + retry, **no event**, **no partials**, doc unchanged | T-export-fail |
| Export does not dirty | dirty flag unchanged | T-export-no-dirty |
| Engine down | honest message | T-handoff-engine-unavailable |
| Cancel | safe cleanup, unchanged | REQ-EXP-C |
| Publish error | Output log | T-publish-error |

### 15.2 Additional edges (from specs + code)

| # | Case | Expected | Source |
|---|---|---|---|
| X1 | Invalid scale | fall back to 1× | `[CODE export.rs]` Part 28.1 spirit |
| X2 | Invalid sequence range | refuse, dialog stays open | `[CODE]` |
| X3 | Mid-range SVG fail | no files, no event | `[CODE buildSvgSequence]` |
| X4 | Selection present | identical output | REQ-EXP-002-B |
| X5 | Hidden layer | absent | 20.2 |
| X6 | Locked layer | present | 20.2 |
| X7 | Pasteboard object | clipped / not visible | export.rs clipPath |
| X8 | backgroundAlpha=0 | PNG/SVG transparent; JPEG remains opaque | 28.1 |
| X9 | Title with `<` | HTML publish escaped | `[CODE]` already |
| X10 | Rapid double-export | independent deliveries (sync slice) | `[CODE tests]` |
| X11 | Reload during export | FAILED, no resume | STM-EXPORT assumption |
| X12 | Multi-scene | active scene only until AMB-EXP-001 | SYS-02 §14 |
| X13 | Folder layer | no drawable content; children follow own visible/lock | `[CODE]` folders organizational |
| X14 | `toBlob` null | **must surface error**, must **not** emit `export:done` | INV-ERR-1 — currently violated |
| X15 | GIF requested | toast or real encoder; never fake | slice-1 honesty |

---

## 16. Performance

| Topic | Spec / evidence | Contract for agents |
|---|---|---|
| Worker pool | eng 14 / STM-EXPORT RENDERING | Required **before** GIF/video; not for single-frame SVG |
| One long-op | ENG-020 | Queue or refuse a second export |
| Progress | STM-EXPORT progress %; C-31 never frozen | Needs event or status polling — **do not add `export:progress` without INT**; status-bar local state is OK |
| Large sequences | download-per-file in browser will spam the download bar | Native folder dest later (AMB-EXP-006); do not zip unless specified (**NOT SPECIFIED** — don't invent zip) |
| HTML5 inline SVG × duration | memory = O(frames) | Acceptable for slice 1; 28.5 spritesheets are the P1 mitigation |
| Determinism | same frame → identical SVG bytes | already tested |
| Supersample 4× on 1920×1080 | 7680×4320 canvas | may fail GPU/memory — must **fail honestly**, not hang silently |

---

## 17. Security

| Topic | Rule |
|---|---|
| HTML publish title | Escape `& < >` (already). If later interpolating more strings into HTML/JS, escape those too. |
| Filename | Do not allow path separators from `doc_title` to escape the download name. Current title is used raw in sequence names — **sanitize on implement** (`.` `..` `/` `\` NUL). Not a product AMB; it's INV-ERR / platform safety. `[INFERENCE — engineering hygiene]` |
| No credentials in export output | Never write tokens/paths from git config into files. |
| FSA / native write | Same Save rules: user-picked dest only; no silent overwrite of another open document's path (INV-IDENT-4) **if** export starts using real paths. |
| Compromised PAT (BLK-B-005) | Do not reuse. Do not persist in `remote.origin.url`. |
| SVG XSS | Exported SVG is ours (rects + colors from model). If user-controlled strings ever enter SVG text, escape. Text engine does not exist yet. |

---

## 18. Existing tests (evidence — not re-run as this increment's PASS)

### 18.1 `animator/core/tests/export.rs`

- Stage 1920×1080 viewBox
- Scale 2×/4× outer size; viewBox unchanged; invalid scale → 1×
- Scale 1 identical to default
- Fill / stroke / stroke-width
- Rotation pivot = center
- Layer order bottom → top
- Hidden excluded / locked included
- Pasteboard clipPath
- Selection ignored
- Determinism + different frames differ
- Background color

**Not covered there:** backgroundAlpha, multi-scene, outline-ignored, empty-instance marker absence, raster.

### 18.2 `animator/ui/src/export27.test.ts`

- Sequence padding + sidecar
- Invalid range refuses (no engine calls)
- Invalid scale → 1
- Engine down / no doc
- Mid-range fail → no partial list
- HTML5 embeds all frames + fps + loop; no-loop serialized; title escaped
- `deliverExport` success: N downloads, **one** `export:done`
- Failure: no download, no event
- `publishHtml5` → `{format:'html5', path}`
- Non-mutating (no `document:changed` / `saving:changed`)

### 18.3 `animator/ui/src/components/ExportDialog.test.tsx`

- Format/scale/current frame
- SVG / PNG / JPEG / WebP + 2× dimensions
- Engine-not-attached disabled
- Cancel
- svgseq range + sidecar + `export:done`
- Invalid range stays open
- Still SVG emits `export:done`

### 18.4 Gaps in the **existing** test net (agents must add — §25)

No tests for: raster alpha, JPEG quality field, `toBlob` null, `st.export` consumer, PNG-sequence menu honesty, multi-scene active-only, GIF warn, STM-EXPORT cancel, video mux, publish settings, Movie vs Video, filename policy.

**This research increment did not execute the suites.** Do not quote 18.1–18.3 as a new PASS.

---

## 19. Gaps, bugs, mismatches (do **not** fix in the research increment)

| # | Finding | Kind | Sources |
|---|---|---|---|
| 1 | Menu **Export PNG Sequence** vs engine **SVG sequence** | mismatch | `[CODE]` vs `[BLUEPRINT 28.2]` |
| 2 | `st.export` does not consume `export:done` | missing consumer | `[H12]` `[INT-AID-003]` `[CODE StatusBar]` |
| 3 | Raster PNG/JPEG/WebP ignore `backgroundAlpha` | bug vs 28.1 | `[CODE renderContent]` vs SVG path |
| 4 | JPEG quality UI missing (0–100); hardcoded 0.92 | gap | `[BLUEPRINT 28.1]` `[MDN]` |
| 5 | STM-EXPORT / cancel / progress / worker **absent** | missing | `[ENGINEERING 04]` |
| 6 | GIF / MP4 / WebM / Movie / audio-only / Settings / Profiles / raster sequence **absent** | missing | `[CODE]` toasts |
| 7 | Multi-scene: only `active_scene`; 28.4 "whole document" unspecified | AMB-EXP-001 | `[SYS-02 §14]` `[BLUEPRINT 28.4]` |
| 8 | Camera / audio / masks / filters / text / bitmaps cannot export | blocked | `BLK-D-006` + missing SYS-25/26 |
| 9 | Still filename `kineora.{ext}` vs sequence `doc_title` | inconsistent; rule unspecified | `[CODE]` AMB-EXP-003 |
| 10 | `downloadCanvasBlob` silent on null blob; dialog emits `export:done` **before** toBlob | bug INV-ERR-1 | `[CODE]` |
| 11 | Publish loop/scale/dest not user-configurable | gap vs 28.5 | `[CODE publishHtml5]` |
| 12 | C-31 UI COMPLETE vs code PARTIAL | authority | FL-0017 |
| 13 | C-31 Cmd+K vs Ctrl+Shift+R | conflict | Blueprint/H09 win |
| 14 | F-28 `export:progress` not on locked bus | do not invent | AMB-EXP-005 |
| 15 | SYS-02 §16 impl blurb stale (says sequence/publish not implemented) | stale spec note | evidence only |
| 16 | `file.export('sequence')` opens dialog but does not preselect `svgseq` | UX honesty | `[CODE]` |
| 17 | HTML5 ≠ 28.5 bundle (no asset folder / spritesheet / preloader) | PARTIAL | `[CODE]` vs 28.5 |
| 18 | Video transparency / "Ignore Stage Color" | Adobe-only extra | AMB-EXP-008 |
| 19 | Guide layers "invisible at export" | cannot implement (no Guide kind) | `[CODE LayerKind]` |
| 20 | BUG-D-001 sys03-edit fail on main | unrelated; do not absorb | `[7ab803a]` |

---

## 20. Ambiguity register (research IDs — **not** product decisions)

Do **not** resolve these in code. If a coding agent hits one, **stop** and escalate (Leader / user).

| ID | Question | Why open | Suggested default **only if** Leader later asks |
|---|---|---|---|
| **AMB-EXP-001** | Sequence / video / HTML5 across **all scenes** vs **active scene only**? | SYS-02 §14 = active scene. 28.4 video says "whole document / scene / range". Insert ▸ Scene now exists. | *none — do not concatenate* |
| **AMB-EXP-002** | Is SVG-seq an allowed stand-in for File ▸ PNG Sequence, or must the menu wait for raster PNG/JPEG seq? | Menu label vs 28.2 vs slice 1 | keep both; don't rename without product call |
| **AMB-EXP-003** | Still-image filename policy (`kineora.{ext}` vs title vs Save basename) | sources silent | — |
| **AMB-EXP-004** | What is **Movie** vs **Video**? | Part 01 lists both; Part 28 only Video | keep toast |
| **AMB-EXP-005** | May `export:progress` be added to the locked bus? | F-28 lists it; §D does not | INT required |
| **AMB-EXP-006** | Native path picker / FSA vs `<a download>` for export dest; overwrite; open-folder | H08 wants open-folder; browser pathless | native later, already recorded |
| **AMB-EXP-007** | Hidden-layer publish toggle (Adobe include-hidden)? | Blueprint 20.2 forbids | **no toggle** unless Blueprint changes |
| **AMB-EXP-008** | Video alpha / Ignore Stage Color | 28.10 transparency = "—" for video | — |
| **AMB-EXP-009** | Custom W×H vs scale-only | 28.1 allows custom; UI is scale-only | scale-only is enough for P0 |
| **AMB-EXP-010** | JPEG/WebP **default** quality number | 28.1 says 0–100, not a default. MDN JPEG default ~0.92 | expose 0–100; do not invent a branded default |
| **AMB-EXP-011** | GIF palette/dither/interlace **defaults** | listed, not defaulted | — |
| **AMB-EXP-012** | `#Static` / `#First` / `#Last` vs numeric field | Blueprint: numeric field | numeric only |
| **AMB-EXP-013** | Publish profiles stored where (DOCUMENT vs PREFERENCES vs SYS-27 store)? | SYS-27 owns boundary; Part 33 has no field | not DOCUMENT without INT |

**Pre-existing open AMBs (do not decide here):** AMB-H01-002/003, AMB-H07-001, AMB-H05-001/002, AMB-S03-003, AMB-002/003/004, AMB-S04-001..006, AMB-D-001.

**Blockers that gate real formats:** `BLK-D-006` (no asset entities — import + audio + bitmaps), SYS-25 camera missing, SYS-26 audio missing, `BLK-008` native unverified, `BLK-B-005` PAT rotate.

---

## 21. External technology

| Tech | Role | In repo? | Citation |
|---|---|---|---|
| Canvas `toBlob(cb, mime, quality 0–1)` | PNG/JPEG/WebP encode | used | [MDN toBlob](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob) — quality 0–1; omitted → UA default (JPEG historically ~0.92) |
| `<a download>` + Blob URL | browser sink | used | `[CODE downloadBlob]` |
| File System Access `showSaveFilePicker` | Save already; Export not | Save only | `[CODE file.ts / platform]` |
| SVG 1.1 subset (rect, clipPath, rotate) | vector export | used | `[FORMAT-SPEC]` |
| ffmpeg / libx264 / libvpx / libmp3lame | video/audio | **absent** | `[FFMPEG]` — do not assume desktop ffmpeg |
| WebCodecs / MediaRecorder | possible web encode | **absent** | `[MDN]` — do not adopt without a decision |
| gifenc / omggif / gif.js | GIF | **absent** | — |
| Adobe Media Encoder | Adobe video path | N/A | `[ADOBE]` not our pipeline |

**Rule:** no new encoder dependency without an explicit product/Leader decision. Until then: honest toast.

---

## 22. Implementation blueprint (coding-agent contract)

### 22.1 Invariants (never violate)

1. Export / Publish are **NON-MUTATING**: no `document:changed`, no dirty flip, no undo entry, no History change. `[H00 §7]`
2. Only SYS-27 emits `export:done`. Once per **successful** delivery. Never on fail/cancel. `[§D]`
3. Failure: **no partial output** + **honest message** (INV-ERR-1/2).
4. Authoring overlays never leak (REQ-EXP-002-B).
5. Hidden layers never export (Part 20.2). Locked do. Outline exports full.
6. Same evaluate as playback content.
7. Active scene only until AMB-EXP-001 is decided.
8. Do not fake GIF/video/audio/camera.
9. Do not add locked-bus events without INT.
10. Do not absorb SYS-27 into SYS-02, or SYS-02 dirty/save into Export.
11. Do not treat C-31 "FUNCTIONAL" as done.
12. Do not implement File ▸ Open in an Export increment (user order).

### 22.2 Required architecture (when implementing)

```
file.export(format)                    # SYS-02 command (already)
        │
        ├─ image     → Export dialog (SYS-27 UI) → engine
        ├─ sequence  → dialog range + PNG/JPEG (or honest SVG-seq interim)
        ├─ gif/video/movie → real encoder OR honest toast
        └─ publish   → SYS-27 pipeline

engine (SYS-27):
  prepare → validate → frame list
        → for each frame: Session.export / evaluate + rasterize
        → encode
        → deliver sink (download | native path)
        → emit export:done ONCE
```

Still SVG: keep Rust `export_svg_scaled`.  
Still raster: `rasterizeContent` **must** honor `backgroundAlpha` (clear canvas; draw bg with alpha; JPEG then composites on opaque — JPEG cannot store alpha).  
Sequence: prefer extending `export27.ts` (already all-or-nothing).  
Long ops: introduce STM-EXPORT **before** GIF/video.

### 22.3 Sink contract

| Environment | Allowed sink | `export:done.path` |
|---|---|---|
| Browser without folder picker | `<a download>` | file name (honest, pathless) |
| Browser with FSA | optional later; do not invent | AMB-EXP-006 |
| Native / Tauri | path picker + write; toast + open-folder | real path |

Raster delivery must wait for `toBlob` success **before** `export:done`. Null blob → notify, no event, dialog may stay open.

### 22.4 Dialog fields that are **in spec** (implement when touching stills)

- Format: PNG / JPEG / SVG / WebP
- Scale: 1 / 2 / 4
- JPEG quality: 0–100 (map to `toBlob` quality 0–1)
- Sequence first/last when format is sequence
- Confirm / Cancel (Esc)

Fields **not** to add without AMB resolution: custom W×H, include-hidden, `#Static` labels, Movie encoder picker, zip-the-sequence.

### 22.5 HTML5 increment rules

Slice 1 may remain until a real 28.5 increment. A later increment must not silently replace the self-contained HTML with a different undocumented format. 28.5 requires a folder bundle — that is a **new** deliverable, not a quiet overwrite of slice 1 semantics. File INT if the `format:'html5'` payload meaning changes.

---

## 23. Implementation order / priority

Derived from **Blueprint P0** + existing slice + honesty. **Do not** blindly copy a wish-list that fakes encoders.

| Step | What | Owner | Why this order |
|---|---|---|---|
| **S0** | Keep handoff contract. GIF/Video/Movie stay **honest toasts**. No fake encoders. | SYS-27 / SYS-02 | INV-ERR-1 |
| **S1** | Honesty UI: `st.export` consumes `export:done` (INT); sequence menu/dialog honesty (do not claim PNG if SVG); optional preselect `svgseq` when `file.export('sequence')`. | SYS-01 + SYS-27 (INT) | H12 vs INT-AID-003; bug 1/2/16 |
| **S2** | Complete **still-image** contract on existing engines: raster `backgroundAlpha`; JPEG quality field (0–100); `toBlob` failure visible + event only after blob; filename **only if** AMB-EXP-003 decided, else leave documented. | SYS-27 | P0 image; bugs 3/4/10 |
| **S3** | Raster **PNG/JPEG sequence** + sidecar (28.2). Keep SVG-seq as extra format or behind AMB-EXP-002. Fix menu so "PNG Sequence" produces PNG (or rename only after product decision). | SYS-27 | P0 sequence |
| **S4** | STM-EXPORT + cancel + progress UI + one-long-op guard. | SYS-27 (+ SYS-01 status) | Required before heavy encodes |
| **S5** | GIF **only with a real encoder** + silent warn. Video MP4/WebM **only with encoder**; audio mux **only when SYS-26 exists**. | SYS-27 | P0 gated |
| **S6** | Publish Settings + Profiles UI; grow HTML5 toward 28.5 (folder, loop toggle, transparency). | SYS-27 | P1 |
| **Blocked** | Import; audio-only; camera-identical-across-exporters; guide/mask export; text/bitmap/filters | until those SYS / MOD-DOC entities exist | BLK-D-006, SYS-25/26 |

**File-menu human order (still in force, not this doc's job):** Save (done) → **Open next** → then other File items. Export implementation is **SYS-27**, not the next SYS-02 File feature unless the user says so.

---

## 24. Files coding agents may touch

### 24.1 SYS-27 engine increment (AI-D)

| File | Why |
|---|---|
| `animator/ui/src/export27.ts` | builders, deliver, publish |
| `animator/ui/src/export27.test.ts` | engine tests |
| `animator/ui/src/components/ExportDialog.tsx` | stills + sequence UI |
| `animator/ui/src/components/ExportDialog.test.tsx` | dialog tests |
| `animator/core/src/export.rs` | SVG exporter |
| `animator/core/tests/export.rs` | Rust export tests |
| `animator/core/src/wasm.rs` | only if new export FFI is required |
| `animator/ui/src/engine/client.ts` | thin WASM wrappers |
| `animator/ui/src/render/canvasRenderer.ts` | raster alpha (`renderContent` / `ContentState`) |
| `animator/ui/src/engine/actions.ts` | `downloadCanvasBlob` error path |
| `animator/ui/src/file.ts` | **handoff toasts only** (do not grow engines here) |

### 24.2 Shared seams — **INT required**

| File | Owner | When |
|---|---|---|
| `animator/ui/src/commands.ts` | shared registry | changing `file.export` / `file.publish*` semantics |
| `animator/ui/src/menus.ts` | SYS-01/02 chrome | label changes (PNG vs SVG) |
| `animator/ui/src/components/StatusBar.tsx` | SYS-01 | `st.export` consumer |
| `animator/ui/src/bus.ts` | SYS-01 | **only** with Leader INT if adding events |
| `PROJECT_COORDINATION/INTEGRATION_LOG.md` | append INT row | any cross-SYS touch |
| `PROJECT_COORDINATION/CROSS_SYSTEM_CONTRACT.md` | Leader | payload / new event |

### 24.3 Coordination (append-only, own worker)

`AI-D_REPORT.md` / `ATTENDANCE.md` / `CHANGELOG.md` / `BLOCKERS.md` (append). Do not rewrite other AIs.

---

## 25. Tests coding agents **must** write

Never claim unexecuted tests as PASS. Native / Tauri / wasm-pack: **NOT TESTED — TOOLCHAIN/ENVIRONMENT** if unavailable.

### 25.1 Keep existing (must stay green)

All of §18.1–18.3.

### 25.2 New automated tests (minimum for each step)

**S1 honesty**

- `export:done` updates `st-export` (format + name); failure leaves `export —` or error text; no dirty.
- `file.export('sequence')` either preselects sequence mode or the menu label matches what is produced (once AMB-EXP-002 decided).

**S2 stills**

- PNG + `backgroundAlpha=0` → transparent pixels (not filled white).
- JPEG + `backgroundAlpha=0` → opaque composite (no alpha channel).
- SVG + `backgroundAlpha<1` still has `fill-opacity` (already in exporter; add if missing).
- JPEG quality slider 0–100 maps to `toBlob` quality 0–1.
- `toBlob` null → notify, **no** `export:done`, no close-as-success.
- Hidden/locked/outline/selection/pasteboard: raster matches SVG rules.
- Multi-scene: export uses **active** scene (until AMB-EXP-001).
- Dirty unchanged; no `document:changed`.

**S3 raster sequence**

- `name_0001.png` … + sidecar fps.
- Invalid range: no files, no event, dialog open.
- Mid-fail: no partials.

**S4 STM-EXPORT**

- Cancel mid-render: cleanup, no `export:done`, doc unchanged (REQ-EXP-C).
- Second export while running: refused or queued (ENG-020).
- Progress does not freeze UI (C-31).

**S5 GIF/video** (only when encoder exists)

- GIF silent warning shown.
- GIF loop cont/N serialized.
- Video fps default = doc fps.
- No audio in model → video still succeeds **without** inventing silence-as-track unless 28.4 requires include-audio off. **If unspecified, export video without audio and do not lie.** `[NOT SPECIFIED` for missing-audio behavior — do not invent a silent AAC track]

**S6 publish**

- Settings persist on SYS-27 boundary.
- Loop / transparency honored.
- Profile switch does not dirty the document.

**H08 IDs to honor:** T-export-ok · T-export-fail · T-export-no-dirty · T-publish-ok · T-publish-error · T-handoff-engine-unavailable · T-cmd-export · T-file-export.

**F-28 tests to honor when that format exists:** TS-01 scale/transparency · TS-02 sequence range · TS-03/04 GIF · TS-05 mux · TS-06 HTML5 · TS-07 transparent canvas · TS-09 profiles · TS-10 camera (blocked) · TS-11 SWF skipped.

### 25.3 Manual QA (user) — not agent-claimable

- Desktop open-folder after export.
- Real Chrome FSA vs download.
- 4× 1920×1080 memory.
- Screen reader on progress.

---

## 26. Must-not-touch + Final acceptance checklist

### 26.1 Must not touch

| Path / concern | Why |
|---|---|
| `FOUNDATION_CONTRACT.md` | Leader / foundation |
| SYS-01 locked event **body** (additions only via INT) | FL-0030 |
| `FORENSIC_SPECS/SYS-08..28` product semantics rewrite | wrong owner |
| Other AIs' reports (overwrite) | append-only |
| `animator/**` **in this research increment** | already forbidden |
| File ▸ Open / New / Close behavior | next File feature = Open, later |
| Save / FSA / dirty / STM-DIRTY | SYS-02 Save already landed |
| Inventing MOD-DOC camera / audio / bitmap / mask / guide | foundation INT |
| `export:progress` / `export:failed` on the bus | not locked |
| Adobe-only: Publish Preview, SWF, OAM, AIR UI, File Info, include-hidden default ON | excluded |
| Force-push, PAT in remote URL, reuse of leaked PAT | BLK-B-005 |
| Marking SYS-27 or C-31 COMPLETE | FL-0018 / FL-0019 |
| Absorbing SYS-27 engines into `file.ts` | FL-0016 |
| Claiming unrun tests PASS | FL-0019 |
| Fixing BUG-D-001 "while we're here" | not this increment |

### 26.2 Final acceptance checklist (research increment)

- [x] 26 sections present
- [x] Authority order stated; code = evidence
- [x] Export ≠ Save ≠ Publish
- [x] One SYS owner; H08 handoff only
- [x] Blueprint Part 28 matrix captured
- [x] Adobe compared; Blueprint overrides labelled
- [x] Existing impl mapped to files
- [x] Bugs / gaps listed without "fixing" them here
- [x] AMBs explicit, not decided
- [x] External tech listed
- [x] Implementation order derived from P0 + honesty
- [x] Files + tests for future coding agents listed
- [x] Must-not-touch listed
- [x] No product code modified in the research increment
- [ ] Research commit on `main` (this increment's git step)
- [ ] Push — **blocked** until user pastes a **rotated** PAT (BLK-B-005)

### 26.3 Final acceptance checklist (future **implementation** — not this turn)

A coding agent may call an Export **slice** AUTOMATED TESTED only if:

1. Spec cells for that slice are implemented **or** still honestly toasted.
2. New tests in §25 for that slice exist and were **executed**.
3. Existing §18 tests still pass (or failures are pre-existing and recorded, not ignored).
4. No dirty / undo / `document:changed` from export.
5. `export:done` once on success, never on fail.
6. No new locked events without INT.
7. No fake encoder.
8. Native/wasm gaps labelled NOT TESTED if not run.
9. SYS-27 not marked COMPLETE without manual QA (FL-0018/19).

---

## Appendix A — Quick command map for agents

```
file.export('image')     → ExportDialog (stills + optional svgseq)
file.export('sequence')  → ExportDialog (should be sequence; today not preselected)
file.export('gif')       → toast  (until encoder)
file.export('video')     → toast  (until encoder)
file.export('movie')     → toast  (AMB-EXP-004)
file.publish()           → publishHtml5()  (PARTIAL vs 28.5)
file.publishSettings()   → toast
file.publishProfiles()   → toast
file.import(*)           → toast  (BLK-D-006)
```

## Appendix B — Source index

| Doc | Path |
|---|---|
| Blueprint 28 | `animate-blueprint/28_export_publish.md` |
| Blueprint 01 File | `animate-blueprint/01_application_map.md` §1.2.1 / §1.14 |
| Blueprint 20.2 | `animate-blueprint/20_layers.md` |
| Blueprint 16 | `animate-blueprint/16_camera.md` |
| Blueprint 33 | `animate-blueprint/33_data_model.md` |
| Blueprint 35 | `animate-blueprint/35_priorities.md` |
| F-28 | `phase2-knowledge-base/deep-research/F-28-01_export_publish/00_full.md` |
| C-31 | `phase2.5-ui/contracts/C-31_export.md` |
| eng 14 | `engineering/14_import_export.md` |
| STM-EXPORT | `engineering/04_state_machines.md` |
| REQ-EXP | `engineering/01_requirements.md` |
| overlays | `engineering/06_rendering.md` |
| H08/H09/H12 | `FORENSIC_SPECS/SYS-02/` |
| SYS-02 §14 | `FORENSIC_SPECS/SYS-02_file.md` |
| Contract | `PROJECT_COORDINATION/CROSS_SYSTEM_CONTRACT.md` |
| INT-AID-003 | `PROJECT_COORDINATION/INTEGRATION_LOG.md` |

---

*End of research contract. Coding agents: implement only a named slice from §23, against §10 + §22, with tests from §25. If a cell is AMB/BLOCKED/NOT SPECIFIED — stop. Do not guess.*
