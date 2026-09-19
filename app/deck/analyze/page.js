'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, track } from '@/lib/store';
import { Page } from '@/components/Shell';
import { Button, Card, Progress, Skeleton, Alert, Input, Badge, cn } from '@/components/ui';

const STEPS = ['Fetching files', 'Detecting stack', 'Summarizing code', 'Building slides'];
// step index → progress %. "Summarizing" is the long model call, so it creeps while we wait.
const BASE = [8, 30, 50, 92];

const ERRORS = {
  invalid_url: { title: 'That URL is not a GitHub repo', variant: 'destructive', action: 'back' },
  private_or_missing: { title: 'Private repo, or it does not exist', variant: 'warning', action: 'token' },
  rate_limited: { title: 'GitHub rate limit reached', variant: 'warning', action: 'token' },
  too_large: { title: 'This repo is very large', variant: 'warning', action: 'shallow' },
  llm_failed: { title: 'The AI could not finish the deck', variant: 'destructive', action: 'retry' },
  timeout: { title: 'This is taking too long', variant: 'warning', action: 'shallow' },
  unknown: { title: 'Something went wrong', variant: 'destructive', action: 'retry' },
};

export default function Analyze() {
  const router = useRouter();
  const pending = useStore(s => s.pending), setPending = useStore(s => s.setPending), addProject = useStore(s => s.addProject);
  const [step, setStep] = useState(0), [progress, setProgress] = useState(4), [logs, setLogs] = useState([]), [stats, setStats] = useState(null), [error, setError] = useState(null), [token, setToken] = useState('');
  const abortRef = useRef(null), logRef = useRef(null), ran = useRef(false);

  const run = useCallback(async (job) => {
    setError(null); setStep(0); setProgress(4); setLogs([]); setStats(null);
    const ac = new AbortController(); abortRef.current = ac;
    const timer = setTimeout(() => ac.abort('timeout'), 75_000);
    try {
      const r = await fetch('/api/analyze', { method: 'POST', signal: ac.signal, headers: { 'content-type': 'application/json' }, body: JSON.stringify(job) });
      if (r.status === 429) throw { code: 'rate_limited', message: 'Too many decks in a minute. Wait a moment and retry.' };
      if (!r.ok || !r.body) throw { code: 'unknown', message: 'Server returned ' + r.status };
      const reader = r.body.getReader(), dec = new TextDecoder(); let buf = '';
      for (;;) {
        const { value, done } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n'); buf = lines.pop();
        for (const l of lines) {
          if (!l.trim()) continue;
          const ev = JSON.parse(l);
          if (ev.type === 'step') { setStep(ev.step); setProgress(BASE[ev.step]); }
          else if (ev.type === 'log') setLogs(x => [...x, ev.line]);
          else if (ev.type === 'stats') setStats(ev.stats);
          else if (ev.type === 'error') throw ev;
          else if (ev.type === 'done') { setProgress(100); track('deck_created', { eventType: job.eventType, slides: ev.project.slides.length }); const id = addProject(ev.project); setPending(null); router.replace('/deck/w/' + id); return; }
        }
      }
      throw { code: 'unknown', message: 'The connection closed before the deck was ready.' };
    } catch (e) {
      if (ac.signal.aborted && ac.signal.reason !== 'timeout') return; // user cancelled
      const code = ac.signal.reason === 'timeout' ? 'timeout' : (e.code || 'unknown');
      track('deck_failed', { code }); setError({ code, message: e.message || 'Please try again.' });
    } finally { clearTimeout(timer); }
  }, [addProject, router, setPending]);

  useEffect(() => { if (ran.current) return; ran.current = true; if (!pending) return router.replace('/deck'); run(pending); }, [pending, router, run]);
  // creep the bar during the long model call so it never looks frozen
  useEffect(() => { if (error || step !== 2) return; const t = setInterval(() => setProgress(p => Math.min(88, p + 1)), 700); return () => clearInterval(t); }, [step, error]);
  useEffect(() => { logRef.current?.scrollTo({ top: 1e9 }); }, [logs]);

  const cancel = () => { abortRef.current?.abort('cancel'); setPending(null); router.push('/deck'); };
  const retry = extra => run({ ...pending, ...extra });
  const E = error && (ERRORS[error.code] || ERRORS.unknown);

  return (
    <Page>
      <div className="mx-auto max-w-3xl pt-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="min-w-0"><h1 className="truncate text-2xl font-bold">{error ? 'We hit a snag' : 'Building your deck…'}</h1><p className="truncate font-mono text-sm text-muted-foreground">{pending?.url} {pending && <Badge className="ml-2">{pending.eventType}</Badge>}</p></div>
          <Button variant="outline" onClick={cancel}>{error ? 'Back' : 'Cancel'}</Button>
        </div>

        <ol className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STEPS.map((s, i) => { const state = error && i === step ? 'err' : i < step ? 'done' : i === step ? 'now' : 'todo'; return (
            <li key={s} aria-current={state === 'now' ? 'step' : undefined} className={cn('flex items-center gap-2 rounded-lg border p-3 text-sm', state === 'now' && 'border-primary bg-primary/10', state === 'done' && 'border-success/40 text-muted-foreground', state === 'err' && 'border-destructive bg-destructive/10', state === 'todo' && 'border-border text-muted-foreground')}>
              <span className={cn('grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold', state === 'done' ? 'bg-success text-white' : state === 'now' ? 'bg-primary text-white' : state === 'err' ? 'bg-destructive text-white' : 'bg-muted')}>{state === 'done' ? '✓' : state === 'err' ? '!' : i + 1}</span>
              <span className="truncate">{s}</span>
            </li>); })}
        </ol>
        <Progress value={progress} label="Deck build progress" />

        {E && (
          <Alert variant={E.variant} title={E.title} className="mt-6">
            <p>{error.message}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {E.action === 'token' && (<>
                <label htmlFor="tok" className="sr-only">GitHub token</label>
                <Input id="tok" type="password" autoComplete="off" placeholder="GitHub token with repo read access" value={token} onChange={e => setToken(e.target.value)} className="h-9 max-w-xs" />
                <Button size="sm" disabled={!token.trim()} onClick={() => retry({ token: token.trim() })}>Retry with token</Button>
                <span className="w-full text-xs">Used for this request only. Never stored. Create one at github.com/settings/tokens (fine-grained, read-only Contents).</span>
              </>)}
              {E.action === 'shallow' && <Button size="sm" onClick={() => retry({ shallow: true })}>Retry in quick mode</Button>}
              {E.action === 'retry' && <Button size="sm" onClick={() => retry()}>{error.code === 'llm_failed' ? 'Regenerate' : 'Retry'}</Button>}
              {E.action === 'back' && <Button size="sm" onClick={cancel}>Fix the URL</Button>}
              {E.action !== 'retry' && E.action !== 'back' && <Button size="sm" variant="ghost" onClick={() => retry()}>Try again as is</Button>}
            </div>
          </Alert>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Repo stats</h2>
            {stats ? (
              <dl className="space-y-2 text-sm">
                <div className="font-semibold">{stats.fullName}</div>
                {stats.description && <p className="text-muted-foreground">{stats.description}</p>}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground"><span>★ {stats.stars}</span><span>⑂ {stats.forks}</span><span>{stats.files} files</span>{stats.license && <span>{stats.license}</span>}</div>
                <div className="flex flex-wrap gap-1.5 pt-1">{stats.stack.languages.map(l => <Badge key={l.name} variant="muted">{l.name} {l.pct}%</Badge>)}{stats.stack.frameworks.map(f => <Badge key={f}>{f}</Badge>)}{stats.stack.infra.map(f => <Badge key={f} variant="accent">{f}</Badge>)}</div>
              </dl>
            ) : error ? <p className="text-sm text-muted-foreground">No stats yet.</p> : (
              <div className="space-y-3" aria-label="Loading repo stats"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-1/2" /><div className="flex gap-2"><Skeleton className="h-6 w-20 rounded-full" /><Skeleton className="h-6 w-16 rounded-full" /><Skeleton className="h-6 w-24 rounded-full" /></div></div>
            )}
          </Card>
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Log</h2>
            <div ref={logRef} role="log" aria-live="polite" className="h-40 overflow-y-auto rounded-lg bg-background p-3 font-mono text-xs leading-relaxed">
              {logs.length ? logs.map((l, i) => <div key={i}><span className="text-primary">›</span> {l}</div>) : <span className="text-muted-foreground">waiting for the server…</span>}
              {!error && <span className="inline-block h-3 w-1.5 animate-pulse bg-primary align-middle" />}
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
}
