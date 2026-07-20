"""
pad_policy.py — shared padding policy for the scattering engine.

Single source of truth for the axis-boundary mapping used by both the G4
adapter (T1) and the Well adapter (Stage 3).  Any change here propagates
to both loaders automatically.
"""

from __future__ import annotations

from enum import Enum


class PadMode(str, Enum):
    Circular = "Circular"
    ZeroPad  = "ZeroPad"


# Mapping from boundary-condition strings to PadMode.
# Sources:
#   G4 adapter  : phi is periodic → Circular; theta/z wall or open → ZeroPad
#   Well adapter: bc_type "periodic" → Circular; "wall" | "open" → ZeroPad
BC_TO_PAD: dict[str, PadMode] = {
    "periodic": PadMode.Circular,
    "wall":     PadMode.ZeroPad,
    "open":     PadMode.ZeroPad,
}


def bc_to_pad(bc_type: str) -> PadMode:
    """Return the PadMode for a given boundary-condition string.

    Raises KeyError for unknown bc_type; callers should catch and log.
    """
    key = bc_type.lower().strip()
    if key not in BC_TO_PAD:
        raise KeyError(
            f"Unknown boundary condition '{bc_type}'. "
            f"Expected one of: {list(BC_TO_PAD)}"
        )
    return BC_TO_PAD[key]
