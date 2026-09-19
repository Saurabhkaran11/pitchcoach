'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Page, useHydrated } from '@/components/Shell';
import SlideCanvas from '@/components/SlideCanvas';
import { Button, Card, Badge, Input, Skeleton, toast } from '@/components/ui';

const STATUS = { ready: 'success', processing: 'warning', failed: 'destructive' };
const when = ts => { const d = (Date.now() - ts) / 1000; return d < 60 ? 'just now' : d < 3600 ? `${Math.floor(d / 60)}m ago` : d < 86400 ? `${Math.floor(d / 3600)}h ago` : new Date(ts).toLocaleDateString(); };

export default function Dashboard() {
  const router = useRouter(), hydrated = useHydrated();
  const projects = useStore(s => s.projects), del = useStore(s => s.deleteProject), dup = useStore(s => s.duplicateProject);
  const [q, setQ] = useState('');
  const list = projects.filter(p => (p.title + ' ' + p.repo + ' ' + p.eventType).toLowerCase().includes(q.toLowerCase()));

  return (
    <Page>
      <div className="flex flex-wrap items-center gap-3 pt-8">
        <h1 className="mr-auto text-2xl font-bold">Your decks</h1>
        <label htmlFor="search" className="sr-only">Search decks</label>
        <Input id="search" type="search" placeholder="Search by name, repo or event…" value={q} onChange={e => setQ(e.target.value)} className="h-10 w-full sm:w-72" />
        <Link href="/deck" className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">+ New deck</Link>
      </div>

      {!hydrated ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map(i => <Skeleton key={i} className="aspect-[4/3]" />)}</div>
        : !projects.length ? (
          <Card className="mt-10 grid place-items-center p-12 text-center">
            <div className="mb-3 text-5xl" aria-hidden>📂</div><h2 className="mb-1 text-lg font-semibold">No decks yet</h2>
            <p className="mb-5 max-w-sm text-sm text-muted-foreground">Paste a GitHub repo and get slides, a demo script and a pitch in about 30 seconds.</p>
            <Link href="/deck" className="inline-flex h-11 items-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground">Paste your first repo →</Link>
          </Card>)
        : !list.length ? <p className="mt-10 text-center text-sm text-muted-foreground">Nothing matches “{q}”.</p>
        : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map(p => (
              <li key={p.id}><Card className="overflow-hidden transition hover:border-primary">
                <button onClick={() => router.push('/deck/w/' + p.id)} className="block w-full text-left" aria-label={`Open ${p.title}`}>
                  <div className="pointer-events-none border-b border-border bg-muted p-3">{p.slides?.[0] ? <SlideCanvas slide={p.slides[0]} project={p} index={0} total={p.slides.length} className="!rounded-md !shadow-none" /> : <div className="aspect-video" />}</div>
                  <div className="p-3"><div className="flex items-center gap-2"><h3 className="min-w-0 flex-1 truncate font-semibold">{p.title}</h3><Badge variant={STATUS[p.status] || 'muted'}>{p.status}</Badge></div>
                    <p className="truncate font-mono text-xs text-muted-foreground">{p.repo}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><Badge>{p.eventType}</Badge><span className="ml-auto">Updated {when(p.updatedAt)}</span></div></div>
                </button>
                <div className="flex gap-1 border-t border-border p-2">
                  <Button size="sm" variant="ghost" onClick={() => { dup(p.id); toast('Duplicated ✓'); }}>Duplicate</Button>
                  <Button size="sm" variant="ghost" className="ml-auto text-destructive" onClick={() => { if (confirm(`Delete “${p.title}”? This cannot be undone.`)) { del(p.id); toast('Deleted'); } }}>Delete</Button>
                </div>
              </Card></li>))}
          </ul>)}
    </Page>
  );
}
