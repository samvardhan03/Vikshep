"""Shared synthetic fixtures for the test suite."""

from __future__ import annotations

import io
import numpy as np


_HEADER_WITH_ENERGY    = "event_id,layer,phi,theta,momentum,energy"
_HEADER_WITHOUT_ENERGY = "event_id,layer,phi,theta,momentum"


def make_synthetic_csv(
    n_events: int = 200,
    n_layers: int = 3,
    seed: int = 0,
    with_energy: bool = True,
    include_extra_col: bool = False,
    n_malformed: int = 0,
) -> str:
    """Generate a synthetic komal_v1 CSV string.

    Parameters
    ----------
    n_events        : number of events (each has hits on every layer).
    n_layers        : layer IDs 1..n_layers.
    seed            : numpy RNG seed.
    with_energy     : include an energy column.
    include_extra_col : add an unrecognised column (tests warning).
    n_malformed     : number of malformed rows to inject.
    """
    rng = np.random.default_rng(seed)
    n_hits_per_event = rng.integers(2, 8, size=n_events)

    if with_energy:
        header = _HEADER_WITH_ENERGY
        if include_extra_col:
            header += ",extra_col"
    else:
        header = _HEADER_WITHOUT_ENERGY

    rows = [header]
    for ev_id in range(1, n_events + 1):
        for _ in range(int(n_hits_per_event[ev_id - 1])):
            layer = int(rng.integers(1, n_layers + 1))
            phi   = float(rng.uniform(-3.14, 3.14))
            theta = float(rng.uniform(0.0, 3.14))
            mom   = float(rng.uniform(1.0, 100.0))
            if with_energy:
                energy = float(rng.uniform(0.1, 10.0))
                row = f"{ev_id},{layer},{phi:.6f},{theta:.6f},{mom:.6f},{energy:.6f}"
                if include_extra_col:
                    row += f",{float(rng.uniform(0, 1)):.4f}"
            else:
                row = f"{ev_id},{layer},{phi:.6f},{theta:.6f},{mom:.6f}"
            rows.append(row)

    # Inject malformed rows at the end
    for _ in range(n_malformed):
        rows.append("BAD,ROW,DATA,NOT,VALID,HERE")

    return "\n".join(rows)
