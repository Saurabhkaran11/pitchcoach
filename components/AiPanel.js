'use client';
import { useEffect, useRef, useState } from 'react';
import { useStore, track } from '@/lib/store';
import { TIPS } from '@/lib/tips';
import { Button, Badge, Card, Tabs, Alert, toast, cn } from './ui';

const copy = async (text, what = 'Copied') => { await navigator.clipboard.writeText(text); toast(what + ' ✓'); };

/** Plays text through the Boson TTS proxy; falls back to the browser voice if the proxy is unavailable. */
function PlayButton({ text }) {
  const [busy, setBusy] = useState(false), audio = useRef(null);
  const play = async () => {
    if (audio.current) { audio.current.pause(); audio.current = null; speechSynthesis.cancel(); return setBusy(false); }
    setBusy(true);
    try {
      const r = await fetch('/api/tts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ input: text.slice(0, 1900) }) });
      if (!r.ok) throw new Error(r.status);
      const a = new Audio(URL.createObjectURL(await r.blob())); audio.current = a; a.onended = () => { audio.current = null; setBusy(false); }; await a.play();
    } catch { const u = new SpeechSynthesisUtterance(text); u.onend = () => setBusy(false); audio.current = { pause() {} }; speechSynthesis.speak(u); }
  };
  useEffect(() => () => { audio.current?.pause(); speechSynthesis.cancel(); }, []);
  return <Button size="sm" variant="ghost" onClick={play} aria-label={busy ? 'Stop' : 'Play aloud'}>{busy ? '⏹' : '🔊'}</Button>;
}

const Block = ({ title, time, text, children }) => (
  <Card className="p-3">
    <div className="mb-2 flex items-center gap-2"><h4 className="text-sm font-semibold">{title}</h4>{time && <Badge variant="muted">{time}</Badge>}<span className="ml-auto flex"><PlayButton text={text} /><Button size="sm" variant="ghost" onClick={() => copy(text)} aria-label={`Copy ${title}`}>📋</Button></span></div>
    {children}
  </Card>
);

function DemoTab({ p }) {
  const d = p.demoScript || {}, [done, setDone] = useState({}), [secs, setSecs] = useState(0), [running, setRunning] = useState(false);
  useEffect(() => { if (!running) return; const t = setInterval(() => setSecs(s => s + 1), 1000); return () => clearInterval(t); }, [running]);
  const mmss = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg bg-muted p-2"><span className={cn('font-mono text-xl tabular-nums', secs > 180 && 'text-destructive')} aria-live="off">{mmss}</span><Button size="sm" onClick={() => setRunning(r => !r)}>{running ? 'Pause' : 'Start timer'}</Button><Button size="sm" variant="ghost" onClick={() => { setSecs(0); setRunning(false); setDone({}); }}>Reset</Button></div>
      <Block title="Hook" time="30s" text={d.hook || ''}><p className="text-sm text-muted-foreground">{d.hook || '—'}</p></Block>
      <Block title="Live demo" time={`${(d.steps || []).length} steps`} text={(d.steps || []).map((s, i) => `${i + 1}. ${s}`).join('\n')}>
        <ol className="space-y-1.5">{(d.steps || []).map((s, i) => (
          <li key={i}><label className="flex cursor-pointer gap-2 text-sm"><input type="checkbox" checked={!!done[i]} onChange={e => setDone(x => ({ ...x, [i]: e.target.checked }))} className="mt-0.5 h-4 w-4 accent-[var(--primary)]" /><span className={cn(done[i] && 'text-muted-foreground line-through')}>{s}</span></label></li>))}</ol>
      </Block>
      <Block title="Backup plan" text={(d.backup || []).join('\n')}><ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">{(d.backup || []).map((s, i) => <li key={i}>{s}</li>)}</ul></Block>
    </div>
  );
}

