"""
Tests for the vikshep-sim reader (vikshep-ingest sim).

Fixture-only: runs are written here with pyarrow in the hits.arrow v1 column
layout (HITS.md), with provenance.json and run_summary.json beside them.
Skipped when pyarrow is not installed (pip install 'vikshep-ingest[sim]').
The reader was also checked by hand against the golden files of
elli0t-yash/vikshep-sim (tests/golden/hits_small.arrow, hits_empty.arrow):
it reproduces their recorded OIDs and reads both.
"""

from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path

import numpy as np
import pytest

pa = pytest.importorskip("pyarrow")
import pyarrow.ipc as ipc  # noqa: E402

from vikshep_ingest.cli.ingest_g4 import dispatch  # noqa: E402
from vikshep_ingest.sim import SimRunError, ingest_runs, open_run, read_runs  # noqa: E402


def _write_run(folder: Path, particle: str, energy_gev: float, hits: list[tuple], gun_mm=(0.0, 0.0, -20.0)) -> Path:
    """hits: (event_id, layer, x, y, z, edep_MeV, px, py, pz) in mm, MeV, MeV/c."""
    folder.mkdir(parents=True)
    cols = list(zip(*hits)) if hits else [[] for _ in range(9)]
    n = len(hits)
    table = pa.table(
        {
            "event_id": pa.array(cols[0], pa.uint64()),
            "volume":   pa.array(["active"] * n).dictionary_encode().cast(pa.dictionary(pa.int32(), pa.utf8())),
            "copy_no":  pa.array(cols[1], pa.int32()),
            "layer":    pa.array(cols[1], pa.int32()),
            "x": pa.array(cols[2], pa.float64()), "y": pa.array(cols[3], pa.float64()),
            "z": pa.array(cols[4], pa.float64()), "t": pa.array([0.0] * n, pa.float64()),
            "edep": pa.array(cols[5], pa.float64()),
            "px": pa.array(cols[6], pa.float64()), "py": pa.array(cols[7], pa.float64()),
            "pz": pa.array(cols[8], pa.float64()),
            "track_id": pa.array([1] * n, pa.int32()), "parent_id": pa.array([0] * n, pa.int32()),
            "pdg": pa.array([11] * n, pa.int32()), "step": pa.array(list(range(1, n + 1)), pa.int32()),
        }
    ).replace_schema_metadata({"vikshep.hits.schema_version": "1.0"})
    with ipc.new_file(str(folder / "hits.arrow"), table.schema) as writer:
        if n:
            writer.write_table(table)
    oid = hashlib.sha3_256((folder / "hits.arrow").read_bytes()).digest()[:14].hex()
    spec = {"template": "layered_calorimeter",
            "gun": {"particle": particle, "energy_GeV": energy_gev, "position_mm": list(gun_mm)}}
    (folder / "provenance.json").write_text(json.dumps({"hits_schema_version": "1.0", "spec": spec, "spec_oid": "f" * 28}))
    (folder / "run_summary.json").write_text(json.dumps({
        "oid": oid, "hits_schema_version": "1.0", "events_requested": 3, "events_without_hits": 1,
    }))
    return folder


def _shower(event_id: int, energy_mev: float) -> list[tuple]:
    return [
        (event_id, 0, 1.0, 0.0, -10.0, 0.4 * energy_mev, 0.0, 0.0, energy_mev),
        (event_id, 1, 0.0, 2.0, 5.0, 0.3 * energy_mev, 0.0, 0.0, 0.8 * energy_mev),
        (event_id, 2, -3.0, -1.0, 20.0, 0.1 * energy_mev, 10.0, 0.0, 0.5 * energy_mev),
    ]


@pytest.fixture
def two_runs(tmp_path: Path) -> tuple[Path, Path]:
    e_run = _write_run(tmp_path / "e_run", "e-", 5.0, _shower(0, 5000.0) + _shower(2, 5000.0))  # event 1 had no hits
    pi_run = _write_run(tmp_path / "pi_run", "pi-", 5.0, _shower(0, 900.0))
    return e_run, pi_run


