"""
bench/run.py — CLI entry point for the benchmark harness.

Usage
-----
    python -m bench.run --manifest manifest.json --label <col> --protect <col>
                        [--weights <col>] [--lambdas 0,0.1,1,10] [--seed 42] [--out dir]

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
    p.add_argument("--threshold", type=float, default=0.5, help="Score cut (default: 0.5).")
    p.add_argument("--seed",      type=int,   default=42,  help="Random seed (default: 42).")
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
        threshold     = args.threshold,
        seed          = args.seed,
        out_dir       = out_dir,
    )

    wc = result["win_condition"]
    print()
    print("=" * 56)
    print("  Vikshep Benchmark — results")
    print("=" * 56)
    print(f"  Events            : {result['n_events']}")
    print(f"  Baseline sigma    : {result['sigma_baseline_asimov']:.4f}  (Asimov proxy)")
    print(f"  Win condition     : {'YES' if wc['result'] else 'NO'}")
    print(f"  {wc['note']}")
    print("=" * 56)
    return 0


if __name__ == "__main__":
    sys.exit(main())
