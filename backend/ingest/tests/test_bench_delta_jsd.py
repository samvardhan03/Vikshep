"""
Sign of Delta-JSD in the benchmark report (VDS-1 section 16.7).

Delta-JSD = JSD(lambda) - JSD(0), and the win condition is Delta-sigma > 0 AND
Delta-JSD <= 0, so a cut that sculpts the protected variable less than the
lambda=0 cut has a negative Delta-JSD and satisfies the JSD half of the rule.
The harness used to compute JSD(0) - JSD(lambda), which counted a real drop in
sculpting as a failure.

The scores here are constructed, not trained: heldout.tag is replaced by a
stand-in that returns fixed out-of-fold scores per lambda, so these tests check
the harness arithmetic, the win rule and the report, on either backend.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pytest

from bench import harness
from vikshep_ingest import heldout

N_SIG = 100
N_BKG = 300
# Signal sits at PASS, so the 50% signal-efficiency cut (VDS-1 16.4) lands at
# score PASS and the events at PASS are exactly those that pass.
PASS, FAIL = 0.9, 0.1


def _write_manifest(tmp: Path) -> Path:
    """Signal events then background events; background mass rises with index."""
    labels = [1] * N_SIG + [0] * N_BKG
    mass = list(np.linspace(0.0, 100.0, N_SIG)) + list(np.linspace(0.0, 100.0, N_BKG))
    aggregates = [
        {"f0": float(i % 7), "is_signal": y, "mass": float(m)}
        for i, (y, m) in enumerate(zip(labels, mass))
    ]
    manifest = {
        "aggregates": aggregates,
        "aggregate_names": ["f0", "is_signal", "mass"],
        "event_column_names": ["is_signal", "mass"],
    }
    path = tmp / "manifest.json"
    path.write_text(json.dumps(manifest))
    return path


def _constructed_scores(labels: np.ndarray, protect: np.ndarray, lam: float) -> np.ndarray:
    """Which background events pass the cut, by their mass rank, for each lambda.

    0.0 : the top 30% in mass pass (the baseline sculpts the mass).
    0.1 : the top 34 pass (sculpts more than the baseline; fewer pass, so
          significance rises).
    1.0 : every ninth event in mass order passes, 34 again, spread over the
          whole range: sculpts less than the baseline, same significance as
          0.1.
    10.0: every third event passes and only half the signal does (sculpts less
          than the baseline, but significance falls).
    """
    bkg = labels == 0
    rank = np.empty(int(bkg.sum()), dtype=np.int64)
    rank[np.argsort(protect[bkg], kind="stable")] = np.arange(rank.size)
    if lam == 0.0:
        bkg_pass = rank >= int(0.7 * N_BKG)
    elif lam == 0.1:
        bkg_pass = rank >= N_BKG - 34
    elif lam == 1.0:
        bkg_pass = rank % 9 == 0
    elif lam == 10.0:
        bkg_pass = rank % 3 == 0
    else:
        raise AssertionError(f"no constructed scores for lambda={lam}")

    scores = np.full(labels.shape, FAIL)
    sig_idx = np.flatnonzero(~bkg)
    n_sig_pass = sig_idx.size // 2 if lam == 10.0 else sig_idx.size
    scores[sig_idx[:n_sig_pass]] = PASS
    scores[np.flatnonzero(bkg)[bkg_pass]] = PASS
    return scores


@pytest.fixture
def constructed_tag(monkeypatch):
    def fake_tag(X, labels, protect, weights, lam, backend, folds, seed):
        scores = _constructed_scores(labels, protect, lam)
        return {
            "heldout": {"auc": 0.9, "dcorr2": 0.1, "scores": scores},
            "train":   {"auc": 0.9, "dcorr2": 0.1, "scores": scores},
            "n_train_min": len(labels) * (folds - 1) // folds,
        }
    monkeypatch.setattr(heldout, "tag", fake_tag)


def _row(result: dict, lam: float) -> dict:
    return next(e for e in result["frontier"] if e["lambda"] == lam)


def test_delta_jsd_is_negative_when_sculpting_drops(tmp_path, constructed_tag):
    result = harness.run(
        manifest_path=_write_manifest(tmp_path),
        label_col="is_signal",
        protect_col="mass",
        lambdas=[0.0, 0.1, 1.0],
        out_dir=tmp_path,
    )
    base = result["jsd_baseline"]
    more, less = _row(result, 0.1), _row(result, 1.0)

    assert _row(result, 0.0)["delta_jsd"] == 0.0

    # lambda=1 sculpts less than the baseline: JSD falls, Delta-JSD < 0.
    assert less["jsd"] < base
    assert less["delta_jsd"] < 0
    assert less["delta_jsd"] == pytest.approx(less["jsd"] - base)

    # lambda=0.1 sculpts more: Delta-JSD > 0.
    assert more["jsd"] > base
    assert more["delta_jsd"] > 0

    # Same significance at 0.1 and 1, above the baseline: only the JSD sign
    # separates them, and the win goes to the lambda that sculpts less.
    assert more["delta_sigma"] == pytest.approx(less["delta_sigma"])
    assert less["delta_sigma"] > 0
    wc = result["win_condition"]
    assert wc["result"] is True
    assert wc["best_lambda"] == 1.0
    assert wc["delta_jsd"] == less["delta_jsd"] < 0

    md = (tmp_path / "report.md").read_text()
    assert "**Result: WIN**" in md
    assert "Delta-JSD = JSD(lambda) - JSD(0)" in md
    assert f"| {less['delta_jsd']:+.4f} |" in md and f"{less['delta_jsd']:+.4f}".startswith("-")


def test_less_sculpting_alone_is_not_a_win(tmp_path, constructed_tag):
    """The quickstart's shape: DisCo removes sculpting and costs significance."""
    result = harness.run(
        manifest_path=_write_manifest(tmp_path),
        label_col="is_signal",
        protect_col="mass",
        lambdas=[0.0, 10.0],
        out_dir=tmp_path,
    )
    row = _row(result, 10.0)
    assert row["delta_jsd"] < 0
    assert row["delta_sigma"] < 0

    wc = result["win_condition"]
    assert wc["result"] is False
    assert "Delta-sigma > 0: False" in wc["note"]
    assert "Delta-JSD <= 0: True" in wc["note"]
    assert "**Result: NO WIN**" in (tmp_path / "report.md").read_text()
