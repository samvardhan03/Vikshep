## Summary

<!-- What does this PR do? Why? -->

## Test plan

- [ ] `pytest backend/ingest` passes (g4, disco, well, bench suites)
- [ ] `bun test` in `agent/` passes
- [ ] `bunx tsc --noEmit` in `agent/` passes
- [ ] `bun run build` in `site/` passes
- [ ] `bash scripts/check-boundaries.sh` passes (including leakage checks 5 and 6)

## Boundary checklist

- [ ] No engine source, strategy docs, pilot data, or absolute local paths in this diff
- [ ] `check-boundaries.sh` green (run output pasted below or in CI)
- [ ] No `z.array(z.number())` float tensor in any `*Input` MCP schema added
- [ ] No `cargo install` or `pip install vikshep-ingest` instructions added (install-honesty rule)
- [ ] No AI-attribution text in any file or commit message

## Discrepancies

<!-- Any place the tree contradicts the spec; record or "none" -->

## Proposed decisions taken

<!-- Flag any (proposed) items from the spec that were decided here -->
