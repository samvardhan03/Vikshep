"""
cli/recipe.py — entry point for `vikshep-recipe tag` and `vikshep-recipe calibrate`.

Usage
-----
    vikshep-recipe tag       --features manifest.json --label <col> --protect <col>
                              [--weights <col>] [--lambda <float>]
                              [--feature-set {scattering,aggregates,both}]
                              [--folds K] [--seed S] [--out dir]
    vikshep-recipe calibrate --features manifest.json --target <col>
                              [--feature-set {scattering,aggregates,both}]
                              [--folds K] [--seed S] [--out dir]

Held-out metrics
----------------
The headline metrics (``auc_heldout``, ``dcorr2_heldout``, ``r2_heldout``,
``residual_std_heldout``) come from seeded K-fold cross-validation (default
5 folds, seed 42; tag folds are stratified by label): every event is scored
by a model fit on the other folds.  The ``*_train`` values score a model on
the events it was fit on and are reported only to show the gap; with many
features and few events they approach 1 even on noise.  The report warns when
the training folds hold fewer than 10 events per feature.  See
vikshep_ingest.heldout for the fold scheme.

Feature sets
------------
scattering  (default when vikshep_compute is installed)
    Loads the 64×64 (phi×theta) rasterized grids from shared memory (or
    re-rasterizes from the source CSV if the segments are gone), runs the
    wavelet scattering transform via vikshep_compute, and trains on the
    log-mean scattering fingerprint + spatially-averaged r2 ratios.
    Training uses the exact weighted dCorr^2 gradient from the core.
    Writes provenance.json (VDS-1 schema) next to the report.

aggregates  (default when vikshep_compute is not installed)
    Trains on the per-event aggregate scalars from the manifest.
    Training uses the Pearson-correlation proxy for the DisCo gradient.

both
    Concatenates scattering features with aggregate scalars.

The report always states which feature set and training gradient were used,
in the `feature_set` and `training_gradient` fields, and how the held-out
metrics were made, in `evaluation`.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np

from vikshep_ingest import heldout
from vikshep_ingest.scattering import scatter_available


# ── Feature-set auto-selection ────────────────────────────────────────────────

def _resolve_feature_set(requested: str) -> str:
    """Resolve 'auto' to 'scattering' or 'aggregates' based on availability."""
    if requested != "auto":
        if requested == "scattering" and not scatter_available():
            print(
                "WARNING: --feature-set scattering requested but vikshep_compute "
                "is not installed.  Falling back to aggregates.",
                file=sys.stderr,
            )
            return "aggregates"
        return requested
    if scatter_available():
        return "scattering"
    print(
        "Notice: vikshep_compute not installed — using aggregates feature set. "
        "Install with: pip install vikshep-compute",
        file=sys.stderr,
    )
    return "aggregates"


# ── Subcommand: tag ───────────────────────────────────────────────────────────

def _cmd_tag(args: argparse.Namespace) -> int:
    manifest = _load_manifest(args.features)
    feature_set = _resolve_feature_set(args.feature_set)

    N = manifest.get("n_events", 0)
    if N == 0:
        print("ERROR: manifest contains no events. Run vikshep-ingest g4 first.", file=sys.stderr)
        return 1

    aggregates = manifest.get("aggregates", [])
    if not aggregates:
        print("ERROR: manifest contains no aggregates.", file=sys.stderr)
        return 1

    agg_names = manifest.get("aggregate_names", sorted(aggregates[0].keys()))
    feat_names = _feature_names(manifest, agg_names, args.label, args.protect, args.weights)

    labels = _extract_col(aggregates, args.label, N)
    if labels is None:
        print(f"ERROR: label column '{args.label}' not found.", file=sys.stderr)
        print(f"  Available: {agg_names}", file=sys.stderr)
        return 1

    protect = _extract_col(aggregates, args.protect, N)
    if protect is None:
        print(f"ERROR: protect column '{args.protect}' not found.", file=sys.stderr)
        return 1

    weights: np.ndarray
    if args.weights:
        w = _extract_col(aggregates, args.weights, N)
        if w is None:
            print(f"ERROR: weights column '{args.weights}' not found.", file=sys.stderr)
            return 1
        weights = w
    else:
        weights = np.ones(N, dtype=np.float64)

    lam = args.lam
    out_dir = Path(args.out) if args.out else Path(args.features).parent
    out_dir.mkdir(parents=True, exist_ok=True)

    prov_json: str | None = None

    if feature_set in ("scattering", "both"):
        try:
            X, prov_json = _scattering_matrix(args.features, manifest, aggregates, feat_names, feature_set)
        except Exception as exc:
            print(f"ERROR loading scattering features: {exc}", file=sys.stderr)
            return 1
        training_gradient = "exact_weighted"
        backend = "core"
    else:
        X = _aggregate_matrix(aggregates, feat_names, np.float32)
        training_gradient = "pearson_proxy"
        backend = "python"

    try:
        result = heldout.tag(X, labels, protect, weights, lam=lam, backend=backend,
                             folds=args.folds, seed=args.seed)
    except ValueError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    warnings = heldout.size_warnings(result["n_train_min"], X.shape[1])

    if prov_json is not None:
        _write_file(out_dir / "provenance.json", prov_json)

    report = {
        "recipe":            "tag",
        "feature_set":       feature_set,
        "lambda":            lam,
        "auc_heldout":       result["heldout"]["auc"],
        "dcorr2_heldout":    result["heldout"]["dcorr2"],
        "auc_train":         result["train"]["auc"],
        "dcorr2_train":      result["train"]["dcorr2"],
        "training_gradient": training_gradient,
        "reported_dcorr2":   "exact_weighted",
        "evaluation":        heldout.evaluation_record(args.folds, args.seed,
                                                       result["heldout"]["folds"], args.label),
        "n_events":          N,
        "n_features":        int(X.shape[1]),
        "warnings":          warnings,
        "label_col":         args.label,
        "protect_col":       args.protect,
        "weights_col":       args.weights,
        "feature_names":     feat_names if feature_set == "aggregates" else None,
    }
    _write_json(out_dir / "tag_report.json", report)
    _print_tag_report(report)
    _print_warnings(warnings)
    return 0


def _cmd_calibrate(args: argparse.Namespace) -> int:
    manifest = _load_manifest(args.features)
    feature_set = _resolve_feature_set(args.feature_set)

    N = manifest.get("n_events", 0)
    aggregates = manifest.get("aggregates", [])
    if not aggregates:
        print("ERROR: manifest contains no aggregates.", file=sys.stderr)
        return 1

    agg_names = manifest.get("aggregate_names", sorted(aggregates[0].keys()))
    feat_names = _feature_names(manifest, agg_names, args.target)

    target = _extract_col(aggregates, args.target, N)
    if target is None:
        print(f"ERROR: target column '{args.target}' not found.", file=sys.stderr)
        return 1

    out_dir = Path(args.out) if args.out else Path(args.features).parent
    out_dir.mkdir(parents=True, exist_ok=True)

    prov_json: str | None = None

    if feature_set in ("scattering", "both"):
        try:
            X, prov_json = _scattering_matrix(args.features, manifest, aggregates, feat_names, feature_set)
        except Exception as exc:
            print(f"ERROR loading scattering features: {exc}", file=sys.stderr)
            return 1
        backend = "core"
    else:
        X = _aggregate_matrix(aggregates, feat_names, np.float32)
        backend = "python"

    try:
        result = heldout.calibrate(X, target, backend=backend, folds=args.folds, seed=args.seed)
    except ValueError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    warnings = heldout.size_warnings(result["n_train_min"], X.shape[1])

    if prov_json is not None:
        _write_file(out_dir / "provenance.json", prov_json)

    report = {
        "recipe":               "calibrate",
        "feature_set":          feature_set,
        "target_col":           args.target,
        "r2_heldout":           result["heldout"]["r2"],
        "residual_std_heldout": result["heldout"]["residual_std"],
        "r2_train":             result["train"]["r2"],
        "residual_std_train":   result["train"]["residual_std"],
        "evaluation":           heldout.evaluation_record(args.folds, args.seed,
                                                          result["heldout"]["folds"], None),
        "n_events":             N,
        "n_features":           int(X.shape[1]),
        "warnings":             warnings,
        "feature_names":        feat_names if feature_set == "aggregates" else None,
    }
    _write_json(out_dir / "calibrate_report.json", report)
    _print_calibrate_report(report)
    _print_warnings(warnings)
    return 0


# ── Feature matrices ──────────────────────────────────────────────────────────

def _aggregate_matrix(aggregates: list[dict], feat_names: list[str], dtype) -> np.ndarray:
    return np.array([[ev.get(k, 0.0) for k in feat_names] for ev in aggregates], dtype=dtype)


def _scattering_matrix(
    features_path: str,
    manifest: dict,
    aggregates: list[dict],
    feat_names: list[str],
    feature_set: str,
) -> tuple[np.ndarray, str]:
    """Scattering features (plus the aggregates for --feature-set both) and the
    provenance JSON of the scattering run."""
    from vikshep_ingest.scattering import extract_scattering_features
    s_features, _, prov_json = extract_scattering_features(
        manifest, cache_dir=Path(features_path).parent
    )
    if feature_set == "both":
        X = np.concatenate([s_features, _aggregate_matrix(aggregates, feat_names, np.float64)], axis=1)
    else:
        X = s_features
    return X, prov_json


# ── Helpers ───────────────────────────────────────────────────────────────────

def _load_manifest(path_str: str) -> dict:
    p = Path(path_str)
    if not p.exists():
        print(f"ERROR: manifest not found: {p}", file=sys.stderr)
        sys.exit(1)
    with open(p) as f:
        return json.load(f)


def _feature_names(manifest: dict, agg_names: list[str], *named: str | None) -> list[str]:
    """Aggregate columns used as features.  Never an event column from the CSV
    (truth or bookkeeping such as is_signal, true_energy, weight) and never a
    column named as --label, --protect, --weights or --target: either would put
    the answer, or the variable to stay independent of, into the inputs."""
    drop = set(manifest.get("event_column_names", [])) | {c for c in named if c}
    return [k for k in agg_names if k not in drop]


def _extract_col(aggregates: list[dict], col: str, N: int) -> np.ndarray | None:
    if col not in aggregates[0]:
        return None
    return np.array([ev.get(col, 0.0) for ev in aggregates], dtype=np.float64)


def _write_json(path: Path, data: dict) -> None:
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"  Report written: {path}")


def _write_file(path: Path, content: str) -> None:
    with open(path, "w") as f:
        f.write(content)
    print(f"  Provenance written: {path}")


def _fmt(v: float | None) -> str:
    return "n/a" if v is None else f"{v:.4f}"


def _evaluation_note(ev: dict) -> str:
    strat = f", stratified by {ev['stratified_by']}" if ev["stratified_by"] else ""
    return f"({ev['folds']}-fold cross-validation{strat}, seed {ev['seed']})"


def _print_tag_report(r: dict) -> None:
    print("vikshep-recipe tag")
    print(f"  feature_set       : {r['feature_set']}")
    print(f"  lambda            : {r['lambda']}")
    print(f"  AUC, held-out     : {_fmt(r['auc_heldout'])}  {_evaluation_note(r['evaluation'])}")
    print(f"  dCorr^2, held-out : {_fmt(r['dcorr2_heldout'])}  (lower = better decorrelation)")
    print(f"  AUC, training     : {_fmt(r['auc_train'])}  (in-sample: scored on the events it was fit on)")
    print(f"  dCorr^2, training : {_fmt(r['dcorr2_train'])}")
    print(f"  training_gradient : {r['training_gradient']}")
    print(f"  reported_dcorr2   : {r['reported_dcorr2']}")
    print(f"  n_events          : {r['n_events']}")
    print(f"  n_features        : {r['n_features']}")


def _print_calibrate_report(r: dict) -> None:
    print("vikshep-recipe calibrate")
    print(f"  feature_set            : {r['feature_set']}")
    print(f"  target                 : {r['target_col']}")
    print(f"  R^2, held-out          : {_fmt(r['r2_heldout'])}  {_evaluation_note(r['evaluation'])}")
    print(f"  residual std, held-out : {_fmt(r['residual_std_heldout'])}")
    print(f"  R^2, training          : {_fmt(r['r2_train'])}  (in-sample: scored on the events it was fit on)")
    print(f"  residual std, training : {_fmt(r['residual_std_train'])}")
    print(f"  n_events               : {r['n_events']}")
    print(f"  n_features             : {r['n_features']}")


def _print_warnings(warnings: list[str]) -> None:
    for w in warnings:
        print(f"WARNING: {w}", file=sys.stderr)


# ── Argument parsing ──────────────────────────────────────────────────────────

def _add_eval_args(p: argparse.ArgumentParser) -> None:
    p.add_argument("--folds", type=int, default=heldout.DEFAULT_FOLDS,
                   help=f"Cross-validation folds for the held-out metrics "
                        f"(default: {heldout.DEFAULT_FOLDS}, at least 2).")
    p.add_argument("--seed", type=int, default=heldout.DEFAULT_SEED,
                   help=f"Seed of the fold assignment and of training "
                        f"(default: {heldout.DEFAULT_SEED}).")


def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="vikshep-recipe",
        description="Execute analysis recipes on a vikshep-ingest manifest.",
    )
    sub = p.add_subparsers(dest="command", required=True)

    # tag
    tag_p = sub.add_parser("tag", help="Particle classification with DisCo decorrelation.")
    tag_p.add_argument("--features",     required=True, help="Path to manifest.json.")
    tag_p.add_argument("--label",        required=True, help="Aggregate column for binary label.")
    tag_p.add_argument("--protect",      required=True, help="Aggregate column for protected variable.")
    tag_p.add_argument("--weights",      default=None,  help="Aggregate column for event weights.")
    tag_p.add_argument("--lambda",       type=float, default=1.0, dest="lam",
                       help="DisCo decorrelation strength (default: 1.0).")
    tag_p.add_argument("--feature-set",  default="auto",
                       choices=["auto", "scattering", "aggregates", "both"],
                       dest="feature_set",
                       help="Feature set to train on (default: auto — scattering when "
                            "vikshep_compute is installed, else aggregates).")
    _add_eval_args(tag_p)
    tag_p.add_argument("--out",          default=None, help="Output directory.")

    # calibrate
    cal_p = sub.add_parser("calibrate", help="Detector calibration regression.")
    cal_p.add_argument("--features",    required=True, help="Path to manifest.json.")
    cal_p.add_argument("--target",      required=True, help="Aggregate column for calibration target.")
    cal_p.add_argument("--feature-set", default="auto",
                       choices=["auto", "scattering", "aggregates", "both"],
                       dest="feature_set",
                       help="Feature set to train on (default: auto).")
    _add_eval_args(cal_p)
    cal_p.add_argument("--out",         default=None, help="Output directory.")

    return p


def main(argv: list[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)
    if args.command == "tag":
        return _cmd_tag(args)
    if args.command == "calibrate":
        return _cmd_calibrate(args)
    parser.print_help()
    return 1


if __name__ == "__main__":
    sys.exit(main())
