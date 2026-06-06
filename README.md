# Vikshep

**Vectorized Invariant Kernels for Scattering & High-performance Extraction Pipelines**

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-teal.svg)](LICENSE)

Vikshep is the **Control-Plane** product: a TypeScript/Bun agent and React preview dashboard that orchestrates scientific data pipelines via the [Model Context Protocol](https://modelcontextprotocol.io). It speaks **28-hex object IDs and JSON-RPC 2.0 frames** — raw tensors never leave the Data-Plane.

---

## Architecture

```
┌──────────────── Vikshep (this repo) ─────────────────┐
│                                                       │
│  agent/          TypeScript/Bun MCP client            │
│    └─ recipes/   pipeline templates (hep, bsm, …)    │
│  web/            React preview dashboard              │
│  contract/       frozen seam (OID · MCP · WS)        │
│  backend/        thin Rust launcher + Python loaders  │
│                                                       │
└───────────────────────┬───────────────────────────────┘
                        │  28-hex OID  ·  JSON-RPC 2.0
                        ▼
              omnipulse-mcp  (Data-Plane binary)
              omnipulse-rs · omni-wst-core · omni-ffi
```

The seam is fixed: only four things cross the boundary — a 28-hex shm object name, line-delimited JSON-RPC 2.0 frames, a `u64` host pointer (C++↔Rust only), and downsampled previews. No raw tensor ever reaches TypeScript or the browser.

---

## Requirements

- [Bun](https://bun.sh) ≥ 1.1
- Python ≥ 3.10
- Rust / Cargo ≥ 1.75 (for the backend launcher)
- A built `omnipulse-mcp` binary (from the `omnipulse-rs` workspace)

---

## Quick start

```bash
# 1. Build the Data-Plane binary
cd /path/to/omnipulse-rs
cargo build -p omnipulse-mcp

# 2. Install the ingest service
pip install -e Vikshep/backend/ingest

# 3. Install agent dependencies
cd Vikshep/agent && bun install

# 4. Run a pipeline
export OMNIPULSE_MCP_BIN=/path/to/omnipulse-rs/target/debug/omnipulse-mcp
bun run src/main.ts process \
  --input data/jets.root \
  --request "tag jets, decorrelate mass"

# 5. Start the preview dashboard
cd ../web && bun install && bun run dev
```

---

## Pipeline recipes

| Recipe | Trigger keywords | Steps |
|---|---|---|
| `hep-tagging-disco` | tag, jet, mass, disco, sculpt | scatter (ingestMeta) → r₂ reduce → classifier |
| `bsm-anomaly` | anomaly, bsm, new physics, outlier | scatter (ingestMeta) → r₂ reduce → detect_anomaly |
| `general-feature` | feature, extract, scatter, plasma, fluid | scatter (request cfg) → reduce (request cfg) |

Recipes are declarative MCP tool sequences. `cfgFrom: "ingestMeta"` pulls `dim`/`group` from the loader; `cfgFrom: "request"` lets the caller pass any `{dim, group, J, Q, L}` at runtime — nothing is hardcoded to a physics use case.

---

## Data loaders

Loaders are discovered via entry points (`vikshep.loaders`). Each reads a format, writes POSIX shared memory, and returns a 28-hex object ID.

| Entry point | Format | Default cfg hint |
|---|---|---|
| `root-uproot` | `.root` (Geant4, CMS Open Data, …) | dim=2, group=so2 (η×φ image) |
| `hdf5` | `.h5`, `.hdf5`, `.hdf`, `.npz` | dim inferred from array rank |

Add a loader by implementing the `Loader` protocol (`backend/ingest/src/vikshep_ingest/loaders/base.py`) and registering an entry point in your `pyproject.toml`.

---

## Contract

`contract/` is the frozen seam between Control-Plane and Data-Plane:

- `objectId.ts` — `OID = z.string().regex(/^[0-9a-f]{28}$/)` (28-hex, `sha3_256(buf)[:14]`)
- `mcpSchemas.ts` — `ComputeScatteringInput`, `ReduceInput`, `CompareInput`, `DetectAnomalyInput`
- `wsPreview.ts` — `PreviewMsg` and `PipelineEvent` (browser receives only OID + thumbnail + summary)

---

## License

Apache 2.0 — see [LICENSE](LICENSE).
