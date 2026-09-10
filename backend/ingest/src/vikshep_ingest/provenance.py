"""
vikshep_ingest.provenance
-------------------------
Provenance manifest schema (Python mirror of studio-core/src/types.ts ProvenanceManifest).

Both the CLI commands and the cloud worker write a provenance.json alongside every
output file. The manifest is the open contract of reproducibility — it lives in the
public repo, not behind the paywall.

Schema version 1 (2026-09-10).
"""

from __future__ import annotations

import hashlib
import json
import platform
import sys
import time
from dataclasses import asdict, dataclass, field
from typing import Literal


@dataclass
class ProvenanceManifest:
    schema_version: Literal["1"]
    engine_version: str
    engine_build_hash: str      # sha256 of the engine binary, or "dev"
    executor: Literal["local", "cloud"]
    platform: str               # e.g. "darwin-arm64", "linux-x86_64"
    op: str                     # e.g. "ingest_g4", "recipe_calibrate"
    config_digest: str          # sha256(JSON(config, sorted keys))
    seed: int | None
    input_oids: list[str]       # 28-hex content-addressed names
    output_oids: list[str]      # 28-hex; grid_oids for ingest_g4
    wall_clock_ms: float
    created_at: str             # ISO 8601 UTC
    manifest_hash: str          # sha256(JSON of all fields above, sorted, excl. manifest_hash)

    def to_dict(self) -> dict:
        return asdict(self)

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent)


def build_manifest(
    *,
    op: str,
    config: dict,
    seed: int | None,
    input_oids: list[str],
    output_oids: list[str],
    wall_clock_ms: float,
    executor: Literal["local", "cloud"] = "local",
    engine_build_hash: str = "dev",
) -> ProvenanceManifest:
    from vikshep_ingest import __version__

    plat = f"{sys.platform}-{platform.machine().lower()}"
    config_digest = _sha256_json(config)
    created_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    base: dict = {
        "schema_version": "1",
        "engine_version": __version__,
        "engine_build_hash": engine_build_hash,
        "executor": executor,
        "platform": plat,
        "op": op,
        "config_digest": config_digest,
        "seed": seed,
        "input_oids": input_oids,
        "output_oids": output_oids,
        "wall_clock_ms": wall_clock_ms,
        "created_at": created_at,
    }
    manifest_hash = _sha256_json(base)

    return ProvenanceManifest(
        **base,  # type: ignore[arg-type]
        manifest_hash=manifest_hash,
    )


def _sha256_json(value: object) -> str:
    text = json.dumps(value, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(text.encode()).hexdigest()
