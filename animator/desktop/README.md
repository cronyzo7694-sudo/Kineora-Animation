# Kineora Animation — Desktop Shell (Tauri v2)

The native desktop runtime that hosts the **same** React/UI + Rust/WASM
application that runs in the browser. This directory is infrastructure only —
it contains **no editor code** and **no animation features**.

```
Kineora app (shared: animator/ui + animator/core)
        │  platform-neutral frontend + Rust/WASM engine
        ▼
Desktop shell (this directory, Tauri v2)
        │  native window · filesystem · dialogs · lifecycle · diagnostics
        ▼
Platform-specific APIs (webkit2gtk/Linux · WebView2/Windows · WKWebView/macOS)
```

## Why Tauri v2

- **Same stack**: Rust-native shell hosting the existing React + WASM editor
  unchanged (no rewrite, no Node runtime shipped, offline-first).
- **Cross-platform**: Linux / Windows / macOS from one codebase; Android/tablet
  via Tauri's mobile host in the future (icon set is already generated).
- **Lightweight**: single ~12 MB binary + WebKit system webview (vs an
  Electron-sized runtime), matching the Linux-first product goal.
- **Shortcut correctness**: a Tauri webview has no browser chrome, so
  Ctrl+N/O/S/W/Q, F5… reach the app's existing command registry directly.

## Two modes (both use the same app code)

| Mode | Command | What it does |
|---|---|---|
| Browser dev | `cd animator/ui && npm ci && npm run wasm && npm run dev` | fast UI dev, automated tests, CI |
| Desktop dev | `bash scripts/dev-desktop.sh` | native window, real shortcuts/filesystem; hot-reload, **no installer per iteration** |
| Desktop build | `bash scripts/build-desktop.sh` | release binary + Linux bundles (deb/rpm/AppImage) |

## Architecture contracts (kept inside the shell, never in the editor)

- **`src/main.rs`** — window close is routed through the SYS-02 dirty-document
  guard: `CloseRequested → prevent_close → emit close-requested → JS runs the
  canonical Save/Discard/Cancel guard → invoke approve_close → real close`.
- **`src/commands.rs`** — native filesystem primitives (`open_project_file`,
  `save_project_file_as`, `write_project_file` atomic tmp→rename,
  `read_project_file`, `file_exists`) + shell diagnostics. SYS-28's full
  persistence (autosave/recovery/migration) is NOT implemented here.
- **`src/window_state.rs`** — window size/position/maximized persisted to the
  app config dir (workspace prefs, never document data, never undo).
- **`src/auth.rs`** — replaceable `IdentityProvider` trait; ships a
  **DEVELOPMENT ONLY** local identity (`Developer (local)`, no credentials
  collected or sent). Real auth later replaces this module without touching
  the editor.
- **`ui/src/platform.ts`** — the `PlatformAdapter` boundary the editor uses for
  open/save/save-as/close/shell-status; Linux/Tauri specifics never leak into
  React. Browser mode keeps the existing download/prompt fallbacks.

## Menus

The existing React menu bar (File…Help) is **retained** as the single command
source of truth — the desktop shell adds no duplicate native menus, so one
command id always drives menu/palette/shortcut. (macOS, when supported later,
will need a minimal native menu for accelerators + Quit/About; that remains a
documented future step, not a hidden gap.)

## Keyboard shortcuts

No desktop-side interception: Tauri delivers key events to the page, so the
app's command registry (Ctrl+N→file.new, Ctrl+S→file.save, Ctrl+K→palette,
Ctrl+Alt+T→timeline, F5–F7→frames, V/R/Q→tools …) is authoritative and
browser conflicts (Ctrl+N/W/T/L, F5) disappear.

## Platform status

| Platform | Status |
|---|---|
| Linux (Mint) | ✅ development target — window, dialogs, filesystem, close guard |
| Windows | 🔜 same shell (WebView2); icon set ready |
| macOS | 🔜 same shell (WKWebView); needs native app menu + accelerator wiring |
| Android / tablet | 🔜 Tauri mobile host (separate shell); icon set ready |

## Icons

`src-tauri/icons/` is generated from `app-icon.png` by `npm run icon`
(`tauri icon`). The set covers Linux/Windows/macOS bundles (Android/iOS sets
regenerate on demand).

## Diagnostics

The Dev panel (Window ▸ Developer) shows the **Desktop shell** line
(product/version/build mode/platform/arch/engine) and the development identity
when running under Tauri — never in production-facing UI.
