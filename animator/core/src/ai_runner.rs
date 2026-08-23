//! A5 — validated AI plan transaction compiler/runner.
//!
//! This module does not validate model output and does not define capabilities.
//! It accepts only A4's already-validated wire shape. Each action is rebuilt
//! through the existing checked `Session` facade against a staging clone of the
//! LIVE document. The resulting existing `Command` objects are transferred to
//! one A1 `Session::execute_grouped` call. A failed action discards the staging
//! session and every prepared command, leaving the real session byte-for-byte
//! unchanged.

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

use crate::command::Command;
use crate::edit_ops::{
    app_object_clipboard, set_app_object_clipboard, AlignOp, AlignSpace, ArrangeOp,
    DUPLICATE_OFFSET,
};
use crate::id::{LayerId, NodeId, SymbolId};
use crate::model::{
    layer_and_ancestors_unlocked, layer_and_ancestors_visible, LoopMode, Node, ShapeKind,
    SymbolType,
};
use crate::session::{NodePropsPatch, SettingsPatch, TransformPatch};
use crate::Session;

const MAX_ACTIONS: usize = 64;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ValidatedPlanWire {
    actions: Vec<ValidatedActionWire>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ValidatedActionWire {
    index: usize,
    #[serde(default)]
    id: Option<String>,
    action: String,
    params: Map<String, Value>,
    #[serde(default)]
    human_text: String,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AiExecutionError {
    pub code: String,
    pub stage: u8,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub action_index: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub action_id: Option<String>,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AiActionExecution {
    pub index: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    pub action: String,
    pub status: String,
    #[serde(skip_serializing_if = "String::is_empty")]
    pub summary: String,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AiEntityBinding {
    pub alias: String,
    pub kind: String,
    pub id: u64,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AiExecutionResult {
    pub ok: bool,
    pub outcome: String,
    pub rolled_back: bool,
    pub mutation_count: usize,
    pub actions: Vec<AiActionExecution>,
    pub bindings: Vec<AiEntityBinding>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<AiExecutionError>,
}

impl AiExecutionResult {
    fn parse_failure(message: impl Into<String>) -> Self {
        Self {
            ok: false,
            outcome: "failed".into(),
            rolled_back: false,
            mutation_count: 0,
            actions: Vec::new(),
            bindings: Vec::new(),
            error: Some(AiExecutionError {
                code: "E_COMPILE".into(),
                stage: 12,
                message: message.into(),
                action_index: None,
                action_id: None,
            }),
        }
    }
}

#[derive(Clone, Copy, Debug)]
enum Binding {
    Node(NodeId),
    Layer(LayerId),
    Symbol(SymbolId),
}

impl Binding {
    fn public(self, alias: String) -> AiEntityBinding {
        match self {
            Self::Node(id) => AiEntityBinding {
                alias,
                kind: "node".into(),
                id: id.0,
            },
            Self::Layer(id) => AiEntityBinding {
                alias,
                kind: "layer".into(),
                id: id.0,
            },
            Self::Symbol(id) => AiEntityBinding {
                alias,
                kind: "symbol".into(),
                id: id.0,
            },
        }
    }
}

struct ClipboardRestore(Vec<crate::edit_ops::ObjectClip>);

impl Drop for ClipboardRestore {
    fn drop(&mut self) {
        set_app_object_clipboard(self.0.clone());
    }
}

struct Compiler {
    staging: Session,
    commands: Vec<Box<dyn Command>>,
    bindings: BTreeMap<String, Binding>,
    initial_layers: Vec<LayerId>,
}

impl Compiler {
    fn new(live: &Session) -> Self {
        let mut staging = Session::from_document(live.doc.clone());
        staging.selection = live.selection.clone();
        staging.playhead = live.playhead;
        staging.active_scene = live.active_scene;
        staging.active_layer = live.active_layer;
        staging.frame_clipboard = live.frame_clipboard.clone();
        let initial_layers = staging
            .doc
            .scene(staging.active_scene)
            .map(|scene| scene.layers.iter().map(|layer| layer.id).collect())
            .unwrap_or_default();
        Self {
            staging,
            commands: Vec::new(),
            bindings: BTreeMap::new(),
            initial_layers,
        }
    }

    fn failure(
        &self,
        action: &ValidatedActionWire,
        code: &str,
        message: impl Into<String>,
    ) -> AiExecutionError {
        AiExecutionError {
            code: code.into(),
            stage: match code {
                "E_REF" => 7,
                "E_GUARD" => 9,
                "E_CAPABILITY" => 10,
                _ => 8,
            },
            message: message.into(),
            action_index: Some(action.index),
            action_id: action.id.clone(),
        }
    }

    fn compile_failure(
        &self,
        action: &ValidatedActionWire,
        message: impl Into<String>,
    ) -> AiExecutionError {
        AiExecutionError {
            code: "E_COMPILE".into(),
            stage: 12,
            message: message.into(),
            action_index: Some(action.index),
            action_id: action.id.clone(),
        }
    }

    fn take_command(&mut self, action: &ValidatedActionWire) -> Result<(), AiExecutionError> {
        let Some(command) = self.staging.history.take_last_command() else {
            return Err(self.compile_failure(
                action,
                format!("{} did not construct an engine command", action.action),
            ));
        };
        self.commands.push(command);
        Ok(())
    }

    fn bind(&mut self, action: &ValidatedActionWire, value: Binding) {
        if let Some(id) = &action.id {
            self.bindings.insert(id.clone(), value);
        }
    }

    fn layer_index_for_id(&self, id: LayerId) -> Option<usize> {
        self.staging
            .doc
            .scene(self.staging.active_scene)?
            .layers
            .iter()
            .position(|layer| layer.id == id)
    }

    fn resolve_layer(
        &self,
        action: &ValidatedActionWire,
        value: Option<&Value>,
    ) -> Result<usize, AiExecutionError> {
        let Some(value) = value else {
            return Ok(self.staging.active_layer);
        };
        if let Some(index) = value.as_u64() {
            let Some(id) = self.initial_layers.get(index as usize).copied() else {
                return Err(self.failure(action, "E_STATE", format!("layer index {index} is stale")));
            };
            return self.layer_index_for_id(id).ok_or_else(|| {
                self.failure(action, "E_REF", format!("layer index {index} was deleted or moved"))
            });
        }
        let alias = ref_alias(value)
            .ok_or_else(|| self.compile_failure(action, "layer reference was not materialized"))?;
        match self.bindings.get(alias).copied() {
            Some(Binding::Layer(id)) => self.layer_index_for_id(id).ok_or_else(|| {
                self.failure(action, "E_REF", format!("created layer {alias} no longer exists"))
            }),
            Some(_) => Err(self.compile_failure(action, format!("{alias} is not a layer"))),
            None => Err(self.compile_failure(action, format!("unknown layer binding {alias}"))),
        }
    }

    fn resolve_symbol(
        &self,
        action: &ValidatedActionWire,
        value: &Value,
    ) -> Result<SymbolId, AiExecutionError> {
        if let Some(id) = value.as_u64() {
            let id = SymbolId(id);
            if self.staging.doc.symbol(id).is_some() {
                return Ok(id);
            }
            return Err(self.failure(action, "E_REF", format!("symbol id {} is stale", id.0)));
        }
        let alias = ref_alias(value)
            .ok_or_else(|| self.compile_failure(action, "symbol reference was not materialized"))?;
        match self.bindings.get(alias).copied() {
            Some(Binding::Symbol(id)) if self.staging.doc.symbol(id).is_some() => Ok(id),
            Some(_) => Err(self.compile_failure(action, format!("{alias} is not a symbol"))),
            None => Err(self.compile_failure(action, format!("unknown symbol binding {alias}"))),
        }
    }

    fn resolve_node_one(
        &self,
        action: &ValidatedActionWire,
        value: &Value,
    ) -> Result<NodeId, AiExecutionError> {
        if let Some(id) = value.as_u64() {
            let id = NodeId(id);
            if self.staging.doc.nodes.contains_key(&id) {
                return Ok(id);
            }
            return Err(self.failure(action, "E_REF", format!("node id {} is stale", id.0)));
        }
        let alias = ref_alias(value)
            .ok_or_else(|| self.compile_failure(action, "node reference was not materialized"))?;
        match self.bindings.get(alias).copied() {
            Some(Binding::Node(id)) if self.staging.doc.nodes.contains_key(&id) => Ok(id),
            Some(_) => Err(self.compile_failure(action, format!("{alias} is not a node"))),
            None => Err(self.compile_failure(action, format!("unknown node binding {alias}"))),
        }
    }

    fn resolve_nodes(
        &self,
        action: &ValidatedActionWire,
        value: &Value,
    ) -> Result<Vec<NodeId>, AiExecutionError> {
        let values: Vec<&Value> = match value.as_array() {
            Some(values) => values.iter().collect(),
            None => vec![value],
        };
        if values.is_empty() {
            return Err(self.compile_failure(action, "node target list is empty"));
        }
        let mut out = Vec::with_capacity(values.len());
        for value in values {
            let id = self.resolve_node_one(action, value)?;
            if !out.contains(&id) {
                out.push(id);
            }
        }
        Ok(out)
    }

    fn ensure_layer_content_editable(
        &self,
        action: &ValidatedActionWire,
        index: usize,
    ) -> Result<(), AiExecutionError> {
        let Some(scene) = self.staging.doc.scene(self.staging.active_scene) else {
            return Err(self.failure(action, "E_STATE", "active scene no longer exists"));
        };
        let Some(layer) = scene.layers.get(index) else {
            return Err(self.failure(action, "E_STATE", format!("layer index {index} is stale")));
        };
        if layer.is_folder() {
            return Err(self.failure(action, "E_GUARD", format!("layer {index} is a folder")));
        }
        if !layer_and_ancestors_visible(&scene.layers, layer) {
            return Err(self.failure(
                action,
                "E_GUARD",
                format!("layer {index} is hidden or has a hidden ancestor"),
            ));
        }
        if !layer_and_ancestors_unlocked(&scene.layers, layer) {
            return Err(self.failure(
                action,
                "E_GUARD",
                format!("layer {index} is locked or has a locked ancestor"),
            ));
        }
        Ok(())
    }

    fn ensure_nodes_editable(
        &self,
        action: &ValidatedActionWire,
        ids: &[NodeId],
    ) -> Result<(), AiExecutionError> {
        let Some(scene) = self.staging.doc.scene(self.staging.active_scene) else {
            return Err(self.failure(action, "E_STATE", "active scene no longer exists"));
        };
        for id in ids {
            let mut present = false;
            for (index, layer) in scene.layers.iter().enumerate() {
                if self
                    .staging
                    .doc
                    .content_at(self.staging.active_scene, index, self.staging.playhead)
                    .contains(id)
                {
                    present = true;
                    if layer.is_folder()
                        || !layer_and_ancestors_visible(&scene.layers, layer)
                        || !layer_and_ancestors_unlocked(&scene.layers, layer)
                    {
                        return Err(self.failure(
                            action,
                            "E_GUARD",
                            format!("node {} is on a hidden, locked, or folder layer", id.0),
                        ));
                    }
                }
            }
            if !present {
                return Err(self.failure(
                    action,
                    "E_REF",
                    format!("node {} is not present at the live playhead", id.0),
                ));
            }
        }
        Ok(())
    }

    fn select_nodes(
        &mut self,
        action: &ValidatedActionWire,
        ids: Vec<NodeId>,
    ) -> Result<(), AiExecutionError> {
        self.ensure_nodes_editable(action, &ids)?;
        let kept = self.staging.set_selection(ids.clone());
        if kept != ids.len() {
            return Err(self.failure(action, "E_REF", "live selection targets became stale"));
        }
        Ok(())
    }

    fn with_layer_frame<T>(
        &mut self,
        layer: usize,
        frame: Option<u32>,
        f: impl FnOnce(&mut Session) -> T,
    ) -> T {
        let old_layer_id = self
            .staging
            .doc
            .scene(self.staging.active_scene)
            .and_then(|scene| scene.layers.get(self.staging.active_layer))
            .map(|layer| layer.id);
        let old_playhead = self.staging.playhead;
        self.staging.active_layer = layer;
        if let Some(frame) = frame {
            self.staging.playhead = frame;
        }
        let out = f(&mut self.staging);
        self.staging.playhead = old_playhead;
        if let Some(id) = old_layer_id {
            if let Some(index) = self.layer_index_for_id(id) {
                self.staging.active_layer = index;
            }
        }
        out
    }

    fn compile_action(&mut self, action: &ValidatedActionWire) -> Result<usize, AiExecutionError> {
        let before = self.commands.len();
        let p = &action.params;
        match action.action.as_str() {
            "scene.inspect" => {}
            "playback.gotoFrame" => {
                return Err(self.failure(
                    action,
                    "E_CAPABILITY",
                    "playback automation is outside the approved A5 transaction slice",
                ));
            }
            "selection.clear" => self.staging.clear_selection(),
            "selection.set" => {
                let nodes = self.resolve_nodes(action, required(p, "nodes", action)?)?;
                self.select_nodes(action, nodes)?;
            }
            "shape.create" => {
                let layer = self.resolve_layer(action, p.get("layer"))?;
                self.ensure_layer_content_editable(action, layer)?;
                let frame = optional_u32(p, "frame", action)?;
                let shape = match required_str(p, "shape", action)? {
                    "rect" => ShapeKind::Rect,
                    "oval" => ShapeKind::Oval,
                    other => return Err(self.compile_failure(action, format!("unsupported shape {other}"))),
                };
                let stroke = optional_color(p, "stroke", action)?;
                let x = required_f64(p, "x", action)?;
                let y = required_f64(p, "y", action)?;
                let w = required_f64(p, "w", action)?;
                let h = required_f64(p, "h", action)?;
                let fill = required_str(p, "fill", action)?.to_string();
                let stroke_width = optional_f64(p, "strokeWidth", action)?.unwrap_or(0.0);
                let id = self.with_layer_frame(layer, frame, |session| {
                    session.draw_shape(
                        shape,
                        x,
                        y,
                        w,
                        h,
                        &fill,
                        stroke.as_deref(),
                        stroke_width,
                    )
                });
                if id.0 == 0 {
                    return Err(self.failure(action, "E_GUARD", "shape target is no longer editable"));
                }
                self.take_command(action)?;
                self.bind(action, Binding::Node(id));
            }
            "node.transform" => {
                let ids = self.resolve_nodes(action, required(p, "node", action)?)?;
                self.select_nodes(action, ids.clone())?;
                if optional_bool(p, "reset", action)?.unwrap_or(false) {
                    if !self.staging.remove_transform() {
                        return Err(self.failure(action, "E_STATE", "requested reset is now a no-op"));
                    }
                    self.take_command(action)?;
                }
                let relative = optional_bool(p, "relative", action)?.unwrap_or(false);
                let mut patches = Vec::new();
                for id in ids {
                    let current = self.staging.selected_transform(id).ok_or_else(|| {
                        self.failure(action, "E_REF", format!("node {} transform is stale", id.0))
                    })?;
                    let x = optional_f64(p, "x", action)?;
                    let y = optional_f64(p, "y", action)?;
                    patches.push((
                        id,
                        TransformPatch {
                            x: x.map(|value| if relative { current.x + value } else { value }),
                            y: y.map(|value| if relative { current.y + value } else { value }),
                            scale_x: optional_f64(p, "scaleX", action)?,
                            scale_y: optional_f64(p, "scaleY", action)?,
                            rotation: optional_f64(p, "rotation", action)?,
                        },
                    ));
                }
                if patches.iter().any(|(_, patch)| {
                    patch.x.is_some()
                        || patch.y.is_some()
                        || patch.scale_x.is_some()
                        || patch.scale_y.is_some()
                        || patch.rotation.is_some()
                }) {
                    self.staging.patch_node_transforms(patches);
                    self.take_command(action)?;
                }
                if self.commands.len() == before {
                    return Err(self.failure(action, "E_STATE", "transform is now a no-op"));
                }
            }
            "node.setStyle" => {
                let ids = self.resolve_nodes(action, required(p, "node", action)?)?;
                self.ensure_nodes_editable(action, &ids)?;
                let stroke_value = p.get("stroke");
                let (stroke_enabled, stroke) = match stroke_value {
                    Some(Value::Null) => (Some(false), None),
                    Some(Value::String(value)) if value == "none" => (Some(false), None),
                    Some(Value::String(value)) => (Some(true), Some(value.clone())),
                    Some(_) => return Err(self.compile_failure(action, "invalid stroke value")),
                    None => (None, None),
                };
                let patch = NodePropsPatch {
                    width: optional_f64(p, "width", action)?,
                    height: optional_f64(p, "height", action)?,
                    fill: optional_string(p, "fill", action)?,
                    stroke_enabled,
                    stroke,
                    stroke_width: optional_f64(p, "strokeWidth", action)?,
                };
                self.staging
                    .set_node_props(ids.into_iter().map(|id| (id, patch.clone())).collect());
                self.take_command(action)?;
            }
            "node.delete" => {
                let ids = self.resolve_nodes(action, required(p, "nodes", action)?)?;
                self.select_nodes(action, ids)?;
                if !self.staging.delete_selection() {
                    return Err(self.failure(action, "E_STATE", "delete target became unavailable"));
                }
                self.take_command(action)?;
            }
            "node.duplicate" => {
                let ids = self.resolve_nodes(action, required(p, "nodes", action)?)?;
                self.select_nodes(action, ids)?;
                let copies = optional_usize(p, "copies", action)?.unwrap_or(1);
                let offset = optional_f64(p, "offset", action)?.unwrap_or(DUPLICATE_OFFSET);
                for _ in 0..copies {
                    if !self.staging.duplicate_objects() {
                        return Err(self.failure(action, "E_STATE", "duplicate target became unavailable"));
                    }
                    self.take_command(action)?;
                    let delta = offset - DUPLICATE_OFFSET;
                    if delta != 0.0 {
                        self.staging.move_selection(delta, delta);
                        self.take_command(action)?;
                    }
                }
            }
            "node.arrange" => {
                let ids = self.resolve_nodes(action, required(p, "nodes", action)?)?;
                self.select_nodes(action, ids)?;
                let op = match required_str(p, "op", action)? {
                    "bring-to-front" => ArrangeOp::Front,
                    "bring-forward" => ArrangeOp::Forward,
                    "send-backward" => ArrangeOp::Backward,
                    "send-to-back" => ArrangeOp::Back,
                    other => return Err(self.compile_failure(action, format!("invalid arrange op {other}"))),
                };
                if !self.staging.arrange_selection(op) {
                    return Err(self.failure(action, "E_STATE", "arrange target became unavailable"));
                }
                self.take_command(action)?;
            }
            "node.align" => {
                let ids = self.resolve_nodes(action, required(p, "nodes", action)?)?;
                self.select_nodes(action, ids)?;
                let op = match required_str(p, "op", action)? {
                    "left" => AlignOp::Left,
                    "center-h" => AlignOp::CenterH,
                    "right" => AlignOp::Right,
                    "top" => AlignOp::Top,
                    "center-v" => AlignOp::MiddleV,
                    "bottom" => AlignOp::Bottom,
                    other => return Err(self.compile_failure(action, format!("invalid align op {other}"))),
                };
                let space = match optional_str(p, "space", action)?.unwrap_or("selection") {
                    "selection" => AlignSpace::Selection,
                    "stage" => AlignSpace::Stage,
                    other => return Err(self.compile_failure(action, format!("invalid align space {other}"))),
                };
                if !self.staging.align_selection(op, space) {
                    return Err(self.failure(action, "E_STATE", "align target became unavailable"));
                }
                self.take_command(action)?;
            }
            "layer.create" | "folder.create" => {
                let index = if action.action == "layer.create" {
                    self.staging.create_layer()
                } else {
                    self.staging.create_folder()
                }
                .ok_or_else(|| self.failure(action, "E_STATE", "layer creation failed"))?;
                self.take_command(action)?;
                let id = self
                    .staging
                    .doc
                    .scene(self.staging.active_scene)
                    .and_then(|scene| scene.layers.get(index))
                    .map(|layer| layer.id)
                    .ok_or_else(|| self.failure(action, "E_STATE", "created layer disappeared"))?;
                if let Some(name) = optional_str(p, "name", action)? {
                    let current_name = self
                        .staging
                        .doc
                        .scene(self.staging.active_scene)
                        .and_then(|scene| scene.layers.get(index))
                        .map(|layer| layer.name.as_str());
                    if current_name != Some(name) {
                        if !self.staging.rename_layer(index, name) {
                            return Err(self.failure(action, "E_STATE", "created layer could not be named"));
                        }
                        self.take_command(action)?;
                    }
                }
                self.bind(action, Binding::Layer(id));
            }
            "layer.rename" => {
                let layer = self.resolve_layer(action, p.get("layer"))?;
                if !self.staging.rename_layer(layer, required_str(p, "name", action)?) {
                    return Err(self.failure(action, "E_STATE", "rename target became stale or unchanged"));
                }
                self.take_command(action)?;
            }
            "layer.delete" => {
                let layer = self.resolve_layer(action, p.get("layer"))?;
                if !self.staging.delete_layer(layer) {
                    return Err(self.failure(action, "E_STATE", "layer delete is no longer valid"));
                }
                self.take_command(action)?;
            }
            "layer.setVisible" | "layer.setLocked" | "layer.setOutline" => {
                let layer = self.resolve_layer(action, p.get("layer"))?;
                let value = required_bool(p, "value", action)?;
                let ok = match action.action.as_str() {
                    "layer.setVisible" => self.staging.set_layer_visible(layer, value),
                    "layer.setLocked" => self.staging.set_layer_locked(layer, value),
                    _ => self.staging.set_layer_outline(layer, value),
                };
                if !ok {
                    return Err(self.failure(action, "E_STATE", "layer flag target is stale or unchanged"));
                }
                self.take_command(action)?;
            }
            "layer.duplicate" => {
                let layer = self.resolve_layer(action, p.get("layer"))?;
                if self.staging.duplicate_layer(layer).is_none() {
                    return Err(self.failure(action, "E_STATE", "layer duplicate target became stale"));
                }
                self.take_command(action)?;
            }
            "layer.reorder" => {
                let layer = self.resolve_layer(action, p.get("layer"))?;
                let to = required_usize(p, "to", action)?;
                if !self.staging.move_layer(layer, to) {
                    return Err(self.failure(action, "E_STATE", "layer reorder became invalid"));
                }
                self.take_command(action)?;
            }
            "layer.setParent" => {
                let child = self.resolve_layer(action, p.get("layer"))?;
                let parent = match p.get("parent") {
                    Some(value) => Some(self.resolve_layer(action, Some(value))?),
                    None => None,
                };
                if !self.staging.set_layer_parent(child, parent) {
                    return Err(self.failure(action, "E_STATE", "layer parent target became invalid"));
                }
                self.take_command(action)?;
            }
            "keyframe.insert" | "keyframe.insertBlank" | "keyframe.clear" => {
                let layer = self.resolve_layer(action, p.get("layer"))?;
                self.ensure_layer_content_editable(action, layer)?;
                let frame = required_u32(p, "frame", action)?;
                let ok = self.with_layer_frame(layer, None, |session| match action.action.as_str() {
                    "keyframe.insert" => session.insert_keyframe(frame),
                    "keyframe.insertBlank" => session.insert_blank_keyframe(frame),
                    _ => session.clear_keyframe(frame),
                });
                if !ok {
                    return Err(self.failure(action, "E_STATE", "keyframe state changed before apply"));
                }
                self.take_command(action)?;
            }
            "keyframe.move" | "keyframe.duplicate" => {
                let layer = self.resolve_layer(action, p.get("layer"))?;
                self.ensure_layer_content_editable(action, layer)?;
                let from = required_u32(p, "from", action)?;
                let to = required_u32(p, "to", action)?;
                let ok = if action.action == "keyframe.move" {
                    self.staging.move_keyframe(layer, from, to)
                } else {
                    self.staging.duplicate_keyframe(layer, from, to)
                };
                if !ok {
                    return Err(self.failure(action, "E_STATE", "keyframe source/target changed before apply"));
                }
                self.take_command(action)?;
            }
            "frames.insert" | "frames.delete" => {
                let layer = self.resolve_layer(action, p.get("layer"))?;
                self.ensure_layer_content_editable(action, layer)?;
                let start = required_u32(p, "start", action)?;
                let end = required_u32(p, "end", action)?;
                let count = end.saturating_sub(start) + 1;
                for _ in 0..count {
                    let ok = self.with_layer_frame(layer, None, |session| {
                        if action.action == "frames.insert" {
                            session.insert_frame(start)
                        } else {
                            session.delete_frame(start)
                        }
                    });
                    if !ok {
                        return Err(self.failure(action, "E_STATE", "frame range changed before apply"));
                    }
                    self.take_command(action)?;
                }
            }
            "frames.remove"
            | "frames.reverse"
            | "frames.duplicate"
            | "frames.convertToKeyframes"
            | "frames.convertToBlankKeyframes" => {
                let layer = self.resolve_layer(action, p.get("layer"))?;
                self.ensure_layer_content_editable(action, layer)?;
                let start = required_u32(p, "start", action)?;
                let end = required_u32(p, "end", action)?;
                let ok = match action.action.as_str() {
                    "frames.remove" => self.staging.remove_frames(layer, start, end),
                    "frames.reverse" => self.staging.reverse_frames(layer, start, end),
                    "frames.duplicate" => self.staging.duplicate_frames(layer, start, end),
                    "frames.convertToKeyframes" => {
                        self.staging.convert_to_keyframes(layer, start, end)
                    }
                    _ => self.staging.convert_to_blank_keyframes(layer, start, end),
                };
                if !ok {
                    return Err(self.failure(action, "E_STATE", "frame range changed before apply"));
                }
                self.take_command(action)?;
            }
            "frames.setLabel" => {
                let layer = self.resolve_layer(action, p.get("layer"))?;
                self.ensure_layer_content_editable(action, layer)?;
                let frame = required_u32(p, "frame", action)?;
                if !self.staging.set_frame_label(
                    layer,
                    frame,
                    Some(required_str(p, "label", action)?),
                ) {
                    return Err(self.failure(action, "E_STATE", "frame label target changed"));
                }
                self.take_command(action)?;
            }
            "tween.classic.set" => {
                let layer = self.resolve_layer(action, p.get("layer"))?;
                self.ensure_layer_content_editable(action, layer)?;
                if !self.staging.set_classic_tween(
                    layer,
                    required_u32(p, "start", action)?,
                    required_u32(p, "end", action)?,
                    required_f64(p, "ease", action)?,
                ) {
                    return Err(self.failure(action, "E_STATE", "tween endpoints changed before apply"));
                }
                self.take_command(action)?;
            }
            "tween.remove" => {
                let layer = self.resolve_layer(action, p.get("layer"))?;
                self.ensure_layer_content_editable(action, layer)?;
                if !self
                    .staging
                    .remove_classic_tween(layer, required_u32(p, "start", action)?)
                {
                    return Err(self.failure(action, "E_STATE", "tween no longer exists"));
                }
                self.take_command(action)?;
            }
            "symbol.convert" => {
                let selected = self.staging.selection.clone();
                self.ensure_nodes_editable(action, &selected)?;
                let symbol_type = parse_symbol_type(required_str(p, "type", action)?, action, self)?;
                let id = self.staging.convert_selection_to_symbol(
                    required_str(p, "name", action)?,
                    symbol_type,
                    4,
                );
                if id.0 == 0 {
                    return Err(self.failure(action, "E_STATE", "symbol conversion selection became stale"));
                }
                self.take_command(action)?;
            }
            "symbol.create" => {
                let symbol_type = parse_symbol_type(
                    optional_str(p, "type", action)?.unwrap_or("graphic"),
                    action,
                    self,
                )?;
                let id = self.staging.new_symbol(
                    optional_str(p, "name", action)?.unwrap_or("Symbol"),
                    symbol_type,
                );
                if id.0 == 0 {
                    return Err(self.failure(action, "E_STATE", "symbol creation failed"));
                }
                self.take_command(action)?;
                self.bind(action, Binding::Symbol(id));
            }
            "symbol.place" => {
                let symbol = self.resolve_symbol(action, required(p, "symbol", action)?)?;
                let id = self.staging.place_symbol(
                    symbol,
                    optional_f64(p, "x", action)?.unwrap_or(0.0),
                    optional_f64(p, "y", action)?.unwrap_or(0.0),
                );
                if id.0 == 0 {
                    return Err(self.failure(action, "E_GUARD", "symbol placement target became invalid"));
                }
                self.take_command(action)?;
                self.bind(action, Binding::Node(id));
            }
            "symbol.rename" => {
                let symbol = self.resolve_symbol(action, required(p, "symbol", action)?)?;
                if !self.staging.rename_symbol(
                    symbol,
                    required_str(p, "name", action)?,
                ) {
                    return Err(self.failure(action, "E_STATE", "symbol rename became invalid"));
                }
                self.take_command(action)?;
            }
            "symbol.delete" => {
                let symbol = self.resolve_symbol(action, required(p, "symbol", action)?)?;
                if !self.staging.delete_symbol(symbol, false) {
                    return Err(self.failure(
                        action,
                        "E_STATE",
                        "symbol is stale or still in use; break-apart is not in the validated schema",
                    ));
                }
                self.take_command(action)?;
            }
            "symbol.swap" | "symbol.setLoop" => {
                let symbol = self.resolve_symbol(action, required(p, "symbol", action)?)?;
                let instance = self
                    .staging
                    .selection
                    .iter()
                    .copied()
                    .find(|id| matches!(self.staging.doc.nodes.get(id), Some(Node::SymbolInstance { .. })))
                    .ok_or_else(|| self.failure(action, "E_REF", "no live selected symbol instance"))?;
                let ok = if action.action == "symbol.swap" {
                    self.staging.swap_instance(instance, symbol)
                } else {
                    let mode = match optional_str(p, "loop", action)?.unwrap_or("loop") {
                        "loop" => LoopMode::Loop,
                        "once" => LoopMode::PlayOnce,
                        "single" => LoopMode::SingleFrame,
                        other => return Err(self.compile_failure(action, format!("invalid loop mode {other}"))),
                    };
                    self.staging.set_instance_loop(
                        instance,
                        mode,
                        optional_u32(p, "firstFrame", action)?.unwrap_or(1),
                    )
                };
                if !ok {
                    return Err(self.failure(action, "E_STATE", "symbol instance state changed"));
                }
                self.take_command(action)?;
            }
            "doc.setSettings" => {
                let patch = SettingsPatch {
                    width: optional_f64(p, "width", action)?,
                    height: optional_f64(p, "height", action)?,
                    fps: optional_u32(p, "fps", action)?,
                    background: optional_string(p, "background", action)?,
                    background_alpha: optional_f64(p, "backgroundAlpha", action)?,
                };
                if !self.staging.set_document_settings(patch) {
                    return Err(self.failure(action, "E_STATE", "document settings are now unchanged"));
                }
                self.take_command(action)?;
            }
            other => {
                return Err(self.failure(
                    action,
                    "E_CAPABILITY",
                    format!("{other} has no A5 engine command compiler"),
                ));
            }
        }
        Ok(self.commands.len() - before)
    }
}

/// Execute an A4 `ValidatedPlan` JSON against the live Session.
///
/// The live Session is never touched until every action has successfully built
/// an existing Command against the staging clone. Therefore any middle/final
/// failure is a complete rollback by construction: no real command ran and no
/// History entry was pushed. Successful mutations enter through exactly one A1
/// `Session::execute_grouped` call.
pub fn execute_validated_plan(session: &mut Session, plan_json: &str, label: &str) -> AiExecutionResult {
    let parsed: ValidatedPlanWire = match serde_json::from_str(plan_json) {
        Ok(plan) => plan,
        Err(_) => return AiExecutionResult::parse_failure("validated plan wire format is invalid"),
    };
    if parsed.actions.is_empty() {
        return AiExecutionResult::parse_failure("validated plan has no actions");
    }
    if parsed.actions.len() > MAX_ACTIONS {
        return AiExecutionResult::parse_failure("validated plan exceeds the 64-action budget");
    }
    for (sequence, action) in parsed.actions.iter().enumerate() {
        if action.index != sequence {
            return AiExecutionResult::parse_failure("validated action indices are not canonical");
        }
    }

    let _clipboard = ClipboardRestore(app_object_clipboard());
    let original_active_layer = session
        .doc
        .scene(session.active_scene)
        .and_then(|scene| scene.layers.get(session.active_layer))
        .map(|layer| layer.id);
    let original_playhead = session.playhead;
    let mut compiler = Compiler::new(session);
    let mut actions: Vec<AiActionExecution> = parsed
        .actions
        .iter()
        .map(|action| AiActionExecution {
            index: action.index,
            id: action.id.clone(),
            action: action.action.clone(),
            status: "pending".into(),
            summary: action.human_text.clone(),
        })
        .collect();

    for action in &parsed.actions {
        match compiler.compile_action(action) {
            Ok(_) => actions[action.index].status = "prepared".into(),
            Err(error) => {
                let had_mutations = !compiler.commands.is_empty();
                for row in actions.iter_mut().take(action.index) {
                    if row.status == "prepared" {
                        row.status = if had_mutations { "rolled-back" } else { "skipped" }.into();
                    }
                }
                actions[action.index].status = "failed".into();
                for row in actions.iter_mut().skip(action.index + 1) {
                    row.status = "skipped".into();
                }
                return AiExecutionResult {
                    ok: false,
                    outcome: if had_mutations { "rolled-back" } else { "failed" }.into(),
                    rolled_back: had_mutations,
                    mutation_count: 0,
                    actions,
                    bindings: compiler
                        .bindings
                        .into_iter()
                        .map(|(alias, binding)| binding.public(alias))
                        .collect(),
                    error: Some(error),
                };
            }
        }
    }

    let mutation_count = compiler.commands.len();
    let final_selection = compiler.staging.selection.clone();
    let next_id = compiler.staging.doc.next_id;
    let bindings: Vec<AiEntityBinding> = compiler
        .bindings
        .iter()
        .map(|(alias, binding)| binding.public(alias.clone()))
        .collect();

    if mutation_count > 0 {
        // Node ids are allocated while existing Session facades build commands
        // on the staging clone. Like normal Session allocation, next_id is
        // monotonic and intentionally not reverted by undo.
        session.doc.next_id = session.doc.next_id.max(next_id);
        if !session.execute_grouped(label, compiler.commands) {
            return AiExecutionResult::parse_failure("engine refused a non-empty grouped transaction");
        }
        session.playhead = original_playhead;
        if let Some(id) = original_active_layer {
            if let Some(index) = session
                .doc
                .scene(session.active_scene)
                .and_then(|scene| scene.layers.iter().position(|layer| layer.id == id))
            {
                session.active_layer = index;
            } else {
                let len = session
                    .doc
                    .scene(session.active_scene)
                    .map(|scene| scene.layers.len())
                    .unwrap_or(1);
                session.active_layer = session.active_layer.min(len.saturating_sub(1));
            }
        }
        session.set_selection(final_selection);
        session
            .history
            .seal_last_post_selection(session.selection.clone());
    } else {
        // Read/selection-only plans are view state and correctly create no undo
        // entry. This preserves the editor's existing selection semantics.
        session.set_selection(final_selection);
    }

    for row in &mut actions {
        row.status = "applied".into();
    }
    AiExecutionResult {
        ok: true,
        outcome: "applied".into(),
        rolled_back: false,
        mutation_count,
        actions,
        bindings,
        error: None,
    }
}

fn ref_alias(value: &Value) -> Option<&str> {
    value
        .as_object()?
        .get("ref")?
        .as_str()
}

fn required<'a>(
    params: &'a Map<String, Value>,
    key: &str,
    action: &ValidatedActionWire,
) -> Result<&'a Value, AiExecutionError> {
    params.get(key).ok_or_else(|| AiExecutionError {
        code: "E_COMPILE".into(),
        stage: 12,
        message: format!("validated action is missing {key}"),
        action_index: Some(action.index),
        action_id: action.id.clone(),
    })
}

fn required_str<'a>(
    params: &'a Map<String, Value>,
    key: &str,
    action: &ValidatedActionWire,
) -> Result<&'a str, AiExecutionError> {
    required(params, key, action)?.as_str().ok_or_else(|| compile_type(action, key))
}

fn optional_str<'a>(
    params: &'a Map<String, Value>,
    key: &str,
    action: &ValidatedActionWire,
) -> Result<Option<&'a str>, AiExecutionError> {
    params
        .get(key)
        .map(|value| value.as_str().ok_or_else(|| compile_type(action, key)))
        .transpose()
}

