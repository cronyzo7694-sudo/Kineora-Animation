use crate::eval::evaluate;
use crate::model::Document;

/// SVG export (slice 1; IMP-DEC-005). Renders ONLY the content pass — authoring
/// overlays are not part of `evaluate`, so they cannot leak (REQ-EXP-002).
pub fn export_svg(doc: &Document, scene: usize, frame: u32) -> String {
    let items = evaluate(doc, scene, frame);
    let w = doc.settings.width;
    let h = doc.settings.height;
    let mut s = format!(
        r#"<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">"#
    );
    s.push_str(&format!(r#"<rect width="{w}" height="{h}" fill="{}"/>"#, doc.settings.background));
    for it in items {
        s.push_str(&format!(
            r#"<rect x="{}" y="{}" width="{}" height="{}" fill="{}""#,
            it.x, it.y, it.w, it.h, it.fill
        ));
        match it.stroke {
            Some(c) => s.push_str(&format!(r#" stroke="{c}" stroke-width="{}""#, it.stroke_width)),
            None => {}
        }
        s.push_str("/>");
    }
    s.push_str("</svg>");
    s
}
