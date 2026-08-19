//! animator-core — original 2D animation editor engine (offline-first).
//! Vertical slice 1: document model, sparse timeline, selection, transform,
//! keyframe insert, linear position interpolation, undo/redo, SVG export.
//!
//! Ownership (Phase-3): MOD-DOC / MOD-FRAME / MOD-SELECTION / MOD-XFR /
//! MOD-COMMAND / MOD-PERSIST / MOD-EXPORT (SVG subset).

pub mod id;
pub mod model;
pub mod eval;
pub mod command;
pub mod session;
pub mod persist;
pub mod export;

pub use id::{NodeId, LayerId, SceneId};
pub use model::{Document, Settings, Transform, Node, Frame, Layer, Scene};
pub use eval::{evaluate, hit_test, RectItem};
pub use command::{Command, History};
pub use session::Session;
