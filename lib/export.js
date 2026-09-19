'use client';
// Exporters. PPTX is built in the browser with pptxgenjs (lazy-loaded); PDF uses the browser's print-to-PDF on /present?print=1.
import { encodeShare } from './store';

const download = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); };
const slug = p => (p.title || 'deck').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'deck';

export const toMarkdown = p => [`# ${p.title}`, p.tagline && `_${p.tagline}_`, `Repo: ${p.repoUrl || p.repo} · Event: ${p.eventType}`, '',
  ...p.slides.flatMap((s, i) => [`## ${i + 1}. ${s.title}`, ...s.bullets.map(b => `- ${b}`), s.kind === 'architecture' && p.mermaid ? '\n```mermaid\n' + p.mermaid + '\n```' : '', s.notes ? `\n> Notes: ${s.notes}` : '', ''])].filter(x => x !== false && x != null).join('\n');

export const toScript = p => [`DEMO SCRIPT — ${p.title}`, '', 'HOOK (30s)', p.demoScript?.hook, '', 'LIVE DEMO', ...(p.demoScript?.steps || []).map((s, i) => `${i + 1}. ${s}`), '', 'BACKUP PLAN', ...(p.demoScript?.backup || []).map(s => `- ${s}`), '', '60-SECOND PITCH', p.pitch?.elevator].join('\n');

const PPT_THEME = { 'VC Dark': { bg: '0B0B14', fg: 'F4F4F8', ac: '9D92FF' }, 'Hackathon Light': { bg: 'FFFBF0', fg: '1A1A1A', ac: 'FF5C00' }, 'Minimal': { bg: 'FFFFFF', fg: '111111', ac: '666666' }, 'Technical': { bg: '0D1117', fg: 'E6EDF3', ac: '3FB950' } };

export async function exportPptx(p) {
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJS(); pptx.layout = 'LAYOUT_WIDE'; pptx.title = p.title;
  const t = PPT_THEME[p.theme] || PPT_THEME['VC Dark'];
  for (const s of p.slides) {
    const sl = pptx.addSlide(); sl.background = { color: t.bg };
    sl.addText(s.title, { x: 0.6, y: 0.5, w: 12.1, h: 1.2, fontSize: s.kind === 'title' ? 44 : 34, bold: true, color: t.fg, fontFace: 'Arial' });
    if (s.bullets.length) sl.addText(s.bullets.map(b => ({ text: b, options: { bullet: true, breakLine: true } })), { x: 0.7, y: 1.9, w: 11.9, h: 4.6, fontSize: 22, color: t.fg, fontFace: 'Arial', valign: 'top', paraSpaceAfter: 10 });
    if (s.kind === 'architecture' && p.mermaid) sl.addText('Architecture diagram: see the live deck (Mermaid)', { x: 0.7, y: 6.5, w: 11.9, h: 0.4, fontSize: 12, color: t.ac, italic: true });
    if (s.notes) sl.addNotes(s.notes);
  }
  await pptx.writeFile({ fileName: slug(p) + '.pptx' });
}
export const exportMarkdown = p => download(new Blob([toMarkdown(p)], { type: 'text/markdown' }), slug(p) + '.md');
export const exportPdf = p => window.open(`/deck/present/${p.id}?print=1`, '_blank');
export const copyScript = p => navigator.clipboard.writeText(toScript(p));
export const shareUrl = p => `${location.origin}/deck/present/shared#${encodeShare(p)}`;
export const copyShareLink = p => navigator.clipboard.writeText(shareUrl(p));
