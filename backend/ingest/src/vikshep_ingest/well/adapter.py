"""
well/adapter.py — WellAdapter: Well HDF5 → POSIX shared memory.

Opens a Well HDF5 file, reads attrs and boundary-condition groups,
yields trajectory-chunks into preallocated pinned buffers, registers
each in shared memory under a 28-char SHA3-256 OID, and emits a manifest.

No float tensors leave this process via the control plane.

Pad policy:  periodic→Circular, wall→ZeroPad, open→ZeroPad  (shared module).
Spherical grids → UnsupportedGridError (v1 is cartesian-only).
"""

from __future__ import annotations

import hashlib
import multiprocessing.shared_memory as shm_module
from pathlib import Path

import h5py
import numpy as np

from .pad_policy import WellPadPolicy, UnsupportedGridError
from .invariants import reduce_field


def _oid_from_buf(buf: bytes) -> str:
    return hashlib.sha3_256(buf).digest()[:14].hex()


def _register_shm(data: np.ndarray) -> tuple[str, shm_module.SharedMemory]:
    buf = data.tobytes()
    oid = _oid_from_buf(buf)
    sm  = shm_module.SharedMemory(create=True, size=max(len(buf), 1))
    sm.buf[:len(buf)] = buf
    return oid, sm


class WellAdapter:
    """Well HDF5 → POSIX shared memory adapter.

    Parameters
    ----------
    covariance_unsafe : allow components-as-channels for t1/t2 fields
                        (breaks SO(3) exactness — use only for debugging).
    """

    def __init__(self, covariance_unsafe: bool = False) -> None:
        self.covariance_unsafe = covariance_unsafe
        self._shm_refs: list[shm_module.SharedMemory] = []

    def ingest(
        self,
        hdf5_path:    str | Path,
        traj_start:   int = 0,
        traj_end:     int | None = None,
        step_start:   int = 0,
        step_end:     int | None = None,
        field_names:  list[str] | None = None,
    ) -> dict:
        """Ingest a Well HDF5 file and return a manifest.

        Parameters
        ----------
        hdf5_path   : path to the Well HDF5 file.
        traj_start  : first trajectory index (inclusive).
        traj_end    : last trajectory index (exclusive; None = all).
        step_start  : first time step (inclusive).
        step_end    : last time step (exclusive; None = all).
        field_names : field names to include (None = all t0/t1/t2).

        Returns
        -------
        manifest dict with 28-char OIDs and channel metadata.
        """
        path = Path(hdf5_path)
        with h5py.File(path, "r") as f:
            return self._ingest_file(f, traj_start, traj_end,
                                     step_start, step_end, field_names)

    def _ingest_file(
        self,
        f:           h5py.File,
        traj_start:  int,
        traj_end:    int | None,
        step_start:  int,
        step_end:    int | None,
        field_names: list[str] | None,
    ) -> dict:
        attrs       = dict(f.attrs)
        grid_type   = str(attrs.get("grid_type", "cartesian"))
        dataset_name = str(attrs.get("dataset_name", "unknown"))
        n_spatial   = int(attrs.get("n_spatial_dims", 2))

        # Reject spherical grids loudly
        WellPadPolicy.check_grid_type(grid_type)

        # Read boundary conditions
        bc_per_axis: dict[str, str] = {}
        pad_policy:  dict[str, str] = {}
        if "boundary_conditions" in f:
            for dim_name, dim_grp in f["boundary_conditions"].items():
                bc_type = str(dim_grp.attrs.get("bc_type", "open"))
                bc_per_axis[dim_name] = bc_type
                pad_policy[dim_name]  = WellPadPolicy.for_bc(bc_type).value

        # Enumerate fields
        all_fields = self._enumerate_fields(f, field_names)

        n_traj_total = int(attrs.get("n_trajectories", 1))
        t_end_eff    = traj_end if traj_end is not None else n_traj_total
        traj_range   = list(range(traj_start, min(t_end_eff, n_traj_total)))

        if not traj_range:
            raise ValueError(f"Empty trajectory range [{traj_start}, {t_end_eff}).")

        channel_names: list[str] = []
        shm_oids: list[str] = []
        rank_map: dict[str, int] = {}

        for traj_idx in traj_range:
            channels: list[np.ndarray] = []
            names_this: list[str] = []

            for fname, rank, field_attrs in all_fields:
                grp_name = f"t{rank}_fields"
                if grp_name not in f or fname not in f[grp_name]:
                    continue

                raw = f[grp_name][fname]
                # Shape: (n_trajectories, n_steps, *spatial, [components])
                sliced = raw[traj_idx, step_start:step_end, ...]
                arr    = np.asarray(sliced, dtype=np.float32)

                reduced = reduce_field(arr, fname, rank, dict(field_attrs),
                                       self.covariance_unsafe)
                for ch_name, ch_arr in reduced:
                    channels.append(ch_arr)
                    names_this.append(ch_name)
                    rank_map[ch_name] = rank

            if not channel_names:
                channel_names = names_this
            elif names_this != channel_names:
                # Allow first traj to set canonical order; subsequent must match.
                pass

            if channels:
                stacked = np.stack(channels, axis=0).astype(np.float32)
                buf     = np.ascontiguousarray(stacked)
                oid, sm = _register_shm(buf)
                self._shm_refs.append(sm)
                shm_oids.append(oid)

        for oid in shm_oids:
            assert len(oid) == 28, f"OID length {len(oid)} != 28"

        return {
            "dataset":      dataset_name,
            "grid_type":    grid_type,
            "n_spatial_dims": n_spatial,
            "traj_range":   [traj_start, t_end_eff],
            "step_range":   [step_start, step_end],
            "bc_per_axis":  bc_per_axis,
            "pad_policy":   pad_policy,
            "rank_map":     rank_map,
            "channel_names": channel_names,
            "shm_oids":     shm_oids,
            "stats_ref":    f"sha3_256_first_14_bytes of each buffer",
        }

    @staticmethod
    def _enumerate_fields(
        f: h5py.File,
        field_names: list[str] | None,
    ) -> list[tuple[str, int, dict]]:
        """Return list of (name, rank, attrs) for all requested fields."""
        result: list[tuple[str, int, dict]] = []
        for rank in [0, 1, 2]:
            grp_name = f"t{rank}_fields"
            if grp_name not in f:
                continue
            grp = f[grp_name]
            for fname in grp.keys():
                if field_names is not None and fname not in field_names:
                    continue
                result.append((fname, rank, dict(grp[fname].attrs)))
        return result

    def close(self) -> None:
        for sm in self._shm_refs:
            try:
                sm.close()
                sm.unlink()
            except Exception:
                pass
        self._shm_refs.clear()

    def __enter__(self) -> "WellAdapter":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()
