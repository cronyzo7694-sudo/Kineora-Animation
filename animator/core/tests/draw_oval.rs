//! Oval tool acceptance tests — E1 parametric shapes (Blueprint T2B.5).
//! Engine-side truth for the Oval row of the tools matrix: parametric model,
//! fill+stroke at draw time, EXACT geometry/hit-test (never an AABB proxy),
//! SVG export, draw guards, undo, and pre-E1 file compatibility.
//!
//! NOTE (human verification): AI-T's sandbox has no Rust toolchain, so these
//! tests were written but NOT executed there. Run: `cargo test --test draw_oval`.

use animator_core::{Node, Session, Settings, ShapeKind};

fn session() -> Session {
    Session::new(Settings::default())
}

#[test]
fn draw_oval_creates_parametric_oval_node_and_selects_it() {
    let mut s = session();
    let id = s.draw_shape(ShapeKind::Oval, 100.0, 50.0, 200.0, 100.0, "#ff8800", None, 0.0);
    assert!(s.doc.nodes.contains_key(&id));
    match s.doc.nodes.get(&id) {
        Some(Node::Rect {
            shape,
            width,
            height,
            ..
        }) => {
            assert_eq!(*shape, ShapeKind::Oval);
            assert_eq!((*width, *height), (200.0, 100.0));
        }
        _ => panic!("an oval is stored as the parametric rect node with shape=oval"),
    }
    let items = s.current_frame();
    assert_eq!(items.len(), 1);
    assert_eq!(items[0].shape, ShapeKind::Oval);
    assert_eq!(s.selection, vec![id], "new shape is selected on commit (T2B.5 §8)");
}

#[test]
fn draw_shape_honors_the_current_fill_and_stroke_styles() {
    // Part 02b preamble: "Every drawing tool must honor (1) the current
    // stroke and fill style." (closes BUG-TOOL-008 for shape drawing)
    let mut s = session();
    s.draw_shape(
        ShapeKind::Oval,
        0.0,
        0.0,
        100.0,
        80.0,
        "#112233",
        Some("#445566"),
        3.0,
    );
    let it = &s.current_frame()[0];
    assert_eq!(it.fill, "#112233");
    assert_eq!(it.stroke.as_deref(), Some("#445566"));
    assert_eq!(it.stroke_width, 3.0);
}

#[test]
fn draw_rect_facade_still_stores_a_plain_rectangle_unchanged() {
    // pre-E1 behavior must be byte-identical: no stroke, rect kind.
    let mut s = session();
    s.draw_rect(10.0, 10.0, 20.0, 20.0, "#000000");
    let it = &s.current_frame()[0];
    assert_eq!(it.shape, ShapeKind::Rect);
    assert_eq!(it.stroke, None);
    assert_eq!(it.stroke_width, 0.0);
}

#[test]
fn oval_click_hit_test_is_exact_never_the_bounding_box() {
    let mut s = session();
    // ellipse inscribed in (0,0,100,100): centre (50,50), radii 50·50.
    s.draw_shape(ShapeKind::Oval, 0.0, 0.0, 100.0, 100.0, "#ff0000", None, 0.0);
    assert!(s.select_at(50.0, 50.0), "centre hits");
    assert!(s.select_at(50.0, 1.0), "a point on the rim hits");
    // ((2-50)/50)² + ((2-50)/50)² ≈ 1.84 > 1 — inside the AABB, outside the ellipse.
    assert!(
        !s.select_at(2.0, 2.0),
        "bounding-box corner air must NOT select an oval (AABB hit = bug)"
    );
    assert!(!s.select_at(10.0, 10.0), "((10-50)/50)²·2 = 1.28 > 1 — still air");
}

#[test]
fn rotated_oval_hit_test_uses_the_true_ellipse() {
    let mut s = session();
    // wide ellipse 200×100 centred at (100,50); rotate 90° → tall, radii swap.
    let id = s.draw_shape(ShapeKind::Oval, 0.0, 0.0, 200.0, 100.0, "#ff0000", None, 0.0);
    assert!(s.rotate_selection(90.0), "rotation applies");
    assert_eq!(s.selection, vec![id]);
    // along the (now vertical) long axis: 95 > 50 (short radius) from centre
    assert!(s.select_at(100.0, 140.0), "long-axis rim point hits after rotation");
    // along the (now horizontal) short axis: 60 > 50 → air for the rotated ellipse
    assert!(!s.select_at(160.0, 50.0), "short-axis air does not hit after rotation");
}

