// authUtils.js — single source of truth for auth state cleanup.
// Use clearAllAuth() everywhere a user signs out, switches identity, or hits a
// stale-JWT 404. Prevents the "User Not Found" ghost where a JWT for an
// account that no longer exists keeps the frontend in a broken state.

export const AUTH_STORAGE_KEYS = [
  'token',
  'soulFoodToken',
  'soul_food_token',
  'admin_token',
  'access_token',
  'user',
  'soul_food_user',
  'soulFoodUser',
  'pendingAuthUser',
];

export const clearAllAuth = () => {
  try {
    for (const key of AUTH_STORAGE_KEYS) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
    // Broadcast so any listening component (cart, header avatar, etc.) refreshes
    window.dispatchEvent(new Event('auth-changed'));
  } catch {
    // localStorage may be disabled; nothing else we can do
  }
};

// Helper: pull the current token from any of the known keys.
export const getActiveToken = () => {
  try {
    for (const key of AUTH_STORAGE_KEYS) {
      const v = localStorage.getItem(key);
      // Only return if it looks like a JWT-ish string (3 dot-separated parts)
      if (v && typeof v === 'string' && v.split('.').length === 3) return v;
    }
  } catch {}
  return null;
};

// Helper: safe fetch that auto-purges stale-JWT 404s.
// Use for endpoints that may return 404 when the JWT references a missing user
// (e.g. /api/auth/me). The caller still gets the original Response, but the
// auth keys are wiped first if the server says the user doesn't exist.
export const fetchWithAuthCleanup = async (url, opts = {}) => {
  const token = getActiveToken();
  const headers = { ...(opts.headers || {}) };
  if (token && !headers.Authorization) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { ...opts, headers });
  if (res.status === 404 && token) {
    try {
      const cloned = res.clone();
      const body = await cloned.json().catch(() => ({}));
      const detail = String(body?.detail || '').toLowerCase();
      if (detail.includes('user not found') || detail.includes('user does not exist')) {
        console.warn('[auth] stale JWT detected — purging local auth state');
        clearAllAuth();
      }
    } catch {}
  }
  return res;
};