fn optional_string(
    params: &Map<String, Value>,
    key: &str,
    action: &ValidatedActionWire,
) -> Result<Option<String>, AiExecutionError> {
    Ok(optional_str(params, key, action)?.map(str::to_string))
}

fn required_f64(
    params: &Map<String, Value>,
    key: &str,
    action: &ValidatedActionWire,
) -> Result<f64, AiExecutionError> {
    required(params, key, action)?.as_f64().ok_or_else(|| compile_type(action, key))
}

fn optional_f64(
    params: &Map<String, Value>,
    key: &str,
    action: &ValidatedActionWire,
) -> Result<Option<f64>, AiExecutionError> {
    params
        .get(key)
        .map(|value| value.as_f64().ok_or_else(|| compile_type(action, key)))
        .transpose()
}

fn required_u32(
    params: &Map<String, Value>,
    key: &str,
    action: &ValidatedActionWire,
) -> Result<u32, AiExecutionError> {
    required(params, key, action)?
        .as_u64()
        .and_then(|value| u32::try_from(value).ok())
        .ok_or_else(|| compile_type(action, key))
}

fn optional_u32(
    params: &Map<String, Value>,
    key: &str,
    action: &ValidatedActionWire,
) -> Result<Option<u32>, AiExecutionError> {
    params
        .get(key)
        .map(|value| {
            value
                .as_u64()
                .and_then(|value| u32::try_from(value).ok())
                .ok_or_else(|| compile_type(action, key))
        })
        .transpose()
}