#[test]
fn marquee_touching_only_bounding_box_air_selects_nothing() {
    let mut s = session();
    s.draw_shape(ShapeKind::Oval, 0.0, 0.0, 100.0, 100.0, "#ff0000", None, 0.0);
    s.clear_selection();
    // 0..12 × 0..12 box: closest point to the centre is (12,12) →
    // ((12-50)/50)²·2 ≈ 1.16 > 1 → no contact with the ellipse.
    s.select_in_rect(0.0, 0.0, 12.0, 12.0);
    assert!(s.selection.is_empty(), "contact with corner air is not contact");
}

#[test]
fn marquee_that_touches_the_oval_selects_it() {
    let mut s = session();
    let id = s.draw_shape(ShapeKind::Oval, 0.0, 0.0, 100.0, 100.0, "#ff0000", None, 0.0);
    s.clear_selection();
    s.select_in_rect(40.0, 0.0, 60.0, 3.0);
    assert_eq!(s.selection, vec![id], "the box reaches the rim at (50, 0..3)");
}

#[test]
fn draw_oval_blocked_on_folder_locked_or_hidden_layer() {
    // folder (B-5 draw-target contract — identical to draw_rect)
    let mut s = session();
    let fi = s.create_folder().expect("folder");
    s.set_active_layer(fi);
    let id = s.draw_shape(ShapeKind::Oval, 0.0, 0.0, 10.0, 10.0, "#fff", None, 0.0);
    assert_eq!(id, animator_core::NodeId(0), "draw blocked on folder");
    assert!(s.event_log.iter().any(|l| l == "draw:blocked(folder)"));

    // locked
    let mut s = session();
    assert!(s.set_layer_locked(0, true));
    let id = s.draw_shape(ShapeKind::Oval, 0.0, 0.0, 10.0, 10.0, "#fff", None, 0.0);
    assert_eq!(id, animator_core::NodeId(0), "draw blocked on locked layer");

    // hidden
    let mut s = session();
    assert!(s.set_layer_visible(0, false));
    let id = s.draw_shape(ShapeKind::Oval, 0.0, 0.0, 10.0, 10.0, "#fff", None, 0.0);
    assert_eq!(id, animator_core::NodeId(0), "draw blocked on hidden layer");
}

#[test]
fn oval_is_one_undo_command() {
    let mut s = session();
    s.draw_shape(ShapeKind::Oval, 0.0, 0.0, 100.0, 100.0, "#ff0000", None, 0.0);
    assert_eq!(s.current_frame().len(), 1);
    s.undo();
    assert!(s.current_frame().is_empty(), "undo removes the oval");
    s.redo();
    let items = s.current_frame();
    assert_eq!(items.len(), 1, "redo restores the oval");
    assert_eq!(items[0].shape, ShapeKind::Oval, "shape survives undo/redo");
}

#[test]
fn oval_exports_as_a_true_svg_ellipse() {
    let mut s = session();
    s.draw_shape(ShapeKind::Oval, 100.0, 50.0, 200.0, 100.0, "#ff8800", Some("#000000"), 2.0);
    let svg = s.export_svg(1);
    assert!(
        svg.contains(r#"<ellipse cx="200" cy="100" rx="100" ry="50" fill="#ff8800""#),
        "expected a true <ellipse> element, got: {svg}"
    );
    assert!(svg.contains(r#"stroke="#000000" stroke-width="2""#));
}

#[test]
fn rotated_oval_exports_with_rotate_around_centre() {
    let mut s = session();
    s.draw_shape(ShapeKind::Oval, 0.0, 0.0, 200.0, 100.0, "#ff8800", None, 0.0);
    assert!(s.rotate_selection(90.0));
    let svg = s.export_svg(1);
    assert!(
        svg.contains(r#"<ellipse cx="100" cy="50" rx="100" ry="50" fill="#ff8800" transform="rotate(90 100 50)"/>"#),
        "rotation around the shape centre, got: {svg}"
    );
}

#[test]
fn legacy_rect_node_without_the_shape_field_deserializes_as_rect() {
    // Pre-E1 project files never mention `shape`: the serde default must turn
    // them into plain rectangles, unchanged.
    let node = Node::Rect {
        id: animator_core::NodeId(1),
        transform: animator_core::Transform::default(),
        width: 10.0,
        height: 10.0,
        fill: "#123456".into(),
        stroke: None,
        stroke_width: 0.0,
        shape: ShapeKind::Oval,
    };
    let mut v = serde_json::to_value(&node).unwrap();
    v.as_object_mut()
        .unwrap()
        .get_mut("Rect")
        .unwrap()
        .as_object_mut()
        .unwrap()
        .remove("shape");
    let back: Node = serde_json::from_value(v).unwrap();
    match back {
        Node::Rect { shape, .. } => {
            assert_eq!(shape, ShapeKind::Rect, "missing shape field = plain rectangle")
        }
        _ => panic!("rect node must stay a rect node"),
    }
}
