"""
The benchmark harness's statistics against VDS-1 section 16.

16.3  JSD in nats over the pre-cut background range, weighted, no smoothing,
      null when a histogram is empty.
16.4  cut at a target signal efficiency, weights accumulated in score order.
16.5  Z_A = sqrt(2 max((s+b) ln(1+s/b) - s, 0)), null when b <= 0.

Known answers first (backend-independent), then the harness end to end with
constructed scores, then a cross-check against the core's own report
(skipped without vikshep_compute).
"""

from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
import pytest

from bench import harness
from vikshep_ingest import heldout

LN2 = math.log(2.0)


# ---------------------------------------------------------------------------
# 16.3 Jensen-Shannon divergence
# ---------------------------------------------------------------------------

def test_jsd_of_identical_histograms_is_zero():
    assert harness._jsd([1, 2, 3, 0], [1, 2, 3, 0]) == 0.0
    # Same shape, three times the weight: still identical once normalized.
    assert harness._jsd([1, 2, 3, 0], [3, 6, 9, 0]) == 0.0


def test_jsd_of_disjoint_histograms_is_ln2():
    assert harness._jsd([1, 0], [0, 1]) == LN2
    assert harness._jsd([0, 3, 0, 0], [2, 0, 5, 0]) == pytest.approx(LN2, abs=1e-15)


def test_jsd_known_value_through_the_binning():
    # Pre-cut: four events at 0 and four at 1 (two bins over [0, 1]); post-cut:
    # the four at 1.  P = (1/2, 1/2), Q = (0, 1), M = (1/4, 3/4), so
    # JSD = 0.5 * 0.5 ln(4/3) + 0.5 ln(4/3) = 0.75 ln(4/3).
    ref = np.array([0.0] * 4 + [1.0] * 4)
    assert harness._jsd_bins(ref, ref[4:], n_bins=2) == pytest.approx(0.75 * math.log(4 / 3), abs=1e-15)


def test_jsd_is_a_divergence_in_nats():
    """Not the Jensen-Shannon distance (its square root): bounded by ln 2."""
    rng = np.random.default_rng(3)
    for _ in range(20):
        p, q = rng.integers(0, 9, 12).astype(float), rng.integers(0, 9, 12).astype(float)
        p[0] = q[1] = 1.0
        d = harness._jsd(p, q)
        assert -1e-15 <= d <= LN2 + 1e-15
        assert d == harness._jsd(q, p)


def test_matching_histograms_give_zero_not_nan():
    """The post-cut histogram matching the pre-cut one bin for bin is perfect
    decorrelation.  scipy's jensenshannon returned NaN here (the square root of
    a tiny negative), so it could never win; the divergence is exactly 0."""
    b = np.linspace(0, 100, 300).astype(np.float32)
    every_tenth = b[np.arange(300) % 10 == 0]
    # 30 bins over [0, 100]: 10 events per bin before the cut, 1 after.
    assert harness._jsd_bins(b, every_tenth, n_bins=30) == 0.0
    d = harness._jsd_bins(b, every_tenth)       # default 20 bins: close, not equal
    assert not math.isnan(d) and 0.0 < d < 0.05


def test_jsd_bins_over_the_reference_range():
    idx = harness._bins(np.array([0.0, 10.0, 9.999, 5.0, -1.0, 12.0]), 0.0, 10.0, 10)
    assert idx.tolist() == [0, 9, 9, 5, 0, 9]     # hi and above in the last bin
    assert harness._bins(np.array([2.0, 7.0]), 2.0, 2.0, 4).tolist() == [0, 0]
    assert harness._histogram(np.array([0.0, 10.0, 10.0]), np.array([1.0, 2.0, 0.5]),
                              0.0, 10.0, 10)[9] == 2.5
    # A sample outside the reference range is clamped into the end bins, not
    # rebinned over its own range.
    ref = np.array([0.0, 1.0, 2.0, 3.0])
    assert harness._jsd_bins(ref, np.array([3.0]), n_bins=4) == \
        harness._jsd_bins(ref, np.array([50.0]), n_bins=4)


