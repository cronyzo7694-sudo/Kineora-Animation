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

/// Easing families (Part 09.4.2 — the standard Penner curves; eng 08
/// REQ-TWN-004 built-in list: linear · quad · cubic · quart · quint · sine ·
/// expo · circ · back · elastic · bounce, each In/Out/InOut, plus steps(n)).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum EaseFn {
    Linear,
    Quad,
    Cubic,
    Quart,
    Quint,
    Sine,
    Expo,
    Circ,
    Back,
    Elastic,
    Bounce,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum EaseMode {
    In,
    Out,
    InOut,
}

/// Penner easing (Part 09.4.2; eng 08 REQ-TWN-004). Complete built-in set —
/// equations are the standard Penner definitions (industry-canonical; the
/// Blueprint cites them by name, so no product decision is involved).
/// All functions map t∈[0,1] → t'∈[0,1] with f(0)=0 and f(1)=1 exactly
/// (Back/Elastic overshoot INSIDE the interval by design — endpoints hold).
pub fn ease_penner(f: EaseFn, m: EaseMode, t: f64) -> f64 {
    let t = clamp01(t);
    // Exact endpoints for every family (avoids float drift in expo/elastic).
    if t == 0.0 {
        return 0.0;
    }
    if t == 1.0 {
        return 1.0;
    }
    match m {
        EaseMode::In => ease_in(f, t),
        EaseMode::Out => 1.0 - ease_in(f, 1.0 - t),
        EaseMode::InOut => {
            if t < 0.5 {
                ease_in(f, 2.0 * t) / 2.0
            } else {
                1.0 - ease_in(f, 2.0 * (1.0 - t)) / 2.0
            }
        }
    }
}

/// The In form of each Penner family (Out/InOut derive by reflection —
/// the standard construction, keeping the three modes exactly consistent).
fn ease_in(f: EaseFn, t: f64) -> f64 {
    use std::f64::consts::{FRAC_PI_2, PI};
    match f {
        EaseFn::Linear => t,
        EaseFn::Quad => t * t,
        EaseFn::Cubic => t.powi(3),
        EaseFn::Quart => t.powi(4),
        EaseFn::Quint => t.powi(5),
        EaseFn::Sine => 1.0 - (t * FRAC_PI_2).cos(),
        // Penner: 2^(10(t-1)) (t=0 handled by the exact-endpoint guard above)
        EaseFn::Expo => (2.0f64).powf(10.0 * t - 10.0),
        EaseFn::Circ => 1.0 - (1.0 - t * t).sqrt(),
        // Penner back, s = 1.70158 (≈10% overshoot — the canonical constant)
        EaseFn::Back => {
            const C1: f64 = 1.70158;
            const C3: f64 = C1 + 1.0;
            C3 * t.powi(3) - C1 * t * t
        }
        // Penner elastic, period 0.3 (canonical c4 = 2π/3 in the 10-scaled
        // domain: at t=1, −sin(−0.75·2π/3) = −sin(−π/2) = 1 exactly)
        EaseFn::Elastic => {
            const C4: f64 = (2.0 * PI) / 3.0;
            -((2.0f64).powf(10.0 * t - 10.0)) * ((t * 10.0 - 10.75) * C4).sin()
        }
        // Penner bounce (In = 1 − bounceOut(1−t); constants n1=7.5625, d1=2.75)
        EaseFn::Bounce => 1.0 - bounce_out(1.0 - t),
    }
}

/// Penner bounceOut — the canonical piecewise parabola set.
fn bounce_out(t: f64) -> f64 {
    const N1: f64 = 7.5625;
    const D1: f64 = 2.75;
    if t < 1.0 / D1 {
        N1 * t * t
    } else if t < 2.0 / D1 {
        let t = t - 1.5 / D1;
        N1 * t * t + 0.75
    } else if t < 2.5 / D1 {
        let t = t - 2.25 / D1;
        N1 * t * t + 0.9375
    } else {
        let t = t - 2.625 / D1;
        N1 * t * t + 0.984375
    }
}

/// steps(n) easing (eng 08 built-in list): n equal treads, jump-at-end
/// (CSS `steps(n, jump-end)` semantics — the discrete stepper the spec
/// names; t=1 → exactly 1). n = 0 degenerates to linear (refuse-to-divide).
pub fn ease_steps(n: u32, t: f64) -> f64 {
    let t = clamp01(t);
    if n == 0 {
        return t;
    }
    if t >= 1.0 {
        return 1.0;
    }
    (t * n as f64).floor() / n as f64
}

