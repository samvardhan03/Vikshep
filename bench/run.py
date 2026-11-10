"""
bench/run.py — CLI entry point for the benchmark harness.

Usage
-----
    python -m bench.run --manifest manifest.json --label <col> --protect <col>
                        [--weights <col>] [--lambdas 0,0.1,1,10] [--sig-eff 0.5]
                        [--bins 20] [--seed 42] [--folds 5] [--out dir]

Every metric is computed on out-of-fold scores (K-fold cross-validation).

Or call the harness programmatically:
    from bench.harness import run
    result = run(manifest_path="manifest.json", label_col="...", protect_col="...")
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from bench.harness import run


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(
        prog="bench",
        description="Vikshep benchmark harness: significance vs sculpting on G4 features.",
    )
    p.add_argument("--manifest",  required=True, help="Path to manifest.json from vikshep-ingest g4.")
    p.add_argument("--label",     required=True, help="Aggregate column name for binary event label.")
    p.add_argument("--protect",   required=True, help="Aggregate column name for the protected variable.")
    p.add_argument("--weights",   default=None,  help="Aggregate column name for event weights.")
    p.add_argument("--lambdas",   default="0,0.1,1,10",
                   help="Comma-separated lambda grid (default: 0,0.1,1,10).")
    p.add_argument("--sig-eff",   type=float, default=0.5,
                   help="Signal efficiency of the cut, VDS-1 section 16.4 (default: 0.5).")
    p.add_argument("--bins",      type=int,   default=20,
                   help="Bins of the JSD histograms, VDS-1 section 16.3 (default: 20).")
    p.add_argument("--seed",      type=int,   default=42,
                   help="Seed of the fold assignment and of training (default: 42).")
    p.add_argument("--folds",     type=int,   default=5,
                   help="Cross-validation folds for the held-out scores (default: 5).")
    p.add_argument("--out",       default=None, help="Output directory for reports.")

    args = p.parse_args(argv)

    lambdas = [float(x) for x in args.lambdas.split(",")]
    out_dir = Path(args.out) if args.out else Path(args.manifest).parent

    result = run(
        manifest_path = args.manifest,
        label_col     = args.label,
        protect_col   = args.protect,
        weights_col   = args.weights,
        lambdas       = lambdas,
        target_sig_eff = args.sig_eff,
        n_bins        = args.bins,
        seed          = args.seed,
        out_dir       = out_dir,
        folds         = args.folds,
    )

    wc = result["win_condition"]
    print()
    print("=" * 56)
    print("  Vikshep Benchmark — results")
    print("=" * 56)
    print(f"  Events            : {result['n_events']}  ({result['evaluation']['folds']}-fold, out-of-fold scores)")
    z0 = result["z_asimov_baseline"]
    print(f"  Baseline Z_A      : {'n/a' if z0 is None else f'{z0:.4f}'}  (Asimov proxy, not a Wilks fit)")
    print(f"  Win condition     : {'YES' if wc['result'] else 'NO'}")
    print(f"  {wc['note']}")
    print("=" * 56)
    for w in result["warnings"]:
        print(f"WARNING: {w}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
