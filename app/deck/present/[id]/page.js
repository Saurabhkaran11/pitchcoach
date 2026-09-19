'use client';
import { use, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore, decodeShare } from '@/lib/store';
import SlideCanvas from '@/components/SlideCanvas';
import { useHydrated } from '@/components/Shell';
import { Spinner } from '@/components/ui';

export default function Present({ params }) {
  const { id } = use(params), router = useRouter(), q = useSearchParams(), hydrated = useHydrated();
  const stored = useStore(s => s.projects.find(p => p.id === id));
  const [shared, setShared] = useState(null);
  useEffect(() => { if (id === 'shared') setShared(decodeShare(location.hash.slice(1))); }, [id]);
  const project = id === 'shared' ? shared : stored;
  const print = q.get('print') === '1', n = project?.slides.length || 0;
  const [i, setI] = useState(0), [dir, setDir] = useState(1), [notes, setNotes] = useState(false), [secs, setSecs] = useState(0);

  useEffect(() => { setI(Math.min(Math.max(0, +q.get('at') || 0), Math.max(0, n - 1))); }, [q, n]);
  const go = useCallback(d => setI(c => { const x = Math.min(n - 1, Math.max(0, c + d)); if (x !== c) setDir(d); return x; }), [n]);
  const exit = useCallback(() => { if (document.fullscreenElement) document.exitFullscreen(); else if (id !== 'shared') router.push('/deck/w/' + id); else router.push('/deck'); }, [id, router]);

  useEffect(() => { if (print) return; const t = setInterval(() => setSecs(s => s + 1), 1000); return () => clearInterval(t); }, [print]);
  useEffect(() => {
    if (print) return;
    const onKey = e => {
      if (['ArrowRight', 'ArrowDown', ' ', 'PageDown'].includes(e.key)) { e.preventDefault(); go(1); }
      else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); go(-1); }
      else if (e.key === 'Home') setI(0); else if (e.key === 'End') setI(n - 1);
      else if (e.key === 'f' || e.key === 'F') document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
      else if (e.key === 'n' || e.key === 'N') setNotes(v => !v);
      else if (e.key === 'Escape') exit();
    };
    addEventListener('keydown', onKey); return () => removeEventListener('keydown', onKey);
  }, [go, exit, n, print]);
  useEffect(() => { if (print && project) { const t = setTimeout(() => window.print(), 1200); return () => clearTimeout(t); } }, [print, project]);

  if (!hydrated || (id === 'shared' && !shared && typeof location !== 'undefined' && location.hash)) return <div className="grid h-screen place-items-center bg-black"><Spinner /></div>;
  if (!project) return <div className="grid h-screen place-items-center p-6 text-center"><div><h1 className="mb-2 text-xl font-bold">Nothing to present</h1><p className="text-sm text-muted-foreground">This deck is not in this browser, or the share link is incomplete.</p></div></div>;

  if (print) return <div>{project.slides.map((s, k) => <div key={s.id} className="print-slide"><SlideCanvas slide={s} project={project} index={k} total={n} className="!rounded-none !shadow-none" /></div>)}</div>;

  const slide = project.slides[i], mmss = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
  return (
    <div className="fixed inset-0 flex flex-col bg-black text-white" onClick={e => { if (e.target.closest('button')) return; go(e.clientX > innerWidth / 3 ? 1 : -1); }}>
      <div className="flex min-h-0 flex-1 items-center justify-center p-2 sm:p-6">
        <div key={slide.id} style={{ animation: `${dir > 0 ? 'slide-in' : 'slide-in-rev'} .35s cubic-bezier(.2,.8,.2,1)` }} className="w-full max-w-[calc((100dvh-60px)*16/9)]"><SlideCanvas slide={slide} project={project} index={i} total={n} className="!rounded-lg" /></div>
      </div>
      {notes && <div className="max-h-[28vh] overflow-y-auto border-t border-white/20 bg-neutral-900 p-4 text-base leading-relaxed sm:text-lg"><b className="mr-2 text-xs uppercase tracking-wider text-white/50">Notes</b>{slide.notes || 'No notes for this slide.'}</div>}
      <div className="flex items-center gap-3 px-3 py-1.5 text-xs text-white/60">
        <span className="font-mono tabular-nums" aria-label="Elapsed time">{mmss}</span>
        <div className="h-1 flex-1 overflow-hidden rounded bg-white/15" role="progressbar" aria-valuenow={i + 1} aria-valuemin={1} aria-valuemax={n} aria-label="Slide progress"><div className="h-full bg-white/80 transition-[width] duration-300" style={{ width: `${(i + 1) / n * 100}%` }} /></div>
        <span>{i + 1}/{n}</span>
        <button onClick={() => setNotes(v => !v)} className="rounded px-1.5 py-0.5 hover:bg-white/15" aria-pressed={notes}>N notes</button>
        <button onClick={() => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.()} className="hidden rounded px-1.5 py-0.5 hover:bg-white/15 sm:block">F full</button>
        <button onClick={exit} className="rounded px-1.5 py-0.5 hover:bg-white/15">Esc exit</button>
      </div>
    </div>
  );
}
