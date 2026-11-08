/**
 * NPC list helpers. Kept free of SugarCube globals (no variables(), State, random() or $lists inside):
 * callers pass the lists in.
 */
setup.npcs = setup.npcs ?? {};

/**
 * Up to n distinct random items from list, optionally only those passing filter. Never mutates list, never loops
 * forever (asking for more than there are just returns them all), and returns the items themselves, not indices.
 * rng: a function returning [0, 1); defaults to Math.random.
 *
 *   setup.npcs.pick($guests, 2, g => setup.getAge(g) >= 18)
 */
setup.npcs.pick = function (list, n = 1, filter = null, rng = Math.random) {
    if (!Array.isArray(list)) {
        return [];
    }
    const pool = filter ? list.filter(filter) : list.slice();
    const count = Math.min(Math.max(0, Math.floor(n) || 0), pool.length);

    // Partial Fisher–Yates: only shuffle the positions we take
    for (let i = 0; i < count; i++) {
        const j = Math.min(pool.length - 1, i + Math.floor(rng() * (pool.length - i)));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
};

/** A shuffled copy of list (the list itself is left alone). */
setup.npcs.shuffled = function (list, rng = Math.random) {
    return setup.npcs.pick(list, Array.isArray(list) ? list.length : 0, null, rng);
};

/**
 * Splits an old companion key, which pointed at a position ('guest:3', 'slave:0'), into { type, index }.
 * Returns null for anything else, including NPC ids.
 */
setup.npcs.parseLegacyCompanionKey = function (key) {
    const match = /^(guest|slave):(\d+)$/.exec(String(key));
    return match ? { type: match[1], index: Number(match[2]) } : null;
};

/**
 * The companion ids in companions, without duplicates or empty entries. $player.companions is a Set of NPC ids;
 * an array of ids works the same. The old format, an object of position keys ({ 'guest:3': true }), is converted
 * through lists ({ guest: $guests, slave: $slaves }); a key that points at nobody (or at an NPC without an id) is
 * dropped. Object keys that aren't position keys are taken as ids. Anything else gives [].
 */
setup.npcs.companionIds = function (companions, lists = {}) {
    let entries;
    if (companions instanceof Set || Array.isArray(companions)) {
        entries = Array.from(companions);
    } else if (companions && typeof companions === 'object') {
        entries = Object.keys(companions).filter(key => companions[key]).map(function (key) {
            const legacy = setup.npcs.parseLegacyCompanionKey(key);
            if (!legacy) {
                return key;
            }
            const list = lists[legacy.type];
            return Array.isArray(list) ? list[legacy.index]?.id : undefined;
        });
    } else {
        return [];
    }
    return Array.from(new Set(entries.filter(id => typeof id === 'string' && id !== '')));
};

/**
 * How many companions are with the MC (a Set or array of ids; old position-key objects count their keys).
 * Anything else counts as 0.
 */
setup.npcs.companionCount = function (companions) {
    if (companions instanceof Set) {
        return setup.npcs.companionIds(companions).length;
    }
    if (Array.isArray(companions)) {
        return companions.filter(Boolean).length;
    }
    if (companions && typeof companions === 'object') {
        return Object.keys(companions).filter(key => companions[key]).length;
    }
    return 0;
};

/**
 * Percent chance that the MC's companions talk someone into joining: the triangular number of the companion count
 * (1 → 1%, 2 → 3%, 3 → 6%, 4 → 10%, …), capped at 100.
 *
 *   setup.percentageChance(setup.npcs.companionInviteBonus($player.companions))
 */
setup.npcs.companionInviteBonus = function (companions) {
    const count = setup.npcs.companionCount(companions);
    return Math.min(100, count * (count + 1) / 2);
};

/**
 * Tuning for setup.npcs.inviteChance: reputation / reputationDivisor percent, at most reputationCap.
 * gaveFoodBonus: extra percent when the MC gave a stranger food (Abandoned mall).
 */
setup.npcs.INVITE = { reputationDivisor: 4, reputationCap: 100, gaveFoodBonus: 20 };

/**
 * The separate percent chances (0–100) that make up setup.npcs.inviteChance:
 *   { relationship, reputation, companions, bonus }
 * bonus is any extra reason to say yes, such as setup.npcs.INVITE.gaveFoodBonus.
 */
setup.npcs.inviteParts = function ({ relationship = 0, reputation = 0, companions = null, bonus = 0 } = {}) {
    const clamp = value => Math.min(100, Math.max(0, Number(value) || 0));
    const { reputationDivisor, reputationCap } = setup.npcs.INVITE;
    return {
        relationship: clamp(relationship),
        reputation: Math.min(reputationCap, clamp((Number(reputation) || 0) / reputationDivisor)),
        companions: clamp(setup.npcs.companionInviteBonus(companions)),
        bonus: clamp(bonus)
    };
};

/**
 * Rolls, when the MC meets a stranger, the reputation and companion parts of the invite chance:
 *   { heardOfYou, companionVouched }
 * heardOfYou: she has heard of the MC (reputation part); companionVouched: a companion spoke up for the MC.
 * Pass the result to setup.npcs.inviteChance as meeting, so the same dice are not rolled twice. rng returns 0 ≤ x < 1.
 */
setup.npcs.rollStrangerMeeting = function ({ reputation = 0, companions = null, rng = Math.random } = {}) {
    const parts = setup.npcs.inviteParts({ reputation, companions });
    return {
        heardOfYou: rng() * 100 < parts.reputation,
        companionVouched: rng() * 100 < parts.companions
    };
};

/**
 * Percent chance (0–100, whole numbers) that someone accepts the MC's invite to move in. Independent reasons to say
 * yes, combined like separate dice (at least one succeeds):
 *   - relationship: relationship %, so someone who already likes you comes along;
 *   - reputation:   reputation / 4 % (100 reputation → 25%);
 *   - companions:   setup.npcs.companionInviteBonus(companions);
 *   - bonus:        any extra reason, e.g. setup.npcs.INVITE.gaveFoodBonus.
 * Nobody accepts when refused is true (e.g. after being raped) or when the relationship is negative. A stranger
 * starts at relationship 0 and can still say yes because of reputation or companions.
 *
 * meeting: the result of setup.npcs.rollStrangerMeeting for this NPC, when the reputation and companion dice were
 * already rolled at the meeting. If either succeeded she says yes; if not, only relationship and bonus are left.
 * Overall, the odds are the same as without meeting.
 *
 *   setup.npcs.inviteChance({ relationship: 3, reputation: 100, companions: $player.companions })  // → 27 (no companions)
 */
setup.npcs.inviteChance = function ({ relationship = 0, reputation = 0, companions = null, refused = false, bonus = 0, meeting = null } = {}) {
    const rel = Number(relationship) || 0;
    if (refused || rel < 0) {
        return 0;
    }
    const parts = setup.npcs.inviteParts({ relationship: rel, reputation, companions, bonus });
    let chances = [parts.relationship, parts.reputation, parts.companions, parts.bonus];
    if (meeting) {
        if (meeting.heardOfYou || meeting.companionVouched) {
            return 100;
        }
        chances = [parts.relationship, parts.bonus];
    }
    const allSayNo = chances.reduce((no, chance) => no * (1 - chance / 100), 1);
    return Math.round((1 - allSayNo) * 100);
};

/* Older helpers, kept because runtime-loaded scripts (js/actions.js, packs/) may still call them. New code should
   use setup.npcs.pick. They used to live in js/scripts.js; the versions there could loop forever, shuffled the
   caller's list in place, and returned indices into a list that had shrunk while picking. */

/** Up to limit random items of persons (shuffled, like before; persons itself is no longer shuffled in place). */
setup.getRandomPersons = function (persons, limit = 2) {
    return setup.npcs.pick(persons, limit);
};

/** Up to limit distinct random positions in persons. */
setup.getRandomPersonIds = function (persons, limit = 2) {
    return setup.npcs.pick(Array.isArray(persons) ? persons.map((_, i) => i) : [], limit);
};

/** Up to limit distinct random positions in persons of adult women. */
setup.getRandomPersonIdsGirls = function (persons, limit = 2) {
    const isAdultWoman = i => persons[i] && !persons[i].gender && setup.getAge(persons[i]) >= 18;
    return setup.npcs.pick(Array.isArray(persons) ? persons.map((_, i) => i) : [], limit, isAdultWoman);
};
