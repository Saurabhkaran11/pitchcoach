// Shared abuse guard for the public endpoints: same-site origin check + per-IP rate limit.
// ponytail: in-memory counters are per serverless instance and reset on cold start — stops casual
// credit-burning; move to Upstash/Vercel KV for a hard global limit when traffic is real.
const hits = new Map();
const json = (status, body) => Response.json(body, { status });

/** Returns a Response to send back if the request is refused, otherwise null. */
export function guard(req, { limit = 20, windowMs = 60_000, bucket = '' } = {}) {
  const origin = req.headers.get('origin');
  if (origin) {
    const host = new URL(origin).host;
    const allowed = [req.headers.get('host'), ...(process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)];
    if (!allowed.includes(host) && !host.startsWith('localhost')) return json(403, { error: 'origin not allowed' });
  }
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  const key = bucket + ip, now = Date.now(), rec = hits.get(key);
  if (!rec || now - rec.start > windowMs) hits.set(key, { start: now, n: 1 });
  else if (++rec.n > limit) return json(429, { error: 'Too many requests — slow down and try again in a minute.' });
  if (hits.size > 5000) hits.clear(); // bound memory
  return null;
}
