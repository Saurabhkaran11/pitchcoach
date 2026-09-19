'use client';
import { useEffect, useRef, useState } from 'react';
import { Badge, cn } from './ui';

export const SLIDE_THEMES = {
  'VC Dark': { wrap: 'bg-[#0b0b14] text-[#f4f4f8]', accent: 'text-[#9d92ff]', rule: 'bg-[#9d92ff]', font: 'font-sans', mermaid: 'dark' },
  'Hackathon Light': { wrap: 'bg-[#fffbf0] text-[#1a1a1a]', accent: 'text-[#d94800]', rule: 'bg-[#ff5c00]', font: 'font-sans', mermaid: 'default' },
  'Minimal': { wrap: 'bg-white text-[#111]', accent: 'text-[#555]', rule: 'bg-[#111]', font: 'font-serif', mermaid: 'neutral' },
  'Technical': { wrap: 'bg-[#0d1117] text-[#e6edf3]', accent: 'text-[#3fb950]', rule: 'bg-[#3fb950]', font: 'font-mono', mermaid: 'dark' },
};

/** Renders Mermaid source. Falls back to a labelled placeholder when there is no diagram or it fails to parse. */
function Diagram({ code, theme }) {
  const [svg, setSvg] = useState(''), [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true; setFailed(false); setSvg('');
    if (!code?.trim()) return;
    import('mermaid').then(async ({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, theme, securityLevel: 'strict', fontFamily: 'inherit' });
      try { const { svg } = await mermaid.render('m' + Math.random().toString(36).slice(2), code); if (live) setSvg(svg); } catch { if (live) setFailed(true); }
    });
    return () => { live = false; };
  }, [code, theme]);
  if (svg) return <div className="flex h-full w-full items-center justify-center [&_svg]:!h-full [&_svg]:!w-full [&_svg]:!max-w-none" role="img" aria-label="Architecture diagram" dangerouslySetInnerHTML={{ __html: svg }} />;
  return <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-current/30 text-center text-[1.6cqw] opacity-60">{failed ? 'Diagram could not be drawn — edit the Mermaid source in the AI panel' : code ? 'Drawing diagram…' : 'Architecture diagram placeholder'}</div>;
}

/** contentEditable that commits on blur (so typing never fights React re-renders). */
function Editable({ as: Tag = 'div', value, onCommit, editable, className, label }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current && ref.current.textContent !== value) ref.current.textContent = value; }, [value]);
  return <Tag ref={ref} className={className} contentEditable={editable || undefined} suppressContentEditableWarning aria-label={editable ? label : undefined} spellCheck={editable}
    onBlur={e => { const t = e.currentTarget.textContent.trim(); if (t !== value) onCommit?.(t); }}
    onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur(); } if (e.key === 'Escape') { e.currentTarget.textContent = value; e.currentTarget.blur(); } }} />;
}

/** One 16:9 slide. Sizes use container-query units (cqw) so the slide scales perfectly at any width. */
export default function SlideCanvas({ slide, project, index = 0, total = 1, editable = false, onChange, className }) {
  const t = SLIDE_THEMES[project.theme] || SLIDE_THEMES['VC Dark'];
  const isTitle = slide.kind === 'title' || index === 0, isArch = slide.kind === 'architecture';
  const lang = project.stats?.stack?.languages?.[0]?.name;
  const setBullet = (i, text) => onChange?.({ bullets: text ? slide.bullets.map((b, j) => j === i ? text : b) : slide.bullets.filter((_, j) => j !== i) });

  return (
    <div className={cn('relative aspect-video w-full overflow-hidden rounded-xl shadow-2xl [container-type:inline-size]', t.wrap, t.font, className)}>
      <div className={cn('absolute inset-0 flex flex-col p-[6cqw]', isTitle && 'justify-center')}>
        {isTitle && <div className={cn('mb-[2cqw] h-[0.6cqw] w-[8cqw] rounded-full', t.rule)} />}
        <Editable as="h2" label="Slide title" editable={editable} value={slide.title} onCommit={title => onChange?.({ title })} className={cn('font-extrabold leading-tight tracking-tight', isTitle ? 'text-[6cqw]' : 'text-[4cqw]')} />
        {isTitle && project.tagline && index === 0 && <p className={cn('mt-[1.5cqw] text-[2.4cqw]', t.accent)}>{project.tagline}</p>}
        <div className={cn('mt-[3cqw] flex min-h-0 flex-1 gap-[3cqw]', isTitle && 'flex-none')}>
          <ul className={cn('flex flex-col gap-[1.6cqw]', isArch ? 'w-[36%]' : 'w-full')}>
            {slide.bullets.map((b, i) => (
              <li key={i} className="flex gap-[1.2cqw] text-[2.3cqw] leading-snug"><span className={cn('select-none', t.accent)} aria-hidden>▸</span><Editable label={`Bullet ${i + 1}`} editable={editable} value={b} onCommit={x => setBullet(i, x)} className="flex-1" /></li>
            ))}
            {editable && slide.bullets.length < 6 && <li><button onClick={() => onChange?.({ bullets: [...slide.bullets, 'New point'] })} className={cn('no-print text-[1.6cqw] opacity-50 hover:opacity-100', t.accent)}>+ add bullet</button></li>}
          </ul>
          {isArch && <div className="min-h-0 flex-1"><Diagram code={project.mermaid} theme={t.mermaid} /></div>}
        </div>
      </div>
      {lang && <Badge variant="muted" className="absolute right-[2cqw] top-[2cqw] !text-[1.3cqw] opacity-80">{lang}</Badge>}
      <div className="absolute bottom-[2cqw] left-[6cqw] right-[6cqw] flex justify-between text-[1.3cqw] opacity-50"><span>{project.title}</span><span>{index + 1} / {total}</span></div>
    </div>
  );
}
