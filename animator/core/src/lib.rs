//! animator-core — original 2D animation editor engine (offline-first).
//! Vertical slice 1: document model, sparse timeline, selection, transform,
//! keyframe insert, linear position interpolation, undo/redo, SVG export.
//!
//! Ownership (Phase-3): MOD-DOC / MOD-FRAME / MOD-SELECTION / MOD-XFR /
//! MOD-COMMAND / MOD-PERSIST / MOD-EXPORT (SVG subset).

pub mod command;
pub mod eval;
pub mod export;
pub mod id;
pub mod model;
pub mod persist;
pub mod session;
#[cfg(target_arch = "wasm32")]
pub mod wasm;

pub use command::{Command, History};
pub use eval::{evaluate, hit_test, RectItem};
pub use id::{LayerId, NodeId, SceneId};
pub use model::{Document, Frame, Layer, Node, Scene, Settings, Transform};
pub use session::Session;