function PitchTab({ p }) {
  const updateProject = useStore(s => s.updateProject), [busy, setBusy] = useState(''), [err, setErr] = useState('');
  const rewrite = async (field, mode) => {
    setBusy(field + mode); setErr('');
    try {
      const r = await fetch('/api/analyze', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: p.pitch[field], mode }) });
      const j = await r.json(); if (!r.ok || !j.text) throw new Error(j.error || 'Rewrite failed');
      updateProject(p.id, x => ({ pitch: { ...x.pitch, [field]: j.text } })); track('pitch_rewritten', { field, mode }); toast('Rewritten ✓');
    } catch (e) { setErr(e.message); } finally { setBusy(''); }
  };
  const Section = ({ field, title, time }) => (
    <Block title={title} time={time} text={p.pitch?.[field] || ''}>
      <p className="max-h-56 overflow-y-auto whitespace-pre-wrap text-sm text-muted-foreground">{p.pitch?.[field] || '—'}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">{[['shorter', 'Rewrite shorter'], ['technical', 'More technical'], ['simple', 'More non-technical']].map(([m, l]) => <Button key={m} size="sm" variant="outline" loading={busy === field + m} disabled={!!busy} onClick={() => rewrite(field, m)}>{l}</Button>)}</div>
    </Block>
  );
  return (
    <div className="space-y-3">
      {err && <Alert variant="destructive" title="Rewrite failed">{err} <Button size="sm" variant="ghost" onClick={() => setErr('')}>Dismiss</Button></Alert>}
      <Section field="elevator" title="Elevator pitch" time="60s" /><Section field="fiveMin" title="Full script" time="5 min" />
      <Card className="p-3"><h4 className="mb-2 text-sm font-semibold">Q&amp;A prep</h4>
        {(p.pitch?.qa || []).map((x, i) => <details key={i} className="border-t border-border py-2 first:border-0"><summary className="cursor-pointer text-sm font-medium">{x.q}</summary><p className="mt-1.5 text-sm text-muted-foreground">{x.a}</p></details>)}
      </Card>
    </div>
  );
}

const PRIO = { high: 'destructive', medium: 'warning', low: 'muted' };
const TipsTab = ({ p }) => (
  <div className="space-y-3">
    <p className="text-xs text-muted-foreground">Tips for <b>{p.eventType}</b>. Change the event in the top bar to see others.</p>
    {(TIPS[p.eventType] || []).map(t => (
      <Card key={t.title} className="p-3"><div className="mb-1 flex items-center gap-2"><h4 className="text-sm font-semibold">{t.title}</h4><Badge variant={PRIO[t.priority]} className="ml-auto">{t.priority}</Badge></div><p className="mb-2 text-sm text-muted-foreground">{t.description}</p>
        <ul className="space-y-1">{t.checklist.map(c => <li key={c}><label className="flex cursor-pointer gap-2 text-sm"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-[var(--primary)]" /><span>{c}</span></label></li>)}</ul></Card>))}
  </div>
);

function SlideTab({ p, slide }) {
  const updateSlide = useStore(s => s.updateSlide), updateProject = useStore(s => s.updateProject);
  return (
    <div className="space-y-3">
      <div><label htmlFor="notes" className="mb-1 block text-xs font-semibold text-muted-foreground">Speaker notes (press N in Present)</label>
        <textarea id="notes" rows={5} value={slide.notes} onChange={e => updateSlide(p.id, slide.id, { notes: e.target.value })} className="w-full rounded-lg border border-input bg-background p-2 text-sm" /></div>
      {slide.kind === 'architecture' && <div><label htmlFor="mm" className="mb-1 block text-xs font-semibold text-muted-foreground">Architecture diagram (Mermaid)</label>
        <textarea id="mm" rows={8} spellCheck={false} value={p.mermaid} onChange={e => updateProject(p.id, { mermaid: e.target.value })} className="w-full rounded-lg border border-input bg-background p-2 font-mono text-xs" /></div>}
      <p className="text-xs text-muted-foreground">Click any heading or bullet on the slide to edit it. Enter saves, Esc cancels. Empty a bullet to delete it.</p>
    </div>
  );
}

export default function AiPanel({ project, slide }) {
  const [tab, setTab] = useState('demo');
  return (
    <div className="flex h-full flex-col gap-3">
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'demo', label: 'Demo script' }, { id: 'pitch', label: 'Pitch' }, { id: 'tips', label: 'Event tips' }, { id: 'slide', label: 'Slide' }]} />
      <div role="tabpanel" className="min-h-0 flex-1 overflow-y-auto pr-1">
        {tab === 'demo' && <DemoTab p={project} />}{tab === 'pitch' && <PitchTab p={project} />}{tab === 'tips' && <TipsTab p={project} />}{tab === 'slide' && slide && <SlideTab p={project} slide={slide} />}
      </div>
    </div>
  );
}
