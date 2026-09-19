// Vercel serverless proxy: keeps the LLM key server-side. Env: LLM_KEY (required), LLM_BASE, LLM_MODEL, LLM_FALLBACK_MODEL.
// Gemini rejects browser-origin calls with Bearer keys, so the browser talks to this instead.
import { guard } from './_guard.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!guard(req, res, { limit: 20 })) return;
  const { messages, temperature = 0.4 } = req.body || {};
  if (!Array.isArray(messages) || messages.length > 10 || JSON.stringify(messages).length > 20000) return res.status(400).json({ error: 'bad messages' });
  const base = (process.env.LLM_BASE || 'https://generativelanguage.googleapis.com/v1beta/openai').replace(/\/$/, '');
  // Providers throw transient 429/5xx under load ("model overloaded"). Try the main model twice, then the fallback.
  const models = [process.env.LLM_MODEL || 'gemini-3.6-flash', process.env.LLM_MODEL || 'gemini-3.6-flash', process.env.LLM_FALLBACK_MODEL || 'gemini-flash-latest'];
  let r;
  for (let i = 0; i < models.length; i++) {
    r = await fetch(base + '/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + process.env.LLM_KEY },
      body: JSON.stringify({ model: models[i], temperature, messages }),
    });
    if (r.ok || ![429, 500, 502, 503, 504].includes(r.status)) break;
    await sleep(600 * (i + 1));
  }
  res.status(r.status).setHeader('content-type', 'application/json');
  res.send(await r.text());
}
