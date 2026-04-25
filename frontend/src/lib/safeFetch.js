/**
 * Safely read a fetch Response body as parsed JSON.
 * Handles: body already consumed, non-JSON responses, network errors.
 * Returns { ok: boolean, status: number, data: object }
 */
export async function safeJson(response) {
  let text = '';
  try {
    text = await response.text();
  } catch {
    // Body already consumed (e.g., by proxy/service worker)
    return {
      ok: response.ok,
      status: response.status,
      data: { detail: `Response unreadable (${response.status}). The request may have succeeded — please refresh.` }
    };
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { detail: text || `Server error (${response.status})` };
  }

  return { ok: response.ok, status: response.status, data };
}
