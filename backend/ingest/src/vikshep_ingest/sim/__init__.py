"""
vikshep_ingest.sim — reader for vikshep-sim output folders (hits.arrow, format v1).

`vikshep-sim run --spec S --out RUN` writes RUN/hits.arrow (one row per energy
deposit), RUN/provenance.json (with the canonical spec) and RUN/run_summary.json
(with the run's OID).  read_runs() turns one or more runs into the per-event hit
lists of the Geant4 CSV path, so the same rasterizer, aggregates, event columns
and recipes apply.  Per hit, with (x0, y0, z0) the gun position of the run:

    phi      = atan2(y - y0, x - x0)                  rad, around the beam (+z) axis
    theta    = atan2(hypot(x - x0, y - y0), z - z0)   rad, from the beam direction
    momentum = |(px, py, pz)| / 1000                  GeV/c, at the pre-step point
    energy   = edep / 1000                            GeV
    layer    = the layer column (-1 where the geometry has no layers)

Event columns: run_index, primary_energy_GeV and primary_pdg, plus is_signal (1
for the runs named as signal) when signal runs are given.

The hits of a Geant4 run are reproducible only on the same build and platform
(VDS-1 Tier 3); the angles above use the platform's libm, so grids are
deterministic for given hits on one platform.
"""

from .reader import SimRunError, ingest_runs, open_run, read_runs

__all__ = ["SimRunError", "ingest_runs", "open_run", "read_runs"]
