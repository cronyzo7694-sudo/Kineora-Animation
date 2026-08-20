//! Easing engine (Part 09 §9.4, MOD-EASING). Pure, deterministic functions —
//! the interpolation parameter `t ∈ [0,1]` is remapped to `t' ∈ [0,1]` before
//! `value = lerp(v0, v1, t')` (Part 08 §8.2).

/// Clamp the interpolation parameter to [0,1].
pub fn clamp01(t: f64) -> f64 {
    t.clamp(0.0, 1.0)
}

/// Classic/shape tween ease slider (−100..+100 → quadratic in/out, Part 09.4.3):
/// 0 = linear; positive = ease-OUT (fast start, slow end); negative = ease-IN
/// (slow start, fast end). Strength maps to a quadratic exponent 1..2.
pub fn ease_classic(ease: f64, t: f64) -> f64 {
    let t = clamp01(t);
    if ease.abs() < 1e-9 {
        return t;
    }
    if ease > 0.0 {
        let k = 1.0 + ease / 100.0; // 1..2
        1.0 - (1.0 - t).powf(k)
    } else {
        let k = 1.0 + (-ease) / 100.0; // 1..2
        t.powf(k)
    }
}

/// Easing families (Part 09.4.2 — the standard Penner curves).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum EaseFn {
    Linear,
    Quad,
    Cubic,
    Sine,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum EaseMode {
    In,
    Out,
    InOut,
}

/// Penner easing (Part 09.4.2). Linear/Quad/Cubic/Sine seed the engine; the
/// remaining families (expo/circ/back/elastic/bounce/steps) grow with motion
/// tween per the M2 tween checkpoint.
pub fn ease_penner(f: EaseFn, m: EaseMode, t: f64) -> f64 {
    let t = clamp01(t);
    match (f, m) {
        (EaseFn::Linear, _) => t,
        (EaseFn::Quad, EaseMode::In) => t * t,
        (EaseFn::Quad, EaseMode::Out) => 1.0 - (1.0 - t) * (1.0 - t),
        (EaseFn::Quad, EaseMode::InOut) => {
            if t < 0.5 {
                2.0 * t * t
            } else {
                1.0 - (-2.0 * t + 2.0).powi(2) / 2.0
            }
        }
        (EaseFn::Cubic, EaseMode::In) => t.powi(3),
        (EaseFn::Cubic, EaseMode::Out) => 1.0 - (1.0 - t).powi(3),
        (EaseFn::Cubic, EaseMode::InOut) => {
            if t < 0.5 {
                4.0 * t.powi(3)
            } else {
                1.0 - (-2.0 * t + 2.0).powi(3) / 2.0
            }
        }
        (EaseFn::Sine, EaseMode::In) => 1.0 - (t * std::f64::consts::FRAC_PI_2).cos(),
        (EaseFn::Sine, EaseMode::Out) => (t * std::f64::consts::FRAC_PI_2).sin(),
        (EaseFn::Sine, EaseMode::InOut) => -((std::f64::consts::PI * t).cos() - 1.0) / 2.0,
    }
}
