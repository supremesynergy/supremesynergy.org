/* engine.js v2 — faithful to the Cosmic Versor-Propagation Cycle 3·7·12 architecture.

   The 3, 7, 12 are ADDITIVE (3+7+12 = 22, the Hebrew alphabet), NOT nested. The 7 is
   algebraically orthogonal to the 12 (Q(ζ7) lies outside Q(ζ₁₂₀)). So they are THREE
   INDEPENDENT cycles, each with its own natural temporal embedding:

   - 12 (annual / solar): the zodiac — the 2D sky-projection of 12 = 3-phase × 4-quadrant
       (the 12th roots of unity, Dollard k₁₂). Driven by the Sun's ecliptic longitude.
   - VERSOR / 3 (lunar): Dollard's 4-quadrant rotation operator j (j⁴ = +1). New/First-Qtr/
       Full/Last-Qtr moon = j⁰/j¹/j²/j³ = stored-dielectric / changing-magnetic /
       stored-magnetic / changing-dielectric. The "3" = Russell's generation → through-zero
       → degeneration arc (waxing / Full pivot / waning). Driven by the lunar phase angle.
   - 7 (weekly): the seven classical planetary days (= the 7 double letters = 7 Sefirot,
       Sefer Yetzirah). An orthogonal cyclotomic cycle. Driven by day-of-week.

   Sources: Concept--Cosmic-Versor-Propagation-Cycle, Dollard/FourQuadrant (j⁴=+1, lunar
   versor analogy), Mattanah (7 mating pairs), Sefer Yetzirah / Megillah Ch.6 (3·7·12 = 22).
   Open/flagged: the 3-arc (Russell) vs 3-primitive (Alef/Shin/Mem) framings are NOT
   reconciled in the sources; rotation sense and the 0° calendar anchor are source-silent
   (we use 0°=vernal equinox by convention). See README "Faithfulness notes".
*/
(function (global) {
  'use strict';
  const A = global.Astronomy;
  const DEG = Math.PI / 180;

  const SIGNS = [
    { name: 'Aries', glyph: '♈' }, { name: 'Taurus', glyph: '♉' },
    { name: 'Gemini', glyph: '♊' }, { name: 'Cancer', glyph: '♋' },
    { name: 'Leo', glyph: '♌' }, { name: 'Virgo', glyph: '♍' },
    { name: 'Libra', glyph: '♎' }, { name: 'Scorpio', glyph: '♏' },
    { name: 'Sagittarius', glyph: '♐' }, { name: 'Capricorn', glyph: '♑' },
    { name: 'Aquarius', glyph: '♒' }, { name: 'Pisces', glyph: '♓' }
  ];

  const BODIES = [
    { key: 'Sun', glyph: '☉', tint: '#f5c451' },
    { key: 'Moon', glyph: '☽', tint: '#cfd6e6' },
    { key: 'Mercury', glyph: '☿', tint: '#9fd0c7' },
    { key: 'Venus', glyph: '♀', tint: '#e8a7c8' },
    { key: 'Mars', glyph: '♂', tint: '#e0664b' },
    { key: 'Jupiter', glyph: '♃', tint: '#d9a566' },
    { key: 'Saturn', glyph: '♄', tint: '#b8b08f' }
  ];

  // THE 7 — planetary week, indexed by JS getDay() (0=Sunday … 6=Saturday).
  const WEEK = [
    { day: 'Sunday', planet: 'Sun', glyph: '☉', sefirah: 'Keter', tint: '#f5c451' },
    { day: 'Monday', planet: 'Moon', glyph: '☽', sefirah: 'Yesod', tint: '#cfd6e6' },
    { day: 'Tuesday', planet: 'Mars', glyph: '♂', sefirah: 'Gevurah', tint: '#e0664b' },
    { day: 'Wednesday', planet: 'Mercury', glyph: '☿', sefirah: 'Hod', tint: '#9fd0c7' },
    { day: 'Thursday', planet: 'Jupiter', glyph: '♃', sefirah: 'Chesed', tint: '#d9a566' },
    { day: 'Friday', planet: 'Venus', glyph: '♀', sefirah: 'Netzach', tint: '#e8a7c8' },
    { day: 'Saturday', planet: 'Saturn', glyph: '♄', sefirah: 'Binah', tint: '#b8b08f' }
  ];

  // THE VERSOR — Dollard's four quadrant poles (lunar), in phase order 0/90/180/270.
  const VERSOR_QUAD = [
    { moon: 'New', op: 'j⁰ = +1', field: 'Stored dielectric' },
    { moon: 'First Quarter', op: 'j¹ = +j', field: 'Changing magnetic' },
    { moon: 'Full', op: 'j² = −1', field: 'Stored magnetic' },
    { moon: 'Last Quarter', op: 'j³ = −j', field: 'Changing dielectric' }
  ];

  const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter']; // northern hemisphere
  const PHASE_NAMES = ['New', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];

  const norm360 = (x) => { x %= 360; return x < 0 ? x + 360 : x; };
  function signOf(lon) {
    const L = norm360(lon); const i = Math.floor(L / 30) % 12;
    return { index: i, name: SIGNS[i].name, glyph: SIGNS[i].glyph, deg: L % 30 };
  }
  function geoEclipticLon(key, date) { return norm360(A.Ecliptic(A.GeoVector(A.Body[key], date, true)).elon); }
  function moonPhaseName(angle) { return PHASE_NAMES[Math.floor(((norm360(angle) + 22.5) % 360) / 45)]; }

  // --- the lunar versor (the 3 / the operator) ---
  function versorOf(phaseAngle) {
    const a = norm360(phaseAngle);
    const quadrant = Math.round(a / 90) % 4;           // nearest cardinal pole (j⁰..j³)
    const waxing = a < 180;
    return {
      angle: a,
      quadrant: { index: quadrant, op: VERSOR_QUAD[quadrant].op, moon: VERSOR_QUAD[quadrant].moon, field: VERSOR_QUAD[quadrant].field },
      arc: {
        name: waxing ? 'Generation' : 'Degeneration',
        waxing,
        atThroughZero: Math.abs(a - 180) < 6,           // Full = middle through-zero (apex)
        atOriginZero: a < 6 || a > 354                  // New = outer zero (origin/return)
      }
    };
  }

  // --- the planetary week (the 7) ---
  function weekOf(date) {
    const i = date.getDay();
    const frac = (date.getHours() + date.getMinutes() / 60) / 24;
    return { index: i, angle: ((i + frac) / 7) * 360, day: WEEK[i].day, planet: WEEK[i].planet, glyph: WEEK[i].glyph, sefirah: WEEK[i].sefirah, tint: WEEK[i].tint };
  }

  function computeState(date) {
    const sunLon = norm360(A.SunPosition(date).elon);
    const phaseAngle = norm360(A.MoonPhase(date));
    const moonLon = geoEclipticLon('Moon', date);
    const illum = (1 - Math.cos(phaseAngle * DEG)) / 2;

    const bodies = BODIES.map((b) => {
      const lon = b.key === 'Sun' ? sunLon : geoEclipticLon(b.key, date);
      return { key: b.key, glyph: b.glyph, tint: b.tint, lon, sign: signOf(lon) };
    });

    const seasonIdx = Math.floor(sunLon / 90) % 4;

    return {
      date,
      sun: { lon: sunLon, sign: signOf(sunLon) },
      moon: { lon: moonLon, phaseAngle, illum, waxing: phaseAngle < 180, phaseName: moonPhaseName(phaseAngle), sign: signOf(moonLon) },
      planets: bodies.filter((b) => b.key !== 'Sun' && b.key !== 'Moon'),
      bodies,
      twelve: signOf(sunLon),                       // annual / solar (the 12)
      versor: versorOf(phaseAngle),                 // lunar (the 3 / Dollard operator)
      week: weekOf(date),                           // weekly (the 7)
      season: { index: seasonIdx, name: SEASONS[seasonIdx] },
      SIGNS, BODIES, WEEK, VERSOR_QUAD
    };
  }

  // Lightweight keys for bulk backtesting (skips the 5 planet vectors).
  function computePhaseLite(date) {
    const sunLon = norm360(A.SunPosition(date).elon);
    const phaseAngle = norm360(A.MoonPhase(date));
    return {
      signIndex: Math.floor(sunLon / 30) % 12,                       // zodiac month (12)
      moonPhaseIndex: Math.floor(((phaseAngle + 22.5) % 360) / 45),  // moon phase (8)
      versorQuad: Math.round(phaseAngle / 90) % 4,                   // lunar versor quadrant (4)
      weekday: date.getDay()                                         // planetary week (7)
    };
  }

  global.Versor = Object.assign(global.Versor || {}, {
    computeState, computePhaseLite, versorOf, weekOf, signOf, norm360, moonPhaseName,
    SIGNS, BODIES, WEEK, VERSOR_QUAD, SEASONS, PHASE_NAMES
  });
})(window);
