// Waitlist capture. Forwards the email to WAITLIST_WEBHOOK (Zapier / Make / Apps Script / Slack…).
// Not configured → 501 and the browser keeps its local copy.
import { guard } from '@/lib/guard';

export async function POST(req) {
  const refused = guard(req, { limit: 5, bucket: 'wl:' });
  if (refused) return refused;
  const { email: raw } = await req.json().catch(() => ({}));
  const email = String(raw || '').trim().toLowerCase();
  if (!/^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/.test(email)) return Response.json({ error: 'invalid email' }, { status: 400 });
  if (!process.env.WAITLIST_WEBHOOK) return Response.json({ error: 'waitlist webhook not configured' }, { status: 501 });
  const r = await fetch(process.env.WAITLIST_WEBHOOK, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, source: 'pitchcoach', at: new Date().toISOString(), text: `New PitchCoach waitlist signup: ${email}` }),
  });
  return Response.json({ ok: r.ok }, { status: r.ok ? 200 : 502 });
}
