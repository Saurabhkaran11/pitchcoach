'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { Button, Input, Toaster } from './ui';

/** zustand-persist hydrates after first paint; gate client-only UI on this to avoid hydration mismatches. */
export function useHydrated() { const [h, setH] = useState(false); useEffect(() => setH(true), []); return h; }

export function ModeToggle() {
  const mode = useStore(s => s.mode), setMode = useStore(s => s.setMode), hydrated = useHydrated();
  return <Button variant="ghost" size="icon" aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`} onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}>{hydrated && mode === 'light' ? '🌙' : '☀️'}</Button>;
}

/** The visitor's own AI keys. Held in memory only, sent only to this app's API routes, gone on reload. */
export function AIKeys() {
  const llmKey = useStore(s => s.llmKey), bosonKey = useStore(s => s.bosonKey), setKeys = useStore(s => s.setKeys);
  return (
    <div className="space-y-2 text-left text-sm">
      <label className="block">Your Gemini API key (decks and rewrites)<Input type="password" autoComplete="off" spellCheck={false} placeholder="AIza..." value={llmKey} onChange={e => setKeys({ llmKey: e.target.value.trim() })} className="mt-1 h-9" /></label>
      <label className="block">Your Boson AI key (optional, for 🔊 voice)<Input type="password" autoComplete="off" spellCheck={false} value={bosonKey} onChange={e => setKeys({ bosonKey: e.target.value.trim() })} className="mt-1 h-9" /></label>
      <small className="block text-xs text-muted-foreground">Billed to your own account. Not saved or logged, and cleared when you reload this tab. <a className="underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Get a Gemini key</a></small>
    </div>
  );
}

function KeyMenu() {
  const llmKey = useStore(s => s.llmKey);
  return (
    <details id="ai-key" className="relative">
      <summary className="cursor-pointer list-none rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">{llmKey ? 'AI key added' : 'AI key'}</summary>
      <div className="absolute right-0 z-40 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-background p-3 shadow-lg"><AIKeys /></div>
    </details>
  );
}

export function SiteNav() {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <Link href="/deck" className="mr-auto bg-gradient-to-r from-primary to-accent bg-clip-text text-lg font-extrabold text-transparent">PitchCoach Decks</Link>
        <Link href="/deck/dashboard" className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">Dashboard</Link>
        <a href="/" className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">🎤 Voice coach</a>
        <KeyMenu />
        <ModeToggle />
      </nav>
    </header>
  );
}

export const Page = ({ children }) => <><SiteNav /><main className="mx-auto max-w-6xl px-4 pb-24">{children}</main><Toaster /></>;
