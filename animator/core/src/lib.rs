//! animator-core — original 2D animation editor engine (offline-first).
//! Vertical slice 1: document model, sparse timeline, selection, transform,
//! keyframe insert, linear position interpolation, undo/redo, SVG export.
//!
//! Ownership (Phase-3): MOD-DOC / MOD-FRAME / MOD-SELECTION / MOD-XFR /
//! MOD-COMMAND / MOD-PERSIST / MOD-EXPORT (SVG subset).

pub mod command;
pub mod doc_manager;
pub mod easing;
pub mod eval;
pub mod export;
pub mod id;
pub mod model;
pub mod persist;
pub mod session;
#[cfg(target_arch = "wasm32")]
pub mod wasm;

pub use command::{Command, History};
pub use doc_manager::{DocManager, ManagedDoc};
pub use easing::{ease_classic, ease_penner, EaseFn, EaseMode};
pub use eval::{evaluate, hit_test, RectItem};
pub use id::{LayerId, NodeId, SceneId, SymbolId};
pub use model::{
    ClassicTween, Document, Frame, Layer, LoopMode, Node, Scene, Settings, Symbol, SymbolType,
    Transform,
};
pub use session::{NodePropsPatch, Session, SettingsPatch, TransformPatch};
