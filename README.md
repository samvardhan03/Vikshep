# ψ Vikshep

**Deterministic feature extraction for physics. Nothing learned, nothing leaked.**

[![PyPI — vikshep](https://img.shields.io/pypi/v/vikshep.svg?label=vikshep&color=1B1B1F)](https://pypi.org/project/vikshep/)
[![License: AGPL-3.0 + Commercial](https://img.shields.io/badge/license-AGPL--3.0%2BCommercial-1B1B1F.svg)](LICENSING.md)
[![Built with](https://img.shields.io/badge/built%20with-TypeScript%20%7C%20Rust%20%7C%20C%2B%2B%2FCUDA-1B1B1F.svg)]()
[![Site](https://img.shields.io/badge/site-vikshep.dev-1B1B1F.svg)](https://vikshep.vercel.app)

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

The scattering ratio **r₂ = S₂ / S₁** is dimensionless and scale-invariant — it cannot carry
an energy scale and therefore cannot correlate with the resonance mass by construction.
The **DisCo penalty** (weighted distance correlation) enforces dCorr(ŷ, m | bkg) = 0 on the
downstream classifier output, providing a closed-form statistical independence guarantee.

---

## Architecture

```
┌──────────────── Vikshep (this repo) ──────────────────┐
│                                                        │
│  agent/          TypeScript/Bun MCP client             │
│    └─ recipes/   hep-tagging-disco · bsm-anomaly · … │
│  web/            React preview dashboard               │
│  contract/       frozen seam: OID · MCP · WS preview  │
│  backend/        thin Rust launcher + Python loaders   │
│  site/           Next.js marketing site                │
│                                                        │
└───────────────────────┬────────────────────────────────┘
                        │  28-hex shm OID  ·  JSON-RPC 2.0
                        ▼
              omnipulse-mcp  (Rust — Data Plane)
                        │  u64 host pointer  ·  cxx zero-marshalling
                        ▼
              omni-ffi  (Rust ⇄ C++ bridge)
                        │  pinned host page
                        ▼
              omni-wst-core  (C++/CUDA)
              ScatteringEngine<Arch, Dim, Group, J, Q, L>
```

Four things cross the boundary: a 28-char hex object name, line-delimited JSON-RPC 2.0 frames,
a `u64` host pointer (C++ ↔ Rust only), and downsampled previews. Raw tensors never reach
TypeScript or the browser.

---

## Quickstart

```bash
# 1. Install the Python engine wheel
pip install vikshep

# 2. Install the Rust MCP orchestrator
cargo install omnipulse-mcp

# 3. Run a recipe
export OMNIPULSE_MCP_BIN=$(which omnipulse-mcp)
bun run agent/src/main.ts process \
  --input data/jets.root \
  --recipe hep-tagging-disco
```

---

## Recipes

| Recipe | Trigger | Pipeline |
|---|---|---|
| `hep-tagging-disco` | `tag jets, decorrelate mass` | ingest → scatter SE(2) → r₂ reduce → DisCo classifier |
| `bsm-anomaly` | `find events that don't look like SM` | ingest → scatter → log-mean → HNSW (SW₁) → detect |
| `general-feature` | `extract rotation-invariant features` | ingest → scatter (Dim, Group from request) → reduce |

Recipes are declarative MCP tool sequences. `cfgFrom: "ingestMeta"` pulls `dim`/`group` from
the loader; `cfgFrom: "request"` lets the caller pass any `{dim, group, J, Q, L}` at runtime.

---

## Data loaders

Loaders are discovered via entry points (`vikshep.loaders`). Each reads a format, writes POSIX
shared memory, and returns a 28-hex OID.

| Entry point | Format | Default config hint |
|---|---|---|
| `root-uproot` | `.root` (Geant4, CMS Open Data, …) | dim=2, group=so2 (η×φ image) |
| `hdf5` | `.h5`, `.hdf5`, `.hdf`, `.npz` | dim inferred from array rank |

Add a loader by implementing the `Loader` protocol
(`backend/ingest/src/vikshep_ingest/loaders/base.py`) and registering an entry point in your
`pyproject.toml`.

---

## The contract

`contract/` is the frozen seam between Control-Plane and Data-Plane:

- **`objectId.ts`** — `OID = z.string().regex(/^[0-9a-f]{28}$/)` — `sha3_256(buf)[:14]` hex
- **`mcpSchemas.ts`** — `ComputeScatteringInput`, `ReduceInput`, `CompareInput`, `DetectAnomalyInput`
- **`wsPreview.ts`** — `PreviewMsg` and `PipelineEvent` — browser receives only OID + thumbnail + summary

Changing this contract is a breaking change and requires a major version bump in both
Control-Plane and Data-Plane.

---

## Links

- **Site & interactive demos**: [vikshep.vercel.app](https://vikshep.vercel.app)
- **The math**: [vikshep.vercel.app/math](https://vikshep.vercel.app/math)
- **Pilot (University of Edinburgh)**: [vikshep.vercel.app/pilot](https://vikshep.vercel.app/pilot)
- **PyPI**: [pypi.org/project/vikshep](https://pypi.org/project/vikshep/)

---

## License

Dual-licensed:

- **GNU AGPL-3.0** — free for research, academic, and open-source use (see [LICENSE](LICENSE))
- **Commercial License** — required for proprietary or production deployments that cannot comply
  with the AGPL-3.0 source-disclosure requirement (see [LICENSING.md](LICENSING.md))

Contact shekhawatsamvardhan@gmail.com for commercial terms.

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
