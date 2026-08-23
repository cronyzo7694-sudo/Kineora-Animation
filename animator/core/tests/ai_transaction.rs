use animator_core::ai_runner::execute_validated_plan;
use animator_core::{Layer, LayerId, NodeId, Session, Settings};
use serde_json::{json, Value};

fn plan(actions: Vec<Value>) -> String {
    json!({ "actions": actions }).to_string()
}

fn action(index: usize, id: Option<&str>, name: &str, params: Value) -> Value {
    json!({
        "index": index,
        "id": id,
        "action": name,
        "params": params,
        "humanText": format!("{name} #{index}")
    })
}

fn shape(index: usize, id: Option<&str>, x: f64, y: f64) -> Value {
    action(
        index,
        id,
        "shape.create",
        json!({
            "shape": "oval",
            "x": x,
            "y": y,
            "w": 20.0,
            "h": 20.0,
            "fill": "#ff0000"
        }),
    )
}

#[test]
fn single_validated_action_is_one_history_entry() {
    let mut session = Session::new(Settings::default());
    let result = execute_validated_plan(
        &mut session,
        &plan(vec![shape(0, Some("ball"), 10.0, 20.0)]),
        "AI — ball",
    );
    assert!(result.ok);
    assert_eq!(result.mutation_count, 1);
    assert_eq!(session.history.undo_len(), 1);
    assert_eq!(session.history.undo_labels(), vec!["AI — ball"]);
    assert_eq!(session.doc.nodes.len(), 1);
    assert_eq!(result.bindings[0].alias, "ball");
}

#[test]
fn multi_action_plan_materializes_refs_in_order_and_groups_once() {
    let mut session = Session::new(Settings::default());
    let json = plan(vec![
        action(0, Some("layer"), "layer.create", json!({ "name": "Ball" })),
        action(
            1,
            Some("ball"),
            "shape.create",
            json!({
                "shape": "oval", "x": 5.0, "y": 6.0, "w": 20.0, "h": 20.0,
                "fill": "#ff0000", "layer": { "ref": "layer" }
            }),
        ),
        action(
            2,
            None,
            "node.transform",
            json!({ "node": { "ref": "ball" }, "y": 100.0 }),
        ),
    ]);
    let result = execute_validated_plan(&mut session, &json, "AI — ordered");
    assert!(result.ok);
    assert_eq!(session.history.undo_len(), 1);
    let ball = result
        .bindings
        .iter()
        .find(|binding| binding.alias == "ball")
        .expect("node binding");
    let node = session
        .doc
        .nodes
        .get(&NodeId(ball.id))
        .expect("created node");
    assert_eq!(
        node.transform().y,
        6.0,
        "per-key transform must not rewrite the node's base transform"
    );
    let effective = session
        .selected_transform(NodeId(ball.id))
        .expect("created node has an effective transform at the playhead");
    assert_eq!(effective.y, 100.0);
    let resolved = session
        .evaluate(1)
        .into_iter()
        .find(|item| item.id == ball.id)
        .expect("created node evaluates at the affected frame");
    assert_eq!(resolved.y, 100.0);
    let created_layer = &session.doc.scenes[0].layers[1];
    assert_eq!(created_layer.name, "Ball");
    match created_layer.keyframes.get(&1) {
        Some(animator_core::Frame::Keyframe {
            content,
            transforms,
            ..
        }) => {
            assert!(
                content.contains(&NodeId(ball.id)),
                "alias resolved onto the created layer"
            );
            assert_eq!(
                transforms
                    .get(&NodeId(ball.id))
                    .map(|transform| transform.y),
                Some(100.0),
                "the effective transform is stored as a frame override"
            );
        }
        _ => panic!("created layer must contain a content keyframe at frame 1"),
    }

    assert!(session.undo(), "one undo reverts the entire AI plan");
    assert_eq!(session.history.undo_len(), 0);
    assert_eq!(session.history.redo_len(), 1);
    assert_eq!(session.doc.scenes[0].layers.len(), 1);
    assert!(!session.doc.nodes.contains_key(&NodeId(ball.id)));

    assert!(session.redo(), "one redo reapplies the entire AI plan");
    assert_eq!(session.history.undo_len(), 1);
    assert_eq!(session.doc.scenes[0].layers[1].name, "Ball");
    assert_eq!(
        session
            .selected_transform(NodeId(ball.id))
            .expect("redone node has an effective transform")
            .y,
        100.0
    );
}

