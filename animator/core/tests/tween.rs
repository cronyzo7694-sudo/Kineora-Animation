//! Classic tween + easing acceptance tests — the TWEEN FOUNDATION unit
//! (Phase 4, Part 09.2 + Part 08 §8.0 + Part 09.4). Verifies hold-by-default
//! (frame-by-frame), explicit classic-tween interpolation (x/y/scale/rotation
//! shortest-path), the ease slider, broken-tween revert-to-hold, span survival
//! under F5/Shift+F5 shifts, undo/redo, and the easing primitives.

use animator_core::{ease_classic, ease_penner, EaseFn, EaseMode, Session, Settings};

fn session() -> Session {
    Session::new(Settings::default())
}

/// Draw a rect at frame 1 and move it at frame 10 (keyframes @1 and @10 hold
/// the SAME node at (0,0) and (100,0)).
fn animated_pair(s: &mut Session) -> animator_core::NodeId {
    let id = s.draw_rect(0.0, 0.0, 100.0, 100.0, "#ff0000"); // key @1
    s.insert_keyframe(10); // copies content (same node)
    s.move_selection(100.0, 0.0); // key @10 override x=100
    id
}

#[test]
fn frame_by_frame_holds_without_a_tween() {
    // Part 08 §8.0: whole-frame keyframes for frame-by-frame HOLD. The old
    // implicit-interpolation behavior is gone — no tween → no interpolation.
    let mut s = session();
    animated_pair(&mut s);
    let f5 = s.evaluate(5)[0].clone();
    assert_eq!(f5.x, 0.0, "frame 5 holds frame-1 content (no tween)");
    assert_eq!(s.evaluate(7)[0].x, 0.0);
    assert_eq!(s.evaluate(10)[0].x, 100.0);
}

#[test]
fn classic_tween_interpolates_xy() {
    let mut s = session();
    animated_pair(&mut s);
    assert!(s.set_classic_tween(0, 1, 10, 0.0));
    let f5 = s.evaluate(5)[0].clone();
    assert!((f5.x - 44.44).abs() < 0.5, "interpolated x={}", f5.x);
    assert_eq!(f5.y, 0.0);
    assert_eq!(s.evaluate(1)[0].x, 0.0, "endpoints unchanged");
    assert_eq!(s.evaluate(10)[0].x, 100.0);
}

#[test]
fn ease_slider_in_and_out() {
    // Part 09.4.3: negative = ease-IN (slow start), positive = ease-OUT.
    let mut s = session();
    animated_pair(&mut s);
    assert!(s.set_classic_tween(0, 1, 10, 0.0));
    let linear = s.evaluate(5)[0].x;

    s.set_classic_tween(0, 1, 10, -100.0); // ease-in: lags at the midpoint
    let ease_in = s.evaluate(5)[0].x;
    assert!(ease_in < linear, "ease-in lags: {ease_in} < {linear}");

    s.set_classic_tween(0, 1, 10, 100.0); // ease-out: leads at the midpoint
    let ease_out = s.evaluate(5)[0].x;
    assert!(ease_out > linear, "ease-out leads: {ease_out} > {linear}");
}

#[test]
fn tween_interpolates_scale_and_rotation_shortest_path() {
    let mut s = session();
    let id = s.draw_rect(0.0, 0.0, 100.0, 100.0, "#ff0000"); // key @1
    s.insert_keyframe(10);
    s.transform_selection(vec![(
        id,
        animator_core::Transform {
            x: 0.0,
            y: 0.0,
            scale_x: 2.0,
            scale_y: 2.0,
            rotation: 350.0,
            ..animator_core::Transform::default()
        },
    )]);
    assert!(s.set_classic_tween(0, 1, 10, 0.0));

    let f5 = s.evaluate(5)[0].clone();
    // scale 1→2 at t=4/9 → 1.444… → w = 100 × 1.444 ≈ 144.44
    assert!((f5.w - 144.44).abs() < 0.5, "scale lerp, got {}", f5.w);
    // rotation shortest path 0°→350° = −10° (not +350°): at t=4/9 → ≈ −4.44
    // (physically equal to 355.56°, stored raw — renders identically).
    assert!(
        (f5.rotation - -4.44).abs() < 0.5,
        "shortest-path rot={}",
        f5.rotation
    );
}

