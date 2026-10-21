#!/usr/bin/env python3
"""
Compare golden hashes produced on ubuntu-latest and macos-14.

Called by the compare-golden CI job after downloading artifacts from both
platform runners.  Exits 1 if any hash differs or is missing.
"""

import json
import sys
from pathlib import Path

GOLDEN_DIR = Path(__file__).resolve().parent.parent / "golden"


def main() -> int:
    files = sorted(GOLDEN_DIR.glob("hashes-*.json"))
    if len(files) < 2:
        print(f"ERROR: expected at least 2 hash files in {GOLDEN_DIR}, found {len(files)}", file=sys.stderr)
        return 1

    records = []
    for f in files:
        records.append((f.name, json.loads(f.read_text())))

    print(f"Comparing {len(records)} platform hash files:")
    for name, rec in records:
        print(f"  {name}: platform={rec['platform']}, numerics_version={rec['numerics_version']}")

    # Check numerics_version consistency
    versions = {rec["numerics_version"] for _, rec in records}
    if len(versions) > 1:
        print(f"FAIL: numerics_version mismatch across platforms: {versions}", file=sys.stderr)
        return 1

    # Compare hashes
    all_keys = sorted(set(k for _, rec in records for k in rec["hashes"]))
    fail = False
    for key in all_keys:
        vals = {name: rec["hashes"].get(key) for name, rec in records}
        unique = set(v for v in vals.values() if v is not None)
        missing = [name for name, v in vals.items() if v is None]
        if missing:
            print(f"FAIL {key}: missing on {missing}")
            fail = True
        elif len(unique) > 1:
            print(f"FAIL {key}: hash mismatch across platforms")
            for name, v in vals.items():
                print(f"  {name}: {v}")
            fail = True
        else:
            print(f"  OK {key}: {next(iter(unique))[:16]}…")

    if fail:
        print("\nCross-platform hash comparison FAILED.", file=sys.stderr)
        return 1

    print("\nAll hashes match across platforms.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
