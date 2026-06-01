/* interpret.js — the SWAPPABLE LENS (rule-based personal reading, v0, offline).
   Reads the faithful engine state. Other lenses (market, journaling, live-Claude) ride
   the same engine. A lens is any function (state) -> { headline, body, favors, caution }. */
(function (global) {
  'use strict';

  // Keyed by the lunar versor arc (Russell generation / degeneration).
  const ARC_BODY = {
    Generation: "The lunar versor is on its generation arc — waxing from New toward Full. This is the charging, accumulating stretch of the cycle: it rewards initiating, building, and pouring energy in. Form is still gathering.",
    Degeneration: "The lunar versor is on its degeneration arc — waning from Full back toward New. This is the radiating, releasing stretch: it favors completing, harvesting, sharing outward, and clearing rather than starting anew."
  };
  const FAVORS = {
    Generation: "Starting, building, accumulating, committing energy.",
    Degeneration: "Finishing, releasing, refining, sharing, resting."
  };
  const CAUTION = {
    Generation: "Don't release or scatter prematurely — the charge is still building.",
    Degeneration: "Don't force brand-new beginnings uphill — the current is running back to zero."
  };
  const MOON = {
    'New': "At the New moon — j⁰, stored dielectric, the origin-zero — the cycle resets. A clean slate for intention.",
    'Waxing Crescent': "Just past New: the first impulse is taking form.",
    'First Quarter': "First Quarter — j¹, changing-magnetic — peak momentum; push through the first resistance.",
    'Waxing Gibbous': "Waxing Gibbous: gathering toward culmination.",
    'Full': "At the Full moon — j², stored magnetic, the through-zero apex — things come to a head: culmination, revelation, maximum charge.",
    'Waning Gibbous': "Waning Gibbous: the turn outward — share and give back what's ripe.",
    'Last Quarter': "Last Quarter — j³, changing-dielectric — release and course-correct; cut what's finished.",
    'Waning Crescent': "Waning Crescent: emptying toward the next New — rest and prepare the ground."
  };
  const SEASON = {
    Spring: "Annually, the Sun is in spring's expansion.",
    Summer: "Annually, the Sun is in summer's fullness.",
    Autumn: "Annually, the Sun is in autumn's gathering-in.",
    Winter: "Annually, the Sun is in winter's stillness."
  };

  function interpret(s) {
    const arc = s.versor.arc.name;
    return {
      headline: `${arc} · ${s.moon.phaseName} Moon · ${s.week.planet}-day`,
      body: `${ARC_BODY[arc]} ${MOON[s.moon.phaseName]} ${SEASON[s.season.name]} The weekly station is ${s.week.planet} (${s.week.day}).`,
      favors: FAVORS[arc],
      caution: CAUTION[arc]
    };
  }

  global.Versor = Object.assign(global.Versor || {}, { interpret });
})(window);
