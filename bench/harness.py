"""
bench/harness.py — the benchmark harness.

Inputs : a features manifest (from vikshep-ingest g4), plus column names for
         label, protect, and optional weights, plus a lambda grid.
Outputs: (a) the Asimov significance proxy Z_A at a target signal efficiency,
         (b) the Jensen-Shannon divergence between the pre-cut and post-cut
             background histograms of the protected variable,
         (c) the lambda frontier table,
         (d) report.json + report.md stating Delta-sigma and Delta-JSD against
             the lambda=0 baseline, with the win condition evaluated honestly.

Statistics follow VDS-1 section 16 (vikshep-compute spec/VDS-1.md), with the
event weights (``weights_col``, default all 1) in every one of them:

  16.4  cut: signal events sorted by score descending (ties by index), their
        weights accumulated until the running sum reaches
        ``target_sig_eff * total signal weight``; the score reached is the
        threshold and every event with ``score >= threshold`` passes.  s and b
        are the weighted signal and background passing.
  16.5  Z_A = sqrt(2 * max((s + b) ln(1 + s/b) - s, 0)), undefined (null)
        when b <= 0.  An Asimov proxy, not a Wilks fit: a closed-form expected
        significance from the weighted counts of one cut, not a
        likelihood-ratio test.
  16.3  JSD in nats, in [0, ln 2]: ``n_bins`` (default 20) equal-width bins
        over the range of the pre-cut background protected variable, weighted
        histograms, no smoothing; undefined (null) when either histogram is
        empty, so also when no background event passes the cut.
  16.7  Delta-sigma = Z_A(lambda) - Z_A(0), Delta-JSD = JSD(lambda) - JSD(0);
        win = Delta-sigma > 0 AND Delta-JSD <= 0; undefined never wins.

Sums over events and bins are the pairwise sums of VDS-1 section 15.2, in
event order, so the cut, s and b equal the core's bit for bit on the same
scores; the logarithms are Python's ``math.log`` rather than the core's
vikshep-detmath, so Z_A and JSD can differ from the core's in the last bits.
This harness's report.json is not the core's canonical benchmark report
(section 16.7 also fixes canonical JSON, dataset and model OIDs and six-digit
Markdown); ``vikshep_compute.bench_report`` produces that one.

Held-out scores: every metric (AUC, dCorr^2, Z_A, JSD) is computed on
out-of-fold scores from seeded K-fold cross-validation stratified by label
(default 5 folds; vikshep_ingest.heldout, scheme vikshep.kfold/1): each event
is scored by a model that never saw it, as VDS-1 section 17.7 requires of the
benchmark ("train on the training set, score the evaluation set").  The
frontier also lists the training (in-sample) AUC and dCorr^2, labelled as
such, to show the gap.  ``dcorr2_heldout`` is section 16.6's ``dcorr2_bkg``:
the weighted dCorr^2 of the background scores and the protected variable.

Statistics backend: when vikshep_compute is installed (see
backend/ingest[scattering]), the harness uses vc.dcorr2_w (exact weighted
dCorr^2) and vc.train_tag (Adam, exact gradient) for all metrics.  When it
is not installed, the harness falls back to the pure-Python/NumPy
implementations in vikshep_ingest.cli._train and vikshep_ingest.disco.

Determinism: given the same manifest, seed and backend, this harness produces
byte-identical report.json.
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import numpy as np

from vikshep_ingest import heldout

try:
    import vikshep_compute as vc
    _VC_AVAILABLE = True
except ImportError:
    _VC_AVAILABLE = False


SIGNIFICANCE_METHOD = "Asimov proxy, not a Wilks fit"
DEFAULT_TARGET_SIG_EFF = 0.5
DEFAULT_N_BINS = 20


# ---------------------------------------------------------------------------
# Statistics (VDS-1 section 16)
# ---------------------------------------------------------------------------

def _psum(values) -> float:
    """Pairwise sum of VDS-1 section 15.2, in the order given.

    psum([]) = +0, psum([a]) = a,
    psum(a[0..n]) = psum(a[0..h]) + psum(a[h..n]) with h = floor(n / 2).
    """
    v = np.asarray(values, dtype=np.float64).tolist()

    def rec(lo: int, hi: int) -> float:
        n = hi - lo
        if n == 0:
            return 0.0
        if n == 1:
            return v[lo]
        h = lo + n // 2
        return rec(lo, h) + rec(h, hi)

    return rec(0, len(v))


def _bins(values: np.ndarray, lo: float, hi: float, n_bins: int) -> np.ndarray:
    """Bin index of each value (VDS-1 section 16.3).

    0 if hi <= lo; otherwise t = ((v - lo) / (hi - lo)) * n_bins, bin 0 when
    t <= 0, else min(floor(t), n_bins - 1).  Values equal to hi fall in the
    last bin.
    """
    v = np.asarray(values, dtype=np.float64)
    if hi <= lo:
        return np.zeros(v.shape, dtype=np.int64)
    t = ((v - lo) / (hi - lo)) * float(n_bins)
    out = np.zeros(v.shape, dtype=np.int64)
    pos = t > 0
    out[pos] = np.minimum(np.floor(t[pos]).astype(np.int64), n_bins - 1)
    return out


def _histogram(values: np.ndarray, weights: np.ndarray, lo: float, hi: float,
               n_bins: int) -> list[float]:
    """Weighted histogram: per bin, the pairwise sum of its events' weights in
    event order."""
    w = np.asarray(weights, dtype=np.float64)
    idx = _bins(values, lo, hi, n_bins)
    return [_psum(w[idx == k]) for k in range(n_bins)]


def _jsd(p_counts, q_counts) -> float | None:
    """Jensen-Shannon divergence of two histograms, in nats (VDS-1 section 16.3).

    P = p / psum(p), Q = q / psum(q), M = 0.5 (P + Q),
    KL(A || M) = psum_i(A_i == 0 ? 0 : A_i ln(A_i / M_i)),
    JSD = 0.5 KL(P || M) + 0.5 KL(Q || M), in [0, ln 2].
    None (undefined) when either histogram is empty (total weight not > 0).
    """
    p_counts = [float(x) for x in p_counts]
    q_counts = [float(x) for x in q_counts]
    if len(p_counts) != len(q_counts) or not p_counts:
        raise ValueError("histograms must be non-empty and equally binned")
    tp, tq = _psum(p_counts), _psum(q_counts)
    if not (tp > 0.0) or not (tq > 0.0):
        return None
    p = [x / tp for x in p_counts]
    q = [x / tq for x in q_counts]
    m = [0.5 * (a + b) for a, b in zip(p, q)]

    def kl(a: list[float]) -> float:
        return _psum([0.0 if ai == 0.0 else ai * math.log(ai / mi) for ai, mi in zip(a, m)])

    return 0.5 * kl(p) + 0.5 * kl(q)


def _jsd_bins(
    reference: np.ndarray,
    sample: np.ndarray,
    n_bins: int = DEFAULT_N_BINS,
    w_reference: np.ndarray | None = None,
    w_sample: np.ndarray | None = None,
) -> float | None:
    """JSD between the weighted histograms of ``reference`` (the pre-cut
    background protected variable) and ``sample`` (the post-cut one), binned
    over the range of ``reference`` (VDS-1 section 16.3).  None when either
    histogram is empty."""
    ref = np.asarray(reference, dtype=np.float64)
    smp = np.asarray(sample, dtype=np.float64)
    if n_bins < 1:
        raise ValueError("n_bins must be at least 1")
    if ref.size == 0 or not np.isfinite(ref).all():
        raise ValueError("binning needs a non-empty finite reference sample")
    w_ref = np.ones(ref.shape) if w_reference is None else np.asarray(w_reference, dtype=np.float64)
    w_smp = np.ones(smp.shape) if w_sample is None else np.asarray(w_sample, dtype=np.float64)
    lo, hi = float(ref.min()), float(ref.max())
    return _jsd(_histogram(ref, w_ref, lo, hi, n_bins), _histogram(smp, w_smp, lo, hi, n_bins))


def _cut_at_signal_efficiency(
    scores: np.ndarray,
    labels: np.ndarray,
    weights: np.ndarray,
    target: float = DEFAULT_TARGET_SIG_EFF,
) -> dict:
    """Cut at a target signal efficiency (VDS-1 section 16.4).

    Signal scores sorted descending, ties by ascending event index; their
    weights accumulated sequentially until the running sum reaches
    ``target * psum(signal weights)``; the score reached is the threshold.
    Every event with ``score >= threshold`` passes; s and b are the pairwise
    sums of passing weights in event order.
    """
    scores = np.asarray(scores, dtype=np.float64)
    weights = np.asarray(weights, dtype=np.float64)
    sig = np.asarray(labels) != 0
    if not (0.0 < target <= 1.0):
        raise ValueError("target signal efficiency must be in (0, 1]")
    if not sig.any() or sig.all():
        raise ValueError("need both signal and background events")
    sig_scores, sig_w = scores[sig], weights[sig]
    sig_total, bkg_total = _psum(sig_w), _psum(weights[~sig])
    if not (sig_total > 0.0) or not (bkg_total > 0.0):
        raise ValueError("signal and background weights must each have a positive total")
    order = np.argsort(-sig_scores, kind="stable")   # descending, ties by index
    goal = target * sig_total
    threshold = float(sig_scores[order[-1]])
    acc = 0.0
    for o, wo in zip(order.tolist(), sig_w[order].tolist()):
        acc += wo
        if acc >= goal:
            threshold = float(sig_scores[o])
            break
    passed = scores >= threshold
    s = _psum(weights[passed & sig])
    b = _psum(weights[passed & ~sig])
    return {
        "threshold": threshold,
        "s":         s,
        "b":         b,
        "sig_eff":   s / sig_total,
        "bkg_eff":   b / bkg_total,
        "passed":    passed,
    }


def _z_asimov(s: float, b: float) -> float | None:
    """Z_A = sqrt(2 * max((s + b) ln(1 + s/b) - s, 0)) for s >= 0, b > 0;
    None (undefined) otherwise (VDS-1 section 16.5).  Asimov proxy, not a
    Wilks fit."""
    if not (math.isfinite(s) and math.isfinite(b)) or b <= 0.0 or s < 0.0:
        return None
    inner = (s + b) * math.log(1.0 + s / b) - s
    return math.sqrt(2.0 * max(inner, 0.0))


def _evaluate_cut(
    scores: np.ndarray,
    labels: np.ndarray,
    weights: np.ndarray,
    protect: np.ndarray,
    target: float = DEFAULT_TARGET_SIG_EFF,
    n_bins: int = DEFAULT_N_BINS,
) -> dict:
    """The cut, Z_A and JSD of one frontier row (VDS-1 section 16.6)."""
    cut = _cut_at_signal_efficiency(scores, labels, weights, target)
    bkg = np.asarray(labels) == 0
    m = np.asarray(protect, dtype=np.float64)
    w = np.asarray(weights, dtype=np.float64)
    post = cut["passed"] & bkg
    jsd = _jsd_bins(m[bkg], m[post], n_bins, w[bkg], w[post]) if post.any() else None
    return {
        "threshold": cut["threshold"],
        "s":         cut["s"],
        "b":         cut["b"],
        "sig_eff":   cut["sig_eff"],
        "bkg_eff":   cut["bkg_eff"],
        "z_asimov":  _z_asimov(cut["s"], cut["b"]),
        "jsd":       jsd,
    }


def _diff(a: float | None, b: float | None) -> float | None:
    return None if a is None or b is None else a - b


# ---------------------------------------------------------------------------
# Main harness
# ---------------------------------------------------------------------------

def run(
    manifest_path:  str | Path,
    label_col:      str,
    protect_col:    str,
    weights_col:    str | None = None,
    lambdas:        list[float] | None = None,
    target_sig_eff: float = DEFAULT_TARGET_SIG_EFF,
    n_bins:         int   = DEFAULT_N_BINS,
    seed:           int   = 42,
    out_dir:        str | Path | None = None,
    folds:          int   = heldout.DEFAULT_FOLDS,
) -> dict:
    """Run the full benchmark harness on a manifest.

    Parameters
    ----------
    manifest_path  : path to manifest.json from vikshep-ingest g4.
    label_col      : aggregate column name for binary event label.
    protect_col    : aggregate column name for the protected variable.
    weights_col    : aggregate column name for event weights (optional; used
                     in training, the cut, Z_A, JSD and dCorr^2).
    lambdas        : DisCo lambda grid (default [0.0, 0.1, 1.0, 10.0]).
    target_sig_eff : signal efficiency of the cut (VDS-1 section 16.4).
    n_bins         : bins of the JSD histograms (VDS-1 section 16.3).
    seed           : seed of the fold assignment and of training.
    out_dir        : write report.json + report.md here.
    folds          : cross-validation folds for the held-out scores.

    Returns
    -------
    Full result dict (also written to out_dir if given).
    """
    if lambdas is None:
        lambdas = [0.0, 0.1, 1.0, 10.0]

    manifest = _load_manifest(manifest_path)
    aggregates = manifest.get("aggregates", [])
    if not aggregates:
        raise ValueError("Manifest contains no aggregates. Run vikshep-ingest g4 first.")

    agg_names = manifest.get("aggregate_names", sorted(aggregates[0].keys()))
    # Never train on the label, the protected variable, the weights or an event
    # column from the CSV (truth or bookkeeping): any of them leaks the answer.
    drop = set(manifest.get("event_column_names", [])) | {
        c for c in (label_col, protect_col, weights_col) if c
    }
    feat_names = [k for k in agg_names if k not in drop]
    X = np.array(
        [[ev.get(k, 0.0) for k in feat_names] for ev in aggregates],
        dtype=np.float32,
    )
    N = len(X)

    def _col(name: str) -> np.ndarray:
        if name not in aggregates[0]:
            raise ValueError(f"Column '{name}' not found in aggregates. Available: {agg_names}")
        return np.array([ev.get(name, 0.0) for ev in aggregates], dtype=np.float32)

    labels  = _col(label_col)
    protect = _col(protect_col)
    weights = _col(weights_col) if weights_col else np.ones(N, dtype=np.float32)
    if not np.isfinite(weights).all() or (weights < 0).any():
        raise ValueError(f"Weights '{weights_col}' must be finite and non-negative.")
    if not np.isfinite(protect).all():
        raise ValueError(f"Protected variable '{protect_col}' must be finite.")

    backend = "core" if _VC_AVAILABLE else "python"
    fits: dict[float, dict] = {}

    def _fit(lam: float) -> dict:
        if lam not in fits:
            fits[lam] = heldout.tag(X, labels, protect, weights, lam=lam, backend=backend,
                                    folds=folds, seed=seed)
        return fits[lam]

    def _row(lam: float) -> dict:
        return _evaluate_cut(_fit(lam)["heldout"]["scores"], labels, weights, protect,
                             target_sig_eff, n_bins)

    # Baseline: lambda = 0 (no decorrelation), out-of-fold scores
    base = _row(0.0)

    # Sweep lambda
    frontier: list[dict] = []
    for lam in lambdas:
        res = _fit(lam)
        row = _row(lam)
        frontier.append({
            "lambda":         lam,
            "auc_heldout":    res["heldout"]["auc"],
            "dcorr2_heldout": res["heldout"]["dcorr2"],
            "auc_train":      res["train"]["auc"],
            "dcorr2_train":   res["train"]["dcorr2"],
            **row,
            # VDS-1 section 16.7: both deltas are (value at lambda) - (value at
            # 0), so a cut that sculpts the protected variable less than the
            # baseline has Delta-JSD < 0.  None when either value is undefined.
            "delta_sigma":    _diff(row["z_asimov"], base["z_asimov"]),
            "delta_jsd":      _diff(row["jsd"], base["jsd"]),
        })

    n_train_min = min(r["n_train_min"] for r in fits.values())

    result = {
        "manifest":          str(manifest_path),
        "label_col":         label_col,
        "protect_col":       protect_col,
        "weights_col":       weights_col,
        "seed":              seed,
        "target_sig_eff":    target_sig_eff,
        "n_bins":            n_bins,
        "n_events":          N,
        "n_features":        int(X.shape[1]),
        "evaluation":        {
            "method":        "k-fold cross-validation; every metric on pooled out-of-fold scores",
            "split":         heldout.SPLIT_SCHEME,
            "folds":         folds,
            "seed":          seed,
            "stratified_by": label_col,
        },
        "warnings":          heldout.size_warnings(n_train_min, X.shape[1]),
        "z_asimov_baseline": base["z_asimov"],
        "jsd_baseline":      base["jsd"],
        "significance_method": SIGNIFICANCE_METHOD,
        "jsd_method":        (f"Jensen-Shannon divergence in nats of the weighted background "
                              f"'{protect_col}' histograms before and after the cut, "
                              f"{n_bins} bins over the pre-cut range"),
        "statistics_backend": "vikshep_compute" if _VC_AVAILABLE else "pure_python",
        "training_gradient": "exact_weighted" if _VC_AVAILABLE else "pearson_proxy",
        "frontier":          frontier,
        # Win condition: evaluated at the best lambda (highest delta_sigma with delta_jsd <= 0)
        "win_condition":     _evaluate_win(frontier, base),
    }

    if out_dir is not None:
        _write_reports(result, Path(out_dir))

    return result


def _evaluate_win(frontier: list[dict], base: dict | None = None) -> dict:
    """Win condition: Delta-sigma > 0 AND Delta-JSD <= 0 (VDS-1 section 16.7).

    Delta-sigma = Z_A(lambda) - Z_A(0) and Delta-JSD = JSD(lambda) - JSD(0):
    a win is more significance with no more sculpting than the lambda=0 cut.
    Evaluated at each lambda > 0; an undefined Delta-sigma or Delta-JSD never
    wins.  Report the best honest result; ``base`` is the lambda=0 row, used
    to explain an undefined baseline.
    """
    def _pos_sigma(e: dict) -> bool:
        return e["delta_sigma"] is not None and e["delta_sigma"] > 0

    def _jsd_ok(e: dict) -> bool:
        return e["delta_jsd"] is not None and e["delta_jsd"] <= 0

    swept = [e for e in frontier if e["lambda"] > 0]
    winners = [e for e in swept if _pos_sigma(e) and _jsd_ok(e)]
    if winners:
        best = max(winners, key=lambda e: e["delta_sigma"])
        return {
            "result":      True,
            "best_lambda": best["lambda"],
            "delta_sigma": best["delta_sigma"],
            "delta_jsd":   best["delta_jsd"],
            "note":        "Delta-sigma > 0 AND Delta-JSD <= 0 at lambda={:.1f}".format(best["lambda"]),
        }
    # Check partial conditions honestly
    any_pos_sigma = any(_pos_sigma(e) for e in swept)
    any_neg_jsd   = any(_jsd_ok(e) for e in swept)
    note = (
        f"Win condition NOT met. "
        f"Delta-sigma > 0: {any_pos_sigma}. "
        f"Delta-JSD <= 0: {any_neg_jsd}."
    )
    # An undefined difference is neither true nor false: say which ones, and why
    # when the lambda=0 baseline itself is undefined.
    for key, name in (("delta_sigma", "Delta-sigma"), ("delta_jsd", "Delta-JSD")):
        undef = [e["lambda"] for e in swept if e[key] is None]
        if undef:
            note += " {} undefined at lambda={}.".format(name, ", ".join(f"{l:g}" for l in undef))
    if base is not None and (base["z_asimov"] is None or base["jsd"] is None):
        note += (" The lambda=0 cut passes background weight b = {:g}, so Z_A(0) is {} and "
                 "JSD(0) is {}.").format(base["b"],
                                         "null" if base["z_asimov"] is None else "defined",
                                         "null" if base["jsd"] is None else "defined")
    return {
        "result":     False,
        "best_lambda": None,
        "delta_sigma": None,
        "delta_jsd":   None,
        "note":        note,
    }


def _load_manifest(path: str | Path) -> dict:
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"Manifest not found: {p}")
    with open(p) as f:
        return json.load(f)


def _write_reports(result: dict, out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)

    # report.json: an undefined statistic is null, never NaN.
    json_path = out_dir / "report.json"
    with open(json_path, "w") as f:
        json.dump(result, f, indent=2, allow_nan=False)
    print(f"  report.json written: {json_path}")

    # report.md
    md_path = out_dir / "report.md"
    with open(md_path, "w") as f:
        f.write(_render_md(result))
    print(f"  report.md  written: {md_path}")


def _render_md(r: dict) -> str:
    wc = r["win_condition"]
    win_str = "WIN" if wc["result"] else "NO WIN"
    weights = f"`{r['weights_col']}`" if r["weights_col"] else "none (all 1)"
    lines = [
        "# Vikshep Benchmark Report",
        "",
        f"**Manifest**: `{r['manifest']}`",
        f"**Label**: `{r['label_col']}` | **Protected variable**: `{r['protect_col']}` | "
        f"**Weights**: {weights}",
        f"**Events**: {r['n_events']} | **Features**: {r['n_features']}",
        f"**Significance method**: {r['significance_method']}",
        f"**Cut**: signal efficiency {r['target_sig_eff']} (VDS-1 section 16.4)",
        f"**JSD**: {r['jsd_method']} (VDS-1 section 16.3)",
        f"**Evaluation**: {r['evaluation']['folds']}-fold cross-validation stratified by "
        f"`{r['evaluation']['stratified_by']}`, seed {r['evaluation']['seed']} "
        f"({r['evaluation']['split']}); every metric is on out-of-fold scores.",
        "",
    ]
    lines += [f"> WARNING: {w}" for w in r["warnings"]]
    lines += [
        "",
        "## Baseline (lambda=0, no DisCo)",
        "",
        f"- Z_A (Asimov proxy, not a Wilks fit): {_fmt(r['z_asimov_baseline'])}",
        f"- JSD(background `{r['protect_col']}` before the cut, after the cut): "
        f"{_fmt(r['jsd_baseline'])}",
        "",
        "## Lambda frontier",
        "",
        "| lambda | AUC held-out | dCorr^2 held-out (bkg) | AUC training | threshold | "
        "signal eff. | bkg eff. | Z_A | JSD | Delta-sigma | Delta-JSD |",
        "|--------|--------------|------------------------|--------------|-----------|"
        "-------------|----------|-----|-----|-------------|-----------|",
    ]
    for e in r["frontier"]:
        lines.append(
            f"| {e['lambda']:.1f} | {_fmt(e['auc_heldout'])} | {_fmt(e['dcorr2_heldout'])} | "
            f"{_fmt(e['auc_train'])} | {_fmt(e['threshold'])} | {_fmt(e['sig_eff'])} | "
            f"{_fmt(e['bkg_eff'])} | {_fmt(e['z_asimov'])} | {_fmt(e['jsd'])} | "
            f"{_fmt(e['delta_sigma'], sign=True)} | {_fmt(e['delta_jsd'], sign=True)} |"
        )
    lines += [
        "",
        "Delta-sigma = Z_A(lambda) - Z_A(0) and Delta-JSD = JSD(lambda) - JSD(0)",
        "(VDS-1 section 16.7). A negative Delta-JSD means the cut sculpts the protected",
        "variable less than the lambda=0 cut does.",
        "",
        "## Win condition: Delta-sigma > 0 AND Delta-JSD <= 0",
        "",
        f"**Result: {win_str}**",
        "",
        f"{wc['note']}",
        "",
        "> Note: Z_A = sqrt(2((s+b) ln(1+s/b) - s)) from the weighted signal s and",
        "> background b passing the cut is an Asimov proxy, not a Wilks fit.  A Wilks",
        "> fit requires an unbinned likelihood model and is a manual TODO when that",
        "> machinery is available.",
        "",
    ]
    return "\n".join(lines) + "\n"


def _fmt(v: float | None, sign: bool = False) -> str:
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return "n/a"
    return f"{v:+.4f}" if sign else f"{v:.4f}"
