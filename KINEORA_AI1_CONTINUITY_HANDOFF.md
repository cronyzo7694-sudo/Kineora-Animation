# KINEORA AI-1 CONTINUITY HANDFOFF

> **Purpose:** single authoritative continuity contract between the current AI-1 (forensic/specification research AI) and the next AI-1 chat. The next AI-1 receives (1) this document, (2) the GitHub repository, (3) credentials if required, (4) the in-repo Blueprint/research files — and must be able to continue **as if it were this exact conversation**.
>
> **Continuity rule (re-verified every turn):** this document = history + process. **GitHub = current implementation truth.** **Approved forensic specs = behavioral truth.** **Blueprint = product-design authority.** **User manual QA = product acceptance truth.** Never trust this doc over the live repo — re-verify before acting.

---

## SECTION 1 — PROJECT IDENTITY

| Field | Value |
|---|---|
| **Project name** | **Kineora Animation** (product name everywhere — never "Animator", never a generic label) |
| **Product goal** | A **real, professional, production-grade 2D animation editor** — an Animate-class tool. Not a demo, not a mockup, not a portfolio prototype. |
| **Target users** | Real animation creators doing real projects (a real animator must be able to reliably use it for production work). |
| **Product positioning** | Local-first / offline-first (Blueprint W7), professional interaction architecture inspired by the workflow quality of Adobe Animate — but **original**, never an Adobe clone, no Adobe proprietary assets/branding/code. |
| **Technology architecture** | Rust core (`animator-core`) compiled to **WASM** via wasm-bindgen/wasm-pack → TypeScript client (`engine/client.ts`) → React/TypeScript UI (`animator/ui`) → hosted in a **Tauri v2** native shell (`animator/desktop`) with a browser dev mode as a development/testing fallback. One command registry (`commands.ts`), one event bus (`bus.ts`), one platform adapter (`platform.ts`). |
| **Repository** | `https://github.com/cronyzo7694-sudo/Kineora-Animation.git` (branch `main`). |
| **Major subsystems** | Document/engine (Rust: model, session, command/history, eval, export, persist, doc_manager) · UI (React: App shell, panels, timeline, stage, dialogs) · command registry + menus + palette + shortcuts · event bus · workspace/prefs · SYS-01..SYS-28 forensic systems (see §10). |
| **Current development stage** | Vertical-slice foundations complete (drawing, timeline, tweens, symbols, panels, UI foundation, SYS-01, SYS-02 through H01, native desktop shell). SYS-02 is being delivered **part-by-part** under the H00 constitution (currently at H01). |
| **Long-term platform targets** | **Linux (primary dev/test — user runs Linux Mint) · Windows · macOS · Android · tablets/touch.** Browser is dev-only, never the product spec. |

---

## SECTION 2 — TWO-AI WORKFLOW

**AI-1 — Specification / Forensic Research AI (the role being handed off):**
- Read the Blueprint; research official Adobe Animate + official sources; build deep forensic specifications.
- Identify every feature, control, interaction, dependency, UI→engine connection, edge case, conflict, missing behavior.
- Split large systems into implementation-safe parts; produce approved specifications.
- **AI-1 does NOT implement product code** unless explicitly asked.

**AI-2 — Implementation / Engineering AI:**
- Read the approved specification; audit the repository; implement the specified system/part.
- Connect UI → command → state → engine → events → UI; write tests; run builds; validate integration; report status honestly.
- **AI-2 must NOT invent missing behavior**; if the spec is ambiguous it STOPS and reports (never guesses).

*Practical note for the next AI-1: in this conversation the user has been providing the approved specs (acting as the spec source) and the assistant acted as AI-2. This handoff is written so either role can resume cleanly.*

---

## SECTION 3 — MASTER WORKFLOW

```
BLUEPRINT
  ↓
FORENSIC RESEARCH
  ↓
SYSTEM INVENTORY
  ↓
SYSTEM SPECIFICATION
  ↓
FORENSIC QA
  ↓
APPROVAL
  ↓
PART SPECIFICATION           (large systems split into H00 + H01..H14 parts)
  ↓
AI-2 IMPLEMENTATION
  ↓
AUTOMATED TESTS
  ↓
NATIVE DESKTOP TEST
  ↓
MANUAL USER ACCEPTANCE
  ↓
PASS / FAIL
  ↓  (FAIL → FIX → RETEST → back to MANUAL USER ACCEPTANCE)
NEXT PART SPECIFICATION
  ↓
NEXT IMPLEMENTATION
```

**Never skip the PASS gate.** Never start the next system merely because the previous one builds/tests green.

---

## SECTION 4 — ABSOLUTE QUALITY PHILOSOPHY

