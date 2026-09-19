// Score analysis: keeps every attempt (per-criterion scores + delivery stats) and shows progress.
// ponytail: history lives in localStorage (last 50, this browser only). Move to a DB table when accounts exist.
(() => {
  const KEYS = ['hook', 'clarity', 'problem', 'solution', 'ask'];
  const load = () => { try { return JSON.parse(LS.attempts || '[]') } catch { return [] } };
  const save = a => LS.attempts = JSON.stringify(a.slice(-50));
  const avg = xs => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
  const col = v => v >= 8 ? 'var(--ok)' : v >= 5 ? 'var(--warn)' : 'var(--bad)';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  $('qcard').insertAdjacentHTML('afterend', '<div class="card" id="analysis"></div>');
  const css = document.createElement('style');
  css.textContent = `
    #analysis h3{margin:0 0 8px}
    .kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;margin:10px 0}
    .kpi{background:var(--field);border:1px solid var(--line2);border-radius:12px;padding:10px;text-align:center}
    .kpi b{display:block;font-size:26px;line-height:1.1}.kpi span{font-size:13px;color:var(--mut)}
    .atable{width:100%;border-collapse:collapse;font-size:15px;margin-top:6px}
    .atable th{font-weight:600;color:var(--mut);font-size:13px;text-align:right;padding:4px 6px}
    .atable th:first-child,.atable td:first-child{text-align:left;text-transform:capitalize}
    .atable td{padding:6px;text-align:right;border-top:1px solid var(--line2)}
    .atable tr.weak td{background:#ef444418}
    .focus{border-left:3px solid var(--acc2);padding:8px 12px;margin:12px 0;background:var(--field);border-radius:0 10px 10px 0}
    #plan ul{margin:6px 0 0;padding-left:20px}#plan li{margin:4px 0}
    #analysis .row{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}`;
  document.head.appendChild(css);

  function chart(a) {
    const W = 600, H = 140, P = 14, n = a.length;
    const x = i => n === 1 ? W / 2 : P + i * (W - 2 * P) / (n - 1), y = v => H - P - v / 10 * (H - 2 * P);
    const pts = a.map((t, i) => `${x(i).toFixed(1)},${y(t.avg).toFixed(1)}`).join(' ');
    const grid = [0, 5, 10].map(v => `<line x1="0" x2="${W}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--line2)" stroke-dasharray="4 4"/><text x="2" y="${y(v) - 3}" font-size="11" style="fill:var(--mut)">${v}</text>`).join('');
    const dots = a.map((t, i) => `<circle cx="${x(i)}" cy="${y(t.avg)}" r="4" style="fill:${col(t.avg)}"><title>#${i + 1}: ${t.avg}/10 · ${esc(t.persona)}</title></circle>`).join('');
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Overall score per attempt" style="width:100%;height:auto;display:block">${grid}<polyline points="${pts}" fill="none" style="stroke:var(--acc)" stroke-width="2.5" stroke-linejoin="round"/>${dots}</svg>`;
  }

  function draw() {
    const a = load(), el = $('analysis');
    if (!a.length) return el.classList.remove('show');
    el.classList.add('show');
    const first = a[0], lastA = a[a.length - 1], best = Math.max(...a.map(t => t.avg));
    const spoken = a.filter(t => t.wpm);
    const rows = KEYS.map(k => {
      const vals = a.map(t => t.scores[k] ?? 0);
      return { k, latest: vals[vals.length - 1], mean: avg(vals), best: Math.max(...vals), delta: vals[vals.length - 1] - vals[0] };
    });
    const weak = rows.reduce((m, r) => r.mean < m.mean ? r : m), strong = rows.reduce((m, r) => r.mean > m.mean ? r : m);
    const d = lastA.avg - first.avg;
    const fillRate = t => t.words ? t.fillers / t.words * 100 : 0;
    el.innerHTML = `
      <h3>📈 Your score analysis</h3>
      <div class="kpis">
        <div class="kpi"><b>${a.length}</b><span>attempts</span></div>
        <div class="kpi"><b style="color:${col(best)}">${best.toFixed(1)}</b><span>best score</span></div>
        <div class="kpi"><b>${avg(a.map(t => t.avg)).toFixed(1)}</b><span>average</span></div>
        <div class="kpi"><b style="color:${d >= 0 ? 'var(--ok)' : 'var(--bad)'}">${d >= 0 ? '▲' : '▼'} ${Math.abs(d).toFixed(1)}</b><span>since first try</span></div>
        ${spoken.length ? `<div class="kpi"><b>${Math.round(avg(spoken.map(t => t.wpm)))}</b><span>avg wpm</span></div>` : ''}
        <div class="kpi"><b>${avg(a.map(fillRate)).toFixed(1)}%</b><span>filler words</span></div>
      </div>
      ${chart(a)}
      <table class="atable"><tr><th>Criterion</th><th>Latest</th><th>Average</th><th>Best</th><th>Change</th></tr>
        ${rows.map(r => `<tr class="${r === weak ? 'weak' : ''}"><td>${r.k}${r === weak ? ' ⚠️' : r === strong ? ' ⭐' : ''}</td><td style="color:${col(r.latest)}">${r.latest}</td><td>${r.mean.toFixed(1)}</td><td>${r.best}</td><td style="color:${r.delta >= 0 ? 'var(--ok)' : 'var(--bad)'}">${r.delta > 0 ? '+' : ''}${r.delta}</td></tr>`).join('')}
      </table>
      <div class="focus"><b>Focus next: ${weak.k}</b> (avg ${weak.mean.toFixed(1)}). ${esc(WHY[weak.k] || '')}<br><span style="color:var(--mut)">Strongest: ${strong.k} (avg ${strong.mean.toFixed(1)}).</span></div>
      <div id="plan"></div>
      <div class="row"><button id="aplan">🧠 Get my AI coaching plan</button><button class="ghost" id="acsv">⬇ Export CSV</button><button class="ghost" id="aclear">Clear history</button></div>`;
    $('aplan').onclick = plan; $('acsv').onclick = csv;
    $('aclear').onclick = () => { if (confirm('Delete all saved attempts on this device?')) { save([]); LS.hist = '[]'; draw() } };
  }

  async function plan() {
    const a = load().slice(-10).map(t => ({ scores: t.scores, avg: t.avg, wpm: t.wpm, fillers: t.fillers, words: t.words, persona: t.persona, typed: t.typed }));
    $('plan').innerHTML = '<span class="spin"></span> Reading your attempts…';
    try {
      const j = await llm('You are a pitch coach. You get a JSON list of a founder\'s recent pitch attempts (oldest first) with scores 1-10 per criterion and delivery stats. In plain, simple words: say what is improving, what is stuck, and give exactly 3 short practice drills for the next attempt. Reply ONLY JSON {"summary":"2 sentences","stuck":"1 sentence","drills":["...","...","..."]}', JSON.stringify(a));
      $('plan').innerHTML = `<p><b>Coach:</b> ${esc(j.summary)}</p><p style="color:var(--mut)">${esc(j.stuck)}</p><ul>${(j.drills || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
    } catch (e) { $('plan').textContent = ''; toast('Error: ' + e.message) }
  }

  function csv() {
    const a = load(), head = ['attempt', 'date', 'persona', 'mode', 'overall', ...KEYS, 'words', 'wpm', 'fillers', 'seconds'];
    const lines = a.map((t, i) => [i + 1, new Date(t.at).toISOString(), t.persona, t.typed ? 'typed' : 'spoken', t.avg, ...KEYS.map(k => t.scores[k] ?? ''), t.words, t.wpm ?? '', t.fillers, t.secs ?? ''].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([head.join(',') + '\n' + lines.join('\n')], { type: 'text/csv' }));
    link.download = 'pitchcoach-history.csv'; link.click();
  }

  window.recordAttempt = t => { const a = load(); a.push(t); save(a); draw() };
  draw();

  // self-check: fails loudly in the console if the stats math breaks
  console.assert(avg([2, 4]) === 3 && avg([]) === 0, 'analysis avg() broken');
})();
