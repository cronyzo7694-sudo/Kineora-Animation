// Window-state persistence (desktop task §13).
//
// Window size / position / maximized are APPLICATION/WORKSPACE PREFERENCES —
// stored in the app config dir, never in document data, never on the undo
// stack. Restore is best-effort (missing/corrupt file → defaults; a window
// smaller than a sane floor is ignored).

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{Manager, PhysicalPosition, PhysicalSize};

const MIN_WIDTH: u32 = 320;
const MIN_HEIGHT: u32 = 240;

#[derive(Default, Serialize, Deserialize)]
struct WindowState {
    width: u32,
    height: u32,
    x: i32,
    y: i32,
    maximized: bool,
}

fn prefs_path(app: &tauri::AppHandle) -> PathBuf {
    app.path()
        .app_config_dir()
        .unwrap_or_default()
        .join("window-state.json")
}

/// Persist the current window geometry (called on the approved OS close).
pub fn save(window: &tauri::Window) {
    let Ok(size) = window.outer_size() else {
        return;
    };
    let pos = window.outer_position().ok();
    let state = WindowState {
        width: size.width,
        height: size.height,
        x: pos.map(|p| p.x).unwrap_or(0),
        y: pos.map(|p| p.y).unwrap_or(0),
        maximized: window.is_maximized().unwrap_or(false),
    };
    let path = prefs_path(window.app_handle());
    if let Some(dir) = path.parent() {
        let _ = std::fs::create_dir_all(dir);
    }
    if let Ok(json) = serde_json::to_string(&state) {
        let _ = std::fs::write(path, json);
    }
}

/// Restore the previous window geometry (called once at startup).
pub fn restore(app: &tauri::AppHandle) {
    let Some(win) = app.get_webview_window("main") else {
        return;
    };
    let Ok(json) = std::fs::read_to_string(prefs_path(app)) else {
        return;
    };
    let Ok(state) = serde_json::from_str::<WindowState>(&json) else {
        return;
    };
    if state.width >= MIN_WIDTH && state.height >= MIN_HEIGHT {
        let _ = win.set_size(PhysicalSize::new(state.width, state.height));
    }
    if state.x != 0 || state.y != 0 {
        let _ = win.set_position(PhysicalPosition::new(state.x, state.y));
    }
    if state.maximized {
        let _ = win.maximize();
    }
}
