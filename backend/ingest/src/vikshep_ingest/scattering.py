"""
vikshep_ingest/scattering.py — scattering feature extraction for CLI recipes.

When vikshep_compute is importable (pip install -e "backend/ingest[scattering]"),
loads event grids by OID from shared memory and runs the 2-D scattering
transform on the assembled batch.  Falls back to re-rasterization from the
source CSV if shm segments are gone, using the source_path recorded in the
manifest during ingest.

Shared-memory lifecycle
-----------------------
vikshep-ingest writes each 64×64 float32 grid into a POSIX shared-memory
segment named by its OID (28-char SHA3-256 hex).  The segment lives until the
ingest process closes it.  If you call vikshep-recipe in the same shell
invocation, the segments are typically still live; in a subsequent shell
session they may be gone.  The recipe will then re-read the source CSV and
re-rasterize — this is deterministic (same CSV → same grids → same OIDs) but
takes an additional pass over the file.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np

try:
    import vikshep_compute as vc
    _SCATTER_AVAILABLE = True
except ImportError:
    _SCATTER_AVAILABLE = False


def scatter_available() -> bool:
    return _SCATTER_AVAILABLE


# Default scattering configuration for the G4 64×64 (phi × theta) grid.
#
# Justification for (J, Q, L):
#   J = 3 — three scale levels; 2^J = 8 ≪ 64/2, so all filters fit within
#            the grid without boundary-regime artefacts.
#   Q = 1 — one wavelet per octave; physics histograms have broad spectral
#            features, so scale resolution at Q > 1 gives diminishing returns.
#   L = 8 — eight orientations; resolves azimuthal anisotropy in (phi, theta)
#            detector images with 22.5° angular step.
#
# Pad policy matches rasterize.py:
#   phi   → "circular"  (periodic axis, [-π, π] wrap)
#   theta → "zero_pad"  (bounded angle, [0, π])
SCATTER_CFG_G4: dict = {
    "J":     3,
    "Q":     1,
    "L":     8,
    "pad":   ["circular", "zero_pad"],
    "shape": [64, 64],
    "dim":   2,
}


def _shm_grid(oid: str, grid_shape: tuple[int, int]) -> np.ndarray | None:
    """Try to read a float32 grid from the named shared-memory segment."""
    import multiprocessing.shared_memory as shm_module
    nbytes = int(np.prod(grid_shape)) * 4  # float32
    try:
        sm = shm_module.SharedMemory(name=oid, create=False)
        arr = np.frombuffer(sm.buf[:nbytes], dtype=np.float32).copy().reshape(grid_shape)
        sm.close()
        return arr
    except FileNotFoundError:
        return None


def _rasterize_from_csv(manifest: dict) -> list[np.ndarray]:
    """Re-rasterize all events from the source CSV recorded in the manifest."""
    source_path = manifest.get("source_path")
    if not source_path or not Path(source_path).exists():
        raise RuntimeError(
            "Shared-memory segments are gone and no readable source_path is "
            "recorded in the manifest.  Re-run `vikshep-ingest g4 <csv>` to "
            "rebuild the segments before calling the scattering recipe."
        )
    from vikshep_ingest.g4.schema import get_profile
    from vikshep_ingest.g4.adapter import G4Adapter
    profile_name = manifest.get("profile", "komal_v1")
    grid_cfg = manifest.get("grid", {})
    grid_shape = tuple(grid_cfg.get("shape", [64, 64]))
    profile = get_profile(profile_name)
    with G4Adapter(profile, grid_shape=grid_shape) as adapter:
        m = adapter.ingest(path=source_path)
    return [
        _shm_grid(oid, grid_shape) or np.zeros(grid_shape, dtype=np.float32)
        for oid in m["grid_oids"]
    ]


def load_grids(manifest: dict) -> np.ndarray:
    """Return a float32 batch array of shape (N, H, W) from the manifest.

    Tries shared memory first; re-rasterizes from source_path if any segment
    is missing.
    """
    grid_cfg = manifest.get("grid", {})
    grid_shape: tuple[int, int] = tuple(grid_cfg.get("shape", [64, 64]))
    oids: list[str] = manifest.get("grid_oids", [])
    if not oids:
        raise RuntimeError("Manifest contains no grid_oids.")

    grids: list[np.ndarray] = []
    missing = False
    for oid in oids:
        g = _shm_grid(oid, grid_shape)
        if g is None:
            missing = True
            break
        grids.append(g)

    if missing:
        grids = _rasterize_from_csv(manifest)

    return np.stack(grids, axis=0)  # (N, H, W) float32


def extract_scattering_features(
    manifest: dict,
    cfg: dict | None = None,
) -> tuple[np.ndarray, str, str]:
    """Return (features, coeffs_oid, prov_json) for all events in the manifest.

    features : float64 array (N, F) — log-mean scattering fingerprint
               concatenated with spatially-averaged r2 ratios.
    coeffs_oid : 28-char hex OID of the scattering coefficient batch.
    prov_json  : JSON string of the VDS-1 provenance manifest.
    """
    if not _SCATTER_AVAILABLE:
        raise ImportError(
            "vikshep_compute is not installed.  "
            "pip install maturin && pip install -e \"backend/ingest[scattering]\""
        )

    scatter_cfg = cfg or SCATTER_CFG_G4
    batch = load_grids(manifest)   # (N, H, W) float32
    N = batch.shape[0]

    coeffs, coeffs_oid = vc.scatter(batch, scatter_cfg)
    fp, _ = vc.fingerprint(coeffs, scatter_cfg)          # float64 (N, n_paths)
    r2_arr, _ = vc.r2(coeffs, scatter_cfg)               # float32 (N, n_pairs, *out)
    r2_mean = r2_arr.mean(axis=tuple(range(2, r2_arr.ndim))).astype(np.float64)

    features = np.concatenate([fp, r2_mean], axis=1)     # (N, n_paths + n_pairs)

    prov_json, _ = vc.provenance_manifest(batch, scatter_cfg, coeffs_oid)

    return features, coeffs_oid, prov_json
