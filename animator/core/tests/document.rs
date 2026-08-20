//! Document / Stage / Viewport foundation tests (Phase 4 — foundation unit).
//! Verifies the canonical stage model: default dimensions (Part 33 §33.1 /
//! engineering 03), stage-bounded export (pasteboard excluded), background +
//! fps as document state, and settings surviving save/load.

use animator_core::{Session, Settings, SettingsPatch};

fn session() -> Session {
    Session::new(Settings::default())
}

#[test]
fn default_document_is_canonical_1920x1080() {
    let s = session();
    assert_eq!(
        s.doc.settings.width, 1920.0,
        "canonical stage width (Part 33)"
    );
    assert_eq!(s.doc.settings.height, 1080.0, "canonical stage height");
    assert_eq!(s.doc.settings.fps, 24, "canonical frame rate");
    assert_eq!(s.doc.settings.background, "#ffffff", "canonical background");
}

#[test]
fn custom_document_dimensions_are_supported() {
    let s = Session::new(Settings {
        width: 1280.0,
        height: 720.0,
        fps: 30,
        background: "#101010".into(),
    });
    assert_eq!(s.doc.settings.width, 1280.0);
    assert_eq!(s.doc.settings.height, 720.0);
    assert_eq!(s.doc.settings.fps, 30);
    assert_eq!(s.doc.settings.background, "#101010");
}

#[test]
fn export_uses_document_stage_bounds_not_anything_else() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 100.0, 100.0, "#ff0000");
    let svg = s.export_svg(1);
    assert!(
        svg.contains(r#"width="1920" height="1080" viewBox="0 0 1920 1080""#),
        "SVG is exactly the document stage: {svg}"
    );
}

#[test]
fn export_dimensions_follow_settings_changes() {
    let mut s = session();
    s.set_document_settings(SettingsPatch {
        width: Some(640.0),
        height: Some(480.0),
        ..Default::default()
    });
    let svg = s.export_svg(1);
    assert!(svg.contains(r#"width="640" height="480" viewBox="0 0 640 480""#));
}

#[test]
fn export_background_reflects_document_background() {
    let mut s = session();
    s.set_document_settings(SettingsPatch {
        background: Some("#000000".into()),
        ..Default::default()
    });
    let svg = s.export_svg(1);
    assert!(
        svg.contains(r##"fill="#000000""##),
        "stage bg color in SVG: {svg}"
    );
}

#[test]
fn off_stage_content_is_clipped_out_of_export() {
    // pasteboard art (Part 01 §1.4.1): authored, but NOT rendered at export.
    let mut s = session();
    // a rect fully outside the stage (x beyond 1920)
    s.draw_rect(5000.0, 5000.0, 100.0, 100.0, "#ff0000");
    let svg = s.export_svg(1);
    // clip path exists and wraps all content; the off-stage rect is inside the
    // clipped group, so it is never visible in the exported stage.
    assert!(svg.contains(r#"<clipPath id="kineora-stage">"#));
    assert!(svg.contains(r#"clip-path="url(#kineora-stage)""#));
    let clip_pos = svg.find("kineora-stage").unwrap();
    let content_pos = svg.find("x=\"5000\"").unwrap();
    assert!(
        content_pos > clip_pos,
        "off-stage content sits inside the clipped group"
    );
}

#[test]
fn background_and_fps_are_document_state_not_view_state() {
    let mut s = session();
    // these are document settings: persisted with the project, editable,
    // undoable — never dependent on viewport (zoom/pan are not in the model).
    let n = s.history.undo_len();
    s.set_document_settings(SettingsPatch {
        background: Some("#ff00ff".into()),
        fps: Some(12),
        ..Default::default()
    });
    assert_eq!(
        s.history.undo_len(),
        n + 1,
        "settings edit is one undoable command"
    );
    assert_eq!(s.doc.settings.fps, 12);
    assert_eq!(s.doc.settings.background, "#ff00ff");

    s.undo();
    assert_eq!(s.doc.settings.fps, 24);
    assert_eq!(s.doc.settings.background, "#ffffff");
}

#[test]
fn document_settings_survive_save_load() {
    let path = std::env::temp_dir().join("animator_doc_settings_test.json");
    let mut s = session();
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#3f9bf5");
    s.set_document_settings(SettingsPatch {
        width: Some(1280.0),
        height: Some(720.0),
        fps: Some(30),
        background: Some("#123456".into()),
    });
    s.save(&path).unwrap();

    let loaded = Session::load(&path).unwrap();
    assert_eq!(
        loaded.doc.settings, s.doc.settings,
        "settings round-trip exactly"
    );
    assert_eq!(loaded.doc.settings.width, 1280.0);
    assert_eq!(loaded.doc.settings.height, 720.0);
    assert_eq!(loaded.doc.settings.fps, 30);
    assert_eq!(loaded.doc.settings.background, "#123456");
    // export from the loaded doc also uses the persisted stage size
    let svg = loaded.export_svg(1);
    assert!(svg.contains(r#"width="1280" height="720""#));
    let _ = std::fs::remove_file(&path);
}

#[test]
fn resizing_the_stage_does_not_move_existing_content() {
    // Part 01 §1.7: changing stage size keeps content in document coordinates
    // (it does NOT scale or re-position objects — the stage is just the frame).
    let mut s = session();
    s.draw_rect(100.0, 100.0, 50.0, 50.0, "#ff0000");
    let before = s.current_frame()[0].clone();

    s.set_document_settings(SettingsPatch {
        width: Some(3840.0),
        height: Some(2160.0),
        ..Default::default()
    });
    let after = s.current_frame()[0].clone();
    assert_eq!(before, after, "content stays in doc coordinates");
}
