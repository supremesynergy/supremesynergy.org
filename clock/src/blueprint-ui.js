/* blueprint-ui.js — intake + readout for the HD/Gene Keys natal blueprint.
   Calls Versor.blueprint.computeBlueprint (src/blueprint.js). All computation
   is client-side and offline — birth data never leaves the browser.

   Clickable elements (spheres, activations, type/authority/profile, centres,
   channels) open a self-contained popup explaining the gate.line / concept,
   sourced from window.VersorCodes (src/blueprint-codes.js).

   Interpretive copy is our own, framed in EFL / Polarity grammar. HD/Gene Keys
   are cited only as discreet lineage. No copyrighted interpretive text or
   trademarked artwork is reproduced. */
(function () {
  'use strict';
  const BP = window.Versor && window.Versor.blueprint;
  const C = window.VersorCodes || {};
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const BODY = {
    Sun: ['Sun', '☉'], Earth: ['Earth', '⊕'], Moon: ['Moon', '☽'],
    NorthNode: ['North Node', '☊'], SouthNode: ['South Node', '☋'],
    Mercury: ['Mercury', '☿'], Venus: ['Venus', '♀'], Mars: ['Mars', '♂'],
    Jupiter: ['Jupiter', '♃'], Saturn: ['Saturn', '♄'], Uranus: ['Uranus', '♅'],
    Neptune: ['Neptune', '♆'], Pluto: ['Pluto', '♇'],
  };
  const FAST = new Set(['Sun', 'Earth', 'Moon']); // most time-sensitive placements

  const CENTER_ORDER = ['Head', 'Ajna', 'Throat', 'Self', 'Heart', 'Spleen', 'Sacral', 'SolarPlexus', 'Root'];
  const CENTER_NAME = {
    Head: 'Head', Ajna: 'Ajna', Throat: 'Throat', Self: 'G (Self)', Heart: 'Heart (Ego)',
    Spleen: 'Spleen', Sacral: 'Sacral', SolarPlexus: 'Solar Plexus', Root: 'Root',
  };

  const TYPE_NOTE = {
    'Manifestor': 'An initiator — built to start things and set them in motion, then let others carry them forward.',
    'Generator': 'A builder — sustainable life-force energy for work you genuinely respond to.',
    'Manifesting Generator': 'A multi-passionate builder — fast and non-linear, made to both initiate and produce.',
    'Projector': 'A guide — designed to see people and systems clearly and steer energy, once recognised and invited.',
    'Reflector': 'A mirror — rare; you sample and reflect the health of the environment around you.',
  };
  const AUTH_NOTE = {
    'Emotional': 'Wait through your emotional wave — clarity arrives over time, not in the heat of the moment.',
    'Sacral': 'Trust the gut response — the immediate yes/no of your life-force centre.',
    'Splenic': 'Trust the quiet, in-the-moment intuitive knowing of the body.',
    'Ego': 'Trust what your willpower and heart genuinely want and can commit to.',
    'Self-Projected': 'Truth emerges as you talk it out and hear your own voice.',
    'Mental (Environmental)': 'No fixed inner authority — think out loud with trusted people, in the right environments.',
    'Lunar': 'Let a full lunar cycle (~28 days) pass before major decisions.',
  };

  // ── intake ────────────────────────────────────────────────────────────────
  function populateZones() {
    try {
      const zones = (Intl.supportedValuesOf && Intl.supportedValuesOf('timeZone')) || [];
      $('zones').innerHTML = zones.map((z) => `<option value="${esc(z)}"></option>`).join('');
    } catch (e) { /* datalist optional */ }
  }
  function loadSaved() {
    try {
      const s = JSON.parse(localStorage.getItem('vc_blueprint') || '{}');
      if (s.date) $('bp-date').value = s.date;
      if (s.time) $('bp-time').value = s.time;
      if (typeof s.timeKnown === 'boolean') { $('bp-unknown').checked = !s.timeKnown; toggleTime(); }
      if (s.zone) $('bp-zone').value = s.zone;
    } catch (e) { /* ignore */ }
    if (!$('bp-zone').value) {
      try { $('bp-zone').value = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {}
    }
  }
  function save(input) { try { localStorage.setItem('vc_blueprint', JSON.stringify(input)); } catch (e) {} }
  function toggleTime() {
    const unknown = $('bp-unknown').checked;
    $('bp-time').disabled = unknown;
    $('bp-time').required = !unknown;
    $('bp-time-note').hidden = !unknown;
  }

  // ── render ──────────────────────────────────────────────────────────────
  function actsTable(title, acts, srcLabel, unknownTime) {
    const rows = acts.map((a) => {
      const [name, glyph] = BODY[a.body] || [a.body, '•'];
      const approx = unknownTime && FAST.has(a.body);
      return `<tr class="bp-clk" data-pop="act" data-body="${a.body}" data-src="${esc(srcLabel)}" data-gate="${a.gate}" data-line="${a.line}"${approx ? ' data-approx="1"' : ''}>
        <td class="bp-g">${glyph}</td><td>${esc(name)}</td>
        <td class="bp-code">${a.gate}.${a.line}${approx ? ' <span class="bp-q">?</span>' : ''}</td></tr>`;
    }).join('');
    return `<div class="bp-actcol"><h4>${esc(title)}</h4><table class="bp-acttable">${rows}</table></div>`;
  }

  function spheresBlock(spheres, unknownTime) {
    const groups = { Activation: [], Venus: [], Pearl: [] };
    spheres.forEach((s) => (groups[s.sequence] || (groups[s.sequence] = [])).push(s));
    const label = { Activation: 'Activation Sequence', Venus: 'Venus Sequence', Pearl: 'Pearl Sequence' };
    return Object.keys(groups).map((seq) => {
      const items = groups[seq].map((s) => {
        const approx = unknownTime && FAST.has(s.body);
        return `<div class="bp-sphere bp-clk" data-pop="sphere" data-key="${esc(s.key)}" data-gate="${s.gate}" data-line="${s.line}">
          <div class="bp-sphere-top"><b>${esc(s.name)}</b><span class="bp-code">${s.gate}.${s.line}${approx ? ' <span class="bp-q">?</span>' : ''}</span></div>
          <small>${esc(s.blurb)}</small></div>`;
      }).join('');
      return `<div class="bp-seq"><h4>${esc(label[seq] || seq)}</h4><div class="bp-spheres">${items}</div></div>`;
    }).join('');
  }

  function render(bp, meta) {
    const hd = bp.hd;
    const defined = new Set(hd.definedCenters);
    const centers = CENTER_ORDER.map((c) =>
      `<span class="bp-center bp-clk ${defined.has(c) ? 'on' : 'off'}" data-pop="center" data-c="${c}" data-on="${defined.has(c) ? 1 : 0}">${esc(CENTER_NAME[c])}</span>`).join('');
    const channels = hd.activeChannels.length
      ? hd.activeChannels.map((c) => `<span class="bp-chan bp-clk" data-pop="channel" data-ch="${esc(c)}">${esc(c)}</span>`).join('')
      : '<span class="bp-dim">none defined (open circuitry)</span>';

    const pLine = hd.profile.split('/')[0], dLine = hd.profile.split('/')[1];
    const unknownTime = !meta.timeKnown;

    $('bp-result').innerHTML = `
      <p class="bp-hint">Tip — tap any highlighted item (sphere, activation, type, centre, channel) for a plain-language explanation.</p>

      <div class="bp-summary panel">
        <div class="bp-stats">
          <div class="bp-stat bp-clk" data-pop="type" data-val="${esc(hd.type)}"><span class="micro">Energy Type</span><b>${esc(hd.type)}</b><small>${esc(TYPE_NOTE[hd.type] || '')}</small></div>
          <div class="bp-stat bp-clk" data-pop="authority" data-val="${esc(hd.authority)}"><span class="micro">Inner Authority</span><b>${esc(hd.authority)}</b><small>${esc(AUTH_NOTE[hd.authority] || '')}</small></div>
          <div class="bp-stat bp-clk" data-pop="profile" data-val="${esc(hd.profile)}"><span class="micro">Profile</span><b>${esc(hd.profile)}</b><small>Line ${esc(pLine)} conscious · Line ${esc(dLine)} unconscious — the two faces of your feedback loop.</small></div>
        </div>
        <div class="bp-centers-wrap">
          <span class="micro">Centres (defined = lit)</span>
          <div class="bp-centers">${centers}</div>
        </div>
        <div class="bp-channels-wrap">
          <span class="micro">Active Channels</span>
          <div class="bp-channels">${channels}</div>
        </div>
      </div>

      <div class="bp-grammar panel">
        <h3>How to read this — in our grammar</h3>
        <p>This is a <b>map, not a verdict</b>. <b>Personality</b> (your birth-moment placements) is the conscious, awareness side of your <b>Energetic Feedback Loop</b> — the part you can see and steer. <b>Design</b> (the placements ~88° of solar arc earlier) is the unconscious, regulation side that runs beneath choosing. Each gate's <b>Shadow → Gift → Siddhi</b> is one rung of the <b>Polarity</b> spectrum: the same theme as fear, as balanced power, or as its highest octave. Hold every line as a hypothesis to <b>test against lived experience</b> — your life is the territory; this is only the map.</p>
      </div>

      <div class="bp-acts panel">
        <h3>The thirteen activations</h3>
        <div class="bp-actgrid">
          ${actsTable('Personality · conscious', hd.personalityActivations, 'Personality', unknownTime)}
          ${actsTable('Design · unconscious', hd.designActivations, 'Design', unknownTime)}
        </div>
      </div>

      <div class="bp-spheres-panel panel">
        <h3>Hologenetic profile · 11 spheres</h3>
        ${spheresBlock(bp.spheres, unknownTime)}
      </div>

      <div class="bp-prov">
        ${unknownTime ? '<p class="bp-warn">Birth time unknown — estimated at noon. Placements marked <span class="bp-q">?</span> (Sun · Earth · Moon and all <b>lines</b>) may be off; treat them as approximate.</p>' : ''}
        <p><b>Birth (UTC):</b> ${esc(bp.birthUtc)} &nbsp;·&nbsp; <b>Design (UTC):</b> ${esc(bp.designUtc)}</p>
        <p class="bp-dim">Computed offline in your browser from real ephemeris — your birth data stays on your device (your last entry is saved locally for convenience) and is never sent anywhere. Informed by Human Design &amp; Gene Keys (a discreet lineage); all interpretation is our own — a symbolic, hypothesis-generating mirror, not medical, psychological, or predictive advice.</p>
      </div>`;

    $('bp-result').hidden = false;
    $('bp-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── popup ──────────────────────────────────────────────────────────────
  function gateBlock(g) {
    const gate = C.GATES && C.GATES[g];
    if (!gate) return `<div class="bp-pop-sec"><div class="bp-pop-h">Gate ${esc(g)}</div></div>`;
    return `<div class="bp-pop-sec">
      <div class="bp-pop-h">Gate ${esc(g)} · ${esc(gate.name)}</div>
      <p class="bp-pop-e">${esc(gate.essence)}</p>
      <div class="bp-sgs">
        <div class="bp-sgs-row"><span>Shadow</span><em>${esc(gate.shadow)}</em></div>
        <div class="bp-sgs-row"><span>Gift</span><em>${esc(gate.gift)}</em></div>
        <div class="bp-sgs-row"><span>Siddhi</span><em>${esc(gate.siddhi)}</em></div>
      </div></div>`;
  }
  function lineBlock(l) {
    const line = C.LINES && C.LINES[l];
    if (!line) return '';
    return `<div class="bp-pop-sec"><div class="bp-pop-h">Line ${esc(l)} · ${esc(line.name)}</div><p>${esc(line.theme)}</p></div>`;
  }
  function frameNote() { return C.FRAME ? `<p class="bp-pop-frame">${esc(C.FRAME)}</p>` : ''; }

  function buildPopup(ds) {
    const g = ds.gate, l = ds.line;
    if (ds.pop === 'sphere') {
      const sphere = (BP.SPHERES || []).find((s) => s.key === ds.key) || { name: ds.key, blurb: '' };
      return {
        title: `${sphere.name} · ${g}.${l}`,
        body: `<p class="bp-pop-lead">${esc(sphere.blurb)}</p>${gateBlock(g)}${lineBlock(l)}${frameNote()}`,
      };
    }
    if (ds.pop === 'act') {
      const [name] = BODY[ds.body] || [ds.body];
      const role = (C.BODY_ROLE && C.BODY_ROLE[ds.body]) || '';
      return {
        title: `${name} · ${g}.${l}`,
        body: `<p class="bp-pop-tag">${esc(ds.src)}</p><p class="bp-pop-lead">${esc(role)}</p>${gateBlock(g)}${lineBlock(l)}${frameNote()}`,
      };
    }
    if (ds.pop === 'type') {
      const t = (C.TYPES && C.TYPES[ds.val]) || {};
      return {
        title: `Energy Type · ${ds.val}`,
        body: `<p class="bp-pop-lead">${esc(TYPE_NOTE[ds.val] || '')}</p>
          <div class="bp-pop-sec"><div class="bp-pop-h">Strategy</div><p>${esc(t.strategy || '')}</p></div>
          <div class="bp-pop-sec"><div class="bp-pop-h">Aura</div><p>${esc(t.aura || '')}</p></div>
          <div class="bp-pop-sec"><div class="bp-pop-h">Signpost</div><p>${esc(t.signpost || '')}</p></div>`,
      };
    }
    if (ds.pop === 'authority') {
      return { title: `Inner Authority · ${ds.val}`, body: `<p class="bp-pop-lead">${esc((C.AUTHORITIES && C.AUTHORITIES[ds.val]) || AUTH_NOTE[ds.val] || '')}</p>` };
    }
    if (ds.pop === 'profile') {
      const [a, b] = ds.val.split('/');
      return {
        title: `Profile · ${ds.val}`,
        body: `<p class="bp-pop-lead">Your two profile lines are the two faces of your feedback loop: the first you wear consciously; the second runs beneath, met by others before you notice it.</p>
          <div class="bp-pop-sec"><div class="bp-pop-h">Line ${esc(a)} · conscious</div><p>${esc((C.LINES && C.LINES[a] && C.LINES[a].theme) || '')}</p></div>
          <div class="bp-pop-sec"><div class="bp-pop-h">Line ${esc(b)} · unconscious</div><p>${esc((C.LINES && C.LINES[b] && C.LINES[b].theme) || '')}</p></div>`,
      };
    }
    if (ds.pop === 'center') {
      const ctr = (C.CENTERS && C.CENTERS[ds.c]) || { name: ds.c, theme: '' };
      const state = ds.on === '1'
        ? 'Defined — a consistent, reliable energy you radiate.'
        : 'Open — not fixed; here you take in and amplify others, and grow wise about this theme over time.';
      return { title: `${ctr.name} centre`, body: `<p class="bp-pop-lead">${esc(ctr.theme)}</p><div class="bp-pop-sec"><div class="bp-pop-h">${ds.on === '1' ? 'Defined' : 'Open'}</div><p>${esc(state)}</p></div>` };
    }
    if (ds.pop === 'channel') {
      const [a, b] = ds.ch.split('-');
      const ga = (C.GATES && C.GATES[a]) || {}, gb = (C.GATES && C.GATES[b]) || {};
      return {
        title: `Channel ${ds.ch}`,
        body: `<p class="bp-pop-lead">A defined channel — a consistent circuit linking two gates you reliably express.</p>
          <div class="bp-pop-sec"><div class="bp-pop-h">Gate ${esc(a)} · ${esc(ga.name || '')}</div><p>${esc(ga.essence || '')}</p></div>
          <div class="bp-pop-sec"><div class="bp-pop-h">Gate ${esc(b)} · ${esc(gb.name || '')}</div><p>${esc(gb.essence || '')}</p></div>`,
      };
    }
    return { title: '', body: '' };
  }

  let modal;
  function ensureModal() {
    if (modal) return;
    modal = document.createElement('div');
    modal.className = 'bp-modal';
    modal.innerHTML = `<div class="bp-modal-box" role="dialog" aria-modal="true">
      <button class="bp-modal-x" aria-label="Close">×</button>
      <h3 class="bp-modal-title"></h3>
      <div class="bp-modal-body"></div>
    </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal || e.target.classList.contains('bp-modal-x')) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  }
  function openModal(title, bodyHtml) {
    ensureModal();
    modal.querySelector('.bp-modal-title').textContent = title;
    modal.querySelector('.bp-modal-body').innerHTML = bodyHtml;
    modal.querySelector('.bp-modal-box').scrollTop = 0;
    modal.classList.add('show');
  }
  function closeModal() { if (modal) modal.classList.remove('show'); }

  function onResultClick(e) {
    const el = e.target.closest('[data-pop]');
    if (!el) return;
    const { title, body } = buildPopup(el.dataset);
    if (title) openModal(title, body);
  }

  function onSubmit(e) {
    e.preventDefault();
    const input = {
      date: $('bp-date').value,
      time: $('bp-time').value,
      timeKnown: !$('bp-unknown').checked,
      zone: $('bp-zone').value.trim(),
    };
    $('bp-error').textContent = '';
    const conv = BP.localToUtc(input.date, input.time, input.zone, input.timeKnown);
    if (conv.error) { $('bp-error').textContent = conv.error; return; }
    save(input);
    try { render(BP.computeBlueprint(conv.date), input); }
    catch (err) { $('bp-error').textContent = 'Could not compute the blueprint: ' + err.message; }
  }

  function init() {
    if (!BP) { $('bp-error').textContent = 'Engine failed to load.'; return; }
    populateZones();
    loadSaved();
    toggleTime();
    $('bp-unknown').addEventListener('change', toggleTime);
    $('bp-form').addEventListener('submit', onSubmit);
    $('bp-result').addEventListener('click', onResultClick);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
