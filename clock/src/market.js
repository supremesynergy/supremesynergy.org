/* market.js — "Versor × Market" backtest lens. A second interpreter on the same engine.
   HONEST RESEARCH TOY — NOT financial advice. For each trading day we compute the
   versor/lunar/solar/weekly phase, take the forward return, average within each bucket,
   and run a 300-shuffle permutation test on the best-minus-worst spread. */
(function () {
  'use strict';
  const V = window.Versor;
  const DS = window.PRICE_DATASETS;
  const MONO = "ui-monospace,'SF Mono',Menlo,Consolas,monospace";

  const GROUPINGS = [
    { id: 'sign', title: 'Annual zodiac · 12', labels: () => V.SIGNS.map((s) => s.glyph + ' ' + s.name), keyOf: (p) => p.signIndex },
    { id: 'moon', title: 'Moon phase · 8', labels: () => V.PHASE_NAMES, keyOf: (p) => p.moonPhaseIndex },
    { id: 'versor', title: 'Lunar versor · 4', labels: () => V.VERSOR_QUAD.map((q) => q.moon + ' (' + q.op.split(' ')[0] + ')'), keyOf: (p) => p.versorQuad },
    { id: 'week', title: 'Planetary week · 7', labels: () => V.WEEK.map((w) => w.glyph + ' ' + w.planet), keyOf: (p) => p.weekday }
  ];

  const dsSel = document.getElementById('dataset');
  const hSel = document.getElementById('horizon');
  const summary = document.getElementById('summary');
  const panels = document.getElementById('panels');
  const chart = document.getElementById('priceChart');
  const phaseCache = {};

  function phaseFor(ds) {
    let p = phaseCache[ds]; if (p) return p;
    p = V.computePhaseLite(new Date(ds + 'T12:00:00')); phaseCache[ds] = p; return p;
  }

  function analyze(rows, H) {
    const m = rows.length - H; if (m < 50) return null;
    const rets = new Float64Array(m); const bIdx = {};
    GROUPINGS.forEach((g) => (bIdx[g.id] = new Int32Array(m)));
    for (let i = 0; i < m; i++) {
      rets[i] = rows[i + H][1] / rows[i][1] - 1;
      const p = phaseFor(rows[i][0]);
      GROUPINGS.forEach((g) => (bIdx[g.id][i] = g.keyOf(p)));
    }
    const observed = {};
    GROUPINGS.forEach((g) => {
      const nb = g.labels().length; const sum = new Float64Array(nb), cnt = new Int32Array(nb);
      for (let i = 0; i < m; i++) { const b = bIdx[g.id][i]; sum[b] += rets[i]; cnt[b]++; }
      const mean = [], used = [];
      for (let b = 0; b < nb; b++) { const c = cnt[b]; const mu = c ? sum[b] / c : 0; mean.push(mu); if (c) used.push(mu); }
      observed[g.id] = { mean, cnt: Array.from(cnt), spread: used.length ? Math.max(...used) - Math.min(...used) : 0 };
    });
    // permutation test on the best-minus-worst spread
    const K = 300; const counts = {}; GROUPINGS.forEach((g) => (counts[g.id] = 0));
    const shuf = Float64Array.from(rets);
    for (let k = 0; k < K; k++) {
      for (let i = m - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; const t = shuf[i]; shuf[i] = shuf[j]; shuf[j] = t; }
      GROUPINGS.forEach((g) => {
        const nb = g.labels().length; const sum = new Float64Array(nb), cnt = new Int32Array(nb); const ia = bIdx[g.id];
        for (let i = 0; i < m; i++) { const b = ia[i]; sum[b] += shuf[i]; cnt[b]++; }
        let mn = Infinity, mx = -Infinity;
        for (let b = 0; b < nb; b++) { if (!cnt[b]) continue; const mu = sum[b] / cnt[b]; if (mu < mn) mn = mu; if (mu > mx) mx = mu; }
        if (mx - mn >= observed[g.id].spread) counts[g.id]++;
      });
    }
    GROUPINGS.forEach((g) => (observed[g.id].p = (counts[g.id] + 1) / (K + 1)));
    return { m, observed };
  }

  function drawPrice(rows) {
    const c = chart.getContext('2d'); const dpr = window.devicePixelRatio || 1;
    const w = Math.max(240, chart.parentElement.clientWidth - 18), h = 190;
    chart.style.width = w + 'px'; chart.style.height = h + 'px'; chart.width = w * dpr; chart.height = h * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w, h);
    const pad = 8; let lo = Infinity, hi = -Infinity;
    for (const r of rows) { if (r[1] < lo) lo = r[1]; if (r[1] > hi) hi = r[1]; }
    const llo = Math.log(lo), lhi = Math.log(hi);
    const x = (i) => pad + i / (rows.length - 1) * (w - 2 * pad);
    const y = (v) => pad + (1 - (Math.log(v) - llo) / (lhi - llo)) * (h - 2 * pad);
    c.beginPath();
    for (let i = 0; i < rows.length; i++) { const px = x(i), py = y(rows[i][1]); i ? c.lineTo(px, py) : c.moveTo(px, py); }
    c.strokeStyle = '#f5c451'; c.lineWidth = 1.1; c.stroke();
    c.fillStyle = 'rgba(139,145,173,0.9)'; c.font = `11px ${MONO}`;
    c.textAlign = 'left'; c.fillText(rows[0][0], pad, h - 3);
    c.textAlign = 'right'; c.fillText(rows[rows.length - 1][0], w - pad, h - 3);
    c.textAlign = 'left'; c.fillText(hi.toLocaleString() + ' · log scale', pad, 12);
  }

  function renderPanels(res, H) {
    panels.innerHTML = GROUPINGS.map((g) => {
      const obs = res.observed[g.id]; const labels = g.labels();
      const maxAbs = Math.max(...obs.mean.map(Math.abs), 1e-12);
      const bars = labels.map((lab, i) => {
        if (!obs.cnt[i]) return '';
        const mu = obs.mean[i]; const wpc = Math.abs(mu) / maxAbs * 47; const pos = mu >= 0;
        return `<div class="brow"><div class="blab">${lab}</div>`
          + `<div class="btrack"><span class="bbar ${pos ? 'pos' : 'neg'}" style="width:${wpc}%;${pos ? 'left' : 'right'}:50%"></span></div>`
          + `<div class="bval mono">${(mu * 100).toFixed(H >= 20 ? 2 : 3)}%</div></div>`;
      }).join('');
      const sig = obs.p < 0.05;
      return `<div class="gpanel"><h3>${g.title}</h3><div class="bars">${bars}</div>`
        + `<div class="verdict ${sig ? 'sig' : ''}">spread ${(obs.spread * 100).toFixed(2)}% · p≈${obs.p.toFixed(sig ? 3 : 2)} — ${sig ? 'beyond chance*' : 'noise'}</div></div>`;
    }).join('');
  }

  function run() {
    const ds = DS[dsSel.value], H = +hSel.value;
    summary.textContent = 'Computing…'; panels.innerHTML = '';
    setTimeout(() => {
      drawPrice(ds.rows);
      const res = analyze(ds.rows, H);
      const hLabel = H === 1 ? 'next-day' : H + ' trading-day';
      summary.innerHTML = `<b>${ds.symbol}</b> · ${ds.rows[0][0]} → ${ds.rows[ds.rows.length - 1][0]} · ${res.m.toLocaleString()} samples · mean <b>${hLabel}</b> forward return per bucket`;
      renderPanels(res, H);
    }, 20);
  }

  dsSel.addEventListener('change', run);
  hSel.addEventListener('change', run);
  window.addEventListener('resize', () => drawPrice(DS[dsSel.value].rows));
  run();
})();