#[test]
fn middle_failure_discards_every_prepared_command_and_allocator_change() {
    let mut session = Session::new(Settings::default());
    let before = session.doc.clone();
    let result = execute_validated_plan(
        &mut session,
        &plan(vec![
            shape(0, Some("made"), 1.0, 2.0),
            action(
                1,
                None,
                "node.transform",
                json!({ "node": 9999, "x": 50.0 }),
            ),
            action(2, None, "layer.create", json!({})),
        ]),
        "AI — rollback middle",
    );
    assert!(!result.ok);
    assert!(result.rolled_back);
    assert_eq!(result.outcome, "rolled-back");
    assert_eq!(result.mutation_count, 0);
    assert_eq!(session.doc, before);
    assert_eq!(session.history.undo_len(), 0);
    assert_eq!(result.actions[0].status, "rolled-back");
    assert_eq!(result.actions[1].status, "failed");
    assert_eq!(result.actions[2].status, "skipped");
}

#[test]
fn final_failure_rolls_back_all_prior_actions() {
    let mut session = Session::new(Settings::default());
    let before = session.doc.clone();
    let result = execute_validated_plan(
        &mut session,
        &plan(vec![
            shape(0, Some("made"), 1.0, 2.0),
            action(
                1,
                Some("layer"),
                "layer.create",
                json!({ "name": "Temporary" }),
            ),
            action(
                2,
                None,
                "layer.rename",
                json!({ "layer": 99, "name": "Nope" }),
            ),
        ]),
        "AI — rollback final",
    );
    assert!(!result.ok);
    assert!(result.rolled_back);
    assert_eq!(session.doc, before);
    assert_eq!(session.history.undo_len(), 0);
}

#[test]
fn live_locked_and_hidden_ancestor_guards_fail_closed() {
    for (visible, locked) in [(false, false), (true, true)] {
        let mut doc = animator_core::Document::new(Settings::default());
        let mut child = doc.scenes[0].layers.remove(0);
        let mut folder = Layer::new_folder(LayerId(2), "Guard");
        folder.visible = visible;
        folder.locked = locked;
        child.parent_id = Some(folder.id);
        doc.scenes[0].layers = vec![folder, child];
        let mut session = Session::from_document(doc.clone());
        session.active_layer = 1;
        let result = execute_validated_plan(
            &mut session,
            &plan(vec![shape(0, None, 1.0, 2.0)]),
            "AI — guarded",
        );
        assert!(!result.ok);
        assert_eq!(
            result.error.as_ref().map(|e| e.code.as_str()),
            Some("E_GUARD")
        );
        assert_eq!(session.doc, doc);
        assert_eq!(session.history.undo_len(), 0);
    }
}

#[test]
fn stale_node_reference_never_mutates_the_live_document() {
    let mut session = Session::new(Settings::default());
    let before = session.doc.clone();
    let result = execute_validated_plan(
        &mut session,
        &plan(vec![action(
            0,
            None,
            "node.setStyle",
            json!({ "node": 12345, "fill": "#00ff00" }),
        )]),
        "AI — stale",
    );
    assert!(!result.ok);
    assert!(!result.rolled_back);
    assert_eq!(
        result.error.as_ref().map(|e| e.code.as_str()),
        Some("E_REF")
    );
    assert_eq!(session.doc, before);
}

#[test]
fn redo_is_invalidated_exactly_like_a_normal_editor_command() {
    let mut session = Session::new(Settings::default());
    session.draw_rect(0.0, 0.0, 10.0, 10.0, "#000000");
    assert!(session.undo());
    assert_eq!(session.history.redo_len(), 1);

    let result = execute_validated_plan(
        &mut session,
        &plan(vec![shape(0, None, 10.0, 10.0)]),
        "AI — new branch",
    );
    assert!(result.ok);
    assert_eq!(session.history.redo_len(), 0);
    assert_eq!(session.history.undo_len(), 1);
}

