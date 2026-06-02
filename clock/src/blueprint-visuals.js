/* blueprint-visuals.js — canvas diagrams for the natal blueprint.

   - renderNatalClock(canvas, bp): the 3·7·12 versor dial frozen at birth —
     zodiac ring + 64-gate ring + the 26 activations (Personality / Design) +
     birth moon-phase & versor quadrant at centre. Our own rendering (matches
     the live clock's look); no third-party artwork.
   - renderCentreMap(canvas, hd): an ORIGINAL 9-centre network diagram with the
     active channels drawn between defined centres (NOT the Rave BodyGraph™).
   - exportCard(bp): composite the clock + summary to a PNG for download/share.

   Depends on window.Versor.blueprint (engine constants) + window.Astronomy. */
(function (g) {
  'use strict';
  const BP = (window.Versor && window.Versor.blueprint) || {};
  const A = window.Astronomy;
  const DEG = Math.PI / 180;
  const SERIF = "'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif";
  const SANS = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
  const norm360 = (x) => (((x % 360) + 360) % 360);

  const SIGNS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
  const SIGN_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const BODY_GLYPH = { Sun: '☉', Earth: '⊕', Moon: '☽', NorthNode: '☊', SouthNode: '☋', Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇' };
  const BODY_NAME = { Sun: 'Sun', Earth: 'Earth', Moon: 'Moon', NorthNode: 'North Node', SouthNode: 'South Node', Mercury: 'Mercury', Venus: 'Venus', Mars: 'Mars', Jupiter: 'Jupiter', Saturn: 'Saturn', Uranus: 'Uranus', Neptune: 'Neptune', Pluto: 'Pluto' };
  const PERSON = '#f5c451', DESIGN = '#7fb2e8';
  const GATE_SEQ = BP.GATE_SEQUENCE || [];
  const HD_START = BP.HD_START_DEG != null ? BP.HD_START_DEG : 358.25;
  const GSIZE = BP.GATE_SIZE || 5.625;

  const ptFor = (cx, cy, lon, r) => { const a = (lon - 90) * DEG; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };

  function starfield(ctx, w, seed) {
    let s = seed || 7;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < Math.round(w * 0.4); i++) {
      ctx.globalAlpha = rnd() * 0.5 + 0.12;
      ctx.beginPath(); ctx.arc(rnd() * w, rnd() * w, rnd() * 1.1 + 0.2, 0, 2 * Math.PI);
      ctx.fillStyle = '#cdd6ef'; ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawMoonDisc(ctx, x, y, r, illum, waxing) {
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fillStyle = '#161a2a'; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.clip();
    if (!waxing) { ctx.translate(x, y); ctx.scale(-1, 1); ctx.translate(-x, -y); }
    const k = 1 - 2 * illum;
    ctx.fillStyle = '#e9edf7';
    ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, Math.PI / 2, false);
    ctx.ellipse(x, y, Math.abs(k) * r, r, 0, Math.PI / 2, -Math.PI / 2, k > 0);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.strokeStyle = 'rgba(207,214,230,0.4)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }

  // Core dial drawing into any ctx/region. Returns hotspots [{x,y,r,title,sub}].
  function drawClock(ctx, cx, cy, R, bp, opts) {
    opts = opts || {};
    const hs = [];
    const lbl = (text, lon, r, color, px, font) => {
      const [x, y] = ptFor(cx, cy, lon, r);
      ctx.fillStyle = color; ctx.font = `${px}px ${font || SANS}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y);
    };

    // background
    const bgrad = ctx.createRadialGradient(cx, cy, R * 0.08, cx, cy, R * 1.1);
    bgrad.addColorStop(0, '#171b33'); bgrad.addColorStop(1, '#0a0b16');
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R * 1.04, 0, 2 * Math.PI); ctx.clip();
    ctx.fillStyle = bgrad; ctx.fillRect(cx - R * 1.1, cy - R * 1.1, R * 2.2, R * 2.2);
    starfield(ctx, R * 2.2, 11);
    ctx.restore();

    const birth = new Date(bp.birthUtc);

    // ── outer ring: 12 zodiac signs ──
    const sunLon = (bp.hd.personalityActivations.find((a) => a.body === 'Sun') || {}).longitude;
    const sunSign = sunLon != null ? Math.floor(norm360(sunLon) / 30) % 12 : -1;
    if (sunSign >= 0) { ctx.beginPath(); ctx.arc(cx, cy, R * 0.995, (sunSign * 30 - 90) * DEG, ((sunSign + 1) * 30 - 90) * DEG); ctx.arc(cx, cy, R * 0.90, ((sunSign + 1) * 30 - 90) * DEG, (sunSign * 30 - 90) * DEG, true); ctx.closePath(); ctx.fillStyle = 'rgba(245,196,81,0.10)'; ctx.fill(); }
    for (let i = 0; i < 12; i++) {
      const [x1, y1] = ptFor(cx, cy, i * 30, R * 0.90), [x2, y2] = ptFor(cx, cy, i * 30, R * 0.995);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1; ctx.stroke();
      lbl(SIGNS[i], i * 30 + 15, R * 0.95, i === sunSign ? PERSON : 'rgba(225,230,245,0.66)', Math.round(R * 0.045), SERIF);
    }
    [0.90, 0.995].forEach((f) => { ctx.beginPath(); ctx.arc(cx, cy, R * f, 0, 2 * Math.PI); ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 1; ctx.stroke(); });

    // ── gate ring: 64 gates by ecliptic degree ──
    const allGates = new Set([...bp.hd.personalityActivations.map((a) => a.gate), ...bp.hd.designActivations.map((a) => a.gate)]);
    const gIn = R * 0.74, gOut = R * 0.88;
    [gIn, gOut].forEach((f) => { ctx.beginPath(); ctx.arc(cx, cy, f, 0, 2 * Math.PI); ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1; ctx.stroke(); });
    for (let i = 0; i < 64; i++) {
      const lon0 = HD_START + i * GSIZE;
      const [tx0, ty0] = ptFor(cx, cy, lon0, gIn), [tx1, ty1] = ptFor(cx, cy, lon0, gOut);
      ctx.beginPath(); ctx.moveTo(tx0, ty0); ctx.lineTo(tx1, ty1); ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1; ctx.stroke();
      const gate = GATE_SEQ[i];
      const on = allGates.has(gate);
      const [gx, gy] = ptFor(cx, cy, lon0 + GSIZE / 2, (gIn + gOut) / 2);
      if (on) { ctx.beginPath(); ctx.arc(gx, gy, R * 0.028, 0, 2 * Math.PI); ctx.fillStyle = 'rgba(245,196,81,0.14)'; ctx.fill(); }
      lbl(String(gate), lon0 + GSIZE / 2, (gIn + gOut) / 2, on ? '#f5c451' : 'rgba(180,186,210,0.45)', Math.round(R * 0.026), SANS);
      hs.push({ x: gx, y: gy, r: R * 0.03, title: `Gate ${gate}`, sub: on ? 'Activated in your chart' : 'Not activated' });
    }

    // ── activation markers: Personality (inner) + Design (outer band) ──
    function plotBand(acts, baseR, color, srcLabel) {
      const items = acts.map((a) => ({ ...a })).sort((x, y) => x.longitude - y.longitude);
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
        hs.push({ x, y, r: R * 0.05, title: `${BODY_GLYPH[b.body] || ''} ${BODY_NAME[b.body] || b.body} · ${b.gate}.${b.line}`, sub: srcLabel });
      });
    }
    plotBand(bp.hd.personalityActivations, R * 0.64, PERSON, 'Personality · conscious');
    plotBand(bp.hd.designActivations, R * 0.50, DESIGN, 'Design · unconscious');

    // ── centre: birth moon phase + versor quadrant ──
    let illum = 0.5, waxing = true, phaseName = 'Moon', quadOp = '';
    if (A) {
      const ph = norm360(A.MoonPhase(birth));
      illum = (1 - Math.cos(ph * DEG)) / 2; waxing = ph < 180;
      const quad = Math.round(ph / 90) % 4;
      quadOp = ['j⁰ New', 'j¹ First Qtr', 'j² Full', 'j³ Last Qtr'][quad];
      const names = ['New', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
      phaseName = names[Math.floor(((ph + 22.5) % 360) / 45)];
    }
    drawMoonDisc(ctx, cx, cy, R * 0.16, illum, waxing);
    hs.push({ x: cx, y: cy, r: R * 0.16, title: `${phaseName} Moon at birth`, sub: `${Math.round(illum * 100)}% lit · versor ${quadOp}` });

    return hs;
  }

  // ── on-page natal clock + hover tooltips ──
  let tipEl;
  function ensureTip() {
    if (tipEl) return tipEl;
    tipEl = document.createElement('div'); tipEl.className = 'bp-canvas-tip';
    document.body.appendChild(tipEl); return tipEl;
  }
  function attachTips(canvas, getHotspots, getSize) {
    const tip = ensureTip();
    const xy = (e) => { const rect = canvas.getBoundingClientRect(); const s = rect.width ? getSize() / rect.width : 1; return [(e.clientX - rect.left) * s, (e.clientY - rect.top) * s, rect]; };
    const hit = (mx, my) => { let best = null, bd = Infinity; for (const h of getHotspots()) { const d = Math.hypot(mx - h.x, my - h.y); if (d < h.r && d < bd) { bd = d; best = h; } } return best; };
    const move = (e) => {
      const [mx, my, rect] = xy(e); const h = hit(mx, my);
      if (h) { tip.innerHTML = `<b>${h.title}</b>${h.sub ? `<span>${h.sub}</span>` : ''}`; tip.style.left = (rect.left + window.scrollX + (h.x / (getSize() / rect.width))) + 'px'; tip.style.top = (rect.top + window.scrollY + (h.y / (getSize() / rect.width)) - 14) + 'px'; tip.classList.add('show'); canvas.style.cursor = 'pointer'; }
      else { tip.classList.remove('show'); canvas.style.cursor = 'default'; }
    };
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseleave', () => tip.classList.remove('show'));
    canvas.addEventListener('click', move);
  }

  function sizeCanvas(canvas, css) {
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = css + 'px'; canvas.style.height = css + 'px';
    canvas.width = Math.round(css * dpr); canvas.height = Math.round(css * dpr);
    const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  function renderNatalClock(canvas, bp) {
    let hotspots = [];
    const draw = () => {
      const wrap = canvas.parentElement;
      const css = Math.max(280, Math.min(wrap ? wrap.clientWidth : 520, 540));
      const ctx = sizeCanvas(canvas, css);
      ctx.clearRect(0, 0, css, css);
      hotspots = drawClock(ctx, css / 2, css / 2, css / 2 - 6, bp, {});
      canvas._css = css;
    };
    draw();
    attachTips(canvas, () => hotspots, () => canvas._css || 520);
    if (!canvas._rz) { canvas._rz = true; window.addEventListener('resize', () => { clearTimeout(canvas._t); canvas._t = setTimeout(draw, 150); }); }
  }

  // ── original 9-centre network map (NOT the Rave BodyGraph) ──
  const CENTRE_POS = {
    Head: [0.5, 0.07], Ajna: [0.5, 0.21], Throat: [0.5, 0.35], Self: [0.5, 0.52],
    Heart: [0.78, 0.45], SolarPlexus: [0.80, 0.64], Spleen: [0.20, 0.62],
    Sacral: [0.5, 0.71], Root: [0.5, 0.88],
  };
  const CENTRE_LABEL = { Head: 'Head', Ajna: 'Ajna', Throat: 'Throat', Self: 'G', Heart: 'Heart', SolarPlexus: 'Solar Plexus', Spleen: 'Spleen', Sacral: 'Sacral', Root: 'Root' };
  const GATE_CENTER = BP.GATE_CENTER || {};

  function renderCentreMap(canvas, hd) {
    const wrap = canvas.parentElement;
    const cssW = Math.max(260, Math.min(wrap ? wrap.clientWidth : 360, 420));
    const cssH = Math.round(cssW * 1.18);
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px';
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
    const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    const defined = new Set(hd.definedCenters);
    const P = (c) => [CENTRE_POS[c][0] * cssW, CENTRE_POS[c][1] * cssH];

    // channels (lines between the centres of each active channel)
    hd.activeChannels.forEach((ch) => {
      const [a, b] = ch.split('-');
      const ca = GATE_CENTER[a], cb = GATE_CENTER[b];
      if (!ca || !cb || ca === cb) return;
      const [x1, y1] = P(ca), [x2, y2] = P(cb);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      ctx.strokeStyle = 'rgba(245,196,81,0.55)'; ctx.lineWidth = 2; ctx.stroke();
    });

    // nodes
    const rNode = cssW * 0.075;
    Object.keys(CENTRE_POS).forEach((c) => {
      const [x, y] = P(c); const on = defined.has(c);
      ctx.beginPath(); ctx.arc(x, y, rNode, 0, 2 * Math.PI);
      ctx.fillStyle = on ? 'rgba(245,196,81,0.18)' : 'rgba(255,255,255,0.03)';
      ctx.fill(); ctx.strokeStyle = on ? '#f5c451' : 'rgba(255,255,255,0.18)';
      ctx.lineWidth = on ? 2 : 1; ctx.stroke();
      ctx.fillStyle = on ? '#fff' : 'rgba(180,186,210,0.6)';
      ctx.font = `${Math.round(cssW * 0.034)}px ${SANS}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const label = CENTRE_LABEL[c];
      if (label.length > 7) { const parts = label.split(' '); ctx.fillText(parts[0], x, y - cssW * 0.018); ctx.fillText(parts[1], x, y + cssW * 0.018); }
      else ctx.fillText(label, x, y);
    });
  }

  // ── shareable PNG card ──
  function exportCard(bp) {
    const W = 1080, H = 1350, dpr = 2;
    const c = document.createElement('canvas'); c.width = W * dpr; c.height = H * dpr;
    const ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // bg
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0b0d1a'); bg.addColorStop(1, '#070811');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    // header
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = `600 56px ${SERIF}`;
    ctx.fillText('Natal Blueprint', W / 2, 96);
    ctx.fillStyle = '#f5c451'; ctx.font = `28px ${SANS}`;
    ctx.fillText(`${bp.hd.type}  ·  ${bp.hd.authority}  ·  Profile ${bp.hd.profile}`, W / 2, 150);
    // clock
    drawClock(ctx, W / 2, 150 + (W * 0.86) / 2 + 40, (W * 0.86) / 2, bp, {});
    // footer
    ctx.fillStyle = 'rgba(231,234,245,0.55)'; ctx.font = `24px ${SANS}`;
    ctx.fillText('supremesynergy.org/clock', W / 2, H - 60);
    ctx.fillStyle = 'rgba(245,196,81,0.85)'; ctx.font = `${SERIF}`; ctx.font = `22px ${SANS}`;
    ctx.fillText('● Personality   ● Design', W / 2, H - 110);
    // download
    const url = c.toDataURL('image/png');
    const a = document.createElement('a'); a.href = url; a.download = 'natal-blueprint.png';
    document.body.appendChild(a); a.click(); a.remove();
  }

  g.VersorVisuals = { renderNatalClock, renderCentreMap, exportCard };
})(window);
