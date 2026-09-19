'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { parseRepoUrl } from '@/lib/github';
import { useStore, EVENT_TYPES, track } from '@/lib/store';
import { Page } from '@/components/Shell';
import { Button, Input, Select, Card, Badge } from '@/components/ui';

const SAMPLES = [
  { repo: 'Saurabhkaran11/pitchcoach', event: 'Hackathon', title: 'PitchCoach', blurb: 'Voice pitch coach with cloned-voice playback', grad: 'from-violet-600 to-pink-500' },
  { repo: 'excalidraw/excalidraw', event: 'Product Launch', title: 'Excalidraw', blurb: 'Hand-drawn style whiteboard', grad: 'from-amber-500 to-orange-600' },
  { repo: 'fastapi/fastapi', event: 'College Demo', title: 'FastAPI', blurb: 'Modern Python web framework', grad: 'from-emerald-500 to-teal-600' },
];

export default function Landing() {
  const router = useRouter(), setPending = useStore(s => s.setPending);
  const [url, setUrl] = useState(''), [eventType, setEventType] = useState(EVENT_TYPES[0]), [touched, setTouched] = useState(false);
  const valid = !!parseRepoUrl(url), showErr = touched && url.trim() && !valid;

  const go = (u = url, e = eventType) => {
    if (!parseRepoUrl(u)) return setTouched(true);
    track('repo_submitted', { eventType: e });
    setPending({ url: u.trim(), eventType: e }); router.push('/deck/analyze');
  };

  return (
    <Page>
      <section className="mx-auto max-w-3xl pt-16 text-center sm:pt-24">
        <Badge variant="accent" className="mb-5">Paste a repo · get a deck, a demo script and a pitch</Badge>
        <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-6xl">Repo to Pitch <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">in 30s</span></h1>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">We read your README, stack and structure, then build slides tuned for the room you are walking into. Facts from your repo only — no invented numbers.</p>

        <form onSubmit={e => { e.preventDefault(); go(); }} noValidate className="mt-9 flex flex-col gap-3 sm:flex-row">
          <div className="flex-1 text-left">
            <label htmlFor="repo" className="sr-only">GitHub repository URL</label>
            <Input id="repo" inputMode="url" autoComplete="off" spellCheck={false} placeholder="github.com/owner/repo" value={url} onChange={e => setUrl(e.target.value)} onBlur={() => setTouched(true)} aria-invalid={showErr || undefined} aria-describedby="repo-help" className={showErr ? 'border-destructive' : valid ? 'border-success' : ''} />
          </div>
          <label htmlFor="event" className="sr-only">Event type</label>
          <Select id="event" value={eventType} onChange={e => setEventType(e.target.value)} className="sm:w-44">{EVENT_TYPES.map(t => <option key={t}>{t}</option>)}</Select>
          <Button type="submit" size="lg" className="h-11">Build my deck →</Button>
        </form>
        <p id="repo-help" role={showErr ? 'alert' : undefined} className={`mt-2 text-left text-sm ${showErr ? 'text-destructive' : 'text-muted-foreground'}`}>
          {showErr ? 'Use the format github.com/owner/repo — for example github.com/vercel/next.js' : valid ? '✓ Looks good' : 'Public repos work right away. Private repos need a token (you will be asked).'}
        </p>
      </section>

      <section aria-labelledby="samples" className="mt-20">
        <h2 id="samples" className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Try a sample</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {SAMPLES.map(s => (
            <Card key={s.repo} className="group overflow-hidden transition hover:-translate-y-0.5 hover:border-primary">
              <button onClick={() => go('github.com/' + s.repo, s.event)} className="block w-full text-left">
                <div className={`flex aspect-video items-end bg-gradient-to-br ${s.grad} p-4`}><span className="text-2xl font-bold text-white drop-shadow">{s.title}</span></div>
                <div className="p-4"><div className="mb-2 flex items-center justify-between gap-2"><span className="truncate font-mono text-xs text-muted-foreground">{s.repo}</span><Badge>{s.event}</Badge></div><p className="text-sm">{s.blurb}</p></div>
              </button>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-20 grid gap-4 sm:grid-cols-3">
        {[['🧭', 'Tuned to the event', 'Hackathon judges, investors, customers and professors want different decks. Pick one; switch any time.'], ['🎬', 'Demo script included', 'A 30-second hook, live steps with checkboxes, and a backup plan for when wi-fi dies.'], ['📤', 'Take it anywhere', 'Present in the browser, or export PPTX, PDF, Markdown, or a share link.']].map(([i, t, d]) => (
          <Card key={t} className="p-5"><div className="mb-2 text-2xl" aria-hidden>{i}</div><h3 className="mb-1 font-semibold">{t}</h3><p className="text-sm text-muted-foreground">{d}</p></Card>
        ))}
      </section>
    </Page>
  );
}
