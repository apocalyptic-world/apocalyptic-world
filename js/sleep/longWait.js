/**
 * The Long Wait (0.92): a captured guest ($game.capturedGuest: lost Targeted abduction, scavenging or people hunter)
 * has been held for a week. One morning she either escapes home on her own, or the captors send new terms:
 * a lower ransom and a short deadline before they sell her on to the Sanctuary (Event - The long wait, from Wood cabin).
 *
 *   $game.capturedGuest.day        day she was taken (stamped here the first night if the capture did not set it)
 *   $game.capturedGuest.source     'abduction' | undefined
 *   $game.capturedGuest.longWait   { cost, deadline } after the new terms; the World map ransom uses this cost
 *   $game.longWaitEvent            { variant: 'escaped' | 'terms' } while the event waits for the morning
 */
setup.longWait = {
    MIN_DAYS: 7,
    CHANCE: 30,            // % per night once she has been held MIN_DAYS
    ESCAPE_CHANCE: 35,     // % that she comes back on her own
    NEW_COST: 250,         // the old ransom is 500 caps
    DEADLINE_DAYS: 3
};

setup.longWait.ransom = function () {
    return variables().game.capturedGuest?.longWait?.cost ?? 500;
};

/** Called once per night from the sleep widget. */
setup.longWait.nightly = function (day) {
    const v = variables();
    const cg = v.game.capturedGuest;
    if (!cg) { delete v.game.longWaitEvent; return; }
    cg.day ??= day;
    if (cg.longWait) {
        if (day > cg.longWait.deadline) setup.longWait.soldOn();
        return;
    }
    if (v.game.longWaitEvent || !v.game.cabinName) return;
    if (day < cg.day + setup.longWait.MIN_DAYS || !setup.percentageChance(setup.longWait.CHANCE)) return;
    v.game.longWaitEvent = { variant: setup.percentageChance(setup.longWait.ESCAPE_CHANCE) ? 'escaped' : 'terms' };
};

/** Clear the captor settlement's captive marker. */
setup.longWait.clearCaptor = function (cg) {
    const s = cg.settlementId ? setup.settlements.getById(cg.settlementId) : null;
    if (s) {
        s.captiveId = null;
        s.captiveName = null;
        setup.settlements.save(setup.settlements.getAll());
    }
};

/** She comes home (escaped on her own, or the new ransom was paid). Returns her. */
setup.longWait.bringHome = function (how) {
    const v = variables();
    const cg = v.game.capturedGuest;
    if (!cg) return null;
    setup.longWait.clearCaptor(cg);
    const npc = cg.npc;
    v.guests.push(npc);
    setup.npc.addHistory(npc, how === 'escaped' ? 'escaped_home' : 'rescued', { place: cg.settlementName });
    setup.relationshipBetween.reactToCaptureResolved(npc, true);
    delete v.game.capturedGuest;
    delete v.game.longWaitEvent;
    return npc;
};

/** The new terms were heard: lower price, short deadline. */
setup.longWait.setTerms = function () {
    const v = variables();
    const cg = v.game.capturedGuest;
    if (!cg) return;
    cg.longWait = { cost: setup.longWait.NEW_COST, deadline: v.game.day + setup.longWait.DEADLINE_DAYS };
    delete v.game.longWaitEvent;
};

/** Deadline passed: they sold her on. */
setup.longWait.soldOn = function () {
    const v = variables();
    const cg = v.game.capturedGuest;
    if (!cg) return;
    setup.longWait.clearCaptor(cg);
    setup.relationshipBetween.reactToCaptureResolved(cg.npc, false);
    setup.sleepMessages.addMain('<span class="warning">A rider from ' + (cg.settlementName || 'the camp') + ' stopped at your gate long enough to shout that the deadline had passed. '
        + cg.npc.name + ' had been sold on to the ship. You would not see ' + setup.pronounceWho(cg.npc) + ' again.</span>');
    delete v.game.capturedGuest;
    delete v.game.longWaitEvent;
};
