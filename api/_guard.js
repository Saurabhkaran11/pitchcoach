// Shared abuse guard for the public proxies: same-site origin check + per-IP rate limit.
// ponytail: in-memory counters are per serverless instance and reset on cold start — good enough to stop
// casual credit-burning; move to Upstash/Vercel KV for a hard global limit when traffic is real.
const hits = new Map();

export function guard(req, res, { limit = 20, windowMs = 60_000 } = {}) {
  // Browsers always send Origin on cross-site POSTs; allow same host, localhost dev, and any extra in ALLOWED_ORIGINS.
  const origin = req.headers.origin;
  if (origin) {
    const host = new URL(origin).host;
    const allowed = [req.headers.host, ...(process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)];
    if (!allowed.includes(host) && !host.startsWith('localhost')) { res.status(403).json({ error: 'origin not allowed' }); return false; }
  }
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  const now = Date.now(), rec = hits.get(ip);
  if (!rec || now - rec.start > windowMs) hits.set(ip, { start: now, n: 1 });
  else if (++rec.n > limit) { res.status(429).json({ error: 'Too many requests — slow down and try again in a minute.' }); return false; }
  if (hits.size > 5000) hits.clear(); // bound memory
  return true;
}
