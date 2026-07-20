"""
g4/schema.py — ingest profiles for Geant4 CSV exports.

A profile maps CSV column names to canonical field roles.  The canonical
profile `komal_v1` is hardcoded to the schema Komal Papanwar described:
per-hit rows of (event_id, layer, phi, theta, momentum[, energy]) across
three tracker layers, exported to CSV.

Profiles are identified by string name; unknown names raise ValueError.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class G4Profile:
    """Column mapping for one Geant4 ntuple export format."""
    name: str
    event_id: str       = "event_id"
    layer:    str       = "layer"
    phi:      str       = "phi"
    theta:    str       = "theta"
    momentum: str       = "momentum"
    energy:   str | None = None
    required_layers: frozenset[int] = field(default_factory=lambda: frozenset({1, 2, 3}))


# ---------------------------------------------------------------------------
# Canonical profiles
# ---------------------------------------------------------------------------

PROFILES: dict[str, G4Profile] = {
    "komal_v1": G4Profile(
        name     = "komal_v1",
        event_id = "event_id",
        layer    = "layer",
        phi      = "phi",
        theta    = "theta",
        momentum = "momentum",
        energy   = "energy",        # optional column; tolerated when absent
    ),
}


def get_profile(name: str, column_map: dict[str, str] | None = None) -> G4Profile:
    """Return the named profile, optionally overriding column names via column_map.

    column_map keys are canonical role names (event_id, layer, phi, theta,
    momentum, energy); values are the actual CSV column header names.
    """
    if name == "generic":
        if not column_map:
            raise ValueError(
                "Profile 'generic' requires --column-map with at least "
                "event_id, layer, phi, theta, momentum."
            )
        return G4Profile(
            name     = "generic",
            event_id = column_map.get("event_id", "event_id"),
            layer    = column_map.get("layer",    "layer"),
            phi      = column_map.get("phi",      "phi"),
            theta    = column_map.get("theta",    "theta"),
            momentum = column_map.get("momentum", "momentum"),
            energy   = column_map.get("energy",   None),
        )

    if name not in PROFILES:
        raise ValueError(
            f"Unknown profile '{name}'. Available: {list(PROFILES)} + 'generic'."
        )

    base = PROFILES[name]

    if not column_map:
        return base

    return G4Profile(
        name             = base.name,
        event_id         = column_map.get("event_id", base.event_id),
        layer            = column_map.get("layer",    base.layer),
        phi              = column_map.get("phi",      base.phi),
        theta            = column_map.get("theta",    base.theta),
        momentum         = column_map.get("momentum", base.momentum),
        energy           = column_map.get("energy",   base.energy),
        required_layers  = base.required_layers,
    )
