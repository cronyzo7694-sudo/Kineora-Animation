// SYS-05 Insert ▸ Scene — Part 01 §1.2.4 ("Scene | Append a new scene |
// Scene list") + Part 25.1 ("append a scene with a default timeline; named
// 'Scene N'; becomes active"). One feature, end-to-end: append semantics,
// naming, activation/re-bind, undo/redo exactness, dirty, isolation,
// persistence round-trip.
use animator_core::{NodeId, Session, Settings};

fn session() -> Session {
    Session::new(Settings::default())
}

#[test]
fn insert_scene_appends_with_default_timeline_and_activates() {
    let mut s = session();
    assert_eq!(s.doc.scenes.len(), 1);
    let idx = s.create_scene().expect("scene created");
    assert_eq!(idx, 1, "APPENDED to the end (Part 25.1), not inserted");
    assert_eq!(s.doc.scenes.len(), 2);
    let sc = &s.doc.scenes[1];
    assert_eq!(sc.name, "Scene 2", "first unused 'Scene N'");
    assert_eq!(sc.layers.len(), 1, "default timeline = one layer");
    assert_eq!(
        sc.layers[0].name, "Layer 1",
        "same default Document::new seeds"
    );
    assert!(
        sc.layers[0].keyframes.contains_key(&1),
        "blank keyframe @1 (a valid draw target immediately)"
    );
    // Part 25.1 "becomes active" + 25.4 re-bind
    assert_eq!(s.active_scene, 1);
    assert_eq!(s.active_layer, 0);
    assert_eq!(s.playhead, 1);
    assert!(s.selection.is_empty(), "selection cleared on re-bind");
}

#[test]
fn scene_naming_skips_used_names_and_ids_are_stable() {
    let mut s = session();
    // occupy "Scene 2" by renaming scene 1 — the next create must skip it
    s.doc.scenes[0].name = "Scene 2".into();
    let idx = s.create_scene().unwrap();
    assert_eq!(s.doc.scenes[idx].name, "Scene 1", "first UNUSED N");
    let idx2 = s.create_scene().unwrap();
    assert_eq!(s.doc.scenes[idx2].name, "Scene 3");
    // ids strictly increase (identity = SceneId, never the display name)
    assert!(s.doc.scenes[idx2].id.0 > s.doc.scenes[idx].id.0);
}

#[test]
fn undo_removes_exactly_the_new_scene_and_reclamps_active() {
    let mut s = session();
    s.draw_rect(1.0, 1.0, 5.0, 5.0, "#f00"); // content in scene 1
    let before_sel = s.selection.clone();
    assert!(!before_sel.is_empty());
    s.create_scene().unwrap();
    assert_eq!(s.active_scene, 1);
    assert!(s.undo());
    assert_eq!(s.doc.scenes.len(), 1, "appended scene removed");
    assert_eq!(
        s.active_scene, 0,
        "active pointer re-clamped (sanitize_indices)"
    );
    assert_eq!(
        s.selection, before_sel,
        "History restores prev selection (C-2 contract)"
    );
    // redo restores the exact post-command state
    assert!(s.redo());
    assert_eq!(s.doc.scenes.len(), 2);
    assert_eq!(s.doc.scenes[1].name, "Scene 2");
}

#[test]
fn scenes_are_isolated_timelines_sharing_one_document() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 10.0, 10.0, "#00f");
    assert_eq!(s.evaluate(1).len(), 1, "scene 1 has the rect");
    s.create_scene().unwrap();
    // active scene is now the empty scene 2 — its evaluate is empty
    assert_eq!(s.evaluate(1).len(), 0, "new scene = empty timeline");
    let id = s.draw_rect(5.0, 5.0, 10.0, 10.0, "#0f0");
    assert_ne!(id, NodeId(0), "new scene's Layer 1 is a valid draw target");
    assert_eq!(s.evaluate(1).len(), 1);
    // switching the active pointer back shows scene 1's content only
    s.active_scene = 0;
    assert_eq!(s.evaluate(1).len(), 1);
    assert_eq!(s.evaluate(1)[0].fill, "#00f");
}

#[test]
fn insert_scene_dirties_and_save_load_round_trips_both_scenes() {
    let mut s = session();
    // H05 §7.1 contract: persist (save) and snapshot-advance (mark_clean)
    // are SEPARATE steps — the core save() never advances the snapshot.
    s.save(&tmp("scene-rt.json")).unwrap();
    s.mark_clean();
    assert!(!s.is_dirty(), "clean after save + mark_clean");
    s.create_scene().unwrap();
    assert!(s.is_dirty(), "Insert ▸ Scene is a DOCUMENT MUTATION");
    let p = tmp("scene-rt2.json");
    s.save(&p).unwrap();
    s.mark_clean();
    assert!(!s.is_dirty());
    let loaded = Session::load(&p).unwrap();
    assert_eq!(loaded.doc.scenes.len(), 2);
    assert_eq!(loaded.doc.scenes[1].name, "Scene 2");
    assert_eq!(loaded.doc.scenes[1].layers.len(), 1);
    cleanup(&tmp("scene-rt.json"));
    cleanup(&p);
}

#[test]
fn rapid_creates_are_independent_undo_steps() {
    let mut s = session();
    s.create_scene().unwrap();
    s.create_scene().unwrap();
    s.create_scene().unwrap();
    assert_eq!(s.doc.scenes.len(), 4);
    assert_eq!(
        s.doc
            .scenes
            .iter()
            .map(|sc| sc.name.as_str())
            .collect::<Vec<_>>(),
        vec!["Scene 1", "Scene 2", "Scene 3", "Scene 4"]
    );
    s.undo();
    s.undo();
    assert_eq!(s.doc.scenes.len(), 2, "each create = exactly one undo step");
    assert_eq!(s.active_scene, 1, "still valid after partial unwind");
}

// ——— helpers ———
use std::path::{Path, PathBuf};

fn tmp(name: &str) -> PathBuf {
    let mut p = std::env::temp_dir();
    p.push(format!("kineora-scenes-{}-{}", std::process::id(), name));
    p
}

fn cleanup(p: &Path) {
    let _ = std::fs::remove_file(p);
    let _ = std::fs::remove_file({
        let mut s = p.as_os_str().to_os_string();
        s.push(".checksum");
        PathBuf::from(s)
    });
}
