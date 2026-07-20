"""
g4/aggregates.py — per-event, per-layer derived quantities.

These are exactly the quantities physicists compute by hand in pandas after
a Geant4 run: hit multiplicity, energy summaries, angular summaries, momentum
summaries.  Every channel has a physical, self-documenting name so the
downstream manifest is human-readable without a codebook.
"""

from __future__ import annotations

import numpy as np


def compute_aggregates(
    hits: list[dict],
    profile_name: str,
    has_energy: bool,
) -> dict[str, float | int]:
    """Compute per-event scalar aggregates from a list of hit dicts.

    Parameters
    ----------
    hits         : list of hit records for one event; each dict has keys
                   layer (int), phi (float), theta (float), momentum (float),
                   energy (float, optional).
    profile_name : name tag included in aggregate channel names.
    has_energy   : whether the CSV carries an energy column.

    Returns
    -------
    dict mapping channel_name -> scalar value.
    """
    if not hits:
        return {}

    layers = sorted({h["layer"] for h in hits})
    aggs: dict[str, float | int] = {}

    # Global event-level aggregates
    aggs["n_hits_total"] = len(hits)
    aggs["p_mean_global"] = float(np.mean([h["momentum"] for h in hits]))
    aggs["p_sum_global"]  = float(np.sum([h["momentum"] for h in hits]))

    if has_energy:
        energies = [h.get("energy", 0.0) for h in hits]
        aggs["e_sum_global"]  = float(np.sum(energies))
        aggs["e_mean_global"] = float(np.mean(energies))

    # Per-layer aggregates
    for layer in layers:
        layer_hits = [h for h in hits if h["layer"] == layer]
        phis     = np.array([h["phi"]      for h in layer_hits], dtype=np.float64)
        thetas   = np.array([h["theta"]    for h in layer_hits], dtype=np.float64)
        momenta  = np.array([h["momentum"] for h in layer_hits], dtype=np.float64)
        prefix = f"layer{layer}"

        aggs[f"{prefix}_n_hits"]   = len(layer_hits)
        aggs[f"{prefix}_phi_mean"] = float(np.mean(phis))
        aggs[f"{prefix}_phi_std"]  = float(np.std(phis))
        aggs[f"{prefix}_theta_mean"] = float(np.mean(thetas))
        aggs[f"{prefix}_theta_std"]  = float(np.std(thetas))
        aggs[f"{prefix}_p_mean"]   = float(np.mean(momenta))
        aggs[f"{prefix}_p_sum"]    = float(np.sum(momenta))

        if has_energy:
            energies_layer = np.array(
                [h.get("energy", 0.0) for h in layer_hits], dtype=np.float64
            )
            aggs[f"{prefix}_e_sum"]  = float(np.sum(energies_layer))
            aggs[f"{prefix}_e_mean"] = float(np.mean(energies_layer))

    return aggs
