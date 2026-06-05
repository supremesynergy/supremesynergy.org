/* cycles.js — the GREATER cycles the day/month/year nest inside.

   A fourth lens on the same offline astronomy: the outer-planet orbits, the
   lunar nodal / eclipse cycle (the "dragon"), the Jupiter–Saturn great
   conjunction, the ~22-yr solar-magnetic (Hale) cycle, the precessional Great
   Year, the Venus pentagram, and a Mercury-retrograde flag.

   Renders a gauge cluster + the Venus rosette into the page; app.js calls
   render(date) each tick and uses lunarNodes()/mercuryRetro() to annotate the
   main dial. Depends on global Astronomy (vendored) + Versor (engine.js).

   What's REAL vs MODELED: planet/node/eclipse/conjunction/Venus positions are
   exact ephemeris. The solar-magnetic cycle and the precessional Age are
   MODELED from known reference dates (approximate) — labelled as such. */
(function (global) {
  'use strict';
  const A = global.Astronomy;
  if (!A) return;
  const DEG = Math.PI / 180;
  const SANS = "system-ui,-apple-system,'Segoe UI','Roboto',sans-serif";
  const SERIF = "'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif";
  const norm360 = (x) => { x %= 360; return x < 0 ? x + 360 : x; };
  const frac = (x) => x - Math.floor(x);
  const SIGN_GLYPH = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
  const SIGN_NAME = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const signOf = (lon) => { const i = Math.floor(norm360(lon) / 30) % 12; return { i: i, glyph: SIGN_GLYPH[i], name: SIGN_NAME[i] }; };

  const geoLon = (body, date) => norm360(A.Ecliptic(A.GeoVector(A.Body[body], date, true)).elon);
  const helioLon = (body, date) => norm360(A.Ecliptic(A.HelioVector(A.Body[body], date)).elon);
  function yearFrac(date) { const y = date.getUTCFullYear(); const s = Date.UTC(y, 0, 1), e = Date.UTC(y + 1, 0, 1); return y + (date.getTime() - s) / (e - s); }
  function fmtMonthYear(d) { try { return d.toLocaleString(undefined, { year: 'numeric', month: 'short' }); } catch (e) { return ''; } }

  // ── lunar nodes (mean) + Mercury retrograde — used by the main dial too ──
  function meanNode(date) {
    const T = A.MakeTime(date).tt / 36525;
    const o = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000;
    return norm360(o);
  }
  function lunarNodes(date) { const n = meanNode(date); return { north: n, south: norm360(n + 180) }; }
  function mercuryRetro(date) {
    const l1 = geoLon('Mercury', date);
    const l2 = geoLon('Mercury', new Date(date.getTime() + 86400000));
    return (((l2 - l1 + 540) % 360) - 180) < 0;
  }

  // ── eclipse search (cached — slow, changes slowly) ──
  let _ecl = { key: null, val: {} };
  function nextEclipses(date) {
    const key = Math.floor(date.getTime() / (45 * 86400000));
    if (_ecl.key === key) return _ecl.val;
    let val = {};
    try {
      const le = A.SearchLunarEclipse(date);
      const se = A.SearchGlobalSolarEclipse(date);
      val = { lunar: le && le.peak ? le.peak.date : null, solar: se && se.peak ? se.peak.date : null };
    } catch (e) { val = {}; }
    _ecl = { key: key, val: val };
    return val;
  }

  // ── modeled cycles ──
  // Precessional Great Year — linear ayanāṁśa (~50.29"/yr); Age boundaries are conventional.
  function greatYear(date) {
    const ay = 24.0 + 0.0139689 * (yearFrac(date) - 2000);
    const vernalSid = norm360(360 - ay);
    const s = signOf(vernalSid);
    const agePct = (30 - (vernalSid % 30)) / 30 * 100;       // retrograde drift into the current Age-sign
    const next = SIGN_NAME[(s.i + 11) % 12];                  // previous sign in order = next Age
    return { ageName: s.name, ageGlyph: s.glyph, agePct: agePct, next: next };
  }
  // Solar magnetic cycle — Schwabe ~11 yr, Hale ~22 yr; anchored to SC25 minimum (Dec 2019).
  function solarCycle(date) {
    const anchor = 2019.96, schwabe = 11.0, yr = yearFrac(date);
    const elapsed = yr - anchor;
    const sPhase = frac(elapsed / schwabe);
    const halePct = frac(elapsed / (2 * schwabe)) * 100;
    const cycleNum = 25 + Math.floor(elapsed / schwabe);
    const stage = sPhase < 0.1 ? 'minimum' : sPhase < 0.45 ? 'rising' : sPhase < 0.55 ? 'maximum' : sPhase < 0.9 ? 'declining' : 'minimum';
    return { halePct: halePct, sub: 'Cycle ' + cycleNum + ' · ' + stage + ' · modeled' };
  }
  // Jupiter–Saturn great conjunction — very regular; anchored to the 2020-12 conjunction.
  function greatConjunction(date) {
    const anchor = 2020.98, period = 19.859, yr = yearFrac(date);
    const k = Math.floor((yr - anchor) / period);
    const pct = frac((yr - anchor) / period) * 100;
    const nextYr = Math.floor(anchor + (k + 1) * period);
    return { pct: pct, sub: 'next ≈ ' + nextYr };
  }

  // ── outer-planet orbital position (heliocentric = clean 0–360 per orbit) ──
  const PLANETS = [
    { key: 'jupiter', body: 'Jupiter', name: 'Jupiter', glyph: '♃', period: '11.9 yr', tint: '#d9a566' },
    { key: 'saturn', body: 'Saturn', name: 'Saturn', glyph: '♄', period: '29.5 yr', tint: '#b8b08f' },
    { key: 'uranus', body: 'Uranus', name: 'Uranus', glyph: '♅', period: '84 yr', tint: '#9fd0c7' },
    { key: 'neptune', body: 'Neptune', name: 'Neptune', glyph: '♆', period: '165 yr', tint: '#7fb2e8' },
    { key: 'pluto', body: 'Pluto', name: 'Pluto', glyph: '♇', period: '248 yr', tint: '#c8a0c0' },
  ];

  function computeCycles(date) {
    const out = [];
    PLANETS.forEach((p) => {
      let pct = 0, sub = '';
      try { pct = helioLon(p.body, date) / 360 * 100; const gs = signOf(geoLon(p.body, date)); sub = p.glyph + ' in ' + gs.glyph + ' ' + gs.name; } catch (e) {}
      out.push({ key: p.key, name: p.name, glyph: p.glyph, period: p.period, tint: p.tint, pct: pct, sub: sub });
    });
    // lunar nodes (18.6 yr) + next eclipse
    try {
      const n = meanNode(date), s = signOf(n), ecl = nextEclipses(date);
      let sub = '☊ ' + s.glyph + ' ' + s.name;
      if (ecl.solar) sub += ' · ☉ecl ' + fmtMonthYear(ecl.solar);
      out.push({ key: 'node', name: 'Lunar nodes', glyph: '☊', period: '18.6 yr', tint: '#cfd6e6', pct: norm360(360 - n) / 360 * 100, sub: sub });
    } catch (e) {}
    // great conjunction (19.9 yr)
    const gc = greatConjunction(date);
    out.push({ key: 'gc', name: 'Great conjunction', glyph: '☌', period: '19.9 yr', tint: '#e0a05f', pct: gc.pct, sub: '♃♄ · ' + gc.sub });
    // solar magnetic (≈22 yr, modeled)
    const sc = solarCycle(date);
    out.push({ key: 'hale', name: 'Solar magnetic', glyph: '☉', period: '≈22 yr', tint: '#f5c451', pct: sc.halePct, sub: sc.sub });
    // precessional Great Year (modeled)
    const gy = greatYear(date);
    out.push({ key: 'age', name: 'Great Year', glyph: '✶', period: '25,772 yr', tint: '#b9a7e8', pct: gy.agePct, sub: 'Age of ' + gy.ageName + ' → ' + gy.next });
    return out;
  }

  // ── Venus pentagram — 5 inferior conjunctions ≈ 8 yr (cached, changes slowly) ──
  let _penta = { key: null, val: [] };
  function venusPoints(date) {
    const key = Math.floor(date.getTime() / (30 * 86400000));
    if (_penta.key === key) return _penta.val;
    let pts = [];
    try {
      let t = new Date(date.getTime() - 1000 * 86400000); // start ~2.7 yr before
      for (let i = 0; i < 16 && pts.length < 5; i++) {
        const c = A.SearchRelativeLongitude(A.Body.Venus, 0, t);  // next Venus–Sun conjunction
        const v = A.GeoVector(A.Body.Venus, c, true);
        const dist = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
        if (dist < 0.55) pts.push({ lon: geoLon('Venus', c.date), date: c.date }); // inferior only
        t = new Date(c.date.getTime() + 20 * 86400000);
      }
    } catch (e) { pts = []; }
    _penta = { key: key, val: pts };
    return pts;
  }

  // ── gauge rendering (small canvas ring + HTML text overlay) ──
  let _built = false;
  function gaugeHTML(c) {
    return '<div class="cyc-gauge">'
      + '<canvas class="cyc-ring" id="g-' + c.key + '"></canvas>'
      + '<div class="cyc-pct" id="pct-' + c.key + '"></div>'
      + '<div class="cyc-name"><span style="color:' + c.tint + '">' + c.glyph + '</span> ' + c.name + '</div>'
      + '<div class="cyc-period">' + c.period + '</div>'
      + '<div class="cyc-sub" id="sub-' + c.key + '"></div>'
      + '</div>';
  }
  function drawGauge(canvas, c) {
    const dpr = global.devicePixelRatio || 1, css = 96;
    if (canvas._css !== css) { canvas.style.width = css + 'px'; canvas.style.height = css + 'px'; canvas.width = Math.round(css * dpr); canvas.height = Math.round(css * dpr); canvas._css = css; }
    const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, css, css);
    const cx = css / 2, cy = css / 2, r = css * 0.40, lw = css * 0.07;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.strokeStyle = 'rgba(255,255,255,0.09)'; ctx.lineWidth = lw; ctx.stroke();
    const a0 = -Math.PI / 2, a1 = a0 + Math.max(0, Math.min(1, c.pct / 100)) * 2 * Math.PI;
    ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1, false); ctx.strokeStyle = c.tint; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.stroke();
    const hx = cx + r * Math.cos(a1), hy = cy + r * Math.sin(a1);
    ctx.beginPath(); ctx.arc(hx, hy, css * 0.05, 0, 2 * Math.PI); ctx.fillStyle = c.tint; ctx.fill();
    ctx.beginPath(); ctx.arc(hx, hy, css * 0.05, 0, 2 * Math.PI); ctx.strokeStyle = 'rgba(7,8,17,0.8)'; ctx.lineWidth = 1; ctx.stroke();
  }

  function renderPentagram(date) {
    const canvas = document.getElementById('venus-canvas'); if (!canvas) return;
    const wrap = canvas.parentElement; const dpr = global.devicePixelRatio || 1;
    const css = Math.max(200, Math.min(wrap ? wrap.clientWidth : 280, 300));
    if (canvas._css !== css) { canvas.style.width = css + 'px'; canvas.style.height = css + 'px'; canvas.width = Math.round(css * dpr); canvas.height = Math.round(css * dpr); canvas._css = css; }
    const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, css, css);
    const cx = css / 2, cy = css / 2, R = css * 0.40;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1; ctx.stroke();
    for (let i = 0; i < 12; i++) { const a = (i * 30 - 90) * DEG; ctx.beginPath(); ctx.moveTo(cx + R * 0.95 * Math.cos(a), cy + R * 0.95 * Math.sin(a)); ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a)); ctx.strokeStyle = 'rgba(255,255,255,0.09)'; ctx.lineWidth = 1; ctx.stroke(); }
    const pts = venusPoints(date);
    if (pts.length >= 5) {
      const xy = pts.map((p) => { const a = (p.lon - 90) * DEG; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; });
      const order = pts.map((p, i) => i).sort((u, w) => pts[u].lon - pts[w].lon);
      ctx.beginPath();
      for (let i = 0; i <= 5; i++) { const idx = order[(i * 2) % 5]; const xyp = xy[idx]; if (i === 0) ctx.moveTo(xyp[0], xyp[1]); else ctx.lineTo(xyp[0], xyp[1]); }
      ctx.closePath(); ctx.strokeStyle = 'rgba(232,167,200,0.85)'; ctx.lineWidth = 1.5; ctx.stroke();
      xy.forEach((p) => { ctx.beginPath(); ctx.arc(p[0], p[1], css * 0.02, 0, 2 * Math.PI); ctx.fillStyle = '#e8a7c8'; ctx.fill(); });
    } else {
      ctx.fillStyle = 'rgba(231,234,245,0.5)'; ctx.font = '12px ' + SANS; ctx.textAlign = 'center'; ctx.fillText('computing…', cx, cy + R + 4);
    }
    ctx.fillStyle = '#e8a7c8'; ctx.font = Math.round(css * 0.11) + 'px ' + SERIF; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('♀', cx, cy);
  }

  function render(date) {
    const host = document.getElementById('cycles-gauges'); if (!host) return;
    const cycles = computeCycles(date);
    if (!_built) { host.innerHTML = cycles.map(gaugeHTML).join(''); _built = true; }
    cycles.forEach((c) => {
      const cv = document.getElementById('g-' + c.key); if (cv) drawGauge(cv, c);
      const pe = document.getElementById('pct-' + c.key); if (pe) pe.textContent = Math.round(c.pct) + '%';
      const se = document.getElementById('sub-' + c.key); if (se) se.textContent = c.sub;
    });
    try { renderPentagram(date); } catch (e) { /* pentagram optional */ }
  }

  global.VersorCycles = { render: render, lunarNodes: lunarNodes, mercuryRetro: mercuryRetro, computeCycles: computeCycles };
})(window);
