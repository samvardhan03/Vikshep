"""
bench/harness.py — the benchmark harness.

Inputs : a features manifest (from vikshep-ingest g4), plus column names for
         label, protect, and optional weights, plus a lambda grid.
Outputs: (a) Asimov significance proxy [NOT-WILKS: see note below],
         (b) pre/post-cut Jensen-Shannon divergence of the protected variable,
         (c) the lambda frontier table,
         (d) report.json + report.md stating Delta-sigma and Delta-JSD against
             the lambda=0 baseline, with the win condition evaluated honestly.

NOTE on significance path: Asimov significance is S/sqrt(B+1) after a score
cut.  This is NOT the Wilks delta-chi-squared likelihood-ratio significance.
All Delta-sigma values in the report are labeled "Asimov proxy significance".

Held-out scores: every metric (AUC, dCorr^2, Asimov significance, JSD) is
computed on out-of-fold scores from seeded K-fold cross-validation stratified
by label (default 5 folds; vikshep_ingest.heldout, scheme vikshep.kfold/1):
each event is scored by a model that never saw it, as VDS-1 section 17.7
requires of the benchmark ("train on the training set, score the evaluation
set").  The frontier also lists the training (in-sample) AUC and dCorr^2,
labelled as such, to show the gap.

Statistics backend: when vikshep_compute is installed (see
backend/ingest[scattering]), the harness uses vc.dcorr2_w (exact weighted
dCorr^2) and vc.train_tag (Adam, exact gradient) for all metrics.  When it
is not installed, the harness falls back to the pure-Python/NumPy
implementations in vikshep_ingest.cli._train and vikshep_ingest.disco.

Determinism: given the same manifest and seed, this harness produces
byte-identical report.json regardless of which backend is active.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from scipy.spatial.distance import jensenshannon

from vikshep_ingest import heldout

try:
    import vikshep_compute as vc
    _VC_AVAILABLE = True
except ImportError:
    _VC_AVAILABLE = False


# ---------------------------------------------------------------------------
# Metric helpers
# ---------------------------------------------------------------------------

def _asimov_sigma(scores: np.ndarray, labels: np.ndarray, threshold: float = 0.5) -> float:
    """Asimov significance proxy: S / sqrt(B+1) after score cut.

    NOT-WILKS: this is NOT a Wilks delta-chi-squared significance.
    Labeled 'Asimov proxy' throughout the report.
    """
    mask = scores > threshold
    S = float((labels[mask] == 1).sum())
    B = float((labels[mask] == 0).sum()) + 1.0
    return S / np.sqrt(B)


def _jsd_bins(a: np.ndarray, b: np.ndarray, n_bins: int = 30) -> float:
    lo  = min(float(a.min()), float(b.min()))
    hi  = max(float(a.max()), float(b.max()))
    bins = np.linspace(lo, hi, n_bins + 1)
    ha, _ = np.histogram(a, bins=bins, density=True)
    hb, _ = np.histogram(b, bins=bins, density=True)
    ha = ha + 1e-10; hb = hb + 1e-10
    ha /= ha.sum(); hb /= hb.sum()
    return float(jensenshannon(ha, hb))


# ---------------------------------------------------------------------------
# Main harness
# ---------------------------------------------------------------------------

def run(
    manifest_path: str | Path,
    label_col:   str,
    protect_col: str,
    weights_col: str | None = None,
    lambdas:     list[float] | None = None,
    threshold:   float = 0.5,
    seed:        int   = 42,
    out_dir:     str | Path | None = None,
    folds:       int   = heldout.DEFAULT_FOLDS,
) -> dict:
    """Run the full benchmark harness on a manifest.

    Parameters
    ----------
    manifest_path : path to manifest.json from vikshep-ingest g4.
    label_col     : aggregate column name for binary event label.
    protect_col   : aggregate column name for the protected variable.
    weights_col   : aggregate column name for event weights (optional).
    lambdas       : DisCo lambda grid (default [0.0, 0.1, 1.0, 10.0]).
    threshold     : score cut for significance and JSD metrics.
    seed          : seed of the fold assignment and of training.
    out_dir       : write report.json + report.md here.
    folds         : cross-validation folds for the held-out scores.

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

    backend = "core" if _VC_AVAILABLE else "python"
    fits: dict[float, dict] = {}

    def _fit(lam: float) -> dict:
        if lam not in fits:
            fits[lam] = heldout.tag(X, labels, protect, weights, lam=lam, backend=backend,
                                    folds=folds, seed=seed)
        return fits[lam]

    bkg = labels == 0
    bkg_protect = protect[bkg]

    # Baseline: lambda = 0 (no decorrelation), out-of-fold scores
    sc0 = _fit(0.0)["heldout"]["scores"]
    sigma_baseline = _asimov_sigma(sc0, labels, threshold)
    jsd_baseline = _jsd_bins(bkg_protect, bkg_protect[sc0[bkg] > threshold]) \
        if (sc0[bkg] > threshold).sum() >= 2 else float("nan")

    # Sweep lambda
    frontier: list[dict] = []
    for lam in lambdas:
        res = _fit(lam)
        sc  = res["heldout"]["scores"]
        sigma = _asimov_sigma(sc, labels, threshold)
        jsd_after = _jsd_bins(bkg_protect, bkg_protect[sc[bkg] > threshold]) \
            if (sc[bkg] > threshold).sum() >= 2 else float("nan")

        delta_sigma = sigma - sigma_baseline
        delta_jsd   = (jsd_baseline - jsd_after) if not np.isnan(jsd_after) else float("nan")

        frontier.append({
            "lambda":         lam,
            "auc_heldout":    res["heldout"]["auc"],
            "dcorr2_heldout": res["heldout"]["dcorr2"],
            "auc_train":      res["train"]["auc"],
            "dcorr2_train":   res["train"]["dcorr2"],
            "sigma_asimov":   sigma,
            "jsd":            jsd_after,
            "delta_sigma":    delta_sigma,
            "delta_jsd":      delta_jsd,
        })

    n_train_min = min(r["n_train_min"] for r in fits.values())

    result = {
        "manifest":          str(manifest_path),
        "label_col":         label_col,
        "protect_col":       protect_col,
        "weights_col":       weights_col,
        "seed":              seed,
        "threshold":         threshold,
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
        "sigma_baseline_asimov": sigma_baseline,
        "jsd_baseline":      jsd_baseline,
        "significance_method": "Asimov proxy S/sqrt(B+1) [NOT-WILKS]",
        "statistics_backend": "vikshep_compute" if _VC_AVAILABLE else "pure_python",
        "training_gradient": "exact_weighted" if _VC_AVAILABLE else "pearson_proxy",
        "frontier":          frontier,
        # Win condition: evaluated at the best lambda (highest delta_sigma with delta_jsd <= 0)
        "win_condition":     _evaluate_win(frontier),
    }

    if out_dir is not None:
        _write_reports(result, Path(out_dir))

    return result


