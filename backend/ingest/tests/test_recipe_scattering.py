"""
Tests for the scattering feature path in vikshep-recipe.

Skipped when vikshep_compute is not installed.  Run with the scattering
extra: pip install -e "backend/ingest[scattering]"
"""

from __future__ import annotations

import json
import tempfile
from pathlib import Path

import numpy as np
import pytest

from vikshep_ingest.scattering import scatter_available

pytestmark = pytest.mark.skipif(
    not scatter_available(),
    reason="vikshep_compute not installed (pip install -e 'backend/ingest[scattering]')",
)


def _make_manifest_with_path(tmp_dir: Path) -> tuple[Path, Path]:
    """Write a synthetic CSV and ingest it; return (manifest_path, csv_path)."""
    from tests.fixtures import make_synthetic_csv
    from vikshep_ingest.g4.adapter import G4Adapter
    from vikshep_ingest.g4.schema import get_profile

    csv_str = make_synthetic_csv(n_events=20, with_energy=True, seed=7)
    csv_path = tmp_dir / "sample.csv"
    csv_path.write_text(csv_str)

    rng = np.random.default_rng(7)
    with G4Adapter(get_profile("komal_v1")) as adapter:
        manifest = adapter.ingest(path=csv_path, out_dir=tmp_dir)

    for agg in manifest["aggregates"]:
        agg["is_signal"] = int(rng.integers(0, 2))
        agg["mass"] = float(abs(rng.normal(80, 15)))
    manifest["aggregate_names"] = sorted(manifest["aggregates"][0].keys())

    manifest_path = tmp_dir / "manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    return manifest_path, csv_path


def test_scattering_tag_report_fields():
    with tempfile.TemporaryDirectory() as tmp:
        tmp_p = Path(tmp)
        manifest_path, _ = _make_manifest_with_path(tmp_p)

        from vikshep_ingest.cli.recipe import main as recipe_main
        rc = recipe_main([
            "tag",
            "--features",    str(manifest_path),
            "--label",       "is_signal",
            "--protect",     "mass",
            "--lambda",      "1.0",
            "--feature-set", "scattering",
            "--out",         str(tmp_p),
        ])
        assert rc == 0

        with open(tmp_p / "tag_report.json") as f:
            report = json.load(f)

    assert report["feature_set"]       == "scattering"
    assert report["training_gradient"] == "exact_weighted"
    assert report["reported_dcorr2"]   == "exact_weighted"
    assert "auc" in report
    assert "dcorr2" in report


def test_scattering_tag_writes_provenance():
    with tempfile.TemporaryDirectory() as tmp:
        tmp_p = Path(tmp)
        manifest_path, _ = _make_manifest_with_path(tmp_p)

        from vikshep_ingest.cli.recipe import main as recipe_main
        rc = recipe_main([
            "tag",
            "--features",    str(manifest_path),
            "--label",       "is_signal",
            "--protect",     "mass",
            "--feature-set", "scattering",
            "--out",         str(tmp_p),
        ])
        assert rc == 0

        prov_path = tmp_p / "provenance.json"
        assert prov_path.exists(), "provenance.json not written"
        with open(prov_path) as f:
            prov = json.load(f)
    assert prov.get("schema") == "vikshep.provenance/1"
    assert prov.get("operation") == "scattering"
    assert "manifest_hash" in prov


def test_scattering_calibrate_report_fields():
    with tempfile.TemporaryDirectory() as tmp:
        tmp_p = Path(tmp)
        manifest_path, _ = _make_manifest_with_path(tmp_p)

        from vikshep_ingest.cli.recipe import main as recipe_main
        rc = recipe_main([
            "calibrate",
            "--features",    str(manifest_path),
            "--target",      "mass",
            "--feature-set", "scattering",
            "--out",         str(tmp_p),
        ])
        assert rc == 0

        with open(tmp_p / "calibrate_report.json") as f:
            report = json.load(f)

    assert report["feature_set"] == "scattering"
    assert "r2_score" in report
    assert "residual_std" in report


def test_scattering_features_deterministic():
    """Same manifest + same seed → identical feature matrix."""
    with tempfile.TemporaryDirectory() as tmp:
        tmp_p = Path(tmp)
        manifest_path, _ = _make_manifest_with_path(tmp_p)

        from vikshep_ingest.scattering import extract_scattering_features
        import json
        with open(manifest_path) as f:
            manifest = json.load(f)

        feat_a, oid_a, _ = extract_scattering_features(manifest)
        feat_b, oid_b, _ = extract_scattering_features(manifest)

    assert oid_a == oid_b, "OIDs differ between runs on identical input"
    np.testing.assert_array_equal(feat_a, feat_b)
