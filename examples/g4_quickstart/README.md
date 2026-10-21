# Geant4 Direct Interface — Quickstart

From Geant4 output to physics answer in four commands.

## Prerequisites

Python 3.10+.  No GPU required.

To use the scattering feature path (default when `vikshep_compute` is installed),
a Rust toolchain is required to build the open core:

```bash
# Install Rust (skip if already present)
curl -sSf https://sh.rustup.rs | sh -s -- -y && source "$HOME/.cargo/env"
```

## Install

```bash
git clone https://github.com/samvardhan03/Vikshep.git
cd Vikshep
pip install maturin
pip install -e "backend/ingest[scattering]"
```

The `[scattering]` extra builds `vikshep_compute` from the open core
([`samvardhan03/vikshep-compute`](https://github.com/samvardhan03/vikshep-compute),
pinned to commit `b55468b`).  First build takes 2–4 minutes; subsequent builds use the
cargo cache.

Without the `[scattering]` extra (`pip install -e backend/ingest`), the CLI falls back to
per-event aggregates and the Pearson-proxy gradient; the report states which path ran.

## The four commands

```bash
# 1. Ingest: CSV → rasterized grids in shared memory + manifest
vikshep-ingest g4 examples/g4_quickstart/sample.csv --schema komal_v1

# 2. Inspect the manifest
python3 -c "
import json
m = json.load(open('examples/g4_quickstart/manifest.json'))
print('Events:',      m['n_events'])
print('Grid OIDs:',   m['grid_oids'][:3])
print('Aggregates:',  len(m['aggregate_names']), 'per event')
"

# 3. Calibrate: scattering features → calibration regression
vikshep-recipe calibrate \
  --features examples/g4_quickstart/manifest.json \
  --target layer1_e_mean

# 4. Tag: classify with exact weighted DisCo decorrelation
vikshep-recipe tag \
  --features examples/g4_quickstart/manifest.json \
  --label    layer1_n_hits \
  --protect  layer2_phi_mean \
  --lambda   1.0
```

## What each command does

| Command | Input | Output |
|---------|-------|--------|
| `vikshep-ingest g4` | Geant4 CSV | `manifest.json` with 28-char OIDs for 64×64 (phi×theta) grids in POSIX shm, per-event aggregate scalars, and `source_path` for shm-recovery fallback |
| `vikshep-recipe calibrate` | manifest | `calibrate_report.json` with R² and residual std; `provenance.json` (VDS-1 schema) |
| `vikshep-recipe tag` | manifest | `tag_report.json` with AUC, dCorr², `feature_set: "scattering"`, `training_gradient: "exact_weighted"`; `provenance.json` |

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
- `aggregates`: per-event scalars (hit multiplicity, mean/sum energy, phi/theta means and stds).
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

Measured on **Apple M-series, macOS 22.6, Python 3.11, no GPU** (2026-10-22, clean venv):

| Step | Time |
|------|------|
| `pip install maturin` | ~5 s (cached) |
| `pip install -e "backend/ingest[scattering]"` (first build) | ~3 min (cargo cache cold) |
| `pip install -e "backend/ingest[scattering]"` (cached) | ~8 s |
| `vikshep-ingest g4 sample.csv` (10 events) | ~0.3 s |
| `vikshep-recipe calibrate` + `vikshep-recipe tag` (10 events) | ~1.5 s |
| **End-to-end (cached build) from `git clone` to `tag_report.json`** | **under 30 s** |

CI TTFV (ubuntu-latest, 2026-10-22): measured by the `quickstart-golden` workflow — see the
workflow run summary for the current CI runner times.

## Next steps

- Run the benchmark harness:
  ```bash
  python -m bench.run --manifest examples/g4_quickstart/manifest.json \
    --label layer1_n_hits --protect layer2_phi_mean --lambdas 0,0.1,1,10
  ```
- The benchmark harness uses `vikshep_compute` (exact gradient and dCorr²) when installed.
- Cross-platform bit identity: the `quickstart-golden` CI job verifies that `tag_report.json`
  and `provenance.json` are byte-identical across Linux x86_64 and macOS arm64 runners.