#[test]
fn minimal_transform_preserves_unrelated_nodes_byte_for_byte() {
    let mut setup = Session::new(Settings::default());
    let first = setup.draw_rect(0.0, 0.0, 10.0, 10.0, "#ff0000");
    let second = setup.draw_rect(100.0, 100.0, 30.0, 40.0, "#00ff00");
    let mut session = Session::from_document(setup.doc.clone());
    let document_before = session.doc.clone();
    let unrelated_before = session
        .doc
        .nodes
        .get(&second)
        .cloned()
        .expect("second node");

    let result = execute_validated_plan(
        &mut session,
        &plan(vec![action(
            0,
            None,
            "node.transform",
            json!({ "node": first.0, "y": 50.0 }),
        )]),
        "AI — minimal",
    );
    assert!(result.ok);
    assert_eq!(result.mutation_count, 1);
    assert_eq!(
        session.history.undo_len(),
        1,
        "the AI plan is one history entry"
    );
    assert_eq!(session.doc.nodes.get(&second), Some(&unrelated_before));
    let changed = session.doc.nodes.get(&first).expect("first node");
    assert_eq!(changed.transform().x, 0.0);
    assert_eq!(
        changed.transform().y,
        0.0,
        "per-key transform preserves the node's base transform"
    );
    assert_eq!(changed.transform().scale_x, 1.0);
    assert_eq!(
        session
            .selected_transform(first)
            .expect("target has an effective transform")
            .y,
        50.0
    );
    assert_eq!(
        session
            .selected_transform(second)
            .expect("unrelated node still has an effective transform")
            .y,
        100.0,
        "unrelated node's effective transform is unchanged"
    );
    match session.doc.scenes[0].layers[0].keyframes.get(&1) {
        Some(animator_core::Frame::Keyframe { transforms, .. }) => {
            assert_eq!(
                transforms.get(&first).map(|transform| transform.y),
                Some(50.0),
                "target Y is stored in the keyframe transform map"
            );
            assert!(
                !transforms.contains_key(&second),
                "the transaction must not create an override for an unrelated node"
            );
        }
        _ => panic!("frame 1 must remain a content keyframe"),
    }
    let resolved = session
        .evaluate(1)
        .into_iter()
        .find(|item| item.id == first.0)
        .expect("transformed node evaluates at the affected frame");
    assert_eq!(resolved.x, 0.0);
    assert_eq!(resolved.y, 50.0);

    assert!(session.undo());
    assert_eq!(
        session.doc, document_before,
        "undo restores the full document exactly"
    );
    assert_eq!(session.doc.nodes.get(&second), Some(&unrelated_before));
    assert_eq!(session.selected_transform(first).unwrap().y, 0.0);

    assert!(session.redo());
    assert_eq!(session.doc.nodes.get(&second), Some(&unrelated_before));
    assert_eq!(session.selected_transform(first).unwrap().y, 50.0);
    assert_eq!(session.selected_transform(second).unwrap().y, 100.0);
}

#[test]
fn selection_prev_and_post_are_preserved_by_group_undo_redo() {
    let mut setup = Session::new(Settings::default());
    let old = setup.draw_rect(0.0, 0.0, 10.0, 10.0, "#000000");
    let mut session = Session::from_document(setup.doc.clone());
    session.selection = vec![old];

    let result = execute_validated_plan(
        &mut session,
        &plan(vec![shape(0, Some("new"), 20.0, 20.0)]),
        "AI — selection",
    );
    assert!(result.ok);
    let new_id = NodeId(
        result
            .bindings
            .iter()
            .find(|binding| binding.alias == "new")
            .expect("new binding")
            .id,
    );
    assert_eq!(session.selection, vec![new_id]);
    assert!(session.undo());
    assert_eq!(session.selection, vec![old]);
    assert!(session.redo());
    assert_eq!(session.selection, vec![new_id]);
}

#[test]
fn multi_child_action_is_still_one_nested_group_history_entry() {
    let mut session = Session::new(Settings::default());
    let before = session.doc.clone();
    let result = execute_validated_plan(
        &mut session,
        &plan(vec![action(
            0,
            Some("layer"),
            "layer.create",
            json!({ "name": "Renamed in same action" }),
        )]),
        "AI — nested children",
    );
    assert!(result.ok);
    assert_eq!(result.mutation_count, 2); // CreateLayer + existing RenameLayer
    assert_eq!(session.history.undo_len(), 1);
    assert!(session.undo());
    assert_eq!(session.doc.settings, before.settings);
    assert_eq!(session.doc.scenes, before.scenes);
    assert_eq!(session.doc.nodes, before.nodes);
    assert_eq!(session.doc.library, before.library);
}

#[test]
fn selection_only_plan_changes_view_state_without_polluting_history() {
    let mut setup = Session::new(Settings::default());
    let id = setup.draw_rect(0.0, 0.0, 10.0, 10.0, "#000000");
    let mut session = Session::from_document(setup.doc);
    let result = execute_validated_plan(
        &mut session,
        &plan(vec![action(
            0,
            None,
            "selection.set",
            json!({ "nodes": [id.0] }),
        )]),
        "AI — select",
    );
    assert!(result.ok);
    assert_eq!(result.mutation_count, 0);
    assert_eq!(session.selection, vec![id]);
    assert_eq!(session.history.undo_len(), 0);
}
