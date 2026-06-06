from __future__ import annotations
from typing import Protocol, runtime_checkable
import numpy as np


@runtime_checkable
class Loader(Protocol):
    name: str
    extensions: tuple[str, ...]

    def can_handle(self, path: str) -> bool: ...

    def load(self, path: str, **opts) -> tuple[np.ndarray, dict]:
        """Return (f32 C-contiguous array, meta). meta hints {dim, group, shape, pad}."""
