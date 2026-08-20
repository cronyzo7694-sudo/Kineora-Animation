//! Export acceptance tests — the EXPORT unit (Phase 4, Part 28 / REQ-EXP-002).
//! Verifies the SVG exporter against the blueprint invariants: document stage
//! dimensions, stage clip (pasteboard exclusion), scale (1×/2×/4×), rotation
//! around center, fill/stroke/stroke-width, layer order + hidden/locked rules,
//! and determinism (authoring = export). Zoom/pan/selection are view state and
//! must never affect output (there is no viewport in the engine at all).

use animator_core::{NodePropsPatch, Session, Settings};

fn session() -> Session {
    Session::new(Settings::default())
}

#[test]
fn svg_uses_document_stage_dimensions() {
    let s = session();
    let svg = s.export_svg(1);
    assert!(
        svg.contains(r#"width="1920" height="1080" viewBox="0 0 1920 1080""#),
        "export = document stage size: {svg}"
    );
}

#[test]
fn svg_scale_multiplies_outer_size_and_keeps_viewbox() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 100.0, 100.0, "#ff0000");

    let x2 = s.export_svg_scaled(1, 2.0);
    assert!(
        x2.contains(r#"width="3840" height="2160" viewBox="0 0 1920 1080""#),
        "2×: outer size doubles, viewBox (doc coords) unchanged: {x2}"
    );

    let x4 = s.export_svg_scaled(1, 4.0);
    assert!(x4.contains(r#"width="7680" height="4320" viewBox="0 0 1920 1080""#));

    // content coordinates stay in document space at any scale
    assert!(x2.contains(r#"x="0" y="0" width="100" height="100""#));
}

#[test]
fn svg_scale_invalid_falls_back_to_1x() {
    let s = session();
    for bad in [0.0, -2.0, f64::NAN, f64::INFINITY] {
        let svg = s.export_svg_scaled(1, bad);
        assert!(
            svg.contains(r#"width="1920" height="1080""#),
            "scale {bad} → 1×"
        );
    }
}

#[test]
fn svg_scale_1_is_identical_to_default_export() {
    let mut s = session();
    s.draw_rect(10.0, 20.0, 50.0, 50.0, "#3f9bf5");
    assert_eq!(s.export_svg(1), s.export_svg_scaled(1, 1.0));
}

#[test]
fn svg_fill_stroke_stroke_width_are_exported() {
    let mut s = session();
    let id = s.draw_rect(0.0, 0.0, 50.0, 50.0, "#3f9bf5");
    s.set_node_props(vec![(
        id,
        NodePropsPatch {
            stroke_enabled: Some(true),
            stroke: Some("#000000".into()),
            stroke_width: Some(3.0),
            ..Default::default()
        },
    )]);
    let svg = s.export_svg(1);
    assert!(svg.contains(r##"fill="#3f9bf5""##));
    assert!(svg.contains(r##"stroke="#000000" stroke-width="3""##));
}

#[test]
fn svg_rotation_is_around_rect_center() {
    let mut s = session();
    let id = s.draw_rect(100.0, 100.0, 100.0, 50.0, "#ff0000"); // center (150,125)
    s.transform_selection(vec![(
        id,
        animator_core::Transform {
            x: 100.0,
            y: 100.0,
            rotation: 45.0,
            ..animator_core::Transform::default()
        },
    )]);
    let svg = s.export_svg(1);
    assert!(
        svg.contains(r#"transform="rotate(45 150 125)""#),
        "rotation pivot = rect center: {svg}"
    );
}

#[test]
fn svg_scale_transform_multiplies_size() {
    let mut s = session();
    let id = s.draw_rect(0.0, 0.0, 100.0, 50.0, "#ff0000");
    s.transform_selection(vec![(
        id,
        animator_core::Transform {
            scale_x: 2.0,
            scale_y: 3.0,
            ..animator_core::Transform::default()
        },
    )]);
    let svg = s.export_svg(1);
    assert!(
        svg.contains(r#"width="200" height="150""#),
        "scaled w/h in SVG: {svg}"
    );
}

#[test]
fn svg_layer_order_is_bottom_to_top() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#aaaaaa"); // bottom layer
    s.create_layer(); // active = layer 2
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#bbbbbb"); // top layer

    let svg = s.export_svg(1);
    let bottom = svg.find("#aaaaaa").unwrap();
    let top = svg.find("#bbbbbb").unwrap();
    assert!(bottom < top, "bottom layer drawn before top layer");
}

#[test]
fn svg_hidden_layer_excluded_locked_layer_included() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#111111"); // layer 1
    s.create_layer();
    s.draw_rect(100.0, 0.0, 50.0, 50.0, "#222222"); // layer 2

    // lock layer 2 → still exported (Part 20.2: locked renders + exports)
    s.set_layer_locked(1, true);
    let svg = s.export_svg(1);
    assert!(svg.contains("#222222"), "locked layer still exported");
    assert!(svg.contains("#111111"));

    // hide layer 2 → excluded (Part 20.2: hidden not exported)
    s.set_layer_locked(1, false);
    s.set_layer_visible(1, false);
    let svg = s.export_svg(1);
    assert!(svg.contains("#111111"));
    assert!(!svg.contains("#222222"), "hidden layer not exported");
}

#[test]
fn svg_excludes_pasteboard_content_via_stage_clip() {
    let mut s = session();
    // on-stage + off-stage (pasteboard) rects
    s.draw_rect(10.0, 10.0, 50.0, 50.0, "#3f9bf5");
    s.draw_rect(5000.0, 5000.0, 100.0, 100.0, "#ff0000"); // off-stage

    let svg = s.export_svg(1);
    assert!(svg.contains(r#"<clipPath id="kineora-stage">"#));
    assert!(svg.contains(r#"clip-path="url(#kineora-stage)""#));
    // both content rects are inside the clipped group; the off-stage one is
    // geometrically outside the stage so the clip hides it at render time
    let clip = svg.find("kineora-stage").unwrap();
    let off = svg.find("5000").unwrap();
    assert!(
        off > clip,
        "off-stage content sits inside the clipped group"
    );
}

#[test]
fn svg_ignores_selection_state() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#3f9bf5");
    let with_selection = s.export_svg(1);
    s.clear_selection();
    let without_selection = s.export_svg(1);
    assert_eq!(
        with_selection, without_selection,
        "selection is view state — must not affect export"
    );
}

#[test]
fn svg_export_is_deterministic() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 100.0, 50.0, "#3f9bf5");
    s.insert_keyframe(10);
    s.move_selection(100.0, 0.0);
    let a = s.export_svg(5);
    let b = s.export_svg(5);
    assert_eq!(a, b, "authoring = export: same frame, identical output");
    assert_ne!(
        a,
        s.export_svg(10),
        "different frames differ (interpolation)"
    );
}

#[test]
fn svg_background_reflects_document_background() {
    let mut s = session();
    s.set_document_settings(animator_core::SettingsPatch {
        background: Some("#000000".into()),
        ..Default::default()
    });
    assert!(s.export_svg(1).contains(r##"fill="#000000""##));
}
