#!/usr/bin/env python3
"""
Compute SHA3-256 of the quickstart outputs and write golden/hashes-<platform>.json.

Called by the golden-hash CI job after running the four-command quickstart.
Reads report.json and provenance.json from examples/g4_quickstart/.
"""

import hashlib
import json
import os
import platform
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
QS_DIR = REPO_ROOT / "examples" / "g4_quickstart"
GOLDEN_DIR = REPO_ROOT / "golden"

FILES = [
    "tag_report.json",
    "calibrate_report.json",
    "provenance.json",
]


def sha3_file(path: Path) -> str:
    h = hashlib.sha3_256()
    h.update(path.read_bytes())
    return h.hexdigest()


def main() -> int:
    GOLDEN_DIR.mkdir(exist_ok=True)

    machine = platform.machine().lower()
    system = platform.system().lower()
    platform_tag = f"{system}-{machine}"

    hashes: dict[str, str | None] = {}
    for name in FILES:
        p = QS_DIR / name
        if not p.exists():
            hashes[name] = None
            print(f"WARNING: {name} not found at {p}", file=sys.stderr)
            continue
        if name == "provenance.json":
            # provenance.json contains wall_clock and platform fields that
            # differ per run/OS.  The VDS-1 manifest_hash inside the file
            # is the platform-independent canonical identifier.
            prov = json.loads(p.read_bytes())
            hashes[name] = prov.get("manifest_hash")
            if hashes[name] is None:
                print(f"WARNING: manifest_hash missing from {p}", file=sys.stderr)
        else:
            hashes[name] = sha3_file(p)

    try:
        import vikshep_compute as vc
        import inspect
        numerics_version = getattr(vc, "NUMERICS_VERSION", None)
        if numerics_version is None:
            numerics_version = "unknown"
    except ImportError:
        numerics_version = "absent"

    record = {
        "vikshep_compute_commit": "b55468bbb2fb8d1225fa3563e94addfe642b3d5a",
        "numerics_version": numerics_version,
        "platform": platform_tag,
        "hashes": hashes,
    }

    out_path = GOLDEN_DIR / f"hashes-{platform_tag}.json"
    out_path.write_text(json.dumps(record, indent=2) + "\n")
    print(f"Golden hashes written: {out_path}")
    for k, v in hashes.items():
        print(f"  {k}: {v or 'MISSING'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
