//! E-AI-1 / D-0010 — CompositeCommand acceptance tests (the AI transaction
//! primitive: TOOLS_RESEARCH/AI_AGENT/09_UNDO_TRANSACTION_MODEL + AI-REQ-032).
//!
//! Proves: children apply in order, revert in REVERSE, one group = one History
//! entry with the plan's own label, undo/redo restore bit-exact document state
//! (no partial surviving state), selection prev/post capture is unchanged,
//! empty groups are refused, nesting works, the 100-entry bound still counts a
//! group as one, and a new group clears redo like any other command.

use animator_core::command::{Command, DrawRect, RenameLayer, SetLayerVisible};
use animator_core::{
    CompositeCommand, Document, History, Node, Session, Settings, ShapeKind, Transform,
    HISTORY_BOUND,
};

fn session() -> Session {
    Session::new(Settings::default())
}

/// Test-only command that proves ordering: apply appends its marker to the
/// stage background string; revert may only legally remove the LAST marker —
/// if children were reverted forward (not reversed), the first revert would
/// find a foreign marker at the tail and panic, failing the test.
struct Rec(char);

impl Command for Rec {
    fn label(&self) -> String {
        format!("rec {}", self.0)
    }
    fn apply(&mut self, doc: &mut Document) {
        doc.settings.background.push(self.0);
    }
    fn revert(&mut self, doc: &mut Document) {
        assert_eq!(
            doc.settings.background.pop(),
            Some(self.0),
            "revert ran out of reverse order"
        );
    }
}

fn recs(chars: &[char]) -> Vec<Box<dyn Command>> {
    chars
        .iter()
        .map(|c| Box::new(Rec(*c)) as Box<dyn Command>)
        .collect()
}

fn rect_node(s: &mut Session) -> Node {
    Node::Rect {
        id: s.doc.alloc_node_id(),
        transform: Transform {
            x: 10.0,
            y: 20.0,
            ..Transform::default()
        },
        width: 30.0,
        height: 40.0,
        fill: "#112233".to_string(),
        stroke: None,
        stroke_width: 1.0,
        shape: ShapeKind::Rect,
    }
}

fn draw_at_playhead(s: &mut Session) -> DrawRect {
    DrawRect {
        scene: 0,
        layer: 0,
        frame: 1,
        node: rect_node(s),
    }
}

#[test]
fn group_is_one_history_entry_with_plan_label() {
    let mut doc = Document::new(Settings::default());
    let mut h = History::new(&doc);

    let group = CompositeCommand::new("AI — red ball bounce", recs(&['a', 'b', 'c']));
    h.execute(&mut doc, Box::new(group), Vec::new());

    assert_eq!(h.undo_len(), 1, "whole group = one undo entry");
    assert_eq!(
        h.undo_labels(),
        vec!["AI — red ball bounce".to_string()],
        "history exposes the group label, never child labels"
    );
}

#[test]
fn group_undoes_everything_in_one_step() {
    let mut s = session();
    let children: Vec<Box<dyn Command>> = vec![
        Box::new(draw_at_playhead(&mut s)),
        Box::new(draw_at_playhead(&mut s)),
    ];
    // Pre-group state is captured AFTER id allocation: next_id is deliberately
    // monotonic (never rolled back — IDs are never reused), so bit-exactness
    // is asserted from this point.
    let pre = s.doc.clone();

    assert!(s.execute_grouped("AI — two rects", children));
    assert_eq!(s.doc.nodes.len(), 2, "both children applied");

    assert!(s.undo(), "single Ctrl+Z…");
    assert_eq!(s.doc, pre, "…reverts the ENTIRE group, bit-exact");
    assert!(
        !s.undo(),
        "nothing else on the stack — exactly one entry existed"
    );
    assert!(s.redo());
    assert_eq!(
        s.doc.nodes.len(),
        2,
        "single redo re-applies the whole group"
    );
}

#[test]
fn children_apply_in_order_and_revert_in_reverse() {
    let mut doc = Document::new(Settings::default());
    let baseline = doc.settings.background.clone();
    let mut h = History::new(&doc);

    let group = CompositeCommand::new("AI — order test", recs(&['1', '2', '3']));
    h.execute(&mut doc, Box::new(group), Vec::new());
    assert_eq!(
        doc.settings.background,
        format!("{baseline}123"),
        "children applied in order"
    );

    h.undo(&mut doc);
    assert_eq!(
        doc.settings.background, baseline,
        "revert removed 3,2,1 (Rec asserts the exact tail — forward order would panic)"
    );
    assert!(
        !h.is_dirty(&doc),
        "undo back to the saved baseline is CLEAN"
    );

    h.redo(&mut doc);
    assert_eq!(doc.settings.background, format!("{baseline}123"));
}

