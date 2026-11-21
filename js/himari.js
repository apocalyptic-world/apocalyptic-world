/**
 * Himari (0.92): Negan's "special order" at the Sanctuary. One table drives her 19 story events, the Journal hint,
 * the cheat-menu jumps and the container tile.
 *
 * Canon (user): a virgin delivered to Negan in a shipping container for a client nobody has seen. Nobody may look at
 * or touch her; Negan himself only touches her face and breasts and shows her off. She speaks only Japanese at first
 * and keeps quiet around her captors. No romance with the player yet: the arc exists to make the player hate Negan.
 *
 * State, all on $characters.himari (created in the first event, so old saves need no conversion):
 *   quests.<step>_day     day each story step fired (only the _day key, never a boolean)
 *   quests.guard_reply    'stepped_in' | 'told_negan' | 'walked_away'      (The Guard)
 *   quests.wrists_reply   'held' | 'refused'                               (The Inspection)
 *   quests.heat_cured_day / heat_late_day / heat_late_paid                 (Heat Sick: antibiotics within 3 days)
 *   quests.tub_reply      'back_turned' | 'peeked'                         (The Tin Tub)
 *   quests.show_reply     'performed' | 'refused'                          (The Show)
 *   quests.punished_day   last repeat punishment after The Lesson
 *   quests.talk_day / teach_day / feed_day / job_day   once-a-day container actions
 *   trust      0..100   what she lets you see of her (talk, words, food, events)
 *   attention  0..100   Negan's attention on your kindness; -3 a night; 60 = The Lesson (first time) or a repeat
 *                       punishment (later). She pays, you get fined after the first time.
 *   words      array of PHRASEBOOK keys the player has learned (Journal phrasebook)
 */
setup.himari = setup.himari || {};

setup.himari.ATTENTION_LIMIT = 60;
setup.himari.ATTENTION_DECAY = 3;
setup.himari.HEAT_DAYS = 3;          // antibiotics deadline
setup.himari.HEAT_FINE = 100;        // caps Negan takes when you were late
setup.himari.PUNISH_FINE = 100;      // caps for every repeat punishment after The Lesson
setup.himari.JOB_PAY = 20;           // handler rounds, once a day

/*
 * Story steps in order. place: where the event can fire ('sanctuary' = arriving at the Sanctuary, 'office' = Negan's
 * office, 'bar' = underground city bar). from/to: time window. gap: days after the previous step.
 */
setup.himari.STEPS = [
    { id: 'delivery',   passage: 'Himari - The Delivery',        place: 'sanctuary', from: '08:00', to: '19:59', gap: 0,
      hint: 'Visit the Sanctuary during the day. A truck was expected in the yard.' },
    { id: 'prize',      passage: 'Himari - The Prize',           place: 'office',    from: '08:00', to: '19:59', gap: 1,
      hint: "Negan wanted to show you something. Visit his office." },
    { id: 'guard',      passage: 'Himari - The Guard',           place: 'sanctuary', from: '16:00', to: '19:59', gap: 1,
      hint: 'Visit the Sanctuary in the late afternoon (16:00-20:00).' },
    { id: 'hand',       passage: 'Himari - The Price of a Hand', place: 'sanctuary', from: '08:00', to: '19:59', gap: 1,
      hint: 'Visit the Sanctuary during the day. Negan had a point to make.' },
    { id: 'errand',     passage: 'Himari - Errand Boy',          place: 'office',    from: '08:00', to: '19:59', gap: 1,
      hint: "Visit Negan's office. He had a job for you." },
    { id: 'water',      passage: 'Himari - First Duty',          place: 'sanctuary', from: '08:00', to: '17:59', gap: 1,
      hint: 'Visit the Sanctuary before 18:00 for your first handler duty.' },
    { id: 'inspection', passage: 'Himari - The Inspection',      place: 'sanctuary', from: '08:00', to: '19:59', gap: 2,
      hint: 'Wait a couple of days, then visit the Sanctuary during the day.' },
    { id: 'heat',       passage: 'Himari - Heat Sick',           place: 'sanctuary', from: '10:00', to: '19:59', gap: 2,
      hint: 'Wait a couple of days, then visit the Sanctuary during the day.' },
    { id: 'airhole',    passage: 'Himari - The Air Hole',        place: 'sanctuary', from: '21:00', to: '03:59', gap: 1,
      needs: q => !!q.heat_cured_day,
      hint: 'Visit the Sanctuary at night (21:00-04:00).' },
    { id: 'drawing',    passage: 'Himari - The Drawing',         place: 'sanctuary', from: '08:00', to: '19:59', gap: 1,
      hint: 'Visit the Sanctuary during the day.' },
    { id: 'onehand',    passage: 'Himari - One Hand',            place: 'bar',       from: '18:00', to: '01:59', gap: 1,
      hint: "Negan's men drank at the underground city bar. Go there in the evening (18:00-02:00)." },
    { id: 'tub',        passage: 'Himari - The Tin Tub',         place: 'sanctuary', from: '08:00', to: '19:59', gap: 2,
      hint: 'Wait a couple of days, then visit the Sanctuary during the day.' },
    { id: 'drinks',     passage: 'Himari - Serving Drinks',      place: 'office',    from: '12:00', to: '19:59', gap: 2,
      hint: "Visit Negan's office in the afternoon. He had a guest coming." },
    { id: 'collar',     passage: 'Himari - The Collar',          place: 'office',    from: '08:00', to: '19:59', gap: 2,
      hint: "Visit Negan's office. He had something for her." },
    { id: 'kept',       passage: 'Himari - Kept',                place: 'sanctuary', from: '08:00', to: '19:59', gap: 2,
      hint: 'Wait a couple of days, then visit the Sanctuary during the day.' },
    { id: 'rations',    passage: 'Himari - Rations',             place: 'sanctuary', from: '08:00', to: '19:59', gap: 2,
      hint: 'Wait a couple of days, then visit the Sanctuary during the day.' },
    { id: 'lesson',     passage: 'Himari - The Lesson',          place: 'sanctuary', from: '16:00', to: '19:59', gap: 2,
      hint: 'Visit the Sanctuary in the late afternoon (16:00-20:00).' },
    { id: 'show',       passage: 'Himari - The Show',            place: 'office',    from: '17:00', to: '19:59', gap: 2,
      hint: "Negan invited you to his office in the evening (17:00-20:00)." },
    { id: 'name',       passage: 'Himari - Your Name',           place: 'sanctuary', from: '08:00', to: '19:59', gap: 3,
      hint: 'Wait a few days, then visit the Sanctuary during the day.' }
];

