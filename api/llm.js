// Vercel serverless proxy: keeps the LLM key server-side. Env: LLM_BASE, LLM_MODEL, LLM_KEY.
// Gemini rejects browser-origin calls with Bearer keys, so the browser talks to this instead.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { messages, temperature = 0.4 } = req.body || {};
  if (!Array.isArray(messages) || messages.length > 10) return res.status(400).json({ error: 'bad messages' });
  const base = (process.env.LLM_BASE || 'https://generativelanguage.googleapis.com/v1beta/openai').replace(/\/$/, '');
  const r = await fetch(base + '/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + process.env.LLM_KEY },
    body: JSON.stringify({ model: process.env.LLM_MODEL || 'gemini-3.6-flash', temperature, messages }),
  });
  res.status(r.status).setHeader('content-type', 'application/json');
  res.send(await r.text());
}
