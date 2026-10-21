# Vikshep

**Deterministic feature extraction for physics. Nothing learned, nothing leaked.**

[![PyPI — vikshep](https://img.shields.io/pypi/v/vikshep.svg?label=vikshep&color=1B1B1F)](https://pypi.org/project/vikshep/)
[![License: AGPL-3.0 + Commercial](https://img.shields.io/badge/license-AGPL--3.0%2BCommercial-1B1B1F.svg)](LICENSING.md)
[![Built with](https://img.shields.io/badge/built%20with-TypeScript%20%7C%20Rust%20%7C%20C%2B%2B%2FCUDA-1B1B1F.svg)]()
[![Site](https://img.shields.io/badge/site-vikshep.vercel.app-1B1B1F.svg)](https://vikshep.vercel.app)

---

## What it is

Vikshep is a **deterministic feature-extraction plane** for scientific data — not a classifier,
regressor, or generative model. Its feature plane is the wavelet scattering transform
(S0, S1, S2 and the scale-free ratio r2 = S2/S1); downstream models (classifiers, anomaly
detectors, likelihood fits) consume those coefficients as input features. Nothing is learned
during feature extraction, so nothing can adapt to leak the quantity you are trying to measure.

The scattering transform is computed by the open deterministic core
[`samvardhan03/vikshep-compute`](https://github.com/samvardhan03/vikshep-compute).
The released CLI ingests Geant4 output, rasterizes each event to a 2-D (phi × theta) grid,
computes the full scattering cascade (S0/S1/S2), the scale-free r2 = S2/S1 ratios, and
trains calibration and DisCo-penalised tagging models on those features with the exact weighted
dCorr² gradient.  When `vikshep_compute` is not installed, the CLI falls back to per-event
aggregate scalars with a Pearson-proxy gradient; the report states which path ran.

The transform is a multiscale, oriented wavelet cascade: convolve, modulus, convolve, modulus,
low-pass. The filters are fixed analytic Morlet wavelets chosen by the (J, Q, L) geometry — not
trained. Translation invariance and Lipschitz-bounded deformation stability are mathematical
properties of the transform, not empirical claims about a trained model.

---

## Engine status

- **Available now** — the `vikshep-ingest` / `vikshep-recipe` CLI in `backend/ingest`:
  Geant4 CSV ingest, per-event 2-D rasterization (phi × theta, 64 × 64, OID-named POSIX shm),
  wavelet scattering transform (S0/S1/S2) and r2 ratios via the open core
  ([`samvardhan03/vikshep-compute`](https://github.com/samvardhan03/vikshep-compute) — requires
  a Rust toolchain; install with `pip install -e "backend/ingest[scattering]"`), DisCo-penalised
  tagging and calibration with the exact weighted dCorr² gradient, and the benchmark harness.
  Cross-platform bit identity: proven on Linux x86_64 and macOS arm64 by CI (see the
  [vikshep-compute conformance workflow](https://github.com/samvardhan03/vikshep-compute/actions)).
  When `vikshep_compute` is not installed, the CLI falls back to per-event aggregates with the
  Pearson-proxy gradient; the report states which path ran.
- **In development** — desktop app; GPU acceleration (proprietary backends).
- The private engine is no longer required for CPU scattering.  GPU backends are proprietary and
  not yet released.

---

## The problem it solves

A neural jet tagger trained on high-level kinematic features learns the jet mass implicitly.
Cut on its score and you carve a bump-shaped hole into the background mass spectrum — a fake
signal. This is mass sculpting, and it is a recognized failure mode in ATLAS, CMS, and every
boosted-object search that uses a learned discriminant without explicit decorrelation.

Vikshep's design replaces the learned feature extractor with a fixed one, then penalises
residual correlation with a weighted distance-correlation (DisCo) term. [See the full story on the site →](https://vikshep.vercel.app)

---

## Why it's different

The table compares the method. What ships today is listed under [Engine status](#engine-status).

| Property | Standard NN tagger | Vikshep |
|---|---|---|
| Feature weights | Learned from data | Fixed (analytic Morlets) |
| Mass leakage | Implicit, hard to control | None in the fixed feature map; residual dependence penalised by DisCo |
| Decorrelation | Adversarial / heuristic | Weighted DisCo penalty; exact weighted dCorr² reported |
| Dimensionality | 1-D/2-D specific | 1-D / 2-D / 3-D via runtime (Dim, Group) config |
| Reproducibility | Run-dependent | Deterministic by design (see below) |
| Provenance | Black box | SHA3-256 OID per tensor, logged |

Deterministic by design. The open core's conformance suite (VDS-1) proves bit identity on
Linux x86_64, Linux AArch64, macOS arm64, and Windows x86_64.  The quickstart golden-hash CI
job additionally verifies that `tag_report.json` and `provenance.json` are byte-identical across
Linux and macOS runners on the same vikshep-compute commit.

---

## Open core

The seam is public and frozen, so downstream tooling can be written and audited against the
contract without the engine source. The private engine behind it is intended to ship as
binaries; no engine binary has been released yet.

| Open (AGPL-3.0, this repo) | Open core ([`vikshep-compute`](https://github.com/samvardhan03/vikshep-compute), AGPL-3.0) | Proprietary (not yet released) |
|---|---|---|
| `contract/` — frozen seam (OID, MCP, WS preview) | Rust CPU scattering (`vikshep-scatter`) | CUDA/Metal GPU kernels |
| `agent/` — TypeScript/Bun MCP orchestrator | Exact dCorr² gradient (`vikshep-stats`) | Steerable/tile-policy GPU paths |
| `backend/ingest/` — G4 and Well data loaders | MCP data plane binary (`vikshep-mcp`) | Wheel packaging (`vikshep`) |
| `bench/` — benchmark harness | Provenance manifests (VDS-1) | Pilot data |
| `examples/` — quickstart and sample data | Conformance suite (VDS-1) | |
| `site/` — marketing site | | |

See [LICENSING.md](LICENSING.md) for terms.

---

## Architecture

```
┌──────────────── Vikshep (this repo — AGPL-3.0) ──────────────┐
│                                                                │
│  agent/          TypeScript/Bun MCP client                    │
│    └─ recipes/   hep-tagging-disco · bsm-anomaly · …         │
│  web/            React preview dashboard                       │
│  contract/       frozen seam: OID · MCP · WS preview          │
│  backend/ingest/ Python G4 loader + CLI recipes               │
│  site/           Next.js marketing site                        │
│                                                                │
└───────────────────────┬────────────────────────────────────────┘
                        │  28-hex shm OID  ·  JSON-RPC 2.0
                        ▼
  ┌── vikshep-compute (open, AGPL-3.0 — samvardhan03/vikshep-compute) ──┐
  │ vikshep-mcp   (Rust MCP data plane; build: cargo build -p vikshep-mcp) │
  │ vikshep-scatter  (Stockham FFT, Morlet filters, S0/S1/S2 cascade)   │
  │ vikshep-stats    (exact weighted dCorr², JSD, Asimov proxy)          │
  │ vikshep-train    (DisCo training, Adam, exact gradient, calibration) │
  │ vikshep-py       (Python package vikshep_compute via PyO3/maturin)   │
  └──────────────────────────────────────────────────────────────────────┘
                        │  (GPU backends: proprietary, not yet released)
                        ▼
  ┌── proprietary GPU backends (in development) ──────────────────────┐
  │  CUDA/Metal scattering kernels; steerable/tile-policy GPU paths   │
  └───────────────────────────────────────────────────────────────────┘
```

Three things cross the seam: a 28-char hex OID, line-delimited JSON-RPC 2.0 frames, and
downsampled previews. Raw tensors stay in shared memory and never reach TypeScript or the
browser. The private engine is no longer required for CPU scattering; it is needed only for
GPU backends, which are in development.

---

## Install

**Geant4 Direct Interface** (repo-local install):
```bash
git clone https://github.com/samvardhan03/Vikshep.git
pip install -e Vikshep/backend/ingest
```

**With scattering features** (requires a Rust toolchain):
```bash
# Install Rust (if not already present)
curl -sSf https://sh.rustup.rs | sh -s -- -y && source "$HOME/.cargo/env"

pip install maturin
pip install -e "Vikshep/backend/ingest[scattering]"
```

The `[scattering]` extra builds `vikshep_compute` from the open core at a pinned
commit (`b55468b`).  Building the Rust crates takes 2–4 minutes on first install;
subsequent installs use the cargo cache.

**MCP data plane** (`vikshep-mcp`): build from the open core:
```bash
git clone https://github.com/samvardhan03/vikshep-compute.git
cd vikshep-compute
cargo build --release -p vikshep-mcp
export VIKSHEP_MCP_BIN=$PWD/target/release/vikshep-mcp
```

---

## Quickstart (Geant4 Direct Interface)

From Geant4 CSV output to physics answer in four commands:

```bash
# 1. Install with scattering features (requires Rust — see Install above)
git clone https://github.com/samvardhan03/Vikshep.git && cd Vikshep
pip install maturin && pip install -e "backend/ingest[scattering]"

# 2. Ingest your Geant4 CSV
vikshep-ingest g4 examples/g4_quickstart/sample.csv --schema komal_v1

# 3. Calibrate detector response
vikshep-recipe calibrate --features examples/g4_quickstart/manifest.json \
  --target layer1_e_mean

# 4. Tag particles with DisCo decorrelation (exact dCorr² gradient)
vikshep-recipe tag --features examples/g4_quickstart/manifest.json \
  --label layer1_n_hits --protect layer2_phi_mean --lambda 1.0
```

Steps 3 and 4 run the wavelet scattering transform on the 64 × 64 (phi × theta) grids
(J=3, Q=1, L=8, pad=[Circular, ZeroPad]) via the open core, compute S0/S1/S2 and r2 ratios,
and train with the exact weighted dCorr² gradient.  Without `[scattering]`, the CLI falls back
to per-event aggregates and the Pearson-proxy gradient; the report states which path ran.

See `examples/g4_quickstart/README.md` for the full walkthrough including TTFV measurements.

---

## Recipes

| Recipe | Entry point | Pipeline | Status |
|---|---|---|---|
| CLI tag | `vikshep-recipe tag` | G4 ingest → scattering features → exact dCorr² DisCo classifier | Available now (scattering extra) |
| CLI calibrate | `vikshep-recipe calibrate` | G4 ingest → scattering features → calibration regression | Available now (scattering extra) |
| CLI tag (fallback) | `vikshep-recipe tag --feature-set aggregates` | G4 ingest → per-event aggregates → DisCo (Pearson proxy) | Available now |
| `hep-tagging-disco` | agent recipe | ingest → scatter → r₂ → DisCo classifier | Available (needs vikshep-mcp) |
| `bsm-anomaly` | agent recipe | ingest → scatter → log-mean → HNSW → detect | Available (needs vikshep-mcp) |
| `general-feature` | agent recipe | ingest → scatter (Dim, Group from request) → reduce | Available (needs vikshep-mcp) |

Agent recipes are declarative MCP tool sequences; CLI recipes are executable
Python scripts installable from `backend/ingest`.

---

## Data loaders

| Loader | Format | Install |
|---|---|---|
| `g4` (Geant4 Direct Interface) | Geant4 CSV (`event_id, layer, phi, theta, momentum[, energy]`) | `pip install -e backend/ingest` (repo-local) |
| `root-uproot` | `.root` (Geant4, CMS Open Data) | `pip install -e backend/ingest` |
| `hdf5` | `.h5`, HDF5 | `pip install -e backend/ingest` |
| `well` | The Well HDF5 (15TB physics simulations) | `pip install -e backend/ingest` (Stage 3) |

Loaders are discovered via entry points (`vikshep.loaders`). Each writes POSIX
shared memory and returns a 28-hex OID.

---

## The contract

`contract/` is the frozen seam between Control-Plane and Data-Plane:

- **`objectId.ts`** — `OID = z.string().regex(/^[0-9a-f]{28}$/)` — `sha3_256(buf)[:14]` hex
- **`mcpSchemas.ts`** — `ComputeScatteringInput`, `ReduceInput`, `CompareInput`,
  `DetectAnomalyInput`, `IngestG4Input`, `WellSliceInput`, `FeaturizeWellInput`
- **`wsPreview.ts`** — `PreviewMsg` and `PipelineEvent` — browser receives only OID + thumbnail + summary

Changing this contract is a breaking change and requires a major version bump in both
Control-Plane and Data-Plane.

---

## License

Three-tier model:

- **GNU AGPL-3.0** — all source in this repository: free for research, academic, and open-source
  use (see [LICENSE](LICENSE))
- **Open core** — [`samvardhan03/vikshep-compute`](https://github.com/samvardhan03/vikshep-compute):
  CPU scattering, exact dCorr², MCP data plane (`vikshep-mcp`), all AGPL-3.0
- **Commercial license** — required for proprietary production deployments (AGPL compliance)
  or for the premium engine components (3-D SO(3)/solid-harmonic kernels, high-throughput
  batch scatter, on-premise appliance) — contact shekhawatsamvardhan@gmail.com

See [LICENSING.md](LICENSING.md) for the full model.

---

## Citation

```bibtex
@software{vikshep2026,
  title   = {Vikshep: Deterministic Wavelet Scattering Features for Physics},
  author  = {Singh, Samvardhan and Mishra, Yash},
  year    = {2026},
  url     = {https://github.com/samvardhan03/Vikshep},
  license = {AGPL-3.0-or-later}
}
```

---

## Acknowledgements

Pilot analysis: **Komal Papanwar** (University of Edinburgh), ATLAS boosted di-boson resonance
search on Geant4-simulated data. ATLAS Open Data used where applicable.
