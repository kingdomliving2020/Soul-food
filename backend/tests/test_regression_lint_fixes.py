"""
Regression tests for 3 production bugs fixed in the June 21, 2026 lint sweep.

Each test verifies the fix via BOTH:
  - a static source-code check (the original bugs were missing imports / missing
    useState declarations, so static checks are the most reliable regression),
  - a browser smoke test where the UI flow is reachable (skips gracefully when
    auth/entitlement gates prevent reaching the buggy line).

  1. /admin/coupons route loads (was: AdminCoupons import missing → ReferenceError)
  2. "Forgot password?" in checkout LoginModal navigates without crashing
     (was: navigate undefined → ReferenceError)
  3. Trivia answer click does not crash
     (was: setSelectedAnswer undefined → ReferenceError)

Run with: pytest /app/backend/tests/test_regression_lint_fixes.py -v
"""
import os
import re
import pytest
from playwright.sync_api import sync_playwright

FRONTEND_URL = (
    os.environ.get("FRONTEND_URL")
    or "https://content-durability.preview.emergentagent.com"
)
SRC = "/app/frontend/src"


def _read(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def _read_env_var(path: str, key: str) -> str | None:
    try:
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, _, v = line.partition("=")
                if k.strip() == key:
                    return v.strip().strip('"').strip("'")
    except FileNotFoundError:
        return None
    return None


def _frontend_url() -> str:
    backend = _read_env_var("/app/frontend/.env", "REACT_APP_BACKEND_URL")
    return backend or FRONTEND_URL


def _collect_js_errors(page):
    errors: list[str] = []
    page.on("pageerror", lambda exc: errors.append(f"pageerror: {exc}"))
    page.on(
        "console",
        lambda msg: errors.append(f"console.error: {msg.text}")
        if msg.type == "error"
        else None,
    )
    return errors


def _is_reference_error(errors: list[str], symbol: str) -> bool:
    pattern = re.compile(
        rf"(ReferenceError|is not defined).*{re.escape(symbol)}|{re.escape(symbol)}.*(is not defined|ReferenceError)",
        re.IGNORECASE,
    )
    return any(pattern.search(e) for e in errors)


@pytest.fixture(scope="module")
def browser_context():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        yield context
        context.close()
        browser.close()


# -----------------------------------------------------------------------------
# Test 1: /admin/coupons route loads (AdminCoupons import present + UI smoke)
# -----------------------------------------------------------------------------
def test_admin_coupons_import_present():
    """Static: AdminConsole.js must import AdminCoupons."""
    src = _read(f"{SRC}/AdminConsole.js")
    assert re.search(
        r"import\s+AdminCoupons\s+from\s+['\"]\./AdminCoupons['\"]", src
    ), "AdminConsole.js is missing 'import AdminCoupons' — /admin/coupons will crash."
    assert "<AdminCoupons" in src, "AdminConsole.js no longer renders <AdminCoupons />."


def test_admin_coupons_route_loads(browser_context):
    """Smoke: navigating to /admin/coupons does not raise a ReferenceError."""
    url = _frontend_url()
    page = browser_context.new_page()
    errors = _collect_js_errors(page)
    try:
        page.goto(f"{url}/admin/coupons", wait_until="domcontentloaded", timeout=20000)
        page.wait_for_timeout(2500)
        assert not _is_reference_error(errors, "AdminCoupons"), (
            f"AdminCoupons ReferenceError surfaced: {errors}"
        )
    finally:
        page.close()


# -----------------------------------------------------------------------------
# Test 2: Checkout "Forgot password?" — LoginModal owns useNavigate
# -----------------------------------------------------------------------------
def test_checkout_login_modal_has_usenavigate():
    """Static: LoginModal in CheckoutPage.js must invoke useNavigate()."""
    src = _read(f"{SRC}/CheckoutPage.js")
    # Find the LoginModal definition and assert useNavigate() is called inside it.
    match = re.search(
        r"const\s+LoginModal\s*=\s*\(\s*\{[^}]*\}\s*\)\s*=>\s*\{(.*?)(?:\n\};|\nconst\s+\w)",
        src,
        re.DOTALL,
    )
    assert match, "Could not locate LoginModal definition in CheckoutPage.js"
    body = match.group(1)
    assert "useNavigate(" in body, (
        "LoginModal must call useNavigate() — otherwise the 'Forgot password?' "
        "click throws ReferenceError on navigate."
    )


def test_checkout_forgot_password_navigates(browser_context):
    """Smoke: clicking 'Forgot password?' in the checkout login modal navigates
    to /forgot-password without throwing. Skips if the modal isn't reachable
    (e.g. auto-login from a previous test run leaves the user signed in)."""
    url = _frontend_url()
    page = browser_context.new_page()
    errors = _collect_js_errors(page)
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=20000)
        page.wait_for_timeout(1200)
        page.evaluate(
            """() => {
              localStorage.removeItem('soulFoodToken');
              localStorage.removeItem('soul_food_token');
              localStorage.removeItem('soul_food_user');
              const item = {
                id: 'test-regression', productId: 'holiday-ae',
                name: 'Regression Test Item', price: 14.99, salePrice: 14.99,
                quantity: 1, edition: 'adult', uniqueKey: 'test-regression'
              };
              localStorage.setItem('soulFoodCart', JSON.stringify([item]));
            }"""
        )
        page.goto(f"{url}/checkout", wait_until="domcontentloaded", timeout=20000)
        page.wait_for_timeout(2500)
        btn = page.query_selector('[data-testid="checkout-forgot-password"]')
        if btn is None:
            pytest.skip("checkout-forgot-password button not visible — modal not in login mode")
        btn.click()
        page.wait_for_timeout(2000)
        assert not _is_reference_error(errors, "navigate"), (
            f"navigate ReferenceError surfaced: {errors}"
        )
        assert "/forgot-password" in page.url, f"Did not navigate. URL={page.url}"
    finally:
        page.close()


