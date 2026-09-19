'use client';
// shadcn/ui-style primitives: same API shape and tokens, hand-rolled on native elements (no Radix) to keep the bundle tiny.
// ponytail: native <select>/<details> instead of Radix popovers. Swap in `npx shadcn add …` components if richer menus are needed.
import { useEffect, useState } from 'react';

export const cn = (...a) => a.filter(Boolean).join(' ');

const BTN = {
  default: 'bg-primary text-primary-foreground hover:opacity-90',
  secondary: 'bg-muted text-foreground hover:bg-border',
  outline: 'border border-border bg-transparent hover:bg-muted',
  ghost: 'bg-transparent hover:bg-muted',
  destructive: 'bg-destructive text-white hover:opacity-90',
};
const SIZE = { default: 'h-10 px-4 text-sm', sm: 'h-8 px-3 text-xs', lg: 'h-12 px-6 text-base', icon: 'h-9 w-9' };
export function Button({ variant = 'default', size = 'default', className, loading, children, ...p }) {
  return (
    <button {...p} disabled={p.disabled || loading} className={cn('inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition active:scale-[.98] disabled:pointer-events-none disabled:opacity-50', BTN[variant], SIZE[size], className)}>
      {loading && <Spinner />}{children}
    </button>
  );
}
export const Spinner = () => <span aria-hidden className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;

export const Input = ({ className, ...p }) => <input {...p} className={cn('h-11 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground disabled:opacity-50', className)} />;
export const Select = ({ className, children, ...p }) => <select {...p} className={cn('h-11 rounded-lg border border-input bg-background px-3 text-sm', className)}>{children}</select>;
export const Card = ({ className, ...p }) => <div {...p} className={cn('rounded-xl border border-border bg-card', className)} />;

const BADGE = { default: 'bg-primary/15 text-primary', muted: 'bg-muted text-muted-foreground', success: 'bg-success/15 text-success', warning: 'bg-warning/15 text-warning', destructive: 'bg-destructive/15 text-destructive', accent: 'bg-accent/15 text-accent' };
export const Badge = ({ variant = 'default', className, ...p }) => <span {...p} className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', BADGE[variant], className)} />;

export const Progress = ({ value = 0, className, label }) => (
  <div role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} aria-label={label} className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}>
    <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-500" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
);
export const Skeleton = ({ className }) => (
  <div className={cn('relative overflow-hidden rounded-md bg-muted', className)}><div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ animation: 'shimmer 1.4s infinite' }} /></div>
);

const ALERT = { default: 'border-border', destructive: 'border-destructive/50 bg-destructive/10', warning: 'border-warning/50 bg-warning/10' };
export const Alert = ({ variant = 'default', title, children, className }) => (
  <div role="alert" className={cn('rounded-xl border p-4 text-sm', ALERT[variant], className)}>{title && <p className="mb-1 font-semibold">{title}</p>}<div className="text-muted-foreground">{children}</div></div>
);

export function Tabs({ tabs, value, onChange, className }) {
  return (
    <div role="tablist" className={cn('flex gap-1 overflow-x-auto rounded-lg bg-muted p-1', className)}>
      {tabs.map(t => (
        <button key={t.id} role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)} className={cn('flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition', value === t.id ? 'bg-card text-foreground shadow' : 'text-muted-foreground hover:text-foreground')}>{t.label}</button>
      ))}
    </div>
  );
}

// --- toast: tiny event bus + one <Toaster/> mounted per page
const listeners = new Set();
export const toast = (message, variant = 'default') => listeners.forEach(fn => fn({ id: Math.random(), message, variant }));
export function Toaster() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const fn = t => { setItems(x => [...x, t]); setTimeout(() => setItems(x => x.filter(i => i.id !== t.id)), 3500); };
    listeners.add(fn); return () => listeners.delete(fn);
  }, []);
  return (
    <div aria-live="polite" className="no-print pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6">
      {items.map(t => <div key={t.id} style={{ animation: 'toast-in .2s ease-out' }} className={cn('pointer-events-auto rounded-lg border px-4 py-2 text-sm shadow-lg', t.variant === 'destructive' ? 'border-destructive bg-destructive text-white' : 'border-border bg-card')}>{t.message}</div>)}
    </div>
  );
}
