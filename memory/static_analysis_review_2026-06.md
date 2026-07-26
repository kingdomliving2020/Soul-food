# Static-Analysis Findings Review — eval() & Circular Import (June 2026)

Scope: review-only (no refactor, no cleanup). Verdict on the two flagged findings.

## 1. eval() finding → ANALYZER NOISE (CLOSED, no fix)
- Only occurrences of "eval" in backend:
  - A code COMMENT: "Do NOT replace with eval()".
  - Two calls to `ast.literal_eval(...)` in `routes/admin_routes.py` (lines 3004, 3087).
- `ast.literal_eval` parses Python **literals only** (dict/list/str/num); it CANNOT execute
  arbitrary code — fundamentally different from `eval()`.
- Input is a substring of the **trusted local module `payment_routes.py`** (the PRODUCTS dict),
  read from disk on the server — NOT user input. No injection surface.
- **Verdict: false positive. Not a launch risk. Closed.**

## 2. Circular import finding → NOT A REAL RISK (already mitigated, CLOSED)
- Only potential cycle: `email_service` ↔ `payment_routes`.
  - `email_service.py:142` imports `payment_routes.expand_items_for_receipt` at **function level** (lazy).
  - `payment_routes.py` imports `email_service.*` only at **function level** (lazy) — no top-level import.
- Other deferred imports (`from server import db`, router registration in `server.py`) are likewise
  function-level, so no module forms a top-level cycle.
- Verified: `price_catalog`, `email_service`, `payment_routes`, `routes.admin_routes`, `server`
  all import cleanly in dependency order with **no ImportError / circular error**, and the running
  backend confirms no runtime issue.
- **Verdict: intentionally broken via lazy imports. Not a launch risk. Closed.**

## Result
No code changes required. Both findings documented and closed. Everything else stays in the
post-launch backlog per current priorities (production validation, entitlement accuracy, library
assignment, buyer vs recipient routing, fulfillment accuracy, pricing integrity).
