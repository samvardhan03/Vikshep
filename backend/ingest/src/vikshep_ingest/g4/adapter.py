"""
g4/adapter.py — G4Adapter: CSV → events → rasterized grids + aggregates → shared memory.

The adapter follows the seam contract: it preallocates pinned buffers, registers
each in POSIX shared memory under a 28-character SHA3-256 OID, and returns a
manifest dict.  No float tensors leave this process via the control plane.
"""

from __future__ import annotations

import csv
import hashlib
import io
import mmap
import multiprocessing.shared_memory as shm_module
import sys
import warnings
from pathlib import Path
from typing import Iterator

import numpy as np

from .schema import G4Profile
from .aggregates import compute_aggregates
from .rasterize import rasterize_event, compute_ranges, pad_policy_for_g4, DEFAULT_GRID


def _oid_from_buf(buf: bytes) -> str:
    """28-character hex OID from the first 14 bytes of SHA3-256(buf)."""
    digest = hashlib.sha3_256(buf).digest()[:14]
    return digest.hex()


def _register_shm(data: np.ndarray) -> tuple[str, shm_module.SharedMemory]:
    """Write array into a named POSIX shared-memory segment; return (oid, shm).

    The segment name equals the OID so downstream tools (vikshep-mcp, recipes)
    can look it up without additional tracking.  If a segment with the same
    name already exists (identical grid content across events) we open it
    read-only rather than re-creating it.
    """
    buf = data.tobytes()
    oid = _oid_from_buf(buf)
    try:
        sm = shm_module.SharedMemory(name=oid, create=True, size=max(len(buf), 1))
        sm.buf[:len(buf)] = buf
    except FileExistsError:
        sm = shm_module.SharedMemory(name=oid, create=False)
    return oid, sm


def _parse_csv(
    path: str | Path | None,
    profile: G4Profile,
    source: str | None = None,
) -> tuple[list[list[dict]], dict]:
    """Parse a Geant4 CSV file into per-event hit lists.

    Returns (events, stats) where stats has n_events, n_hits_total,
    n_malformed_rows and event_columns.  Malformed rows are counted and
    warned, never silently dropped without accounting.

    Extra columns that hold one numeric value per event (the same on every
    hit row of the event: a truth label, the incident energy, an MC weight)
    are kept as event columns, {name: [value per event, in event order]}.
    Other extra columns are ignored with a warning.
    """
    if path is None and source is not None:
        lines = io.StringIO(source)
        reader_src: io.IOBase = lines
    elif path is not None:
        reader_src = open(path, newline="")
    else:
        raise ValueError("Either path or source must be provided.")

    events: dict[int, list[dict]] = {}
    n_malformed  = 0
    n_hits_total = 0
    has_energy   = False
    # Candidate event columns: {column: {event_id: value}}; dropped from the
    # candidates on the first non-numeric value or a value that varies within an event.
    candidates: dict[str, dict[int, float]] = {}

    try:
        reader = csv.DictReader(reader_src)
        if reader.fieldnames is None:
            return [], {"n_events": 0, "n_hits_total": 0, "n_malformed_rows": 0,
                        "has_energy": False, "event_columns": {}}

        # Detect energy column; extra columns are event-column candidates
        all_cols     = set(reader.fieldnames)
        canonical    = {profile.event_id, profile.layer, profile.phi, profile.theta, profile.momentum}
        if profile.energy and profile.energy in all_cols:
            has_energy = True
        extra = all_cols - canonical - ({profile.energy} if profile.energy else set())
        candidates = {c: {} for c in sorted(extra)}

        for row_num, row in enumerate(reader, start=2):
            try:
                event_id = int(row[profile.event_id])
                layer    = int(row[profile.layer])
                phi      = float(row[profile.phi])
                theta    = float(row[profile.theta])
                momentum = float(row[profile.momentum])
                hit: dict = {
                    "layer":    layer,
                    "phi":      phi,
                    "theta":    theta,
                    "momentum": momentum,
                }
                if has_energy:
                    hit["energy"] = float(row[profile.energy])
                events.setdefault(event_id, []).append(hit)
                n_hits_total += 1
                for col in list(candidates):
                    try:
                        value = float(row[col])
                    except (TypeError, ValueError):
                        del candidates[col]
                        continue
                    seen = candidates[col].setdefault(event_id, value)
                    if seen != value:
                        del candidates[col]
            except (KeyError, ValueError, TypeError) as exc:
                n_malformed += 1
                if n_malformed <= 5:
                    warnings.warn(
                        f"[G4Adapter] Malformed row {row_num}: {exc}", stacklevel=3
                    )
    finally:
        if path is not None:
            reader_src.close()

    if n_malformed > 5:
        warnings.warn(
            f"[G4Adapter] {n_malformed} total malformed rows (showing first 5).", stacklevel=3
        )

    event_ids = sorted(events)
    sorted_events = [events[k] for k in event_ids]
    event_columns = {
        col: [values[k] for k in event_ids]
        for col, values in candidates.items()
        if len(values) == len(event_ids)
    }
    ignored = sorted(extra - set(event_columns))
    if ignored:
        warnings.warn(
            f"[G4Adapter] Extra columns ignored (not one numeric value per event): {ignored}",
            stacklevel=3,
        )
    stats = {
        "n_events":       len(sorted_events),
        "n_hits_total":   n_hits_total,
        "n_malformed_rows": n_malformed,
        "has_energy":     has_energy,
        "event_columns":  event_columns,
    }
    return sorted_events, stats