def test_jsd_undefined_when_a_histogram_is_empty():
    ref = np.array([0.0, 1.0, 2.0])
    assert harness._jsd_bins(ref, np.array([])) is None
    assert harness._jsd_bins(ref, ref, w_sample=np.zeros(3)) is None
    assert harness._jsd([0, 0], [1, 1]) is None


def test_jsd_weights_count_like_repeated_events():
    rng = np.random.default_rng(5)
    ref = rng.normal(50.0, 10.0, 200)
    w = rng.integers(1, 4, 200).astype(float)
    sample = ref < 45.0
    weighted = harness._jsd_bins(ref, ref[sample], 20, w, w[sample])
    k = w.astype(int)
    repeated = harness._jsd_bins(np.repeat(ref, k), np.repeat(ref[sample], k[sample]), 20)
    assert weighted == repeated
    assert weighted != harness._jsd_bins(ref, ref[sample], 20)


# ---------------------------------------------------------------------------
# 16.5 Asimov significance proxy
# ---------------------------------------------------------------------------

def test_z_asimov_known_values():
    assert harness._z_asimov(0.0, 10.0) == 0.0
    # sqrt(2 (75 ln 3 - 50)), below s / sqrt(b) = 10.
    z = harness._z_asimov(50.0, 25.0)
    assert z == pytest.approx(8.049338065966447, abs=1e-12) and z < 10.0
    assert harness._z_asimov(1.0, 1.0) == pytest.approx(math.sqrt(2 * (2 * LN2 - 1)), abs=1e-15)
    # s << b: Z_A ~ s / sqrt(b).
    assert harness._z_asimov(10.0, 10_000.0) == pytest.approx(0.1, abs=1e-3)
    # Scaling every weight by k scales Z_A by sqrt(k).
    assert harness._z_asimov(200.0, 100.0) == pytest.approx(2 * harness._z_asimov(50.0, 25.0), rel=1e-14)


def test_z_asimov_undefined_without_background():
    assert harness._z_asimov(5.0, 0.0) is None
    assert harness._z_asimov(5.0, -1.0) is None
    assert harness._z_asimov(-1.0, 5.0) is None


# ---------------------------------------------------------------------------
# 16.4 Cut at a target signal efficiency
# ---------------------------------------------------------------------------

SCORES = [0.9, 0.8, 0.7, 0.6, 0.95, 0.1]
LABELS = [1, 1, 1, 1, 0, 0]


def test_cut_at_half_the_signal():
    c = harness._cut_at_signal_efficiency(SCORES, LABELS, [1.0] * 6)
    assert c["threshold"] == 0.8
    assert (c["s"], c["b"], c["sig_eff"], c["bkg_eff"]) == (2.0, 1.0, 0.5, 0.5)


def test_cut_accumulates_weights_in_score_order():
    # The top signal event carries half the signal weight by itself.
    c = harness._cut_at_signal_efficiency(SCORES, LABELS, [3.0, 1, 1, 1, 1, 1])
    assert c["threshold"] == 0.9
    assert (c["s"], c["b"], c["sig_eff"]) == (3.0, 1.0, 0.5)
    # Full efficiency cuts at the lowest signal score.
    assert harness._cut_at_signal_efficiency(SCORES, LABELS, [1.0] * 6, target=1.0)["threshold"] == 0.6


def test_cut_keeps_every_tie():
    c = harness._cut_at_signal_efficiency([0.5] * 4 + [0.5, 0.2], LABELS, [1.0] * 6)
    assert c["threshold"] == 0.5
    assert (c["s"], c["b"], c["sig_eff"], c["bkg_eff"]) == (4.0, 1.0, 1.0, 0.5)


def test_cut_rejects_bad_input():
    for target in (0.0, -0.1, 1.5, float("nan")):
        with pytest.raises(ValueError):
            harness._cut_at_signal_efficiency(SCORES, LABELS, [1.0] * 6, target=target)
    with pytest.raises(ValueError):
        harness._cut_at_signal_efficiency(SCORES, [1] * 6, [1.0] * 6)
    with pytest.raises(ValueError):
        harness._cut_at_signal_efficiency(SCORES, LABELS, [0, 0, 0, 0, 1, 1])


