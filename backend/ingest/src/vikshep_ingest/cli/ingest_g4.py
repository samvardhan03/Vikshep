"""
cli/ingest_g4.py — entry point for `vikshep-ingest g4`.

Usage
-----
    vikshep-ingest g4 <csv> --schema komal_v1 [--column-map map.json] [--out dir]

Writes manifest.json in the output directory and prints a one-screen summary.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="vikshep-ingest g4",
        description="Ingest a Geant4 CSV export to scattering-ready shared memory.",
    )
    p.add_argument("csv", help="Path to the Geant4 CSV file.")
    p.add_argument(
        "--schema", default="komal_v1",
        help="Ingest profile name (default: komal_v1).  Use 'generic' with --column-map.",
    )
    p.add_argument(
        "--column-map", dest="column_map", default=None,
        help="JSON file or inline JSON string mapping canonical role names to CSV headers.",
    )
    p.add_argument(
        "--out", default=None,
        help="Directory to write manifest.json (default: same dir as csv).",
    )
    return p


def main(argv: list[str] | None = None) -> int:
    p = _build_parser()

    # Support `vikshep-ingest g4 ...` called directly OR via the dispatcher
    if argv is None:
        argv = sys.argv[1:]
    # Strip leading 'g4' subcommand if dispatcher already consumed 'ingest'
    if argv and argv[0] == "g4":
        argv = argv[1:]

    args = p.parse_args(argv)

    column_map: dict | None = None
    if args.column_map:
        try:
            column_map = json.loads(args.column_map)
        except json.JSONDecodeError:
            try:
                with open(args.column_map) as f:
                    column_map = json.load(f)
            except Exception as exc:
                print(f"ERROR: --column-map: {exc}", file=sys.stderr)
                return 1

    from vikshep_ingest.g4.schema import get_profile
    from vikshep_ingest.g4.adapter import G4Adapter

    try:
        profile = get_profile(args.schema, column_map)
    except ValueError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    csv_path = Path(args.csv)
    if not csv_path.exists():
        print(f"ERROR: CSV file not found: {csv_path}", file=sys.stderr)
        return 1

    out_dir = Path(args.out) if args.out else csv_path.parent

    with G4Adapter(profile) as adapter:
        manifest = adapter.ingest(path=csv_path, out_dir=out_dir)

    n_events   = manifest["n_events"]
    n_hits     = manifest["n_hits_total"]
    n_malformed = manifest["n_malformed_rows"]
    n_channels  = len(manifest.get("channel_names", []))
    n_aggs      = len(manifest.get("aggregate_names", []))
    has_energy  = manifest.get("has_energy", False)
    manifest_path = out_dir / "manifest.json"

    print(f"Geant4 Direct Interface — profile: {args.schema}")
    print(f"  CSV            : {csv_path}")
    print(f"  Events parsed  : {n_events}")
    print(f"  Hits total     : {n_hits}")
    print(f"  Malformed rows : {n_malformed}")
    print(f"  Grid channels  : {n_channels}  ({'energy' if has_energy else 'hit-count'})")
    print(f"  Aggregate scalars: {n_aggs} per event")
    print(f"  Grid OIDs      : {len(manifest.get('grid_oids', []))} (28-char SHA3-256)")
    print(f"  Manifest written: {manifest_path}")

    return 0


def dispatch(argv: list[str] | None = None) -> int:
    """Top-level dispatcher for `vikshep-ingest <subcommand>`.

    Currently supports subcommand: g4
    """
    if argv is None:
        argv = sys.argv[1:]

    if not argv or argv[0] in {"-h", "--help"}:
        print("Usage: vikshep-ingest <subcommand> [args]")
        print("Subcommands: g4")
        return 0

    sub = argv[0]
    if sub == "g4":
        return main(argv[1:])

    print(f"ERROR: unknown subcommand '{sub}'. Available: g4", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
