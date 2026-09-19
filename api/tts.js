// Vercel serverless proxy for Boson Higgs TTS 3: keeps BOSON_KEY server-side.
export const config = { api: { bodyParser: { sizeLimit: '8mb' } } }; // ref_audio (voice clone) is base64 audio
import { guard } from './_guard.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!guard(req, res, { limit: 15 })) return;
  const { input, ref_audio, ref_text } = req.body || {};
  if (typeof input !== 'string' || !input || input.length > 2000) return res.status(400).json({ error: 'bad input' });
  const body = { input, model: 'higgs-tts-3', voice: 'default', response_format: 'mp3' };
  if (ref_audio) { body.ref_audio = ref_audio; body.ref_text = ref_text || ''; }
  const r = await fetch('https://api.boson.ai/v1/audio/speech', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + process.env.BOSON_KEY },
    body: JSON.stringify(body),
  });
  res.status(r.status).setHeader('content-type', r.headers.get('content-type') || 'audio/mpeg');
  res.send(Buffer.from(await r.arrayBuffer()));
}
