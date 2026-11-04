// One place that talks to the LLM. The visitor supplies a Gemini key per request; it is used once and never stored or logged.
// The provider URL is fixed here so a visitor key can only ever go to Google. Optional env: LLM_MODEL, LLM_FALLBACK_MODEL.
const BASE = 'https://generativelanguage.googleapis.com/v1beta/openai';

/** The visitor's key from a request header, or null if it is missing or malformed. */
export const headerKey = (req, name) => { const k = (req.headers.get(name) || '').trim(); return /^[\x21-\x7e]{8,300}$/.test(k) ? k : null; };

/** A clear message for a failed provider call. Never echoes the provider's body. */
export function llmError(status, body = '') {
  if (status === 401 || status === 403 || /api[ _]key/i.test(body)) return { status: 401, error: 'Google rejected that Gemini API key. Check it and try again.' };
  if (status === 429) return { status: 429, error: 'Your Gemini key hit its rate limit. Wait a minute and try again.' };
  return { status: 502, error: `The AI could not answer (error ${status}). Try again.` };
}
export const noKey = () => Response.json({ error: 'Add your own Gemini API key in Model settings. A demo pitch works without one.' }, { status: 400 });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TRANSIENT = [404, 429, 500, 502, 503, 504]; // 404: a retired model name steps down the ladder too

/** Raw OpenAI-compatible call with retry + model fallback. Returns the provider's fetch Response. */
export async function chat(messages, { key, temperature = 0.4, signal } = {}) {
  const main = process.env.LLM_MODEL || 'gemini-3.6-flash';
  // Free-tier keys hit per-model rate limits (429) and providers throw "overloaded" 5xx. Each model has its own quota,
  // so step down a ladder of models rather than hammering the same one.
  const models = [main, process.env.LLM_FALLBACK_MODEL || 'gemini-flash-latest', 'gemini-flash-lite-latest'];
  let r;
  for (let i = 0; i < models.length; i++) {
    r = await fetch(BASE + '/chat/completions', {
      method: 'POST', signal,
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
      body: JSON.stringify({ model: models[i], temperature, messages }),
    });
    if (r.ok || !TRANSIENT.includes(r.status)) break;
    await sleep(400);
  }
  return r;
}

/** Pull the first JSON object out of a model reply (models love ```json fences). Throws if none parses. */
export function extractJson(raw) {
  const s = String(raw), a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('no JSON object in model output');
  return JSON.parse(s.slice(a, b + 1));
}

/** chat() → parsed JSON, retrying once if the model returns something unparseable. */
export async function chatJson(messages, opts = {}) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await chat(messages, opts);
    if (!r.ok) { const e = llmError(r.status, await r.text()); throw Object.assign(new Error(e.error), { status: e.status }); }
    try { return extractJson((await r.json()).choices[0].message.content); } catch (e) { if (attempt) throw new Error('The AI gave an unreadable answer.'); }
  }
}
