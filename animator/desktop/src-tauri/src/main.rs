// Kineora Animation — desktop shell entry point (Tauri v2).
//
// Platform shell responsibilities (desktop task §1/§14):
//   • hosts the existing React/UI + Rust/WASM engine in a native window
//   • routes OS window close through the SYS-02 dirty-document guard
//   • persists window state (size/position/maximized) to APP prefs, never to
//     the document, never on the undo stack
//   • exposes the native filesystem/dialog commands (commands.rs)
//   • exposes the shell-status + development-identity diagnostics
//
// The editor itself (UI, command registry, SYS-01/SYS-02) is untouched — this
// crate is infrastructure only.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod auth;
mod commands;
mod window_state;

use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{Emitter, WindowEvent};

/// Set when the SYS-02 close guard has approved the OS close: the JS runs the
/// canonical Save / Discard / Cancel confirmation, then invokes `approve_close`.
static CLOSE_APPROVED: AtomicBool = AtomicBool::new(false);

fn main() {
    let result = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::open_project_file,
            commands::save_project_file_as,
            commands::write_project_file,
            commands::read_project_file,
            commands::file_exists,
            commands::approve_close,
            commands::get_shell_status,
            commands::get_identity,
        ])
        .setup(|app| {
            // Best-effort: restore the previous window geometry (workspace pref).
            window_state::restore(app.handle());
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                if CLOSE_APPROVED.load(Ordering::SeqCst) {
                    // Guard approved the close → persist geometry + close.
                    window_state::save(window);
                } else {
                    // Hand the decision to the SYS-02 guard (Save/Discard/Cancel).
                    // The webview stays alive; the JS runs the canonical guard and
                    // calls `approve_close` when the close is allowed.
                    api.prevent_close();
                    let _ = window.emit("close-requested", ());
                }
            }
        })
        .run(tauri::generate_context!());

    if let Err(e) = result {
        // Never a silent blank window: report the actionable reason.
        eprintln!(
            "Kineora Animation failed to start (desktop shell error): {e}\n\
             This usually means the system WebKit/GTK libraries are missing \
             (install libwebkit2gtk-4.1-dev and libgtk-3-dev) or the bundled \
             frontend failed to load."
        );
        std::process::exit(1);
    }
}