fn required_usize(
    params: &Map<String, Value>,
    key: &str,
    action: &ValidatedActionWire,
) -> Result<usize, AiExecutionError> {
    required(params, key, action)?
        .as_u64()
        .and_then(|value| usize::try_from(value).ok())
        .ok_or_else(|| compile_type(action, key))
}

fn optional_usize(
    params: &Map<String, Value>,
    key: &str,
    action: &ValidatedActionWire,
) -> Result<Option<usize>, AiExecutionError> {
    params
        .get(key)
        .map(|value| {
            value
                .as_u64()
                .and_then(|value| usize::try_from(value).ok())
                .ok_or_else(|| compile_type(action, key))
        })
        .transpose()
}

fn required_bool(
    params: &Map<String, Value>,
    key: &str,
    action: &ValidatedActionWire,
) -> Result<bool, AiExecutionError> {
    required(params, key, action)?.as_bool().ok_or_else(|| compile_type(action, key))
}

fn optional_bool(
    params: &Map<String, Value>,
    key: &str,
    action: &ValidatedActionWire,
) -> Result<Option<bool>, AiExecutionError> {
    params
        .get(key)
        .map(|value| value.as_bool().ok_or_else(|| compile_type(action, key)))
        .transpose()
}

fn optional_color(
    params: &Map<String, Value>,
    key: &str,
    action: &ValidatedActionWire,
) -> Result<Option<String>, AiExecutionError> {
    match params.get(key) {
        None | Some(Value::Null) => Ok(None),
        Some(Value::String(value)) if value == "none" => Ok(None),
        Some(Value::String(value)) => Ok(Some(value.clone())),
        Some(_) => Err(compile_type(action, key)),
    }
}

fn compile_type(action: &ValidatedActionWire, key: &str) -> AiExecutionError {
    AiExecutionError {
        code: "E_COMPILE".into(),
        stage: 12,
        message: format!("validated param {key} has the wrong wire type"),
        action_index: Some(action.index),
        action_id: action.id.clone(),
    }
}

fn parse_symbol_type(
    value: &str,
    action: &ValidatedActionWire,
    compiler: &Compiler,
) -> Result<SymbolType, AiExecutionError> {
    match value {
        "graphic" => Ok(SymbolType::Graphic),
        "movieclip" => Ok(SymbolType::MovieClip),
        "button" => Ok(SymbolType::Button),
        other => Err(compiler.compile_failure(action, format!("invalid symbol type {other}"))),
    }
}
