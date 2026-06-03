const fetchCache = new Map<string, { data: unknown; expiry: number }>();

/** Escape HTML special characters (&, <, >, ", ') for safe text interpolation. */
export function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Shell-escape a string by wrapping it in single quotes and handling embedded quotes per POSIX. */
export function shellEscape(str: string): string {
  return "'" + String(str).replace(/'/g, `'"'"'`) + "'";
}

/** Fetch and parse JSON from a URL with optional TTL-based caching. Returns `null` on failure. */
export async function fetchJson<T>(url: string, ttlMs = 0): Promise<T | null> {
  if (ttlMs > 0) {
    const cached = fetchCache.get(url);
    if (cached && cached.expiry > Date.now()) return cached.data as T;
  }
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) return null;
    const data = await res.json();
    if (ttlMs > 0) fetchCache.set(url, { data, expiry: Date.now() + ttlMs });
    return data as T;
  } catch (e) {
    console.warn('Fetch failed:', url, e);
    return null;
  }
}

/** Set the `textContent` of an element by its `id`. No-op if the element does not exist. */
export function setText(id: string, value: string) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
