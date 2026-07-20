"""
well/pad_policy.py — Well adapter pad-policy mapping.

Re-exports from the shared vikshep_ingest.pad_policy module (single source of truth).
See vikshep_ingest/pad_policy.py for the authoritative mapping:
  periodic -> Circular, wall -> ZeroPad, open -> ZeroPad.

'grid_type == "spherical"' raises UnsupportedGridError loudly (v1 is
cartesian-only; silent wrong geometry is forbidden by spec).
"""

from __future__ import annotations

from vikshep_ingest.pad_policy import PadMode, bc_to_pad


class UnsupportedGridError(ValueError):
    """Raised for Well datasets with non-cartesian grid geometry."""


class WellPadPolicy:
    """Map Well boundary-condition attrs to scattering pad modes.

    Raises UnsupportedGridError for spherical grids rather than silently
    producing wrong geometry.
    """

    @staticmethod
    def check_grid_type(grid_type: str) -> None:
        if grid_type.lower() == "spherical":
            raise UnsupportedGridError(
                f"Grid type '{grid_type}' is not supported in v1 (cartesian-only). "
                "Spherical grids require SO(3) kernel extensions not yet integrated "
                "into the Well adapter. Pass --covariance-unsafe to override (proposed)."
            )

    @staticmethod
    def for_bc(bc_type: str) -> PadMode:
        """Return PadMode for a Well boundary-condition string.

        Delegates to the shared pad_policy module so there is exactly one
        implementation of periodic→Circular, wall→ZeroPad, open→ZeroPad.
        """
        return bc_to_pad(bc_type)
