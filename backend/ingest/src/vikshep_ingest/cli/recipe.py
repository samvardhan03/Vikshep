"""
cli/recipe.py — entry point for `vikshep-recipe tag` and `vikshep-recipe calibrate`.

Usage
-----
    vikshep-recipe tag       --features manifest.json --label <col> --protect <col>
                              [--weights <col>] [--lambda <float>]
                              [--feature-set {scattering,aggregates,both}] [--out dir]
    vikshep-recipe calibrate --features manifest.json --target <col>
                              [--feature-set {scattering,aggregates,both}] [--out dir]

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
in the `feature_set` and `training_gradient` fields.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np

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
        "Install with: pip install maturin && "
        'pip install -e "backend/ingest[scattering]"',
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
        from vikshep_ingest.scattering import extract_scattering_features
        try:
            s_features, _, prov_json = extract_scattering_features(manifest)
        except Exception as exc:
            print(f"ERROR loading scattering features: {exc}", file=sys.stderr)
            return 1
        if feature_set == "both":
            agg_X = np.array(
                [[ev.get(k, 0.0) for k in agg_names] for ev in aggregates],
                dtype=np.float64,
            )
            X = np.concatenate([s_features, agg_X], axis=1)
        else:
            X = s_features
        training_gradient = "exact_weighted"
        result = _train_tag_core(X, labels, protect, weights, lam)
    else:
        X = np.array(
            [[ev.get(k, 0.0) for k in agg_names] for ev in aggregates],
            dtype=np.float32,
        )
        training_gradient = "pearson_proxy"
        from vikshep_ingest.cli._train import train_tag
        result = train_tag(X, labels.astype(np.float32), protect, weights.astype(np.float32), lam=lam)

    if prov_json is not None:
        _write_file(out_dir / "provenance.json", prov_json)

    report = {
        "recipe":            "tag",
        "feature_set":       feature_set,
        "lambda":            lam,
        "auc":               result["auc"],
        "dcorr2":            result["dcorr2_final"],
        "training_gradient": training_gradient,
        "reported_dcorr2":   "exact_weighted",
        "n_events":          N,
        "label_col":         args.label,
        "protect_col":       args.protect,
        "weights_col":       args.weights,
        "feature_names":     agg_names if feature_set == "aggregates" else None,
    }
    _write_json(out_dir / "tag_report.json", report)
    _print_tag_report(report)
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

    target = _extract_col(aggregates, args.target, N)
    if target is None:
        print(f"ERROR: target column '{args.target}' not found.", file=sys.stderr)
        return 1

    out_dir = Path(args.out) if args.out else Path(args.features).parent
    out_dir.mkdir(parents=True, exist_ok=True)

    prov_json: str | None = None

    if feature_set in ("scattering", "both"):
        from vikshep_ingest.scattering import extract_scattering_features
        try:
            s_features, _, prov_json = extract_scattering_features(manifest)
        except Exception as exc:
            print(f"ERROR loading scattering features: {exc}", file=sys.stderr)
            return 1
        if feature_set == "both":
            agg_X = np.array(
                [[ev.get(k, 0.0) for k in agg_names] for ev in aggregates],
                dtype=np.float64,
            )
            X = np.concatenate([s_features, agg_X], axis=1)
        else:
            X = s_features
        result = _calibrate_core(X, target.astype(np.float64))
    else:
        X = np.array(
            [[ev.get(k, 0.0) for k in agg_names] for ev in aggregates],
            dtype=np.float32,
        )
        from vikshep_ingest.cli._train import train_calibrate
        result = train_calibrate(X, target)

    if prov_json is not None:
        _write_file(out_dir / "provenance.json", prov_json)

    report = {
        "recipe":        "calibrate",
        "feature_set":   feature_set,
        "target_col":    args.target,
        "r2_score":      result["r2_score"],
        "residual_std":  result["residual_std"],
        "n_events":      N,
        "feature_names": agg_names if feature_set == "aggregates" else None,
    }
    _write_json(out_dir / "calibrate_report.json", report)
    _print_calibrate_report(report)
    return 0


# ── Core-backed training helpers ──────────────────────────────────────────────

def _train_tag_core(
    X: np.ndarray,
    labels: np.ndarray,
    protect: np.ndarray,
    weights: np.ndarray,
    lam: float,
) -> dict:
    """Train tag head via vikshep_compute (exact weighted dCorr^2 gradient)."""
    import vikshep_compute as vc
    # vc.train_tag requires 0/1 labels; binarize if necessary (nonzero → 1).
    bin_labels = labels.astype(np.float64)
    if not np.all(np.isin(np.unique(labels), [0, 1, 0.0, 1.0])):
        bin_labels = (labels != 0).astype(np.float64)
    model = vc.train_tag(
        X.astype(np.float64),
        bin_labels,
        w=weights.astype(np.float64),
        m=protect.astype(np.float64),
        lam=lam,
        gradient="exact",
        seed=42,
    )
    scores = model.predict(X.astype(np.float64))
    bkg = labels == 0
    dc2 = 0.0
    if bkg.sum() >= 4:
        dc2 = float(vc.dcorr2_w(
            scores[bkg].astype(np.float64),
            protect[bkg].astype(np.float64),
            weights[bkg].astype(np.float64),
        ))
    try:
        from sklearn.metrics import roc_auc_score
        auc = float(roc_auc_score(bin_labels.astype(int), scores))
    except Exception:
        auc = float("nan")
    return {"auc": auc, "dcorr2_final": dc2}


def _calibrate_core(X: np.ndarray, target: np.ndarray) -> dict:
    """Calibrate via vikshep_compute ridge regression."""
    import vikshep_compute as vc
    result = vc.calibrate(X.astype(np.float64), target.astype(np.float64))
    return {"r2_score": float(result["r2"]), "residual_std": float(result["residual_std"])}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _load_manifest(path_str: str) -> dict:
    p = Path(path_str)
    if not p.exists():
        print(f"ERROR: manifest not found: {p}", file=sys.stderr)
        sys.exit(1)
    with open(p) as f:
        return json.load(f)


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


def _print_tag_report(r: dict) -> None:
    print("vikshep-recipe tag")
    print(f"  feature_set       : {r['feature_set']}")
    print(f"  lambda            : {r['lambda']}")
    print(f"  AUC               : {r['auc']:.4f}")
    print(f"  dCorr^2           : {r['dcorr2']:.4f}  (lower = better decorrelation)")
    print(f"  training_gradient : {r['training_gradient']}")
    print(f"  reported_dcorr2   : {r['reported_dcorr2']}")
    print(f"  n_events          : {r['n_events']}")


def _print_calibrate_report(r: dict) -> None:
    print("vikshep-recipe calibrate")
    print(f"  feature_set  : {r['feature_set']}")
    print(f"  target       : {r['target_col']}")
    print(f"  R^2          : {r['r2_score']:.4f}")
    print(f"  residual std : {r['residual_std']:.4f}")
    print(f"  n_events     : {r['n_events']}")


# ── Argument parsing ──────────────────────────────────────────────────────────

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
    tag_p.add_argument("--out",          default=None, help="Output directory.")

    # calibrate
    cal_p = sub.add_parser("calibrate", help="Detector calibration regression.")
    cal_p.add_argument("--features",    required=True, help="Path to manifest.json.")
    cal_p.add_argument("--target",      required=True, help="Aggregate column for calibration target.")
    cal_p.add_argument("--feature-set", default="auto",
                       choices=["auto", "scattering", "aggregates", "both"],
                       dest="feature_set",
                       help="Feature set to train on (default: auto).")
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
