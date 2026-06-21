#!/usr/bin/env bash
#
# pre-deploy-check.sh — Lightweight regression guard for the 3 fixed flows.
# Runs the static + UI smoke tests in /app/backend/tests/test_regression_lint_fixes.py
# and exits non-zero on failure so it can gate a deploy.
#
# Scope:
#   - /admin/coupons route loads (AdminCoupons import present)
#   - Checkout "Forgot password?" navigates (LoginModal has useNavigate)
#   - Trivia answer click does not crash (selectedAnswer useState declared)
#
# Usage (manual, run before clicking Deploy in Emergent):
#   bash scripts/pre-deploy-check.sh
#
# Optional override: FRONTEND_URL=https://kingdom-soul.com bash scripts/pre-deploy-check.sh
#
set -euo pipefail

cd "$(dirname "$0")/.."

echo "🔎 Pre-deploy regression check — 3 protected flows"
echo "----------------------------------------------------"

# Verify pytest + playwright are available; bail with a clear hint if not.
if ! command -v python >/dev/null 2>&1; then
  echo "❌ python not found on PATH"; exit 2
fi
if ! python -c "import pytest" >/dev/null 2>&1; then
  echo "❌ pytest not installed (pip install pytest playwright)"; exit 2
fi
if ! python -c "import playwright" >/dev/null 2>&1; then
  echo "❌ playwright not installed (pip install playwright && playwright install chromium)"; exit 2
fi

# Run the regression suite, fail-fast.
python -m pytest backend/tests/test_regression_lint_fixes.py \
  -v --tb=short --maxfail=1 -p no:cacheprovider

status=$?
echo "----------------------------------------------------"
if [ $status -eq 0 ]; then
  echo "✅ Regression check passed — safe to deploy."
else
  echo "❌ Regression check FAILED — DO NOT deploy. Fix the failing test, then re-run."
fi
exit $status
