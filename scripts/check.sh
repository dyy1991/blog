#!/usr/bin/env bash
# Pre-commit quality check — mirrors the CI "Code Quality" job exactly.
# Run: bash scripts/check.sh
# Exit 0 = all passed, exit 1 = something failed.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PASS=0
FAIL=0

run() {
  local label="$1"; shift
  echo -n "  $label ... "
  if "$@" > /tmp/check_out 2>&1; then
    echo "✅"
    PASS=$((PASS + 1))
  else
    echo "❌"
    cat /tmp/check_out
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Pre-commit check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

run "TypeScript (tsc --noEmit)"  npx tsc --noEmit
run "ESLint"                      npm run lint

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Passed: $PASS  Failed: $FAIL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

[ "$FAIL" -eq 0 ]   # exit 0 only if all passed
