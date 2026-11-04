// Boson Higgs TTS 3 proxy. The visitor's Boson key arrives in a header and is never stored or logged. Optional ref_audio (base64) clones the speaker's voice.
import { guard } from '@/lib/guard';
import { headerKey } from '@/lib/llm';

export async function POST(req) {
  const refused = guard(req, { limit: 15, bucket: 'tts:' });
  if (refused) return refused;
  const key = headerKey(req, 'x-boson-key');
  if (!key) return Response.json({ error: 'Add your own Boson AI key in Model settings to hear the cloned voice.' }, { status: 400 });
  const { input, ref_audio, ref_text } = await req.json().catch(() => ({}));
  if (typeof input !== 'string' || !input || input.length > 2000) return Response.json({ error: 'bad input' }, { status: 400 });
  const body = { input, model: 'higgs-tts-3', voice: 'default', response_format: 'mp3' };
  if (ref_audio) { body.ref_audio = ref_audio; body.ref_text = ref_text || ''; }
  const r = await fetch('https://api.boson.ai/v1/audio/speech', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
    body: JSON.stringify(body),
  });
  if (r.status === 401 || r.status === 403) return Response.json({ error: 'Boson AI rejected that key. Check it and try again.' }, { status: 401 });
  if (!r.ok) return Response.json({ error: `Boson AI could not read this aloud (error ${r.status}).` }, { status: 502 });
  return new Response(r.body, { headers: { 'content-type': r.headers.get('content-type') || 'audio/mpeg' } });
}
