use crate::eval::evaluate;
use crate::model::Document;

/// SVG export (slice 1; IMP-DEC-005). Renders ONLY the content pass — authoring
/// overlays are not part of `evaluate`, so they cannot leak (REQ-EXP-002).
///
/// Stage bounds (Part 01 §1.4.1): the exported SVG is exactly the document
/// stage (`settings.width × height`). A `clipPath` clips content to the stage,
/// so pasteboard/off-stage objects are authored but NOT rendered at export —
/// the viewport (zoom/pan) never participates.
pub fn export_svg(doc: &Document, scene: usize, frame: u32) -> String {
    export_svg_scaled(doc, scene, frame, 1.0)
}

/// SVG export with a supersampling scale (Part 28.1 "Scale 1×/2×/4×"): the
/// outer `width`/`height` are multiplied by `scale` while `viewBox` keeps the
/// document coordinate space, so every element (incl. stroke widths) scales
/// uniformly — matching a raster export at the same scale (authoring=export).
/// Non-finite or non-positive scale falls back to 1×.
pub fn export_svg_scaled(doc: &Document, scene: usize, frame: u32, scale: f64) -> String {
    let scale = if scale.is_finite() && scale > 0.0 {
        scale
    } else {
        1.0
    };
    let items = evaluate(doc, scene, frame);
    let w = doc.settings.width;
    let h = doc.settings.height;
    let out_w = w * scale;
    let out_h = h * scale;
    let mut s = format!(
        r#"<svg xmlns="http://www.w3.org/2000/svg" width="{out_w}" height="{out_h}" viewBox="0 0 {w} {h}">"#
    );
    // stage clip (pasteboard exclusion)
    s.push_str(&format!(
        r#"<defs><clipPath id="kineora-stage"><rect width="{w}" height="{h}"/></clipPath></defs><g clip-path="url(#kineora-stage)">"#
    ));
    s.push_str(&format!(
        r#"<rect width="{w}" height="{h}" fill="{}"/>"#,
        doc.settings.background
    ));
    for it in items {
        // Rotation is around the rect CENTER (pivot=center, matches renderer).
        if it.rotation == 0.0 {
            s.push_str(&format!(
                r#"<rect x="{}" y="{}" width="{}" height="{}" fill="{}""#,
                it.x, it.y, it.w, it.h, it.fill
            ));
            if let Some(c) = it.stroke {
                s.push_str(&format!(
                    r#" stroke="{c}" stroke-width="{}""#,
                    it.stroke_width
                ));
            }
            s.push_str("/>");
        } else {
            let cx = it.x + it.w / 2.0;
            let cy = it.y + it.h / 2.0;
            s.push_str(&format!(
                r#"<rect x="{}" y="{}" width="{}" height="{}" fill="{}" transform="rotate({} {} {})""#,
                it.x, it.y, it.w, it.h, it.fill, it.rotation, cx, cy
            ));
            if let Some(c) = it.stroke {
                s.push_str(&format!(
                    r#" stroke="{c}" stroke-width="{}""#,
                    it.stroke_width
                ));
            }
            s.push_str("/>");
        }
    }
    s.push_str("</g></svg>");
    s
}
