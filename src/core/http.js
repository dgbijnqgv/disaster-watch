// JSON over HTTPS for every runtime the core runs in: browser/WebView, Electron main (Node) and the
// Android background runner. The runner has no AbortController or setTimeout, so the timeout is best-effort.

/**
 * @param {string} url
 * @param {{ timeoutMs?: number, userAgent?: string }} [options] userAgent is honoured in Node only; browsers set their own.
 */
export async function getJson(url, { timeoutMs = 20000, userAgent } = {}) {
  const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = ctrl && typeof setTimeout === 'function' ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
  try {
    const headers = { Accept: 'application/json, application/geo+json' };
    if (userAgent) headers['User-Agent'] = userAgent;
    const res = await fetch(url, { headers, ...(ctrl ? { signal: ctrl.signal } : {}) });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url).host}`);
    return await res.json();
  } finally {
    if (timer) clearTimeout(timer);
  }
}
