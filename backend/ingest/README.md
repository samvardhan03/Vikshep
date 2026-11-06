# vikshep-ingest

The Geant4 Direct Interface of [Vikshep](https://vikshep.vercel.app): from
Geant4 output to physics answer. It reads the per-hit CSV you already export
from Geant4, computes the per-event, per-layer quantities usually derived by
hand in pandas, rasterizes each event onto a detector-native (phi, theta)
grid, and runs two analysis recipes on deterministic wavelet-scattering
features: detector calibration, and particle tagging decorrelated from a
protected variable with the exact weighted distance correlation (DisCo).

```bash
pip install vikshep-ingest
```

On Linux (x86_64, aarch64), macOS and Windows (x86_64) this also installs the
open deterministic core,
[vikshep-compute](https://github.com/samvardhan03/vikshep-compute), as a
prebuilt wheel. On other platforms the recipes fall back to per-event
aggregates and say so; `pip install "vikshep-ingest[scattering]"` requests
the core explicitly.

## Quickstart

With the sample CSV from the repository
(`examples/g4_quickstart/sample.csv`) or your own export in the same shape:

```bash
# 1. CSV to rasterized grids (named by 28-character content IDs) and a manifest
vikshep-ingest g4 sample.csv --schema komal_v1 --out run/

# 2. Calibration regression on scattering features
vikshep-recipe calibrate --features run/manifest.json --target layer1_e_mean

# 3. Tagging with weighted DisCo decorrelation from a protected variable
vikshep-recipe tag --features run/manifest.json \
  --label layer1_n_hits --protect layer2_phi_mean --lambda 1.0
```

Every run writes a report and a `provenance.json` (VDS-1 schema) next to its
outputs, so a result can be reproduced bit for bit.

## Input profiles

| Profile | Rows |
|---|---|
| `komal_v1` | per-hit `event_id, layer (1-3), phi, theta, momentum[, energy]` |
| generic | any Geant4 ntuple export, mapped with `--column-map map.json` |

Malformed rows are counted and reported, never dropped silently.

## Licence

AGPL-3.0-or-later, or a commercial licence from the copyright holder:
https://github.com/samvardhan03/Vikshep/blob/main/LICENSING.md
