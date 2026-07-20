# Vikshep

**Deterministic feature extraction for physics. Nothing learned, nothing leaked.**

[![PyPI — vikshep](https://img.shields.io/pypi/v/vikshep.svg?label=vikshep&color=1B1B1F)](https://pypi.org/project/vikshep/)
[![License: AGPL-3.0 + Commercial](https://img.shields.io/badge/license-AGPL--3.0%2BCommercial-1B1B1F.svg)](LICENSING.md)
[![Built with](https://img.shields.io/badge/built%20with-TypeScript%20%7C%20Rust%20%7C%20C%2B%2B%2FCUDA-1B1B1F.svg)]()
[![Site](https://img.shields.io/badge/site-vikshep.vercel.app-1B1B1F.svg)](https://vikshep.vercel.app)

---

## What it is

Vikshep is a **deterministic feature-extraction plane** for scientific data — not a classifier,
regressor, or generative model. It computes wavelet scattering coefficients of physics data;
downstream models (classifiers, anomaly detectors, likelihood fits) consume those coefficients
as input features. Nothing is learned during feature extraction, so nothing can adapt to leak
the quantity you are trying to measure.

The engine is a multiscale, oriented wavelet cascade: modulus, convolve, modulus, low-pass.
The filters are fixed analytic Morlet wavelets chosen by the (J, Q, L) geometry — not trained.
Translation invariance and Lipschitz-bounded deformation stability are mathematical properties
of the transform, not empirical claims about a trained model.

---

## The problem it solves

A neural jet tagger trained on high-level kinematic features learns the jet mass implicitly.
Cut on its score and you carve a bump-shaped hole into the background mass spectrum — a fake
signal. This is mass sculpting, and it is a recognized failure mode in ATLAS, CMS, and every
boosted-object search that uses a learned discriminant without explicit decorrelation.

Vikshep replaces the learned feature extractor with a fixed one, then kills residual correlation
with a single closed-form penalty. [See the full story on the site →](https://vikshep.vercel.app)

---

## Why it's different

| Property | Standard NN tagger | Vikshep |
|---|---|---|
| Feature weights | Learned from data | Fixed (analytic Morlets) |
| Mass leakage | Implicit, hard to control | Zero by construction |
| Decorrelation | Adversarial / heuristic | Closed-form dCorr = 0 |
| Dimensionality | 1-D/2-D specific | 1-D / 2-D / 3-D via runtime (Dim, Group) config |
| Reproducibility | Run-dependent | Bit-for-bit deterministic |
| Provenance | Black box | SHA3-256 OID per tensor, logged |

---

## Open core

The seam is public and frozen; the engine behind it ships as binaries. Downstream
results are reproducible bit-for-bit from the contract without the engine source.

| Open (AGPL-3.0, this repo) | Engine (private, ships as binaries) |
|---|---|
| `contract/` — frozen seam (OID, MCP, WS preview) | CUDA scattering kernels for 1-D/2-D/SE(2)/SO(3) |
| `agent/` — TypeScript/Bun MCP orchestrator | Steerable/tile-policy GPU paths |
| `backend/ingest/` — G4 and Well data loaders | Rust MCP data plane (`omnipulse-mcp`) |
| `backend/ingest/disco.py` — weighted DisCo | Wheel packaging (`vikshep`) |
| `bench/` — benchmark harness | Pilot data and analysis scripts |
| `examples/` — quickstart and sample data | |
| `site/` — marketing site and client-side demos | |
| All math and statistical methods | |

See [LICENSING.md](LICENSING.md) for engine binary terms.

---

## Architecture

```
┌──────────────── Vikshep (this repo — AGPL-3.0) ──────────────┐
│                                                                │
│  agent/          TypeScript/Bun MCP client                    │
│    └─ recipes/   hep-tagging-disco · bsm-anomaly · …         │
│  web/            React preview dashboard                       │
│  contract/       frozen seam: OID · MCP · WS preview          │
│  backend/        thin Rust launcher + Python loaders           │
│  site/           Next.js marketing site                        │
│                                                                │
└───────────────────────┬────────────────────────────────────────┘
                        │  28-hex shm OID  ·  JSON-RPC 2.0
                        ▼
              ┌── vikshep-engine (private repo, installed as binaries) ──┐
              │ omnipulse-mcp  (Rust — Data Plane)                       │
              │         │  u64 host pointer  ·  cxx zero-marshalling     │
              │ omni-ffi  (Rust ↔ C++ bridge)                            │
              │         │  pinned host page                               │
              │ omni-wst-core  (C++/CUDA)                                │
              │ ScatteringEngine<Arch, Dim, Group, J, Q, L>              │
              └──────────────────────────────────────────────────────────┘
```

Four things cross the boundary: a 28-char hex object name, line-delimited JSON-RPC 2.0 frames,
a `u64` host pointer (C++ ↔ Rust only), and downsampled previews. Raw tensors never reach
TypeScript or the browser.

---

## Install

**Python SDK** (compiled wheel; the engine is inside):
```bash
pip install vikshep
```

**Engine MCP binary** (`omnipulse-mcp`): download from the
[Releases page](https://github.com/samvardhan03/Vikshep/releases) of this repo
(built by the private release workflow) and set `OMNIPULSE_MCP_BIN` to its path.

> Engine binaries: first public release pending — pilot access via
> shekhawatsamvardhan@gmail.com until the first tagged release ships.

**Geant4 Direct Interface** (repo-local install; not yet on PyPI):
```bash
git clone https://github.com/samvardhan03/Vikshep.git
pip install -e Vikshep/backend/ingest
```

Do not `cargo install omnipulse-mcp` — crates.io would publish the engine source.

---

## Quickstart (Geant4 Direct Interface)

From Geant4 CSV output to physics answer in four commands:

```bash
# 1. Install (repo-local)
git clone https://github.com/samvardhan03/Vikshep.git && cd Vikshep
pip install -e backend/ingest

# 2. Ingest your Geant4 CSV
vikshep-ingest g4 examples/g4_quickstart/sample.csv --schema komal_v1

# 3. Calibrate detector response
vikshep-recipe calibrate --features manifest.json --target layer1_e_mean

# 4. Tag particles with DisCo decorrelation
vikshep-recipe tag --features manifest.json --label is_signal --protect mass --lambda 1.0
```

Time to first value: **under 30 seconds** on a fresh machine, no GPU.
See `examples/g4_quickstart/README.md` for a full walkthrough.

---

## Recipes

| Recipe | CLI | Pipeline |
|---|---|---|
| `hep-tagging-disco` | `vikshep-recipe tag` | G4 ingest → aggregates → r₂ → DisCo classifier |
| `bsm-anomaly` | `vikshep-recipe tag --protect mass` | ingest → scatter → log-mean → HNSW → detect |
| `general-feature` | `vikshep-ingest g4 / well_slice` | ingest → scatter (Dim, Group from request) → reduce |

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
- **Engine binaries gratis** — the `vikshep` wheel and `omnipulse-mcp` binary: free for
  research/evaluation use under the Vikshep Engine Binary Terms
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