- **99.9%+ specification fidelity.** No intentional 1% shortcut.
- **No dead buttons · no fake controls · no placeholder-disguised-as-complete · no silent no-op · no fake success toast · no visually-convincing-but-disconnected feature · no "wire it later" for in-scope functionality.**
- A visible control is complete **only when its actual specified behavior occurs**.
- Priority order (fixed): **Correctness > Integration > Reliability > UX > Performance > Speed.** Speed is last. A feature may be rebuilt 10 times; a broken feature is never "done".

---

## SECTION 5 — END-TO-END CONNECTION CONTRACT

For every applicable feature, the chain is:

```
UI → User interaction → Command/Action → Client → WASM/Engine → Session/Model
→ State mutation → Event → UI refresh → Undo/Redo → Persistence → Import/Export
```

Not every feature needs every layer, but **no applicable link may be silently missing**. Layer applicability (from H00 §12, authoritative):
- **View-state actions** (tab switch, panel hide, selection, scrub): UI → STATE → EVENT → UI REFRESH (no command/client/model).
- **Document mutations**: full chain through MODEL.
- **Lifecycle** (New/Open/Close): COMMAND → SESSION → STATE → `activeDoc:changed` → UI rebind.
- **Save/Open I/O**: COMMAND → SYS-28 handoff → `saving:changed` → UI.

---

## SECTION 6 — SPECIFICATION AUTHORITY

Priority order (locked):
1. Approved Kineora **Blueprint**
2. Approved **forensic specification**
3. Explicit Kineora **design decisions**
4. Official **Adobe Animate** evidence
5. Official technical documentation
6. Secondary research
7. Inference

- Blueprint vs Adobe disagreement → **BLUEPRINT WINS**.
- Adobe feature not in Blueprint → **do NOT silently add**. Classify `[ADOBE FEATURE — NOT IN BLUEPRINT]`; inclusion = product decision.
- Neither AI may silently expand scope. Evidence labels used throughout: `[BLUEPRINT REQUIRED] / [BLUEPRINT + ADOBE] / [BLUEPRINT OVERRIDE] / [ADOBE REFERENCE] / [ADOBE FEATURE — NOT IN BLUEPRINT] / [OUR DESIGN DECISION] / [NOT SPECIFIED] / [INFERENCE]`.

---

## SECTION 7 — PREVIOUS MAJOR MISTAKES (permanent lessons)

1. **SYS-02 was first attempted as one giant unit** → token/context pressure + incomplete behavior. **Lesson:** large systems MUST be decomposed into deep implementation-safe parts (now H00 + H01..H14).
2. **Automated tests over-trusted** → **green tests ≠ product acceptance.**
3. **UI looked correct while functionality was disconnected** → every visible control needs end-to-end verification.
4. **Browser shortcuts intercepted by the browser** (Ctrl+N/W/O/S/Q/T/L, F5) → **native desktop runtime is authoritative for shortcut testing.**
5. **Tab switching not validated** → dependent acceptance tests must be **BLOCKED** when prerequisites fail (never reported PASS).
6. **Right-click caused destructive action** (tab right-click closed the document instead of showing a menu) → right-click must NEVER trigger destructive actions; context-menu semantics explicitly tested. *(Fixed at H01 — see §14.)*
7. **White text on white background** (New dialog unreadable) → visual QA is a **functional acceptance requirement**.
8. **Empty/hidden/no-op states mistaken for valid states** → "nothing happened" is not acceptable behavior.
9. **UI tests mocked the engine** → mocked tests prove wiring assumptions, not real engine integration.
10. **Stale WASM masquerading as empty/unavailable** → engine-version/build-state honesty required (library stale-state, engine-status honesty).
11. **Panel layout had a real failure** → bounded layout + actual manual viewport testing required.
12. **Parallel `cargo` + `npm install` calls raced** (same snapshot) → run toolchain installs sequentially.
13. **`git` identity/remote lost mid-turn after sandbox resets** → re-add identity (`cronyzo7694-sudo` / `cronyzo7694@users.noreply.github.com`) and remote before committing.
14. **Scripts showed as mode-only diffs after resets** → `chmod +x scripts/*.sh` and `git checkout -- scripts/`.
15. **WASM build wrote to the wrong dir** (`wasm-pack --out-dir` resolves relative to the crate) → `scripts/build-wasm.sh` uses ABSOLUTE paths; `verify-wasm-path.sh` regression-guards it.
16. **Vite forbids `import()` of `public/`** → loader fetches glue JS as text, evaluates via Blob URL, fetches `.wasm` explicitly.
17. **CI workflow unpushable** (PAT lacks `workflow` scope) → `.github/workflows/ci.yml` exists locally, cannot be pushed by the current token (see §9).

*Do not delete embarrassing failures — they are engineering knowledge.*

---

## SECTION 8 — CURRENT ARCHITECTURE (as it actually exists)

