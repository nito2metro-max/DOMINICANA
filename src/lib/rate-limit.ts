/**
 * Limitador de intentos en memoria (por proceso). Suficiente para una primera versión
 * con una sola instancia; en producción multi-instancia usar Redis/Upstash.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  b.count++;
  return { ok: b.count <= limit, remaining: Math.max(0, limit - b.count) };
}

export function resetRateLimits() {
  buckets.clear();
}
