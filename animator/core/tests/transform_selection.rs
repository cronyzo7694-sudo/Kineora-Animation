//! Transform + selection expansion tests (Phase 4 unit).

use animator_core::{Session, Settings, Transform};

fn session() -> Session {
    Session::new(Settings::default())
}

fn t(x: f64, y: f64, sx: f64, sy: f64, rot: f64) -> Transform {
    Transform {
        x,
        y,
        scale_x: sx,
        scale_y: sy,
        rotation: rot,
        ..Transform::default()
    }
}

#[test]
fn transform_selection_sets_scale_and_rotation_one_command() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 100.0, 100.0, "#ff0000");
    let id = s.selection[0];
    let base = s.history.undo_len();

    s.transform_selection(vec![(id, t(10.0, 20.0, 2.0, 0.5, 45.0))]);
    assert_eq!(s.history.undo_len(), base + 1, "one gesture = one command");

    let item = s.current_frame()[0].clone();
    assert_eq!((item.x, item.y), (10.0, 20.0));
    assert_eq!((item.w, item.h), (200.0, 50.0)); // 100*2, 100*0.5
    assert_eq!(item.rotation, 45.0);

    s.undo();
    let item = s.current_frame()[0].clone();
    assert_eq!((item.w, item.h), (100.0, 100.0));
    assert_eq!(item.rotation, 0.0);

    s.redo();
    let item = s.current_frame()[0].clone();
    assert_eq!((item.w, item.h), (200.0, 50.0));
    assert_eq!(item.rotation, 45.0);
}

#[test]
fn multi_object_transform_is_one_command() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#ff0000");
    let a = s.selection[0];
    s.draw_rect(100.0, 0.0, 50.0, 50.0, "#00ff00");
    let b = s.selection[0];
    s.selection = vec![a, b];
    let base = s.history.undo_len();

    s.transform_selection(vec![
        (a, t(5.0, 5.0, 1.0, 1.0, 0.0)),
        (b, t(105.0, 5.0, 1.0, 1.0, 0.0)),
    ]);
    assert_eq!(
        s.history.undo_len(),
        base + 1,
        "one logical command for the group"
    );
    assert_eq!(s.current_frame().len(), 2);
    s.undo();
    assert_eq!(s.current_frame()[0].x, 0.0);
    assert_eq!(s.current_frame()[1].x, 100.0);
}

#[test]
fn shift_toggle_adds_and_removes() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#ff0000"); // selected
    s.draw_rect(100.0, 0.0, 50.0, 50.0, "#00ff00"); // selected (replaces)
    let b = s.selection[0];
    s.clear_selection();
    assert!(s.selection.is_empty());

    // add first
    assert!(s.select_toggle_at(25.0, 25.0));
    assert_eq!(s.selection.len(), 1);
    // add second
    assert!(s.select_toggle_at(125.0, 25.0));
    assert_eq!(s.selection.len(), 2);
    // toggle first off
    assert!(s.select_toggle_at(25.0, 25.0));
    assert_eq!(s.selection, vec![b]);
}

#[test]
fn marquee_selects_multiple_and_replaces() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#ff0000");
    s.draw_rect(100.0, 0.0, 50.0, 50.0, "#00ff00");
    s.clear_selection();

    s.select_in_rect(-5.0, -5.0, 160.0, 60.0);
    assert_eq!(s.selection.len(), 2, "marquee over both selects both");

    s.select_in_rect(90.0, -5.0, 160.0, 60.0);
    assert_eq!(s.selection.len(), 1, "marquee replaces selection");
}

#[test]
fn rotation_does_not_leak_into_export() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 100.0, 100.0, "#ff0000");
    let id = s.selection[0];
    s.transform_selection(vec![(id, t(0.0, 0.0, 1.0, 1.0, 45.0))]);
    // selection overlay is NOT part of export; content is exported (with rotation)
    let svg = s.export_svg(1);
    assert!(
        svg.contains("rotate(45"),
        "content rotation must be in the SVG"
    );
    assert!(!svg.contains("selection"), "no overlay leakage");
}
