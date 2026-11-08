import "server-only";
import { headers } from "next/headers";

/**
 * Fixed-window in-memory rate limiter. Suitable for a single instance.
 * For multi-instance deployments swap the store for Redis/Upstash with the same interface.
 */
type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (store.size > 10_000) for (const [k, b] of store) if (b.resetAt < now) store.delete(k);
  const bucket = store.get(key);
  if (!bucket || bucket.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  bucket.count += 1;
  if (bucket.count > limit) return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  return { ok: true, retryAfter: 0 };
}

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

/** Convenience: limit an action per client IP. Returns an error message when limited. */
export async function limitByIp(action: string, limit: number, windowMs: number): Promise<string | null> {
  const ip = await clientIp();
  const res = rateLimit(`${action}:${ip}`, limit, windowMs);
  return res.ok ? null : `Too many attempts. Please try again in ${Math.max(1, Math.ceil(res.retryAfter / 60))} minute(s).`;
}
