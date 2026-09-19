// Waitlist capture. Forwards the email to WAITLIST_WEBHOOK (Zapier / Make / Google Apps Script / Formspree / Slack…)
// so leads land somewhere you own. Not configured → 501 and the browser keeps its local copy.
import { guard } from './_guard.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!guard(req, res, { limit: 5 })) return;
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!/^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/.test(email)) return res.status(400).json({ error: 'invalid email' });
  if (!process.env.WAITLIST_WEBHOOK) return res.status(501).json({ error: 'waitlist webhook not configured' });
  const r = await fetch(process.env.WAITLIST_WEBHOOK, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, source: 'pitchcoach', at: new Date().toISOString(), text: `New PitchCoach waitlist signup: ${email}` }),
  });
  res.status(r.ok ? 200 : 502).json({ ok: r.ok });
}