/*
 * Words the player can learn. Event words are learned in that event; the rest come from "Teach her words" at the
 * container, one a day, in this order. The Japanese must stay correct: readers of Japanese will notice.
 */
setup.himari.PHRASEBOOK = {
    onegai:    { jp: 'お願い',       romaji: 'onegai',        en: 'please' },
    yamete:    { jp: 'やめて',       romaji: 'yamete',        en: 'stop' },
    namae:     { jp: '名前',         romaji: 'namae',         en: 'name' },
    itai:      { jp: '痛い',         romaji: 'itai',          en: 'it hurts' },
    okaasan:   { jp: 'お母さん',     romaji: 'okaasan',       en: 'mom' },
    ie:        { jp: '家',           romaji: 'ie',            en: 'home' },
    mizu:      { jp: '水',           romaji: 'mizu',          en: 'water' },
    arigatou:  { jp: 'ありがとう',   romaji: 'arigatou',      en: 'thank you' },
    tabemono:  { jp: '食べ物',       romaji: 'tabemono',      en: 'food' },
    samui:     { jp: '寒い',         romaji: 'samui',         en: 'cold' },
    kowai:     { jp: '怖い',         romaji: 'kowai',         en: 'scared' },
    daijoubu:  { jp: '大丈夫',       romaji: 'daijoubu',      en: "it's okay" },
    umi:       { jp: '海',           romaji: 'umi',           en: 'sea' },
    hoshi:     { jp: '星',           romaji: 'hoshi',         en: 'star' },
    tasukete:  { jp: '助けて',       romaji: 'tasukete',      en: 'help me' },
    oyasumi:   { jp: 'おやすみ',     romaji: 'oyasumi',       en: 'good night' }
};
setup.himari.TEACH_ORDER = ['mizu', 'arigatou', 'tabemono', 'samui', 'kowai', 'daijoubu', 'umi', 'hoshi', 'tasukete', 'oyasumi'];

/* ---------- state ---------- */

setup.himari.npc = function () {
    return variables().characters?.himari ?? null;
};

setup.himari.isMet = function () {
    return !!setup.himari.npc() && isMetChar('himari');
};

/**
 * Her fixed identity as a full NPC (like isabelNpcInit for Isabel). The story owns her: she can't be talked to in
 * English, fucked or punished through the generic NPC actions, and she is not placed in any home location, so the
 * generic choosers (which list characters per location in PassageReady) never pick her.
 */
setup.himari.IDENTITY = {
    id: 'himari', name: 'Himari', gender: 0,
    race: 'asian', naturalHair: 'black', hair: 'black', eyes: 'brown',
    breasts: 'big', beauty: 95,
    corruption: 0, sub: 40, traits: [], skills: [], personality: [], strength: 5, endurance: 0,
    likesGuys: true, likesGirls: false, likesTGuys: false, likesTGirls: false,
    canTalk: false, canFuck: false, canPunish: false,
    location: 'sanctuary',
    portrait: '/people/himari/avatar.png'
};