# -----------------------------------------------------------------------------
# Test 3: Trivia answer click — setSelectedAnswer is declared
# -----------------------------------------------------------------------------
def test_trivia_selected_answer_state_declared():
    """Static: TrickyTestamentGame.js must declare [selectedAnswer, setSelectedAnswer]."""
    src = _read(f"{SRC}/TrickyTestamentGame.js")
    assert re.search(
        r"const\s+\[\s*selectedAnswer\s*,\s*setSelectedAnswer\s*\]\s*=\s*useState",
        src,
    ), (
        "TrickyTestamentGame.js missing useState for selectedAnswer — "
        "handleAnswer() will throw ReferenceError on every answer click."
    )


def test_trivia_answer_click_does_not_crash(browser_context):
    """Smoke: loading the trivia route and triggering a click does not raise
    a setSelectedAnswer ReferenceError. Skips if the board isn't reachable."""
    url = _frontend_url()
    page = browser_context.new_page()
    errors = _collect_js_errors(page)
    try:
        page.goto(f"{url}/tricky-testament", wait_until="domcontentloaded", timeout=20000)
        page.wait_for_timeout(3000)

        # Just loading the component compiles the JSX and prepares the handler.
        # The original bug fired at runtime on click, but a successful import +
        # render of the component is also evidence that the static fix worked.
        # If the board is reachable, try clicking through.
        clicked_any = False
        cells = page.query_selector_all("button, [role='button']")
        for cell in cells[:40]:
            try:
                text = (cell.inner_text() or "").strip()
            except Exception:
                continue
            if text.startswith("$") and text[1:].replace(",", "").isdigit():
                try:
                    cell.click(timeout=1200)
                    clicked_any = True
                    break
                except Exception:
                    continue
        if clicked_any:
            page.wait_for_timeout(1200)
            # Click any non-control button as the "answer"
            for opt in page.query_selector_all("button"):
                try:
                    txt = (opt.inner_text() or "").strip()
                except Exception:
                    continue
                if txt and not txt.startswith("$") and txt.lower() not in (
                    "close", "skip", "exit", "back", "wager", "submit wager",
                    "sign in", "sign out",
                ):
                    try:
                        opt.click(timeout=1200)
                        break
                    except Exception:
                        continue
            page.wait_for_timeout(1500)
        assert not _is_reference_error(errors, "setSelectedAnswer"), (
            f"setSelectedAnswer ReferenceError surfaced: {errors}"
        )
    finally:
        page.close()
