"""
sim/reader.py — vikshep-sim run folders → per-event hits → manifest.

See the package docstring for the mapping from hits.arrow columns to hits.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path

import numpy as np

from vikshep_ingest.g4.adapter import G4Adapter
from vikshep_ingest.g4.rasterize import DEFAULT_GRID
from vikshep_ingest.g4.schema import G4Profile

PROFILE = "sim_hits_v1"
_SUPPORTED_HITS_MAJOR = "1"
_COLUMNS = ("event_id", "layer", "x", "y", "z", "edep", "px", "py", "pz")

# Gun particle names of the vikshep-sim spec (Geant4 names) → PDG codes.
_PDG = {
    "e-": 11, "e+": -11, "gamma": 22, "mu-": 13, "mu+": -13,
    "pi-": -211, "pi+": 211, "pi0": 111, "kaon-": -321, "kaon+": 321,
    "proton": 2212, "anti_proton": -2212, "neutron": 2112,
}


class SimRunError(RuntimeError):
    """A folder that is not a readable vikshep-sim run."""


@dataclass(frozen=True)
class SimRun:
    folder: Path
    oid: str
    spec: dict
    spec_oid: str | None
    summary: dict


def _oid(path: Path) -> str:
    """The run OID: first 14 bytes of SHA3-256 of the whole hits.arrow file, as hex."""
    h = hashlib.sha3_256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.digest()[:14].hex()


def _folder_of(path: str | Path) -> Path:
    p = Path(path)
    return (p.parent if p.name == "hits.arrow" else p).resolve()


def open_run(path: str | Path) -> SimRun:
    """Open a run folder (or its hits.arrow) and check it against run_summary.json."""
    folder = _folder_of(path)
    files = {name: folder / name for name in ("hits.arrow", "provenance.json", "run_summary.json")}
    for name, f in files.items():
        if not f.is_file():
            raise SimRunError(f"{folder} is not a vikshep-sim output folder: {name} is missing.")

    provenance = json.loads(files["provenance.json"].read_text())
    summary = json.loads(files["run_summary.json"].read_text())

    version = str(summary.get("hits_schema_version", provenance.get("hits_schema_version", "")))
    if version.split(".")[0] != _SUPPORTED_HITS_MAJOR:
        raise SimRunError(f"{folder}: hits format {version!r} is not supported (expected 1.x).")

    oid = _oid(files["hits.arrow"])
    if summary.get("oid") != oid:
        raise SimRunError(
            f"{files['hits.arrow']} has OID {oid} but run_summary.json records "
            f"{summary.get('oid')}: the file changed after the run."
        )
    return SimRun(folder, oid, provenance.get("spec", {}), provenance.get("spec_oid"), summary)


def _read_columns(run: SimRun) -> dict[str, np.ndarray]:
    try:
        import pyarrow as pa
        import pyarrow.ipc as ipc
    except ImportError as exc:
        raise SimRunError(
            "Reading vikshep-sim output needs pyarrow: pip install 'vikshep-ingest[sim]'"
        ) from exc
    with pa.OSFile(str(run.folder / "hits.arrow"), "rb") as f:
        table = ipc.open_file(f).read_all()
    missing = [c for c in _COLUMNS if c not in table.column_names]
    if missing:
        raise SimRunError(f"{run.folder}/hits.arrow lacks columns {missing}.")
    cols = {c: table.column(c).to_numpy() for c in _COLUMNS}
    if len(cols["event_id"]) and np.any(np.diff(cols["event_id"].astype(np.int64)) < 0):
        raise SimRunError(f"{run.folder}/hits.arrow: rows are not ordered by event_id.")
    return cols


def read_runs(
    paths: list[str | Path],
    signal: list[str | Path] | tuple = (),
) -> tuple[list[list[dict]], dict, list[dict]]:
    """Read runs in the given order.

    Returns (events_hits, stats, runs_info): events in (run, event_id) order,
    the stats G4Adapter.build expects (with event_columns), and one record per
    run for the manifest.
    """
    runs = [open_run(p) for p in paths]
    signal_folders = {_folder_of(p) for p in signal}
    unknown = signal_folders - {r.folder for r in runs}
    if unknown:
        raise SimRunError(f"--signal names runs that are not being read: {sorted(map(str, unknown))}")

    events_hits: list[list[dict]] = []
    event_columns: dict[str, list[float]] = {
        "run_index": [], "primary_energy_GeV": [], "primary_pdg": [],
    }
    if signal_folders:
        event_columns["is_signal"] = []
    runs_info: list[dict] = []
    n_hits_total = 0

    for index, run in enumerate(runs):
        gun = run.spec.get("gun", {})
        x0, y0, z0 = (float(v) for v in gun.get("position_mm", (0.0, 0.0, 0.0)))
        energy_gev = float(gun.get("energy_GeV", float("nan")))
        pdg = float(_PDG.get(gun.get("particle", ""), 0))
        is_signal = float(run.folder in signal_folders)

        c = _read_columns(run)
        dx, dy, dz = c["x"] - x0, c["y"] - y0, c["z"] - z0
        phi = np.arctan2(dy, dx)
        theta = np.arctan2(np.hypot(dx, dy), dz)
        momentum = np.sqrt(c["px"] ** 2 + c["py"] ** 2 + c["pz"] ** 2) / 1000.0
        energy = c["edep"] / 1000.0
        layer = c["layer"].astype(np.int64)

        ids, starts = np.unique(c["event_id"], return_index=True)
        bounds = list(starts) + [len(c["event_id"])]
        for k in range(len(ids)):
            lo, hi = bounds[k], bounds[k + 1]
            events_hits.append([
                {"layer": int(l), "phi": float(a), "theta": float(t), "momentum": float(m), "energy": float(e)}
                for l, a, t, m, e in zip(layer[lo:hi], phi[lo:hi], theta[lo:hi], momentum[lo:hi], energy[lo:hi])
            ])
            event_columns["run_index"].append(float(index))
            event_columns["primary_energy_GeV"].append(energy_gev)
            event_columns["primary_pdg"].append(pdg)
            if signal_folders:
                event_columns["is_signal"].append(is_signal)
        n_hits_total += len(c["event_id"])

        runs_info.append({
            "path":                str(run.folder),
            "oid":                 run.oid,
            "spec_oid":            run.spec_oid,
            "template":            run.spec.get("template"),
            "particle":            gun.get("particle"),
            "energy_GeV":          gun.get("energy_GeV"),
            "events_requested":    run.summary.get("events_requested"),
            "events_without_hits": run.summary.get("events_without_hits"),
            "signal":              run.folder in signal_folders,
        })

    stats = {
        "n_events":         len(events_hits),
        "n_hits_total":     n_hits_total,
        "n_malformed_rows": 0,
        "has_energy":       True,
        "event_columns":    event_columns,
    }
    return events_hits, stats, runs_info


def ingest_runs(
    paths: list[str | Path],
    signal: list[str | Path] | tuple = (),
    out_dir: str | Path | None = None,
    grid_shape: tuple[int, int] = DEFAULT_GRID,
    adapter: G4Adapter | None = None,
) -> dict:
    """Read runs and build the manifest (grids in shared memory, aggregates, event columns).

    With adapter, the grids stay registered until that adapter closes; without,
    a private adapter is closed (and its segments unlinked) before returning,
    as in the CLI.
    """
    events_hits, stats, runs_info = read_runs(paths, signal)
    if adapter is not None:
        return adapter.build(events_hits, stats, source_kind="vikshep-sim",
                             extra={"runs": runs_info}, out_dir=out_dir)
    with G4Adapter(G4Profile(name=PROFILE), grid_shape=grid_shape) as own:
        return own.build(events_hits, stats, source_kind="vikshep-sim",
                         extra={"runs": runs_info}, out_dir=out_dir)
