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
    for key in ("auc_heldout", "dcorr2_heldout", "auc_train", "dcorr2_train"):
        assert key in report
    assert report["evaluation"]["split"] == "vikshep.kfold/1"
    # 20 events, 16 per training fold, for hundreds of scattering features
    assert "fit the training events exactly" in report["warnings"][0]


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
    for key in ("r2_heldout", "residual_std_heldout", "r2_train", "residual_std_train"):
        assert key in report
    assert report["n_features"] > report["evaluation"]["per_fold"][0]["n_train"]


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


def test_grids_survive_the_ingest_process():
    """The CLI ingests in one process and runs the recipe in another, after the
    adapter has unlinked its segments.  load_grids must re-rasterize the real
    grids from source_path; it used to return blank grids here."""
    from vikshep_ingest.g4.adapter import _oid_from_buf
    from vikshep_ingest.scattering import load_grids

    with tempfile.TemporaryDirectory() as tmp:
        manifest_path, _ = _make_manifest_with_path(Path(tmp))  # adapter already closed
        manifest = json.loads(manifest_path.read_text())
        grids = load_grids(manifest)

    assert grids.shape == (20, 64, 64)
    assert (grids.sum(axis=(1, 2)) > 0).all(), "a grid came back blank"
    assert [_oid_from_buf(np.ascontiguousarray(g).tobytes()) for g in grids] == manifest["grid_oids"]


def test_scattering_features_vary_across_events():
    from vikshep_ingest.scattering import extract_scattering_features

    with tempfile.TemporaryDirectory() as tmp:
        manifest_path, _ = _make_manifest_with_path(Path(tmp))
        manifest = json.loads(manifest_path.read_text())
        features, _, _ = extract_scattering_features(manifest)

    varying = (features.std(axis=0) > 1e-6).mean()
    assert varying > 0.5, f"only {varying:.0%} of scattering features vary across events"


def test_csv_changed_after_ingest_is_refused():
    from vikshep_ingest.scattering import load_grids

    with tempfile.TemporaryDirectory() as tmp:
        manifest_path, csv_path = _make_manifest_with_path(Path(tmp))
        manifest = json.loads(manifest_path.read_text())
        csv_path.write_text(csv_path.read_text() + "999,1,0.1,0.2,1.0,1.0\n")
        with pytest.raises(RuntimeError, match="changed after ingest"):
            load_grids(manifest)


def test_feature_cache_returns_the_same_bytes(monkeypatch):
    """calibrate then tag on one manifest: the second call reuses the features."""
    import vikshep_ingest.scattering as scattering

    with tempfile.TemporaryDirectory() as tmp:
        tmp_p = Path(tmp)
        manifest_path, _ = _make_manifest_with_path(tmp_p)
        manifest = json.loads(manifest_path.read_text())
        first = scattering.extract_scattering_features(manifest, cache_dir=tmp_p)
        assert list((tmp_p / ".vikshep-cache").glob("scatter-*.npz")), "no cache file written"

        def no_scatter(*_a, **_k):
            raise AssertionError("scatter recomputed despite a cache hit")
        monkeypatch.setattr(scattering.vc, "scatter", no_scatter)
        second = scattering.extract_scattering_features(manifest, cache_dir=tmp_p)

    np.testing.assert_array_equal(first[0], second[0])
    assert first[1:] == second[1:]
