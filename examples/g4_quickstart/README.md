# Geant4 Direct Interface — Quickstart

From Geant4 output to physics answer in four commands.

## Install

Python 3.10+, no GPU, no Rust toolchain:

```bash
pip install vikshep-ingest
```

On Linux (x86_64, aarch64), macOS and Windows (x86_64) this installs the open core
[`vikshep-compute`](https://github.com/samvardhan03/vikshep-compute) 0.1.0 as a prebuilt wheel,
and the recipes run on wavelet scattering features. Elsewhere they fall back to per-event
aggregates and the Pearson-proxy gradient; the report states which path ran.

The commands below run from a clone of this repository. Without one, download the sample
(`curl -LO https://raw.githubusercontent.com/samvardhan03/Vikshep/main/examples/g4_quickstart/sample.csv`)
and drop the `examples/g4_quickstart/` prefix.

## The sample

`sample.csv` is **synthetic** (a toy, not Geant4 output), written by
[`make_sample.py`](make_sample.py): 1000 events, 13 808 hits, in the `komal_v1` shape plus
three per-event truth columns.

| Column | Meaning |
|--------|---------|
| `is_signal` | 1 for electron-like events (a compact shower that deposits most of the energy), 0 for pion-like events (a few hits per layer; almost half shower early, so the classes overlap) |
| `true_energy` | incident energy in GeV, uniform in [2, 20]; the calibration target |
| `weight` | MC event weight: 1 for signal, log-normal for background |

Pion hit multiplicity grows with `true_energy`, so a tagger trained without decorrelation
leans on energy and its background score tracks `true_energy`: the sculpting the DisCo
penalty removes. Any extra CSV column with one numeric value per event becomes such an
event column; the recipes never use event columns, or the columns named by `--label`,
`--protect`, `--weights` and `--target`, as features.

## The four commands

```bash
# 1. Ingest: CSV → rasterized grids in shared memory + manifest
vikshep-ingest g4 examples/g4_quickstart/sample.csv --schema komal_v1

# 2. Inspect the manifest
python3 -c "
import json
m = json.load(open('examples/g4_quickstart/manifest.json'))
print('Events:',        m['n_events'])
print('Grid OIDs:',     m['grid_oids'][:3])
print('Event columns:', m['event_column_names'])
"

# 3. Calibrate: reconstruct the incident energy from the detector images
vikshep-recipe calibrate \
  --features examples/g4_quickstart/manifest.json \
  --target true_energy

# 4. Tag: electron-like vs pion-like, decorrelated from true_energy (exact weighted DisCo)
vikshep-recipe tag \
  --features examples/g4_quickstart/manifest.json \
  --label    is_signal \
  --protect  true_energy \
  --weights  weight \
  --lambda   1.0
```

## What you should see

Scattering path (the default with the open core), vikshep-ingest 0.4.1, measured 2026-11-10;
results are bit-identical across platforms (see the `quickstart-golden` CI job). Held-out
values come from 5-fold cross-validation with seed 42 (`--folds`, `--seed`): each event is
scored by a model fit on the other four folds. Training values score the model on the events
it was fit on; they are printed only to show the gap.

| Recipe | Held-out (5-fold) | Training (in-sample) |
|--------|-------------------|----------------------|
| `calibrate --target true_energy` | R² −1.1343, residual std 7.70 GeV | R² 0.5589, residual std 3.50 GeV |
| `tag --lambda 0` | AUC 0.9564, dCorr² 0.0331 | AUC 0.9781, dCorr² 0.0374 |
| `tag --lambda 1` | AUC 0.9496, dCorr² 0.0102 | AUC 0.9743, dCorr² 0.0182 |
| `tag --lambda 10` | AUC 0.7606, dCorr² 0.0081 | AUC 0.8734, dCorr² 0.0084 |

dCorr² is the weighted distance correlation between the tagger score and `true_energy` on
background events: raising `--lambda` trades AUC for independence from energy. The
calibration does not generalise: the scattering path has 281 features and each training fold
800 events, so the ridge fit memorises the training events (R² 0.56) and predicts held-out
events worse than their mean (R² below 0). Both recipes print a warning when the training
folds hold fewer than 10 events per feature.

Without the open core (aggregates path, 32 features): calibrate held-out R² 0.9845 (training
0.9865); tag at `--lambda 1` held-out AUC 0.9999 and dCorr² 0.2357 (training 0.2540). Its
Pearson-proxy training gradient barely decorrelates; the exact gradient of the scattering
path is what moves dCorr².

## What each command does

| Command | Input | Output |
|---------|-------|--------|
| `vikshep-ingest g4` | Geant4 CSV | `manifest.json` with 28-char OIDs for 64×64 (phi×theta) grids in POSIX shm, per-event aggregate scalars, and `source_path` for shm-recovery fallback |
| `vikshep-recipe calibrate` | manifest | `calibrate_report.json` with `r2_heldout` and `residual_std_heldout` (5-fold), the training values `r2_train` and `residual_std_train`, the fold scheme and per-fold values in `evaluation`, and `warnings`; `provenance.json` (VDS-1 schema) |
| `vikshep-recipe tag` | manifest | `tag_report.json` with `auc_heldout` and `dcorr2_heldout` (5-fold, stratified by label), `auc_train` and `dcorr2_train`, `evaluation`, `warnings`, `feature_set: "scattering"`, `training_gradient: "exact_weighted"`; `provenance.json` |

Steps 3 and 4 run the 2-D wavelet scattering transform on the rasterized grids via the open
core and train with the exact weighted dCorr² gradient.  The scattering config for the G4
64×64 grid:

| Parameter | Value | Justification |
|-----------|-------|---------------|
| J | 3 | Three scale levels; 2^J=8 fits well within the 64-pixel grid |
| Q | 1 | One wavelet per octave; physics histograms have broad spectral features |
| L | 8 | Eight orientations; resolves anisotropy in (phi, theta) images at 22.5° step |
| pad | [Circular, ZeroPad] | phi is periodic ([-π, π]); theta is bounded ([0, π]) |

## Understanding the manifest

- `grid_oids`: 28-character SHA3-256 hex OIDs naming POSIX shm segments (`/<oid>`) that hold
  the 64×64 float32 grids.  Segments are created during `vikshep-ingest`; if the shell session
  ends before the recipe runs, the recipe re-rasterizes from `source_path`.
- `aggregates`: per-event scalars (hit multiplicity, mean/sum energy, phi/theta means and stds),
  plus the event columns.
- `event_column_names`: the extra CSV columns kept per event (`is_signal`, `true_energy`, `weight`).
- `pad_policy_per_axis`: phi → Circular, theta → ZeroPad.
- `source_path`: absolute path to the source CSV (recorded for shm-recovery fallback).

## The `komal_v1` schema

Named for the physicist who described it on the design call.  Per-hit rows:

```
event_id, layer (1|2|3), phi (rad), theta (rad), momentum (GeV/c)[, energy (GeV)]
```

Use `--schema generic --column-map '{"phi":"angle_phi","theta":"angle_theta",...}'`
for other Geant4 ntuple exports.

## Time to first value

Pipeline, measured 2026-11-07 on an **Intel Mac (x86_64), macOS 13, Python 3.12, no GPU**,
1000-event sample, scattering path:

| Step | Time |
|------|------|
| `vikshep-ingest g4 sample.csv` | 2.4 s |
| `vikshep-recipe calibrate` (computes the scattering features and caches them next to the manifest, in `.vikshep-cache/`) | 140 s |
| `vikshep-recipe tag` (reuses the cached features) | 4.5 s |
| Same three commands without the open core (aggregates path) | 7.3 s |

Install, measured 2026-11-07 on the same machine: `pip install vikshep-ingest` in a fresh
virtual environment, all dependencies included, about 93 s.

CI TTFV (ubuntu-latest, 2026-10-22): measured by the `quickstart-golden` workflow — see the
workflow run summary for the current CI runner times.

## Next steps

- Run the benchmark harness:
  ```bash
  python -m bench.run --manifest examples/g4_quickstart/manifest.json \
    --label is_signal --protect true_energy --weights weight --lambdas 0,0.1,1,10
  ```
- The benchmark harness uses `vikshep_compute` (exact gradient and dCorr²) when installed,
  and computes every metric on out-of-fold scores, as the recipes do.
- Cross-platform bit identity: the `quickstart-golden` CI job verifies that `tag_report.json`,
  `calibrate_report.json` and the provenance manifest hash are identical on Linux x86_64,
  macOS arm64 and the committed macOS x86_64 hashes.
