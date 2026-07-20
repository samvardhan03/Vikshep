"""Geant4 Direct Interface — CSV ingest, aggregation, rasterization."""

from .adapter import G4Adapter
from .schema import get_profile, PROFILES

__all__ = ["G4Adapter", "get_profile", "PROFILES"]
