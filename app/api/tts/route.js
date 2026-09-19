// Boson Higgs TTS 3 proxy: keeps BOSON_KEY server-side. Optional ref_audio (base64) clones the speaker's voice.
import { guard } from '@/lib/guard';

export async function POST(req) {
  const refused = guard(req, { limit: 15, bucket: 'tts:' });
  if (refused) return refused;
  const { input, ref_audio, ref_text } = await req.json().catch(() => ({}));
  if (typeof input !== 'string' || !input || input.length > 2000) return Response.json({ error: 'bad input' }, { status: 400 });
  const body = { input, model: 'higgs-tts-3', voice: 'default', response_format: 'mp3' };
  if (ref_audio) { body.ref_audio = ref_audio; body.ref_text = ref_text || ''; }
  const r = await fetch('https://api.boson.ai/v1/audio/speech', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + process.env.BOSON_KEY },
    body: JSON.stringify(body),
  });
  return new Response(r.body, { status: r.status, headers: { 'content-type': r.headers.get('content-type') || 'audio/mpeg' } });
}