#[test]
fn empty_group_is_refused_without_side_effects() {
    let mut s = session();
    let pre = s.doc.clone();
    assert!(!s.execute_grouped("AI — nothing", Vec::new()));
    assert_eq!(s.doc, pre, "doc untouched");
    assert!(!s.undo(), "no undo entry was pushed for an empty group");
}

#[test]
fn selection_prev_post_capture_is_unchanged_for_groups() {
    let mut s = session();
    let drawn = s.draw_shape(ShapeKind::Oval, 5.0, 5.0, 20.0, 20.0, "#ff0000", None, 1.0);
    assert!(drawn.0 > 0, "draw succeeded");
    assert_eq!(
        s.selection,
        vec![drawn],
        "draw leaves the new node selected"
    );

    let layer_id = s.layers()[0].id;
    let before = s.layers()[0].name.clone();
    let children: Vec<Box<dyn Command>> = vec![Box::new(RenameLayer {
        scene: 0,
        layer_id,
        before: before.clone(),
        after: "ball".to_string(),
    })];
    assert!(s.execute_grouped("AI — rename layer", children));

    assert!(s.undo());
    assert_eq!(
        s.selection,
        vec![drawn],
        "undo of the group restores the pre-group selection (the drawn node)"
    );
    assert_eq!(s.layers()[0].name, before, "rename reverted");
    assert!(s.redo());
    assert_eq!(s.selection, vec![drawn], "redo restores the post selection");
    assert_eq!(s.layers()[0].name, "ball");
}

#[test]
fn mixed_real_commands_revert_bit_exact_no_partial_state() {
    let mut s = session();
    let layer_id = s.layers()[0].id;
    let layer_name = s.layers()[0].name.clone();

    let children: Vec<Box<dyn Command>> = vec![
        Box::new(draw_at_playhead(&mut s)),
        Box::new(SetLayerVisible {
            scene: 0,
            layer_id,
            before: true,
            after: false,
        }),
        Box::new(RenameLayer {
            scene: 0,
            layer_id,
            before: layer_name,
            after: "animated".to_string(),
        }),
    ];
    // Allocation happened above; capture the exact pre-group state now.
    let pre = s.doc.clone();

    assert!(s.execute_grouped("AI — mixed batch", children));
    assert!(s.undo());
    assert_eq!(
        s.doc, pre,
        "draw + visibility + rename revert together — zero partial survivors"
    );
}

#[test]
fn nested_composites_roundtrip_in_reverse_order() {
    let mut doc = Document::new(Settings::default());
    let baseline = doc.settings.background.clone();
    let mut h = History::new(&doc);

    let inner = CompositeCommand::new("inner", recs(&['m', 'n']));
    let mut children: Vec<Box<dyn Command>> = recs(&['a', 'b']);
    children.push(Box::new(inner));
    children.extend(recs(&['z']));
    let outer = CompositeCommand::new("outer", children);

    h.execute(&mut doc, Box::new(outer), Vec::new());
    assert_eq!(
        doc.settings.background,
        format!("{baseline}abmnz"),
        "nested group applies depth-first in order"
    );
    h.undo(&mut doc);
    assert_eq!(
        doc.settings.background, baseline,
        "revert unwinds z, then n,m (inner reverse), then b,a"
    );
}

#[test]
fn a_group_counts_as_one_entry_at_the_history_bound() {
    let mut doc = Document::new(Settings::default());
    let mut h = History::new(&doc);
    for _ in 0..(HISTORY_BOUND + 5) {
        let g = CompositeCommand::new("AI — step", recs(&['x']));
        h.execute(&mut doc, Box::new(g), Vec::new());
    }
    assert_eq!(
        h.undo_len(),
        HISTORY_BOUND,
        "each group is ONE entry; the 100-entry bound drops oldest groups first"
    );
    assert_eq!(h.redo_len(), 0);
}

#[test]
fn a_new_group_clears_redo_like_any_command() {
    let mut doc = Document::new(Settings::default());
    let mut h = History::new(&doc);
    h.execute(
        &mut doc,
        Box::new(CompositeCommand::new("g1", recs(&['1']))),
        Vec::new(),
    );
    h.undo(&mut doc);
    assert_eq!(h.redo_len(), 1);
    h.execute(
        &mut doc,
        Box::new(CompositeCommand::new("g2", recs(&['2']))),
        Vec::new(),
    );
    assert_eq!(
        h.redo_len(),
        0,
        "new group invalidates redo (Phase-3 Part 12)"
    );
}

#[test]
fn group_len_and_label_accessors() {
    let g = CompositeCommand::new("AI — three steps", recs(&['a', 'b', 'c']));
    assert_eq!(g.len(), 3);
    assert!(!g.is_empty());
    assert_eq!(g.label(), "AI — three steps");
    let empty = CompositeCommand::new("empty", Vec::new());
    assert!(empty.is_empty());
}
