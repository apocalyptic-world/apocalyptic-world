/**
 * First Words: a feral NPC that has lived with the player long enough, and been played with often
 * enough ('NPC feral play'), starts to find language again. When it happens Wood cabin opens
 * 'Event - First words' where the player decides whether to help her speak (the feral trait goes away)
 * or leave her as she is.
 *
 *   npc.quests.feralPlayDays   number of different days the player played with her
 *   npc.quests.firstWordsDay   set once the event is done, either way (never offered again)
 *   $game.firstWords = { id }  makes Wood cabin open the event
 *
 * A guest with the teacher skill in the settlement halves the time and the play days needed
 * (the "school for ferals" suggestion).
 */
setup.firstWords = setup.firstWords || {};

setup.firstWords.MIN_PLAY_DAYS     = 8;
setup.firstWords.MIN_STAY_DAYS     = 60;
setup.firstWords.MIN_RELATIONSHIP  = 40;
setup.firstWords.COOLDOWN_DAYS     = 10;
setup.firstWords.NIGHTLY_CHANCE    = 5;

setup.firstWords.hasTeacher = function () {
    return (variables().guests ?? []).some(function (g) {
        return (g.skills ?? []).includes('teacher') && setup.getAge(g) >= 18;
    });
};

/** Day this NPC joined the settlement: the first history entry, or the first day we noticed her. */
setup.firstWords.arrivalDay = function (npc, day) {
    const days = (npc.history ?? []).map(function (h) { return h.day; }).filter(function (d) { return typeof d === 'number'; });
    if (days.length) {
        return Math.min.apply(null, days);
    }
    npc.quests = npc.quests ?? {};
    npc.quests.feralSince = npc.quests.feralSince ?? day;
    return npc.quests.feralSince;
};

setup.firstWords.candidates = function (day) {
    const v = variables();
    const teacher = setup.firstWords.hasTeacher();
    const needPlay = teacher ? Math.ceil(setup.firstWords.MIN_PLAY_DAYS / 2) : setup.firstWords.MIN_PLAY_DAYS;
    const needStay = teacher ? Math.ceil(setup.firstWords.MIN_STAY_DAYS / 2) : setup.firstWords.MIN_STAY_DAYS;
    return (v.guests ?? []).concat(v.slaves ?? []).filter(function (npc) {
        if (!(npc.traits ?? []).includes('feral') || setup.getAge(npc) < 18 || typeof npc.sick !== 'undefined') {
            return false;
        }
        if (typeof npc.quests?.firstWordsDay !== 'undefined') {
            return false;
        }
        return (npc.relationship ?? 0) >= setup.firstWords.MIN_RELATIONSHIP
            && (npc.quests?.feralPlayDays ?? 0) >= needPlay
            && day - setup.firstWords.arrivalDay(npc, day) >= needStay;
    });
};

/** Nightly roll, called from the sleep widget after the NPC loops. */
setup.firstWords.nightly = function (day) {
    const v = variables();
    if (v.game.firstWords || !v.game.cabinName || (v.game.firstWordsDay ?? 0) + setup.firstWords.COOLDOWN_DAYS > day) {
        return;
    }
    if (!setup.percentageChance(setup.firstWords.NIGHTLY_CHANCE)) {
        return;
    }
    const candidates = setup.firstWords.candidates(day);
    if (!candidates.length) {
        return;
    }
    const pick = candidates[window.randomInteger(0, candidates.length - 1)];
    v.game.firstWords = { id: pick.id };
    setup.sleepMessages.addMain('<span class="warning">' + pick.name + ' did something strange in the night. ' + setup.pronounceWhat(pick, true) + ' made a sound that was almost a word.</span>');
};

/** The feral trait goes away and the usual limits on ferals go with it. */
setup.firstWords.helpToSpeak = function (npc) {
    npc.traits = (npc.traits ?? []).filter(function (t) { return t !== 'feral'; });
    npc.quests = npc.quests ?? {};
    npc.quests.firstWordsDay = variables().game.day;
    npc.relationship = Math.min((npc.relationship ?? 0) + 10, 100);
    npc.happy = Math.min((npc.happy ?? 0) + 15, 100);
    setup.npc.addHistory(npc, 'found_words');
};

setup.firstWords.leaveAsIs = function (npc) {
    npc.quests = npc.quests ?? {};
    npc.quests.firstWordsDay = variables().game.day;
};
