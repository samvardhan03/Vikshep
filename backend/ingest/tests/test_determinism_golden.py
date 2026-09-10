"""
Golden-hash determinism test (P4).

Runs the three CPU ops on examples/g4_quickstart/sample.csv, computes the
stable-field hash for each, and compares against examples/g4_quickstart/golden_hashes.json.

A golden change without an engine version bump FAILS this test. To update goldens:
1. Bump engine_version in backend/ingest/src/vikshep_ingest/__init__.py
2. Run this test once to see the new hashes
3. Update examples/g4_quickstart/golden_hashes.json with both new hashes + new version
4. Commit all three files together
"""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).parent.parent.parent.parent
FIXTURE = REPO_ROOT / "examples" / "g4_quickstart" / "sample.csv"
GOLDEN = REPO_ROOT / "examples" / "g4_quickstart" / "golden_hashes.json"


def _sha256_stable(obj: object) -> str:
    return hashlib.sha256(
        json.dumps(obj, sort_keys=True, ensure_ascii=False).encode()
    ).hexdigest()


def _run(*args: str) -> "subprocess.CompletedProcess[str]":
    return subprocess.run(
        [sys.executable, "-m", args[0], *args[1:]],
        capture_output=True, text=True, check=False,
    )


def _run_bin(bin_name: str, *args: str) -> "subprocess.CompletedProcess[str]":
    return subprocess.run(
        [bin_name, *args],
        capture_output=True, text=True, check=False,
    )


@pytest.fixture(scope="module")
def golden() -> dict:
    assert GOLDEN.exists(), f"golden_hashes.json not found at {GOLDEN}"
    return json.loads(GOLDEN.read_text())


@pytest.fixture(scope="module")
def quickstart_run(golden: dict) -> dict:
    """Run the full quickstart pipeline once; return all three output dicts."""
    assert FIXTURE.exists(), f"sample.csv not found at {FIXTURE}"

    with tempfile.TemporaryDirectory() as tmp:
        tmp_p = Path(tmp)

        # ingest_g4
        r = _run_bin("vikshep-ingest", "g4", str(FIXTURE),
                     "--schema", "komal_v1", "--out", tmp)
        assert r.returncode == 0, f"vikshep-ingest g4 failed:\n{r.stderr}"
        manifest_path = tmp_p / "manifest.json"
        assert manifest_path.exists()
        manifest = json.loads(manifest_path.read_text())

        # recipe_calibrate
        cal_args = golden["ops"]["recipe_calibrate"]["args"]
        r2 = _run_bin("vikshep-recipe", "calibrate",
                      "--features", str(manifest_path),
                      "--target", cal_args["target"],
                      "--out", tmp)
        assert r2.returncode == 0, f"vikshep-recipe calibrate failed:\n{r2.stderr}"
        calibrate = json.loads((tmp_p / "calibrate_report.json").read_text())

        # recipe_tag
        tag_args = golden["ops"]["recipe_tag"]["args"]
        r3 = _run_bin("vikshep-recipe", "tag",
                      "--features", str(manifest_path),
                      "--label", tag_args["label"],
                      "--protect", tag_args["protect"],
                      "--out", tmp)
        assert r3.returncode == 0, f"vikshep-recipe tag failed:\n{r3.stderr}"
        tag = json.loads((tmp_p / "tag_report.json").read_text())

        return {"manifest": manifest, "calibrate": calibrate, "tag": tag}


def test_ingest_g4_golden(golden: dict, quickstart_run: dict):
    m = quickstart_run["manifest"]
    stable = {k: m[k] for k in ["aggregate_names", "n_events", "grid_oids"] if k in m}
    aggs = m.get("aggregates", [])
    stable["aggregates"] = [
        {k: v for k, v in a.items() if k not in ("source_path", "manifest_path")}
        for a in aggs
    ]
    got = _sha256_stable(stable)
    expected = golden["ops"]["ingest_g4"]["hash"]
    assert got == expected, (
        f"ingest_g4 golden hash mismatch.\n"
        f"  got:      {got}\n"
        f"  expected: {expected}\n"
        f"To update: run the CLIs, record new hashes, bump engine_version."
    )


def test_recipe_calibrate_golden(golden: dict, quickstart_run: dict):
    cr = quickstart_run["calibrate"]
    stable = {k: cr[k] for k in ["recipe", "target_col", "r2_score", "residual_std", "n_events"] if k in cr}
    got = _sha256_stable(stable)
    expected = golden["ops"]["recipe_calibrate"]["hash"]
    assert got == expected, (
        f"recipe_calibrate golden hash mismatch.\n"
        f"  got:      {got}\n"
        f"  expected: {expected}"
    )


def test_recipe_tag_golden(golden: dict, quickstart_run: dict):
    tr = quickstart_run["tag"]
    stable = {k: tr[k] for k in ["recipe", "lambda", "auc", "dcorr2", "n_events"] if k in tr}
    got = _sha256_stable(stable)
    expected = golden["ops"]["recipe_tag"]["hash"]
    assert got == expected, (
        f"recipe_tag golden hash mismatch.\n"
        f"  got:      {got}\n"
        f"  expected: {expected}"
    )


def test_determinism_two_runs(golden: dict):
    """Same CSV + same args → same stable-field hash on two independent runs."""
    def run_ingest() -> str:
        with tempfile.TemporaryDirectory() as tmp:
            r = _run_bin("vikshep-ingest", "g4", str(FIXTURE),
                         "--schema", "komal_v1", "--out", tmp)
            assert r.returncode == 0
            m = json.loads((Path(tmp) / "manifest.json").read_text())
            stable = {k: m[k] for k in ["aggregate_names", "n_events", "grid_oids"] if k in m}
            stable["aggregates"] = [
                {k: v for k, v in a.items() if k not in ("source_path", "manifest_path")}
                for a in m.get("aggregates", [])
            ]
            return _sha256_stable(stable)

    h1 = run_ingest()
    h2 = run_ingest()
    assert h1 == h2, "ingest_g4 is not deterministic across two runs"
