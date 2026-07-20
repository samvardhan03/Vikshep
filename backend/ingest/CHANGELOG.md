# Changelog — vikshep-ingest

## 0.2.0

- **Geant4 Direct Interface** (`vikshep_ingest.g4`): CSV ingest adapter for
  Geant4 output, `komal_v1` profile (per-hit rows of event_id, layer, phi,
  theta, momentum, energy), generic profile with `--column-map`, per-event
  rasterization to 2-D (phi × theta) grids with correct PadPolicy assignment,
  automated per-layer aggregate scalars (the manual pandas quantities),
  malformed-row accounting, shared-memory registration under 28-char SHA3-256
  OIDs.
- **Shared pad policy** (`vikshep_ingest.pad_policy`): single source of truth
  for periodic→Circular, wall→ZeroPad, open→ZeroPad, used by both the G4
  adapter and the upcoming Well adapter.
- **Weighted DisCo** (`vikshep_ingest.disco`): exact weighted Szekely-Rizzo
  distance correlation; chunked estimator for n > 10k events.
- **Console scripts**: `vikshep-ingest g4` and `vikshep-recipe tag / calibrate`.
- **Dependencies**: added scipy, pandas, scikit-learn for the recipe runners
  and tests.

## 0.1.0

- Initial loader plugins (HDF5, ROOT/uproot), POSIX shm staging, registry,
  serve endpoint.
