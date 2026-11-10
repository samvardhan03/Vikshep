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

With the synthetic sample from the repository (`examples/g4_quickstart/sample.csv`: 1000
events with the truth columns `is_signal`, `true_energy` and `weight`) or your own export in
the same shape:

```bash
# 1. CSV to rasterized grids (named by 28-character content IDs) and a manifest
vikshep-ingest g4 sample.csv --schema komal_v1 --out run/

# 2. Calibration: reconstruct the incident energy from the detector images
vikshep-recipe calibrate --features run/manifest.json --target true_energy

# 3. Tagging, decorrelated from energy with weighted DisCo
vikshep-recipe tag --features run/manifest.json \
  --label is_signal --protect true_energy --weights weight --lambda 1.0
```

Every run writes a report and a `provenance.json` (VDS-1 schema) next to its
outputs, so a result can be reproduced bit for bit.

The reported metrics are held out: `auc_heldout`, `dcorr2_heldout`,
`r2_heldout` and `residual_std_heldout` come from seeded 5-fold
cross-validation (`--folds`, `--seed`), so each event is scored by a model fit
without it. The `*_train` values score a model on its own training events and
are labelled as such; with many features and few events they approach 1 even
on noise, and the recipes warn when the training folds hold fewer than 10
events per feature.

## Input profiles

| Profile | Rows |
|---|---|
| `komal_v1` | per-hit `event_id, layer (1-3), phi, theta, momentum[, energy]` |
| generic | any Geant4 ntuple export, mapped with `--column-map map.json` |

Malformed rows are counted and reported, never dropped silently. Extra columns with one
numeric value per event (truth labels, the incident energy, MC weights) are kept as event
columns: usable as `--label`, `--protect`, `--weights` or `--target`, never as features.

## Simulated runs

Output folders of [vikshep-sim](https://github.com/elli0t-yash/vikshep-sim), the open Geant4
runner, are read directly (each run's OID is checked against its `run_summary.json`):

```bash
pip install "vikshep-ingest[sim]"
vikshep-ingest sim runs/electron_5 runs/pion_5 --signal runs/electron_5 --out ana
vikshep-recipe tag --features ana/manifest.json --label is_signal --protect primary_energy_GeV
```

## Licence

AGPL-3.0-or-later, or a commercial licence from the copyright holder:
https://github.com/samvardhan03/Vikshep/blob/main/LICENSING.md
