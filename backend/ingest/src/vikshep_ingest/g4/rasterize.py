"""
g4/rasterize.py — per-event hit point cloud → 2-D grid for the scattering engine.

Default detector-native grid: phi (periodic axis, Circular pad) × theta (open
axis, ZeroPad).  Grid resolution is configurable; the default is chosen to
cover the range of each axis in the event set while keeping grids square.

The shared pad_policy module (vikshep_ingest.pad_policy) is the single source
of truth for the Circular / ZeroPad assignment.
"""

from __future__ import annotations

import numpy as np

from vikshep_ingest.pad_policy import PadMode, bc_to_pad


DEFAULT_GRID = (64, 64)


def rasterize_event(
    hits: list[dict],
    phi_range:   tuple[float, float],
    theta_range: tuple[float, float],
    grid_shape:  tuple[int, int] = DEFAULT_GRID,
    has_energy:  bool = False,
) -> np.ndarray:
    """Bin one event's hits onto a (H, W) grid.

    Returns float32 array of shape (H, W) with energy (if present) or hit
    count as the channel value.
    """
    H, W = grid_shape
    phi_lo, phi_hi     = phi_range
    theta_lo, theta_hi = theta_range

    img = np.zeros((H, W), dtype=np.float32)

    for h in hits:
        phi_norm   = (h["phi"]   - phi_lo)   / max(phi_hi   - phi_lo,   1e-8)
        theta_norm = (h["theta"] - theta_lo) / max(theta_hi - theta_lo, 1e-8)

        col = int(np.clip(phi_norm   * W, 0, W - 1))
        row = int(np.clip(theta_norm * H, 0, H - 1))

        value = h.get("energy", 1.0) if has_energy else 1.0
        img[row, col] += value

    return img


def compute_ranges(
    all_hits: list[list[dict]],
) -> tuple[tuple[float, float], tuple[float, float]]:
    """Compute (phi_range, theta_range) across all events."""
    phis   = [h["phi"]   for event in all_hits for h in event]
    thetas = [h["theta"] for event in all_hits for h in event]

    if not phis:
        return (0.0, 1.0), (0.0, 1.0)

    phi_range   = (float(np.min(phis)),   float(np.max(phis)))
    theta_range = (float(np.min(thetas)), float(np.max(thetas)))

    # Pad by 5% to avoid edge clipping
    def _pad(lo: float, hi: float) -> tuple[float, float]:
        span = max(hi - lo, 1e-6)
        return lo - 0.05 * span, hi + 0.05 * span

    return _pad(*phi_range), _pad(*theta_range)


def pad_policy_for_g4() -> dict[str, PadMode]:
    """Return the detector-native pad-policy assignment for the G4 grid axes.

    phi   → periodic → Circular
    theta → open (bounded angle) → ZeroPad
    """
    return {
        "phi":   bc_to_pad("periodic"),
        "theta": bc_to_pad("open"),
    }
