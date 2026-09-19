// PitchCoach's LLM proxy: keeps the key server-side (Gemini also rejects browser-origin Bearer calls).
import { guard } from '@/lib/guard';
import { chat } from '@/lib/llm';

export async function POST(req) {
  const refused = guard(req, { limit: 20, bucket: 'llm:' });
  if (refused) return refused;
  const { messages, temperature = 0.4 } = await req.json().catch(() => ({}));
  if (!Array.isArray(messages) || messages.length > 10 || JSON.stringify(messages).length > 20000) return Response.json({ error: 'bad messages' }, { status: 400 });
  const r = await chat(messages, { temperature });
  return new Response(await r.text(), { status: r.status, headers: { 'content-type': 'application/json' } });
}
