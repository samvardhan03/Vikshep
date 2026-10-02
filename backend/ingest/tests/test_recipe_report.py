"""
The tag report must say how its numbers were produced: the training gradient
is a Pearson-correlation proxy, the reported dCorr^2 is the exact weighted
value.
"""

from __future__ import annotations

import json
import tempfile
from pathlib import Path

import numpy as np

from vikshep_ingest.cli.recipe import main as recipe_main
from vikshep_ingest.g4.adapter import G4Adapter
from vikshep_ingest.g4.schema import get_profile
from tests.fixtures import make_synthetic_csv


def _make_manifest(tmp_dir: Path) -> Path:
    csv_str = make_synthetic_csv(n_events=40, with_energy=True, seed=0)
    with G4Adapter(get_profile("komal_v1")) as adapter:
        manifest = adapter.ingest(source=csv_str, out_dir=tmp_dir)
    rng = np.random.default_rng(0)
    for agg in manifest["aggregates"]:
        agg["is_signal"] = int(rng.integers(0, 2))
        agg["mass"]      = float(abs(rng.normal(80, 15)))
    manifest["aggregate_names"] = sorted(manifest["aggregates"][0].keys())
    path = tmp_dir / "manifest.json"
    with open(path, "w") as f:
        json.dump(manifest, f, indent=2)
    return path


def test_tag_report_states_gradient_and_metric(capsys):
    with tempfile.TemporaryDirectory() as tmp:
        tmp_p = Path(tmp)
        manifest_path = _make_manifest(tmp_p)

        rc = recipe_main([
            "tag",
            "--features", str(manifest_path),
            "--label",    "is_signal",
            "--protect",  "mass",
            "--lambda",   "1.0",
            "--out",      str(tmp_p),
        ])
        assert rc == 0

        with open(tmp_p / "tag_report.json") as f:
            report = json.load(f)

    assert report["training_gradient"] == "pearson_proxy"
    assert report["reported_dcorr2"]   == "exact_weighted"

    out = capsys.readouterr().out
    assert "training_gradient : pearson_proxy" in out
    assert "reported_dcorr2   : exact_weighted" in out