### Repository layout (application-relevant)
```
/home/user (git root)
├── ANIMATE_BLUEPRINT_MASTER.md · animate-blueprint/ (40 parts, 00..36)
├── phase2-knowledge-base/ (deep-research F-xx-yy) · phase2.5-ui/ (contracts C-01..C-38)
├── engineering/ (00..18 global audit) · docs/ (BUGS.md, TEST_REPORT.md) · scripts/
├── uploads/ (specs pasted by user: SYS-01, SYS-02, H00 — UNTRACKED)
└── animator/
    ├── 00_IMPLEMENTATION_DECISIONS.md · README.md · STATUS.md
    ├── core/          Rust engine → WASM
    │   ├── src/{lib, doc_manager, model, session, command, eval, export, persist, easing, id, wasm, main}.rs
    │   └── tests/{doc_manager, document, document_lifecycle, draw, export, frames, frames_seq,
    │              layers, properties, sequences, slice, symbols, symbols_usability, timeline,
    │              transform, transform_selection, tween}.rs
    ├── ui/            React + TypeScript (package kineora-ui)
    │   └── src/{App, main, commands, menus, shortcuts, controlRegistry, bus, useBus,
    │            workspace, panelLayout, file, platform}.ts/.tsx
    │       components/{MenuBar, CommandPalette, Toolbar, Stage, TimelineStrip, LayersPanel,
    │            PropertiesPanel, LibraryPanel, StatusBar, DebugPanel, PanelHeader, ResizeHandle,
    │            EditBar, DocumentTabs, WorkspaceSwitcher, ExportDialog, SymbolDialog,
    │            NewDocumentDialog, TemplateGalleryDialog, SaveTemplateDialog,
    │            CloseConfirmationDialog, GoToFrameDialog, DocumentSettingsDialog,
    │            ShortcutsDialog, AboutDialog}.tsx
    │       editor/{gesture, transformMath}.ts · render/{canvasRenderer, viewport}.ts
    │       engine/{client, actions, wasmTypes}.ts
    └── desktop/       Tauri v2 native shell
        └── src-tauri/{main, commands, auth, window_state}.rs · tauri.conf.json ·
            capabilities/default.json · Cargo.toml · icons/ (generated)
```

### Rust core (`animator/core`)
- **Model** (`model.rs`): `Document{settings, scenes, nodes, library, next_id}`, `Scene`, `Layer`, `Frame{Keyframe|Blank}`, `Node{Rect|SymbolInstance}`, `Symbol`, `Transform`, `Settings{width,height,fps,background,units,platform}` (units/platform serde-default), `ClassicTween`, `LoopMode`.
- **Session** (`session.rs`): owns `doc + history + selection + playhead + active_scene + active_layer + frame_clipboard + event_log`. All mutations via `history.execute(Box<dyn Command>)`. `Session::from_document(doc)` = the reload contract (selection empty, playhead 1, fresh history, CLEAN). `is_dirty()`/`mark_clean()` delegate to history.
- **History** (`command.rs`): `undo/redo` stacks + a single `dirty: bool` — the **STM-DIRTY chokepoint**: `execute`/`undo`/`redo` set dirty; `mark_clean` (Save/Load/New) clears it. `undo_len/redo_len`.
- **DocManager** (`doc_manager.rs`, extracted for native testability): `ManagedDoc{id,title,session}` list + `active` index + monotonic `next_id` + untitled counter. Methods: `push_new`, `push_opened`, `push_session`, `replace_active` (keeps id, resets session), `close`, `set_active`, `set_title`, `active_id`. **Document ID = the monotonic id (identity); title/path are never identity.**
- **WASM facade** (`wasm.rs`, `#[cfg(target_arch="wasm32")]`): thread_local `RefCell<DocManager>`; `kineora_*` functions cross the bridge as JSON; includes multi-doc facades (`doc_count/doc_list/active_doc_id/set_active_doc/close_doc/set_doc_title/open_json/mark_clean/new_full`) and the full edit/eval/symbol/export surface. `kineora_status()` returns `doc_id/doc_title/dirty/doc_count/docs/units/platform` alongside playhead/selection/layers.
- **persist.rs**: atomic tmp→rename save/load (native path API); export.rs: SVG + scaled.
- Tests: **230 native Rust tests** (at `fa4b77e`), incl. 9 `doc_manager` (identity/lifecycle) + 7 `document_lifecycle` (dirty/undo).

