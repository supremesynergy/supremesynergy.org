/* compat-ui.js — intake + readout for the two-person compatibility lens.

   Reuses the blueprint engine (Versor.blueprint), the compat computation
   (Versor.compat), the shared interpretive content (VersorCodes), and the
   relational copy (VersorCompatCodes). All computation is client-side and
   offline — birth data never leaves the browser.

   Includes a slim self-contained popup (gate / channel / connection-type) and
   an original combined 9-centre connection map. No copyrighted HD/Gene-Keys
   text or trademarked artwork is reproduced. */
(function () {
  'use strict';
  const BP = window.Versor && window.Versor.blueprint;
  const CMP = window.Versor && window.Versor.compat;
  const VC = window.VersorCodes || {};
  const CC = window.VersorCompatCodes || {};
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const COLORS = { a: '#f5c451', b: '#7fb2e8', em: '#e86fb0', both: '#eef1fa' };

  const CENTER_NAME = {
    Head: 'Head', Ajna: 'Ajna', Throat: 'Throat', Self: 'G (Self)', Heart: 'Heart (Ego)',
    Spleen: 'Spleen', Sacral: 'Sacral', SolarPlexus: 'Solar Plexus', Root: 'Root',
  };
  const CENTRE_POS = {
    Head: [0.5, 0.07], Ajna: [0.5, 0.21], Throat: [0.5, 0.35], Self: [0.5, 0.52],
    Heart: [0.78, 0.45], SolarPlexus: [0.80, 0.64], Spleen: [0.20, 0.62], Sacral: [0.5, 0.71], Root: [0.5, 0.88],
  };

  // ── intake helpers (mirror the blueprint page; those are private to its IIFE) ──
  function populateZones() {
    try {
      const zones = (Intl.supportedValuesOf && Intl.supportedValuesOf('timeZone')) || [];
      const dl = $('zones');
      if (dl) dl.innerHTML = zones.map((z) => `<option value="${esc(z)}"></option>`).join('');
    } catch (e) { /* datalist optional */ }
  }
  function localZone() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return ''; }
  }
  function toggleTime(p) {
    const unknown = $(p + '-unknown').checked;
    $(p + '-time').disabled = unknown;
    $(p + '-time').required = !unknown;
    const note = $(p + '-time-note'); if (note) note.hidden = !unknown;
  }
  function readPerson(p, fallbackName) {
    return {
      name: ($(p + '-name').value || '').trim() || fallbackName,
      date: $(p + '-date').value,
      time: $(p + '-time').value,
      timeKnown: !$(p + '-unknown').checked,
      zone: $(p + '-zone').value.trim(),
    };
  }
  function fillPerson(p, data) {
    if (!data) return;
    if (data.name != null) $(p + '-name').value = data.name;
    if (data.date) $(p + '-date').value = data.date;
    if (data.time) $(p + '-time').value = data.time;
    if (typeof data.timeKnown === 'boolean') { $(p + '-unknown').checked = !data.timeKnown; }
    if (data.zone) $(p + '-zone').value = data.zone;
  }
  function loadSaved() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem('vc_compat') || 'null'); } catch (e) {}
    if (saved && saved.a) { fillPerson('a', saved.a); fillPerson('b', saved.b); }
    else {
      // Prefill Person A from the blueprint page's last entry, if any.
      let bp = null;
      try { bp = JSON.parse(localStorage.getItem('vc_blueprint') || 'null'); } catch (e) {}
      if (bp) fillPerson('a', Object.assign({ name: 'You' }, bp));
    }
    if (!$('a-name').value) $('a-name').value = 'You';
    if (!$('b-name').value) $('b-name').value = 'Friend';
    if (!$('a-zone').value) $('a-zone').value = localZone();
    if (!$('b-zone').value) $('b-zone').value = localZone();
    toggleTime('a'); toggleTime('b');
  }
  function save(aIn, bIn) {
    try { localStorage.setItem('vc_compat', JSON.stringify({ a: aIn, b: bIn })); } catch (e) {}
    // Append to a small roster so a 3rd+ person + picker is a trivial later add.
    try {
      const roster = JSON.parse(localStorage.getItem('vc_people') || '[]');
      [aIn, bIn].forEach((person) => {
        const k = (person.name || '') + '|' + person.date;
        if (!roster.some((r) => (r.name || '') + '|' + r.date === k)) roster.push(person);
      });
      localStorage.setItem('vc_people', JSON.stringify(roster.slice(-50)));
    } catch (e) {}
  }

  // ── small readout helpers ──
  function chan(ch) {
    return `<button type="button" class="cm-chip cm-clk" data-pop="channel" data-ch="${esc(ch.key)}"><b>${esc(ch.name)}</b><span class="cm-chip-code">${esc(ch.key)}</span></button>`;
  }
  function chanList(arr, emptyMsg) {
    if (!arr || !arr.length) return `<p class="cm-empty">${esc(emptyMsg)}</p>`;
    return `<div class="cm-chips">${arr.map(chan).join('')}</div>`;
  }
  function names(a, b) { return { A: esc(a.name), B: esc(b.name) }; }
  function topNames(arr, n) { return (arr || []).slice(0, n).map((c) => c.name); }
  function joinNames(list) {
    if (!list.length) return '';
    if (list.length === 1) return list[0];
    if (list.length === 2) return list[0] + ' and ' + list[1];
    return list.slice(0, -1).join(', ') + ', and ' + list[list.length - 1];
  }

  function centreLine(cell, a, b) {
    const tpl = (CC.CENTRE_CONDITION || {})[cell.kind] || '';
    const theme = (CC.CENTRE_THEME || {})[cell.center] || 'this theme';
    const txt = tpl.replace(/\{A\}/g, esc(a.name)).replace(/\{B\}/g, esc(b.name)).replace(/\{theme\}/g, esc(theme));
    const cname = (VC.CENTERS && VC.CENTERS[cell.center] && VC.CENTERS[cell.center].name) || CENTER_NAME[cell.center] || cell.center;
    const tag = { AtoB: a.name + ' →', BtoA: b.name + ' →', shared: 'shared', open: 'both open' }[cell.kind] || '';
    return `<div class="cm-centre cm-${cell.kind}"><div class="cm-centre-h"><b>${esc(cname)}</b><span class="cm-centre-tag">${esc(tag)}</span></div><p>${txt}</p></div>`;
  }

  // ── render ──
  function render(a, b, compat) {
    const N = names(a, b);
    const counts = compat.counts;
    const tex = compat.texture || { label: '', note: '' };
    const ch = compat.channels;
    const unknown = !a.timeKnown || !b.timeKnown;

    const countItem = (key, count) => {
      const ct = (CC.CONNECTION_TYPES || {})[key] || { name: key };
      return `<button type="button" class="cm-count cm-clk" data-pop="conn" data-type="${key}"><b>${count}</b><span>${esc(ct.name)}</span></button>`;
    };

    // conditioning highlights (who conditions whom) for the practice section
    const cond = (compat.centres || []).filter((c) => c.kind === 'AtoB' || c.kind === 'BtoA');
    const condTop = cond.slice(0, 2).map((c) => {
      const who = c.kind === 'AtoB' ? a.name : b.name;
      const cname = (VC.CENTERS && VC.CENTERS[c.center] && VC.CENTERS[c.center].name) || c.center;
      return `${esc(who)} colours the <b>${esc(cname)}</b>`;
    });

    const emNames = joinNames(topNames(ch.electromagnetic, 3));
    const compNames = joinNames(topNames(ch.companionship, 2));
    const comprNames = joinNames(topNames(ch.compromise, 2));
    const domNames = joinNames(topNames(ch.dominance, 2));

    $('compat-result').innerHTML = `
      <p class="cm-hint">Tip — tap any channel, connection type, or gate for a plain-language explanation.</p>

      ${compat.identical ? '<p class="bp-warn">These two charts are identical — likely the same birth data entered twice. Everything below will read as pure companionship.</p>' : ''}

      <div class="cm-snapshot panel">
        <div class="cm-pair"><span class="cm-name cm-name-a">${N.A}</span><span class="cm-amp">&amp;</span><span class="cm-name cm-name-b">${N.B}</span></div>
        <div class="cm-texture"><b>${esc(tex.label)}</b><small>${esc(tex.note)}</small></div>
        <div class="cm-counts">
          ${countItem('electromagnetic', counts.electromagnetic)}
          ${countItem('companionship', counts.companionship)}
          ${countItem('dominance', counts.dominance)}
          ${countItem('compromise', counts.compromise)}
        </div>
        <div class="cm-map-wrap">
          <canvas id="compat-map" aria-label="Connection map of the two charts"></canvas>
          <p class="cm-legend">
            <span class="cm-dot" style="background:${COLORS.a}"></span> ${N.A}
            <span class="cm-dot" style="background:${COLORS.b}"></span> ${N.B}
            <span class="cm-dot" style="background:${COLORS.em}"></span> spark (together)
            <span class="cm-dot" style="background:${COLORS.both}"></span> shared
          </p>
        </div>
      </div>

      <div class="cm-grammar panel">
        <h3>How to read this</h3>
        <p>Each <b>channel</b> the two of you form is one of four kinds. <b>Electromagnetic</b> is the spark — neither of you has it alone, it switches on between you. <b>Companionship</b> is where you’re alike. <b>Dominance</b> is where one of you carries a theme the other simply learns. <b>Compromise</b> is a half-shared circuit — the richest growth edge. ${esc((CC.RELATIONAL_FRAME) || '')}</p>
      </div>

      <div class="cm-section panel">
        <h3>✦ What lights up between you</h3>
        <p class="cm-sub">Electromagnetic — circuits neither of you carries alone, alive only together. The spark, and the heat.</p>
        ${chanList(ch.electromagnetic, 'No electromagnetic channels — your connection isn’t built on completing each other’s circuitry. Look to your types, centres and shared gates below.')}
      </div>

      <div class="cm-trio">
        <div class="cm-section panel">
          <h3>≈ Where you’re alike</h3>
          <p class="cm-sub">Companionship — you both carry these fully. Easy recognition; possible shared blind spots.</p>
          ${chanList(ch.companionship, 'No fully-shared channels.')}
        </div>
        <div class="cm-section panel">
          <h3>↗ Where one leads</h3>
          <p class="cm-sub">Dominance — one of you carries the whole circuit, the other learns it. Name it out loud.</p>
          ${dominanceList(ch.dominance, a, b)}
        </div>
        <div class="cm-section panel">
          <h3>△ Your growth edges</h3>
          <p class="cm-sub">Compromise — one carries it, the other holds one end. Rich, and easy to chafe on.</p>
          ${compromiseList(ch.compromise, a, b)}
        </div>
      </div>

      <div class="cm-section panel">
        <h3>Centres — who colours whom</h3>
        <div class="cm-centres">${(compat.centres || []).map((c) => centreLine(c, a, b)).join('')}</div>
      </div>

      <div class="cm-practice panel">
        <h3>Together, in practice</h3>
        <div class="cm-practice-grid">
          <div class="cm-prac"><span class="micro">Decide together</span><p>${esc(compat.authorityProtocol.text || '')}</p></div>
          <div class="cm-prac"><span class="micro">Move together</span><p>${esc(compat.typePair.note || '')}</p></div>
          <div class="cm-prac"><span class="micro">Your rhythms</span><p>${esc(compat.profileNote.text || '')}</p></div>
          ${emNames ? `<div class="cm-prac"><span class="micro">Lean into</span><p>The spark of <b>${esc(emNames)}</b> — these come alive when you’re together.</p></div>`
            : compNames ? `<div class="cm-prac"><span class="micro">Lean into</span><p>Your shared ease in <b>${esc(compNames)}</b> — familiar ground to build on.</p></div>` : ''}
          ${comprNames ? `<div class="cm-prac"><span class="micro">Your growth edge</span><p>Go gently around <b>${esc(comprNames)}</b> — half-shared circuits where you’ll grow, and grate.</p></div>` : ''}
          ${domNames ? `<div class="cm-prac"><span class="micro">Where one leads</span><p>One of you carries <b>${esc(domNames)}</b> outright — name it out loud so it stays generative, not lopsided.</p></div>` : ''}
          ${condTop.length ? `<div class="cm-prac"><span class="micro">Notice</span><p>${condTop.join('; ')} — be aware you each pull the other there.</p></div>` : ''}
        </div>
      </div>

      <div class="bp-prov">
        ${unknown ? `<p class="bp-warn">Birth time ${a.timeKnown ? '' : '(' + N.A + ') '}${b.timeKnown ? '' : '(' + N.B + ') '}unknown — estimated at noon. The fast Sun / Earth / Moon placements and all <b>lines</b> are approximate, so some channel connections here may shift with an exact time.</p>` : ''}
        <p class="bp-dim">Both charts are computed offline in your browser from real ephemeris — neither person’s birth data is ever sent anywhere (your last pair is saved locally for convenience). Informed by Human Design &amp; Gene Keys (a discreet lineage); all interpretation is our own — a symbolic, hypothesis-generating mirror, <b>not</b> medical, psychological, or relationship advice.</p>
      </div>`;

    $('compat-result').hidden = false;
    try { renderConnectionMap($('compat-map'), compat, a, b); } catch (e) { /* canvas optional */ }
    $('compat-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function dominanceList(arr, a, b) {
    if (!arr || !arr.length) return '<p class="cm-empty">No dominance channels.</p>';
    return '<div class="cm-chips">' + arr.map((c) => {
      const who = c.leader === 'A' ? a.name : b.name;
      return `<button type="button" class="cm-chip cm-clk" data-pop="channel" data-ch="${esc(c.key)}"><b>${esc(c.name)}</b><span class="cm-chip-code">${esc(who)} carries</span></button>`;
    }).join('') + '</div>';
  }
  function compromiseList(arr, a, b) {
    if (!arr || !arr.length) return '<p class="cm-empty">No compromise channels.</p>';
    return '<div class="cm-chips">' + arr.map((c) => {
      const who = c.leader === 'A' ? a.name : b.name;
      return `<button type="button" class="cm-chip cm-clk" data-pop="channel" data-ch="${esc(c.key)}"><b>${esc(c.name)}</b><span class="cm-chip-code">${esc(who)} carries · gate ${esc(c.adapterGate)} shared</span></button>`;
    }).join('') + '</div>';
  }

  // ── popup (gate / channel / connection-type), reusing the blueprint modal CSS ──
  function gateBlock(g) {
    const gate = VC.GATES && VC.GATES[g];
    if (!gate) return `<div class="bp-pop-sec"><div class="bp-pop-h">Gate ${esc(g)}</div></div>`;
    const hex = String.fromCodePoint(0x4DC0 + (Number(g) - 1));
    return `<div class="bp-pop-sec">
      <div class="bp-pop-gatehead"><span class="bp-hex">${hex}</span><div class="bp-pop-gatehead-t"><div class="bp-pop-h">Gate ${esc(g)} · ${esc(gate.name)}</div><p class="bp-pop-e">${esc(gate.essence)}</p></div></div>
      <div class="bp-sgs">
        <div class="bp-sgs-row"><span>Shadow</span><em>${esc(gate.shadow)}</em></div>
        <div class="bp-sgs-row"><span>Gift</span><em>${esc(gate.gift)}</em></div>
        <div class="bp-sgs-row"><span>Siddhi</span><em>${esc(gate.siddhi)}</em></div>
      </div></div>`;
  }
  function buildPopup(ds) {
    if (ds.pop === 'channel') {
      const key = ds.ch;
      const info = (VC.CHANNEL_INFO && VC.CHANNEL_INFO[key]) || {};
      const parts = key.split('-');
      return {
        title: `Channel ${esc(key)}${info.name ? ' · ' + esc(info.name) : ''}`,
        body: `<p class="bp-pop-lead">${esc(info.detail || 'A channel linking two gates.')}</p>${gateBlock(parts[0])}${gateBlock(parts[1])}`,
      };
    }
    if (ds.pop === 'conn') {
      const ct = (CC.CONNECTION_TYPES || {})[ds.type] || { name: ds.type, detail: '' };
      return { title: `${esc(ct.name)} connection`, body: `<p class="bp-pop-lead">${esc(ct.gloss || '')}</p><div class="bp-pop-sec"><p>${esc(ct.detail || '')}</p></div>` };
    }
    if (ds.pop === 'gate') return { title: `Gate ${esc(ds.g)}`, body: gateBlock(ds.g) };
    return { title: '', body: '' };
  }
  let modal;
  function ensureModal() {
    if (modal) return;
    modal = document.createElement('div');
    modal.className = 'bp-modal';
    modal.innerHTML = `<div class="bp-modal-box" role="dialog" aria-modal="true"><button class="bp-modal-x" aria-label="Close">×</button><h3 class="bp-modal-title"></h3><div class="bp-modal-body"></div></div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal || e.target.classList.contains('bp-modal-x')) modal.classList.remove('show'); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal) modal.classList.remove('show'); });
  }
  function openModal(title, bodyHtml) {
    ensureModal();
    modal.querySelector('.bp-modal-title').textContent = title;
    modal.querySelector('.bp-modal-body').innerHTML = bodyHtml;
    modal.querySelector('.bp-modal-box').scrollTop = 0;
    modal.classList.add('show');
  }
  function onResultClick(e) {
    const el = e.target.closest('[data-pop]');
    if (!el) return;
    const { title, body } = buildPopup(el.dataset);
    if (title) openModal(title, body);
  }

  // ── combined 9-centre connection map ──
  function renderConnectionMap(canvas, compat, a, b) {
    if (!canvas) return;
    const wrap = canvas.parentElement;
    const cssW = Math.max(260, Math.min(wrap ? wrap.clientWidth : 420, 460));
    const cssH = Math.round(cssW * 1.12);
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px';
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
    const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, cssW, cssH);

    const GC = (BP && BP.GATE_CENTER) || {};
    const P = (c) => [CENTRE_POS[c][0] * cssW, CENTRE_POS[c][1] * cssH];
    const da = new Set((a.bp ? a.bp.hd.definedCenters : []) || []);
    const db = new Set((b.bp ? b.bp.hd.definedCenters : []) || []);

    const drawChannels = (arr, color, dash) => {
      (arr || []).forEach((cobj) => {
        const ca = GC[cobj.gates[0]], cb = GC[cobj.gates[1]];
        if (!ca || !cb || ca === cb) return;
        const [x1, y1] = P(ca), [x2, y2] = P(cb);
        // small deterministic perpendicular offset so parallels don't fully hide
        const off = (((cobj.gates[0] * 7 + cobj.gates[1]) % 3) - 1) * 3;
        const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
        const ox = (-dy / len) * off, oy = (dx / len) * off;
        ctx.save();
        ctx.beginPath(); ctx.moveTo(x1 + ox, y1 + oy); ctx.lineTo(x2 + ox, y2 + oy);
        ctx.strokeStyle = color; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
        if (dash) ctx.setLineDash([5, 4]);
        ctx.globalAlpha = 0.85; ctx.stroke();
        ctx.restore();
      });
    };
    // draw order: shared + carried beneath, spark on top
    drawChannels(compat.channels.companionship, COLORS.both, false);
    drawChannels(compat.channels.dominance.filter((c) => c.leader === 'A'), COLORS.a, false);
    drawChannels(compat.channels.dominance.filter((c) => c.leader === 'B'), COLORS.b, false);
    drawChannels(compat.channels.compromise.filter((c) => c.leader === 'A'), COLORS.a, true);
    drawChannels(compat.channels.compromise.filter((c) => c.leader === 'B'), COLORS.b, true);
    drawChannels(compat.channels.electromagnetic, COLORS.em, false);

    const r = cssW * 0.062;
    Object.keys(CENTRE_POS).forEach((c) => {
      const [x, y] = P(c); const aOn = da.has(c), bOn = db.has(c);
      // left half = A, right half = B
      if (aOn) { ctx.beginPath(); ctx.moveTo(x, y - r); ctx.arc(x, y, r, -Math.PI / 2, Math.PI / 2, true); ctx.closePath(); ctx.fillStyle = 'rgba(245,196,81,0.28)'; ctx.fill(); }
      if (bOn) { ctx.beginPath(); ctx.moveTo(x, y - r); ctx.arc(x, y, r, -Math.PI / 2, Math.PI / 2, false); ctx.closePath(); ctx.fillStyle = 'rgba(127,178,232,0.28)'; ctx.fill(); }
      ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.strokeStyle = (aOn && bOn) ? COLORS.both : aOn ? COLORS.a : bOn ? COLORS.b : 'rgba(255,255,255,0.18)';
      ctx.lineWidth = (aOn || bOn) ? 1.8 : 1; ctx.stroke();
      ctx.fillStyle = (aOn || bOn) ? '#fff' : 'rgba(180,186,210,0.6)';
      ctx.font = `${Math.round(cssW * 0.03)}px system-ui,-apple-system,'Segoe UI',Roboto,sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const lab = c === 'Self' ? 'G' : c === 'SolarPlexus' ? 'SP' : c;
      ctx.fillText(lab.length > 6 ? lab.slice(0, 5) : lab, x, y);
    });
  }

  // ── submit ──
  function onSubmit(e) {
    e.preventDefault();
    $('compat-error').textContent = '';
    if (!BP || !CMP) { $('compat-error').textContent = 'Engine failed to load.'; return; }
    const aIn = readPerson('a', 'You');
    const bIn = readPerson('b', 'Friend');

    const convA = BP.localToUtc(aIn.date, aIn.time, aIn.zone, aIn.timeKnown);
    if (convA.error) { $('compat-error').textContent = N(aIn) + ': ' + convA.error; return; }
    const convB = BP.localToUtc(bIn.date, bIn.time, bIn.zone, bIn.timeKnown);
    if (convB.error) { $('compat-error').textContent = N(bIn) + ': ' + convB.error; return; }

    try {
      const a = { name: aIn.name, timeKnown: aIn.timeKnown, bp: BP.computeBlueprint(convA.date) };
      const b = { name: bIn.name, timeKnown: bIn.timeKnown, bp: BP.computeBlueprint(convB.date) };
      const compat = CMP.computeCompatibility(a.bp, b.bp);
      save(aIn, bIn);
      render(a, b, compat);
    } catch (err) {
      $('compat-error').textContent = 'Could not compute compatibility: ' + err.message;
    }
  }
  function N(p) { return p.name || 'Person'; }

  function init() {
    if (!BP || !CMP) { const er = $('compat-error'); if (er) er.textContent = 'Engine failed to load.'; return; }
    populateZones();
    loadSaved();
    $('a-unknown').addEventListener('change', () => toggleTime('a'));
    $('b-unknown').addEventListener('change', () => toggleTime('b'));
    $('compat-form').addEventListener('submit', onSubmit);
    $('compat-result').addEventListener('click', onResultClick);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
