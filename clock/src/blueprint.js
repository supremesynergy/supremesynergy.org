/* blueprint.js — Human Design + Gene Keys natal blueprint engine.

   A faithful vanilla-JS port of the chart-validated TypeScript engine in
   supreme-map-app/src/lib/blueprint/* (wheel · ephemeris · humandesign ·
   genekeys · index). Same constants, same formulas → same charts. The TS
   engine was validated against published reference charts (Ra Uru Hu:
   Manifestor / Splenic / 5/1); scripts/validate-blueprint.mjs differential-
   tests this port against it so that validation carries over.

   Self-contained: depends only on the global `Astronomy` (vendored
   astronomy-engine) in the browser, or require('astronomy-engine') in Node.
   No build step. Lives alongside the transit dial (engine.js) but does not
   touch it — a separate lens on the same astronomy.

   IP note (carried from the Supreme Map locks): the gate wheel is our own
   table derived from the public degree method; gate NUMBERS and chart
   geometry are facts. We do NOT reproduce HD/Gene Keys copyrighted
   interpretive text or trademarked artwork (Rave BodyGraph™/Mandala™).
   Sphere blurbs and type notes below are our own plain-language phrasing.
*/
(function (global) {
  'use strict';
  const A =
    global.Astronomy ||
    (typeof require !== 'undefined' ? require('astronomy-engine') : null);
  if (!A) throw new Error('blueprint.js: astronomy-engine (global Astronomy) not found');

  const norm360 = (x) => (((x % 360) + 360) % 360);

  // ── wheel ──────────────────────────────────────────────────────────────
  // Gate 25 begins at 358.25° (28°15'00" Pisces); 64 equal gates of 5.625°;
  // 6 lines per gate of 0.9375°; line 1 at the gate's start.
  const HD_START_DEG = 358.25;
  const GATE_SIZE = 360 / 64;   // 5.625
  const LINE_SIZE = GATE_SIZE / 6; // 0.9375

  // Gates in zodiacal order (increasing ecliptic longitude), starting at Gate 25.
  const GATE_SEQUENCE = [
    25, 17, 21, 51, 42, 3,
    27, 24, 2, 23, 8, 20,
    16, 35, 45, 12, 15, 52,
    39, 53, 62, 56, 31, 33,
    7, 4, 29, 59, 40, 64,
    47, 6, 46, 18, 48, 57,
    32, 50, 28, 44, 1, 43,
    14, 34, 9, 5, 26, 11,
    10, 58, 38, 54, 61, 60,
    41, 19, 13, 49, 30, 55,
    37, 63, 22, 36,
  ];

  function degreeToGateLine(longitude) {
    const adjusted = norm360(longitude - HD_START_DEG);
    const index = Math.floor(adjusted / GATE_SIZE);
    const line = Math.floor((adjusted % GATE_SIZE) / LINE_SIZE) + 1;
    return { gate: GATE_SEQUENCE[index], line };
  }

  // ── ephemeris ──────────────────────────────────────────────────────────
  // Geocentric apparent ECLIPTIC longitude (tropical, of-date), 0–360°.
  // (astronomy-engine's EclipticLongitude() is HELIOCENTRIC — not used.)
  function eclipticLongitude(body, date) {
    if (body === 'Sun') return A.SunPosition(date).elon;
    if (body === 'Moon') return A.EclipticGeoMoon(date).lon;
    const vec = A.GeoVector(A.Body[body], date, true);
    return A.Ecliptic(vec).elon;
  }

  // Mean lunar North Node longitude (Meeus, Astronomical Algorithms Ch. 47).
  function meanNorthNode(date) {
    const T = A.MakeTime(date).tt / 36525; // Julian centuries since J2000 (TT)
    const omega =
      125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000;
    return norm360(omega);
  }

  function bodyLongitude(body, date) {
    if (body === 'Earth') return norm360(eclipticLongitude('Sun', date) + 180);
    return eclipticLongitude(body, date);
  }

  // Longitude for the 13 Human Design activations (adds Earth + the Nodes).
  function hdBodyLongitude(body, date) {
    if (body === 'Earth') return norm360(eclipticLongitude('Sun', date) + 180);
    if (body === 'NorthNode') return meanNorthNode(date);
    if (body === 'SouthNode') return norm360(meanNorthNode(date) + 180);
    return eclipticLongitude(body, date);
  }

  // The Design moment: ~88° of solar arc before birth (NOT a fixed 88 days).
  function findDesignDate(birth) {
    const birthSun = eclipticLongitude('Sun', birth);
    const target = norm360(birthSun - 88);
    let lo = new Date(birth.getTime() - 92 * 86400000);
    let hi = new Date(birth.getTime() - 84 * 86400000);
    for (let i = 0; i < 60; i++) {
      const mid = new Date((lo.getTime() + hi.getTime()) / 2);
      const midSun = eclipticLongitude('Sun', mid);
      const diff = ((midSun - target + 540) % 360) - 180;
      if (diff > 0) hi = mid;
      else lo = mid;
    }
    return new Date((lo.getTime() + hi.getTime()) / 2);
  }

  // ── human design ─────────────────────────────────────────────────────────
  const MOTORS = ['Sacral', 'SolarPlexus', 'Heart', 'Root'];

  const GATE_CENTER = {
    61: 'Head', 63: 'Head', 64: 'Head',
    4: 'Ajna', 11: 'Ajna', 17: 'Ajna', 24: 'Ajna', 43: 'Ajna', 47: 'Ajna',
    8: 'Throat', 12: 'Throat', 16: 'Throat', 20: 'Throat', 23: 'Throat', 31: 'Throat', 33: 'Throat', 35: 'Throat', 45: 'Throat', 56: 'Throat', 62: 'Throat',
    1: 'Self', 2: 'Self', 7: 'Self', 10: 'Self', 13: 'Self', 15: 'Self', 25: 'Self', 46: 'Self',
    21: 'Heart', 26: 'Heart', 40: 'Heart', 51: 'Heart',
    3: 'Sacral', 5: 'Sacral', 9: 'Sacral', 14: 'Sacral', 27: 'Sacral', 29: 'Sacral', 34: 'Sacral', 42: 'Sacral', 59: 'Sacral',
    18: 'Spleen', 28: 'Spleen', 32: 'Spleen', 44: 'Spleen', 48: 'Spleen', 50: 'Spleen', 57: 'Spleen',
    6: 'SolarPlexus', 22: 'SolarPlexus', 30: 'SolarPlexus', 36: 'SolarPlexus', 37: 'SolarPlexus', 49: 'SolarPlexus', 55: 'SolarPlexus',
    19: 'Root', 38: 'Root', 39: 'Root', 41: 'Root', 52: 'Root', 53: 'Root', 54: 'Root', 58: 'Root', 60: 'Root',
  };

  const CHANNELS = [
    [1, 8], [2, 14], [3, 60], [4, 63], [5, 15], [6, 59], [7, 31], [9, 52],
    [10, 20], [10, 34], [10, 57], [11, 56], [12, 22], [13, 33], [16, 48],
    [17, 62], [18, 58], [19, 49], [20, 34], [20, 57], [21, 45], [23, 43],
    [24, 61], [25, 51], [26, 44], [27, 50], [28, 38], [29, 46], [30, 41],
    [32, 54], [34, 57], [35, 36], [37, 40], [39, 55], [42, 53], [47, 64],
  ];

  const HD_BODIES = [
    'Sun', 'Earth', 'Moon', 'NorthNode', 'SouthNode', 'Mercury', 'Venus',
    'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
  ];

  // Per-activation gate+line for all 13 points at a moment (for display + derivation).
  function activations(date) {
    return HD_BODIES.map((b) => {
      const longitude = hdBodyLongitude(b, date);
      const gl = degreeToGateLine(longitude);
      return { body: b, longitude, gate: gl.gate, line: gl.line };
    });
  }

  function computeHumanDesign(natal, design) {
    const natalAct = activations(natal);
    const designAct = activations(design);
    const allGates = new Set([
      ...natalAct.map((a) => a.gate),
      ...designAct.map((a) => a.gate),
    ]);

    const active = CHANNELS.filter(([a, b]) => allGates.has(a) && allGates.has(b));

    const definedCenters = new Set();
    const adj = new Map();
    for (const [a, b] of active) {
      const ca = GATE_CENTER[a];
      const cb = GATE_CENTER[b];
      definedCenters.add(ca);
      definedCenters.add(cb);
      if (ca === cb) continue;
      if (!adj.has(ca)) adj.set(ca, new Set());
      if (!adj.has(cb)) adj.set(cb, new Set());
      adj.get(ca).add(cb);
      adj.get(cb).add(ca);
    }

    // Is a motor connected to the Throat through active channels? (BFS)
    let motorToThroat = false;
    if (definedCenters.has('Throat')) {
      const seen = new Set(['Throat']);
      const queue = ['Throat'];
      while (queue.length) {
        const c = queue.shift();
        if (c !== 'Throat' && MOTORS.includes(c)) { motorToThroat = true; break; }
        for (const n of adj.get(c) ?? []) {
          if (!seen.has(n)) { seen.add(n); queue.push(n); }
        }
      }
    }

    const has = (c) => definedCenters.has(c);

    let type;
    if (definedCenters.size === 0) type = 'Reflector';
    else if (has('Sacral') && motorToThroat) type = 'Manifesting Generator';
    else if (has('Sacral')) type = 'Generator';
    else if (motorToThroat) type = 'Manifestor';
    else type = 'Projector';

    let authority;
    if (has('SolarPlexus')) authority = 'Emotional';
    else if (has('Sacral')) authority = 'Sacral';
    else if (has('Spleen')) authority = 'Splenic';
    else if (has('Heart')) authority = 'Ego';
    else if (has('Self')) authority = 'Self-Projected';
    else if (definedCenters.size > 0) authority = 'Mental (Environmental)';
    else authority = 'Lunar';

    const personalitySun = degreeToGateLine(eclipticLongitude('Sun', natal));
    const designSun = degreeToGateLine(eclipticLongitude('Sun', design));
    const profile = `${personalitySun.line}/${designSun.line}`;

    return {
      type,
      authority,
      profile,
      definedCenters: [...definedCenters],
      activeChannels: active.map(([a, b]) => `${a}-${b}`),
      personalitySun,
      designSun,
      personalityActivations: natalAct,
      designActivations: designAct,
    };
  }

  // ── gene keys (11-sphere Hologenetic Profile) ────────────────────────────
  // Our own plain-language blurbs; HD/GK cited only as discreet lineage.
  const SPHERES = [
    { key: 'lifes_work', name: "Life's Work", body: 'Sun', source: 'natal', sequence: 'Activation', blurb: "How you're here to express yourself in the world." },
    { key: 'evolution', name: 'Evolution', body: 'Earth', source: 'natal', sequence: 'Activation', blurb: 'The central life challenge that grows you.' },
    { key: 'radiance', name: 'Radiance', body: 'Sun', source: 'design', sequence: 'Activation', blurb: 'How your vitality and health want to shine.' },
    { key: 'purpose', name: 'Purpose', body: 'Earth', source: 'design', sequence: 'Activation', blurb: 'The deep ground your life is rooted in.' },
    { key: 'attraction', name: 'Attraction', body: 'Moon', source: 'design', sequence: 'Activation', blurb: 'What you draw toward you and are drawn to.' },
    { key: 'iq', name: 'IQ', body: 'Venus', source: 'natal', sequence: 'Venus', blurb: 'How your mind learns and problem-solves.' },
    { key: 'eq', name: 'EQ', body: 'Mars', source: 'natal', sequence: 'Venus', blurb: 'How you meet and metabolize emotion.' },
    { key: 'sq', name: 'SQ', body: 'Venus', source: 'design', sequence: 'Venus', blurb: 'Your spiritual intelligence — how you love.' },
    { key: 'core', name: 'Core', body: 'Mars', source: 'design', sequence: 'Venus', blurb: 'The core wound and gift at your center.' },
    { key: 'culture', name: 'Culture', body: 'Jupiter', source: 'design', sequence: 'Pearl', blurb: "How you're meant to contribute to the whole." },
    { key: 'pearl', name: 'Pearl', body: 'Jupiter', source: 'natal', sequence: 'Pearl', blurb: 'Where ease, prosperity, and simplicity live.' },
  ];

  // ── assembly ──────────────────────────────────────────────────────────────
  function computeBlueprint(birthUtc) {
    const designDate = findDesignDate(birthUtc);

    const spheres = SPHERES.map((s) => {
      const date = s.source === 'natal' ? birthUtc : designDate;
      const longitude = bodyLongitude(s.body, date);
      const { gate, line } = degreeToGateLine(longitude);
      return { ...s, gate, line, longitude };
    });

    const hd = computeHumanDesign(birthUtc, designDate);

    return {
      birthUtc: birthUtc.toISOString(),
      designUtc: designDate.toISOString(),
      spheres,
      hd,
    };
  }

  // ── local birth time → UTC ────────────────────────────────────────────────
  // Replicates Luxon's DateTime.fromISO(`${date}T${time}`,{zone}).toUTC():
  // interpret the wall-clock time in the given IANA zone (historical DST via
  // the Intl tz database) and return the corresponding UTC instant.
  function zoneOffsetMinutes(utcMs, zone) {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: zone, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    const m = {};
    for (const p of dtf.formatToParts(new Date(utcMs))) {
      if (p.type !== 'literal') m[p.type] = p.value;
    }
    const asUTC = Date.UTC(+m.year, +m.month - 1, +m.day, +m.hour, +m.minute, +m.second);
    return (asUTC - utcMs) / 60000;
  }

  // Returns { date: Date, error?: string }. timeKnown=false → noon estimate.
  function localToUtc(dateStr, timeStr, zone, timeKnown) {
    try {
      const time = timeKnown ? timeStr : '12:00';
      const [y, mo, d] = String(dateStr).split('-').map(Number);
      const [h, mi] = String(time).split(':').map(Number);
      if (!y || !mo || !d || Number.isNaN(h) || Number.isNaN(mi)) {
        return { error: "That date or time wasn't valid." };
      }
      // Validate the zone (throws RangeError if unknown).
      // eslint-disable-next-line no-new
      new Intl.DateTimeFormat('en-US', { timeZone: zone });
      const wallAsUTC = Date.UTC(y, mo - 1, d, h, mi, 0);
      const off = zoneOffsetMinutes(wallAsUTC, zone);
      let utc = wallAsUTC - off * 60000;
      const off2 = zoneOffsetMinutes(utc, zone);
      if (off2 !== off) utc = wallAsUTC - off2 * 60000;
      return { date: new Date(utc) };
    } catch (e) {
      return { error: "That timezone wasn't recognized." };
    }
  }

  const api = {
    computeBlueprint, computeHumanDesign, findDesignDate, degreeToGateLine,
    eclipticLongitude, meanNorthNode, bodyLongitude, hdBodyLongitude,
    localToUtc, zoneOffsetMinutes,
    HD_START_DEG, GATE_SIZE, LINE_SIZE, GATE_SEQUENCE, GATE_CENTER, CHANNELS,
    HD_BODIES, MOTORS, SPHERES,
  };

  global.Versor = Object.assign(global.Versor || {}, { blueprint: api });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
