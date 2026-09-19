// Repo → deck. Streams NDJSON events so the loader can show real steps and log lines:
//   {type:'step', step:0..3} · {type:'log', line} · {type:'stats', stats} · {type:'done', project} · {type:'error', code, message}
// Error codes the UI knows: invalid_url, private_or_missing, rate_limited, too_large, llm_failed, unknown.
import { guard } from '@/lib/guard';
import { chatJson } from '@/lib/llm';
import { parseRepoUrl, detectStack, isManifest, MAX_FILES } from '@/lib/github';

export const maxDuration = 60;

const EVENT_BRIEF = {
  'Hackathon': 'Audience: hackathon judges with 2-3 minutes. Lead with the demo and what was built in the time limit. Emphasise technical execution, use of sponsor tech, and the wow moment.',
  'VC Pitch': 'Audience: investors. Lead with problem, market size and traction. Include business model, competition, team, and a clear ask. Keep tech to one slide.',
  'Product Launch': 'Audience: customers and press. Lead with the user benefit and what is new. Include pricing/availability and a call to action.',
  'College Demo': 'Audience: professors and classmates. Explain the problem, approach, architecture and what was learned. Include limitations and future work.',
};

export async function POST(req) {
  const refused = guard(req, { limit: 6, bucket: 'an:' });
  if (refused) return refused;
  const { url, eventType = 'Hackathon', token, shallow = false } = await req.json().catch(() => ({}));
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(ctrl) {
      const send = o => ctrl.enqueue(enc.encode(JSON.stringify(o) + '\n'));
      const log = line => send({ type: 'log', line });
      const fail = (code, message) => { send({ type: 'error', code, message }); ctrl.close(); };
      try {
        const id = parseRepoUrl(url);
        if (!id) return fail('invalid_url', 'That does not look like github.com/owner/repo.');
        if (!EVENT_BRIEF[eventType]) return fail('invalid_url', 'Unknown event type.');
        const auth = token || process.env.GITHUB_TOKEN; // a user token is used for this request only, never stored
        const gh = (path, raw) => fetch('https://api.github.com' + path, { signal: req.signal, headers: { accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json', 'user-agent': 'pitchcoach-deck', ...(auth ? { authorization: 'Bearer ' + auth } : {}) } });

        // 1 — fetching files
        send({ type: 'step', step: 0 }); log(`GET github.com/${id.owner}/${id.repo}`);
        const metaR = await gh(`/repos/${id.owner}/${id.repo}`);
        if (metaR.status === 404) return fail('private_or_missing', 'Repo not found. If it is private, add a GitHub token with read access.');
        if (metaR.status === 401) return fail('private_or_missing', 'That GitHub token was rejected.');
        if (metaR.status === 403 || metaR.status === 429) return fail('rate_limited', 'GitHub rate limit hit. Add a GitHub token or try again in a few minutes.');
        if (!metaR.ok) return fail('unknown', 'GitHub returned ' + metaR.status);
        const meta = await metaR.json();
        log(`${meta.full_name} · ★ ${meta.stargazers_count} · default branch ${meta.default_branch}`);

        let paths = [];
        if (!shallow) {
          const treeR = await gh(`/repos/${id.owner}/${id.repo}/git/trees/${encodeURIComponent(meta.default_branch)}?recursive=1`);
          const tree = treeR.ok ? await treeR.json() : { tree: [] };
          paths = (tree.tree || []).filter(t => t.type === 'blob').map(t => t.path);
          if (tree.truncated || paths.length > MAX_FILES) return fail('too_large', `This repo has more than ${MAX_FILES} files. Retry in quick mode (README + manifests only).`);
        } else {
          const rootR = await gh(`/repos/${id.owner}/${id.repo}/contents/`);
          paths = rootR.ok ? (await rootR.json()).filter(f => f.type === 'file').map(f => f.path) : [];
          log('quick mode: top-level files only');
        }
        log(`${paths.length} files listed`);

        // 2 — detecting stack
        send({ type: 'step', step: 1 });
        const [langR, readmeR] = await Promise.all([gh(`/repos/${id.owner}/${id.repo}/languages`), gh(`/repos/${id.owner}/${id.repo}/readme`, true)]);
        const languages = langR.ok ? await langR.json() : {};
        const readme = readmeR.ok ? (await readmeR.text()).slice(0, 9000) : '';
        const manifestPaths = paths.filter(isManifest).slice(0, 6);
        const manifests = {};
        await Promise.all(manifestPaths.map(async p => { const r = await gh(`/repos/${id.owner}/${id.repo}/contents/${p.split('/').map(encodeURIComponent).join('/')}`, true); if (r.ok) manifests[p] = (await r.text()).slice(0, 3000); }));
        const stack = detectStack(languages, manifests, paths);
        log('languages: ' + (stack.languages.map(l => `${l.name} ${l.pct}%`).join(', ') || 'unknown'));
        if (stack.frameworks.length) log('frameworks: ' + stack.frameworks.join(', '));
        if (stack.infra.length) log('infra: ' + stack.infra.join(', '));
        const stats = { fullName: meta.full_name, description: meta.description || '', stars: meta.stargazers_count, forks: meta.forks_count, files: paths.length, license: meta.license?.spdx_id || null, updatedAt: meta.pushed_at, stack };
        send({ type: 'stats', stats });

        // 3 — summarizing code
        send({ type: 'step', step: 2 }); log('reading README + manifests (' + (readme.length + Object.values(manifests).join('').length) + ' chars)');
        const dirs = [...new Set(paths.map(p => p.split('/').slice(0, 2).join('/')))].slice(0, 80).join('\n');
        const system = `You turn a GitHub repository into a presentation. ${EVENT_BRIEF[eventType]}
Use ONLY facts found in the material. Never invent metrics, users, revenue, team members or quotes — where a slide needs a number you do not have, write a bracketed placeholder like "[add: weekly users]". Plain, simple words. No hype.
Reply ONLY with JSON of this exact shape:
{"title":"project name","tagline":"one line",
 "slides":[{"title":"...","bullets":["max 4 short bullets"],"notes":"what to say, 2-3 sentences","kind":"title|problem|solution|demo|architecture|stack|traction|business|ask|closing"}],
 "mermaid":"a valid Mermaid 'flowchart TD' with 4-7 nodes showing the real architecture; short node labels (max 4 words) in double quotes, no parentheses inside labels",
 "demoScript":{"hook":"30-second spoken hook","steps":["5-7 concrete live demo steps"],"backup":["2-3 things to do if the live demo fails"]},
 "pitch":{"elevator":"60-second spoken pitch (~140 words)","fiveMin":"5-minute script in short paragraphs (~600 words)","qa":[{"q":"likely tough question","a":"honest short answer"}]}}
Make 7-9 slides; include exactly one slide with kind "architecture". Give 5-6 qa pairs.`;
        const user = `EVENT: ${eventType}\nREPO: ${meta.full_name}\nDESCRIPTION: ${meta.description || '(none)'}\nTOPICS: ${(meta.topics || []).join(', ')}\nSTACK: ${JSON.stringify(stack)}\n\nTOP-LEVEL LAYOUT:\n${dirs}\n\nMANIFESTS:\n${Object.entries(manifests).map(([p, t]) => `--- ${p}\n${t}`).join('\n')}\n\nREADME:\n${readme || '(no README)'}`;
        log('asking the model for slides, demo script and pitch…');
        let deck;
        try { deck = await chatJson([{ role: 'system', content: system }, { role: 'user', content: user }], { signal: req.signal }); }
        catch (e) { return fail('llm_failed', e.status === 429 ? 'The AI rate limit was reached. Wait a minute, then press Regenerate.' : 'The AI could not build this deck. Press Regenerate.'); }
        if (!Array.isArray(deck?.slides) || !deck.slides.length) return fail('llm_failed', 'The AI returned an empty deck. Press Regenerate.');

        // 4 — building slides
        send({ type: 'step', step: 3 });
        const slides = deck.slides.slice(0, 12).map((s, i) => ({ id: 's' + i + Date.now().toString(36), title: String(s.title || 'Untitled'), bullets: (s.bullets || []).slice(0, 6).map(String), notes: String(s.notes || ''), kind: String(s.kind || 'content') }));
        log(`${slides.length} slides, ${deck.demoScript?.steps?.length || 0} demo steps, ${deck.pitch?.qa?.length || 0} Q&A pairs`);
        send({ type: 'done', project: { title: String(deck.title || meta.name), tagline: String(deck.tagline || meta.description || ''), repo: meta.full_name, repoUrl: meta.html_url, eventType, stats, slides, mermaid: String(deck.mermaid || ''), demoScript: deck.demoScript || { hook: '', steps: [], backup: [] }, pitch: deck.pitch || { elevator: '', fiveMin: '', qa: [] } } });
        ctrl.close();
      } catch (e) {
        if (e.name === 'AbortError') { try { ctrl.close() } catch {} return; }
        fail('unknown', 'Something went wrong while analyzing. Please retry.');
      }
    },
  });
  return new Response(stream, { headers: { 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store', 'x-accel-buffering': 'no' } });
}

// Rewrite a block of text: Shorter / More Technical / More Non-technical (Pitch tab) or regenerate one slide.
export async function PUT(req) {
  const refused = guard(req, { limit: 20, bucket: 'rw:' });
  if (refused) return refused;
  const { text, mode } = await req.json().catch(() => ({}));
  const MODES = { shorter: 'Rewrite this about 40% shorter. Keep every fact.', technical: 'Rewrite this for a technical audience: name the actual components and how they connect. Keep every fact, add none.', simple: 'Rewrite this for a non-technical audience: no jargon, short sentences. Keep every fact, add none.' };
  if (typeof text !== 'string' || !text.trim() || text.length > 8000 || !MODES[mode]) return Response.json({ error: 'bad request' }, { status: 400 });
  try {
    const j = await chatJson([{ role: 'system', content: MODES[mode] + ' Never invent numbers or claims. Reply ONLY JSON {"text":"..."}' }, { role: 'user', content: text }]);
    return Response.json({ text: String(j.text || '') });
  } catch (e) { return Response.json({ error: 'The AI could not rewrite this. Try again.' }, { status: 502 }); }
}
