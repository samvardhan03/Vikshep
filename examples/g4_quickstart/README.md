# Geant4 Direct Interface — Quickstart

From Geant4 output to physics answer in four commands.

## Prerequisites

Python 3.10+.  No GPU required for this quickstart.

```bash
git clone https://github.com/samvardhan03/Vikshep.git
cd Vikshep
pip install -e backend/ingest
```

## The four commands

```bash
# 1. Ingest: CSV → scattering-ready shared memory + manifest
vikshep-ingest g4 examples/g4_quickstart/sample.csv --schema komal_v1

# 2. Inspect the manifest
cat examples/g4_quickstart/manifest.json | python3 -c "
import json, sys
m = json.load(sys.stdin)
print('Events:', m['n_events'])
print('Aggregates per event:', len(m['aggregate_names']))
print('Grid OIDs (first 3):', m['grid_oids'][:3])
"

# 3. Calibrate: aggregate features → calibration regression
vikshep-recipe calibrate \
  --features examples/g4_quickstart/manifest.json \
  --target layer1_e_mean

# 4. Tag: classify with weighted DisCo decorrelation
vikshep-recipe tag \
  --features examples/g4_quickstart/manifest.json \
  --label    layer1_n_hits \
  --protect  layer2_phi_mean \
  --lambda   1.0
```

## What each command does

| Command | Input | Output |
|---------|-------|--------|
| `vikshep-ingest g4` | Geant4 CSV | `manifest.json` with per-event aggregate scalars and 28-char shm OIDs for the 2-D (phi, theta) rasterized grids |
| `vikshep-recipe calibrate` | manifest | `calibrate_report.json` with R² score and residual std for the regression target |
| `vikshep-recipe tag` | manifest | `tag_report.json` with AUC and dCorr² (lower = better decorrelation) at the chosen lambda |

## Understanding the manifest

The manifest is the control-plane payload — no float tensors, only:

- `grid_oids`: 28-character SHA3-256 hex OIDs pointing to POSIX shared-memory
  buffers containing the 2-D (phi × theta) rasterized grids, one per event.
- `aggregates`: per-event derived scalars (hit multiplicity, mean/sum energy,
  phi/theta means and stds, momentum summaries — the quantities physicists
  compute manually in pandas today, automated here).
- `pad_policy_per_axis`: phi → Circular, theta → ZeroPad (correct detector geometry).

## The `komal_v1` schema

Named for the physicist who described it on the design call.  Per-hit rows:

```
event_id, layer (1|2|3), phi (rad), theta (rad), momentum (GeV/c)[, energy (GeV)]
```

Use `--schema generic --column-map '{"phi":"angle_phi","theta":"angle_theta",...}'`
for other Geant4 ntuple exports.

## Time to first value

Measured on Apple M-series (macOS 22.6, Python 3.11, no GPU), fresh venv:

- `pip install -e backend/ingest`: ~18 seconds (first install; cached = ~3s)
- Four-command pipeline on `sample.csv` (10 events): **3.5 seconds**
- Estimated for 1000-event Geant4 CSV: under 10 seconds

End-to-end from `git clone` to `tag_report.json`: **under 30 seconds.**

## Next steps

- Run the benchmark harness on a real analysis pipeline:
  ```bash
  python -m bench.run --manifest manifest.json --label <signal_col> \
                      --protect <mass_col> --lambdas 0,0.1,1,10
  ```
- Connect to the scattering engine: `pip install vikshep` (compiled wheel)
  then set `OMNIPULSE_MCP_BIN` to the engine binary path.
- Install via repo clone only — `vikshep-ingest` is not yet on PyPI.
