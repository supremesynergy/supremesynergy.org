/* compat.js — two-person compatibility / composite reading.

   A relational LENS on the same engine — pure computation over two
   computeBlueprint() outputs (src/blueprint.js). It does NOT touch the
   chart-validated engine; it only reads each person's defined gates,
   centres, type, authority and profile. This is the "one engine, swappable
   interpreters" architecture: the natal blueprint is the personal lens, this
   is the relational lens, both ride the same astronomy.

   The four connection types are the canonical Human-Design connection-chart
   relationships (electromagnetic / companionship / dominance / compromise),
   computed below from the two defined-gate sets. NOTE: the common online
   "compromise = both hang the same gate" phrasing is NOT canonical; canonical
   compromise is "one person defines the whole channel, the other hangs one of
   its two gates." We use the canonical definitions.

   IP note (carried from the blueprint): the four connection-type NAMES are
   structural descriptors used as discreet lineage (like "Generator"); all
   explanatory text lives in compat-codes.js and is our own. No copyrighted
   Human Design / Gene Keys interpretive text is reproduced.

   Self-contained: depends only on the engine constants (Versor.blueprint
   .CHANNELS) and, when present, VersorCodes.CHANNEL_INFO for channel names.
   Browser: window.Versor.compat. Node: module.exports (for sanity tests).
*/
(function (global) {
  'use strict';
  const BP =
    (global.Versor && global.Versor.blueprint) ||
    (typeof require !== 'undefined' ? require('./blueprint.js') : null);
  if (!BP) throw new Error('compat.js: Versor.blueprint engine not found (load blueprint.js first)');

  // Resolved at CALL time so script load-order / Node (no VersorCodes) both work.
  const codes = () => global.VersorCodes || {};
  const rcodes = () => global.VersorCompatCodes || {};

  const CENTER_ORDER = ['Head', 'Ajna', 'Throat', 'Self', 'Heart', 'Spleen', 'Sacral', 'SolarPlexus', 'Root'];

  // ── per-person defined gates (union of the 13 personality + 13 design points) ──
  function definedGates(bp) {
    const s = new Set();
    const add = (arr) => (arr || []).forEach((a) => s.add(a.gate));
    add(bp && bp.hd && bp.hd.personalityActivations);
    add(bp && bp.hd && bp.hd.designActivations);
    return s;
  }

  // ── the four connection types, per the 36 channels ──
  // Keys ("a-b") follow the engine's CHANNELS pair order, matching CHANNEL_INFO.
  function classifyChannels(bpA, bpB) {
    const A = definedGates(bpA);
    const B = definedGates(bpB);
    const out = { electromagnetic: [], companionship: [], dominance: [], compromise: [] };
    const CHAN_INFO = codes().CHANNEL_INFO || {};

    (BP.CHANNELS || []).forEach((pair) => {
      const g1 = pair[0], g2 = pair[1];
      const a1 = A.has(g1), a2 = A.has(g2), b1 = B.has(g1), b2 = B.has(g2);
      const aFull = a1 && a2, bFull = b1 && b2;
      const aCount = (a1 ? 1 : 0) + (a2 ? 1 : 0);
      const bCount = (b1 ? 1 : 0) + (b2 ? 1 : 0);
      const key = g1 + '-' + g2;
      const info = CHAN_INFO[key] || {};
      const base = { key: key, gates: [g1, g2], name: info.name || key, detail: info.detail || '' };

      if (aFull && bFull) {
        out.companionship.push(base);
      } else if (aFull && bCount === 0) {
        out.dominance.push(Object.assign({ leader: 'A' }, base));
      } else if (bFull && aCount === 0) {
        out.dominance.push(Object.assign({ leader: 'B' }, base));
      } else if (aFull && bCount === 1) {
        out.compromise.push(Object.assign({ leader: 'A', adapterGate: b1 ? g1 : g2 }, base));
      } else if (bFull && aCount === 1) {
        out.compromise.push(Object.assign({ leader: 'B', adapterGate: a1 ? g1 : g2 }, base));
      } else if (!aFull && !bFull && (a1 || b1) && (a2 || b2)) {
        // Neither defines it alone, yet together it completes → the spark.
        out.electromagnetic.push(Object.assign({ aGate: a1 ? g1 : g2, bGate: b1 ? g1 : g2 }, base));
      }
      // else: no channel-level connection (solo hanging gate, or shared single gate).
    });
    return out;
  }

  // ── centre conditioning (who consistently colours whom, and where) ──
  function classifyCentres(bpA, bpB) {
    const da = new Set((bpA.hd && bpA.hd.definedCenters) || []);
    const db = new Set((bpB.hd && bpB.hd.definedCenters) || []);
    return CENTER_ORDER.map((c) => {
      const a = da.has(c), b = db.has(c);
      let kind;
      if (a && b) kind = 'shared';        // both defined — stable shared ground
      else if (a && !b) kind = 'AtoB';    // A conditions B here
      else if (b && !a) kind = 'BtoA';    // B conditions A here
      else kind = 'open';                 // both open — mutually amplifying
      return { center: c, kind: kind, aDefined: a, bDefined: b };
    });
  }

  // ── type × type ──
  function typePair(bpA, bpB) {
    const t1 = bpA.hd.type, t2 = bpB.hd.type;
    const key = [t1, t2].sort().join('|');
    const TP = rcodes().TYPE_PAIR || {};
    return { a: t1, b: t2, note: TP[key] || '' };
  }

  // ── authority × authority → a single joint decision tempo ──
  // The most deliberate authority present sets the pace for shared decisions.
  const AUTH_PRIORITY = ['Lunar', 'Emotional', 'Mental (Environmental)', 'Self-Projected', 'Ego', 'Splenic', 'Sacral'];
  function authorityProtocol(bpA, bpB) {
    const a1 = bpA.hd.authority, a2 = bpB.hd.authority;
    let lead = a1;
    for (let i = 0; i < AUTH_PRIORITY.length; i++) {
      if (a1 === AUTH_PRIORITY[i] || a2 === AUTH_PRIORITY[i]) { lead = AUTH_PRIORITY[i]; break; }
    }
    const frag = rcodes().AUTH_FRAGMENT || {};
    return { a: a1, b: a2, lead: lead, text: frag[lead] || '' };
  }

  // ── profile resonance (light) ──
  function profileNote(bpA, bpB) {
    const p1 = String(bpA.hd.profile || ''), p2 = String(bpB.hd.profile || '');
    const la = p1.split('/').map(Number), lb = p2.split('/').map(Number);
    const shared = la.filter((n) => lb.includes(n));
    let text;
    if (p1 && p1 === p2) {
      text = 'You share the same profile (' + p1 + ') — a deep, sometimes uncanny familiarity in how you each move through life, for better and worse.';
    } else if (shared.length) {
      text = 'You share line ' + shared.join(' and ') + ' — a familiar resonance in how you each meet life, even though the rest differs.';
    } else {
      text = 'Different profiles (' + p1 + ' and ' + p2 + ') — you move through life by distinct rhythms, which can complement beautifully or simply surprise.';
    }
    return { a: p1, b: p2, text: text };
  }

  // ── multi-surface snapshot (no single number) + texture ──
  function snapshotOf(channels) {
    const counts = {
      electromagnetic: channels.electromagnetic.length,
      companionship: channels.companionship.length,
      dominance: channels.dominance.length,
      compromise: channels.compromise.length,
    };
    const total = counts.electromagnetic + counts.companionship + counts.dominance + counts.compromise;
    const TEX = rcodes().TEXTURE || {};
    let texture;
    if (total === 0) {
      texture = TEX.none || { label: 'Spacious & lightly wired', note: '' };
    } else {
      const order = ['electromagnetic', 'companionship', 'dominance', 'compromise'];
      order.sort((x, y) => counts[y] - counts[x]);
      const top = order[0];
      texture = TEX[top] || { label: top, note: '' };
    }
    return { counts: counts, total: total, texture: texture };
  }

  // ── assembly ──
  function computeCompatibility(bpA, bpB) {
    const channels = classifyChannels(bpA, bpB);
    const snap = snapshotOf(channels);
    const identical = bpA.birthUtc && bpB.birthUtc && bpA.birthUtc === bpB.birthUtc;
    return {
      channels: channels,
      centres: classifyCentres(bpA, bpB),
      typePair: typePair(bpA, bpB),
      authorityProtocol: authorityProtocol(bpA, bpB),
      profileNote: profileNote(bpA, bpB),
      counts: snap.counts,
      total: snap.total,
      texture: snap.texture,
      identical: !!identical,
    };
  }

  const api = {
    computeCompatibility, classifyChannels, classifyCentres,
    typePair, authorityProtocol, profileNote, definedGates, snapshotOf,
    CENTER_ORDER,
  };

  global.Versor = Object.assign(global.Versor || {}, { compat: api });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
