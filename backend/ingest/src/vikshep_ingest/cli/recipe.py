"""
cli/recipe.py — entry point for `vikshep-recipe tag` and `vikshep-recipe calibrate`.

Usage
-----
    vikshep-recipe tag       --features manifest.json --label <col> --protect <col>
                              [--weights <col>] [--lambda <float>] [--out dir]
    vikshep-recipe calibrate --features manifest.json --target <col> [--out dir]

Both commands read the aggregates from the manifest produced by
`vikshep-ingest g4` and train a lightweight model with the weighted DisCo
penalty (tag) or a regression head (calibrate).
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np


# ---------------------------------------------------------------------------
# Subcommand: tag
# ---------------------------------------------------------------------------

def _cmd_tag(args: argparse.Namespace) -> int:
    manifest = _load_manifest(args.features)
    aggregates = manifest.get("aggregates", [])
    if not aggregates:
        print("ERROR: manifest contains no aggregates. Run vikshep-ingest g4 first.", file=sys.stderr)
        return 1

    agg_names = manifest.get("aggregate_names", sorted(aggregates[0].keys()))
    X = np.array([[ev.get(k, 0.0) for k in agg_names] for ev in aggregates], dtype=np.float32)
    N = len(X)

    labels = _extract_col(aggregates, args.label, N)
    if labels is None:
        print(f"ERROR: label column '{args.label}' not found in aggregates.", file=sys.stderr)
        print(f"  Available columns: {agg_names}", file=sys.stderr)
        return 1

    protect = _extract_col(aggregates, args.protect, N)
    if protect is None:
        print(f"ERROR: protect column '{args.protect}' not found in aggregates.", file=sys.stderr)
        return 1

    weights: np.ndarray
    if args.weights:
        weights_col = _extract_col(aggregates, args.weights, N)
        if weights_col is None:
            print(f"ERROR: weights column '{args.weights}' not found.", file=sys.stderr)
            return 1
        weights = weights_col
    else:
        weights = np.ones(N, dtype=np.float32)

    lam = args.lam

    from vikshep_ingest.disco import weighted_dcorr2

    # Simple logistic regression with weighted DisCo penalty
    # Loss: wBCE + lambda * dCorr_w^2(score, protect | background)
    # Implementation mirrors pilot/train_disco.py but uses the exact
    # weighted_dcorr2 metric (Pearson-approx gradient is the pilot's fast path).
    from vikshep_ingest.cli._train import train_tag

    result = train_tag(X, labels.astype(np.float32), protect, weights, lam=lam)

    out_dir = Path(args.out) if args.out else Path(args.features).parent
    out_dir.mkdir(parents=True, exist_ok=True)

    report = {
        "recipe":     "tag",
        "lambda":     lam,
        "auc":        result["auc"],
        "dcorr2":     result["dcorr2_final"],
        "n_events":   N,
        "label_col":  args.label,
        "protect_col": args.protect,
        "weights_col": args.weights,
        "feature_names": agg_names,
    }
    _write_json(out_dir / "tag_report.json", report)
    _print_tag_report(report)
    return 0


def _cmd_calibrate(args: argparse.Namespace) -> int:
    manifest = _load_manifest(args.features)
    aggregates = manifest.get("aggregates", [])
    if not aggregates:
        print("ERROR: manifest contains no aggregates.", file=sys.stderr)
        return 1

    agg_names = manifest.get("aggregate_names", sorted(aggregates[0].keys()))
    X = np.array([[ev.get(k, 0.0) for k in agg_names] for ev in aggregates], dtype=np.float32)
    N = len(X)

    target = _extract_col(aggregates, args.target, N)
    if target is None:
        print(f"ERROR: target column '{args.target}' not found.", file=sys.stderr)
        return 1

    from vikshep_ingest.cli._train import train_calibrate
    result = train_calibrate(X, target)

    out_dir = Path(args.out) if args.out else Path(args.features).parent
    out_dir.mkdir(parents=True, exist_ok=True)

    report = {
        "recipe":      "calibrate",
        "target_col":  args.target,
        "r2_score":    result["r2_score"],
        "residual_std": result["residual_std"],
        "n_events":    N,
        "feature_names": agg_names,
    }
    _write_json(out_dir / "calibrate_report.json", report)
    _print_calibrate_report(report)
    return 0


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

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
    return np.array([ev.get(col, 0.0) for ev in aggregates], dtype=np.float32)


def _write_json(path: Path, data: dict) -> None:
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"  Report written: {path}")


def _print_tag_report(r: dict) -> None:
    print(f"vikshep-recipe tag")
    print(f"  lambda   : {r['lambda']}")
    print(f"  AUC      : {r['auc']:.4f}")
    print(f"  dCorr^2  : {r['dcorr2']:.4f}  (lower = better decorrelation)")
    print(f"  n_events : {r['n_events']}")


def _print_calibrate_report(r: dict) -> None:
    print(f"vikshep-recipe calibrate")
    print(f"  target   : {r['target_col']}")
    print(f"  R^2      : {r['r2_score']:.4f}")
    print(f"  residual std: {r['residual_std']:.4f}")
    print(f"  n_events : {r['n_events']}")


# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="vikshep-recipe",
        description="Execute analysis recipes on a vikshep-ingest manifest.",
    )
    sub = p.add_subparsers(dest="command", required=True)

    # tag
    tag_p = sub.add_parser("tag", help="Particle classification with DisCo decorrelation.")
    tag_p.add_argument("--features", required=True, help="Path to manifest.json.")
    tag_p.add_argument("--label",    required=True, help="Aggregate column name for binary label.")
    tag_p.add_argument("--protect",  required=True, help="Aggregate column name for the protected variable.")
    tag_p.add_argument("--weights",  default=None,  help="Aggregate column name for event weights.")
    tag_p.add_argument("--lambda",   type=float, default=1.0, dest="lam",
                       help="DisCo decorrelation strength (default: 1.0).")
    tag_p.add_argument("--out",      default=None,  help="Output directory.")

    # calibrate
    cal_p = sub.add_parser("calibrate", help="Detector calibration regression.")
    cal_p.add_argument("--features", required=True, help="Path to manifest.json.")
    cal_p.add_argument("--target",   required=True, help="Aggregate column name for the calibration target.")
    cal_p.add_argument("--out",      default=None,  help="Output directory.")

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
