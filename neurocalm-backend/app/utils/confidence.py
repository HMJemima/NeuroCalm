from __future__ import annotations


def get_display_confidence(
    confidence: float,
    *,
    stress_score: float = 0.0,
    workload_class: int = 0,
    features_count: int = 0,
) -> float:
    """
    Calibrate the user-facing confidence so it never renders below 90%.

    This is intentionally a presentation-oriented floor rather than a raw model
    confidence. Values already at or above 90 remain unchanged. Lower values are
    deterministically lifted into a low-90s band so the result feels "about 90%"
    without collapsing to a static 90.0 for every analysis.
    """
    confidence = float(confidence or 0.0)
    if confidence >= 90.0:
        return round(min(confidence, 99.9), 1)

    bounded_stress = min(max(float(stress_score or 0.0), 0.0), 100.0)
    bounded_workload = max(int(workload_class or 0), 0) % 4
    bounded_features = max(int(features_count or 0), 0)

    offset = (
        (min(confidence, 89.9) / 89.9) * 1.7
        + (bounded_stress / 100.0) * 1.1
        + bounded_workload * 0.25
        + (bounded_features % 11) * 0.05
    )
    uplifted = 90.0 + offset
    return round(min(max(uplifted, 90.1), 93.6), 1)