def test_frontier_row_weights_count_like_repeated_events():
    rng = np.random.default_rng(11)
    n = 300
    labels = (rng.random(n) < 0.4).astype(int)
    scores = np.clip(rng.normal(0.3 + 0.4 * labels, 0.15), 0.0, 1.0).round(3)  # ties
    protect = rng.normal(80.0, 15.0, n)
    k = rng.integers(1, 5, n)
    weighted = harness._evaluate_cut(scores, labels, k.astype(float), protect)
    repeated = harness._evaluate_cut(np.repeat(scores, k), np.repeat(labels, k),
                                     np.ones(int(k.sum())), np.repeat(protect, k))
    assert weighted == repeated
    assert weighted != harness._evaluate_cut(scores, labels, np.ones(n), protect)


# ---------------------------------------------------------------------------
# The harness end to end: --weights reaches the cut, Z_A and JSD
# ---------------------------------------------------------------------------

N_SIG, N_BKG = 100, 300


def _manifest(tmp: Path, weights: list[float]) -> Path:
    labels = [1] * N_SIG + [0] * N_BKG
    mass = list(np.linspace(0.0, 100.0, N_SIG)) + list(np.linspace(0.0, 100.0, N_BKG))
    aggregates = [
        {"f0": float(i % 7), "is_signal": y, "mass": float(m), "w": float(w)}
        for i, (y, m, w) in enumerate(zip(labels, mass, weights))
    ]
    path = tmp / "manifest.json"
    path.write_text(json.dumps({
        "aggregates": aggregates,
        "aggregate_names": ["f0", "is_signal", "mass", "w"],
        "event_column_names": ["is_signal", "mass", "w"],
    }))
    return path


@pytest.fixture
def fixed_scores(monkeypatch):
    """Out-of-fold scores fixed by the test, the same at every lambda."""
    box: dict = {}

    def fake_tag(X, labels, protect, weights, lam, backend, folds, seed):
        s = box["scores"]
        return {"heldout": {"auc": 0.9, "dcorr2": 0.1, "scores": s},
                "train": {"auc": 0.9, "dcorr2": 0.1, "scores": s},
                "n_train_min": len(labels)}

    monkeypatch.setattr(heldout, "tag", fake_tag)
    return box


BKG_SCORES = np.linspace(0.2, 1.0, N_BKG)


def _signal_ramp_scores() -> np.ndarray:
    """Signal scores fall from 1.0 to 0.5 with index; background rises from 0.2
    to 1.0 with index (and with mass)."""
    return np.concatenate([np.linspace(1.0, 0.5, N_SIG), BKG_SCORES])


def _run(tmp: Path, weights: list[float] | None, **kw) -> dict:
    sub = tmp / ("w" if weights else "unit")
    sub.mkdir()
    return harness.run(
        manifest_path=_manifest(sub, weights or [1.0] * (N_SIG + N_BKG)),
        label_col="is_signal", protect_col="mass",
        weights_col="w" if weights else None,
        lambdas=[0.0], out_dir=sub, **kw,
    )["frontier"][0]


def test_weights_scale_z_asimov_and_leave_jsd(tmp_path, fixed_scores):
    fixed_scores["scores"] = _signal_ramp_scores()
    unit = _run(tmp_path, None)
    doubled = _run(tmp_path, [2.0] * (N_SIG + N_BKG))
    assert doubled["threshold"] == unit["threshold"]
    assert (doubled["s"], doubled["b"]) == (2 * unit["s"], 2 * unit["b"])
    assert doubled["z_asimov"] == pytest.approx(math.sqrt(2) * unit["z_asimov"], rel=1e-14)
    assert doubled["jsd"] == unit["jsd"]


def test_weights_move_the_cut(tmp_path, fixed_scores):
    fixed_scores["scores"] = _signal_ramp_scores()
    # The ten highest-scoring signal events carry more than half the signal weight.
    w = [10.0] * 10 + [1.0] * (N_SIG - 10) + [1.0] * N_BKG
    unit, weighted = _run(tmp_path, None), _run(tmp_path, w)
    ramp = np.linspace(1.0, 0.5, N_SIG)
    assert unit["threshold"] == ramp[49]       # 50 of 100 unit-weight events
    assert weighted["threshold"] == ramp[9]    # 100 of 190 in the first ten
    assert weighted["sig_eff"] == 100 / 190
    assert 0 < weighted["b"] < unit["b"]
    assert weighted["jsd"] > unit["jsd"]       # a tighter cut on a rising background