### TypeScript client + UI
- **`engine/client.ts`**: the UI's ONLY doorway to the engine. Loads the WASM glue as text → Blob-URL import → explicit `.wasm` fetch (canonical `/wasm/kineora_core.js` + `_bg.wasm`). Honest "engine not attached" fallback, never a fake attach. Facade wrappers for every `kineora_*`.
- **`engine/actions.ts`**: discrete engine actions (undo/redo/keyframe/save/select-all/deselect) + playback transport (`togglePlay`, `stopPlayback`, loop state) that emit `playback:*`/`saving:changed` on the bus.
- **`commands.ts`**: THE single command registry (~150 commands). Every command: `id, label, category, shortcut, status (FUNCTIONAL|DEFERRED|UNAVAILABLE), source (blueprint/Adobe classification), enabled(ctx), whyDisabled(ctx), checked(ctx), run(ctx, input?)`. Validation rejects duplicate ids / unbound FUNCTIONAL / shortcut conflicts. `makeCommandContext` builds partial contexts.
- **`menus.ts` + `MenuBar.tsx`**: 11 top menus (File/Edit/View/Insert/Modify/Text/Commands/Control/Debug/Window/Help), flyout submenus, dynamic `workspaceList` + `recentList` entries, disabled+reason, checkmarks.
- **`shortcuts.ts`**: one normalizer + one lookup + `useShortcutScope` (disjoint App/Stage/Timeline scopes; disabled commands report why; Ctrl+Y→redo alias).
- **`bus.ts` + `useBus.ts`**: typed event bus with failure isolation; locked event names incl. `activeDoc:changed{docId}`, `saving:changed`, `panel:changed`, `workspace:changed`, `playback:started/stopped`, `playhead:moved`, `tool:changed`.
- **`platform.ts`**: `PlatformAdapter` boundary — desktop (Tauri `window.__TAURI__` global) vs browser fallback. `openProject/saveProjectAs/writeProject/readProject/getShellStatus/getIdentity/approveClose/onCloseRequested/exit`.
- **`file.ts`**: SYS-02 document lifecycle actions (createDocument/openDocument/saveDocument/close/recent/templates/handoffs) routed through the platform adapter.
- **`workspace.ts`**: named workspaces (save/switch/reset) + visibility/collapse/layout prefs under key `kineora.workspace`; corrupt→auto-reset.
- **`panelLayout.ts`**: pure sizing math (`distribute`, `clampPanePref`) + constraints (LAYERS_W 140–480, PROPS_W 240–520, TIMELINE_H 96..60% viewport, panes).
- **Panels**: Layers, Properties, Library, Dev (close × + collapse chevron via `PanelHeader`); Stage (canvas renderer + gestures); TimelineStrip (ruler/cells/keyframes/transport/loop/zoom/sequences/tween/ease); StatusBar (12 cells + go-to-frame); DocumentTabs; dialogs.
- **Design tokens** (`ui/index.html` `:root`): `--kineora-bg/panel/surface/input-bg/input-border/text/text-bright/muted/disabled-text/accent/accent-text/focus-ring/border/border-2/danger/ok/warning` + a global `:focus-visible` ring. H01 dialogs now use tokens (no hard-coded hex). Dark = complete default theme.

### Desktop shell (`animator/desktop`, Tauri v2)
- `main.rs`: OS `CloseRequested → prevent_close → emit "close-requested" → JS SYS-02 dirty guard → invoke approve_close → real close`. Startup errors → stderr + exit(1) (never blank window).
- `commands.rs`: native `open_project_file / save_project_file_as / write_project_file (atomic tmp→rename) / read_project_file / file_exists / approve_close / get_shell_status / get_identity`.
- `window_state.rs`: window size/pos/maximized → app config dir (workspace prefs, not document).
- `auth.rs`: `IdentityProvider` trait + DEVELOPMENT-ONLY "Developer (local)" identity (no credentials collected/sent; real auth replaces this module later).
- `tauri.conf.json`: `withGlobalTauri: true`, window 1440×900 min 960×600, icon set.

---

## SECTION 9 — CURRENT GIT / REPOSITORY STATE

| Item | Value (verified at handoff creation) |
|---|---|
| Branch | `main` |
| **HEAD** | **`fa4b77e`** `feat(sys02-h01): new document + dialog + templates (H00 constitution)` |
| origin/main | `fa4b77e` (== HEAD, pushed) |
| Working tree | clean except untracked `uploads/` (user-pasted specs) and `.github/` (unpushable CI file) |
| Latest relevant commits | `fa4b77e` (H01) · `6258d50` (linux deps installer) · `04ae0d5` (gitignore gen schemas) · `42d1b97` (desktop runtime) · `bfca8ce` (SYS-02) · `dee5c27` (SYS-01) · `b33a5f0`+`1bc013e`+`184b4cc` (UI foundation) · `f59f1a5`/`566f0a3`/`d0c055b`/`cd6fc44`/`e23c23f` (timeline/symbols/tween) |
| Test counts at HEAD | Rust **230/230** · UI **419/419** · `cargo fmt --check` ✓ · `cargo clippy --all-targets` **0** ✓ · `wasm32-unknown-unknown` build ✓ · `npm run build` ✓ · full `tauri build --no-bundle` ✓ (verified in-sandbox with webkit2gtk-4.1 installed) |
| Git identity | `cronyzo7694-sudo` / `cronyzo7694@users.noreply.github.com` (must re-add after sandbox resets) |
| Remote | `origin` = GitHub URL with embedded PAT (see credentials note below) |
| Untracked `uploads/` | `SYS-01_application_workspace.md`, `SYS-02_file.md`, `H00_SYSTEM_CONSTITUTION.md` — the authoritative pasted specs |
| Untracked `.github/` | `workflows/ci.yml` (rust fmt+clippy+test+wasm; node ci+test+build) — **push BLOCKED: token lacks `workflow` scope** |
| Ignored/generated | `node_modules/ target/ dist/ .cargo/ .rustup/ .npm/ .cache/ .profile/ animator/ui/public/wasm/ animator/desktop/src-tauri/gen/ *.tsbuildinfo` |

