'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { Button, Toaster } from './ui';

/** zustand-persist hydrates after first paint; gate client-only UI on this to avoid hydration mismatches. */
export function useHydrated() { const [h, setH] = useState(false); useEffect(() => setH(true), []); return h; }

export function ModeToggle() {
  const mode = useStore(s => s.mode), setMode = useStore(s => s.setMode), hydrated = useHydrated();
  return <Button variant="ghost" size="icon" aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`} onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}>{hydrated && mode === 'light' ? '🌙' : '☀️'}</Button>;
}

export function SiteNav() {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <Link href="/deck" className="mr-auto bg-gradient-to-r from-primary to-accent bg-clip-text text-lg font-extrabold text-transparent">PitchCoach Decks</Link>
        <Link href="/deck/dashboard" className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">Dashboard</Link>
        <a href="/" className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">🎤 Voice coach</a>
        <ModeToggle />
      </nav>
    </header>
  );
}

export const Page = ({ children }) => <><SiteNav /><main className="mx-auto max-w-6xl px-4 pb-24">{children}</main><Toaster /></>;
