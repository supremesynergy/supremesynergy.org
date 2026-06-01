/* blueprint-ui.js — intake + readout for the HD/Gene Keys natal blueprint.
   Calls Versor.blueprint.computeBlueprint (src/blueprint.js). All computation
   is client-side and offline — birth data never leaves the browser.

   Interpretive copy here is our own, framed in EFL / Polarity grammar.
   HD/Gene Keys are cited only as discreet lineage. No copyrighted
   interpretive text or trademarked artwork is reproduced. */
(function () {
  'use strict';
  const BP = window.Versor && window.Versor.blueprint;
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

  // Our own plain-language notes (not HD/GK canon text).
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
      const dl = $('zones');
      dl.innerHTML = zones.map((z) => `<option value="${esc(z)}"></option>`).join('');
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
  function save(input) {
    try { localStorage.setItem('vc_blueprint', JSON.stringify(input)); } catch (e) {}
  }
  function toggleTime() {
    const unknown = $('bp-unknown').checked;
    $('bp-time').disabled = unknown;
    $('bp-time').required = !unknown;
    $('bp-time-note').hidden = !unknown;
  }

  // ── render ──────────────────────────────────────────────────────────────
  function actsTable(title, acts, unknownTime) {
    const rows = acts.map((a) => {
      const [name, glyph] = BODY[a.body] || [a.body, '•'];
      const approx = unknownTime && FAST.has(a.body);
      return `<tr${approx ? ' class="bp-approx"' : ''}>
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
        return `<div class="bp-sphere${approx ? ' bp-approx' : ''}">
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
      `<span class="bp-center ${defined.has(c) ? 'on' : 'off'}">${esc(CENTER_NAME[c])}</span>`).join('');
    const channels = hd.activeChannels.length
      ? hd.activeChannels.map((c) => `<span class="bp-chan">${esc(c)}</span>`).join('')
      : '<span class="bp-dim">none defined (open circuitry)</span>';

    const pLine = hd.profile.split('/')[0], dLine = hd.profile.split('/')[1];
    const unknownTime = !meta.timeKnown;

    $('bp-result').innerHTML = `
      <div class="bp-summary panel">
        <div class="bp-stats">
          <div class="bp-stat"><span class="micro">Energy Type</span><b>${esc(hd.type)}</b><small>${esc(TYPE_NOTE[hd.type] || '')}</small></div>
          <div class="bp-stat"><span class="micro">Inner Authority</span><b>${esc(hd.authority)}</b><small>${esc(AUTH_NOTE[hd.authority] || '')}</small></div>
          <div class="bp-stat"><span class="micro">Profile</span><b>${esc(hd.profile)}</b><small>Line ${esc(pLine)} conscious · Line ${esc(dLine)} unconscious — the two faces of your feedback loop.</small></div>
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
        <p>This is a <b>map, not a verdict</b>. <b>Personality</b> (your birth-moment placements) is the conscious, awareness side of your <b>Energetic Feedback Loop</b> — the part you can see and steer. <b>Design</b> (the placements ~88° of solar arc earlier) is the unconscious, regulation side that runs beneath choosing. Each Gene Key's <b>Shadow → Gift → Siddhi</b> is one rung of the <b>Polarity</b> spectrum: the same theme as fear, as balanced power, or as its highest octave. Hold every line as a hypothesis to <b>test against lived experience</b> — your life is the territory; this is only the map.</p>
      </div>

      <div class="bp-acts panel">
        <h3>The thirteen activations</h3>
        <div class="bp-actgrid">
          ${actsTable('Personality · conscious', hd.personalityActivations, unknownTime)}
          ${actsTable('Design · unconscious', hd.designActivations, unknownTime)}
        </div>
      </div>

      <div class="bp-spheres-panel panel">
        <h3>Hologenetic profile · 11 spheres</h3>
        ${spheresBlock(bp.spheres, unknownTime)}
      </div>

      <div class="bp-prov">
        ${unknownTime ? '<p class="bp-warn">Birth time unknown — estimated at noon. Placements marked <span class="bp-q">?</span> (Sun · Earth · Moon and all <b>lines</b>) may be off; treat them as approximate.</p>' : ''}
        <p><b>Birth (UTC):</b> ${esc(bp.birthUtc)} &nbsp;·&nbsp; <b>Design (UTC):</b> ${esc(bp.designUtc)}</p>
        <p class="bp-dim">Computed offline in your browser from real ephemeris — your birth data stays on your device (your last entry is saved locally for convenience) and is never sent anywhere. Informed by Human Design &amp; Gene Keys (a discreet lineage); all interpretation is our own. A symbolic mirror for reflection — not medical, psychological, or predictive advice.</p>
      </div>`;

    $('bp-result').hidden = false;
    $('bp-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    try {
      const bp = BP.computeBlueprint(conv.date);
      render(bp, input);
    } catch (err) {
      $('bp-error').textContent = 'Could not compute the blueprint: ' + err.message;
    }
  }

  function init() {
    if (!BP) { $('bp-error').textContent = 'Engine failed to load.'; return; }
    populateZones();
    loadSaved();
    toggleTime();
    $('bp-unknown').addEventListener('change', toggleTime);
    $('bp-form').addEventListener('submit', onSubmit);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
