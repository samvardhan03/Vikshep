"""
well/fixture.py — synthetic Well HDF5 fixture for tests.

Builds a tiny HDF5 file matching the Well schema:
  - 2 trajectories, 4 steps, 32x32 grid
  - one t0 (scalar pressure) + one t1 (2-D velocity) field
  - periodic x-axis + wall y-axis
  - cartesian grid_type

Used by the Well adapter test suite.  No network access.
"""

from __future__ import annotations

from pathlib import Path

import h5py
import numpy as np


FIXTURE_ATTRS = {
    "dataset_name": "synthetic_cartesian_2d",
    "grid_type":    "cartesian",
    "n_spatial_dims": 2,
    "n_trajectories": 2,
}

FIXTURE_FIELDS = {
    "t0_fields": {
        "pressure": {
            "shape": (2, 4, 32, 32),
            "attrs": {"sample_varying": True, "time_varying": True},
        },
    },
    "t1_fields": {
        "velocity": {
            "shape": (2, 4, 32, 32, 2),
            "attrs": {"sample_varying": True, "time_varying": True},
        },
    },
}

FIXTURE_BCS = {
    "x_boundary": {"bc_type": "periodic"},
    "y_boundary": {"bc_type": "wall"},
}


def make_fixture_hdf5(path: str | Path, seed: int = 0) -> Path:
    """Write a synthetic Well HDF5 fixture at path and return the path."""
    path = Path(path)
    rng  = np.random.default_rng(seed)

    with h5py.File(path, "w") as f:
        # Top-level attrs
        for k, v in FIXTURE_ATTRS.items():
            f.attrs[k] = v

        # Boundary conditions
        bc_grp = f.create_group("boundary_conditions")
        for dim_name, bc_attrs in FIXTURE_BCS.items():
            dim_grp = bc_grp.create_group(dim_name)
            for k, v in bc_attrs.items():
                dim_grp.attrs[k] = v

        # Fields
        for grp_name, fields in FIXTURE_FIELDS.items():
            fgrp = f.create_group(grp_name)
            for fname, meta in fields.items():
                arr = rng.normal(0, 1, meta["shape"]).astype(np.float32)
                ds  = fgrp.create_dataset(fname, data=arr)
                for k, v in meta["attrs"].items():
                    ds.attrs[k] = v

    return path
