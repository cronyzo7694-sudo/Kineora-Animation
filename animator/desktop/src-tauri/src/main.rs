// Desktop shell (Tauri v2). Sandbox note: requires webkit2gtk system libs to
// build/run — provided as config; runs on the user's Linux desktop (IMP-DEC-007).

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
