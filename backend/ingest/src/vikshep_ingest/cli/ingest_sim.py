"""
cli/ingest_sim.py — entry point for `vikshep-ingest sim`.

Usage
-----
    vikshep-ingest sim RUN [RUN ...] [--signal RUN ...] [--out dir]

RUN is a vikshep-sim output folder (or its hits.arrow).  Each run's OID is
checked against its run_summary.json.  Writes manifest.json in the output
directory (default: the current directory) and prints a one-screen summary.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="vikshep-ingest sim",
        description="Ingest vikshep-sim runs (hits.arrow) to scattering-ready shared memory.",
    )
    p.add_argument("runs", nargs="+", help="vikshep-sim output folders (or their hits.arrow).")
    p.add_argument(
        "--signal", nargs="+", default=[],
        help="Runs whose events are signal: adds the event column is_signal "
             "(1 for these runs, 0 for the others).",
    )
    p.add_argument("--out", default=".", help="Directory to write manifest.json (default: current directory).")
    return p


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(sys.argv[1:] if argv is None else argv)

    from vikshep_ingest.sim import SimRunError, ingest_runs

    try:
        manifest = ingest_runs(args.runs, args.signal, out_dir=args.out)
    except SimRunError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    event_cols = manifest.get("event_column_names", [])
    n_aggs = len(manifest.get("aggregate_names", [])) - len(event_cols)
    print("vikshep-sim runs — profile: sim_hits_v1")
    for run in manifest.get("runs", []):
        tag = "  [signal]" if run["signal"] else ""
        print(f"  Run            : {run['path']}  ({run['particle']}, {run['energy_GeV']} GeV, "
              f"OID {run['oid']}){tag}")
    print(f"  Events parsed  : {manifest['n_events']}")
    print(f"  Hits total     : {manifest['n_hits_total']}")
    print(f"  Aggregate scalars: {n_aggs} per event")
    print(f"  Event columns  : {', '.join(event_cols)}  (usable as --label, --protect, --weights, --target)")
    print(f"  Grid OIDs      : {len(manifest.get('grid_oids', []))} (28-char SHA3-256)")
    print(f"  Manifest written: {Path(args.out) / 'manifest.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