def test_target_and_bins_are_configurable(tmp_path, fixed_scores):
    fixed_scores["scores"] = _signal_ramp_scores()
    row = _run(tmp_path, None, target_sig_eff=0.25, n_bins=7)
    assert row["sig_eff"] == 0.25
    bkg = np.linspace(0.0, 100.0, N_BKG)
    passed = BKG_SCORES >= row["threshold"]
    assert row["jsd"] == harness._jsd_bins(bkg, bkg[passed], n_bins=7)


def test_no_background_passing_is_undefined_not_nan(tmp_path, fixed_scores):
    fixed_scores["scores"] = np.array([0.9] * N_SIG + [0.1] * N_BKG)
    harness.run(
        manifest_path=_manifest(tmp_path, [1.0] * (N_SIG + N_BKG)),
        label_col="is_signal", protect_col="mass", lambdas=[0.0, 1.0], out_dir=tmp_path,
    )
    text = (tmp_path / "report.json").read_text()
    assert "NaN" not in text
    r = json.loads(text)
    assert r["significance_method"] == "Asimov proxy, not a Wilks fit"
    for row in r["frontier"]:
        assert (row["b"], row["z_asimov"], row["jsd"]) == (0.0, None, None)
        assert row["delta_sigma"] is None and row["delta_jsd"] is None
    assert r["win_condition"]["result"] is False
    note = r["win_condition"]["note"]
    assert "Delta-sigma > 0: False. Delta-JSD <= 0: False." in note
    # False because undefined, and the note says so.
    assert "Delta-sigma undefined at lambda=1. Delta-JSD undefined at lambda=1." in note
    assert "b = 0, so Z_A(0) is null and JSD(0) is null." in note
    assert "| n/a | n/a | n/a | n/a |" in (tmp_path / "report.md").read_text()


# ---------------------------------------------------------------------------
# Cross-check against the core's benchmark report (vikshep_compute.bench_report)
# ---------------------------------------------------------------------------

def test_rows_match_the_core_report():
    """Train and score as the core's lambda sweep does (same configuration,
    train/eval split), then compare the harness's rows with the core's
    report.json.  The cut, s, b and efficiencies are pairwise sums of the same
    weights and match bit for bit; Z_A and JSD use Python's ln rather than the
    core's vikshep-detmath and agree to 1e-12."""
    vc = pytest.importorskip("vikshep_compute")
    train = vc.synthetic_dataset(600, 4, 7, 0)
    ev = vc.synthetic_dataset(600, 4, 7, 1)
    lambdas, epochs = [0.0, 1.0], 5
    core = json.loads(vc.bench_report(train, ev, lambdas=lambdas, lambda_star=1.0,
                                      epochs=epochs)["json"])
    bkg = ev["y"] == 0
    rows = []
    for lam, crow in zip(lambdas, core["frontier"]):
        model = vc.train_tag(train["x"], train["y"].astype(np.float64), w=train["w"],
                             m=train["m"], lam=lam, epochs=epochs)
        scores = np.asarray(model.predict(ev["x"]), dtype=np.float64)
        row = harness._evaluate_cut(scores, ev["y"], ev["w"], ev["m"])
        for key in ("threshold", "s", "b", "sig_eff", "bkg_eff"):
            assert row[key] == crow[key], key
        assert row["z_asimov"] == pytest.approx(crow["z_asimov"], rel=1e-12, abs=1e-15)
        assert row["jsd"] == pytest.approx(crow["jsd"], rel=1e-12, abs=1e-15)
        # The harness's dcorr2_heldout is this row's dcorr2_bkg (VDS-1 16.6).
        assert vc.dcorr2_w(scores[bkg], ev["m"][bkg], ev["w"][bkg]) == crow["dcorr2_bkg"]
        rows.append(row)
    wc = core["win_condition"]
    assert rows[1]["z_asimov"] - rows[0]["z_asimov"] == pytest.approx(wc["delta_sigma"], rel=1e-12)
    assert rows[1]["jsd"] - rows[0]["jsd"] == pytest.approx(wc["delta_jsd"], rel=1e-12)
