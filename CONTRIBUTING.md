# Contributing to Vikshep

Thank you for your interest in contributing. Vikshep is a deterministic
feature-extraction plane for detector physics: from Geant4 output to physics
answer.

## Repository layout

- `backend/ingest/` — Python package `vikshep-ingest`: the Geant4 Direct
  Interface (`vikshep-ingest g4`), loader plugins, POSIX shared-memory staging,
  weighted DisCo (`disco.py`), and the recipe CLI (`vikshep-recipe tag` /
  `calibrate`).
- `agent/` — TypeScript/Bun MCP orchestrator and declarative recipes.
- `contract/` — the frozen seam (OID, MCP schemas, WS preview).
- `bench/` — benchmark harness.
- `site/` — Next.js site; `web/` — preview dashboard.
- `examples/` — quickstart and sample data.

The scattering transform itself is not in this repository. It is being built
in the open deterministic core (`samvardhan03/vikshep-compute`, in
development); see "Engine status" in the README.

## Development setup

```bash
# Python (ingest, recipes, harness)
pip install pytest -e backend/ingest
python -m pytest backend/ingest/tests

# Agent
bun install
cd agent && bun test && bunx tsc --noEmit

# Site
cd site && bun install --frozen-lockfile && bun run build

# Boundary checks
bash scripts/check-boundaries.sh
```

## Pull request guidelines

- Fill in the PR template, including the test plan and boundary checklist.
- Provide tests for any new numerical logic.
- Do not add benchmark, timing, or determinism claims without a passing test
  that backs them.
- PR titles follow conventional commits: `feat:`, `fix:`, `docs:`, etc.

## License

Contributions are accepted under the license of this repository; see
[LICENSE](LICENSE) and [LICENSING.md](LICENSING.md).

For commercial terms, contact shekhawatsamvardhan@gmail.com.
