/* blueprint-detail.js — deepening layer: richer per-gate paragraphs, the 36
   channel meanings, and longer Type/Authority "how to use this" guidance.

   ORIGINAL CONTENT. Gate paragraphs expand each gate's essence through its
   Shadow→Gift→Siddhi arc. Channel meanings are compositional — built from the
   two gates' themes (public-domain I Ching) and the centres they bridge. Type
   and Authority guidance is functional plain language. None of it reproduces
   Gene Keys / Human Design copyrighted descriptive text. Merged into
   window.VersorCodes (loads after blueprint-codes.js). */
(function (g) {
  'use strict';

  // Richer paragraph per gate (expands the one-line essence).
  const GATE_DETAIL = {
    1: 'The engine of pure origination — the urge to bring into the world something that has never existed. In Shadow it stalls, waiting to feel "ready" and mistaking inertia for preparation; as a Gift it simply begins, giving the new a form. At its height it creates for the sheer joy of it, beauty pouring through with no agenda.',
    2: 'The receptive keeper of direction — it does not push, it knows. In Shadow it feels lost and pulled off course by others; as a Gift it relaxes and a clear sense of "this way" surfaces from within. At its height there is no separation between you and the path; you and the whole move as one.',
    3: 'The friction of any true beginning, where raw potential has not yet found its form. In Shadow it drowns in the initial chaos and freezes; as a Gift it patiently turns confusion into workable order. At its height new structure arrives effortlessly, innocent and alive.',
    4: 'The mind that wants an answer for everything. In Shadow it grabs a premature certainty just to end the discomfort of not-knowing; as a Gift it can hold the question open until a real understanding forms. At its height it makes peace with mystery itself.',
    5: 'A fixed inner rhythm and the instinct for right timing. In Shadow it grows anxious and forces the moment; as a Gift it trusts its own pace and waits without strain. At its height it moves in a timeless flow where the right action and the right moment are the same.',
    6: 'The emotional membrane between self and other — what you let in and what you keep out. In Shadow it becomes abrasive conflict; as a Gift it negotiates closeness with care and discernment. At its height it holds a peace that needs no defending.',
    7: 'The one who steers the group — leadership through influence rather than force. In Shadow it divides and controls; as a Gift it guides others toward a shared aim. At its height leadership becomes pure service, the leader almost invisible behind the goal.',
    8: 'The drive to contribute your one authentic note to the whole. In Shadow it dulls into conformity, blending in to be safe; as a Gift it offers its true individual style. At its height individuality becomes art that lifts everyone.',
    9: 'Power gathered by attention to detail. In Shadow it scatters, pulled off by everything; as a Gift it concentrates and finishes what it starts. At its height it becomes mastery of the small that the big depends on.',
    10: 'How you walk through life — self-love expressed as conduct. In Shadow it betrays itself to belong; as a Gift it behaves as its true self regardless. At its height there is nothing left to prove, only being.',
    11: 'A storehouse of ideas seeking meaning. In Shadow the mind fills with noise and conceptual clutter; as a Gift it holds ideas that genuinely inspire. At its height it sees a vision lit from within and shares the light.',
    12: 'The pause that lets expression ripen before it is spoken. In Shadow it is self-conscious and guarded, or vain; as a Gift it speaks only when the word is true and the moment is right. At its height its words carry pure clarity.',
    13: 'The keeper others confide in — a gatherer of stories and secrets. In Shadow it breeds discord or leaks what was entrusted; as a Gift it listens in a way that draws out the truth. At its height it becomes boundless compassion, holding the whole human story.',
    14: 'The fuel and competence that back your direction. In Shadow it sells out for security; as a Gift it skillfully commands its resources toward what matters. At its height abundance simply flows, in service of the larger aim.',
    15: 'The wide embrace that holds the extremes of the human range. In Shadow it goes flat or swings erratically; as a Gift it finds a magnetic, humane rhythm. At its height it becomes the full flowering of humanity, at home with every kind of person.',
    16: 'Talent set alight by enthusiasm. In Shadow it goes through the motions, half-hearted; as a Gift enthusiasm is refined into real, repeatable skill. At its height mastery looks like play.',
    17: 'The mind organizing the world into a view. In Shadow it clings to fixed opinions; as a Gift it sees the pattern others miss and stays far-sighted. At its height the mind opens to all of it without needing to be right.',
    18: 'The instinct to fix and improve what has gone wrong. In Shadow it turns to harsh, perfectionistic judgment; as a Gift it corrects with integrity, restoring what was off. At its height it serves a wholeness larger than the flaw.',
    19: 'Sensitivity to what people — and you — need in order to belong. In Shadow it clings needily to be wanted; as a Gift it attunes with exquisite sensitivity. At its height it gives itself for the whole.',
    20: 'Awareness alive only in the present moment. In Shadow it hides in busyness and is never quite here; as a Gift it is fully present, awake to now. At its height awareness becomes aware of itself.',
    21: 'The will to manage and protect your own domain. In Shadow it becomes a domineering need to control; as a Gift it exercises rightful authority. At its height its courage is entirely in service.',
    22: 'Emotional openness expressed as social grace. In Shadow it shuts down or grows inhibited; as a Gift it meets others with real graciousness. At its height grace needs no occasion — it simply radiates.',
    23: 'The translator who turns private insight into plain language. In Shadow it fragments into baffling complexity; as a Gift it makes the complex simple. At its height it catches the essence in a single stroke.',
    24: 'The mind circling back to make sense of mystery. In Shadow it loops, addicted to the same thought; as a Gift each return brings a genuinely fresh take. At its height it rests in the silence beyond thinking.',
    25: 'Love of life for its own sake — the spirit of the self. In Shadow the heart armors over and grows defensive; as a Gift it lives in innocent, open-hearted love. At its height that love becomes utterly unconditional.',
    26: 'The will that magnifies and transmits — the salesperson of the psyche. In Shadow it manipulates and embellishes out of pride; as a Gift it influences artfully and honestly. At its height its impact leaves no trace of self.',
    27: 'The instinct to nourish and protect. In Shadow it depletes through self-interest or smothering over-care; as a Gift it nourishes self and others in balance. At its height it becomes selfless devotion that still keeps itself whole.',
    28: 'The search for a life worth the struggle. In Shadow it is gripped by dread of meaninglessness; as a Gift it embraces risk for what genuinely matters. At its height it holds life and death lightly.',
    29: 'The power of the wholehearted yes. In Shadow it over-commits and drowns in overwhelm; as a Gift it says yes and goes all the way in. At its height commitment becomes a devotion that carries it through anything.',
    30: 'The fire of feeling and longing. In Shadow it is consumed by craving and mood; as a Gift its desire fuels clean aspiration. At its height it feels fully without being burned.',
    31: 'The voice that leads by speaking for the group. In Shadow its authority rings hollow and self-serving; as a Gift it genuinely gives the collective its voice. At its height leadership is emptied of ego.',
    32: 'The instinct for what will last. In Shadow it is gripped by the fear of failing; as a Gift it knows what is worth preserving and builds for endurance. At its height it holds a deep reverence for the enduring.',
    33: 'The retreat that digests experience into meaning. In Shadow it avoids and buries the past; as a Gift it steps back to reflect and recount. At its height private experience becomes revelation for others.',
    34: 'Raw available power, the strongest pure energy in the system. In Shadow it spends itself on busyness and force; as a Gift it expresses strength through genuine response. At its height power becomes natural majesty.',
    35: 'Progress driven by the appetite for experience. In Shadow it is restless and never satisfied; as a Gift it metabolizes experience into wisdom. At its height it is full, with nowhere left to get to.',
    36: 'The dive into emotional depth and change. In Shadow it is thrown by turbulence and crisis; as a Gift it meets the dark with humanity. At its height crisis forges a deep compassion.',
    37: 'The warmth of friendship, family, and belonging. In Shadow it becomes fragile, dependent attachment; as a Gift it builds bonds on equal footing. At its height its tenderness holds everyone in.',
    38: 'The stand you take against resistance. In Shadow it struggles for the sake of struggling; as a Gift it perseveres for what truly matters. At its height it stands in a quiet, settled honor.',
    39: 'The provocateur that stirs spirit and feeling. In Shadow it needles just to get a reaction; as a Gift it awakens aliveness in what has gone flat. At its height it is the jolt that frees.',
    40: 'The will that provides — and must also rest. In Shadow it runs on empty and cannot say no; as a Gift it works willingly, then genuinely withdraws to recover. At its height its will is aligned with something larger than itself.',
    41: 'The seed-pressure that begins each new cycle of feeling. In Shadow it escapes into fantasy; as a Gift it honors the fertile first stirring of new desire. At its height it feels experience as it first arises, fresh and clean.',
    42: 'The power to see things through to completion. In Shadow it grasps and cannot let cycles end; as a Gift it sees the experience all the way through. At its height every ending becomes a celebration.',
    43: 'Sudden inner knowing, ahead of explanation. In Shadow it is deaf to insight and mentally stuck; as a Gift the breakthrough arrives unbidden. At its height it is pure, clear seeing — epiphany.',
    44: 'An instinctive read on patterns and people. In Shadow it reads others in order to manipulate; as a Gift it senses exactly whom to work with. At its height the right alliance forms effortlessly.',
    45: 'The leader who gathers people and resources together. In Shadow it hoards and rules over others; as a Gift it gathers and shares the wealth. At its height the many become one.',
    46: 'Love of life lived through the body and senses. In Shadow effort turns heavy and joyless; as a Gift it delights in being embodied. At its height the body itself becomes a place of grace.',
    47: 'The mind making sense of confusion, usually in hindsight. In Shadow it is oppressed by mental fog; as a Gift comes the moment it finally clicks. At its height confusion is transfigured into meaning.',
    48: 'A deep well of capability and skill. In Shadow it is haunted by the fear there is not enough in it; as a Gift it draws on genuine depth. At its height it offers a wisdom that never runs dry.',
    49: 'The instinct for necessary, principled change. In Shadow it rejects and reacts blindly; as a Gift it changes what no longer serves, on principle. At its height it brings rebirth from the inside out.',
    50: 'The steward of the values a community lives by. In Shadow it is corrupted or crushed by responsibility; as a Gift it holds those values in balance. At its height it upholds a harmony that protects everyone.',
    51: 'The thunderclap that jolts you awake. In Shadow it is rattled and thrown by the unexpected; as a Gift it finds the courage to go first. At its height shock becomes the doorway to the sacred — a sudden, total aliveness.',
    52: 'The power to stop, be still, and concentrate. In Shadow stillness becomes tense, pent-up stress; as a Gift it restrains and focuses with ease. At its height it rests in a deep, motionless calm.',
    53: 'The drive to begin new cycles of development. In Shadow it is restless, pressured to start; as a Gift it brings steady energy for new growth. At its height it is endless, patient unfolding.',
    54: 'The drive to rise and transform your station. In Shadow it grasps, ambition fueled by lack; as a Gift it rises with clean motivation. At its height it ascends into the unseen, the worldly climb becoming a spiritual one.',
    55: 'Emotional fullness and the freedom within feeling. In Shadow it is moody, at the mercy of its emotions; as a Gift it lives in emotional richness and freedom. At its height the spirit simply overflows.',
    56: 'The seeker and teller of stories. In Shadow it is scattered by endless stimulation; as a Gift it enriches others through the tale. At its height its meaning becomes intoxicating.',
    57: 'Penetrating intuition in the present moment. In Shadow it is uneasy and second-guesses the gut; as a Gift it trusts its quiet intuitive knowing. At its height that knowing becomes immediate, luminous clarity.',
    58: 'The aliveness that drives the improvement of life. In Shadow it nags with chronic dissatisfaction; as a Gift its vitality wants to make things better. At its height it is a causeless joy.',
    59: 'The drive to dissolve distance and create intimacy. In Shadow it uses charm to get past defenses; as a Gift it breaks barriers into real closeness. At its height nothing is hidden between you.',
    60: 'The acceptance of limits as the seedbed of the new. In Shadow it is stuck, hardened by limitation; as a Gift it turns constraint into new form. At its height it perceives the just order running through all things.',
    61: 'The inner pressure to know why — the mystic\'s gate. In Shadow it spins obsessively on the unknowable; as a Gift that pressure becomes inspiration. At its height it touches the sacred unknown directly.',
    62: 'The naming and ordering of detail. In Shadow it chills into cold, pedantic over-precision; as a Gift it expresses with useful exactness. At its height it finds the perfect word for the thing.',
    63: 'The doubt that checks the pattern. In Shadow it corrodes into anxious, undermining doubt; as a Gift it questions rigorously and verifies. At its height doubt resolves into truth.',
    64: 'The mind sifting many possibilities before they resolve. In Shadow it is lost in foggy, pressured confusion; as a Gift imagination sorts the maybes. At its height comes the flash that suddenly makes it all clear.',
  };

  // 36 channels — { name, detail }. Keys match activeChannels ("a-b", a<b).
  const CHANNEL_INFO = {
    '1-8': { name: 'The Creative Voice', detail: 'Links your sense of self (G) to expression (Throat). A consistent drive to give your individual creativity a public form — to be seen for your unique contribution and to inspire others to play their own note.' },
    '2-14': { name: 'The Helm', detail: 'Links direction (G) to life-force resources (Sacral). A steady channel that steers your energy and means toward where your life is meant to go — the keeper of the direction with the fuel to follow it.' },
    '3-60': { name: 'Mutation', detail: 'Links new ordering (Sacral) to limitation (Root). A pulse that turns pressure and constraint into innovation — change that comes in its own time and cannot be rushed.' },
    '4-63': { name: 'Logic', detail: 'Links the answering mind (Ajna) to doubt (Head). A mental loop that questions a pattern and works toward a sound, provable answer — built for testing whether things hold up.' },
    '5-15': { name: 'Natural Rhythm', detail: 'Links timing (Sacral) to the wide human range (G). A consistent, life-giving rhythm and flow — habits and timing that, when honored, keep you in the natural current of life.' },
    '6-59': { name: 'Intimacy', detail: 'Links the emotional boundary (Solar Plexus) to intimacy (Sacral). The drive to break through to deep bonding and intimacy — emotional and creative fertility between people.' },
    '7-31': { name: 'Leadership', detail: 'Links the role of leading (G) to the leading voice (Throat). The capacity to guide the group by speaking for it — leadership earned through influence, voiced for the collective good.' },
    '9-52': { name: 'Focused Concentration', detail: 'Links focus (Sacral) to stillness (Root). The power to sit still and concentrate energy on detail until something is completed — determination that finishes what it starts.' },
    '10-20': { name: 'Awakening', detail: 'Links self-conduct (G) to the present (Throat). Being authentically yourself, in the now, expressed — the channel of "I am that I am," conduct and presence made visible.' },
    '10-34': { name: 'Conviction', detail: 'Links self-conduct (G) to pure power (Sacral). Power placed behind being true to yourself — energy that follows conviction and explores life on its own terms.' },
    '10-57': { name: 'Perfected Survival', detail: 'Links self-conduct (G) to instinct (Spleen). Survival and wellbeing through being authentically yourself — intuition guiding right behavior in the moment.' },
    '11-56': { name: 'The Storyteller', detail: 'Links ideas (Ajna) to expression (Throat). A stream of ideas shaped into stories worth telling — curiosity that stimulates and teaches through narrative.' },
    '12-22': { name: 'Open Expression', detail: 'Links the cautious voice (Throat) to the open heart (Solar Plexus). Emotionally tuned, socially graceful expression — a voice that opens (or closes) with the mood and lands with feeling.' },
    '13-33': { name: 'The Witness', detail: 'Links the listener (G) to retreat (Throat). Gathering others\' experiences and stories, then withdrawing to reflect and recount them — the keeper of the collective memory.' },
    '16-48': { name: 'Talent and Depth', detail: 'Links the skilled leap (Throat) to the deep well (Spleen). Real skill expressed from genuine depth — enthusiasm grounded in mastery rather than performance.' },
    '17-62': { name: 'Organized Detail', detail: 'Links the organizing view (Ajna) to precise detail (Throat). Opinions and patterns expressed with supporting detail — the mind that arranges things into a communicable order.' },
    '18-58': { name: 'Improvement', detail: 'Links correction (Spleen) to joy (Root). The drive to improve and perfect life, fueled by vitality — a love of life expressed as the urge to make it better.' },
    '19-49': { name: 'Sensitivity', detail: 'Links reaching for belonging (Root) to principled change (Solar Plexus). Deep attunement to needs and principles — sensitivity to what people (and bodies) require to belong, and when a bond must change.' },
    '20-34': { name: 'Charisma', detail: 'Links the present (Throat) to pure power (Sacral). Power expressed in the now — busy, magnetic doing; energy that turns directly into present-moment action.' },
    '20-57': { name: 'The Brainwave', detail: 'Links the present (Throat) to intuition (Spleen). Intuitive clarity voiced in the moment — knowing what to do or say right now, almost before you think it.' },
    '21-45': { name: 'Material Authority', detail: 'Links the steward (Heart) to the gatherer (Throat). Rightful control over resources and territory — the will to manage material life and the voice to govern the group\'s wealth.' },
    '23-43': { name: 'Insight to Words', detail: 'Links the translator (Throat) to inner knowing (Ajna). Individual insight made articulate — the genius that can put a private breakthrough into language others can grasp.' },
    '24-61': { name: 'The Thinker', detail: 'Links the returning mind (Ajna) to the mystery (Head). Mental pressure to know turned over and over until it resolves — the inspiration-and-rationalization loop of the deep thinker.' },
    '25-51': { name: 'Initiation', detail: 'Links the spirit of self (G) to shock (Heart). Shock that cracks the heart open to spirit — being thrown into experiences that initiate you into a deeper love of life.' },
    '26-44': { name: 'The Transmitter', detail: 'Links the persuader (Heart) to instinct for people (Spleen). Will plus instinct to deliver the message — knowing what people need and having the will to surrender it to them at the right moment.' },
    '27-50': { name: 'Preservation', detail: 'Links the caretaker (Sacral) to values (Spleen). Care backed by protective values — nourishing and safeguarding the community and the next generation.' },
    '28-38': { name: 'The Struggle', detail: 'Links risk (Spleen) to the worthy fight (Root). The fight to find a life worth living — stubborn struggle that, aimed well, becomes purpose and meaning.' },
    '29-46': { name: 'Discovery', detail: 'Links the wholehearted yes (Sacral) to embodiment (G). Total commitment expressed through the body — saying yes and being so present that you succeed where others give up.' },
    '30-41': { name: 'Recognition', detail: 'Links longing (Solar Plexus) to the first spark (Root). The dream and the desire that fuels it — feeling-driven aspiration that starts each new cycle of experience.' },
    '32-54': { name: 'Transformation', detail: 'Links endurance (Spleen) to the climb (Root). Ambition instinctively aimed at what will last — the drive to rise and transform, checked by a sense of what is worth building.' },
    '34-57': { name: 'Instinctive Power', detail: 'Links pure power (Sacral) to intuition (Spleen). Power guided by intuition in the moment — strength that acts on a quiet, immediate knowing rather than thought.' },
    '35-36': { name: 'The Wanderer', detail: 'Links progress (Throat) to emotional depth (Solar Plexus). The hunger for experience expressed and felt — a craving to do and feel everything, learning through the highs and lows.' },
    '37-40': { name: 'Community', detail: 'Links the family bond (Solar Plexus) to the provider\'s will (Heart). Belonging held by warmth and will — the bargain of community, where loyalty and provision keep the bonds strong.' },
    '39-55': { name: 'Emoting', detail: 'Links the provoker (Root) to the abundant heart (Solar Plexus). Provocation of spirit and feeling — moods and edge that, expressed creatively, generate emotional richness.' },
    '42-53': { name: 'Maturation', detail: 'Links the completer (Sacral) to the starter (Root). Full cycles begun and seen through to the end — the energy to start things and the discipline to finish them, growing through completion.' },
    '47-64': { name: 'Abstraction', detail: 'Links the realizer (Ajna) to possibility (Head). Mental pressure to make sense of the past and the many possibilities — confusion that, given time, resolves into realization.' },
  };

  // Type — longer "how to actually use this".
  const TYPE_GUIDE = {
    'Manifestor': 'Your power is in initiating, and the friction in your life comes from people feeling blindsided by your moves. The practice is simple and hard: before you act on an urge, inform whoever it will affect — not to ask permission, but to clear the path of resistance. Honor your bursts of energy followed by rest, protect your independence, and when you inform and then move, the anger that is your warning signal gives way to peace.',
    'Generator': 'Your gut, not your mind, runs your life correctly. Stop initiating from the head; instead let life present things and notice the body\'s response — the lift toward a yes, the contraction of a no. Commit only to what you genuinely respond to and the energy stays sustainable and the work satisfying; override the gut and you hit the frustration that signals you are in the wrong thing.',
    'Manifesting Generator': 'You are a fast, multi-track builder — respond first like a Generator, then inform like a Manifestor before you leap. Expect to skip steps and circle back; for you that is efficient, not a flaw. Honor several passions rather than forcing one lane, and let the gut\'s yes plus a quick heads-up to others clear the way; satisfaction and peace are your green lights, frustration and anger your signs you have forced a single track.',
    'Projector': 'You are built to guide, not to grind — your gift is seeing people and systems clearly, but it only lands when you are recognized and invited into the big things. Manage your energy (you do not carry sustainable life-force fuel), study what genuinely fascinates you, and wait for the real invitation rather than pushing in. When seen and used well you feel successful; chronic bitterness is the sign you are forcing recognition or overworking.',
    'Reflector': 'You are a rare mirror of your community\'s health — what you experience reflects the environment far more than a fixed inner nature. Your single most important choice is where, and with whom, you live and work. Give big decisions a full lunar cycle before committing, and guard your sensitivity fiercely; surprise and delight tell you the environment is healthy, disappointment that it is not.',
  };

  // Authority — longer "how to actually use this".
  const AUTH_GUIDE = {
    'Emotional': 'There is no truth in the now for you — only a feeling that will look different tomorrow. Sleep on anything important; ride the emotional wave through its high and its low and see what still feels right once it settles. The cost of deciding inside a spike (of excitement or of despair) is the regret that follows — patience itself is your authority.',
    'Sacral': 'Your authority is the gut response that fires the instant something is put to you — a spontaneous lift toward yes or pullback toward no, felt in the body before the mind explains. Have people ask you yes/no questions and trust that immediate sound, not the reasoning that rushes in a moment later.',
    'Splenic': 'Your authority speaks once, quietly, in the present — a soft intuitive knowing about what is safe or right, never repeated and never loud. It will not argue with your mind, so the whole practice is to catch it and honor it the first time; second-guessing is how it gets missed.',
    'Ego': 'Your truth lives in the willpower and the heart — a decision only holds when you genuinely want it and are willing to spend your energy on it. Listen for what you actually say out loud about what you want; if the will is not behind it, it is not yours to do.',
    'Self-Projected': 'Your clarity comes through your own voice — you have to talk it out and hear what you say to find your truth. Find trusted people who let you think aloud without steering you; the answer is in your words, not in their advice.',
    'Mental (Environmental)': 'You have no reliable gut or emotional signal, so do not decide alone in your head. Talk things through with trusted sounding-boards and weigh environment heavily — the right place and people make the right choice obvious. Your clarity is relational and gathered over time, never a private verdict.',
    'Lunar': 'As a Reflector, give any major decision a full lunar cycle (~28 days). Talk it through with different people and watch how the choice feels across the moon\'s phases; what stays consistent through the whole cycle is what you can trust. Rushing is the one real danger.',
  };

  g.VersorCodes = Object.assign(g.VersorCodes || {}, { GATE_DETAIL, CHANNEL_INFO, TYPE_GUIDE, AUTH_GUIDE });
})(window);