def test_runs_become_events_with_event_columns(two_runs):
    e_run, pi_run = two_runs
    events, stats, info = read_runs([e_run, pi_run], [e_run])

    assert stats["n_events"] == 3 and stats["n_hits_total"] == 9 and stats["has_energy"]
    cols = stats["event_columns"]
    assert cols["run_index"] == [0.0, 0.0, 1.0]
    assert cols["is_signal"] == [1.0, 1.0, 0.0]
    assert cols["primary_pdg"] == [11.0, 11.0, -211.0]
    assert cols["primary_energy_GeV"] == [5.0, 5.0, 5.0]
    assert [r["particle"] for r in info] == ["e-", "pi-"] and info[0]["signal"] and not info[1]["signal"]


def test_hit_mapping_angles_from_the_gun_and_gev_units(two_runs):
    e_run, _ = two_runs
    events, _, _ = read_runs([e_run])
    first = events[0][0]  # (1, 0, -10) mm with the gun at (0, 0, -20): 1 mm across, 10 mm along the beam
    assert first["layer"] == 0
    assert first["phi"] == pytest.approx(0.0)
    assert first["theta"] == pytest.approx(math.atan2(1.0, 10.0))
    assert first["momentum"] == pytest.approx(5.0)      # 5000 MeV/c
    assert first["energy"] == pytest.approx(2.0)        # 0.4 * 5000 MeV
    assert "is_signal" not in read_runs([e_run])[1]["event_columns"]


def test_empty_run_contributes_no_events(tmp_path, two_runs):
    e_run, _ = two_runs
    empty = _write_run(tmp_path / "empty", "pi-", 5.0, [])
    events, stats, _ = read_runs([e_run, empty])
    assert stats["n_events"] == 2


def test_changed_hits_file_is_refused(two_runs):
    e_run, _ = two_runs
    with open(e_run / "hits.arrow", "ab") as f:
        f.write(b"\0")
    with pytest.raises(SimRunError, match="changed after the run"):
        open_run(e_run)


def test_folder_without_run_files_is_refused(tmp_path):
    (tmp_path / "not_a_run").mkdir()
    with pytest.raises(SimRunError, match="not a vikshep-sim output folder"):
        open_run(tmp_path / "not_a_run")


def test_unsupported_hits_version_is_refused(two_runs):
    e_run, _ = two_runs
    summary = json.loads((e_run / "run_summary.json").read_text())
    summary["hits_schema_version"] = "2.0"
    (e_run / "run_summary.json").write_text(json.dumps(summary))
    with pytest.raises(SimRunError, match="not supported"):
        open_run(e_run)


def test_signal_run_must_be_one_of_the_runs(tmp_path, two_runs):
    e_run, pi_run = two_runs
    with pytest.raises(SimRunError, match="not being read"):
        read_runs([pi_run], [e_run])


def test_manifest_and_cli(tmp_path, two_runs, capsys):
    e_run, pi_run = two_runs
    out = tmp_path / "ana"
    assert dispatch(["sim", str(e_run), str(pi_run), "--signal", str(e_run), "--out", str(out)]) == 0
    manifest = json.loads((out / "manifest.json").read_text())

    assert manifest["source"] == "vikshep-sim" and manifest["profile"] == "sim_hits_v1"
    assert manifest["n_events"] == 3 and len(manifest["grid_oids"]) == 3
    assert all(len(oid) == 28 for oid in manifest["grid_oids"])
    assert manifest["event_column_names"] == ["run_index", "primary_energy_GeV", "primary_pdg", "is_signal"]
    assert [r["oid"] for r in manifest["runs"]] == [open_run(e_run).oid, open_run(pi_run).oid]
    assert "layer0_e_sum" in manifest["aggregate_names"]
    assert manifest["pad_policy_per_axis"] == {"phi": "Circular", "theta": "ZeroPad"}
    assert "Event columns  : run_index, primary_energy_GeV, primary_pdg, is_signal" in capsys.readouterr().out


def test_grids_are_rebuilt_from_the_runs(tmp_path, two_runs):
    """As in the CLI, the adapter has unlinked its segments when the recipe
    loads the grids, so they are rebuilt from the run folders."""
    pytest.importorskip("vikshep_compute")
    from vikshep_ingest.g4.adapter import _oid_from_buf
    from vikshep_ingest.scattering import load_grids

    e_run, pi_run = two_runs
    manifest = ingest_runs([e_run, pi_run], [e_run])
    grids = load_grids(manifest)
    assert (grids.sum(axis=(1, 2)) > 0).all()
    assert [_oid_from_buf(np.ascontiguousarray(g).tobytes()) for g in grids] == manifest["grid_oids"]
