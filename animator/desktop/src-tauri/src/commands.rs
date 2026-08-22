// Native filesystem + shell commands (desktop task §7/§11/§12).
//
// These are the OS-level primitives the editor reaches through the
// PlatformAdapter (ui/src/platform.ts). SYS-28's full persistence system
// (autosave, recovery, migration, corruption handling) is NOT implemented
// here — this is the filesystem foundation: open/save/save-as dialogs and an
// atomic write primitive. Browser mode keeps its own fallbacks; nothing here
// is invoked when running as a plain web page.

use serde::Serialize;
use std::path::Path;
use tauri::async_runtime::channel;
use tauri_plugin_dialog::{DialogExt, FilePath};

#[derive(Serialize)]
pub struct OpenedProject {
    pub path: String,
    pub name: String,
    pub content: String,
}

#[derive(Serialize)]
pub struct SavedProject {
    pub path: String,
    pub name: String,
}

#[derive(Serialize)]
pub struct ShellStatus {
    pub product: String,
    pub version: String,
    pub build_mode: &'static str,
    pub platform: &'static str,
    pub arch: &'static str,
    pub engine: &'static str,
}

/// Atomic write (tmp → rename): the last-good file stays intact on failure.
/// Mirrors the persist.rs contract — this is the shell primitive, not SYS-28.
fn atomic_write(path: &Path, content: &str) -> Result<(), String> {
    let tmp = path.with_extension("tmp");
    std::fs::write(&tmp, content).map_err(|e| format!("write {}: {e}", tmp.display()))?;
    std::fs::rename(&tmp, path).map_err(|e| format!("rename → {}: {e}", path.display()))?;
    Ok(())
}

fn stem(path: &Path) -> String {
    path.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("project")
        .trim_end_matches(".json")
        .to_string()
}

/// Pick a Save-As path WITHOUT writing (H05): the editor validates the path
/// (e.g. against already-open documents, INV-IDENT-4) BEFORE any write.
/// `None` = the user cancelled the dialog.
#[tauri::command]
pub async fn pick_save_path(window: tauri::Window, suggested_name: String) -> Option<String> {
    let file_name = if suggested_name.ends_with(".json") {
        suggested_name
    } else {
        format!("{suggested_name}.json")
    };
    let Some(file) = save_file(&window, &file_name).await else {
        return None;
    };
    file.into_path().ok().map(|p| p.display().to_string())
}

/// Bridge the dialog plugin's callback API onto the async runtime so the
/// command can `await` the user's choice without blocking the main thread.
async fn pick_file(window: &tauri::Window) -> Option<FilePath> {
    let (tx, mut rx) = channel::<Option<FilePath>>(1);
    window
        .dialog()
        .file()
        .add_filter("Kineora project", &["json"])
        .pick_file(move |file| {
            let _ = tx.blocking_send(file);
        });
    rx.recv().await.flatten()
}

async fn save_file(window: &tauri::Window, suggested_name: &str) -> Option<FilePath> {
    let (tx, mut rx) = channel::<Option<FilePath>>(1);
    window
        .dialog()
        .file()
        .add_filter("Kineora project", &["json"])
        .set_file_name(suggested_name)
        .save_file(move |file| {
            let _ = tx.blocking_send(file);
        });
    rx.recv().await.flatten()
}

/// File ▸ Open: native picker → read → return {path, name, content}.
/// `Ok(None)` = user cancelled (the UI treats this as no-change).
#[tauri::command]
pub async fn open_project_file(window: tauri::Window) -> Result<Option<OpenedProject>, String> {
    let Some(file) = pick_file(&window).await else {
        return Ok(None);
    };
    let path = file.into_path().map_err(|e| e.to_string())?;
    let name = stem(&path);
    let content =
        std::fs::read_to_string(&path).map_err(|e| format!("read {}: {e}", path.display()))?;
    Ok(Some(OpenedProject {
        path: path.display().to_string(),
        name,
        content,
    }))
}

/// File ▸ Save As / first Save: native save dialog → atomic write.
/// `Ok(None)` = cancelled. `Err` = write failure (UI keeps the doc dirty).
#[tauri::command]
pub async fn save_project_file_as(
    window: tauri::Window,
    suggested_name: String,
    content: String,
) -> Result<Option<SavedProject>, String> {
    let file_name = if suggested_name.ends_with(".json") {
        suggested_name
    } else {
        format!("{suggested_name}.json")
    };
    let Some(file) = save_file(&window, &file_name).await else {
        return Ok(None);
    };
    let path = file.into_path().map_err(|e| e.to_string())?;
    atomic_write(&path, &content)?;
    let name = stem(&path);
    Ok(Some(SavedProject {
        path: path.display().to_string(),
        name,
    }))
}

/// File ▸ Save on a TITLED document: overwrite a known path (P-1, no prompt).
#[tauri::command]
pub fn write_project_file(path: String, content: String) -> Result<bool, String> {
    atomic_write(Path::new(&path), &content)?;
    Ok(true)
}

/// Read a project file by path (Open Recent re-open).
#[tauri::command]
pub fn read_project_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(Path::new(&path)).map_err(|e| format!("read {path}: {e}"))
}

/// Existence probe (Open Recent stale check).
#[tauri::command]
pub fn file_exists(path: String) -> bool {
    Path::new(&path).exists()
}

/// Called by the UI after the SYS-02 close guard resolves (Save/Discard).
/// Re-issues the close with the guard satisfied so CloseRequested lets it pass.
#[tauri::command]
pub fn approve_close(window: tauri::Window) {
    crate::CLOSE_APPROVED.store(true, std::sync::atomic::Ordering::SeqCst);
    let _ = window.close();
}

/// Desktop-shell diagnostics (Dev panel): version/build mode/platform/engine.
#[tauri::command]
pub fn get_shell_status(app: tauri::AppHandle) -> ShellStatus {
    ShellStatus {
        product: "Kineora Animation".into(),
        version: app.package_info().version.to_string(),
        build_mode: if cfg!(debug_assertions) {
            "development"
        } else {
            "production"
        },
        platform: std::env::consts::OS,
        arch: std::env::consts::ARCH,
        engine: "animator-core",
    }
}

/// Development identity (auth hook, desktop task §8). No credentials are
/// collected or sent; this is the replaceable hook point for real auth later.
#[tauri::command]
pub fn get_identity() -> crate::auth::Identity {
    crate::auth::current_identity()
}