#[test]
fn set_tween_requires_same_object_on_both_keyframes() {
    let mut s = session();
    let _ = s.draw_rect(0.0, 0.0, 50.0, 50.0, "#111111"); // key @1
    s.insert_blank_keyframe(10); // blank @10
    let _ = s.draw_rect(200.0, 0.0, 50.0, 50.0, "#222222"); // key @10 different node
    s.clear_selection();

    let n = s.history.undo_len();
    assert!(
        !s.set_classic_tween(0, 1, 10, 0.0),
        "different objects → rejected"
    );
    assert_eq!(s.history.undo_len(), n, "no command");
    assert!(s.doc.scene(0).unwrap().layers[0].tweens.is_empty());

    // blank end keyframe → rejected
    let mut s2 = session();
    let _ = s2.draw_rect(0.0, 0.0, 50.0, 50.0, "#111111");
    s2.insert_blank_keyframe(10);
    assert!(!s2.set_classic_tween(0, 1, 10, 0.0), "blank end → rejected");
}

#[test]
fn set_tween_start_ge_end_rejected() {
    let mut s = session();
    animated_pair(&mut s);
    assert!(!s.set_classic_tween(0, 10, 1, 0.0));
    assert!(!s.set_classic_tween(0, 5, 5, 0.0));
}

#[test]
fn tween_is_undoable_and_redoable() {
    let mut s = session();
    animated_pair(&mut s);
    assert!(s.set_classic_tween(0, 1, 10, 0.0));
    assert!((s.evaluate(5)[0].x - 44.44).abs() < 0.5);

    s.undo();
    assert_eq!(s.evaluate(5)[0].x, 0.0, "undo removes the tween → hold");

    s.redo();
    assert!(
        (s.evaluate(5)[0].x - 44.44).abs() < 0.5,
        "redo restores the tween"
    );
}

#[test]
fn remove_tween_reverts_to_hold() {
    let mut s = session();
    animated_pair(&mut s);
    assert!(s.set_classic_tween(0, 1, 10, 0.0));
    assert!(s.remove_classic_tween(0, 1));
    assert_eq!(s.evaluate(5)[0].x, 0.0, "tween removed → hold");

    s.undo();
    assert!(
        (s.evaluate(5)[0].x - 44.44).abs() < 0.5,
        "undo restores tween"
    );
}

#[test]
fn remove_nonexistent_tween_is_a_noop() {
    let mut s = session();
    animated_pair(&mut s);
    let n = s.history.undo_len();
    assert!(!s.remove_classic_tween(0, 1));
    assert_eq!(s.history.undo_len(), n);
}

#[test]
fn deleting_end_keyframe_breaks_tween_back_to_hold() {
    let mut s = session();
    animated_pair(&mut s);
    assert!(s.set_classic_tween(0, 1, 10, 0.0));
    // delete the END keyframe @10 → the tween's end dies with it
    assert!(s.delete_frame(10));
    assert!(
        s.doc.scene(0).unwrap().layers[0].tweens.is_empty(),
        "tween dropped"
    );
    assert_eq!(s.evaluate(5)[0].x, 0.0, "holds the start");

    s.undo();
    assert!(
        s.doc.scene(0).unwrap().layers[0].tweens.contains_key(&1),
        "undo restores tween"
    );
    assert!((s.evaluate(5)[0].x - 44.44).abs() < 0.5);
}

