// PitchCoach's LLM proxy. The visitor's key arrives in a header, is used for this call only and is never stored or logged.
import { guard } from '@/lib/guard';
import { chat, headerKey, llmError, noKey } from '@/lib/llm';

export async function POST(req) {
  const refused = guard(req, { limit: 20, bucket: 'llm:' });
  if (refused) return refused;
  const key = headerKey(req, 'x-llm-key');
  if (!key) return noKey();
  const { messages, temperature = 0.4 } = await req.json().catch(() => ({}));
  if (!Array.isArray(messages) || messages.length > 10 || JSON.stringify(messages).length > 20000) return Response.json({ error: 'bad messages' }, { status: 400 });
  const r = await chat(messages, { key, temperature });
  const body = await r.text();
  if (!r.ok) { const e = llmError(r.status, body); return Response.json({ error: e.error }, { status: e.status }); }
  return new Response(body, { headers: { 'content-type': 'application/json' } });
}
