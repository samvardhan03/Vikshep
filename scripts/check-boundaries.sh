#!/usr/bin/env bash
# check-boundaries.sh — enforce the Control/Data-Plane seam contracts.
#
# Run from anywhere inside the repo:
#   bash scripts/check-boundaries.sh
#
# Exit 1 on any violation; prints "boundaries OK" on clean pass.

set -euo pipefail

# Resolve the repo root from this script's location (scripts/ is one level below root).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "$REPO_ROOT"

FAIL=0

# ---------------------------------------------------------------------------
# 1. No raw tensor arrays in any *Input MCP schema.
#    z.array(z.number().int()) is allowed (shape metadata — integer counts).
#    z.array(z.number())       is forbidden (float32 tensor payload).
# ---------------------------------------------------------------------------
echo "[check] 1. No tensor arrays in *Input MCP schemas…"
TENSOR_HITS=$(
  grep -RnE 'z\.array\(z\.number\(\)\)' \
       agent/src contract 2>/dev/null \
    | grep -iE 'Input' \
    | grep -v '\.int()' \
  || true
)
if [ -n "$TENSOR_HITS" ]; then
  echo "FAIL: tensor array found in MCP input schema:"
  echo "$TENSOR_HITS"
  FAIL=1
else
  echo "  PASS"
fi

# ---------------------------------------------------------------------------
# 2a. No 40-hex OID relics anywhere in the created trees.
# ---------------------------------------------------------------------------
echo "[check] 2a. No 40-hex OID relics…"
HEX40_HITS=$(
  grep -RnE '\[0-9a-f\]\{40\}' agent/src contract backend 2>/dev/null || true
)
if [ -n "$HEX40_HITS" ]; then
  echo "FAIL: 40-hex ID found:"
  echo "$HEX40_HITS"
  FAIL=1
else
  echo "  PASS"
fi

# ---------------------------------------------------------------------------
# 2b. 28-hex regex present in the canonical OID contract file.
# ---------------------------------------------------------------------------
echo "[check] 2b. 28-hex regex in contract/objectId.ts…"
if grep -qE '\[0-9a-f\]\{28\}' contract/objectId.ts 2>/dev/null; then
  echo "  PASS"
else
  echo "FAIL: 28-hex regex missing from contract/objectId.ts"
  FAIL=1
fi

# ---------------------------------------------------------------------------
# 4. No AI attribution in any product file.
#    Excludes: *.lock, LICENSE, *.md docs (strategy docs stay local, never committed).
# ---------------------------------------------------------------------------
echo "[check] 4. No AI attribution in product files…"
ATTR_HITS=$(
  grep -RniE \
       'co-?authored.*(claude|anthropic|gpt|openai|llm)|generated (with|by).*(claude|anthropic|gpt|openai|llm)|written (with|by).*(claude|ai\b|anthropic)' \
       --exclude="*.lock" \
       --exclude="*.map" \
       --exclude="LICENSE" \
       --exclude="*.bak" \
       --exclude-dir=node_modules \
       --exclude-dir=dist \
       --exclude-dir=.venv \
       --exclude-dir=__pycache__ \
       --exclude-dir=target \
       --exclude-dir=.git \
       agent backend contract scripts site web 2>/dev/null \
  || true
)
if [ -n "$ATTR_HITS" ]; then
  echo "FAIL: AI-attribution text present:"
  echo "$ATTR_HITS"
  FAIL=1
else
  echo "  PASS"
fi

# ---------------------------------------------------------------------------
# 5. Leakage guard — no private engine references in the public tree.
# ---------------------------------------------------------------------------
echo "[check] 5. No private engine leakage in public tree…"
LEAKAGE_HITS=$(
  grep -RnE 'dataplane-contrib|vikshep-engine/engine|steerable\.cuh|tile_policy|scatter_engine|omni-lock|/Users/' \
       --exclude-dir=node_modules \
       --exclude-dir=.git \
       --exclude-dir=__pycache__ \
       --exclude-dir=dist \
       --exclude-dir=target \
       --exclude-dir=.next \
       --exclude="*.lock" \
       --exclude="*.map" \
       --exclude="check-boundaries.sh" \
       agent backend contract site web bench examples 2>/dev/null \
  || true
)
if [ -n "$LEAKAGE_HITS" ]; then
  echo "FAIL: private engine reference found in public tree:"
  echo "$LEAKAGE_HITS"
  FAIL=1
else
  echo "  PASS"
fi

# ---------------------------------------------------------------------------
# 6. Strategy docs not tracked in git.
# ---------------------------------------------------------------------------
echo "[check] 6. Strategy docs (claude/ docs/) not tracked in git…"
TRACKED=$(git ls-files claude docs 2>/dev/null || true)
if [ -n "$TRACKED" ]; then
  echo "FAIL: strategy material is tracked in git:"
  echo "$TRACKED"
  FAIL=1
else
  echo "  PASS"
fi

# ---------------------------------------------------------------------------
# Result
# ---------------------------------------------------------------------------
echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "boundaries OK"
else
  echo "boundaries FAILED — see above"
  exit 1
fi