#[test]
fn f5_insert_frame_shifts_tween_end_with_keyframes() {
    let mut s = session();
    animated_pair(&mut s);
    assert!(s.set_classic_tween(0, 1, 10, 0.0));
    assert!(s.insert_frame(5)); // shift keyframes >5 right → end keyframe 10→11
    let tw = s.doc.scene(0).unwrap().layers[0]
        .tweens
        .get(&1)
        .unwrap()
        .clone();
    assert_eq!(tw.end, 11, "tween end follows the shifted end keyframe");
    // midpoint now spans 1..11
    let f6 = s.evaluate(6)[0].x;
    assert!((f6 - 50.0).abs() < 0.5, "midpoint of 1..11 = 50, got {f6}");

    s.undo();
    let tw = s.doc.scene(0).unwrap().layers[0]
        .tweens
        .get(&1)
        .unwrap()
        .clone();
    assert_eq!(tw.end, 10, "undo restores tween end");
}

#[test]
fn shift_f5_delete_frame_shifts_tween_end_left() {
    let mut s = session();
    animated_pair(&mut s);
    assert!(s.set_classic_tween(0, 1, 10, 0.0));
    assert!(s.delete_frame(5)); // delete a held frame → keyframes >5 shift left
    let tw = s.doc.scene(0).unwrap().layers[0]
        .tweens
        .get(&1)
        .unwrap()
        .clone();
    assert_eq!(tw.end, 9, "end keyframe 10→9");
}

#[test]
fn tween_blocked_on_locked_layer() {
    let mut s = session();
    animated_pair(&mut s);
    s.set_layer_locked(0, true);
    let n = s.history.undo_len();
    assert!(!s.set_classic_tween(0, 1, 10, 0.0));
    assert!(!s.remove_classic_tween(0, 1));
    assert_eq!(s.history.undo_len(), n);
}

#[test]
fn tween_survives_save_load() {
    let path = std::env::temp_dir().join("animator_tween_test.json");
    let mut s = session();
    animated_pair(&mut s);
    s.set_classic_tween(0, 1, 10, 0.0);
    s.save(&path).unwrap();

    let loaded = Session::load(&path).unwrap();
    assert!(
        (loaded.evaluate(5)[0].x - 44.44).abs() < 0.5,
        "tween survives reload"
    );
    let _ = std::fs::remove_file(&path);
}

#[test]
fn tween_interpolated_frames_export() {
    let mut s = session();
    animated_pair(&mut s);
    s.set_classic_tween(0, 1, 10, 0.0);
    let svg = s.export_svg(5);
    assert!(svg.contains("44.44"), "interpolated x in SVG: {svg}");
}

// ——— easing primitives (Part 09.4.2) ———

#[test]
fn easing_primitives_are_monotonic_and_endpoint_correct() {
    for e in [-100.0, -50.0, 0.0, 50.0, 100.0] {
        assert_eq!(ease_classic(e, 0.0), 0.0, "t=0 → 0");
        assert_eq!(ease_classic(e, 1.0), 1.0, "t=1 → 1");
        let mut prev = 0.0;
        for i in 1..=10 {
            let t = i as f64 / 10.0;
            let v = ease_classic(e, t);
            assert!(v >= prev, "monotonic at ease={e}, t={t}");
            prev = v;
        }
    }
}

#[test]
fn penner_functions_match_known_values() {
    assert_eq!(ease_penner(EaseFn::Linear, EaseMode::In, 0.5), 0.5);
    assert!((ease_penner(EaseFn::Quad, EaseMode::In, 0.5) - 0.25).abs() < 1e-9);
    assert!((ease_penner(EaseFn::Quad, EaseMode::Out, 0.5) - 0.75).abs() < 1e-9);
    assert!((ease_penner(EaseFn::Sine, EaseMode::InOut, 0.5) - 0.5).abs() < 1e-9);
    for (f, m) in [
        (EaseFn::Cubic, EaseMode::In),
        (EaseFn::Cubic, EaseMode::Out),
        (EaseFn::Sine, EaseMode::In),
        (EaseFn::Sine, EaseMode::Out),
        (EaseFn::Sine, EaseMode::InOut),
        (EaseFn::Cubic, EaseMode::InOut),
    ] {
        assert!(ease_penner(f, m, 0.0).abs() < 1e-9, "t=0 → 0");
        assert!((ease_penner(f, m, 1.0) - 1.0).abs() < 1e-9, "t=1 → 1");
    }
}