/** Create her record (first event, cheats), or upgrade an old story-only record to a full NPC. Safe to call again. */
setup.himari.ensure = function () {
    const V = variables();
    const chars = V.characters;
    const old = chars.himari ?? {};
    if (!old.birthDate) {
        // full NPC from the generic adult creator; her story fields (quests, trust, attention, words) are kept
        const npc = Object.assign(setup.humans.newAdult({ gender: 0, now: V.gameDate }), old, setup.himari.IDENTITY);
        npc.birthDate = setup.getBirthDate(26);
        setup.setToVirgin(npc);
        chars.himari = npc;
    } else if ((old.skills ?? []).length || (old.strength ?? 0) > 5) {
        // records made by the first full-NPC build carried random skills/strength from the generic creator
        Object.assign(old, { skills: [], personality: [], strength: 5 });
    }
    const h = chars.himari;
    h.quests ??= {};
    h.trust ??= 0;
    h.attention ??= 0;
    h.words ??= [];
    h.relationship = h.trust;
    return h;
};

setup.himari.q = function () {
    return setup.himari.npc()?.quests ?? {};
};

setup.himari.done = function (id) {
    return typeof setup.himari.q()[id + '_day'] !== 'undefined';
};

/** Record a story step (only the _day key, see feedback rule). */
setup.himari.mark = function (id) {
    setup.himari.ensure().quests[id + '_day'] = variables().game.day;
};

/** Does the player know her real name? (First Duty, step id 'water') */
setup.himari.nameKnown = function () {
    return setup.himari.done('water');
};

/** 0 = Japanese only, 1 = single English words, 2 = broken English. */
setup.himari.stage = function () {
    if (setup.himari.done('collar')) return 2;
    if (setup.himari.done('water')) return 1;
    return 0;
};

/** Where she is kept: 'container' until Kept, then 'cabin' below deck. */
setup.himari.where = function () {
    return setup.himari.done('kept') ? 'cabin' : 'container';
};

/** The rain punishment image for her current state: in the cabin she is in lingerie, the collar replaces the waist rope once it is on. */
setup.himari.rainImage = function () {
    const v = setup.himari.where() === 'cabin' ? 'lingerie' : (setup.himari.done('collar') ? 'collar' : 'wrists');
    return 'people/himari/lesson_rain_' + v + '.jpg';
};

setup.himari.addTrust = function (n) {
    const h = setup.himari.ensure();
    h.trust = Math.max(0, Math.min((h.trust ?? 0) + n, 100));
    h.relationship = h.trust;   // the NPC info bar shows her trust
    return h.trust;
};

setup.himari.addAttention = function (n) {
    const h = setup.himari.ensure();
    h.attention = Math.max(0, Math.min((h.attention ?? 0) + n, 100));
    return h.attention;
};

/** Learn a phrasebook word; returns true when it was new. */
setup.himari.learn = function (key) {
    const h = setup.himari.ensure();
    if (!setup.himari.PHRASEBOOK[key] || h.words.includes(key)) return false;
    h.words.push(key);
    return true;
};

/** Next word "Teach her words" gives, or null when all are known. */
setup.himari.nextTeachWord = function () {
    const h = setup.himari.ensure();
    return setup.himari.TEACH_ORDER.find(k => !h.words.includes(k)) ?? null;
};

/* ---------- story flow ---------- */

/** The story step that should fire next, ignoring place and time (null = arc finished). */
setup.himari.nextStep = function () {
    return setup.himari.STEPS.find(s => !setup.himari.done(s.id)) ?? null;
};

/** Day the latest step fired (gap counting). */
setup.himari.lastDay = function () {
    const q = setup.himari.q();
    return setup.himari.STEPS.reduce((m, s) => Math.max(m, q[s.id + '_day'] ?? -1), -1);
};

/** The arc starts 3+ days after Negan's Barter. */
setup.himari.canStart = function () {
    const nq = variables().characters?.negan?.quests;
    return !!nq?.barter_day && variables().game.day >= nq.barter_day + 3;
};

/** Is the step allowed right now (gap, time, extra condition)? place is checked by the caller. */
setup.himari.ready = function (step) {
    const day = variables().game.day;
    const q = setup.himari.q();
    if (step.id === 'delivery') {
        if (!setup.himari.canStart()) return false;
    } else {
        if (!setup.himari.isMet()) return false;
        const last = setup.himari.lastDay();
        // a story step never fires on the same day as the previous one (no same-day chains on return trips)
        if (day < last + Math.max(1, step.gap)) return false;
    }
    if (step.needs && !step.needs(q)) return false;
    return timeBetween(step.from, step.to);
};

