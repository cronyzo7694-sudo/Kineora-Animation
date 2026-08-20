//! CLI demo — proves the vertical slice headlessly + offline (manual test).
use animator_core::{Session, Settings};

fn main() {
    let mut s = Session::new(Settings::default());
    println!(
        "[1] create document: {}x{} @{}fps",
        s.doc.settings.width, s.doc.settings.height, s.doc.settings.fps
    );

    s.draw_rect(100.0, 80.0, 200.0, 120.0, "#3f9bf5");
    println!("[2] draw rect → selection {:?}", s.selection);

    s.move_selection(50.0, 40.0);
    println!("[3] move +50,+40 → frame1 rects {:?}", s.current_frame());

    s.insert_keyframe(10);
    s.move_selection(200.0, 100.0);
    println!(
        "[4] keyframe@10 + move → frame10 rects {:?}",
        s.evaluate(10)
    );

    // classic tween between the two keyframes (Part 09.2) — interpolation is
    // explicit; without it, frame 5 HOLDs the frame-1 content.
    s.set_classic_tween(0, 1, 10, 0.0);
    s.set_playhead(5);
    println!("[5] playhead@5 → tweened {:?}", s.evaluate(5));

    s.undo();
    println!("[6] undo (last move) → frame10 {:?}", s.evaluate(10));
    s.redo();
    println!("[7] redo → frame10 {:?}", s.evaluate(10));

    let svg = s.export_svg(10);
    std::fs::write("/tmp/out.svg", &svg).expect("write svg");
    println!(
        "[8] export SVG (frame10) → /tmp/out.svg ({} bytes)",
        svg.len()
    );

    s.save(std::path::Path::new("/tmp/out.json")).expect("save");
    let loaded = Session::load(std::path::Path::new("/tmp/out.json")).expect("load");
    println!(
        "[9] save→load round-trip: nodes={}, scenes={}",
        loaded.doc.nodes.len(),
        loaded.doc.scenes.len()
    );
    println!(
        "[10] event log:\n{}",
        s.event_log
            .iter()
            .map(|e| format!("  - {e}"))
            .collect::<Vec<_>>()
            .join("\n")
    );
}
