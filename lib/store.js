'use client';
// All app state. Projects persist in localStorage (this browser only).
// ponytail: no accounts/DB yet — move `projects` server-side when auth exists; share links carry the deck in the URL hash.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const EVENT_TYPES = ['Hackathon', 'VC Pitch', 'Product Launch', 'College Demo'];
export const THEMES = ['VC Dark', 'Hackathon Light', 'Minimal', 'Technical'];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const useStore = create(persist((set, get) => ({
  projects: [],            // {id, title, tagline, repo, repoUrl, eventType, theme, status:'ready'|'processing'|'failed', stats, slides[], mermaid, demoScript, pitch, updatedAt, error?}
  pending: null,           // {url, eventType, token?, shallow?} handed from landing → analyze page (token is NOT persisted, see partialize)
  mode: 'dark',
  savedAt: null,

  setMode: mode => { document.documentElement.classList.toggle('light', mode === 'light'); set({ mode }); },
  setPending: pending => set({ pending }),

  addProject: p => { const id = uid(); set(s => ({ projects: [{ theme: 'VC Dark', status: 'ready', ...p, id, updatedAt: Date.now() }, ...s.projects] })); return id; },
  updateProject: (id, patch) => set(s => ({ savedAt: Date.now(), projects: s.projects.map(p => p.id === id ? { ...p, ...(typeof patch === 'function' ? patch(p) : patch), updatedAt: Date.now() } : p) })),
  deleteProject: id => set(s => ({ projects: s.projects.filter(p => p.id !== id) })),
  duplicateProject: id => { const src = get().projects.find(p => p.id === id); if (!src) return null; return get().addProject({ ...structuredClone(src), title: src.title + ' (copy)' }); },

  updateSlide: (pid, sid, patch) => get().updateProject(pid, p => ({ slides: p.slides.map(s => s.id === sid ? { ...s, ...patch } : s) })),
  moveSlide: (pid, from, to) => get().updateProject(pid, p => { const slides = [...p.slides]; const [m] = slides.splice(from, 1); slides.splice(to, 0, m); return { slides }; }),
  addSlide: (pid, after) => { const s = { id: 's' + uid(), title: 'New slide', bullets: ['Your point here'], notes: '', kind: 'content' }; get().updateProject(pid, p => { const slides = [...p.slides]; slides.splice(after + 1, 0, s); return { slides }; }); return s.id; },
  removeSlide: (pid, sid) => get().updateProject(pid, p => ({ slides: p.slides.length > 1 ? p.slides.filter(s => s.id !== sid) : p.slides })),
}), { name: 'deck-store', partialize: s => ({ projects: s.projects, mode: s.mode }) }));

// Share link: the whole deck travels in the URL hash, so no server storage is needed.
export const encodeShare = p => btoa(unescape(encodeURIComponent(JSON.stringify({ title: p.title, tagline: p.tagline, repo: p.repo, eventType: p.eventType, theme: p.theme, slides: p.slides, mermaid: p.mermaid }))));
export const decodeShare = h => { try { return JSON.parse(decodeURIComponent(escape(atob(h)))); } catch { return null; } };

// Analytics: no-op unless PostHog is loaded (set NEXT_PUBLIC_POSTHOG_KEY and add the snippet to enable).
export const track = (event, props) => { try { window.posthog?.capture(event, props); } catch {} };
