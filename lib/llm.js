// One place that talks to the LLM. Env: LLM_KEY (required), LLM_BASE, LLM_MODEL, LLM_FALLBACK_MODEL.
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TRANSIENT = [429, 500, 502, 503, 504];

/** Raw OpenAI-compatible call with retry + model fallback. Returns the provider's fetch Response. */
export async function chat(messages, { temperature = 0.4, signal } = {}) {
  const base = (process.env.LLM_BASE || 'https://generativelanguage.googleapis.com/v1beta/openai').replace(/\/$/, '');
  const main = process.env.LLM_MODEL || 'gemini-3.6-flash';
  // Providers throw transient 429/5xx under load ("model overloaded"). Try the main model twice, then the fallback.
  const models = [main, main, process.env.LLM_FALLBACK_MODEL || 'gemini-flash-latest'];
  let r;
  for (let i = 0; i < models.length; i++) {
    r = await fetch(base + '/chat/completions', {
      method: 'POST', signal,
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + process.env.LLM_KEY },
      body: JSON.stringify({ model: models[i], temperature, messages }),
    });
    if (r.ok || !TRANSIENT.includes(r.status)) break;
    await sleep(600 * (i + 1));
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
    if (!r.ok) throw Object.assign(new Error('LLM ' + r.status + ': ' + (await r.text()).slice(0, 200)), { status: r.status });
    try { return extractJson((await r.json()).choices[0].message.content); } catch (e) { if (attempt) throw new Error('The AI gave an unreadable answer.'); }
  }
}
