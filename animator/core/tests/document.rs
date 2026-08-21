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
        ..Settings::default()
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

// ——— H01 v2 alignment: backgroundAlpha + meta{createdAt,…} (Part 33 §33.1) ———

#[test]
fn canonical_background_alpha_is_1() {
    let s = session();
    assert_eq!(s.doc.settings.background_alpha, 1.0, "canonical α (H01 §8)");
}

#[test]
fn background_alpha_patch_clamps_to_0_1() {
    let mut s = session();
    s.set_document_settings(SettingsPatch {
        background_alpha: Some(1.5),
        ..Default::default()
    });
    assert_eq!(s.doc.settings.background_alpha, 1.0, "clamped to max 1");
    s.set_document_settings(SettingsPatch {
        background_alpha: Some(-0.2),
        ..Default::default()
    });
    assert_eq!(s.doc.settings.background_alpha, 0.0, "clamped to min 0");
    s.set_document_settings(SettingsPatch {
        background_alpha: Some(0.5),
        ..Default::default()
    });
    assert_eq!(s.doc.settings.background_alpha, 0.5);
}

#[test]
fn legacy_settings_json_without_alpha_deserializes_with_default_1() {
    // Pre-H01 files carried `background` (not backgroundColor) and no alpha.
    let legacy = r#"{"width":800.0,"height":600.0,"fps":30,"background":"#000000"}"#;
    let s: animator_core::Settings = serde_json::from_str(legacy).expect("legacy parses");
    assert_eq!(s.background, "#000000");
    assert_eq!(s.background_alpha, 1.0, "legacy α defaults to 1 (opaque)");
    assert_eq!(s.units, "px");
    assert_eq!(s.platform, "HTML5 Canvas");
}

#[test]
fn settings_serialize_with_part33_key_names() {
    let s = Settings::default();
    let json = serde_json::to_string(&s).unwrap();
    assert!(json.contains("\"backgroundColor\":\"#ffffff\""), "Part 33 key");
    assert!(json.contains("\"backgroundAlpha\":1"), "Part 33 key (α)");
    assert!(!json.contains("\"background\":"), "legacy key renamed");
}

#[test]
fn legacy_document_json_without_meta_deserializes_with_default_meta() {
    let legacy = r#"{"settings":{"width":1920.0,"height":1080.0,"fps":24,"background":"#ffffff","units":"px","platform":"HTML5 Canvas"},"scenes":[],"nodes":{},"library":[],"next_id":1}"#;
    let d: animator_core::Document = serde_json::from_str(legacy).expect("legacy doc parses");
    assert_eq!(d.meta.created_at, 0, "unknown creation time for legacy files");
    assert_eq!(d.meta.title, None);
    assert_eq!(d.meta.modified_at, None);
}

#[test]
fn meta_created_at_roundtrips_through_json() {
    let mut d = animator_core::Document::new(Settings::default());
    d.meta.created_at = 1_755_800_000;
    let json = serde_json::to_string(&d).unwrap();
    assert!(json.contains("\"createdAt\":1755800000"), "camelCase wire key");
    let back: animator_core::Document = serde_json::from_str(&json).unwrap();
    assert_eq!(back.meta.created_at, 1_755_800_000);
}

#[test]
fn export_background_rect_carries_fill_opacity_only_when_alpha_below_1() {
    let mut s = session();
    let opaque = s.export_svg(1);
    assert!(!opaque.contains("fill-opacity"), "opaque stage: no fill-opacity attr");
    s.set_document_settings(SettingsPatch {
        background_alpha: Some(0.5),
        ..Default::default()
    });
    let translucent = s.export_svg(1);
    assert!(
        translucent.contains(r#"fill-opacity="0.5""),
        "α<1 exports fill-opacity (Part 33 §33.1)"
    );
}
