"""
Held-out evaluation (vikshep_ingest.heldout) and the recipe reports built on it.

The recipes used to score each model on the events it was fit on, which
reports memorisation: 217 noise features gave calibrate R^2 1.0 on 120 events.
These tests pin the fold scheme, check that noise scores as noise once held
out, and that the reports say which number is which.
"""

from __future__ import annotations

import json
import tempfile
from pathlib import Path

import numpy as np
import pytest

from vikshep_ingest import heldout
from vikshep_ingest.cli.recipe import main as recipe_main
from vikshep_ingest.scattering import scatter_available
from tests.test_recipe_report import _make_manifest

needs_core = pytest.mark.skipif(not scatter_available(), reason="vikshep_compute not installed")


# ── Fold assignment ──────────────────────────────────────────────────────────

def test_fold_assignment_known_answer():
    """vikshep.kfold/1 is part of the report's meaning: pin it."""
    assert heldout.fold_assignment(12, 3, 42).tolist() == [0, 0, 1, 2, 0, 1, 2, 0, 1, 2, 2, 1]
    assert heldout.fold_assignment(12, 3, 7).tolist() == [0, 0, 1, 0, 1, 1, 2, 2, 1, 2, 0, 2]
    strata = np.array([0, 1] * 6)
    assert heldout.fold_assignment(12, 3, 42, strata=strata).tolist() == [0, 2, 1, 0, 0, 2, 2, 1, 1, 1, 2, 0]


def test_folds_are_balanced_and_stratified():
    rng = np.random.default_rng(1)
    y = (rng.random(1003) < 0.3).astype(float)
    fold = heldout.fold_assignment(1003, 5, 42, strata=y)
    sizes = np.bincount(fold, minlength=5)
    assert sizes.max() - sizes.min() <= 1
    for cls in (0, 1):
        per = np.bincount(fold[y == cls], minlength=5)
        assert per.max() - per.min() <= 1
    assert not np.array_equal(fold, heldout.fold_assignment(1003, 5, 43, strata=y))


@pytest.mark.parametrize("n, folds, seed", [(9, 5, 0), (100, 1, 0), (100, 5, -1)])
def test_fold_assignment_rejects_bad_arguments(n, folds, seed):
    with pytest.raises(ValueError):
        heldout.fold_assignment(n, folds, seed)


def test_size_warnings():
    assert heldout.size_warnings(5000, 100) == []
    assert "fewer than 10 per feature" in heldout.size_warnings(800, 281)[0]
    assert "fit the training events exactly" in heldout.size_warnings(96, 281)[0]


# ── Noise must score as noise once held out ──────────────────────────────────

@pytest.mark.parametrize("backend", ["python", pytest.param("core", marks=needs_core)])
def test_noise_calibration_is_not_reported_as_skill(backend):
    rng = np.random.default_rng(0)
    X = rng.normal(size=(120, 100))
    t = rng.normal(size=120)
    res = heldout.calibrate(X, t, backend=backend, folds=5, seed=42)
    assert res["train"]["r2"] > 0.5          # memorisation, as 0.4.0 reported it
    assert res["heldout"]["r2"] < 0.1        # what the features actually explain
    assert res["n_train_min"] == 96
    assert len(res["heldout"]["predictions"]) == 120


@needs_core
def test_noise_tagger_is_not_reported_as_skill():
    rng = np.random.default_rng(0)
    X = rng.normal(size=(120, 217))
    y = (rng.random(120) < 0.47).astype(float)
    res = heldout.tag(X, y, rng.normal(size=120), np.ones(120), lam=1.0, folds=5, seed=42)
    assert res["train"]["auc"] > 0.85
    assert 0.3 < res["heldout"]["auc"] < 0.7
    assert [f["n_test"] for f in res["heldout"]["folds"]] == [24] * 5


@needs_core
def test_ridge_predict_is_bit_identical_to_the_core():
    import vikshep_compute as vc
    rng = np.random.default_rng(3)
    X = rng.normal(size=(300, 40)) * rng.uniform(0.1, 50, size=40) + rng.normal(size=40)
    t = X[:, 0] * 0.3 + rng.normal(size=300)
    fit = vc.calibrate(X, t)
    np.testing.assert_array_equal(t - heldout.ridge_predict(fit, X), np.asarray(fit["residuals"]))


# ── Reports ──────────────────────────────────────────────────────────────────

def _run(tmp_p: Path, *extra: str) -> tuple[dict, dict, bytes, bytes]:
    manifest_path = _make_manifest(tmp_p)
    assert recipe_main(["tag", "--features", str(manifest_path), "--label", "is_signal",
                        "--protect", "mass", "--feature-set", "aggregates", "--out", str(tmp_p), *extra]) == 0
    assert recipe_main(["calibrate", "--features", str(manifest_path), "--target", "mass",
                        "--feature-set", "aggregates", "--out", str(tmp_p), *extra]) == 0
    tag_b = (tmp_p / "tag_report.json").read_bytes()
    cal_b = (tmp_p / "calibrate_report.json").read_bytes()
    return json.loads(tag_b), json.loads(cal_b), tag_b, cal_b


def test_reports_label_heldout_and_training_metrics():
    with tempfile.TemporaryDirectory() as tmp:
        tag, cal, _, _ = _run(Path(tmp))

    for key in ("auc_heldout", "dcorr2_heldout", "auc_train", "dcorr2_train", "evaluation",
                "n_features", "warnings"):
        assert key in tag
    for key in ("r2_heldout", "residual_std_heldout", "r2_train", "residual_std_train",
                "evaluation", "n_features", "warnings"):
        assert key in cal
    # The unlabelled 0.4.0 keys are gone, so nobody quotes a training number by mistake.
    assert not {"auc", "dcorr2"} & set(tag)
    assert not {"r2_score", "residual_std"} & set(cal)

    ev = tag["evaluation"]
    assert ev["split"] == "vikshep.kfold/1" and ev["folds"] == 5 and ev["seed"] == 42
    assert ev["stratified_by"] == "is_signal"
    assert sum(f["n_test"] for f in ev["per_fold"]) == tag["n_events"] == 40
    assert cal["evaluation"]["stratified_by"] is None


def test_reports_are_byte_identical_for_the_same_seed():
    with tempfile.TemporaryDirectory() as a, tempfile.TemporaryDirectory() as b, \
            tempfile.TemporaryDirectory() as c:
        _, _, tag_a, cal_a = _run(Path(a))
        _, _, tag_b, cal_b = _run(Path(b))
        tag_c, _, _, _ = _run(Path(c), "--seed", "7", "--folds", "4")
    assert tag_a == tag_b and cal_a == cal_b
    assert tag_c["evaluation"]["seed"] == 7 and tag_c["evaluation"]["folds"] == 4


def test_small_sample_warning_reaches_report_and_stderr(capsys):
    with tempfile.TemporaryDirectory() as tmp:
        _, cal, _, _ = _run(Path(tmp))   # 40 events, 32 training events per fold
    assert cal["warnings"], "40 events for ~30 features must warn"
    assert "WARNING:" in capsys.readouterr().err


def test_too_few_events_for_the_folds_is_an_error(capsys):
    with tempfile.TemporaryDirectory() as tmp:
        tmp_p = Path(tmp)
        manifest_path = _make_manifest(tmp_p)
        rc = recipe_main(["calibrate", "--features", str(manifest_path), "--target", "mass",
                          "--feature-set", "aggregates", "--folds", "30", "--out", str(tmp_p)])
    assert rc == 1
    assert "needs at least 60 events" in capsys.readouterr().err