#[cfg(test)]
mod tests {
    use super::*;

    const ALL_FNS: [EaseFn; 11] = [
        EaseFn::Linear,
        EaseFn::Quad,
        EaseFn::Cubic,
        EaseFn::Quart,
        EaseFn::Quint,
        EaseFn::Sine,
        EaseFn::Expo,
        EaseFn::Circ,
        EaseFn::Back,
        EaseFn::Elastic,
        EaseFn::Bounce,
    ];
    const ALL_MODES: [EaseMode; 3] = [EaseMode::In, EaseMode::Out, EaseMode::InOut];

    #[test]
    fn every_family_hits_exact_endpoints() {
        for f in ALL_FNS {
            for m in ALL_MODES {
                assert_eq!(ease_penner(f, m, 0.0), 0.0, "{f:?}/{m:?} at 0");
                assert_eq!(ease_penner(f, m, 1.0), 1.0, "{f:?}/{m:?} at 1");
                // out-of-range input clamps (REQ: t∈[0,1])
                assert_eq!(ease_penner(f, m, -3.0), 0.0);
                assert_eq!(ease_penner(f, m, 7.0), 1.0);
            }
        }
    }

    #[test]
    fn out_is_the_reflection_of_in_and_inout_hits_half() {
        for f in ALL_FNS {
            for i in 1..10 {
                let t = i as f64 / 10.0;
                let a = ease_penner(f, EaseMode::Out, t);
                let b = 1.0 - ease_penner(f, EaseMode::In, 1.0 - t);
                assert!((a - b).abs() < 1e-12, "{f:?} reflection at {t}");
            }
            let mid = ease_penner(f, EaseMode::InOut, 0.5);
            assert!((mid - 0.5).abs() < 1e-12, "{f:?} InOut(0.5) = 0.5, got {mid}");
        }
    }

    #[test]
    fn monotonic_families_are_monotonic() {
        // Back/Elastic/Bounce legitimately overshoot/oscillate — excluded.
        let monotonic = [
            EaseFn::Linear,
            EaseFn::Quad,
            EaseFn::Cubic,
            EaseFn::Quart,
            EaseFn::Quint,
            EaseFn::Sine,
            EaseFn::Expo,
            EaseFn::Circ,
        ];
        for f in monotonic {
            for m in ALL_MODES {
                let mut prev = 0.0;
                for i in 1..=100 {
                    let v = ease_penner(f, m, i as f64 / 100.0);
                    assert!(v >= prev - 1e-12, "{f:?}/{m:?} non-monotonic at {i}");
                    prev = v;
                }
            }
        }
    }

    #[test]
    fn ease_in_slider_matches_req_twn_004_a() {
        // REQ-TWN-004-A: ease-in slider −100 → early frames change LESS per
        // frame than late frames (monotonic velocity increase).
        let mut last_delta = 0.0;
        for i in 1..=10 {
            let a = ease_classic(-100.0, (i - 1) as f64 / 10.0);
            let b = ease_classic(-100.0, i as f64 / 10.0);
            let d = b - a;
            assert!(d >= last_delta - 1e-12, "velocity must not decrease");
            last_delta = d;
        }
    }

    #[test]
    fn back_overshoots_inside_the_interval_only() {
        // canonical s=1.70158 ⇒ In dips below 0 mid-curve, endpoints exact
        let dip = ease_penner(EaseFn::Back, EaseMode::In, 0.3);
        assert!(dip < 0.0, "Back-In dips below 0 (got {dip})");
        let peak = ease_penner(EaseFn::Back, EaseMode::Out, 0.7);
        assert!(peak > 1.0, "Back-Out overshoots 1 (got {peak})");
    }

    #[test]
    fn bounce_out_canonical_landings() {
        // the last parabola tread lands exactly at 1; treads stay in [0,1]
        for i in 0..=100 {
            let v = bounce_out(i as f64 / 100.0);
            assert!((0.0..=1.0 + 1e-12).contains(&v));
        }
        assert!((bounce_out(1.0) - 1.0).abs() < 1e-12);
    }

    #[test]
    fn steps_jump_end_semantics() {
        assert_eq!(ease_steps(4, 0.0), 0.0);
        assert_eq!(ease_steps(4, 0.24), 0.0);
        assert_eq!(ease_steps(4, 0.25), 0.25);
        assert_eq!(ease_steps(4, 0.99), 0.75);
        assert_eq!(ease_steps(4, 1.0), 1.0);
        assert_eq!(ease_steps(0, 0.4), 0.4); // degenerate → linear
    }
}
