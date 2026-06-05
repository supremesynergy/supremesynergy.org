/* app.js v2 — renders THREE independent cycles on one face:
   center  = LUNAR VERSOR (Dollard j-operator, 4 poles + generation/degeneration arcs)
   middle  = PLANETARY WEEK (7 days)
   outer   = ANNUAL ZODIAC (12) + live planets
   Plus hover/tap tooltips on every glyph.
   Depends on global Versor (engine.js, interpret.js) + Astronomy (vendor). */
(function () {
  'use strict';
  const V = window.Versor;
  const DEG = Math.PI / 180;
  const SERIF = "'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif";
  const SANS = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";

  const canvas = document.getElementById('clock');
  const ctx = canvas.getContext('2d');
  const panel = document.getElementById('panel');
  const tip = document.getElementById('tip');
  const dtInput = document.getElementById('dt');
  const nowBtn = document.getElementById('nowBtn');
  const playBtn = document.getElementById('playBtn');
  const speedSel = document.getElementById('speed');
  const scrub = document.getElementById('scrub');
  const scrubLabel = document.getElementById('scrubLabel');

  let refDate = new Date();
  let offsetDays = 0;
  let playing = false, rafId = null, lastT = 0;
  let size = 600, cx = 300, cy = 300, R = 290;
  let stars = [];
  let hotspots = [];   // { x, y, r, title, sub } in CSS px, rebuilt each render

  const currentDate = () => new Date(refDate.getTime() + offsetDays * 86400000);
  const ptFor = (lon, r) => { const a = (lon - 90) * DEG; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  function annulus(l0, l1, rIn, rOut) {
    ctx.beginPath();
    ctx.arc(cx, cy, rOut, (l0 - 90) * DEG, (l1 - 90) * DEG, false);
    ctx.arc(cx, cy, rIn, (l1 - 90) * DEG, (l0 - 90) * DEG, true);
    ctx.closePath();
  }
  function fmtLocal(d) { const p = (x) => String(x).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; }
  function genStars(n, w) { stars = []; for (let i = 0; i < n; i++) stars.push({ x: Math.random() * w, y: Math.random() * w, r: Math.random() * 1.1 + 0.2, a: Math.random() * 0.5 + 0.15 }); }
  function label(text, lon, r, color, px, font) {
    const [x, y] = ptFor(lon, r);
    ctx.fillStyle = color; ctx.font = `${px}px ${font || SANS}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }
  function addHotspot(x, y, r, title, sub) { hotspots.push({ x, y, r, title, sub }); }

  function resize() {
    const wrap = canvas.parentElement;
    const css = Math.max(280, Math.min(wrap.clientWidth, 600));
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = css + 'px'; canvas.style.height = css + 'px';
    canvas.width = Math.round(css * dpr); canvas.height = Math.round(css * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    size = css; cx = css / 2; cy = css / 2; R = css / 2 - 6;
    genStars(Math.round(css * 0.4), css);
    render();
  }

  // moon phase disc (verified waxing-right / waning-left)
  function drawMoon(x, y, r, illum, waxing) {
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fillStyle = '#161a2a'; ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.clip();
    if (!waxing) { ctx.translate(x, y); ctx.scale(-1, 1); ctx.translate(-x, -y); }
    const k = 1 - 2 * illum;
    ctx.fillStyle = '#e9edf7';
    ctx.beginPath();
    ctx.arc(x, y, r, -Math.PI / 2, Math.PI / 2, false);
    ctx.ellipse(x, y, Math.abs(k) * r, r, 0, Math.PI / 2, -Math.PI / 2, k > 0);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.strokeStyle = 'rgba(207,214,230,0.4)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }

  // ---- LUNAR VERSOR (the 3 / Dollard operator) ----
  function drawVersor(s) {
    const rIn = R * 0.34, rOut = R * 0.46;
    annulus(0, 180, rIn, rOut); ctx.fillStyle = s.versor.arc.waxing ? 'rgba(95,206,155,0.5)' : 'rgba(95,206,155,0.16)'; ctx.fill();
    annulus(180, 360, rIn, rOut); ctx.fillStyle = !s.versor.arc.waxing ? 'rgba(224,102,75,0.5)' : 'rgba(224,102,75,0.16)'; ctx.fill();
    [0, 90, 180, 270].forEach((p) => { const [a, b] = ptFor(p, rIn), [c, d] = ptFor(p, rOut); ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.strokeStyle = 'rgba(7,8,17,0.6)'; ctx.lineWidth = 1.5; ctx.stroke(); });
    [[0, '#f5c451'], [180, '#cfd6e6']].forEach((m) => { const [x, y] = ptFor(m[0], (rIn + rOut) / 2); ctx.beginPath(); ctx.arc(x, y, R * 0.014, 0, 2 * Math.PI); ctx.fillStyle = m[1]; ctx.fill(); });
    const poleLon = [0, 90, 180, 270];
    s.VERSOR_QUAD.forEach((q, i) => {
      const cur = s.versor.quadrant.index === i;
      label(q.op.split(' ')[0], poleLon[i], R * 0.535, cur ? '#fff' : 'rgba(231,234,245,0.6)', Math.round(R * 0.034), SERIF);
      label(q.moon, poleLon[i], R * 0.495, cur ? 'rgba(245,196,81,0.95)' : 'rgba(139,145,173,0.7)', Math.round(R * 0.022), SANS);
      const [hx, hy] = ptFor(poleLon[i], R * 0.5);
      addHotspot(hx, hy, R * 0.085, `${q.moon} moon · ${q.op}`, `${q.field}${cur ? ' · now' : ''}`);
    });
    const [hx, hy] = ptFor(s.versor.angle, R * 0.44);
    const [bx, by] = ptFor(s.versor.angle, R * 0.21);
    const grad = ctx.createLinearGradient(bx, by, hx, hy);
    grad.addColorStop(0, 'rgba(207,214,230,0.15)'); grad.addColorStop(1, 'rgba(207,214,230,0.9)');
    ctx.save(); ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(hx, hy); ctx.strokeStyle = grad; ctx.lineWidth = 2; ctx.shadowColor = 'rgba(207,214,230,0.5)'; ctx.shadowBlur = 10; ctx.stroke(); ctx.restore();
    ctx.beginPath(); ctx.arc(hx, hy, R * 0.011, 0, 2 * Math.PI); ctx.fillStyle = '#e9edf7'; ctx.fill();
  }

  // ---- PLANETARY WEEK (the 7) ----
  function drawWeek(s) {
    const rIn = R * 0.60, rOut = R * 0.72, step = 360 / 7;
    for (let i = 0; i < 7; i++) {
      annulus(i * step, (i + 1) * step, rIn, rOut);
      const cur = s.week.index === i;
      ctx.fillStyle = cur ? 'rgba(245,196,81,0.15)' : 'rgba(255,255,255,0.03)'; ctx.fill();
      const [a, b] = ptFor(i * step, rIn), [c, d] = ptFor(i * step, rOut); ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1; ctx.stroke();
      const w = s.WEEK[i];
      const [wx, wy] = ptFor(i * step + step / 2, (rIn + rOut) / 2);
      label(w.glyph, i * step + step / 2, (rIn + rOut) / 2, cur ? w.tint : 'rgba(225,230,245,0.5)', Math.round(R * 0.04), SERIF);
      addHotspot(wx, wy, R * 0.05, `${w.glyph} ${w.planet}-day`, `${w.day} · Sefirah ${w.sefirah}${cur ? ' · today' : ''}`);
    }
    const [px, py] = ptFor(s.week.angle, rOut + R * 0.022);
    ctx.beginPath(); ctx.arc(px, py, R * 0.013, 0, 2 * Math.PI); ctx.fillStyle = '#f5c451'; ctx.fill();
  }

  // ---- ANNUAL ZODIAC (the 12) ----
  function drawZodiac(s) {
    const si = s.sun.sign.index;
    annulus(si * 30, (si + 1) * 30, R * 0.90, R * 0.99); ctx.fillStyle = 'rgba(245,196,81,0.10)'; ctx.fill();
    for (let i = 0; i < 12; i++) {
      const [x1, y1] = ptFor(i * 30, R * 0.90), [x2, y2] = ptFor(i * 30, R * 0.99);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 1; ctx.stroke();
      const [gx, gy] = ptFor(i * 30 + 15, R * 0.945);
      label(s.SIGNS[i].glyph, i * 30 + 15, R * 0.945, i === si ? '#f5c451' : 'rgba(225,230,245,0.72)', Math.round(R * 0.05), SERIF);
      addHotspot(gx, gy, R * 0.05, `${s.SIGNS[i].glyph} ${s.SIGNS[i].name}`, i === si ? 'Annual zodiac · ☉ Sun is here' : 'Annual zodiac (the 12)');
    }
    [0.90, 0.99].forEach((f, idx) => { ctx.beginPath(); ctx.arc(cx, cy, R * f, 0, 2 * Math.PI); ctx.strokeStyle = idx ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1; ctx.stroke(); });
  }

  // ---- SOLAR SEASON CYCLE (solstices + equinoxes, and where the Sun sits) ----
  const SEASON_POINTS = [
    { lon: 0,   solstice: false, name: 'Spring Equinox',  short: 'Spring', tint: '#8fd6a0' },
    { lon: 90,  solstice: true,  name: 'Summer Solstice', short: 'Summer', tint: '#f5c451' },
    { lon: 180, solstice: false, name: 'Autumn Equinox',  short: 'Autumn', tint: '#e0a05f' },
    { lon: 270, solstice: true,  name: 'Winter Solstice', short: 'Winter', tint: '#9ec5f0' },
  ];
  const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
  function drawSunIcon(x, y, r, color) {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, r * 0.32); ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 1.35, y + Math.sin(a) * r * 1.35); ctx.lineTo(x + Math.cos(a) * r * 1.85, y + Math.sin(a) * r * 1.85); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fillStyle = 'rgba(7,8,17,0.92)'; ctx.fill();
    ctx.lineWidth = Math.max(1.2, r * 0.32); ctx.strokeStyle = color; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r * 0.42, 0, 2 * Math.PI); ctx.fillStyle = color; ctx.fill();
    ctx.restore();
  }
  function drawEquinoxIcon(x, y, r, color) {
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fillStyle = 'rgba(7,8,17,0.92)'; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, Math.PI / 2, false); ctx.closePath(); ctx.fillStyle = color; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.strokeStyle = color; ctx.lineWidth = Math.max(1.2, r * 0.28); ctx.stroke();
    ctx.restore();
  }
  function seasonProgress(s) {
    const next = ['Summer Solstice', 'Autumn Equinox', 'Winter Solstice', 'Spring Equinox'][s.season.index];
    const pct = Math.round((s.sun.lon % 90) / 90 * 100);
    return `${s.season.name} · ${pct}% to ${next}`;
  }
  function drawSeasons(s) {
    const sl = s.sun.lon, sIdx = s.season.index, start = SEASON_POINTS[sIdx];
    // faint wash over the current season's quadrant of the zodiac ring
    annulus(sIdx * 90, (sIdx + 1) * 90, R * 0.90, R * 0.99); ctx.fillStyle = hexA(start.tint, 0.07); ctx.fill();
    // progress arc from the season's opening point round to the Sun (how far into the season)
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.915, (sIdx * 90 - 90) * DEG, (sl - 90) * DEG, false);
    ctx.strokeStyle = hexA(start.tint, 0.75); ctx.lineWidth = Math.max(2, R * 0.016); ctx.lineCap = 'round'; ctx.stroke();
    const [spx, spy] = ptFor(sl, R * 0.915);
    ctx.beginPath(); ctx.arc(spx, spy, Math.max(2, R * 0.014), 0, 2 * Math.PI); ctx.fillStyle = start.tint; ctx.fill();
    // the four cardinal turning-points (solstices = sun icon, equinoxes = day/night disc)
    SEASON_POINTS.forEach((sp) => {
      const [t0x, t0y] = ptFor(sp.lon, R * 0.90), [t1x, t1y] = ptFor(sp.lon, R * 0.99);
      ctx.beginPath(); ctx.moveTo(t0x, t0y); ctx.lineTo(t1x, t1y); ctx.strokeStyle = hexA(sp.tint, 0.6); ctx.lineWidth = 1.8; ctx.stroke();
      const [mx, my] = ptFor(sp.lon, R * 0.945);
      if (sp.solstice) drawSunIcon(mx, my, R * 0.02, sp.tint); else drawEquinoxIcon(mx, my, R * 0.018, sp.tint);
      addHotspot(mx, my, R * 0.05, sp.name, sp.solstice ? 'solstice — the Sun’s turning point' : 'equinox — day equals night');
    });
  }

  function drawPlanets(s) {
    const items = s.bodies.map((b) => ({ ...b })).sort((a, b) => a.lon - b.lon);
    let lastLon = -999, bump = 0; const rBase = R * 0.80;
    items.forEach((b) => {
      let r = rBase;
      if (b.lon - lastLon < 8) { bump = bump > 0 ? -1 : 1; r = rBase + bump * R * 0.055; } else bump = 0;
      lastLon = b.lon;
      const [x, y] = ptFor(b.lon, r);
      const [tx, ty] = ptFor(b.lon, R * 0.90), [sx, sy] = ptFor(b.lon, r + R * 0.03);
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(tx, ty); ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, R * 0.03, 0, 2 * Math.PI); ctx.fillStyle = 'rgba(7,8,17,0.85)'; ctx.fill(); ctx.strokeStyle = b.tint; ctx.lineWidth = 1.2; ctx.stroke();
      label(b.glyph, b.lon, r, b.tint, Math.round(R * 0.046), SERIF);
      addHotspot(x, y, R * 0.055, `${b.glyph} ${b.key}`, `${b.sign.glyph} ${b.sign.name} ${b.sign.deg.toFixed(1)}°`);
    });
  }

  function drawSunPointer(s) {
    const [hx, hy] = ptFor(s.sun.lon, R * 0.88), [bx, by] = ptFor(s.sun.lon, R * 0.50);
    const grad = ctx.createLinearGradient(bx, by, hx, hy);
    grad.addColorStop(0, 'rgba(245,196,81,0.04)'); grad.addColorStop(1, 'rgba(245,196,81,0.8)');
    ctx.save(); ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(hx, hy); ctx.strokeStyle = grad; ctx.lineWidth = 1.5; ctx.setLineDash([4, 5]); ctx.stroke(); ctx.restore();
  }

  function drawBackground() {
    const g = ctx.createRadialGradient(cx, cy, R * 0.08, cx, cy, R * 1.08);
    g.addColorStop(0, '#171b33'); g.addColorStop(1, '#0a0b16');
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
    stars.forEach((st) => { ctx.globalAlpha = st.a; ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 2 * Math.PI); ctx.fillStyle = '#cdd6ef'; ctx.fill(); });
    ctx.globalAlpha = 1;
  }

  function render() {
    if (!V || !window.Astronomy) return;
    const s = V.computeState(currentDate());
    hotspots = [];
    ctx.clearRect(0, 0, size, size);
    drawBackground();
    drawVersor(s);
    drawWeek(s);
    drawZodiac(s);
    drawSeasons(s);
    drawSunPointer(s);
    drawPlanets(s);
    drawMoon(cx, cy, R * 0.20, s.moon.illum, s.moon.waxing);
    addHotspot(cx, cy, R * 0.20, `${s.moon.phaseName} Moon`, `${Math.round(s.moon.illum * 100)}% lit · ${s.versor.arc.name} · ${s.versor.quadrant.op}`);
    updateReadout(s);
  }

  function updateReadout(s) {
    const r = V.interpret(s);
    const dateStr = s.date.toLocaleString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const deg = (x) => x.toFixed(1) + '°';
    const pct = (x) => Math.round(x * 100);
    const extra = s.versor.arc.atThroughZero ? ' · through-zero apex' : s.versor.arc.atOriginZero ? ' · origin-zero' : '';
    const rows = s.bodies.map((b) => `<tr><td class="g" style="color:${b.tint}">${b.glyph}</td><td>${b.key}</td><td class="mono">${b.sign.glyph} ${b.sign.name}</td><td class="mono dim">${deg(b.sign.deg)}</td></tr>`).join('');
    panel.innerHTML = `
      <div class="moment">${dateStr}</div>
      <h2 class="headline">${r.headline}</h2>
      <p class="reading">${r.body}</p>
      <div class="fc">
        <div class="favors"><span class="micro">Favors</span><p>${r.favors}</p></div>
        <div class="caution"><span class="micro">Caution</span><p>${r.caution}</p></div>
      </div>
      <div class="cycles">
        <div class="cyc lunar"><span class="micro">Lunar versor · the 3</span><b>${s.versor.arc.name} · ${s.versor.quadrant.op}</b><small>${s.versor.quadrant.moon} · ${s.versor.quadrant.field}${extra}</small></div>
        <div class="cyc week"><span class="micro">Planetary week · the 7</span><b>${s.week.glyph} ${s.week.planet}-day</b><small>${s.week.day} · Sefirah ${s.week.sefirah}</small></div>
        <div class="cyc year"><span class="micro">Annual zodiac · the 12</span><b>${s.twelve.glyph} ${s.twelve.name} ${deg(s.twelve.deg)}</b><small>${seasonProgress(s)} · Moon ${s.moon.phaseName} ${pct(s.moon.illum)}%</small></div>
      </div>
      <table class="bodies"><tbody>${rows}</tbody></table>`;
  }

  // ---- hover / tap tooltips ----
  function pointerXY(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = rect.width ? size / rect.width : 1;
    return [(e.clientX - rect.left) * sx, (e.clientY - rect.top) * sx];
  }
  function hitTest(mx, my) {
    let best = null, bd = Infinity;
    for (const h of hotspots) { const d = Math.hypot(mx - h.x, my - h.y); if (d < h.r && d < bd) { bd = d; best = h; } }
    return best;
  }
  function showTip(h) {
    tip.innerHTML = `<b>${h.title}</b>${h.sub ? `<span>${h.sub}</span>` : ''}`;
    tip.style.left = (canvas.offsetLeft + h.x) + 'px';
    tip.style.top = (canvas.offsetTop + h.y - R * 0.06) + 'px';
    tip.classList.add('show');
  }
  function hideTip() { tip.classList.remove('show'); }

  function frame(t) {
    if (!playing) return;
    if (t - lastT > 55) { lastT = t; refDate = new Date(refDate.getTime() + (+speedSel.value) * 86400000); dtInput.value = fmtLocal(currentDate()); render(); }
    rafId = requestAnimationFrame(frame);
  }
  function togglePlay() { playing = !playing; playBtn.textContent = playing ? '⏸ Pause' : '▶ Play'; if (playing) { lastT = 0; rafId = requestAnimationFrame(frame); } }
  function stopPlay() { playing = false; playBtn.textContent = '▶ Play'; if (rafId) cancelAnimationFrame(rafId); }

  function init() {
    refDate = new Date(); offsetDays = 0; dtInput.value = fmtLocal(refDate);
    dtInput.addEventListener('change', () => { const d = new Date(dtInput.value); if (!isNaN(d.getTime())) { stopPlay(); refDate = d; offsetDays = 0; scrub.value = 0; scrubLabel.textContent = '+0 d'; render(); } });
    nowBtn.addEventListener('click', () => { stopPlay(); refDate = new Date(); offsetDays = 0; scrub.value = 0; scrubLabel.textContent = '+0 d'; dtInput.value = fmtLocal(refDate); render(); });
    scrub.addEventListener('input', () => { offsetDays = +scrub.value; scrubLabel.textContent = (offsetDays >= 0 ? '+' : '') + offsetDays + ' d'; render(); });
    playBtn.addEventListener('click', togglePlay);
    canvas.addEventListener('mousemove', (e) => { const [mx, my] = pointerXY(e); const h = hitTest(mx, my); if (h) { showTip(h); canvas.style.cursor = 'pointer'; } else { hideTip(); canvas.style.cursor = 'default'; } });
    canvas.addEventListener('mouseleave', hideTip);
    canvas.addEventListener('click', (e) => { const [mx, my] = pointerXY(e); const h = hitTest(mx, my); if (h) showTip(h); else hideTip(); });
    window.addEventListener('resize', resize);
    resize();
  }
  init();
})();