**Credentials note:** the GitHub remote URL embeds a PAT (`github_pat_…`). Do NOT copy the token into any committed file. The next AI receives the token separately if required; otherwise ask the user. `.netrc` / `.git-credentials` are excluded from snapshots and never committed.

**Build requirements (Linux desktop):** Rust toolchain + `wasm-pack` + system libs `libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev libssl-dev pkg-config` (one-command: `bash scripts/install-linux-deps.sh`).

---

## SECTION 10 — SYSTEM REGISTRY

Approved registry (SYS-01…SYS-28) with status:

| System | Status |
|---|---|
| **SYS-01 Application / Workspace** | SPEC complete · **IMPLEMENTED · MANUALLY ACCEPTED** (see §11) |
| **SYS-02 File** | SPEC complete (original `SYS-02_file.md`) · re-structured under H00; **H00 complete, H01 implemented (manual acceptance PENDING)** |
| SYS-03 Edit | not started (parts SYS-03…) |
| SYS-04 View · SYS-05 Insert · SYS-06 Modify · SYS-07 Text · SYS-08 Commands · SYS-09 Control/Playback · SYS-10 Debug · SYS-11 Window · SYS-12 Help · SYS-13 Tools · SYS-14 Stage · SYS-15 Timeline · SYS-16 Layers · SYS-17 Properties · SYS-18 Library · SYS-19 Symbols/Instances · SYS-20 Drawing/Shapes · SYS-21 Color · SYS-22 Transform · SYS-23 Tweening · SYS-24 Onion/FBF · SYS-25 Camera · SYS-26 Audio · SYS-27 Import/Export/Publish · SYS-28 Persistence | not started (pre-Forensic foundations exist for Timeline/Symbols/Drawing/Transform/Tweening as vertical slices) |

> The registry above matches the approved SYS-01 §21/§31 ownership model. SYS-27 (import/export/publish) and SYS-28 (persistence) are **handoff systems** — SYS-02 defines triggers/UI only, never their internals.

---

## SECTION 11 — SYS-01 CURRENT STATUS

- **Specification status:** COMPLETE (`uploads/SYS-01_application_workspace.md`, forensic v5).
- **Implementation status:** IMPLEMENTED (`dee5c27`).
- **Manual acceptance status:** **ACCEPTED by the user** (user tested panel/menu/workspace batches; reported via `1-P/2-F…` format; fixes folded in).
- **Tests:** UI 355 at the time; later refactors kept the suites green.
- **Native runtime:** desktop shell came after SYS-01 (see §15); SYS-01 UI verified in browser by the user.
- **Deferred (honest, in spec):** panel dock/float/tab-stack (dedicated docking unit) · multi-document tabs (→ SYS-02) · scene tabs (SYS-06) · light theme (tokens exist; full light theme needs per-system adoption) · mobile bottom-sheets (partial breakpoints).
- **Commit:** `dee5c27` `feat(sys01): application/workspace system — …`.

---

## SECTION 12 — SYS-02 CURRENT STATUS (extremely detailed)

