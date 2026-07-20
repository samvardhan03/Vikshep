"""
well/cache.py — LRU shard cache for Well dataset downloads.

Wraps the-well-download CLI / HF streaming; never mirrors a full dataset.
The cache is bounded by per-dataset byte quotas.
"""

from __future__ import annotations

import functools
import os
import subprocess
import sys
from pathlib import Path


_DEFAULT_CACHE_DIR  = Path.home() / ".vikshep" / "well_cache"
_DEFAULT_BYTE_QUOTA = 10 * 1024 ** 3  # 10 GB per dataset


class WellShardCache:
    """LRU cache for Well dataset shards.

    Parameters
    ----------
    cache_dir  : directory to store downloaded shards.
    byte_quota : maximum bytes per dataset (oldest shards evicted first).
    """

    def __init__(
        self,
        cache_dir:  Path | str = _DEFAULT_CACHE_DIR,
        byte_quota: int         = _DEFAULT_BYTE_QUOTA,
    ) -> None:
        self.cache_dir  = Path(cache_dir)
        self.byte_quota = byte_quota
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def dataset_dir(self, dataset: str) -> Path:
        return self.cache_dir / dataset

    def shard_path(self, dataset: str, split: str, shard_idx: int) -> Path:
        return self.dataset_dir(dataset) / split / f"shard_{shard_idx:05d}.h5"

    def download_shard(
        self,
        dataset:   str,
        split:     str,
        shard_idx: int,
        base_path: str | None = None,
    ) -> Path:
        """Ensure a shard is on disk; return its local path.

        Uses `the-well-download` CLI if available.  Never downloads more than
        byte_quota bytes for a given dataset.
        """
        path = self.shard_path(dataset, split, shard_idx)
        if path.exists():
            return path

        self._evict_if_needed(dataset)
        path.parent.mkdir(parents=True, exist_ok=True)

        bp = base_path or str(self.dataset_dir(dataset))
        cmd = [
            sys.executable, "-m", "the_well.data",
            "download",
            "--base-path",  bp,
            "--dataset",    dataset,
            "--split",      split,
        ]
        try:
            subprocess.run(cmd, check=True, capture_output=True)
        except (subprocess.CalledProcessError, FileNotFoundError) as exc:
            raise RuntimeError(
                f"Failed to download Well shard {dataset}/{split}/{shard_idx}: {exc}. "
                "Install the_well: pip install the_well"
            ) from exc

        return path

    def _evict_if_needed(self, dataset: str) -> None:
        ddir = self.dataset_dir(dataset)
        if not ddir.exists():
            return
        shards = sorted(ddir.rglob("*.h5"), key=lambda p: p.stat().st_mtime)
        total  = sum(p.stat().st_size for p in shards)
        while total > self.byte_quota and shards:
            oldest = shards.pop(0)
            total -= oldest.stat().st_size
            oldest.unlink(missing_ok=True)
