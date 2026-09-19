'use client';
import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useStore, EVENT_TYPES, THEMES, track } from '@/lib/store';
import { exportPptx, exportMarkdown, exportPdf, copyScript, copyShareLink } from '@/lib/export';
import SlideCanvas from '@/components/SlideCanvas';
import AiPanel from '@/components/AiPanel';
import { useHydrated, ModeToggle } from '@/components/Shell';
import { Button, Select, Tabs, Toaster, Spinner, toast, cn } from '@/components/ui';

const EXPORTS = [
  { id: 'pptx', label: 'Download PPTX', run: exportPptx, done: 'PowerPoint downloaded' },
  { id: 'pdf', label: 'Download PDF', run: exportPdf, done: 'Print dialog opened — choose "Save as PDF"' },
  { id: 'md', label: 'Download Markdown', run: exportMarkdown, done: 'Markdown downloaded' },
  { id: 'script', label: 'Copy script', run: copyScript, done: 'Script copied' },
  { id: 'link', label: 'Copy share link', run: copyShareLink, done: 'Share link copied' },
];

function ExportMenu({ project }) {
  const [busy, setBusy] = useState(''), ref = useRef(null);
  const run = async x => { setBusy(x.id); try { await x.run(project); track('export', { type: x.id }); toast(x.done + ' ✓'); ref.current?.removeAttribute('open'); } catch { toast('Export failed. Try again.', 'destructive'); } finally { setBusy(''); } };
  return (
    <details ref={ref} className="relative">
      <summary className="inline-flex h-8 cursor-pointer list-none items-center gap-1 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground [&::-webkit-details-marker]:hidden">Export ▾</summary>
      <div role="menu" className="absolute right-0 z-40 mt-1 w-52 rounded-lg border border-border bg-card p-1 shadow-xl">
        {EXPORTS.map(x => <button key={x.id} role="menuitem" disabled={!!busy} onClick={() => run(x)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50">{busy === x.id ? <Spinner /> : <span className="w-4" />}{x.label}</button>)}
      </div>
    </details>
  );
}

function Outline({ project, current, onSelect }) {
  const moveSlide = useStore(s => s.moveSlide), addSlide = useStore(s => s.addSlide), removeSlide = useStore(s => s.removeSlide);
  const [drag, setDrag] = useState(null), [over, setOver] = useState(null);
  return (
    <div className="flex h-full flex-col gap-2">
      <ol className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden pr-1" aria-label="Slide outline">
        {project.slides.map((s, i) => (
          <li key={s.id} draggable onDragStart={() => setDrag(i)} onDragOver={e => { e.preventDefault(); setOver(i); }} onDragEnd={() => { setDrag(null); setOver(null); }}
            onDrop={() => { if (drag != null && drag !== i) { moveSlide(project.id, drag, i); onSelect(i); } setDrag(null); setOver(null); }}
            className={cn('group flex cursor-grab items-center gap-2 rounded-lg border p-2 text-sm active:cursor-grabbing', i === current ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted', over === i && drag !== i && 'border-accent', drag === i && 'opacity-40')}>
            <span className="w-5 shrink-0 text-center text-xs text-muted-foreground" aria-hidden>⠿</span>
            <button onClick={() => onSelect(i)} aria-current={i === current ? 'true' : undefined} title={s.title} className="flex min-w-0 flex-1 items-baseline gap-1.5 text-left"><span className="shrink-0 text-xs text-muted-foreground">{i + 1}</span><span className="truncate">{s.title}</span></button>
            {/* keyboard alternative to drag-and-drop */}
            <span className="hidden shrink-0 gap-0.5 group-focus-within:flex group-hover:flex">
              <button aria-label={`Move slide ${i + 1} up`} disabled={i === 0} onClick={() => { moveSlide(project.id, i, i - 1); onSelect(i - 1); }} className="rounded px-1 text-xs hover:bg-border disabled:opacity-30">↑</button>
              <button aria-label={`Move slide ${i + 1} down`} disabled={i === project.slides.length - 1} onClick={() => { moveSlide(project.id, i, i + 1); onSelect(i + 1); }} className="rounded px-1 text-xs hover:bg-border disabled:opacity-30">↓</button>
              <button aria-label={`Delete slide ${i + 1}`} disabled={project.slides.length < 2} onClick={() => { removeSlide(project.id, s.id); onSelect(Math.max(0, i - 1)); }} className="rounded px-1 text-xs text-destructive hover:bg-border disabled:opacity-30">✕</button>
            </span>
          </li>))}
      </ol>
      <Button variant="outline" size="sm" onClick={() => { addSlide(project.id, current); onSelect(current + 1); }}>+ Add slide</Button>
    </div>
  );
}

export default function Workspace({ params }) {
  const { id } = use(params), hydrated = useHydrated();
  const project = useStore(s => s.projects.find(p => p.id === id)), updateProject = useStore(s => s.updateProject), updateSlide = useStore(s => s.updateSlide), savedAt = useStore(s => s.savedAt);
  const [cur, setCur] = useState(0), [pane, setPane] = useState('canvas'), [justSaved, setJustSaved] = useState(false);
  const n = project?.slides.length || 0, i = Math.min(cur, Math.max(0, n - 1));

  useEffect(() => { if (!savedAt) return; setJustSaved(true); const t = setTimeout(() => setJustSaved(false), 1200); return () => clearTimeout(t); }, [savedAt]);
  useEffect(() => {
    const onKey = e => { if (e.target.closest('input,textarea,select,[contenteditable="true"]')) return; if (e.key === 'ArrowRight' || e.key === 'ArrowDown') setCur(c => Math.min(n - 1, c + 1)); if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') setCur(c => Math.max(0, c - 1)); };
    addEventListener('keydown', onKey); return () => removeEventListener('keydown', onKey);
  }, [n]);

  if (!hydrated) return <div className="grid h-screen place-items-center"><Spinner /></div>;
  if (!project) return <div className="grid h-screen place-items-center p-6 text-center"><div><h1 className="mb-2 text-xl font-bold">Deck not found</h1><p className="mb-4 text-sm text-muted-foreground">Decks are saved in the browser that created them.</p><Link href="/deck" className="text-primary underline">Build a new one</Link></div></div>;
  const slide = project.slides[i];

  return (
    <div className="flex h-dvh flex-col">
      <header className="no-print flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
        <Link href="/deck/dashboard" aria-label="Back to dashboard" className="rounded-md px-2 py-1 text-muted-foreground hover:bg-muted">←</Link>
        <label htmlFor="pname" className="sr-only">Project name</label>
        <input id="pname" value={project.title} onChange={e => updateProject(project.id, { title: e.target.value })} className="min-w-0 flex-1 rounded-md bg-transparent px-2 py-1 text-sm font-semibold hover:bg-muted sm:max-w-xs" />
        <span aria-live="polite" className="hidden text-xs text-muted-foreground sm:inline">{justSaved ? 'Saving…' : savedAt ? '✓ Saved' : 'Autosave on'}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <label htmlFor="ev" className="sr-only">Event</label><Select id="ev" value={project.eventType} onChange={e => { updateProject(project.id, { eventType: e.target.value }); track('event_switched', { to: e.target.value }); }} className="hidden h-8 text-xs md:block">{EVENT_TYPES.map(t => <option key={t}>{t}</option>)}</Select>
          <label htmlFor="th" className="sr-only">Slide theme</label><Select id="th" value={project.theme} onChange={e => updateProject(project.id, { theme: e.target.value })} className="h-8 text-xs">{THEMES.map(t => <option key={t}>{t}</option>)}</Select>
          <ModeToggle />
          <Button size="sm" variant="outline" className="hidden sm:inline-flex" onClick={async () => { await copyShareLink(project); toast('Share link copied ✓'); }}>Share</Button>
          <ExportMenu project={project} />
        </div>
      </header>

      {/* <1024px: the three columns collapse into tabs */}
      <Tabs className="no-print m-2 lg:hidden" value={pane} onChange={setPane} tabs={[{ id: 'outline', label: `Outline (${n})` }, { id: 'canvas', label: 'Slide' }, { id: 'ai', label: 'AI panel' }]} />

      <div className="grid min-h-0 flex-1 gap-3 p-3 pt-0 lg:grid-cols-[240px_minmax(0,1fr)_360px] lg:pt-3">
        <aside className={cn('min-h-0', pane !== 'outline' && 'hidden lg:block')}><Outline project={project} current={i} onSelect={x => { setCur(x); setPane('canvas'); }} /></aside>
        <section className={cn('flex min-h-0 flex-col items-center justify-center gap-3', pane !== 'canvas' && 'hidden lg:flex')} aria-label={`Slide ${i + 1} of ${n}`}>
          <div className="w-full max-w-[min(100%,calc((100dvh-220px)*16/9))]"><SlideCanvas key={slide.id + project.theme} slide={slide} project={project} index={i} total={n} editable onChange={patch => updateSlide(project.id, slide.id, patch)} /></div>
          <div className="no-print hidden items-center gap-2 text-sm text-muted-foreground lg:flex"><Button size="sm" variant="ghost" disabled={i === 0} onClick={() => setCur(i - 1)}>← Prev</Button><span>{i + 1} / {n}</span><Button size="sm" variant="ghost" disabled={i === n - 1} onClick={() => setCur(i + 1)}>Next →</Button><Link href={`/deck/present/${project.id}?at=${i}`} className="ml-2 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-border">▶ Present</Link></div>
        </section>
        <aside className={cn('min-h-0', pane !== 'ai' && 'hidden lg:block')}><AiPanel project={project} slide={slide} /></aside>
      </div>

      {/* sticky bottom action bar on small screens */}
      <div className="no-print flex items-center gap-2 border-t border-border bg-background p-2 lg:hidden">
        <Button size="sm" variant="outline" disabled={i === 0} onClick={() => { setCur(i - 1); setPane('canvas'); }} aria-label="Previous slide">←</Button>
        <span className="text-xs text-muted-foreground">{i + 1}/{n}</span>
        <Button size="sm" variant="outline" disabled={i === n - 1} onClick={() => { setCur(i + 1); setPane('canvas'); }} aria-label="Next slide">→</Button>
        <Link href={`/deck/present/${project.id}?at=${i}`} className="ml-auto inline-flex h-8 items-center rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground">▶ Present</Link>
      </div>
      <Toaster />
    </div>
  );
}
