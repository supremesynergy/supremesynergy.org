/* blueprint-codes.js — first-pass interpretive readings for the natal blueprint.

   ORIGINAL CONTENT. Grounded in the public-domain I Ching (Gate N = King-Wen
   Hexagram N) and expressed in our own Polarity grammar: Shadow = the fear-pole
   contraction of a theme, Gift = its balanced creative power, Siddhi = its
   highest octave. This is NOT the Gene Keys' copyrighted keyword system —
   Human Design / Gene Keys are cited only as discreet lineage. Phrase-based
   and transformative by design. A first pass, to be deepened over time.

   Exposed as window.VersorCodes (load order independent). */
(function (g) {
  'use strict';

  // 64 gates — { name, shadow, gift, siddhi, essence }
  const GATES = {
    1:  { name: 'The Creative Force', shadow: 'creative paralysis; waiting to feel ready', gift: 'giving form to what never existed', siddhi: 'creation as pure delight', essence: 'The raw pulse that brings the new into being.' },
    2:  { name: 'The Inner Compass', shadow: 'feeling lost, pulled off your line', gift: 'a quiet sense of the right direction', siddhi: 'moving as one with the whole', essence: 'The receptive knowing of where life is taking you.' },
    3:  { name: 'Ordering the New', shadow: 'overwhelmed by initial chaos', gift: 'turning confusion into workable form', siddhi: 'effortless new order', essence: 'The struggle and gift of beginning from raw material.' },
    4:  { name: 'The Answering Mind', shadow: 'clutching at premature certainty', gift: 'holding the question patiently', siddhi: 'peace with not-yet-knowing', essence: 'The mind that wants a formula for everything.' },
    5:  { name: 'Natural Rhythm', shadow: 'anxious forcing of the timing', gift: 'trusting your own pace', siddhi: 'flowing with timeless rhythm', essence: 'Power held in patience and right timing.' },
    6:  { name: 'The Living Boundary', shadow: 'friction and reactive conflict', gift: 'intimacy negotiated with care', siddhi: 'peace that needs no defense', essence: 'The membrane deciding what comes in and what stays out.' },
    7:  { name: 'Leading from Behind', shadow: 'controlling, divisive leadership', gift: 'guiding others toward a shared aim', siddhi: 'leadership as pure service', essence: 'The role of steering the group where it needs to go.' },
    8:  { name: 'Your Own Note', shadow: 'blending in, muting yourself', gift: 'contributing your authentic style', siddhi: 'individuality as art', essence: 'Offering your true difference to the collective.' },
    9:  { name: 'The Power of Focus', shadow: 'scattered, pulled off by every detail', gift: 'concentration that finishes things', siddhi: 'mastery through the small', essence: 'Energy gathered by focusing on what matters.' },
    10: { name: 'The Way You Walk', shadow: 'betraying yourself to fit in', gift: 'behaving as your true self', siddhi: 'simply being, nothing to prove', essence: 'Self-love expressed as how you conduct your life.' },
    11: { name: 'The Hall of Ideas', shadow: 'lost in noisy, meaningless thought', gift: 'holding ideas that inspire', siddhi: 'vision lit from within', essence: 'A storehouse of ideas seeking meaning.' },
    12: { name: 'The Ripened Word', shadow: 'self-conscious, guarded speech', gift: 'speaking only when it is true and timely', siddhi: 'words of pure clarity', essence: 'Caution that lets expression mature before it is spoken.' },
    13: { name: 'The Keeper of Stories', shadow: 'discord; leaking what was confided', gift: 'listening that draws out the truth', siddhi: 'boundless compassion', essence: 'The witness others confide in.' },
    14: { name: 'Power Behind Direction', shadow: 'selling out for security', gift: 'skillful command of your resources', siddhi: 'abundance that flows of itself', essence: 'The fuel and competence backing your purpose.' },
    15: { name: 'The Wide Embrace', shadow: 'flat sameness or erratic extremes', gift: 'a magnetic, humane rhythm', siddhi: 'the full flowering of humanity', essence: 'Holding the whole range of human ways.' },
    16: { name: 'The Skilled Leap', shadow: 'going through the motions, half-hearted', gift: 'enthusiasm refined into real skill', siddhi: 'mastery that looks like play', essence: 'Talent set alight by genuine enthusiasm.' },
    17: { name: 'The Organizing View', shadow: 'clinging to fixed opinions', gift: 'seeing the pattern others miss', siddhi: 'a mind open to all of it', essence: 'The mind arranging the world into a view.' },
    18: { name: "The Healer of What's Off", shadow: 'harsh, perfectionistic judgment', gift: 'correcting with integrity', siddhi: 'wholeness restored', essence: 'The drive to fix and improve what is broken.' },
    19: { name: 'Reaching for Belonging', shadow: 'needy clinging to be wanted', gift: 'sensitive attunement to need', siddhi: 'giving yourself for the whole', essence: 'Sensing what people (and you) need to belong.' },
    20: { name: 'The Present Moment', shadow: 'avoidant busyness, never here', gift: 'fully present, alive to now', siddhi: 'awareness aware of itself', essence: 'Power that exists only in the present.' },
    21: { name: 'The Steward', shadow: 'domineering need to control', gift: 'rightful authority over your domain', siddhi: 'courage that serves', essence: 'The will to manage and protect what is yours.' },
    22: { name: 'The Open Heart', shadow: 'shut down, socially inhibited', gift: 'meeting others with grace', siddhi: 'grace that needs no occasion', essence: 'Emotional openness expressed as social charm.' },
    23: { name: 'The Translator', shadow: 'fragmented, baffling complexity', gift: 'making insight plainly simple', siddhi: 'the essence in a single stroke', essence: 'Turning private knowing into clear language.' },
    24: { name: 'The Returning Mind', shadow: 'looping, addicted to the same thought', gift: 'each return brings a fresh take', siddhi: 'the silence beyond thinking', essence: 'The mind circling back to make sense of mystery.' },
    25: { name: 'The Spirit of Self', shadow: 'armored, defensive heart', gift: 'innocent love of life itself', siddhi: 'love with no conditions', essence: 'Love of existence for its own sake.' },
    26: { name: 'The Persuader', shadow: 'manipulative pride; embellishing', gift: 'artful, honest influence', siddhi: 'impact that leaves no trace of self', essence: 'Will that magnifies and transmits.' },
    27: { name: 'The Caretaker', shadow: 'depleting self-interest', gift: 'nourishing care for self and others', siddhi: 'selfless devotion to life', essence: 'The instinct to feed and protect.' },
    28: { name: 'The Player of the Game', shadow: 'dread of a meaningless life', gift: 'embracing risk for what matters', siddhi: 'life and death held lightly', essence: 'The search for a life worth the struggle.' },
    29: { name: 'The Wholehearted Yes', shadow: 'over-committed and overwhelmed', gift: 'saying yes and going all in', siddhi: 'devotion that carries you through', essence: 'The power of full commitment to an experience.' },
    30: { name: 'The Fire of Longing', shadow: 'consumed by craving and mood', gift: 'desire that fuels aspiration', siddhi: 'feeling without being burned', essence: 'The flame of feeling and what you yearn for.' },
    31: { name: 'The Voice That Leads', shadow: 'hollow, self-serving authority', gift: 'leading by speaking for the group', siddhi: 'leadership emptied of ego', essence: 'Influence that gives the collective its voice.' },
    32: { name: 'The Sense of What Lasts', shadow: 'gripped by fear of failing', gift: 'knowing what is worth preserving', siddhi: 'reverence for the enduring', essence: 'Instinct for what will stand the test of time.' },
    33: { name: 'The Retreat', shadow: 'avoiding, burying the past', gift: 'stepping back to digest and recount', siddhi: 'private experience made revelation', essence: 'Withdrawing to process what has been lived.' },
    34: { name: 'Power in Motion', shadow: "busyness and force for its own sake", gift: 'strength expressed through response', siddhi: 'power as natural majesty', essence: 'Raw available power awaiting the right use.' },
    35: { name: 'The Hunger for More', shadow: 'restless, never satisfied', gift: 'wisdom earned through experience', siddhi: 'fullness with nowhere to get to', essence: 'Progress driven by the appetite for experience.' },
    36: { name: 'Into the Depths', shadow: 'thrown by emotional turbulence', gift: 'meeting crisis with humanity', siddhi: 'compassion forged in the dark', essence: 'Diving into the emotional unknown.' },
    37: { name: 'The Family Bond', shadow: 'fragile, dependent attachment', gift: 'warmth built on equal footing', siddhi: 'tenderness that holds everyone', essence: 'Friendship, belonging, and the bonds of home.' },
    38: { name: 'The Worthy Fight', shadow: "struggle for struggle's sake", gift: 'persevering for what truly matters', siddhi: 'standing in quiet honor', essence: 'The stand you take against resistance.' },
    39: { name: 'The Provoker', shadow: 'needling to get a reaction', gift: 'stirring spirit and aliveness', siddhi: 'the jolt that frees', essence: 'Pressure that provokes feeling and movement.' },
    40: { name: "The Provider's Will", shadow: "running on empty, can't say no", gift: 'willing work, then real rest', siddhi: 'will aligned with something larger', essence: 'The strength to deliver — and to withdraw and recover.' },
    41: { name: 'The First Spark', shadow: 'escaping into fantasy', gift: 'the fertile start of new desire', siddhi: 'feeling as it first arises', essence: 'The seed-pressure that begins a new cycle of experience.' },
    42: { name: 'The Closer of Cycles', shadow: "grasping; can't let things end", gift: 'seeing the experience through', siddhi: 'each ending as celebration', essence: 'The power to complete what was begun.' },
    43: { name: 'The Inner Knowing', shadow: 'deaf to insight, mentally stuck', gift: 'the breakthrough that arrives unbidden', siddhi: 'sudden, clear seeing', essence: 'Knowing from within, ahead of explanation.' },
    44: { name: 'The Instinct for People', shadow: 'reading people in order to manipulate', gift: 'sensing whom to work with', siddhi: 'the right alliance, effortlessly', essence: 'An instinctive read on patterns and people.' },
    45: { name: 'The Gatherer', shadow: 'hoarding; ruling over others', gift: 'gathering and sharing the resource', siddhi: 'the many made one', essence: 'Leadership that draws people and goods together.' },
    46: { name: 'At Home in the Body', shadow: 'heavy, joyless effort', gift: 'delight in being embodied', siddhi: 'the body as a place of grace', essence: 'Love of life lived through the senses.' },
    47: { name: 'Making Sense of It', shadow: 'oppressed by mental fog', gift: 'the moment it finally clicks', siddhi: 'confusion transfigured into meaning', essence: 'The mind sorting confusion into realization.' },
    48: { name: 'The Deep Well', shadow: "the fear there isn't enough in you", gift: 'drawing on real depth and skill', siddhi: 'wisdom that never runs dry', essence: 'A bottomless reservoir of capability.' },
    49: { name: 'The Principled Turn', shadow: 'rejecting and reacting blindly', gift: 'changing what no longer serves, on principle', siddhi: 'renewal from the inside out', essence: 'The instinct for necessary revolution.' },
    50: { name: 'The Keeper of Values', shadow: 'corrupted; crushed by responsibility', gift: 'holding values in balance', siddhi: 'harmony upheld for all', essence: 'Stewardship of the principles a community lives by.' },
    51: { name: 'The Shock', shadow: 'rattled and thrown by the unexpected', gift: 'the courage to go first', siddhi: 'shock that wakes you to the sacred', essence: 'The thunderclap that jolts you alive.' },
    52: { name: 'The Stillness', shadow: 'tense, pressured stress', gift: 'the power to stop and concentrate', siddhi: 'deep, motionless calm', essence: 'The capacity to be still and see clearly.' },
    53: { name: 'The Starter', shadow: 'restless pressure to begin', gift: 'steady energy for new growth', siddhi: 'endless unfolding', essence: 'The drive to start fresh cycles of development.' },
    54: { name: 'The Climb', shadow: 'grasping ambition, driven by lack', gift: 'clean drive to rise', siddhi: 'ascent into the unseen', essence: 'The will to transform and move upward.' },
    55: { name: 'The Abundant Heart', shadow: 'moody, at the mercy of feeling', gift: 'emotional richness and freedom', siddhi: 'spirit overflowing', essence: 'Fullness of feeling and the freedom within it.' },
    56: { name: 'The Storyteller', shadow: 'scattered by endless stimulation', gift: 'enriching others through the tale', siddhi: 'meaning that intoxicates', essence: 'Seeking and sharing experience through ideas and stories.' },
    57: { name: 'The Clear Intuition', shadow: 'second-guessing the gut', gift: 'trusting quiet intuitive knowing', siddhi: 'immediate, luminous clarity', essence: 'Penetrating intuition in the present moment.' },
    58: { name: 'The Joy of Life', shadow: 'nagging dissatisfaction', gift: 'vitality that wants to improve life', siddhi: 'causeless joy', essence: 'The aliveness that drives correction and zest.' },
    59: { name: 'The Intimate', shadow: 'using charm to get past defenses', gift: 'breaking barriers into real closeness', siddhi: 'nothing hidden between you', essence: 'The drive to dissolve distance and connect.' },
    60: { name: 'The Fertile Limit', shadow: 'stuck, hardened by limitation', gift: 'turning constraint into new form', siddhi: 'the just order in all things', essence: 'Accepting limits as the seedbed of the new.' },
    61: { name: 'The Mystery', shadow: 'obsessive spinning on the unknowable', gift: 'pressure that becomes inspiration', siddhi: 'touching the sacred unknown', essence: 'The inner pressure to know why.' },
    62: { name: 'The Naming of Things', shadow: 'cold, pedantic over-detailing', gift: 'precise, useful expression', siddhi: 'the perfect word for the thing', essence: 'Organizing reality through detail and name.' },
    63: { name: 'The Doubt That Checks', shadow: 'corrosive, anxious doubt', gift: 'rigorous questioning that verifies', siddhi: 'doubt resolved into truth', essence: 'Healthy skepticism that tests the pattern.' },
    64: { name: 'The Sea of Possibility', shadow: 'foggy, pressured confusion', gift: 'imagination sorting the maybes', siddhi: 'the flash that makes it clear', essence: 'The mind sifting many possibilities before they resolve.' },
  };

  // 6 lines — our own labels for the line archetypes (grounded in the I Ching line positions).
  const LINES = {
    1: { name: 'The Foundation', theme: 'Needs solid ground before acting — studies the roots and builds security by understanding what holds it all up.' },
    2: { name: 'The Natural', theme: 'Gifted and at ease in its own flow; does best simply being itself, drawn out by the right call rather than pushed.' },
    3: { name: 'The Experimenter', theme: 'Learns by trial, error, and contact — resilient and adaptive, discovering what works by bumping into what does not.' },
    4: { name: 'The Networker', theme: 'Moves through relationships and friendship; opportunity and influence travel along who it knows and trusts.' },
    5: { name: 'The Deliverer', theme: 'Others project hopes onto it and call on it to provide; a practical, universal fixer carrying reputation and visibility.' },
    6: { name: 'The Exemplar', theme: 'Lives in three acts — trial, withdrawal, then objective wisdom; matures into a trustworthy role model and witness.' },
  };

  // 9 centres
  const CENTERS = {
    Head: { name: 'Head', theme: 'Mental pressure and inspiration — the spring of questions, wonder, and the urge to make sense of things.' },
    Ajna: { name: 'Ajna', theme: 'The conceptual mind — how you process, form views, and hold (or chase) certainty.' },
    Throat: { name: 'Throat', theme: 'Expression and manifestation — where energy becomes voice and action.' },
    Self: { name: 'G / Self', theme: 'Identity, love, and direction — your sense of who you are and where life is taking you.' },
    Heart: { name: 'Heart / Ego', theme: "Willpower, worth, and material drive — the motor of commitment and 'I can'." },
    Spleen: { name: 'Spleen', theme: "Instinct, intuition, immunity — the body's quiet, in-the-moment knowing about safety and health." },
    Sacral: { name: 'Sacral', theme: 'Life-force and response — sustainable energy for work, creation, and what genuinely lights you up.' },
    SolarPlexus: { name: 'Solar Plexus', theme: 'Emotion and mood — the wave of feeling whose truth clarifies over time, not in the moment.' },
    Root: { name: 'Root', theme: 'Pressure and drive — the adrenal pulse that fuels momentum, stress, and the push to get going.' },
  };

  // 5 types
  const TYPES = {
    'Manifestor': { strategy: 'Initiate, then inform those your move affects.', aura: 'Closed and repelling — built to impact, not to be managed.', signpost: 'Peace when free to act; anger when blocked.' },
    'Generator': { strategy: 'Wait to respond — let life present things, then feel the gut’s yes/no.', aura: 'Open and enveloping — magnetic life-force.', signpost: 'Satisfaction in the right work; frustration when not.' },
    'Manifesting Generator': { strategy: 'Respond, then inform — move fast, skip steps, course-correct.', aura: 'Open, enveloping, and quick.', signpost: 'Satisfaction and peace; frustration and anger when forced onto one track.' },
    'Projector': { strategy: 'Wait for genuine recognition and invitation for the big things.', aura: 'Focused and absorbing — sees deeply into others.', signpost: 'Success when seen and used well; bitterness when overlooked or overworking.' },
    'Reflector': { strategy: 'Wait a full lunar cycle before major decisions; sample your environment.', aura: 'Sampling and resistant — a mirror of the community.', signpost: 'Surprise and delight in a healthy place; disappointment in the wrong one.' },
  };

  // 7 inner authorities
  const AUTHORITIES = {
    'Emotional': 'Wait through your emotional wave — clarity arrives over time, not in the heat of the moment.',
    'Sacral': 'Trust the gut response — the immediate yes/no of your life-force centre.',
    'Splenic': 'Trust the quiet, in-the-moment intuitive knowing of the body — it speaks once, softly.',
    'Ego': 'Trust what your willpower and heart genuinely want and can commit to.',
    'Self-Projected': 'Truth emerges as you talk it out and hear your own voice.',
    'Mental (Environmental)': 'No fixed inner authority — think out loud with trusted people, in the right environments.',
    'Lunar': 'Let a full lunar cycle (~28 days) pass before major decisions.',
  };

  // What each chart body points to (plain, our own framing).
  const BODY_ROLE = {
    Sun: 'Your core theme — the dominant note of how you express (Personality) or are wired beneath (Design).',
    Earth: 'What grounds and balances you — the ballast beneath the Sun.',
    Moon: 'What drives and moves you — the fuel that keeps you going.',
    NorthNode: 'The direction and environment your future unfolds through.',
    SouthNode: 'Familiar gifts and the past you carry forward.',
    Mercury: 'How you communicate and what you need to express.',
    Venus: 'Your values, tastes, and how you love.',
    Mars: 'Raw emotional drive and where you mature (especially in Design).',
    Jupiter: 'Your law and protection — where luck and blessing gather.',
    Saturn: 'Discipline and structure — where life asks for rigor.',
    Uranus: 'The unusual in you — individuality and the unexpected.',
    Neptune: 'Spirit, dreaming, and where illusion can blur.',
    Pluto: 'Truth and transformation — deep psychological turning.',
  };

  const FRAME = 'In our grammar: Shadow is the fear-pole contraction of a theme, Gift its balanced power, Siddhi its highest octave. A mirror to test against your life — not a verdict.';

  g.VersorCodes = { GATES, LINES, CENTERS, TYPES, AUTHORITIES, BODY_ROLE, FRAME };
})(window);