- **Original spec:** `uploads/SYS-02_file.md` (forensic QA PASSED; resolved decisions **P-1…P-10** are authoritative: P-1 Save=overwrite no-confirm · P-2 W/H≥2 no upper bound · P-3 read-only→save-fail path · P-4 unbounded recent · P-5 per-doc Close-All guard · P-6 idempotent Save · P-7 template store = deployment detail · P-8 platform default HTML5 Canvas · P-9 formatVersion = SYS-28 gap · P-10 u64 vs UUID = engineering note).
- **Why SYS-02 was split:** a single giant SYS-02 unit caused token/context pressure + incomplete behavior (mistake #1). Decision: SYS-02 → **H00 constitution + H01…H14 parts**.
- **H00 purpose:** constitutional authority (identity, lifecycle, dirty, multi-doc, destructive-safety, command/event/undo/persistence/error/visual/browser-vs-native rules + 19 global invariants + ambiguity register). **Must be read completely before any SYS-02 work.**
- **Current H00 status:** COMPLETE (forensic foundation; 4 unresolved ambiguities AMB-001..004 owned by later parts H02/H05/H06/H10 — none silently resolved).
- **Current AI-2 implementation status:** H01 implemented at `fa4b77e`.
- **Current manual testing status:** **H01 MANUAL ACCEPTANCE = PENDING** (user has not yet reported the H01 matrix).
- **Known failures (fixed at H01):** tab right-click was destructive (→ now no-op menu-suppress) · dialogs called engine mutators directly (→ now re-invoke canonical commands) · dialog hard-coded colors (→ design tokens + `colorScheme:dark`).
- **Unresolved issues:** AMB-001 (two docs same path) · AMB-002 (ID collision on open) · AMB-003 (recent-file store API) · AMB-004 (native menu/accelerator wiring) — all **must be resolved in their owning parts before those parts are marked complete**.
- **Dependencies:** SYS-28 (persistence internals), SYS-27 (import/export/publish), SYS-18 (external library), SYS-01 (chrome/events), SYS-06/SYS-17 (Document Properties = Ctrl+J, NOT File-owned).
- **What AI-1 does next:** after H01 PASS → create **H02 specification** (Multi-Document + Tabs + Active Document).
- **What AI-2 does next:** after H01 PASS → implement H02 per its spec.
- **⚠ DO NOT return to giant SYS-02 implementation.** The flow is strictly: H00 → H01 → *(manual PASS)* → H02 → … → H14.

---

## SECTION 13 — H00 CONSTITUTION

**File:** `uploads/H00_SYSTEM_CONSTITUTION.md` (SYS-02/H00). **Constitutional authority for SYS-02.** Read it completely before continuing SYS-02.

H00 defines (summary of binding rules):
- **Lifecycle** = 3 orthogonal dimensions, NOT one flat enum: DIM-A LIFECYCLE (`NO_DOCUMENT/ACTIVE/OPENING/RECOVERED`) × DIM-B IDENTITY (`UNTITLED/TITLED`) × DIM-C DIRTY (`CLEAN/DIRTY/SAVING/SAVE_ERROR`, machine = STM-DIRTY). 14 transitions; forbidden transitions listed.
- **Identity:** Document ID = identity; **title is display-only; path is not identity**; Save As preserves ID; tab switch never mutates identity.
- **Dirty rules:** only DOCUMENT MUTATION sets DIRTY; DIRTY→CLEAN only via successful write; **Save does NOT clear undo history**; dirty is per-document, never transferred on switch; New/Open start CLEAN; undo/redo dirty iff doc ≠ last-saved snapshot.
- **Multi-doc invariants (INV-MD-1..10):** per-doc state isolation, exactly-one-active, switch never mutates/merges undo/transfers selection/dirty, switch rebinds ALL document-bound UI.
- **Destructive safety:** **RIGHT-CLICK ≠ DESTRUCTIVE** (INV-DSTR-1/2); destructive ops are explicit + guarded (Close/CloseAll/Exit/Open confirm only if DIRTY; no invented confirmations).
- **Native desktop is authoritative**; browser is a dev harness; browser limits never reduce the spec.
- **Testing/PASS-FAIL gates:** green tests ≠ product pass; prerequisite fail ⇒ dependent tests **BLOCKED** (never PASS); no silent failures; no data loss.
- **19 global invariants (INV-001..INV-019)** with source/severity/test-method — treat as the SYS-02 test checklist.
- **Ambiguity register** (AMB-001..005) with per-owner resolution gates.

---

## SECTION 14 — CURRENT H01 STATUS

- **H01 scope:** New Document + New Document Dialog + New-from-Template + template creation/loading mechanism.
- **Specification:** H01 spec was **not provided as a separate file** — the user's H01 implementation directive (this conversation) + H00 §24 (H01 relies on identity/lifecycle T1/visual/error constitutions) served as the spec.
- **AI-2 status:** **IMPLEMENTED** at commit `fa4b77e` (details below).
- **Manual acceptance:** **PENDING** — the user has NOT yet run the H01 manual matrix in the native desktop app.

H01 implementation summary (`fa4b77e`):
- New dialog (platform/units/W/H/fps/background; defaults 1920×1080 px/24/#fff/HTML5 Canvas; W/H≥2 no max, fps 1–120; inline errors + Create disabled; Enter=Create, Esc=Cancel, Tab/Shift+Tab).
- Templates: preset-JSON save/list/load; seed = fresh engine parse → **independent** document (never the source instance).
- Command architecture: `file.new` / `file.newFromTemplate` / `file.saveAsTemplate` are single commandIds with input branching; dialogs re-invoke them (no direct engine writes).
- Engine: `DocManager` extracted to `core/src/doc_manager.rs` (unique IDs, one-active, New→CLEAN, per-doc isolation, close-isolation, replace-preserves-identity) — 9 native tests.
- P0 fix: tab right-click no longer closes (INV-DSTR).
- Visual: dialogs on design tokens + `:focus-visible` ring.
- Tests at HEAD: core 230, UI 419; full native `tauri build --no-bundle` succeeded in-sandbox.

---

## SECTION 15 — NATIVE DESKTOP RUNTIME

| Aspect | Value |
|---|---|
| Technology | **Tauri v2** (`animator/desktop`), plugins: `tauri-plugin-dialog` |
| Dev command | `bash scripts/dev-desktop.sh` (build wasm → npm ci → `tauri dev`; no installer per iteration) |
| Production build | `bash scripts/build-desktop.sh` (`tauri build` → release binary + deb/rpm/AppImage) |
| Linux status | ✅ implemented; **in-sandbox full `tauri build --no-bundle` verified** (webkit2gtk-4.1 installed). **User's Linux Mint machine: the user hit a `webkit2gtk-4.1 not found` build error; the fix (`bash scripts/install-linux-deps.sh`) was provided but the user has NOT yet reported whether the desktop app now launches → native desktop manual QA is UNVERIFIED.** |
| Windows status | 🔜 same shell (WebView2); icon set ready |
| macOS status | 🔜 same shell (WKWebView); needs native app menu + accelerator wiring (AMB-004, → H10/H11) |
| Android/tablet | 🔜 future Tauri mobile host (separate shell); icon set generated |
| Shortcut authority | No desktop interception; Tauri delivers keys to the page → the app's `commands.ts` registry is authoritative. Browser conflicts (Ctrl+N/W/O/S/Q/T/L, F5) disappear natively. |
| Filesystem boundary | native open/save-as dialogs + atomic tmp→rename write + read/exists via `platform.ts` → `commands.rs`. SYS-28 full persistence (autosave/recovery/migration) is NOT implemented here (boundary documented). |
| Window lifecycle | OS close → SYS-02 dirty guard (Save/Discard/Cancel) → `approve_close`. Window geometry persisted to app config dir. |
| Auth placeholder | `auth.rs` `IdentityProvider` trait + DEVELOPMENT-ONLY "Developer (local)". No credentials collected/sent; real auth replaces this module later. |
| Browser fallback | dev mode only; keeps download/prompt fallbacks + `beforeunload` guard. Never the product spec. |
| Linux system deps | `libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev libssl-dev pkg-config` (→ `bash scripts/install-linux-deps.sh`; Debian/Ubuntu/Mint, Fedora, Arch branches included) |
| Icons | `src-tauri/icons/` generated from `app-icon.png` via `npm run icon` (`tauri icon`) |

---

## SECTION 16 — TESTING PHILOSOPHY

- Automated PASS ≠ Product PASS.
- Native desktop manual QA is **mandatory** for desktop behavior.
- Prerequisite failure ⇒ dependent tests = **BLOCKED** (never reported PASS).
- No console errors allowed for accepted functionality.
- No data loss. No accidental destructive interaction.
- No regression accepted merely because unrelated tests pass.
- Mocked UI tests prove wiring, not engine integration — add Rust/native tests wherever the architecture permits.

---

## SECTION 17 — MANUAL ACCEPTANCE PROCESS

1. AI-2 reports implementation + a **manual acceptance matrix** (batches of ~10; user reports `1-P`, `2-F`, `3-B`/`BLOCKED`).
2. User tests the **native desktop** app.
3. AI-1 reviews failures.
4. AI-2 fixes **only the reported failures** (spec-first).
5. User retests.
6. Repeat until PASS.
7. Only then does AI-1 create the next specification.

**No skipping.** Never mark a blocked test PASS. Never override a user-reported real product failure just because automated tests are green.

---

## SECTION 18 — SPECIFICATION CREATION PROCESS (AI-1)

When creating the next part/system spec, AI-1 must:
1. Read the approved Blueprint sections → 2. Phase 2 research → 3. Phase 2.5 UI contracts → 4. Phase 3 engineering requirements → 5. inspect the current repository → 6. inspect current implementation → 7. research official Adobe Animate → 8. compare Blueprint vs Adobe → 9. identify conflicts → 10. identify dependencies → 11. split work if too large → 12. produce a deep forensic spec → 13. self-audit for missing controls/interactions → 14. never silently invent behavior → 15. STOP after producing the requested spec.

---

## SECTION 19 — FORENSIC SPECIFICATION DEPTH

Every future spec must resolve, per feature, down to:
- every button / menu item / submenu / context menu / shortcut / mouse interaction / keyboard interaction / modifier / state / selection behavior / validation rule / error state / dependency / command
- UI→engine path · undo · redo · persistence · import/export · edge cases · accessibility · visual states · disabled/loading/empty/failure states · cross-system interactions.

A one-liner like "Library → Rename" is **NOT sufficient** — it must resolve to: asset row → interaction → editable field → validation → duplicate handling → Enter → Esc → ID preservation → instance update → undo → persistence → error behavior.

---

## SECTION 20 — DEAD CONTROL POLICY

A control is NOT complete because it renders / has an onClick / a mocked test passes / it shows a toast / it changes CSS. It is complete **only when the specified behavior actually occurs**. Every functional control must be connected (trigger → command → state → engine → event → refresh → error/undo/persistence). Registry lint + Dev panel "0 dead buttons" is the floor, not the ceiling.

---

## SECTION 21 — CROSS-SYSTEM DEPENDENCY POLICY

No system is an island. Before finalizing a spec, identify dependencies across the full SYS-01..SYS-28 registry (File…Persistence). If a feature depends on a future system, **mark the dependency explicitly** (e.g. `[SYS-27 OWNED]`, `[SYS-28 OWNED]`) and define the handoff contract — never fake the future dependency.

---

## SECTION 22 — CURRENT DEVELOPMENT RULE

No rushing. Priority: **1 Correctness · 2 Integration · 3 Reliability · 4 UX · 5 Performance · 6 Speed.** A feature can be rebuilt 10 times; a broken feature is never "complete".

---

## SECTION 23 — USER ROLE

- The **user is the final manual acceptance authority** and speaks Hindi/English ("bhai"); wants maximum depth per turn, honest blocker reports, numbered acceptance matrices (`1-P 2-F 3-B`).
- AI-1 researches/specifies; AI-2 implements; the user manually tests the native product and decides PASS/FAIL.
- AI-1 must **never override a user-reported real product failure** because automated tests pass.
- The user's Linux PC is the final authority for runtime behavior; never claim manual verification on the user's behalf.

---

## SECTION 24 — CURRENT CHAIN POSITION (exact state machine)

```
CURRENT PROJECT STATE:

AI-1 (spec/research):
    DONE  → H00 constitution (SYS-02) reviewed/complete; SYS-01 & SYS-02 original specs complete.
    NEXT  → write the H02 specification — BUT ONLY after H01 is manually accepted.

AI-2 (implementation):
    DONE  → SYS-01 (accepted), SYS-02 H01 (fa4b77e), desktop runtime (42d1b97), linux deps installer (6258d50).
    NEXT  → fix H01 failures if the user reports any; then implement H02 after its spec lands.
    ⚠ ALSO PENDING → user must confirm the native desktop app LAUNCHES on Linux Mint
                     (install script was given for the webkit2gtk-4.1 error; result not yet reported).

USER:
    Testing → H01 manual acceptance matrix (10 rows: New dialog / visual contrast /
              validation / Create / Cancel / identity / dirty state / active document /
              template / error handling) in the native desktop app.
    Also pending → confirm desktop launch after `bash scripts/install-linux-deps.sh`.

LAST APPROVED:        SYS-02 H00 (constitution) + H01 implementation directive.
CURRENTLY UNDER TEST: SYS-02 H01 (manual acceptance PENDING).
NEXT ACTION AFTER PASS:   AI-1 creates the H02 specification (Multi-Document + Tabs + Active Document);
                          AI-2 then implements H02.
NEXT ACTION AFTER FAIL:   AI-2 fixes ONLY the reported H01 failures (spec-first), re-runs
                          regression, user retests.
NEXT SPECIFICATION:   SYS-02 H02 (after H01 PASS).
DO NOT:               start H02/H03 implementation before H01 PASS · return to a giant SYS-02 unit ·
                      start SYS-03 · silently resolve AMB-001..004 · mark desktop manual QA PASS
                      without the user's real desktop test · commit the PAT/token into any file.
```

---

## SECTION 25 — CONTINUITY RULE

The next AI-1 must NOT treat this handoff as complete truth forever. Verify the live repo from GitHub before acting.

- **HISTORY → this handoff document.**
- **CURRENT CODE → GitHub.**
- **BEHAVIOR → approved forensic specification.**
- **PRODUCT ACCEPTANCE → user manual QA.**

---

## SECTION 26 — FINAL SELF-AUDIT

- [x] AI-1 role preserved (§2, §18–19)
- [x] AI-2 role preserved (§2, §12)
- [x] Two-AI workflow preserved (§2–3)
- [x] PASS/FAIL gating preserved (§3, §17)
- [x] BLOCKED semantics preserved (§16–17, §24)
- [x] SYS-01 status recorded (§11)
- [x] SYS-02 status recorded (§12)
- [x] H00 recorded (§13)
- [x] H01 recorded (§14)
- [x] Native desktop runtime recorded (§15)
- [x] Previous failures + lessons recorded (§7)
- [x] Current Git state recorded (§9)
- [x] Architecture recorded (§8)
- [x] System registry recorded (§10)
- [x] Specification creation rules recorded (§18–19)
- [x] Implementation rules recorded (§4–6, §20)
- [x] Manual QA rules recorded (§16–17)
- [x] Cross-system dependencies recorded (§21)
- [x] After-PASS action recorded (§24)
- [x] After-FAIL action recorded (§24)
- [x] No unknown information invented (all UNKNOWN/UNRESOLVED/DEFERRED/DEPENDENCY items are explicitly labeled)

---

*Handoff complete. STOP — no new system started, no H01/H02 created, no product code modified.*
