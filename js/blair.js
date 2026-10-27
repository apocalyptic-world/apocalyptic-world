/**
 * Blair: one place that reads her state, so the Blair events (bounty, small hours, house rules, her mother)
 * ask the same questions the same way.
 *
 * Where her data lives (all on $characters.blair):
 *   quests.married / family.husband === 'mc' / married     married to the player
 *   pregnancy                                             counter, defined only while pregnant
 *                                                         (breeders tick x2 a night, birth after 260+)
 *   kids                                                  NOT stored on her: children are NPCs in $nursery,
 *                                                         $guests or $slaves with family.mother === 'blair'
 *                                                         and a history entry { event: 'born', day }
 *   quests.missing_friend_*                               Ashley's quest; missing_friend_basement = she is alive and visits
 *   livingLocation                                        'bedroom' (default) or 'guesthouse'
 * Events this file supports store their own state as quests.<name>_day:
 *   bounty_day (+ bounty_reply), small_hours_newborn_day / small_hours_kick_day / small_hours_try_day,
 *   house_rules_day, mother_talk_day (+ mother_talk_reply)
 */
setup.blair = setup.blair || {};

setup.blair.npc = function () {
    return variables().characters?.blair ?? null;
};

setup.blair.isMet = function () {
    return !!setup.blair.npc() && isMetChar('blair');
};

/** Is she living with the player (not just a name on the farm)? */
setup.blair.livesHere = function () {
    const q = setup.blair.npc()?.quests;
    return !!q && (q.cabinType ?? 0) > 0;
};

setup.blair.married = function () {
    return setup.blair.npc()?.family?.husband === 'mc';
};

setup.blair.pregnant = function () {
    return typeof setup.blair.npc()?.pregnancy !== 'undefined';
};

/** Her children, wherever they ended up. */
setup.blair.kids = function () {
    const v = variables();
    return (v.nursery ?? []).concat(v.guests ?? [], v.slaves ?? []).filter(function (n) {
        return n.family?.mother === 'blair';
    });
};

/** Day a child was born, or null when the history has no birth entry. */
setup.blair.birthDay = function (kid) {
    const entry = (kid.history ?? []).find(function (h) { return h.event === 'born'; });
    return entry ? entry.day : null;
};

setup.blair.daysSinceBirth = function (kid) {
    const day = setup.blair.birthDay(kid);
    return day === null ? null : variables().game.day - day;
};

/** The youngest of the player's children with Blair (smallest days since birth), or null. Other fathers do not count. */
setup.blair.youngestKid = function () {
    let best = null, bestDays = Infinity;
    for (const kid of setup.blair.kids()) {
        if (kid.family?.father !== 'mc') continue;
        const d = setup.blair.daysSinceBirth(kid);
        if (d !== null && d < bestDays) { best = kid; bestDays = d; }
    }
    return best;
};

/** Ashley is alive and still comes to visit. */
setup.blair.ashleyVisits = function () {
    return !!setup.blair.npc()?.quests?.missing_friend_basement;
};

/**
 * Mr. Soprano is Dom's old title: while Dom lives the poster is live, once he is dead it dies with him.
 * Also dead once the player has taken over the underground city (nobody is left to pay the bounty).
 */
setup.blair.bountyAlive = function () {
    const v = variables();
    return !v.characters?.dom?.dead && !v.player?.quests?.underground_boss && !v.characters?.isabel?.quests?.new_boss;
};

/**
 * Can the "Price on her head" event fire right now? (The caller still rolls the dice.)
 * Needs her at the cabin outside the hours she is at the farm, the gate built, and nobody has come for her yet.
 */
setup.blair.bountyReady = function () {
    const v = variables();
    const q = setup.blair.npc()?.quests;
    if (!q || !setup.blair.livesHere() || !v.game.cabinName || !q.gate || v.game.day < 120) return false;
    if (typeof q.bounty_day !== 'undefined' || !setup.blair.bountyAlive()) return false;
    return timeBetween('09:00', '12:00') || timeBetween('14:00', '20:00');
};

/**
 * Which "small hours" bedroom scene fits her right now, or null:
 *   'newborn'  a child between 3 and 40 days old
 *   'kick'     pregnant, far enough along to feel the baby
 *   'try'      no child and not pregnant, married or very close
 * Each is offered once (quests.small_hours_<name>_day), and at most one every 5 days.
 */
setup.blair.smallHoursVariant = function () {
    const v = variables();
    const npc = setup.blair.npc();
    const q = npc?.quests;
    if (!q || !setup.blair.livesHere() || (q.small_hours_day ?? -99) + 5 > v.game.day) return null;

    const baby = setup.blair.youngestKid();
    const babyDays = baby ? setup.blair.daysSinceBirth(baby) : null;
    if (baby && babyDays !== null && babyDays >= 3 && babyDays <= 40 && typeof q.small_hours_newborn_day === 'undefined') {
        return 'newborn';
    }
    if (setup.blair.pregnant() && npc.pregnancy_father === 'mc' && npc.pregnancy >= 120 && npc.pregnancy < 250 && typeof q.small_hours_kick_day === 'undefined') {
        return 'kick';
    }
    if (!setup.blair.pregnant() && !baby && (setup.blair.married() || (npc.relationship ?? 0) >= 90) && typeof q.small_hours_try_day === 'undefined') {
        return 'try';
    }
    return null;
};

/** Index in $guests of the guest Blair is most likely to clash with (adult, non-feral woman who is close to the player), or -1. */
setup.blair.houseRulesFavorite = function () {
    const guests = variables().guests ?? [];
    let best = -1, bestRel = 59;
    guests.forEach(function (g, i) {
        if (g.gender !== 0 || setup.getAge(g) < 18 || (g.traits ?? []).includes('feral')) return;
        if (!setup.fitsSceneLook(g, 'house_rules_guest')) return;   // the scene image shows an asian guest with black hair
        if ((g.relationship ?? 0) > bestRel) { best = i; bestRel = g.relationship; }
    });
    return best;
};

/** True when this guest has been intimate with the player (any recorded sex act). Blair only resents what she can plausibly see. */
setup.blair.guestIntimate = function (npc) {
    return Object.values(npc?.statsSex ?? {}).some(function (n) { return typeof n === 'number' && n > 0; });
};

/** House rules: she has policy talk done, likes you, and there is somebody to clash with. */
setup.blair.houseRulesReady = function () {
    const v = variables();
    const npc = setup.blair.npc();
    const q = npc?.quests;
    if (!q || !setup.blair.livesHere() || !v.player.quests?.policy_talk) return false;
    if ((npc.relationship ?? 0) < 70 || (q.house_rules_day ?? -99) + 40 > v.game.day) return false;
    return setup.blair.houseRulesFavorite() >= 0 && timeBetween('17:00', '21:00');
};

/** Her mother's story is only told once the Sanctuary trip is behind you and she trusts you. */
setup.blair.motherTalkReady = function () {
    const v = variables();
    const npc = setup.blair.npc();
    const q = npc?.quests;
    if (!q || !setup.blair.livesHere() || typeof q.mother_talk_day !== 'undefined') return false;
    const sanctuaryDone = v.characters?.vincent?.quests?.sanctuary_done;
    return !!sanctuaryDone && (npc.relationship ?? 0) >= 90 && v.game.day >= 10 + (v.characters.vincent.quests.sanctuary_done_day ?? v.game.day - 10);
};
