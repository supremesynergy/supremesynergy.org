/* compat-codes.js — relational interpretive copy for the compatibility lens.

   ORIGINAL CONTENT, in the same Polarity / EFL grammar as the natal blueprint.
   The four connection-type names and the type/authority mechanics are public
   structural facts of the Human Design connection chart; every explanatory
   sentence here is our own plain-language phrasing — none of the Gene Keys /
   Human Design copyrighted descriptive text is reproduced.

   Exposed as window.VersorCompatCodes (merged independently of load order). */
(function (g) {
  'use strict';

  // The four ways two charts connect through a channel.
  const CONNECTION_TYPES = {
    electromagnetic: {
      name: 'Electromagnetic',
      gloss: 'The spark — neither of you alone, alive together.',
      detail: 'Neither of you carries this wiring by yourself; each holds one end, and together the circuit switches on. This is the classic attraction — the magnetism that pulls you in. The same shared circuit that lights you up can also short out, which is why these places can run hot both ways. Lean in, and expect the charge to cut in both directions.',
    },
    companionship: {
      name: 'Companionship',
      gloss: 'Alike — instant recognition.',
      detail: "You each carry this whole circuit independently, so you meet here in a shared native language — easy, stabilizing, immediately understood. The one caution: because neither of you meets any friction here, it can become a shared blind spot, a place you both assume rather than examine.",
    },
    dominance: {
      name: 'Dominance',
      gloss: 'One carries it, the other learns it.',
      detail: 'One of you runs this whole circuit; the other has no direct access to it at all. The carrier consistently sets the tone here, and the other receives it and slowly learns it. This is generative and even mentoring when it is named out loud — and quietly lopsided when it runs unconscious.',
    },
    compromise: {
      name: 'Compromise',
      gloss: "Shared, on the carrier's terms — the growth edge.",
      detail: "One of you carries the whole circuit; the other holds just one end of it. You both have a real stake here, but it runs the carrier's way and the single-gate partner adapts. These are often the richest growth edges in a relationship — and the easiest places to chafe.",
    },
  };

  // Type × Type — keyed by the two types sorted alphabetically and joined with '|'.
  // Functional plain-language; derived from each type's aura + strategy, in our words.
  const TYPE_PAIR = {
    'Generator|Generator':
      'Two open, enveloping life-forces. When you each wait to respond instead of pushing from the head, you build steady momentum together; the trap is both of you initiating into work neither actually wanted, and burning out. Ask each other clear yes/no questions.',
    'Generator|Manifesting Generator':
      'Both built to respond, but the Manifesting Generator moves faster and skips steps the Generator wants to finish. Honour the difference in pace — let one dart and double back, let the other complete — and check each other’s gut before you commit.',
    'Generator|Manifestor':
      'The Manifestor initiates and the Generator responds — a natural fit when the Manifestor informs first and gives the Generator something real to respond to. Friction comes when the Manifestor moves without a word, or the Generator waits for an invitation a Manifestor will never think to give.',
    'Generator|Projector':
      'The Projector sees the Generator clearly and can steer their energy beautifully — once genuinely invited and recognised. The Generator brings the sustainable fuel, the Projector brings the guidance. Watch for the Projector pushing unrecognised, or the Generator working hard and never feeling seen.',
    'Generator|Reflector':
      'The Generator’s steady aura is something the Reflector samples and mirrors, so a satisfied Generator is a gift here and a frustrated one is contagious. Give the Reflector real time (a full lunar cycle for big things) and don’t expect their consistency to match yours.',
    'Manifesting Generator|Manifesting Generator':
      'Two fast, multi-track responders — exhilarating and a little chaotic. You’ll skip steps and chase several passions together; the practice is to still wait for the gut’s yes and to tell each other before you each bolt in a new direction.',
    'Manifesting Generator|Manifestor':
      'Both can move fast and both can initiate — lots of forward motion, and lots of blindsiding if neither informs. The Manifesting Generator does best responding first rather than pure-initiating; both of you should say what you’re about to do before you do it.',
    'Manifesting Generator|Projector':
      'The Manifesting Generator is a blur of activity; the Projector can see exactly where that energy is being wasted — invaluable, if the MG slows enough to be guided and the Projector waits to be invited. Mutual recognition keeps it from sliding into nag-and-ignore.',
    'Manifesting Generator|Reflector':
      'The MG’s fast, multi-directional aura is a lot for a Reflector to sample. Protect the Reflector’s environment and pace, let them take a lunar cycle while you keep moving, and don’t read their changeability as flakiness.',
    'Manifestor|Manifestor':
      'Two initiators with closed, impactful auras — powerful, and potentially explosive. The whole game is informing: tell each other before you act, or you’ll keep colliding. Give each other genuine independence.',
    'Manifestor|Projector':
      'The Manifestor initiates, the Projector guides — excellent when the Manifestor informs and actually wants the Projector’s read, hard when the Manifestor bulldozes past it. The Projector has to wait to be asked rather than steering uninvited.',
    'Manifestor|Reflector':
      'The Manifestor’s impactful aura strongly colours the sampling Reflector, so an informing, considerate Manifestor matters enormously here. Inform before acting, protect the Reflector’s space, and let them have their lunar-cycle time.',
    'Projector|Projector':
      'Two seers, neither carrying sustainable life-force — deep mutual recognition when you invite and truly see each other, mutual depletion when you both push for recognition you’re not getting. Guard rest and wait for the real invitations.',
    'Projector|Reflector':
      'Two non-energy types, both sensitive and easily drained — perceptive and gentle together, but fragile around environment and recognition. Choose your settings with care, rest often, and give the Reflector their cycle and the Projector their invitations.',
    'Reflector|Reflector':
      'Two mirrors, sampling each other and the environment — rare and tender. Your shared surroundings are everything: in a healthy place you delight each other, in a wrong one you amplify the disappointment. Move slowly, decide over lunar cycles.',
  };

  // Joint decision tempo — keyed by the most deliberate authority present.
  const AUTH_FRAGMENT = {
    'Lunar':
      'Because one of you is a Reflector, give every important shared decision a full lunar cycle (~28 days). Talk it through across the moon’s phases and trust only what stays consistent the whole way round — rushing is the one real danger.',
    'Emotional':
      'Because at least one of you rides an emotional wave, treat shared decisions as sleep-on-it by default. No big yes or no in the heat of a high or a low — let the feeling settle, revisit it, and decide together from the calm.',
    'Mental (Environmental)':
      'With a mental / environmental authority in the mix, decide out loud and together, in the right setting — not alone in your heads. Talk it through with each other and trusted others and weigh where you are; the right environment makes the right choice obvious.',
    'Self-Projected':
      'One of you finds truth by hearing their own voice. Make room to talk it all the way out without steering each other — the answer surfaces in the saying, not in the advice.',
    'Ego':
      'With an ego / heart authority involved, a shared decision only holds if the will is genuinely behind it. Ask each other plainly: do we actually want this, and are we willing to spend our energy on it? If the heart isn’t in it, it isn’t yours to do.',
    'Splenic':
      'Both of you can read a situation in the moment — trust the quiet, first, in-the-moment knowing rather than talking yourselves out of it. The spleen speaks once and softly; catch it together the first time.',
    'Sacral':
      'Both of you have a reliable gut, so decide by asking each other clear yes/no questions and trusting the immediate sound of the response — not the reasoning that rushes in a second later.',
  };

  // Centre conditioning templates. {A}/{B} = names, {theme} = the centre's short theme.
  const CENTRE_CONDITION = {
    AtoB: '{A} consistently colours {B} here — {B} takes in and amplifies {A}’s {theme}. Real wisdom for {B} over time; quiet conditioning if it goes unnoticed.',
    BtoA: '{B} consistently colours {A} here — {A} takes in and amplifies {B}’s {theme}. Real wisdom for {A} over time; quiet conditioning if it goes unnoticed.',
    shared: 'Stable shared ground — you both radiate a consistent {theme} and meet each other as equals here.',
    open: 'You’re both open here — together you amplify the {theme} of whatever room you’re in (and each other). Great sensitivity, or shared distortion if the setting is wrong.',
  };

  // Short theme word per centre, for the conditioning sentences.
  const CENTRE_THEME = {
    Head: 'mental pressure and questions',
    Ajna: 'way of thinking and certainty',
    Throat: 'voice and way of acting',
    Self: 'sense of identity and direction',
    Heart: 'willpower and sense of worth',
    Spleen: 'instinct and sense of wellbeing',
    Sacral: 'work-energy and life-force',
    SolarPlexus: 'emotional weather and mood',
    Root: 'drive and sense of pressure',
  };

  // Overall texture, from the dominant connection type.
  const TEXTURE = {
    electromagnetic: { label: 'Magnetic & complementary', note: 'Lots of spark — you switch each other on. Lean into it, and expect the same circuits to run hot.' },
    companionship: { label: 'Alike & easy', note: 'You share a lot of native wiring — quick recognition and comfort, with a few shared blind spots.' },
    dominance: { label: 'One leads, one learns', note: 'Several themes one of you simply carries for the other. Generative when named, lopsided when unconscious.' },
    compromise: { label: 'Spiky & growthful', note: 'A lot of half-shared circuits — the richest growth edges, and the easiest places to chafe.' },
    none: { label: 'Spacious & lightly wired', note: 'Few hard channel connections — more open space between you. Your types, authorities and centres carry the story here.' },
  };

  const RELATIONAL_FRAME = 'This is a mirror for two, not a verdict on a relationship. Every line is a hypothesis to test against your actual experience of each other — your lived relationship is the territory; this is only the map.';

  g.VersorCompatCodes = {
    CONNECTION_TYPES, TYPE_PAIR, AUTH_FRAGMENT, CENTRE_CONDITION, CENTRE_THEME, TEXTURE, RELATIONAL_FRAME,
  };
})(window);
