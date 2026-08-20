use std::path::Path;

use crate::command::{DrawRect, History, InsertKeyframe, MoveSelection};
use crate::eval::{evaluate, hit_test, RectItem};
use crate::export::export_svg;
use crate::id::NodeId;
use crate::model::{Document, Node, Settings, Transform};
use crate::persist;

/// Editor controller: owns the document + view state (selection/playhead) +
/// command history. This is the core's public API (bound to UI via WASM).
pub struct Session {
    pub doc: Document,
    pub history: History,
    pub selection: Vec<NodeId>,
    pub playhead: u32,
    pub active_scene: usize,
    pub active_layer: usize,
    /// Dev-mode observability (Phase-4 manual-test requirement).
    pub event_log: Vec<String>,
}

impl Session {
    pub fn new(settings: Settings) -> Self {
        let mut s = Self {
            doc: Document::new(settings),
            history: History::new(),
            selection: Vec::new(),
            playhead: 1,
            active_scene: 0,
            active_layer: 0,
            event_log: vec!["session:new".into()],
        };
        s.log("document:created");
        s
    }

    fn log(&mut self, msg: &str) {
        self.event_log.push(msg.to_string());
        if self.event_log.len() > 200 {
            self.event_log.remove(0);
        }
    }

    pub fn set_playhead(&mut self, frame: u32) {
        self.playhead = frame.max(1);
        self.log(&format!("playhead:{frame}"));
    }

    pub fn draw_rect(&mut self, x: f64, y: f64, w: f64, h: f64, fill: &str) -> NodeId {
        let id = self.doc.alloc_node_id();
        let node = Node::Rect {
            id,
            transform: Transform {
                x,
                y,
                ..Transform::default()
            },
            width: w,
            height: h,
            fill: fill.to_string(),
            stroke: None,
            stroke_width: 0.0,
        };
        let cmd = DrawRect {
            scene: self.active_scene,
            layer: self.active_layer,
            frame: self.playhead,
            node,
        };
        self.history.execute(&mut self.doc, Box::new(cmd));
        self.selection = vec![id];
        self.log(&format!("draw:rect id={:?} @{}", id, self.playhead));
        id
    }

    pub fn select_at(&mut self, x: f64, y: f64) -> bool {
        let hit = hit_test(&self.doc, self.active_scene, self.playhead, x, y);
        self.selection = hit.into_iter().collect();
        self.log(&format!(
            "select:at({x},{y}) → {:?}",
            self.selection.first()
        ));
        !self.selection.is_empty()
    }

    pub fn select_all(&mut self) {
        let content = self
            .doc
            .content_at(self.active_scene, self.active_layer, self.playhead);
        self.selection = content;
        self.log("select:all");
    }

    pub fn clear_selection(&mut self) {
        self.selection.clear();
        self.log("select:clear");
    }

    pub fn move_selection(&mut self, dx: f64, dy: f64) {
        if self.selection.is_empty() {
            return;
        }
        // zero-distance drag must not pollute undo history (PHASE G)
        if dx == 0.0 && dy == 0.0 {
            return;
        }
        let ids = self.selection.clone();
        let cmd = MoveSelection::new(
            ids,
            dx,
            dy,
            self.active_scene,
            self.active_layer,
            self.playhead,
        );
        self.history.execute(&mut self.doc, Box::new(cmd));
        self.log(&format!("move:selection({dx},{dy}) @{}", self.playhead));
    }

    pub fn insert_keyframe(&mut self, frame: u32) {
        let cmd = InsertKeyframe::new(self.active_scene, self.active_layer, frame);
        self.history.execute(&mut self.doc, Box::new(cmd));
        self.set_playhead(frame);
        self.log(&format!("keyframe:insert@{frame}"));
    }

    pub fn undo(&mut self) -> bool {
        let ok = self.history.undo(&mut self.doc);
        self.log(if ok { "undo" } else { "undo:(empty)" });
        ok
    }

    pub fn redo(&mut self) -> bool {
        let ok = self.history.redo(&mut self.doc);
        self.log(if ok { "redo" } else { "redo:(empty)" });
        ok
    }

    pub fn evaluate(&self, frame: u32) -> Vec<RectItem> {
        evaluate(&self.doc, self.active_scene, frame)
    }

    pub fn current_frame(&self) -> Vec<RectItem> {
        self.evaluate(self.playhead)
    }

    pub fn export_svg(&self, frame: u32) -> String {
        export_svg(&self.doc, self.active_scene, frame)
    }

    pub fn save(&self, path: &Path) -> Result<(), String> {
        persist::save(&self.doc, path)
    }

    pub fn load(path: &Path) -> Result<Self, String> {
        let doc = persist::load(path)?;
        Ok(Self {
            doc,
            history: History::new(),
            selection: Vec::new(),
            playhead: 1,
            active_scene: 0,
            active_layer: 0,
            event_log: vec!["session:loaded".into()],
        })
    }
}
