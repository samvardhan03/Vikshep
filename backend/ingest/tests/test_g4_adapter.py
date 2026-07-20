"""
Tests for the G4 Direct Interface adapter.

Fixture-only: no real Geant4 data, no network access.
All assertions are validated against hand-computed pandas references.
"""

from __future__ import annotations

import warnings
import numpy as np
import pandas as pd
import pytest

from vikshep_ingest.g4.schema import get_profile
from vikshep_ingest.g4.adapter import G4Adapter
from vikshep_ingest.g4.aggregates import compute_aggregates
from vikshep_ingest.pad_policy import PadMode
from tests.fixtures import make_synthetic_csv


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _pandas_reference(csv_str: str, profile_name: str = "komal_v1") -> dict:
    """Compute aggregates using pandas as the ground truth reference."""
    import io
    df = pd.read_csv(io.StringIO(csv_str))
    # Rename to canonical names
    df = df.rename(columns={"event_id": "ev", "layer": "lay", "phi": "phi",
                             "theta": "theta", "momentum": "p"})
    has_energy = "energy" in df.columns

    results = {}
    for ev_id, grp in df.groupby("ev"):
        agg: dict = {}
        agg["n_hits_total"]  = len(grp)
        agg["p_mean_global"] = float(grp["p"].mean())
        agg["p_sum_global"]  = float(grp["p"].sum())
        if has_energy:
            agg["e_sum_global"]  = float(grp["energy"].sum())
            agg["e_mean_global"] = float(grp["energy"].mean())
        for layer, lg in grp.groupby("lay"):
            prefix = f"layer{layer}"
            agg[f"{prefix}_n_hits"]     = len(lg)
            agg[f"{prefix}_phi_mean"]   = float(lg["phi"].mean())
            agg[f"{prefix}_phi_std"]    = float(lg["phi"].std(ddof=0))
            agg[f"{prefix}_theta_mean"] = float(lg["theta"].mean())
            agg[f"{prefix}_theta_std"]  = float(lg["theta"].std(ddof=0))
            agg[f"{prefix}_p_mean"]     = float(lg["p"].mean())
            agg[f"{prefix}_p_sum"]      = float(lg["p"].sum())
            if has_energy:
                agg[f"{prefix}_e_sum"]  = float(lg["energy"].sum())
                agg[f"{prefix}_e_mean"] = float(lg["energy"].mean())
        results[int(ev_id)] = agg
    return results


# ---------------------------------------------------------------------------
# Tests: schema and profile
# ---------------------------------------------------------------------------

def test_komal_v1_profile():
    p = get_profile("komal_v1")
    assert p.event_id == "event_id"
    assert p.layer    == "layer"
    assert p.phi      == "phi"
    assert p.theta    == "theta"
    assert p.momentum == "momentum"
    assert p.energy   == "energy"


def test_generic_profile_requires_column_map():
    with pytest.raises(ValueError, match="requires --column-map"):
        get_profile("generic")


def test_generic_profile_with_map():
    p = get_profile("generic", {"event_id": "ev", "layer": "lay",
                                "phi": "p", "theta": "t", "momentum": "m"})
    assert p.event_id == "ev"


def test_unknown_profile_raises():
    with pytest.raises(ValueError, match="Unknown profile"):
        get_profile("does_not_exist")


# ---------------------------------------------------------------------------
# Tests: manifest correctness
# ---------------------------------------------------------------------------

def test_manifest_fields_with_energy():
    csv_str = make_synthetic_csv(n_events=50, with_energy=True)
    profile = get_profile("komal_v1")
    with G4Adapter(profile) as adapter:
        manifest = adapter.ingest(source=csv_str)

    assert manifest["source"]  == "g4"
    assert manifest["profile"] == "komal_v1"
    assert manifest["n_events"] == 50
    assert manifest["has_energy"] is True
    assert len(manifest["grid_oids"]) == 50
    # All OIDs are 28 chars
    for oid in manifest["grid_oids"]:
        assert len(oid) == 28, f"OID length {len(oid)} != 28: {oid}"


def test_manifest_fields_without_energy():
    csv_str = make_synthetic_csv(n_events=30, with_energy=False)
    profile = get_profile("komal_v1")
    with G4Adapter(profile) as adapter:
        manifest = adapter.ingest(source=csv_str)

    assert manifest["has_energy"] is False
    assert manifest["n_events"] == 30


# ---------------------------------------------------------------------------
# Tests: aggregates vs pandas reference
# ---------------------------------------------------------------------------

def test_aggregates_match_pandas_reference():
    n_events = 20
    csv_str = make_synthetic_csv(n_events=n_events, with_energy=True, seed=7)
    profile = get_profile("komal_v1")
    with G4Adapter(profile) as adapter:
        manifest = adapter.ingest(source=csv_str)

    pandas_ref = _pandas_reference(csv_str)

    for i, agg_got in enumerate(manifest["aggregates"]):
        ev_id = i + 1
        if ev_id not in pandas_ref:
            continue
        ref = pandas_ref[ev_id]
        for key in ["n_hits_total", "p_mean_global", "p_sum_global",
                    "e_sum_global", "e_mean_global"]:
            if key in ref:
                assert abs(float(agg_got[key]) - float(ref[key])) < 1e-4, \
                    f"event {ev_id}, {key}: got {agg_got[key]}, expected {ref[key]}"


# ---------------------------------------------------------------------------
# Tests: pad policy
# ---------------------------------------------------------------------------

def test_pad_policy_phi_circular_theta_zeropad():
    from vikshep_ingest.g4.rasterize import pad_policy_for_g4
    pp = pad_policy_for_g4()
    assert pp["phi"]   == PadMode.Circular
    assert pp["theta"] == PadMode.ZeroPad

def test_manifest_pad_policy_values():
    csv_str = make_synthetic_csv(n_events=5)
    profile = get_profile("komal_v1")
    with G4Adapter(profile) as adapter:
        manifest = adapter.ingest(source=csv_str)
    assert manifest["pad_policy_per_axis"]["phi"]   == "Circular"
    assert manifest["pad_policy_per_axis"]["theta"] == "ZeroPad"


# ---------------------------------------------------------------------------
# Tests: malformed row accounting
# ---------------------------------------------------------------------------

def test_malformed_rows_counted_not_dropped():
    csv_str = make_synthetic_csv(n_events=10, n_malformed=5)
    profile = get_profile("komal_v1")
    with warnings.catch_warnings(record=True):
        warnings.simplefilter("always")
        with G4Adapter(profile) as adapter:
            manifest = adapter.ingest(source=csv_str)
    assert manifest["n_malformed_rows"] == 5
    assert manifest["n_events"] == 10  # good events still parsed


def test_extra_columns_warned_not_failed():
    csv_str = make_synthetic_csv(n_events=5, include_extra_col=True)
    profile = get_profile("komal_v1")
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        with G4Adapter(profile) as adapter:
            manifest = adapter.ingest(source=csv_str)
    extra_warnings = [w for w in caught if "Extra columns" in str(w.message)]
    assert len(extra_warnings) >= 1
    assert manifest["n_events"] == 5


# ---------------------------------------------------------------------------
# Tests: 28-char OID uniqueness
# ---------------------------------------------------------------------------

def test_grid_oids_are_28_chars():
    csv_str = make_synthetic_csv(n_events=100, seed=99)
    profile = get_profile("komal_v1")
    with G4Adapter(profile) as adapter:
        manifest = adapter.ingest(source=csv_str)
    oids = manifest["grid_oids"]
    for oid in oids:
        assert len(oid) == 28
        assert all(c in "0123456789abcdef" for c in oid)
