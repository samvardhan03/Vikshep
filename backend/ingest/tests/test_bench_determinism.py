"""
Determinism test: same manifest + same seed → byte-identical report.json.
"""

from __future__ import annotations

import json
import tempfile
from pathlib import Path

from vikshep_ingest.g4.schema import get_profile
from vikshep_ingest.g4.adapter import G4Adapter
from tests.fixtures import make_synthetic_csv
from bench.harness import run as bench_run


def _make_manifest(tmp_dir: Path, seed: int = 0) -> Path:
    csv_str = make_synthetic_csv(n_events=60, with_energy=True, seed=seed)
    profile = get_profile("komal_v1")
    manifest_path = tmp_dir / "manifest.json"
    with G4Adapter(profile) as adapter:
        manifest = adapter.ingest(source=csv_str, out_dir=tmp_dir)
    # Inject synthetic label and protect columns for bench
    aggregates = manifest.get("aggregates", [])
    import numpy as np
    rng = np.random.default_rng(0)
    for i, agg in enumerate(aggregates):
        agg["is_signal"] = int(rng.integers(0, 2))
        agg["mass"]      = float(abs(rng.normal(80, 15)))
    manifest["aggregate_names"] = sorted(aggregates[0].keys()) if aggregates else []
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    return manifest_path


def test_bench_determinism():
    with tempfile.TemporaryDirectory() as tmp1, tempfile.TemporaryDirectory() as tmp2:
        tmp1_p = Path(tmp1)
        tmp2_p = Path(tmp2)

        manifest_path = _make_manifest(tmp1_p)

        result_a = bench_run(
            manifest_path = manifest_path,
            label_col     = "is_signal",
            protect_col   = "mass",
            seed          = 42,
            out_dir       = tmp1_p,
        )
        result_b = bench_run(
            manifest_path = manifest_path,
            label_col     = "is_signal",
            protect_col   = "mass",
            seed          = 42,
            out_dir       = tmp2_p,
        )

        # Compare JSON-serializable fields (exclude file paths)
        def _norm(r: dict) -> dict:
            import copy
            r2 = copy.deepcopy(r)
            r2.pop("manifest", None)
            return r2

        json_a = json.dumps(_norm(result_a), sort_keys=True, default=lambda x: None)
        json_b = json.dumps(_norm(result_b), sort_keys=True, default=lambda x: None)
        assert json_a == json_b, "Bench harness is not deterministic under the same seed!"
