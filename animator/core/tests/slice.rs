//! Vertical-slice acceptance tests — mirror the manual test checklist.
use animator_core::{Session, Settings};

fn session() -> Session {
    Session::new(Settings::default())
}

#[test]
fn new_document_has_scene_layer_keyframe() {
    let s = session();
    assert_eq!(s.doc.scenes.len(), 1);
    assert_eq!(s.doc.scenes[0].layers.len(), 1);
    assert!(s.doc.scenes[0].layers[0].keyframes.contains_key(&1));
    assert!(s.evaluate(1).is_empty());
}

#[test]
fn draw_rect_selects_it() {
    let mut s = session();
    let id = s.draw_rect(10.0, 20.0, 100.0, 50.0, "#ff0000");
    assert_eq!(s.selection, vec![id]);
    assert_eq!(s.current_frame().len(), 1);
}

#[test]
fn select_at_hit_tests_top_first() {
    let mut s = session();
    // front rect (drawn later) covers back rect
    s.draw_rect(0.0, 0.0, 100.0, 100.0, "#000000");
    let front = s.draw_rect(0.0, 0.0, 100.0, 100.0, "#ffffff");
    assert_eq!(s.selection, vec![front]);
    s.clear_selection();
    assert!(s.select_at(50.0, 50.0));
    assert_eq!(s.selection, vec![front]); // top-most wins
}

#[test]
fn move_then_undo_redo() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 100.0, 100.0, "#ff0000");
    let before = s.current_frame()[0].clone();
    s.move_selection(30.0, 40.0);
    let moved = s.current_frame()[0].clone();
    assert_eq!(moved.x, before.x + 30.0);
    assert_eq!(moved.y, before.y + 40.0);

    assert!(s.undo());
    let undone = s.current_frame()[0].clone();
    assert_eq!(undone.x, before.x);
    assert_eq!(undone.y, before.y);

    assert!(s.redo());
    let redone = s.current_frame()[0].clone();
    assert_eq!(redone.x, before.x + 30.0);
    assert_eq!(redone.y, before.y + 40.0);
}

#[test]
fn keyframe_and_linear_interpolation() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 100.0, 100.0, "#ff0000"); // frame 1 at (0,0)
    s.insert_keyframe(10);
    s.move_selection(100.0, 0.0); // frame 10 at (100,0)

    let f1 = s.evaluate(1)[0].clone();
    let f10 = s.evaluate(10)[0].clone();
    assert_eq!((f1.x, f1.y), (0.0, 0.0));
    assert_eq!((f10.x, f10.y), (100.0, 0.0));

    let f5 = s.evaluate(5)[0].clone();
    assert!((f5.x - 44.44).abs() < 0.5, "interpolated x={}", f5.x); // (5-1)/(10-1)*100 ≈ 44.44
    assert_eq!(f5.y, 0.0);
}

#[test]
fn playback_deterministic() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#ff0000");
    s.insert_keyframe(5);
    s.move_selection(40.0, 0.0);
    let a = s.evaluate(3);
    let b = s.evaluate(3);
    assert_eq!(a, b);
}

#[test]
fn save_load_round_trip() {
    let path = std::env::temp_dir().join("animator_slice_test.json");
    let mut s = session();
    s.draw_rect(5.0, 5.0, 20.0, 20.0, "#00ff00");
    s.insert_keyframe(3);
    s.move_selection(10.0, 0.0);
    s.save(&path).unwrap();

    let loaded = Session::load(&path).unwrap();
    assert_eq!(loaded.doc, s.doc);
    assert_eq!(loaded.evaluate(1), s.evaluate(1));
    assert_eq!(loaded.evaluate(3), s.evaluate(3));
    let _ = std::fs::remove_file(&path);
}

#[test]
fn export_svg_contains_content_not_overlays() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 100.0, 100.0, "#ff0000");
    // selection is set — but export must not include selection overlay
    assert_eq!(s.selection.len(), 1);
    let svg = s.export_svg(1);
    assert!(svg.contains("<rect"), "svg has content");
    assert_eq!(
        svg.matches("<rect").count(),
        3,
        "clip rect + background + one content rect, no overlay rect"
    );
    assert!(!svg.contains("selection"), "no overlay leakage");
    assert!(svg.contains("clipPath"), "stage clip present");
}

#[test]
fn undo_stack_unchanged_by_selection_and_playhead() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 10.0, 10.0, "#ff0000");
    let n = s.history.undo_len();
    s.select_at(5.0, 5.0);
    s.set_playhead(7);
    assert_eq!(
        s.history.undo_len(),
        n,
        "view state must not enter undo stack"
    );
}

#[test]
fn locked_layer_skips_hit_test() {
    let mut s = session();
    s.doc.scenes[0].layers[0].locked = true;
    s.draw_rect(0.0, 0.0, 100.0, 100.0, "#ff0000");
    s.clear_selection();
    assert!(!s.select_at(50.0, 50.0), "locked layer must not be hit");
}
