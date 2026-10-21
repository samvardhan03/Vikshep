# Changelog — vikshep-ingest

## 0.3.0

- **Scattering extra** (`pip install -e "backend/ingest[scattering]"`): wires
  in the open deterministic core
  [`samvardhan03/vikshep-compute`](https://github.com/samvardhan03/vikshep-compute)
  (pinned to commit `b55468b`, `numerics_version = 2`).  Requires a Rust toolchain.
- **`vikshep-recipe tag` and `calibrate`** gain `--feature-set {scattering,aggregates,both,auto}`.
  With `scattering`: loads 64×64 (phi×theta) grids from named POSIX shm (OID = segment name),
  runs the wavelet scattering transform (J=3, Q=1, L=8, pad=[Circular, ZeroPad]), computes
  r2 ratios, and trains with the exact weighted dCorr² gradient from the core.
  Default is `scattering` when `vikshep_compute` is importable, else `aggregates` with a notice.
- **Provenance**: every CLI run writes `provenance.json` (VDS-1 schema from the open core)
  next to its outputs.
- **Report fields**: `feature_set` and `training_gradient` (`"exact_weighted"` or
  `"pearson_proxy"`) are now present in every tag and calibrate report.
- **Shared-memory naming**: `G4Adapter` now names shm segments with the OID (28-char hex)
  so downstream tools can look them up without additional tracking.  `source_path` is recorded
  in the manifest for shm-recovery re-rasterization.
- **Bench harness**: uses `vikshep_compute` (exact dCorr², exact gradient, Adam training) when
  installed; falls back to the pure-Python path.  Report records `statistics_backend` and
  `training_gradient`.
- **`McpClient.ts`**: looks for `VIKSHEP_MCP_BIN` first, then `OMNIPULSE_MCP_BIN` (deprecated
  alias, logs a warning), then PATH.  Error message points at building `vikshep-mcp` from the
  open core.

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
