import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';

// Storage key shared with CheckoutPage for auto-apply
export const PROMO_STORAGE_KEY = 'sofu_pending_promo';
// 30 day TTL — gives plenty of time for an email/text promo to be redeemed
const PROMO_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * PromoCapture
 * Watches every URL change for a ?promo=CODE parameter.
 * When found:
 *  - Persists the code (uppercased) to localStorage with a timestamp.
 *  - Shows a one-time confirmation toast so the customer knows it'll apply.
 *  - Strips the param from the URL so it isn't double-captured on refresh.
 *
 * CheckoutPage reads PROMO_STORAGE_KEY on mount and auto-applies the coupon.
 */
const PromoCapture = () => {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get('promo') || params.get('coupon');
    if (!raw) return;

    const code = raw.trim().toUpperCase();
    if (!code) return;

    try {
      const existing = JSON.parse(localStorage.getItem(PROMO_STORAGE_KEY) || 'null');
      if (!existing || existing.code !== code) {
        localStorage.setItem(
          PROMO_STORAGE_KEY,
          JSON.stringify({ code, capturedAt: Date.now(), ttl: PROMO_TTL_MS })
        );
        toast.success(`Promo "${code}" saved — it'll apply automatically at checkout!`, {
          duration: 6000,
        });
      }
    } catch (e) {
      // localStorage may be disabled; silently no-op
    }

    // Strip the promo param so we don't re-toast on hot reload / refresh
    params.delete('promo');
    params.delete('coupon');
    const newSearch = params.toString();
    const newUrl = `${location.pathname}${newSearch ? '?' + newSearch : ''}${location.hash || ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [location.search, location.pathname, location.hash]);

  return null;
};

export default PromoCapture;

/**
 * Read the captured promo (if still within TTL).
 * Returns { code } or null.
 */
export const getCapturedPromo = () => {
  try {
    const raw = localStorage.getItem(PROMO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.code) return null;
    const age = Date.now() - (parsed.capturedAt || 0);
    if (age > (parsed.ttl || PROMO_TTL_MS)) {
      localStorage.removeItem(PROMO_STORAGE_KEY);
      return null;
    }
    return { code: parsed.code };
  } catch {
    return null;
  }
};

export const clearCapturedPromo = () => {
  try { localStorage.removeItem(PROMO_STORAGE_KEY); } catch {}
};