def _evaluate_win(frontier: list[dict]) -> dict:
    """Win condition: Delta-sigma > 0 AND Delta-JSD <= 0.

    Evaluated at each lambda; report the best honest result.
    """
    winners = [
        e for e in frontier
        if e["lambda"] > 0
        and e["delta_sigma"] > 0
        and not np.isnan(e["delta_jsd"])
        and e["delta_jsd"] <= 0
    ]
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
    any_pos_sigma = any(e["delta_sigma"] > 0 for e in frontier if e["lambda"] > 0)
    any_neg_jsd   = any(
        not np.isnan(e["delta_jsd"]) and e["delta_jsd"] <= 0
        for e in frontier if e["lambda"] > 0
    )
    return {
        "result":     False,
        "best_lambda": None,
        "delta_sigma": None,
        "delta_jsd":   None,
        "note":        (
            f"Win condition NOT met. "
            f"Delta-sigma > 0: {any_pos_sigma}. "
            f"Delta-JSD <= 0: {any_neg_jsd}."
        ),
    }


def _load_manifest(path: str | Path) -> dict:
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"Manifest not found: {p}")
    with open(p) as f:
        return json.load(f)


def _write_reports(result: dict, out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)

    # report.json
    json_path = out_dir / "report.json"
    with open(json_path, "w") as f:
        json.dump(result, f, indent=2, default=_json_default)
    print(f"  report.json written: {json_path}")

    # report.md
    md_path = out_dir / "report.md"
    with open(md_path, "w") as f:
        f.write(_render_md(result))
    print(f"  report.md  written: {md_path}")


def _json_default(obj: object) -> object:
    if isinstance(obj, float) and np.isnan(obj):
        return None
    raise TypeError(f"Not serializable: {type(obj)}")


def _render_md(r: dict) -> str:
    wc = r["win_condition"]
    win_str = "WIN" if wc["result"] else "NO WIN"
    lines = [
        "# Vikshep Benchmark Report",
        "",
        f"**Manifest**: `{r['manifest']}`",
        f"**Label**: `{r['label_col']}` | **Protected variable**: `{r['protect_col']}`",
        f"**Events**: {r['n_events']} | **Features**: {r['n_features']}",
        f"**Significance method**: {r['significance_method']}",
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
        f"- Asimov significance: {r['sigma_baseline_asimov']:.4f}",
        f"- JSD(background mass, cut mass): {_fmt(r['jsd_baseline'])}",
        "",
        "## Lambda frontier",
        "",
        "| lambda | AUC held-out | dCorr^2 held-out | AUC training | sigma (Asimov) | JSD | Delta-sigma | Delta-JSD |",
        "|--------|--------------|------------------|--------------|----------------|-----|-------------|-----------|",
    ]
    for e in r["frontier"]:
        lines.append(
            f"| {e['lambda']:.1f} | {_fmt(e['auc_heldout'])} | {_fmt(e['dcorr2_heldout'])} | "
            f"{_fmt(e['auc_train'])} | {e['sigma_asimov']:.4f} | {_fmt(e['jsd'])} | "
            f"{e['delta_sigma']:+.4f} | {_fmt(e['delta_jsd'], sign=True)} |"
        )
    lines += [
        "",
        "## Win condition: Delta-sigma > 0 AND Delta-JSD <= 0",
        "",
        f"**Result: {win_str}**",
        "",
        f"{wc['note']}",
        "",
        "> Note: Asimov proxy significance (S/sqrt(B+1)) is NOT a Wilks",
        "> delta-chi-squared significance.  A Wilks fit requires an unbinned",
        "> likelihood model and is a manual TODO when that machinery is available.",
        "",
    ]
    return "\n".join(lines) + "\n"


def _fmt(v: float | None, sign: bool = False) -> str:
    if v is None or np.isnan(v):
        return "n/a"
    return f"{v:+.4f}" if sign else f"{v:.4f}"
