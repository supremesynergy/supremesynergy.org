/* blueprint-visuals.js — canvas diagrams for the natal blueprint.

   - renderNatalClock(canvas, bp): the 3·7·12 versor dial. Static birth chart
     (Personality + Design), plus an animated Birth ↔ Today's-transits toggle
     that tweens the sky markers, moon and active gates between the birth
     moment and right now.
   - renderCentreMap(canvas, hd): an ORIGINAL 9-centre network diagram with the
     active channels (NOT the Rave BodyGraph™).
   - exportCard(bp): a polished, shareable PNG — clock + summary + prime gifts.

   Our own rendering; public-domain I Ching hexagrams. Depends on
   window.Versor.blueprint (engine) + window.Astronomy + window.VersorCodes. */
(function (g) {
  'use strict';
  const BP = (window.Versor && window.Versor.blueprint) || {};
  const A = window.Astronomy;
  const DEG = Math.PI / 180;
  const SERIF = "'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif";
  const SANS = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
  const norm360 = (x) => (((x % 360) + 360) % 360);
  const lerpLon = (a, b, t) => norm360(a + ((((b - a + 540) % 360) - 180) * t));
  const lerp = (a, b, t) => a + (b - a) * t;
  function lerpHex(c1, c2, t) {
    const p = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
    const a = p(c1), b = p(c2);
    return `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`;
  }

  const SIGNS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
  const BODY_GLYPH = { Sun: '☉', Earth: '⊕', Moon: '☽', NorthNode: '☊', SouthNode: '☋', Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇' };
  const BODY_NAME = { Sun: 'Sun', Earth: 'Earth', Moon: 'Moon', NorthNode: 'North Node', SouthNode: 'South Node', Mercury: 'Mercury', Venus: 'Venus', Mars: 'Mars', Jupiter: 'Jupiter', Saturn: 'Saturn', Uranus: 'Uranus', Neptune: 'Neptune', Pluto: 'Pluto' };
  const PERSON = '#f5c451', DESIGN = '#7fb2e8', NOW = '#74d6a8';
  const GATE_SEQ = BP.GATE_SEQUENCE || [];
  const HD_START = BP.HD_START_DEG != null ? BP.HD_START_DEG : 358.25;
  const GSIZE = BP.GATE_SIZE || 5.625;

  const ptFor = (cx, cy, lon, r) => { const a = (lon - 90) * DEG; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };

  // The Sun's seasonal cycle — the four cardinal turning points on the tropical
  // wheel (0° Aries = March/Spring equinox, 90° Cancer = June/Summer solstice, …).
  const SEASON_POINTS = [
    { lon: 0,   solstice: false, name: 'Spring Equinox',  short: 'Spring', tint: '#8fd6a0' },
    { lon: 90,  solstice: true,  name: 'Summer Solstice', short: 'Summer', tint: '#f5c451' },
    { lon: 180, solstice: false, name: 'Autumn Equinox',  short: 'Autumn', tint: '#e0a05f' },
    { lon: 270, solstice: true,  name: 'Winter Solstice', short: 'Winter', tint: '#9ec5f0' },
  ];
  function drawSunIcon(ctx, x, y, r, color) {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, r * 0.32); ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 1.35, y + Math.sin(a) * r * 1.35); ctx.lineTo(x + Math.cos(a) * r * 1.85, y + Math.sin(a) * r * 1.85); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fillStyle = 'rgba(7,8,17,0.92)'; ctx.fill();
    ctx.lineWidth = Math.max(1.2, r * 0.32); ctx.strokeStyle = color; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r * 0.42, 0, 2 * Math.PI); ctx.fillStyle = color; ctx.fill();
    ctx.restore();
  }
  function drawEquinoxIcon(ctx, x, y, r, color) {
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fillStyle = 'rgba(7,8,17,0.92)'; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, Math.PI / 2, false); ctx.closePath(); ctx.fillStyle = color; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.strokeStyle = color; ctx.lineWidth = Math.max(1.2, r * 0.28); ctx.stroke();
    ctx.restore();
  }
  // "Spring — 41% from the Spring Equinox to the Summer Solstice"
  function seasonPhrase(lon) {
    const sl = norm360(lon);
    const idx = Math.floor(sl / 90) % 4;
    const seasons = ['Spring', 'Summer', 'Autumn', 'Winter'];
    const from = ['the Spring Equinox', 'the Summer Solstice', 'the Autumn Equinox', 'the Winter Solstice'][idx];
    const to = ['the Summer Solstice', 'the Autumn Equinox', 'the Winter Solstice', 'the Spring Equinox'][idx];
    const pct = Math.round((sl % 90) / 90 * 100);
    return `☉ ${seasons[idx]} — ${pct}% from ${from} to ${to}`;
  }

  function starfield(ctx, w, seed) {
    let s = seed || 7; const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < Math.round(w * 0.4); i++) { ctx.globalAlpha = rnd() * 0.5 + 0.12; ctx.beginPath(); ctx.arc(rnd() * w, rnd() * w, rnd() * 1.1 + 0.2, 0, 2 * Math.PI); ctx.fillStyle = '#cdd6ef'; ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  function drawMoonDisc(ctx, x, y, r, illum, waxing) {
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fillStyle = '#161a2a'; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.clip();
    if (!waxing) { ctx.translate(x, y); ctx.scale(-1, 1); ctx.translate(-x, -y); }
    const k = 1 - 2 * Math.max(0, Math.min(1, illum));
    ctx.fillStyle = '#e9edf7';
    ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, Math.PI / 2, false);
    ctx.ellipse(x, y, Math.abs(k) * r, r, 0, Math.PI / 2, -Math.PI / 2, k > 0);
    ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.strokeStyle = 'rgba(207,214,230,0.4)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }
  function moonOf(date) {
    if (!A) return { illum: 0.5, waxing: true };
    const ph = norm360(A.MoonPhase(date));
    return { illum: (1 - Math.cos(ph * DEG)) / 2, waxing: ph < 180 };
  }

  // Core dial drawing. opts: { sky:[{body,longitude,gate,line}], design, designAlpha,
  // skyColor, moon:{illum,waxing}, activeGates:Set, sunLon }. Returns hotspots.
  function drawClock(ctx, cx, cy, R, opts) {
    const hs = [];
    const lbl = (text, lon, r, color, px, font) => { const [x, y] = ptFor(cx, cy, lon, r); ctx.fillStyle = color; ctx.font = `${px}px ${font || SANS}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y); };

    const bgrad = ctx.createRadialGradient(cx, cy, R * 0.08, cx, cy, R * 1.1);
    bgrad.addColorStop(0, '#171b33'); bgrad.addColorStop(1, '#0a0b16');
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R * 1.04, 0, 2 * Math.PI); ctx.clip();
    ctx.fillStyle = bgrad; ctx.fillRect(cx - R * 1.1, cy - R * 1.1, R * 2.2, R * 2.2);
    starfield(ctx, R * 2.2, 11); ctx.restore();

    // zodiac ring
    const sunSign = opts.sunLon != null ? Math.floor(norm360(opts.sunLon) / 30) % 12 : -1;
    if (sunSign >= 0) { ctx.beginPath(); ctx.arc(cx, cy, R * 0.995, (sunSign * 30 - 90) * DEG, ((sunSign + 1) * 30 - 90) * DEG); ctx.arc(cx, cy, R * 0.90, ((sunSign + 1) * 30 - 90) * DEG, (sunSign * 30 - 90) * DEG, true); ctx.closePath(); ctx.fillStyle = 'rgba(245,196,81,0.10)'; ctx.fill(); }
    for (let i = 0; i < 12; i++) {
      const [x1, y1] = ptFor(cx, cy, i * 30, R * 0.90), [x2, y2] = ptFor(cx, cy, i * 30, R * 0.995);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1; ctx.stroke();
      lbl(SIGNS[i], i * 30 + 15, R * 0.95, i === sunSign ? PERSON : 'rgba(225,230,245,0.66)', Math.round(R * 0.045), SERIF);
    }
    [0.90, 0.995].forEach((f) => { ctx.beginPath(); ctx.arc(cx, cy, R * f, 0, 2 * Math.PI); ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 1; ctx.stroke(); });

    // ── the Sun's seasonal cycle: solstices, equinoxes, and where the Sun sits ──
    if (opts.sunLon != null) {
      const sl = norm360(opts.sunLon);
      const sIdx = Math.floor(sl / 90) % 4;
      const start = SEASON_POINTS[sIdx];
      // faint wash over the current season's quadrant of the zodiac band
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.995, (sIdx * 90 - 90) * DEG, ((sIdx + 1) * 90 - 90) * DEG);
      ctx.arc(cx, cy, R * 0.90, ((sIdx + 1) * 90 - 90) * DEG, (sIdx * 90 - 90) * DEG, true);
      ctx.closePath(); ctx.fillStyle = hexA(start.tint, 0.07); ctx.fill();
      // progress arc from the season's opening point round to the Sun (how far into the season)
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.885, (sIdx * 90 - 90) * DEG, (sl - 90) * DEG, false);
      ctx.strokeStyle = hexA(start.tint, 0.7); ctx.lineWidth = Math.max(2, R * 0.012); ctx.lineCap = 'round'; ctx.stroke();
      const [spx, spy] = ptFor(cx, cy, sl, R * 0.885);
      ctx.beginPath(); ctx.arc(spx, spy, Math.max(2, R * 0.013), 0, 2 * Math.PI); ctx.fillStyle = start.tint; ctx.fill();
    }
    // the four cardinal turning-points (solstices = sun icon, equinoxes = day/night disc)
    SEASON_POINTS.forEach((sp) => {
      const [t0x, t0y] = ptFor(cx, cy, sp.lon, R * 0.90), [t1x, t1y] = ptFor(cx, cy, sp.lon, R * 0.995);
      ctx.beginPath(); ctx.moveTo(t0x, t0y); ctx.lineTo(t1x, t1y); ctx.strokeStyle = hexA(sp.tint, 0.55); ctx.lineWidth = 1.6; ctx.stroke();
      const [mx, my] = ptFor(cx, cy, sp.lon, R * 0.945);
      if (sp.solstice) drawSunIcon(ctx, mx, my, R * 0.02, sp.tint);
      else drawEquinoxIcon(ctx, mx, my, R * 0.018, sp.tint);
      if (opts.seasonLabels) lbl(sp.short, sp.lon, R * 0.965, hexA(sp.tint, 0.95), Math.round(R * 0.026), SANS);
      hs.push({ x: mx, y: my, r: R * 0.05, title: sp.name, sub: sp.solstice ? 'solstice — the Sun’s turning point' : 'equinox — day equals night' });
    });

    // gate ring
    const active = opts.activeGates || new Set();
    const gIn = R * 0.74, gOut = R * 0.88;
    [gIn, gOut].forEach((f) => { ctx.beginPath(); ctx.arc(cx, cy, f, 0, 2 * Math.PI); ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1; ctx.stroke(); });
    for (let i = 0; i < 64; i++) {
      const lon0 = HD_START + i * GSIZE;
      const [tx0, ty0] = ptFor(cx, cy, lon0, gIn), [tx1, ty1] = ptFor(cx, cy, lon0, gOut);
      ctx.beginPath(); ctx.moveTo(tx0, ty0); ctx.lineTo(tx1, ty1); ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1; ctx.stroke();
      const gate = GATE_SEQ[i], on = active.has(gate);
      const [gx, gy] = ptFor(cx, cy, lon0 + GSIZE / 2, (gIn + gOut) / 2);
      if (on) { ctx.beginPath(); ctx.arc(gx, gy, R * 0.028, 0, 2 * Math.PI); ctx.fillStyle = 'rgba(245,196,81,0.14)'; ctx.fill(); }
      lbl(String(gate), lon0 + GSIZE / 2, (gIn + gOut) / 2, on ? '#f5c451' : 'rgba(180,186,210,0.45)', Math.round(R * 0.026), SANS);
    }

    function band(markers, baseR, color, alpha, label) {
      if (!markers || alpha <= 0.01) return;
      ctx.save(); ctx.globalAlpha = alpha;
      const items = markers.map((m) => ({ ...m })).sort((x, y) => x.longitude - y.longitude);
      let lastLon = -999, bump = 0;
      items.forEach((b) => {
        let r = baseR;
        if (b.longitude - lastLon < 7) { bump = bump > 0 ? -1 : 1; r = baseR + bump * R * 0.05; } else bump = 0;
        lastLon = b.longitude;
        const [x, y] = ptFor(cx, cy, b.longitude, r);
        const [tx, ty] = ptFor(cx, cy, b.longitude, gIn), [sx, sy] = ptFor(cx, cy, b.longitude, r + R * 0.028);
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(tx, ty); ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, R * 0.028, 0, 2 * Math.PI); ctx.fillStyle = 'rgba(7,8,17,0.9)'; ctx.fill(); ctx.strokeStyle = color; ctx.lineWidth = 1.3; ctx.stroke();
        lbl(BODY_GLYPH[b.body] || '•', b.longitude, r, color, Math.round(R * 0.04), SERIF);
        if (alpha > 0.85 && label) hs.push({ x, y, r: R * 0.05, title: `${BODY_GLYPH[b.body] || ''} ${BODY_NAME[b.body] || b.body} · ${b.gate}.${b.line}`, sub: label });
      });
      ctx.restore();
    }
    band(opts.design, R * 0.50, DESIGN, opts.designAlpha != null ? opts.designAlpha : 1, 'Design · unconscious');
    band(opts.sky, R * 0.64, opts.skyColor || PERSON, 1, opts.skyLabel || 'Personality · conscious');

    drawMoonDisc(ctx, cx, cy, R * 0.16, opts.moon.illum, opts.moon.waxing);
    return hs;
  }

  function buildSets(bp) {
    const birthDate = new Date(bp.birthUtc);
    const gatesOf = (arr) => new Set(arr.map((a) => a.gate));
    const birthSky = bp.hd.personalityActivations.map((a) => ({ body: a.body, longitude: a.longitude, gate: a.gate, line: a.line }));
    const design = bp.hd.designActivations.map((a) => ({ body: a.body, longitude: a.longitude, gate: a.gate, line: a.line }));
    let now = [], nowMoon = { illum: 0.5, waxing: true }, nowGates = new Set();
    try {
      const d = new Date();
      now = (BP.HD_BODIES || []).map((b) => { const lon = BP.hdBodyLongitude(b, d); const gl = BP.degreeToGateLine(lon); return { body: b, longitude: lon, gate: gl.gate, line: gl.line }; });
      nowMoon = moonOf(d); nowGates = gatesOf(now);
    } catch (e) { /* transits optional */ }
    return {
      birth: { sky: birthSky, design, moon: moonOf(birthDate), gates: new Set([...gatesOf(birthSky), ...gatesOf(design)]) },
      now: { sky: now, moon: nowMoon, gates: nowGates },
    };
  }

  // ── tooltips ──
  let tipEl;
  function ensureTip() { if (tipEl) return tipEl; tipEl = document.createElement('div'); tipEl.className = 'bp-canvas-tip'; document.body.appendChild(tipEl); return tipEl; }
  function attachTips(canvas, getHotspots, getSize) {
    const tip = ensureTip();
    const xy = (e) => { const rect = canvas.getBoundingClientRect(); const sc = rect.width ? getSize() / rect.width : 1; return [(e.clientX - rect.left) * sc, (e.clientY - rect.top) * sc, rect, sc]; };
    const hit = (mx, my) => { let best = null, bd = Infinity; for (const h of getHotspots()) { const d = Math.hypot(mx - h.x, my - h.y); if (d < h.r && d < bd) { bd = d; best = h; } } return best; };
    const move = (e) => { const [mx, my, rect, sc] = xy(e); const h = hit(mx, my); if (h) { tip.innerHTML = `<b>${h.title}</b>${h.sub ? `<span>${h.sub}</span>` : ''}`; tip.style.left = (rect.left + h.x / sc) + 'px'; tip.style.top = (rect.top + h.y / sc - 14) + 'px'; tip.classList.add('show'); canvas.style.cursor = 'pointer'; } else { tip.classList.remove('show'); canvas.style.cursor = 'default'; } };
    canvas.addEventListener('mousemove', move); canvas.addEventListener('mouseleave', () => tip.classList.remove('show')); canvas.addEventListener('click', move);
  }
  function sizeCanvas(canvas, css) { const dpr = window.devicePixelRatio || 1; canvas.style.width = css + 'px'; canvas.style.height = css + 'px'; canvas.width = Math.round(css * dpr); canvas.height = Math.round(css * dpr); const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return ctx; }

  function renderNatalClock(canvas, bp) {
    const sets = buildSets(bp);
    let hotspots = [], t = 0, target = 0, raf = null;
    const wrap = canvas.parentElement;
    const cap = wrap ? wrap.querySelector('.bp-clock-caption') : null;
    const btns = wrap ? wrap.querySelectorAll('.bp-clock-toggle [data-mode]') : [];
    const hasNow = sets.now.sky.length > 0;

    function optsAt(tt) {
      const sky = sets.birth.sky.map((m, i) => { const n = (sets.now.sky[i]) || m; const lon = hasNow ? lerpLon(m.longitude, n.longitude, tt) : m.longitude; const at = tt < 0.5; return { body: m.body, longitude: lon, gate: at ? m.gate : n.gate, line: at ? m.line : n.line }; });
      const bm = sets.birth.moon, nm = sets.now.moon;
      return {
        sky, design: sets.birth.design, designAlpha: 1 - tt,
        skyColor: lerpHex(PERSON, NOW, tt), skyLabel: tt < 0.5 ? 'Personality · conscious' : 'Transit · right now',
        moon: { illum: lerp(bm.illum, nm.illum, tt), waxing: tt < 0.5 ? bm.waxing : nm.waxing },
        activeGates: tt < 0.5 ? sets.birth.gates : sets.now.gates,
        sunLon: (sky.find((m) => m.body === 'Sun') || {}).longitude,
      };
    }
    function drawAt(tt) {
      const css = canvas._css; const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, css, css);
      hotspots = drawClock(ctx, css / 2, css / 2, css / 2 - 6, optsAt(tt));
    }
    function size() { const w = wrap ? wrap.clientWidth : 520; const css = Math.max(280, Math.min(w, 540)); sizeCanvas(canvas, css); canvas._css = css; drawAt(t); }
    function animate() {
      const step = 0.045;
      if (Math.abs(t - target) <= step) { t = target; drawAt(t); raf = null; return; }
      t += t < target ? step : -step; drawAt(t); raf = requestAnimationFrame(animate);
    }
    function go(mode) {
      if (!hasNow && mode === 'now') return;
      target = mode === 'now' ? 1 : 0;
      btns.forEach((b) => b.classList.toggle('on', b.dataset.mode === mode));
      if (cap) {
        const base = mode === 'now' ? "Today's transits — where the planets sit right now, sweeping out from your birth sky." : 'Your birth sky — the heavens at the moment you were born.';
        const sunLon = ((mode === 'now' ? sets.now.sky : sets.birth.sky).find((m) => m.body === 'Sun') || {}).longitude;
        cap.textContent = sunLon != null ? base + '  ·  ' + seasonPhrase(sunLon) : base;
      }
      if (!raf) raf = requestAnimationFrame(animate);
    }
    size();
    if (cap) { const s = (sets.birth.sky.find((m) => m.body === 'Sun') || {}).longitude; if (s != null) cap.textContent = 'Your birth sky — the heavens at the moment you were born.  ·  ' + seasonPhrase(s); }
    btns.forEach((b) => { if (!hasNow && b.dataset.mode === 'now') b.disabled = true; b.addEventListener('click', () => go(b.dataset.mode)); });
    attachTips(canvas, () => hotspots, () => canvas._css || 520);
    if (!canvas._rz) { canvas._rz = true; window.addEventListener('resize', () => { clearTimeout(canvas._t); canvas._t = setTimeout(size, 150); }); }
  }

  // ── original 9-centre network map ──
  const CENTRE_POS = { Head: [0.5, 0.07], Ajna: [0.5, 0.21], Throat: [0.5, 0.35], Self: [0.5, 0.52], Heart: [0.78, 0.45], SolarPlexus: [0.80, 0.64], Spleen: [0.20, 0.62], Sacral: [0.5, 0.71], Root: [0.5, 0.88] };
  const CENTRE_LABEL = { Head: 'Head', Ajna: 'Ajna', Throat: 'Throat', Self: 'G', Heart: 'Heart', SolarPlexus: 'Solar Plexus', Spleen: 'Spleen', Sacral: 'Sacral', Root: 'Root' };
  const GATE_CENTER = BP.GATE_CENTER || {};
  function renderCentreMap(canvas, hd) {
    const wrap = canvas.parentElement;
    const cssW = Math.max(260, Math.min(wrap ? wrap.clientWidth : 360, 420)), cssH = Math.round(cssW * 1.18);
    const dpr = window.devicePixelRatio || 1; canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px'; canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
    const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, cssW, cssH);
    const defined = new Set(hd.definedCenters); const P = (c) => [CENTRE_POS[c][0] * cssW, CENTRE_POS[c][1] * cssH];
    hd.activeChannels.forEach((ch) => { const [a, b] = ch.split('-'); const ca = GATE_CENTER[a], cb = GATE_CENTER[b]; if (!ca || !cb || ca === cb) return; const [x1, y1] = P(ca), [x2, y2] = P(cb); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = 'rgba(245,196,81,0.55)'; ctx.lineWidth = 2; ctx.stroke(); });
    const rNode = cssW * 0.075;
    Object.keys(CENTRE_POS).forEach((c) => {
      const [x, y] = P(c); const on = defined.has(c);
      ctx.beginPath(); ctx.arc(x, y, rNode, 0, 2 * Math.PI); ctx.fillStyle = on ? 'rgba(245,196,81,0.18)' : 'rgba(255,255,255,0.03)'; ctx.fill(); ctx.strokeStyle = on ? '#f5c451' : 'rgba(255,255,255,0.18)'; ctx.lineWidth = on ? 2 : 1; ctx.stroke();
      ctx.fillStyle = on ? '#fff' : 'rgba(180,186,210,0.6)'; ctx.font = `${Math.round(cssW * 0.034)}px ${SANS}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const label = CENTRE_LABEL[c];
      if (label.length > 7) { const parts = label.split(' '); ctx.fillText(parts[0], x, y - cssW * 0.018); ctx.fillText(parts[1], x, y + cssW * 0.018); } else ctx.fillText(label, x, y);
    });
  }

  // ── polished shareable PNG card ──
  function exportCard(bp) {
    const W = 1080, H = 1350, dpr = 2;
    const c = document.createElement('canvas'); c.width = W * dpr; c.height = H * dpr;
    const ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const codes = window.VersorCodes || { GATES: {} };
    // bg + gold frame
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0c0e1c'); bg.addColorStop(1, '#070811');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(245,196,81,0.5)'; ctx.lineWidth = 2; ctx.strokeRect(28, 28, W - 56, H - 56);
    ctx.textAlign = 'center';
    // wordmark + title
    ctx.fillStyle = 'rgba(245,196,81,0.85)'; ctx.font = `600 22px ${SANS}`;
    ctx.fillText('S U P R E M E   S Y N E R G Y', W / 2, 84);
    ctx.fillStyle = '#fff'; ctx.font = `600 58px ${SERIF}`; ctx.fillText('Natal Blueprint', W / 2, 144);
    ctx.fillStyle = '#e7eaf5'; ctx.font = `30px ${SANS}`;
    ctx.fillText(`${bp.hd.type}  ·  ${bp.hd.authority}  ·  Profile ${bp.hd.profile}`, W / 2, 196);
    // clock
    const R = (W - 280) / 2; const ccy = 232 + R + 18;
    drawClock(ctx, W / 2, ccy, R, { sky: bp.hd.personalityActivations, design: bp.hd.designActivations, designAlpha: 1, skyColor: PERSON, seasonLabels: true, moon: moonOf(new Date(bp.birthUtc)), activeGates: new Set([...bp.hd.personalityActivations.map((a) => a.gate), ...bp.hd.designActivations.map((a) => a.gate)]), sunLon: (bp.hd.personalityActivations.find((a) => a.body === 'Sun') || {}).longitude });
    // prime gifts strip (first 3 Activation spheres)
    const gifts = bp.spheres.filter((s) => s.sequence === 'Activation').slice(0, 3);
    const stripY = ccy + R + 60; const colW = (W - 120) / gifts.length;
    gifts.forEach((s, i) => {
      const x = 60 + colW * i + colW / 2;
      const gate = codes.GATES[s.gate] || {};
      ctx.fillStyle = '#f5c451'; ctx.font = `46px ${SERIF}`; ctx.fillText(String.fromCodePoint(0x4DC0 + s.gate - 1), x, stripY + 8);
      ctx.fillStyle = 'rgba(231,234,245,0.6)'; ctx.font = `19px ${SANS}`; ctx.fillText(s.name, x, stripY + 44);
      ctx.fillStyle = '#fff'; ctx.font = `600 24px ${SANS}`; ctx.fillText(`${s.gate}.${s.line}`, x, stripY + 74);
      ctx.fillStyle = 'rgba(231,234,245,0.85)'; ctx.font = `20px ${SERIF}`; ctx.fillText(gate.name || '', x, stripY + 104);
    });
    // footer
    ctx.fillStyle = 'rgba(245,196,81,0.85)'; ctx.font = `20px ${SANS}`; ctx.fillText('●  Personality      ●  Design', W / 2, H - 104);
    ctx.fillStyle = 'rgba(231,234,245,0.5)'; ctx.font = `22px ${SANS}`; ctx.fillText('supremesynergy.org/clock', W / 2, H - 66);
    const url = c.toDataURL('image/png');
    const a = document.createElement('a'); a.href = url; a.download = 'natal-blueprint.png'; document.body.appendChild(a); a.click(); a.remove();
  }

  g.VersorVisuals = { renderNatalClock, renderCentreMap, exportCard };
})(window);
