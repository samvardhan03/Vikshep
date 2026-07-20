"""
tests/test_well_adapter.py — Well adapter test suite.

Uses only the synthetic HDF5 fixture (no network, no the-well package).
"""

from __future__ import annotations

import tempfile
from pathlib import Path

import numpy as np
import pytest

from vikshep_ingest.well.fixture import make_fixture_hdf5, FIXTURE_ATTRS, FIXTURE_BCS
from vikshep_ingest.well.adapter import WellAdapter
from vikshep_ingest.well.pad_policy import UnsupportedGridError
from vikshep_ingest.pad_policy import PadMode


@pytest.fixture()
def fixture_hdf5(tmp_path: Path) -> Path:
    return make_fixture_hdf5(tmp_path / "synthetic.h5")


# ---------------------------------------------------------------------------
# Manifest structure
# ---------------------------------------------------------------------------

class TestManifestFields:
    def test_dataset_name(self, fixture_hdf5: Path) -> None:
        with WellAdapter() as wa:
            m = wa.ingest(fixture_hdf5)
        assert m["dataset"] == FIXTURE_ATTRS["dataset_name"]

    def test_grid_type(self, fixture_hdf5: Path) -> None:
        with WellAdapter() as wa:
            m = wa.ingest(fixture_hdf5)
        assert m["grid_type"] == "cartesian"

    def test_n_spatial_dims(self, fixture_hdf5: Path) -> None:
        with WellAdapter() as wa:
            m = wa.ingest(fixture_hdf5)
        assert m["n_spatial_dims"] == 2

    def test_traj_range(self, fixture_hdf5: Path) -> None:
        with WellAdapter() as wa:
            m = wa.ingest(fixture_hdf5)
        assert m["traj_range"] == [0, 2]

    def test_shm_oids_count_matches_trajectories(self, fixture_hdf5: Path) -> None:
        with WellAdapter() as wa:
            m = wa.ingest(fixture_hdf5)
        assert len(m["shm_oids"]) == 2

    def test_channel_names_present(self, fixture_hdf5: Path) -> None:
        with WellAdapter() as wa:
            m = wa.ingest(fixture_hdf5)
        assert len(m["channel_names"]) >= 1


# ---------------------------------------------------------------------------
# 28-char OID enforcement
# ---------------------------------------------------------------------------

class TestOIDLength:
    def test_all_oids_are_28_chars(self, fixture_hdf5: Path) -> None:
        with WellAdapter() as wa:
            m = wa.ingest(fixture_hdf5)
        for oid in m["shm_oids"]:
            assert len(oid) == 28, f"OID {oid!r} is {len(oid)} chars, expected 28"

    def test_oids_are_hex(self, fixture_hdf5: Path) -> None:
        with WellAdapter() as wa:
            m = wa.ingest(fixture_hdf5)
        for oid in m["shm_oids"]:
            int(oid, 16)  # raises ValueError if not valid hex


# ---------------------------------------------------------------------------
# Pad-policy mapping
# ---------------------------------------------------------------------------

class TestPadPolicy:
    def test_x_boundary_periodic_maps_to_circular(self, fixture_hdf5: Path) -> None:
        with WellAdapter() as wa:
            m = wa.ingest(fixture_hdf5)
        assert m["pad_policy"]["x_boundary"] == PadMode.Circular.value

    def test_y_boundary_wall_maps_to_zeropad(self, fixture_hdf5: Path) -> None:
        with WellAdapter() as wa:
            m = wa.ingest(fixture_hdf5)
        assert m["pad_policy"]["y_boundary"] == PadMode.ZeroPad.value

    def test_bc_per_axis_matches_fixture(self, fixture_hdf5: Path) -> None:
        with WellAdapter() as wa:
            m = wa.ingest(fixture_hdf5)
        for dim, bc_attrs in FIXTURE_BCS.items():
            assert m["bc_per_axis"][dim] == bc_attrs["bc_type"]


# ---------------------------------------------------------------------------
# Invariant channel shapes
# ---------------------------------------------------------------------------

class TestInvariantChannels:
    def test_pressure_channel_present(self, fixture_hdf5: Path) -> None:
        with WellAdapter() as wa:
            m = wa.ingest(fixture_hdf5)
        # t0 field — passthrough as scalar
        assert "pressure" in m["channel_names"]

    def test_velocity_invariants_present(self, fixture_hdf5: Path) -> None:
        with WellAdapter() as wa:
            m = wa.ingest(fixture_hdf5)
        # t1 field — magnitude at minimum
        assert any("velocity_magnitude" in ch for ch in m["channel_names"])

    def test_no_raw_vector_components_in_channels(self, fixture_hdf5: Path) -> None:
        with WellAdapter() as wa:
            m = wa.ingest(fixture_hdf5)
        # Components-as-channels FORBIDDEN without covariance_unsafe
        for ch in m["channel_names"]:
            assert not ch.endswith(("_x", "_y", "_z", "_0", "_1", "_2")), (
                f"Raw component channel {ch!r} leaked into manifest "
                "(covariance_unsafe=False)"
            )

    def test_rank_map_populated(self, fixture_hdf5: Path) -> None:
        with WellAdapter() as wa:
            m = wa.ingest(fixture_hdf5)
        assert isinstance(m["rank_map"], dict)
        assert len(m["rank_map"]) >= 1


# ---------------------------------------------------------------------------
# Spherical grid raises UnsupportedGridError
# ---------------------------------------------------------------------------

class TestSphericalGridRejection:
    def test_spherical_raises(self, tmp_path: Path) -> None:
        import h5py
        spherical_path = tmp_path / "spherical.h5"
        with h5py.File(spherical_path, "w") as f:
            f.attrs["grid_type"] = "spherical"
            f.attrs["n_spatial_dims"] = 2
            f.attrs["n_trajectories"] = 1
            f.attrs["dataset_name"] = "test_spherical"

        with WellAdapter() as wa:
            with pytest.raises(UnsupportedGridError):
                wa.ingest(spherical_path)


# ---------------------------------------------------------------------------
# Trajectory slicing
# ---------------------------------------------------------------------------

class TestTrajectorySlicing:
    def test_single_trajectory_slice(self, fixture_hdf5: Path) -> None:
        with WellAdapter() as wa:
            m = wa.ingest(fixture_hdf5, traj_start=0, traj_end=1)
        assert len(m["shm_oids"]) == 1
        assert m["traj_range"] == [0, 1]

    def test_empty_traj_range_raises(self, fixture_hdf5: Path) -> None:
        with WellAdapter() as wa:
            with pytest.raises(ValueError, match="Empty trajectory range"):
                wa.ingest(fixture_hdf5, traj_start=5, traj_end=6)

    def test_step_slicing(self, fixture_hdf5: Path) -> None:
        with WellAdapter() as wa:
            m = wa.ingest(fixture_hdf5, step_start=1, step_end=3)
        # Should still produce OIDs for both trajectories
        assert len(m["shm_oids"]) == 2
        assert m["step_range"] == [1, 3]


# ---------------------------------------------------------------------------
# Context-manager cleanup
# ---------------------------------------------------------------------------

class TestContextManager:
    def test_close_releases_shm(self, fixture_hdf5: Path) -> None:
        wa = WellAdapter()
        m = wa.ingest(fixture_hdf5)
        assert len(wa._shm_refs) > 0
        wa.close()
        assert len(wa._shm_refs) == 0

    def test_double_close_is_safe(self, fixture_hdf5: Path) -> None:
        wa = WellAdapter()
        wa.ingest(fixture_hdf5)
        wa.close()
        wa.close()  # must not raise