/** Has the player been kind enough that The Lesson comes early (or a repeat punishment)? */
setup.himari.punishDue = function () {
    const h = setup.himari.npc();
    if (!h || !setup.himari.done('water')) return false;
    return (h.attention ?? 0) >= setup.himari.ATTENTION_LIMIT;
};

/**
 * Passage to send the player to from a place, or null. Called once per place passage:
 * Sanctuary.tw ('sanctuary'), Negan office.tw ('office'), underground city Bar.tw ('bar').
 */
setup.himari.next = function (place) {
    const day = variables().game.day;
    const q = setup.himari.q();
    if (place === 'sanctuary' && setup.himari.punishDue() && timeBetween('08:00', '19:59')) {
        if (!setup.himari.done('lesson')) {
            // The Lesson comes early when Negan's attention fills; never on the same day as another step
            if (setup.himari.lastDay() < day) return 'Himari - The Lesson';
        } else if (q.punished_day !== day && q.lesson_day !== day) {
            return 'Himari - Punished';
        }
    }
    const step = setup.himari.nextStep();
    if (!step || step.place !== place) return null;
    return setup.himari.ready(step) ? step.passage : null;
};

/** Journal line for the current state. */
setup.himari.journalHint = function () {
    const q = setup.himari.q();
    if (!setup.himari.isMet()) {
        return setup.himari.canStart()
            ? setup.himari.STEPS[0].hint
            : "Progress Negan's story (his barter).";
    }
    if (q.heat_day && !q.heat_cured_day) {
        return 'She was burning with fever. Bring antibiotics to the Sanctuary and give them to her at the container'
            + ' (within ' + setup.himari.HEAT_DAYS + ' days of the fever).';
    }
    const step = setup.himari.nextStep();
    if (!step) return "That's all for now.";
    return step.hint;
};

/** Words for the Journal phrasebook: [{jp, romaji, en}] in learning order. */
setup.himari.phrasebook = function () {
    const h = setup.himari.npc();
    if (!h) return [];
    return (h.words ?? []).map(k => setup.himari.PHRASEBOOK[k]).filter(Boolean);
};

/* ---------- daily ---------- */

/** Sleep widget, once a night: Negan's attention fades, the antibiotics deadline runs out. */
setup.himari.nightly = function () {
    const h = setup.himari.npc();
    if (!h || !h.quests) return;
    h.attention = Math.max(0, (h.attention ?? 0) - setup.himari.ATTENTION_DECAY);
    const q = h.quests;
    const day = variables().game.day;
    if (q.heat_day && !q.heat_cured_day && day > q.heat_day + setup.himari.HEAT_DAYS) {
        // Negan's doctor used Negan's own stock; he bills the handler (paid in The Air Hole)
        q.heat_cured_day = day;
        q.heat_late_day = day;
        h.trust = Math.max(0, (h.trust ?? 0) - 5);
        h.relationship = h.trust;
    }
};

/* ---------- cheats ---------- */

/**
 * Cheat menu: set the state as if every step before `id` had happened (one day apart, ending a few days ago) and
 * return the passage to open.
 */
/**
 * Visit actions (div.hm-act): an action's revealed text gets the .hm-gap top margin while the action box right above
 * it still shows its button, so the text never sits flush under that button. Re-checked after every click, because
 * the actions can be done in any order.
 */
setup.himari.fixActGaps = function () {
    jQuery('#passages div.hm-act').each(function () {
        const $d = jQuery(this), $prev = $d.prevAll('div.hm-act').first();
        $d.toggleClass('hm-gap', $prev.length > 0 && $prev.children('a').length > 0 && $d.children('a').length === 0);
    });
};
jQuery(document).on('click', () => setTimeout(setup.himari.fixActGaps, 0));

setup.himari.cheatJump = function (id) {
    const V = variables();
    V.characters.negan ??= {};
    V.characters.negan.quests ??= {};
    V.characters.negan.quests.barter_day ??= V.game.day - 30;
    const h = setup.himari.ensure();
    const idx = setup.himari.STEPS.findIndex(s => s.id === id);
    if (idx < 0) return null;
    setup.himari.STEPS.forEach((s, i) => {
        if (i < idx) h.quests[s.id + '_day'] = V.game.day - 3 - (idx - i);
        else delete h.quests[s.id + '_day'];
    });
    if (idx > setup.himari.STEPS.findIndex(s => s.id === 'heat')) {
        h.quests.heat_cured_day ??= V.game.day - 3;
    } else {
        delete h.quests.heat_cured_day;
        delete h.quests.heat_late_day;
        delete h.quests.heat_late_paid;
    }
    if (idx > setup.himari.STEPS.findIndex(s => s.id === 'water')) setup.himari.learn('namae');
    return setup.himari.STEPS[idx].passage;
};