class G4Adapter:
    """CSV → POSIX shared memory adapter for Geant4 output.

    Usage
    -----
    adapter = G4Adapter(profile)
    manifest = adapter.ingest(csv_path)
    # manifest["grid_oids"] are 28-char hex OIDs for each event's 2-D grid
    # manifest["aggregate_names"] lists the scalar channels
    """

    def __init__(
        self,
        profile: G4Profile,
        grid_shape: tuple[int, int] = DEFAULT_GRID,
    ) -> None:
        self.profile    = profile
        self.grid_shape = grid_shape
        self._shm_refs: list[shm_module.SharedMemory] = []

    def ingest(
        self,
        path: str | Path | None = None,
        source: str | None = None,
        out_dir: str | Path | None = None,
        *,
        include_source_path: bool = True,
    ) -> dict:
        """Parse the CSV, build grids + aggregates, register in shared memory.

        Parameters
        ----------
        path     : CSV file path (or None when using source=).
        source   : raw CSV string (for testing without a file).
        out_dir  : if given, write manifest.json here.

        Returns
        -------
        manifest dict — the control-plane payload (no float tensors).
        """
        events_hits, stats = _parse_csv(path, self.profile, source)
        extra = (
            {"source_path": str(Path(path).resolve())}
            if include_source_path and path is not None else {}
        )
        return self.build(events_hits, stats, source_kind="g4", extra=extra, out_dir=out_dir)

    def build(
        self,
        events_hits: list[list[dict]],
        stats: dict,
        *,
        source_kind: str = "g4",
        extra: dict | None = None,
        out_dir: str | Path | None = None,
    ) -> dict:
        """Grids, aggregates and the manifest from parsed events.

        Shared by the CSV reader (ingest) and the vikshep-sim reader
        (vikshep_ingest.sim).  events_hits holds, per event, hit dicts with
        layer, phi, theta, momentum and (when stats["has_energy"]) energy;
        stats holds n_events, n_hits_total, n_malformed_rows, has_energy and
        event_columns.  extra: reader-specific manifest keys (source_path, runs).
        """
        extra = extra or {}
        if not events_hits:
            empty: dict = {
                "source": source_kind,
                "profile": self.profile.name,
                **stats,
                "grid_oids": [],
                "aggregate_names": [],
                "aggregates": [],
                "grid": {"shape": list(self.grid_shape)},
                "pad_policy_per_axis": {
                    k: v.value for k, v in pad_policy_for_g4().items()
                },
                "channel_names": ["hits" if not stats["has_energy"] else "energy"],
            }
            empty.update(extra)
            return empty

        phi_range, theta_range = compute_ranges(events_hits)
        pad_policy = {k: v.value for k, v in pad_policy_for_g4().items()}

        grid_oids: list[str] = []
        aggregates: list[dict] = []

        for hits in events_hits:
            # Rasterize
            grid = rasterize_event(
                hits, phi_range, theta_range, self.grid_shape,
                has_energy=stats["has_energy"],
            )
            buf = np.ascontiguousarray(grid, dtype=np.float32)
            oid, sm = _register_shm(buf)
            self._shm_refs.append(sm)
            grid_oids.append(oid)

            # Aggregates
            agg = compute_aggregates(hits, self.profile.name, stats["has_energy"])
            aggregates.append(agg)

        # Event columns sit beside the aggregates under their own names (prefixed
        # event_ only if a name collides), so the recipes can use them as
        # --label, --protect, --weights or --target.
        event_column_names: list[str] = []
        for col, values in stats["event_columns"].items():
            name = f"event_{col}" if col in aggregates[0] else col
            event_column_names.append(name)
            for agg, value in zip(aggregates, values):
                agg[name] = value

        aggregate_names = sorted(aggregates[0].keys()) if aggregates else []

        manifest = {
            "source":             source_kind,
            "profile":            self.profile.name,
            "n_events":           stats["n_events"],
            "n_hits_total":       stats["n_hits_total"],
            "n_malformed_rows":   stats["n_malformed_rows"],
            "has_energy":         stats["has_energy"],
            "grid": {
                "shape":       list(self.grid_shape),
                "phi_range":   list(phi_range),
                "theta_range": list(theta_range),
            },
            "pad_policy_per_axis": pad_policy,
            "channel_names":       ["energy" if stats["has_energy"] else "hits"],
            "grid_oids":           grid_oids,
            "aggregate_names":     aggregate_names,
            "event_column_names":  event_column_names,
            "aggregates":          aggregates,
        }
        manifest.update(extra)

        if out_dir is not None:
            import json
            out_path = Path(out_dir) / "manifest.json"
            out_path.parent.mkdir(parents=True, exist_ok=True)
            with open(out_path, "w") as f:
                json.dump(manifest, f, indent=2)

        return manifest

    def close(self) -> None:
        """Release all shared memory segments."""
        for sm in self._shm_refs:
            try:
                sm.close()
                sm.unlink()
            except Exception:
                pass
        self._shm_refs.clear()

    def __enter__(self) -> "G4Adapter":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()
